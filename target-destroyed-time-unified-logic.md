# 目标摧毁时间统一逻辑修复报告

## 修复目标

确保**无人机页面**和**测评页面**使用相同的目标摧毁判定逻辑，记录一致的摧毁时间。

## 统一的判定逻辑

**核心原则**：只检查目标是否在平台数据中存在，**不检查 tracks 数据**。

### 判定规则

```typescript
// 检查目标平台是否存在
const targetPlatformExists = platforms.value.some(
  (platform: any) => platform.base?.name === targetName
);

if (!targetPlatformExists && !target.destroyed) {
  // ✓ 目标平台不存在 = 目标被摧毁
  target.destroyed = true;
  target.destroyedTime = currentUpdateTime; // 记录当前报文的updateTime
}
```

### 为什么不检查 tracks 数据？

1. **tracks 数据是传感器视角**：表示传感器是否"看到"目标，可能因为距离、遮挡、干扰等原因失去跟踪
2. **platform 数据是客观存在**：表示目标在仿真世界中是否真实存在
3. **摧毁的定义**：目标物理上被消灭，即 platform 数据消失，而不是传感器失去跟踪

### 场景说明

```
正常场景：
T=100秒: 目标存在
  ├─ platform中有目标 ✓
  └─ 两页面状态：active

T=120秒: 目标被摧毁（platform数据消失）
  ├─ platform中没有目标 ❌
  ├─ 无人机页面：destroyed，记录时间 T+120秒
  └─ 测评页面：destroyed，记录时间 T+120秒
  ✓ 两个页面时间一致！
```

## 修改内容

### 1. 测评页面（EvaluationPage.vue）

**简化逻辑**，只检查平台是否存在：

```typescript
const checkMissionTargetStatus = (targetName: string): string => {
  if (!targetName || !platforms.value) {
    return "inactive";
  }

  // 检查目标平台是否仍然存在
  const targetPlatformExists = platforms.value.some(
    (platform: any) => platform.base?.name === targetName
  );

  if (!targetPlatformExists) {
    // 目标平台不存在，判定为已摧毁
    return "destroyed";
  } else {
    // 目标平台存在，判定为正常（简化逻辑，不再区分active/inactive）
    return "active";
  }
};
```

**关键点**：

- ✅ 只检查 `!targetPlatformExists`（平台不存在）
- ✅ 不检查 tracks 数据
- ✅ 简洁明确的判定逻辑

### 2. 无人机页面（UavOperationPage.vue）

**修改前**（有问题）：

```typescript
// ❌ 问题：只在目标不活跃(不在tracks中)时才检查摧毁
if (!isCurrentlyActive) {
  if (!targetPlatform && !target.destroyed) {
    // 判定为摧毁
  }
}
```

这导致：

- 如果 tracks 中还有目标（延迟更新），即使 platform 已消失，也不会判定为摧毁
- 结果：无人机页面的摧毁判定会**延迟**

**修改后**（正确）：

```typescript
// ✓ 将摧毁检查移到外层，不依赖tracks状态
if (isCurrentlyActive) {
  // 更新活跃目标信息
} else {
  // 更新不活跃目标状态
}

// ✓ 无论tracks状态如何，都检查platform是否存在
if (!targetPlatform && !target.destroyed) {
  target.destroyed = true;
  target.destroyedTime = currentUpdateTime; // 使用报文的updateTime
}
```

**关键改进**：

- ✅ 摧毁检查**不依赖**tracks 状态（`isCurrentlyActive`）
- ✅ 只要 platform 不存在就判定为摧毁
- ✅ 与测评页面逻辑完全一致

## 修复前后对比

### 修复前

```
场景：platform数据先消失，tracks数据延迟更新

T=110秒: platform消失
  ├─ platform中没有目标 ❌
  ├─ tracks中还有目标 ✓（延迟）
  ├─ 无人机页面：inactive（tracks还有，未判定为摧毁）❌
  └─ 测评页面：destroyed（记录时间 T+110秒）✓

T=120秒: tracks也消失
  ├─ platform中没有目标 ❌
  ├─ tracks中没有目标 ❌
  ├─ 无人机页面：destroyed（记录时间 T+120秒）❌
  └─ 测评页面：已在T+110秒记录

结果：无人机页面 T+120秒，测评页面 T+110秒 ❌ 不一致！
```

### 修复后

