# UI 设计规范快速参考指南

## 🎨 设计令牌 (Design Tokens)

### 颜色系统

#### 功能色

```css
var(--color-primary)   /* #409eff - 主色调(蓝色) */
var(--color-success)   /* #67c23a - 成功(绿色) */
var(--color-warning)   /* #e6a23c - 警告(橙色) */
var(--color-danger)    /* #f56c6c - 危险(红色) */
var(--color-info)      /* #909399 - 信息(灰色) */
```

#### 文本颜色

```css
var(--text-primary)     /* #303133 - 主要文本 */
var(--text-regular)     /* #606266 - 常规文本 */
var(--text-secondary)   /* #909399 - 次要文本 */
var(--text-placeholder) /* #c0c4cc - 占位文本 */
```

#### 边框颜色

```css
var(--border-base)    /* #dcdfe6 - 基础边框 */
var(--border-light)   /* #e4e7ed - 浅色边框 */
var(--border-lighter) /* #ebeef5 - 更浅边框 */
```

#### 背景颜色

```css
var(--bg-white) /* #ffffff - 纯白背景 */
var(--bg-base)  /* #f5f7fa - 基础背景 */
var(--bg-light) /* #fafafa - 浅色背景 */
```

### 间距系统 (8px 基础)

```css
var(--spacing-xs)  /* 4px  - 超小间距 */
var(--spacing-sm)  /* 8px  - 小间距 */
var(--spacing-md)  /* 12px - 中等间距 */
var(--spacing-lg)  /* 16px - 大间距 */
var(--spacing-xl)  /* 24px - 超大间距 */
```

**使用原则:**

- 元素内部 padding: 优先使用 `--spacing-lg`(16px)
- 元素之间 gap: 优先使用 `--spacing-md`(12px)或`--spacing-sm`(8px)
- 大区块间距: 使用 `--spacing-xl`(24px)

### 圆角规范

```css
var(--radius-sm)   /* 4px - 小圆角(标签、徽章) */
var(--radius-base) /* 6px - 基础圆角(按钮、输入框) */
var(--radius-md)   /* 8px - 中等圆角(卡片、面板) */
```

### 阴影层级

```css
var(--shadow-sm)   /* 0 2px 4px rgba(0,0,0,0.08)  - 轻微阴影(悬停) */
var(--shadow-base) /* 0 2px 8px rgba(0,0,0,0.1)   - 基础阴影(卡片) */
var(--shadow-lg)   /* 0 4px 12px rgba(0,0,0,0.15) - 强阴影(悬停卡片) */
```

### 字体大小

```css
var(--font-xs)   /* 11px - 辅助信息 */
var(--font-sm)   /* 12px - 次要文本 */
var(--font-base) /* 14px - 正文 */
var(--font-lg)   /* 16px - 标题 */
var(--font-xl)   /* 18px - 大标题 */
```

### 过渡动画

```css
var(--transition-base) /* all 0.2s ease - 标准过渡 */
```

## 📦 组件样式模板

### 标准卡片

```css
.your-card {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--border-base);
  transition: var(--transition-base);
}

.your-card:hover {
  box-shadow: var(--shadow-lg);
}
```

### 标准按钮 (中等)

```css
.your-button {
  height: 36px;
  padding: 0 var(--spacing-lg);
  border: 1px solid var(--border-base);
  background: var(--bg-white);
  border-radius: var(--radius-base);
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
}

.your-button:hover {
  background: var(--bg-base);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
```

### 标准按钮 (大型)

```css
.your-large-button {
  height: 40px;
  padding: 0 var(--spacing-xl);
  /* ...其他样式同上 */
}
```

### 分隔符

```css
/* 横向分隔符 */
.separator-horizontal {
  height: 1px;
  background: var(--border-light);
  margin: var(--spacing-md) 0;
}

/* 纵向分隔符 */
.separator-vertical {
  width: 1px;
  background: var(--border-light);
  margin: 0 var(--spacing-md);
}
```

### 标准输入组

