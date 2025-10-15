# 任务目标卡片状态标签定位修复

## 问题描述

任务目标卡片中的"未扫到"等状态标签定位错误，意外地定位到了卡片的右上角，而不是在标题栏中显示。

## 原因分析

**根本原因：**
全局的 `.target-status-indicator` 样式使用了绝对定位：

```css
.target-status-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
```

这个全局样式是为"发现目标"列表中的目标卡片设计的，用于将状态标签定位在每个目标条目的右上角。

但是，任务目标卡片也使用了相同的 `.target-status-indicator` 类名，导致继承了绝对定位样式，使状态标签错误地定位到了卡片右上角。

## 设计意图

### 发现目标列表中的状态标签

- **位置：** 每个目标条目的右上角
- **定位方式：** 绝对定位 `position: absolute`
- **符合规范：** ✅ 符合"状态标签位置规范"

### 任务目标卡片中的状态标签

- **位置：** 标题栏的右侧
- **定位方式：** 正常流布局（flex 布局中的一个元素）
- **布局：** `card-header` 使用 `justify-content: space-between` 将状态标签推到右侧

## 解决方案

为任务目标卡片中的 `.target-status-indicator` 添加更具体的样式，覆盖全局的绝对定位：

```css
.mission-target-card .target-status-indicator {
  display: flex;
  align-items: center;
  position: relative; /* 覆盖全局的绝对定位 */
  top: auto; /* 重置top属性 */
  right: auto; /* 重置right属性 */
}
```

## 修改详情

### 无人机操作页面

**文件：** `/Users/xinnix/code/afs/opEnd/src/renderer/views/pages/UavOperationPage.vue`

**修改位置：** Line ~4625

**修改内容：**

```css
/* 修改前 */
.mission-target-card .target-status-indicator {
  display: flex;
  align-items: center;
}

/* 修改后 */
.mission-target-card .target-status-indicator {
  display: flex;
  align-items: center;
  position: relative; /* 覆盖全局的绝对定位 */
  top: auto;
  right: auto;
}
```

### 火炮操作页面

**文件：** `/Users/xinnix/code/afs/opEnd/src/renderer/views/pages/ArtilleryOperationPage.vue`

**修改位置：** Line ~3310

**修改内容：** 相同

## 效果对比

### 修复前 ❌

```
┌─────────────────────────────────────┐
│ 📍 当前任务目标    [未扫到标签跑这] │ ← 错误位置
├─────────────────────────────────────┤
│                                     │
│  目标名称    类型标签          ┌──┐│
│  经纬高：xx°, xx°, xxm        │图││
│                                └──┘│
└─────────────────────────────────────┘
```

### 修复后 ✅

```
┌─────────────────────────────────────┐
│ 📍 当前任务目标        [未扫到] │ ← 正确位置（标题栏右侧）
├─────────────────────────────────────┤
│                                     │
│  目标名称    类型标签          ┌──┐│
│  经纬高：xx°, xx°, xxm        │图││
│                                └──┘│
└─────────────────────────────────────┘
```

## CSS 优先级说明

### 为什么需要显式设置 `position: relative`？

由于 CSS 的层叠规则，更具体的选择器（`.mission-target-card .target-status-indicator`）虽然优先级高于全局选择器（`.target-status-indicator`），但如果不显式声明 `position` 属性，浏览器仍会使用继承的 `position: absolute`。

因此需要：

1. **`position: relative`** - 覆盖绝对定位
2. **`top: auto`** - 重置 top 偏移
3. **`right: auto`** - 重置 right 偏移

## 技术亮点

1. **CSS 作用域隔离** - 使用更具体的选择器避免样式冲突
2. **不影响其他组件** - 全局的 `.target-status-indicator` 样式保持不变
3. **符合设计规范** - 不同场景使用不同的定位方式
4. **可维护性** - 通过注释说明覆盖意图

## 相关规范

根据项目规范：

- **"状态标签位置规范"** - 目标条目的状态标签必须显示在右上角，使用绝对定位 ✅
- **任务目标卡片布局** - 状态标签应在标题栏中显示 ✅

本次修复确保了两种场景都符合各自的设计规范。

## 验证清单

- [x] 任务目标卡片中的状态标签显示在标题栏右侧
- [x] 发现目标列表中的状态标签仍然显示在条目右上角
- [x] 所有状态类型（正常、未扫到、已摧毁）都正确显示
- [x] 无人机和火炮页面都已修复
- [x] 没有引入新的语法错误

## 备注

此次修复是针对 CSS 选择器优先级和属性继承的典型问题，体现了在大型项目中如何处理样式冲突和组件隔离的最佳实践。
