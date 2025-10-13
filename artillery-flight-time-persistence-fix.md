# 火炮预计飞行时间持久化显示修复报告

## 🐛 问题描述

用户报告：预计飞行时间在开火后能正确计算和显示，但更新了一次状态后就变成了 0。

## 🔍 根本原因分析

经过代码审查，发现了以下问题：

### 问题 1：炮弹状态显示区域重复显示

**位置**：约第 489-507 行

在炮弹状态卡片中，飞行时间被重复显示：

- 第 496 行：在高度信息后内联显示 `预计飞行时间：{{ estimatedFlightTime }}秒`
- 第 505-507 行：有一个空的 `flight-time-info` 区域（没有实际内容）

这导致了显示混乱，且样式不统一。

### 问题 2：3 秒后自动清空飞行时间

**位置**：约第 2488 行

开火成功后，有一个 3 秒的定时器会清空飞行时间：

```typescript
setTimeout(() => {
  fireStatus.value = "待发射";
  isFiring.value = false;
  estimatedFlightTime.value = 0; // ← 这里会清空飞行时间
}, 3000);
```

这导致飞行时间显示 3 秒后就消失了，而实际上炮弹可能还在飞行中。

### 问题 3：缺少开火时清空旧值的逻辑

连续开火时，没有在新的开火操作开始时清空上一次的飞行时间，可能导致显示混乱。

### 问题 4：缺少距离数据异常处理

当距离数据不可用时，没有给出明确的警告提示。

## ✅ 修复方案

### 修复 1：统一飞行时间显示位置

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：第 489-507 行

**修复前**：

```vue
高度：{{ ... }}m 预计飞行时间：{{ estimatedFlightTime }}秒
<br />
姿态：俯仰...横滚...偏航... 速度：...m/s
<br />
<span v-if="estimatedFlightTime > 0" class="flight-time-info">
</span>
<!-- 空的，没有内容 -->
```

**修复后**：

```vue
高度：{{ ... }}m<br />
姿态：俯仰...横滚...偏航... 速度：...m/s<br />
<span v-if="estimatedFlightTime > 0" class="flight-time-info">
  预计飞行时间：<span class="flight-time-value">{{ estimatedFlightTime }}</span>秒
</span>
```

**效果**：

- ✅ 移除了内联的飞行时间显示
- ✅ 在 `flight-time-info` 区域正确显示飞行时间
- ✅ 使用醒目的紫色渐变背景和加粗样式

### 修复 2：移除 3 秒后清空逻辑

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：第 2485 行

**修复前**：

```typescript
setTimeout(() => {
  fireStatus.value = "待发射";
  isFiring.value = false;
  estimatedFlightTime.value = 0; // 清空预计飞行时间
}, 3000);
```

**修复后**：

```typescript
setTimeout(() => {
  fireStatus.value = "待发射";
  isFiring.value = false;
  // 注意：不清空 estimatedFlightTime，让它保持显示直到炮弹击中目标或下次开火
}, 3000);
```

**效果**：

- ✅ 飞行时间持续显示，不会在 3 秒后消失
- ✅ 用户可以持续观察炮弹的预计飞行时间
- ✅ 符合实际作战需求（炮弹飞行时间通常超过 3 秒）

### 修复 3：开火时清空旧的飞行时间

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：第 2347 行

**新增代码**：

```typescript
// 设置发射状态
isFiring.value = true;
fireStatus.value = "开火中...";

// 清空上次的飞行时间，准备计算新的飞行时间
estimatedFlightTime.value = 0; // ← 新增
```

**效果**：

- ✅ 每次开火时先清空旧值
- ✅ 确保显示的是当前这次射击的预计时间
- ✅ 避免新旧飞行时间混淆

### 修复 4：增强距离数据检查

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：第 2459 行

**修复前**：

```typescript
if (targetDistance.value > 0) {
  estimatedFlightTime.value = Math.round(
    66 + (targetDistance.value - 23134) / 480
  );
  console.log(`预计飞行时间: ${estimatedFlightTime.value}秒`);
}
```

**修复后**：

```typescript
if (targetDistance.value > 0) {
  estimatedFlightTime.value = Math.round(
    66 + (targetDistance.value - 23134) / 480
  );
  console.log(
    `预计飞行时间: ${estimatedFlightTime.value}秒, 目标距离: ${targetDistance.value}米`
  );
} else {
  console.warn(`目标距离数据不可用，无法计算飞行时间`); // ← 新增
}
```

**效果**：

- ✅ 明确提示距离数据异常
- ✅ 便于调试和问题排查

## 🔄 完整工作流程

### 正常开火流程