```css
.input-group {
  margin-bottom: var(--spacing-sm);
}

.input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.input-label {
  font-size: var(--font-base);
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  min-width: 60px;
}
```

## 🎯 常用布局模式

### 弹性布局 (Flex)

```css
/* 水平排列,间距12px */
.flex-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* 垂直排列,间距8px */
.flex-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* 两端对齐 */
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 网格布局 (Grid)

```css
/* 2列网格,间距8px */
.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}
```

## ✅ 最佳实践

### DO ✅

```css
/* 使用CSS变量 */
color: var(--text-primary);
padding: var(--spacing-lg);
border-radius: var(--radius-md);

/* 统一过渡效果 */
transition: var(--transition-base);

/* 间距使用8的倍数 */
margin: var(--spacing-md); /* 12px */
gap: var(--spacing-sm); /* 8px */
```

### DON'T ❌

```css
/* 硬编码颜色值 */
color: #333333;

/* 随意的间距 */
padding: 15px;
margin: 13px;

/* 不一致的边框 */
border: 2px solid #ccc;

/* 缺失过渡效果 */
/* 没有transition */
```

## 🔍 快速检查清单

新增/修改组件时,请检查:

- [ ] 颜色是否使用 CSS 变量?
- [ ] 间距是否符合 8px 基础单位?
- [ ] 圆角是否使用标准值(4/6/8px)?
- [ ] 阴影是否使用三级标准阴影?
- [ ] 边框是否统一 1px?
- [ ] 是否添加了过渡动画?
- [ ] 是否添加了悬停效果?
- [ ] 字体大小是否使用标准值?

## 💡 特殊场景

### 状态指示器

```css
/* 成功状态 */
.status-success {
  color: var(--color-success);
  background: #e8f5e8;
}

/* 警告状态 */
.status-warning {
  color: var(--color-warning);
  background: #fff7e6;
}

/* 危险状态 */
.status-danger {
  color: var(--color-danger);
  background: #fef0f0;
}
```

### 数据源指示器

```css
.data-source-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-radius: 12px;
  font-size: var(--font-xs);
  font-weight: 500;
}

/* 实时数据 */
.data-source-indicator.connected {
  background: #e8f5e8;
  color: #2d5016;
}

/* 模拟数据 */
.data-source-indicator.simulated {
  background: #fff7e6;
  color: #ad6800;
}
```

## 📱 响应式建议

虽然当前主要针对桌面应用,但建议保持良好的响应式习惯:

```css
/* 使用min-width而非固定width */
.panel {
  min-width: 300px;
  max-width: 100%;
}

/* 使用flex布局自适应 */
.container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}
```

## 🎨 Element Plus 组件定制

```css
/* Switch开关 */
:deep(.el-switch) {
  --el-switch-on-color: var(--color-primary);
  --el-switch-off-color: var(--border-base);
}

/* Select下拉框 */
:deep(.el-select .el-input__wrapper) {
  border: 1px solid var(--border-base);
  border-radius: var(--radius-base);
  background: var(--bg-white);
  transition: var(--transition-base);
}

/* Button按钮 */
:deep(.el-button) {
  border: 1px solid var(--border-base);
  background: var(--bg-white);
  color: var(--text-primary);
  transition: var(--transition-base);
}
```

## 🚀 快速参考

| 需求       | 变量                | 值       |
| ---------- | ------------------- | -------- |
| 卡片圆角   | `--radius-md`       | 8px      |
| 按钮圆角   | `--radius-base`     | 6px      |
| 卡片内边距 | `--spacing-lg`      | 16px     |
| 元素间距   | `--spacing-md`      | 12px     |
| 卡片边框   | `--border-base`     | #dcdfe6  |
| 卡片阴影   | `--shadow-base`     | 标准阴影 |
| 主题色     | `--color-primary`   | #409eff  |
| 正文字号   | `--font-base`       | 14px     |
| 标题字号   | `--font-lg`         | 16px     |
| 过渡时间   | `--transition-base` | 0.2s     |

---

**最后更新:** 2025-10-11  
**适用范围:** opEnd 项目所有 UI 组件  
**维护者:** 开发团队
