# 火炮协同目标采用逻辑修复总结

## 问题描述

用户反馈：在火炮页面收到无人机的打击协同命令后，即使还没有点击"采用协同目标"按钮，任务控制区域的目标名称和目标坐标就已经被自动填入。这不符合预期行为。

### 期望行为

- 收到协同命令时，只在协同目标信息区域显示
- 任务控制区域保持上一次的目标内容
- 用户点击"采用协同目标"按钮后才更新任务控制区域

### 实际问题

收到协同命令后，系统自动更新了 `currentTarget` 和 `targetName`，用户失去了选择权。

## 根本原因

在 `ArtilleryOperationPage.vue` 第 2713-2721 行的代码中：

```javascript
// 问题代码：立即自动更新
currentTarget.name = strikeParam.targetName;
if (receivedCoordinationTarget.coordinates) {
  currentTarget.coordinates = receivedCoordinationTarget.coordinates;
}
targetName.value = strikeParam.targetName;
```

这段代码在接收到协同命令时就立即更新了目标信息，没有给用户选择的机会。

## 修复方案

### 1. 修改接收协同命令的逻辑

**修复位置**: `ArtilleryOperationPage.vue` 第 2688-2738 行

**修改内容**:

- 移除自动更新 `currentTarget` 和 `targetName` 的代码
- 只保存协同目标信息到 `receivedCoordinationTarget`
- 修改提示消息，提醒用户点击按钮应用

```javascript
// 修复后：只保存，不自动更新
// 注意：不立即更新 currentTarget 和 targetName，等待用户点击"采用协同目标"按钮
// 这样用户可以选择是否采用，如果不采用，保持上一次的目标内容

ElMessage.success(
  `收到来自 ${sourcePlatform} 的打击协同命令，目标：${strikeParam.targetName}，请点击"采用协同目标"按钮应用`
);
```

### 2. 增强"采用协同目标"按钮功能

**修复位置**: `ArtilleryOperationPage.vue` 第 1930-1947 行

**修改内容**:

- 在 `adoptCoordinationTarget()` 函数中增加同步更新 `targetName.value`

```javascript
const adoptCoordinationTarget = () => {
  if (!receivedCoordinationTarget.name) {
    ElMessage.warning("没有可采用的协同目标");
    return;
  }

  // 将协同目标信息复制到当前目标
  currentTarget.name = receivedCoordinationTarget.name;
  currentTarget.coordinates = receivedCoordinationTarget.coordinates;

  // 同步更新目标名称输入框（保持与 currentTarget.name 同步）
  targetName.value = receivedCoordinationTarget.name;

  ElMessage.success(`已采用协同目标：${receivedCoordinationTarget.name}`);

  // 清除协同目标信息
  clearCoordinationTarget();
};
```

## 数据流程

### 修复前的数据流程（问题）

```
无人机发送协同命令
    ↓
火炮接收命令
    ↓
receivedCoordinationTarget ← 保存协同目标
    ↓
currentTarget ← 立即自动更新 ❌ 问题
targetName ← 立即自动更新 ❌ 问题
    ↓
用户失去选择权
```

### 修复后的数据流程（正确）

```
无人机发送协同命令
    ↓
火炮接收命令
    ↓
receivedCoordinationTarget ← 保存协同目标
    ↓
显示协同目标信息区域
    ↓
用户决策：
    ├─ 点击"采用协同目标" → currentTarget + targetName 更新 ✓
    └─ 点击"忽略"或不处理 → currentTarget + targetName 保持不变 ✓
```

## 涉及的三个关键变量

1. **receivedCoordinationTarget**: 临时保存收到的协同目标

   - 用于 UI 显示协同目标信息区域
   - 采用后被清空

2. **currentTarget**: 实际使用的目标

   - 用于目标装订命令
   - 用于开火命令
   - 只在用户点击"采用"后更新

3. **targetName**: 目标名称输入框的显示值
   - 与 `currentTarget.name` 保持同步
   - 用户也可以手动编辑

## 测试场景

### 场景 1: 火炮已有目标，收到协同命令

**初始状态**:

- currentTarget.name = "装甲车-001"
- targetName.value = "装甲车-001"

**收到协同命令**: 目标为"坦克-005"

**预期结果**:

- ✅ receivedCoordinationTarget.name = "坦克-005"
- ✅ currentTarget.name 仍为 "装甲车-001"（未自动更新）
- ✅ targetName.value 仍为 "装甲车-001"（未自动更新）
- ✅ 协同目标信息区域显示
- ✅ 提示："请点击'采用协同目标'按钮应用"

### 场景 2: 点击"采用协同目标"

**操作**: 用户点击"采用协同目标"按钮

**预期结果**:

- ✅ currentTarget.name 更新为 "坦克-005"
- ✅ currentTarget.coordinates 更新为协同目标坐标
- ✅ targetName.value 更新为 "坦克-005"
- ✅ receivedCoordinationTarget 被清空
- ✅ 协同目标信息区域隐藏
- ✅ 成功消息："已采用协同目标：坦克-005"

### 场景 3: 不采用协同目标

**操作**: 用户忽略或清除协同目标

**预期结果**:

- ✅ currentTarget.name 保持为 "装甲车-001"
- ✅ targetName.value 保持为 "装甲车-001"
- ✅ receivedCoordinationTarget 被清空
- ✅ 用户可以继续使用原目标

## 修改文件清单

- `/src/renderer/views/pages/ArtilleryOperationPage.vue`
  - 第 2688-2738 行：接收协同命令处理逻辑
  - 第 1930-1947 行：采用协同目标函数

## 验证方法

### 手动测试步骤

1. 启动项目，连接火炮平台
2. 在火炮页面设置一个初始目标（如"装甲车-001"）
3. 从无人机发送打击协同命令（目标为"坦克-005"）
4. **验证点 1**：
   - 协同目标信息区域显示"坦克-005"
   - 任务控制区域的目标名称仍显示"装甲车-001"
5. 点击"采用协同目标"按钮
6. **验证点 2**：
   - 目标名称更新为"坦克-005"
   - 协同目标信息区域消失
   - 可以使用新目标进行装订和开火

### 自动化测试

运行测试脚本：

```bash
node test-artillery-coordination-adoption-fix.js
```

## 符合的项目规范

✅ **协同命令接收处理规范**: 火炮端接收到打击协同命令后，将目标信息保存到协同目标区域，等待用户主动采用

✅ **目标装订显示与操作规范**: 保持用户对目标装订的控制权，不自动替换当前目标

## 关键改进点

1. **解耦接收和应用**

   - 接收协同命令：只保存到临时变量
   - 应用目标：用户主动操作

2. **保持用户控制权**

   - 用户可以选择是否采用协同目标
   - 不采用时，保持当前目标不变
   - 给用户决策空间

3. **三个变量同步管理**

   - 清晰的数据流向
   - 避免状态不一致

4. **清晰的用户反馈**
   - 明确提示用户下一步操作
   - 操作结果有明确反馈

## 后续建议

1. 可以考虑添加"忽略协同目标"按钮，让用户主动清除协同目标信息
2. 可以在协同目标信息区域增加倒计时，提醒用户及时处理
3. 可以记录协同目标历史，方便用户回溯

---

**修复日期**: 2025-10-11  
**影响范围**: 火炮操作页面协同目标处理  
**测试状态**: 通过  
**向后兼容**: 是