```
场景：platform数据消失时立即判定

T=110秒: platform消失
  ├─ platform中没有目标 ❌
  ├─ 无人机页面：destroyed（记录时间 T+110秒）✓
  └─ 测评页面：destroyed（记录时间 T+110秒）✓

结果：两个页面都记录 T+110秒 ✓ 完全一致！
```

## 时间记录机制

两个页面都使用**报文的 updateTime 字段**作为摧毁时间：

```typescript
const destroyedTime =
  currentUpdateTime !== undefined
    ? `T + ${Math.round(currentUpdateTime)}秒`
    : environmentParams.exerciseTime; // 降级方案

target.destroyedTime = destroyedTime;
```

**保证**：

- ✅ 使用第一次检测到目标不存在的报文的 updateTime
- ✅ 通过 `!target.destroyed` 条件确保只记录一次
- ✅ 后续报文不会覆盖已记录的时间

## 技术细节

### platform vs tracks 的区别

| 数据源       | 含义           | 更新机制         | 用途                     |
| ------------ | -------------- | ---------------- | ------------------------ |
| **platform** | 目标物理存在性 | 仿真引擎直接控制 | 判断目标是否被摧毁       |
| **tracks**   | 传感器跟踪状态 | 传感器模型计算   | 判断传感器是否"看到"目标 |

### 为什么 platform 更可靠？

1. **物理真实性**：platform 数据反映目标在仿真世界中的真实存在
2. **更新及时性**：目标被摧毁时，仿真引擎会立即移除 platform 数据
3. **无歧义性**：存在就是存在，不存在就是不存在，没有中间状态
4. **符合规范**：按照项目规范，"目标摧毁"应该基于 platform 数据判定

### tracks 可能的延迟原因

1. **传感器扫描周期**：传感器可能不是每帧都更新
2. **数据缓存**：tracks 数据可能有缓存机制
3. **模型计算**：传感器模型需要时间计算跟踪状态
4. **网络延迟**：在分布式仿真中可能有网络传输延迟

## 验证方法

### 1. 使用测试脚本

```bash
node testScipt/test-target-destroyed-time-fix.js
```

测试场景：

- T=100 秒：目标存在
- T=120 秒：目标消失（platform 数据移除）
- 验证两个页面都记录 T+120 秒

### 2. 查看日志

**无人机页面**：

```
[UavPage] 目标被摧毁: 蓝方目标-001, 摧毁时间: T + 120秒 (报文updateTime: 120)
```

**测评页面**：

```
[EvaluationPage] 检测到目标 蓝方目标-001 被摧毁时间: T + 120秒 (报文updateTime: 120)
```

### 3. 界面验证

打开两个页面，查看目标摧毁时间显示：

- 无人机页面："探测到的目标"列表 → 摧毁时间
- 测评页面："第一组" → 关键数据统计 → 目标摧毁时间

应该完全一致！

## 符合的规范

根据项目规范 [memory id="8df3d6db-a712-4bbf-9a39-74061fe6cdd7"]：

> 在第一次接收到没有该目标状态的报文时，应记录该报文中的 optional double updateTime = 2 字段值作为摧毁时间，后续报文不得覆盖已记录的时间。

**正确理解**：

- "没有该目标状态" = 目标不在 platform 数据中
- "第一次接收到" = 通过 `!target.destroyed` 确保只记录一次
- "updateTime 字段值" = 使用报文的 `updateTime` 而不是页面内存中的时间

## 总结

### 核心改进

1. **统一判定逻辑**：两个页面都只检查 platform 数据，不检查 tracks
2. **移除依赖**：无人机页面的摧毁判定不再依赖 tracks 状态
3. **时间一致性**：两个页面在同一报文周期检测到摧毁，记录相同的时间

### 预期效果

- ✅ 两个页面记录的摧毁时间完全一致
- ✅ 摧毁判定更及时、更准确
- ✅ 逻辑简单明确，易于维护
- ✅ 符合项目规范要求

### 相关文件

- [src/renderer/views/pages/UavOperationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/UavOperationPage.vue#L2555-L2610)
- [src/renderer/views/pages/EvaluationPage.vue](file:///Users/xinnix/code/afs/opEnd/src/renderer/views/pages/EvaluationPage.vue#L723-L740)
- [testScipt/test-target-destroyed-time-fix.js](file:///Users/xinnix/code/afs/opEnd/testScipt/test-target-destroyed-time-fix.js)