```
1. 装订目标
   └─ 接收 TargetLoad 信息
       └─ targetDistance = 25000m
       └─ estimatedFlightTime = 0 (尚未开火)

2. 点击开火
   └─ estimatedFlightTime = 0 (清空旧值) ✅
       └─ 发送 Arty_Fire 命令
           └─ 命令发送成功
               └─ 计算飞行时间
                   └─ estimatedFlightTime = 70秒 ✅

3. 持续显示
   └─ 1秒后：estimatedFlightTime = 70 ✅
       └─ 2秒后：estimatedFlightTime = 70 ✅
           └─ 3秒后：estimatedFlightTime = 70 ✅ (不再清空)
               └─ 10秒后：estimatedFlightTime = 70 ✅
                   └─ 直到下次开火或断开连接...
```

### 状态更新期间

```
收到平台心跳包 (0x2C)
  └─ estimatedFlightTime 保持不变 ✅

收到平台状态包 (0x29)
  └─ estimatedFlightTime 保持不变 ✅

收到 TargetLoad 更新
  └─ estimatedFlightTime 保持不变 ✅
```

### 连续开火流程

```
第一次开火
  └─ targetDistance = 25000m
      └─ estimatedFlightTime = 70秒
          └─ 持续显示...

装订新目标
  └─ targetDistance = 30000m
      └─ 点击开火
          └─ estimatedFlightTime = 0 (清空旧值) ✅
              └─ 计算新飞行时间
                  └─ estimatedFlightTime = 80秒 ✅
```

## 📊 修复效果对比

| 场景         | 修复前            | 修复后              |
| ------------ | ----------------- | ------------------- |
| 开火后 3 秒  | ❌ 飞行时间被清空 | ✅ 飞行时间持续显示 |
| 平台状态更新 | ❌ 可能显示混乱   | ✅ 保持正确显示     |
| 连续开火     | ⚠️ 可能混淆       | ✅ 正确更新         |
| 视觉效果     | ⚠️ 重复显示       | ✅ 统一样式         |
| 距离异常     | ❌ 无提示         | ✅ 明确警告         |

## 🧪 测试验证

### 功能测试

- [x] 开火后飞行时间正确显示
- [x] 等待超过 3 秒，飞行时间不会被清空
- [x] 平台状态更新期间，飞行时间保持显示
- [x] 连续开火多次，每次都正确更新飞行时间

### 视觉测试

- [x] 飞行时间显示在炮弹状态卡片底部
- [x] 使用紫色渐变背景，白色加粗文字
- [x] 只有当 `estimatedFlightTime > 0` 时才显示

### 边界测试

- [x] 没有距离数据时开火（输出警告日志）
- [x] 距离为 0 时开火（不计算飞行时间）
- [x] 断开连接后重新连接（状态正确重置）

## 📝 代码改动总结

| 改动         | 文件                       | 位置          | 影响     |
| ------------ | -------------------------- | ------------- | -------- |
| 修复显示位置 | ArtilleryOperationPage.vue | 第 489-507 行 | UI 显示  |
| 移除清空逻辑 | ArtilleryOperationPage.vue | 第 2485 行    | 核心逻辑 |
| 开火时清空   | ArtilleryOperationPage.vue | 第 2347 行    | 状态管理 |
| 增强检查     | ArtilleryOperationPage.vue | 第 2459 行    | 错误处理 |

## 🎯 使用建议

### 正常使用流程

1. **装订目标** → 确保收到 `TargetLoad` 信息
2. **装填弹药** → 选择弹药类型并装填
3. **开火射击** → 点击开火按钮
4. **观察时间** → 在炮弹状态区域查看预计飞行时间
5. **持续监控** → 飞行时间会持续显示，直到下次开火

### 注意事项

- ⚠️ 飞行时间基于装订时的目标距离计算
- ⚠️ 如果目标移动，飞行时间不会实时更新
- ⚠️ 下次开火时会自动更新为新的飞行时间
- ⚠️ 断开连接会清空所有状态，包括飞行时间

## 📚 相关文档

- ✅ 实现代码：`src/renderer/views/pages/ArtilleryOperationPage.vue`
- ✅ 验证脚本：`scripts/verify-flight-time-persistence.js`
- ✅ 本修复报告：`artillery-flight-time-persistence-fix.md`
- ✅ 原实现总结：`artillery-flight-time-implementation-summary.md`

## 🔗 相关记忆

根据经验记忆：

> 预计飞行时间计算公式为：t = 66 + (目标距离 - 23134) / 480，其中 t 单位为秒，距离单位为米。该公式基于基准距离 23134 米对应 66 秒飞行时间，每增减 480 米飞行时间相应增减 1 秒。

## 🎉 修复完成

本次修复解决了预计飞行时间在状态更新后被清空的问题，确保了飞行时间的持久化显示，提升了用户体验和作战效能。

---

**修复日期**：2025-10-13  
**测试状态**：✅ 全部通过  
**修复验证**：✅ 完成
