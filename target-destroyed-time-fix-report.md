# 目标摧毁时间记录修复报告

## 问题描述

在无人机操作页面（[UavOperationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/UavOperationPage.vue)）和作战测评页面（[EvaluationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/EvaluationPage.vue)）中，对同一个目标的摧毁时间记录不一致。

### 问题根源

两个页面在记录目标摧毁时间时，没有正确使用**当前报文的 `updateTime` 字段**（来自 [PlatformStatus.proto](file:///Users/xinnix/code/afs/opEnd/src/protobuf/PlatformStatus.proto#L92-L102) 的 `optional double updateTime = 2`），而是使用了页面内存中维护的 `exerciseTime`。

#### 错误的时间来源

```typescript
// ❌ 错误：使用页面内存中的演习时间（可能已被后续报文更新）
target.destroyedTime = environmentParams.exerciseTime;
group.keyMetrics.targetDestroyedTime = exerciseTime.value;
```

#### 正确的时间来源

```typescript
// ✓ 正确：使用当前报文的updateTime字段
const currentUpdateTime = parsedData.platform[0]?.updateTime;
const destroyedTime =
  currentUpdateTime !== undefined
    ? `T + ${Math.round(currentUpdateTime)}秒`
    : exerciseTime.value;
```

### 问题示例

```
时间轴：
T=100秒: 收到报文（updateTime=100），目标存在
         exerciseTime 更新为 "T + 100秒"

T=120秒: 收到报文（updateTime=120），目标不存在 ← 第一次检测到目标消失
         exerciseTime 更新为 "T + 120秒"
         ✓ 应该记录摧毁时间 = "T + 120秒"

T=140秒: 收到报文（updateTime=140），目标继续不存在
         exerciseTime 更新为 "T + 140秒"
         ❌ 如果使用 exerciseTime，会错误记录为 "T + 140秒"
```

## 修复方案

### 核心修复逻辑

**在第一次接收到没有该目标状态的报文时，记录该报文的 `updateTime` 作为摧毁时间。**

关键点：

1. 使用报文中的 `updateTime` 字段，而不是页面内存中的时间
2. 只在第一次检测到目标不存在时记录（通过 `!target.destroyed` 或 `previousStatus !== "destroyed"` 判断）
3. 后续报文不应更新已记录的摧毁时间

### 修复内容

#### 1. 无人机操作页面（UavOperationPage.vue）

**位置**：[src/renderer/views/pages/UavOperationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/UavOperationPage.vue)

**修改 1：更新函数签名，接收当前报文的 updateTime**

```typescript
// 修改前
const updateDetectedTargets = (platforms: any[]) => { ... }

// 修改后
const updateDetectedTargets = (platforms: any[], currentUpdateTime?: number) => { ... }
```

**修改 2：使用报文的 updateTime 记录摧毁时间**

```typescript
// 检查目标是否被摧毁（不在任何平台中存在）
if (!targetPlatform && !target.destroyed) {
  target.destroyed = true;
  target.status = "destroyed";

  // ✓ 使用当前报文的updateTime（第一次检测到目标不存在的报文时间）
  const destroyedTime =
    currentUpdateTime !== undefined
      ? `T + ${Math.round(currentUpdateTime)}秒`
      : environmentParams.exerciseTime;
  target.destroyedTime = destroyedTime;

  console.log(
    `[UavPage] 目标被摧毁: ${target.name}, 摧毁时间: ${target.destroyedTime} (报文updateTime: ${currentUpdateTime})`
  );
  addLog("warning", `目标 ${target.name} 已被摧毁 (${target.destroyedTime})`);
}
```

**修改 3：在调用时传入当前报文的 updateTime**

```typescript
// 在 handlePlatformStatus 函数中
const currentUpdateTime = parsedData.platform[0]?.updateTime;

// 传入当前报文的updateTime
updateDetectedTargets(parsedData.platform, currentUpdateTime);
```

#### 2. 作战测评页面（EvaluationPage.vue）

**位置**：[src/renderer/views/pages/EvaluationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/EvaluationPage.vue)

**修改 1：更新函数签名**

```typescript
// 修改前
const updateAllGroupsData = () => { ... }
const updateTargetDestructionMetrics = (
  group: GroupData,
  currentTarget: GroupMember
) => { ... }

// 修改后
const updateAllGroupsData = (currentUpdateTime?: number) => { ... }
const updateTargetDestructionMetrics = (
  group: GroupData,
  currentTarget: GroupMember,
  currentUpdateTime?: number
) => { ... }
```

**修改 2：使用报文的 updateTime 记录摧毁时间**

```typescript
// 检测目标状态从非摧毁变为摧毁
if (previousStatus !== "destroyed" && currentStatus === "destroyed") {
  // ✓ 使用当前报文的updateTime（第一次检测到目标不存在的报文时间）
  const destroyedTime =
    currentUpdateTime !== undefined
      ? `T + ${Math.round(currentUpdateTime)}秒`
      : exerciseTime.value;
  group.keyMetrics.targetDestroyedTime = destroyedTime;

  console.log(
    `[EvaluationPage] 检测到目标 ${currentTarget.name} 被摧毁时间: ${destroyedTime} (报文updateTime: ${currentUpdateTime})`
  );

  // ... 其他逻辑
}
```

**修改 3：在调用链中传递 updateTime**

```typescript
// 在 handlePlatformUpdate 函数中
let currentUpdateTime: number | undefined;
if (
  parsedData.platform.length > 0 &&
  parsedData.platform[0]?.updateTime !== undefined
) {
  currentUpdateTime = parsedData.platform[0].updateTime;
  exerciseTime.value = formatExerciseTime(currentUpdateTime);
}

// 传入当前报文的updateTime
updateAllGroupsData(currentUpdateTime);

// 在 updateAllGroupsData 函数中
allGroups.value.forEach((group) => {
  if (group.currentTarget) {
    updateTargetDestructionMetrics(
      group,
      group.currentTarget,
      currentUpdateTime
    );
  }
});
```

**修改 4：修复变量名错误**

在计算照射期间摧毁时，修复变量名：

```typescript
// 修改前（错误）
const destructionTime = parseExerciseTime(currentTime);

// 修改后（正确）
const destructionTime = parseExerciseTime(destroyedTime);
```

## 修复效果对比

### 修复前

```
场景：
T=100秒: 收到报文，目标存在
T=120秒: 收到报文，目标不存在（第一次）
T=140秒: 收到报文，目标继续不存在

问题：
- 可能记录摧毁时间为 "T + 140秒"（使用了后续报文更新的 exerciseTime）
- 无人机页面和测评页面记录的时间可能不一致
- 不能准确反映目标真实的摧毁时刻
```

### 修复后

```
场景：
T=100秒: 收到报文（updateTime=100），目标存在
T=120秒: 收到报文（updateTime=120），目标不存在
         ✓ 记录摧毁时间 = "T + 120秒"（使用报文的updateTime）
         ✓ !target.destroyed 条件确保只记录一次
T=140秒: 收到报文（updateTime=140），目标继续不存在
         ✓ target.destroyed 已为true，不再更新摧毁时间
         ✓ 摧毁时间保持 "T + 120秒"

结果：
- 两个页面都准确记录摧毁时间为 "T + 120秒"
- 两个页面记录的时间完全一致
- 准确反映目标真实的摧毁时刻（第一次检测到目标不存在的报文时间）
```

## 测试验证

### 测试脚本

已创建测试脚本：[testScipt/test-target-destroyed-time-fix.js](file:///Users/xinnix/code/afs/opEnd/testScipt/test-target-destroyed-time-fix.js)

### 测试步骤

1. **运行测试脚本**：

   ```bash
   node testScipt/test-target-destroyed-time-fix.js
   ```

2. **测试流程**：

   - T=100 秒：发送初始状态（包含无人机和蓝方目标）
   - T=120 秒：发送目标摧毁报文（蓝方目标消失）⭐ 关键时刻
   - T=130 秒：发送后续报文 1（目标继续不存在）
   - T=140 秒：发送后续报文 2（目标继续不存在）

3. **验证方法**：

   **无人机操作页面**：

   - 选择分组："第一组"
   - 选择无人机："红方无人机-001"
   - 连接平台
   - 查看"探测到的目标"列表，找到"蓝方目标-001"
   - 确认摧毁时间显示为："T + 120 秒"

   **作战测评页面**：

   - 查看"第一组"的关键数据统计
   - 找到"目标摧毁"时间
   - 确认显示为："T + 120 秒"

   **对比验证**：

   - 两个页面的摧毁时间应该完全一致
   - 都应该是"T + 120 秒"
   - 不应该被后续报文的时间（130 秒、140 秒）覆盖

### 调试提示

查看浏览器控制台日志：

**无人机页面**：

```
[UavPage] 目标被摧毁: 蓝方目标-001, 摧毁时间: T + 120秒 (报文updateTime: 120)
```

**测评页面**：

```
[EvaluationPage] 检测到目标 蓝方目标-001 被摧毁时间: T + 120秒 (报文updateTime: 120)
```

关键点：

- 日志中应该明确显示 `(报文updateTime: 120)`
- 只应该出现一次"目标被摧毁"的日志（在 T=120 秒时）
- 后续报文（T=130 秒、T=140 秒）不应该再次触发摧毁检测

## 技术细节

### Protobuf 协议中的 updateTime 字段

来源：[PlatformStatus.proto](file:///Users/xinnix/code/afs/opEnd/src/protobuf/PlatformStatus.proto#L92-L102)

```protobuf
message Platform
{
    optional PlatformBase base = 1;
    optional double updateTime = 2;  // fix typo - 平台更新时间（演习时间，单位：秒）
    optional Mover mover = 3;
    repeated Comm comms = 4;
    repeated Sensor sensors = 5;
    repeated Weapon weapons = 6;
    repeated Track tracks = 7;
    optional TargetLoad targetLoad = 8;
}
```

这个字段表示：

- 当前报文对应的演习时间（相对于演习开始的秒数）
- 由仿真系统生成，反映仿真时钟的真实时间
- 每个报文都有独立的 updateTime，随仿真时间推进

### 为什么不能使用页面内存中的 exerciseTime

```typescript
// 页面内存中的 exerciseTime 会被每个报文更新
if (parsedData.platform && parsedData.platform[0]?.updateTime !== undefined) {
  environmentParams.exerciseTime = `T + ${parsedData.platform[0].updateTime.toFixed(
    0
  )}秒`;
}
```

问题：

1. exerciseTime 随每个报文更新，总是最新报文的时间
2. 当检测到目标摧毁时，exerciseTime 可能已经被后续报文更新了
3. 导致记录的摧毁时间不是真正检测到目标消失的时刻

解决方案：

- 直接从当前处理的报文中获取 updateTime
- 在检测到目标摧毁的那一刻，立即使用该报文的 updateTime
- 通过条件判断确保只记录一次（第一次检测到时）

## 相关文件

### 修改的文件

- [src/renderer/views/pages/UavOperationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/UavOperationPage.vue)
  - `updateDetectedTargets` 函数
  - `handlePlatformStatus` 函数
- [src/renderer/views/pages/EvaluationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/EvaluationPage.vue)
  - `updateAllGroupsData` 函数
  - `updateTargetDestructionMetrics` 函数
  - `handlePlatformUpdate` 函数

### 测试文件

- [testScipt/test-target-destroyed-time-fix.js](file:///Users/xinnix/code/afs/opEnd/testScipt/test-target-destroyed-time-fix.js)

### 相关协议

- [src/protobuf/PlatformStatus.proto](file:///Users/xinnix/code/afs/opEnd/src/protobuf/PlatformStatus.proto)

## 总结

通过这次修复：

1. **准确性**：摧毁时间现在精确反映目标真实的摧毁时刻（第一次检测到目标不存在的报文时间）
2. **一致性**：无人机页面和测评页面记录的摧毁时间完全一致
3. **可靠性**：使用报文中的原始时间戳，不受页面状态更新的影响
4. **正确性**：符合需求规范"在第一次接收到没有该目标状态的报文时，记录该报文的 updateTime 作为摧毁时间"

核心改进：

- 从页面内存时间 → 报文原始时间
- 从可能被覆盖 → 只记录一次
- 从两页面不一致 → 完全一致
