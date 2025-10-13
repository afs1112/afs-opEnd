# 火炮预计飞行时间功能实现总结

## 📋 功能概述

在火炮操作页面中，装订目标并开火后，系统会自动计算并显示炮弹的预计飞行时间。

## 🎯 需求说明

- **触发时机**：装订目标后开火
- **数据来源**：目标距离（从 TargetLoad 信息获取）
- **计算公式**：`t = 66 + (距离 - 23134) / 480`
- **显示位置**：炮弹状态卡片

## 🔧 实现细节

### 1. 数据结构

添加了两个响应式变量：

```typescript
// 预计飞行时间相关
const estimatedFlightTime = ref<number>(0); // 预计飞行时间（秒）
const targetDistance = ref<number>(0); // 目标距离（米）
```

### 2. 距离数据获取

在接收平台状态数据时，从 `TargetLoad` 信息中提取目标距离：

```typescript
// 更新 TargetLoad 信息（火炮特有的目标装订信息）
if (platform.targetLoad) {
  // 更新目标距离用于飞行时间计算
  if (platform.targetLoad.distance !== undefined) {
    targetDistance.value = platform.targetLoad.distance;
    console.log(`[ArtilleryPage] 更新目标距离: ${targetDistance.value}米`);
  }
}
```

### 3. 飞行时间计算

在开火成功后，使用公式计算预计飞行时间：

```typescript
// 计算并显示预计飞行时间
if (targetDistance.value > 0) {
  // 使用公式: t = 66 + (距离 - 23134) / 480
  estimatedFlightTime.value = Math.round(
    66 + (targetDistance.value - 23134) / 480
  );
  console.log(
    `[ArtilleryPage] 预计飞行时间: ${estimatedFlightTime.value}秒, 目标距离: ${targetDistance.value}米`
  );
}
```

### 4. 界面显示

在炮弹状态卡片中显示预计飞行时间：

```vue
<div class="status-info" v-if="getLatestShell()">
  <!-- 炮弹基本信息 -->
  炮弹名称：{{ getLatestShell().base.name }}<br />
  位置：...<br />
  姿态：...<br />
  <!-- 预计飞行时间（新增） -->
  <span v-if="estimatedFlightTime > 0" class="flight-time-info">
    预计飞行时间：<span class="flight-time-value">{{ estimatedFlightTime }}</span>秒
  </span>
</div>
```

### 5. 样式设计

使用醒目的渐变背景样式突出显示：

```css
/* 飞行时间显示样式 */
.flight-time-info {
  display: inline-block;
  margin-top: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}

.flight-time-value {
  font-size: 16px;
  font-weight: 700;
  margin: 0 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

### 6. 状态重置

开火 3 秒后自动重置飞行时间显示：

```typescript
// 重置状态
setTimeout(() => {
  fireStatus.value = "待发射";
  isFiring.value = false;
  estimatedFlightTime.value = 0; // 清空预计飞行时间
}, 3000);
```

## 📊 计算公式说明

### 公式：`t = 66 + (距离 - 23134) / 480`

#### 公式特性：

1. **基准值**：当距离 = 23134m 时，飞行时间 = 66 秒
2. **线性关系**：距离每增加/减少 480m，飞行时间增加/减少 1 秒
3. **四舍五入**：计算结果使用 `Math.round()` 四舍五入为整数秒

#### 示例计算：

| 距离(m) | 计算过程               | 飞行时间(秒) |
| ------- | ---------------------- | ------------ |
| 20000   | 66 + (20000-23134)/480 | 59           |
| 23134   | 66 + (23134-23134)/480 | 66           |
| 25000   | 66 + (25000-23134)/480 | 70           |
| 28000   | 66 + (28000-23134)/480 | 76           |
| 30000   | 66 + (30000-23134)/480 | 80           |

## 🔄 完整流程

1. **装订目标**：用户点击"目标装订"按钮
2. **接收反馈**：平台返回 `TargetLoad` 信息，包含目标距离
3. **存储距离**：系统提取并存储 `targetDistance`
4. **执行开火**：用户点击"开火"按钮
5. **计算时间**：系统使用公式计算 `estimatedFlightTime`
6. **显示结果**：在炮弹状态卡片中显示预计飞行时间
7. **自动重置**：3 秒后清空飞行时间显示

## 📝 关键代码位置

### 变量定义（约 1727 行）

```typescript
const estimatedFlightTime = ref<number>(0);
const targetDistance = ref<number>(0);
```

### 距离更新（约 3527 行、3643 行）

- 在 `handlePlatformStatus` 中更新
- 在 `updateArtilleryStatusDisplay` 中更新

### 飞行时间计算（约 2374 行）

- 在 `fireAtDrone` 函数的开火成功逻辑中

### 界面显示（约 509 行）

- 在炮弹状态卡片的 `status-info` 区域

### 样式定义（约 4769 行）

- `.flight-time-info` 和 `.flight-time-value` 类

## ✅ 测试验证

已创建测试脚本 `scripts/test-flight-time-calculation.js`：

```bash
node scripts/test-flight-time-calculation.js
```

测试涵盖：

- ✓ 公式计算正确性
- ✓ 边界值测试
- ✓ 线性关系验证
- ✓ 四舍五入处理

## 🎨 视觉效果

- **背景**：紫色渐变（#667eea → #764ba2）
- **文字**：白色加粗，带阴影
- **布局**：独立一行，便于识别
- **条件显示**：仅在有飞行时间数据时显示

## 📌 注意事项

1. **数据依赖**：需要先装订目标获取 `TargetLoad` 信息
2. **条件渲染**：使用 `v-if="estimatedFlightTime > 0"` 避免显示无效数据
3. **状态同步**：在多个位置更新 `targetDistance` 确保数据一致性
4. **自动清理**：开火后 3 秒自动重置，避免数据残留

## 🚀 后续优化建议

1. 可以添加倒计时动画效果
2. 可以在飞行时间到达时发出提醒
3. 可以记录历史飞行时间用于分析
4. 可以根据实际飞行数据调整公式参数

## 📄 相关文件

- **主文件**：`/src/renderer/views/pages/ArtilleryOperationPage.vue`
- **协议定义**：`/src/protobuf/PlatformStatus.proto` (TargetLoad)
- **测试脚本**：`/scripts/test-flight-time-calculation.js`

---

**实现日期**：2025-10-13  
**功能状态**：✅ 已完成并测试
