# 无人机页面目标摧毁时间展示功能实现报告

## 功能概述

在无人机操作页面的"发现目标"列表中,当检测到目标被摧毁时,除了显示"已摧毁"状态标识外,还会展示目标的摧毁时间(基于演习时间)。

## 需求分析

### 用户需求

- 在无人机页面的扫描目标处,如果目标被摧毁,展示摧毁时间
- 摧毁时间应基于演习时间,而非真实时间
- 摧毁时间需要持久化显示,不会因为数据刷新而消失

### 业务规则

根据项目已有的目标状态管理规范:

1. **目标摧毁判定**: 当目标不存在于任何平台的数据中时,判定为已摧毁
2. **状态持久化**: 目标被摧毁后,状态应持久化显示,不会被清除
3. **时间记录**: 摧毁时间应记录为目标被判定摧毁时的演习时间

## 实现方案

### 1. 数据结构扩展

在目标对象中添加`destroyedTime`字段:

```typescript
interface Target {
  name: string;
  type: string;
  sensorName: string;
  position: {
    longitude: string;
    latitude: string;
    altitude: string;
  };
  status: "active" | "inactive" | "destroyed";
  destroyed: boolean;
  destroyedTime?: string; // 新增: 目标摧毁时间(演习时间格式)
  lastUpdate: number;
  firstDetected: number;
}
```

### 2. 摧毁时间记录逻辑

在`updateDetectedTargets`函数中,当检测到目标被摧毁时记录摧毁时间:

**文件位置**: `/src/renderer/views/pages/UavOperationPage.vue`

**修改点 1**: 新发现目标时初始化字段

```javascript
const newTarget = {
  // ... 其他字段
  destroyed: false,
  destroyedTime: undefined, // 初始为undefined
  // ... 其他字段
};
```

**修改点 2**: 检测到摧毁时记录时间

```javascript
// 检查目标是否被摧毁(不在任何平台中存在)
if (!targetPlatform && !target.destroyed) {
  target.destroyed = true;
  target.status = "destroyed";
  // 记录摧毁时间
  target.destroyedTime = environmentParams.exerciseTime;
  console.log(
    `[UavPage] 目标被摧毁: ${target.name}, 摧毁时间: ${target.destroyedTime}`
  );
  addLog("warning", `目标 ${target.name} 已被摧毁 (${target.destroyedTime})`);
}
```

### 3. UI 展示实现

在目标列表的摧毁状态显示中添加时间展示:

**文件位置**: `/src/renderer/views/pages/UavOperationPage.vue` (模板部分)

```vue
<div
  class="destroyed-status"
  v-if="target.destroyed || target.status === 'destroyed'"
>
  <el-icon class="destroyed-icon"><CircleClose /></el-icon>
  <span class="destroyed-text">已摧毁</span>
  <span v-if="target.destroyedTime" class="destroyed-time">{{ target.destroyedTime }}</span>
</div>
```

### 4. 样式设计

添加摧毁时间的专用样式,确保视觉上清晰易读:

```css
/* 目标列表中的摧毁时间样式 */
.destroyed-time {
  font-size: 12px;
  font-weight: 500;
  color: #f56c6c;
  margin-left: 8px;
  padding: 2px 8px;
  background-color: rgba(245, 108, 108, 0.1);
  border-radius: 4px;
  white-space: nowrap;
}

/* 目标状态指示器中的摧毁时间样式(较小) */
.target-status-indicator .destroyed-time {
  font-size: 9px;
  font-weight: 500;
  color: #f56c6c;
  margin-left: 4px;
  padding: 1px 4px;
  background-color: rgba(245, 108, 108, 0.15);
  border-radius: 3px;
  white-space: nowrap;
}
```

## 关键特性

### 1. 时间格式

- 使用演习时间格式: `"T + XXX秒"` 或 `"T + X分XX秒"`
- 与系统的演习时间保持一致,便于操作员进行时间关联分析

### 2. 持久化显示

- 摧毁时间一旦记录,就会持久化保存在目标对象中
- 即使平台数据更新,摧毁时间也不会丢失
- 断开连接时会清空所有目标,重新连接后重新开始记录

### 3. 视觉设计

- 摧毁时间以浅红色背景高亮显示
- 字体大小适中,确保可读性
- 与"已摧毁"文字保持一致的视觉风格

### 4. 日志记录

- 目标被摧毁时,在操作日志中记录摧毁时间
- 便于事后追溯和分析

## 测试验证

### 自动化测试

创建了专用测试脚本 `test-target-destroyed-time.js`,测试流程:

1. 打开应用并进入无人机页面
2. 选择分组和无人机平台
3. 连接平台并等待目标数据
4. 监控目标状态变化
5. 验证摧毁状态和摧毁时间的显示
6. 确认持久化显示的正确性

### 手动测试要点

1. **目标摧毁检测**

   - 连接无人机平台
   - 观察发现目标列表
   - 等待目标从平台数据中消失
   - 验证目标状态变为"已摧毁"

2. **摧毁时间显示**

   - 检查摧毁时间是否正确显示
   - 验证时间格式是否为演习时间格式
   - 确认时间与实际摧毁时刻的演习时间一致

3. **持久化验证**

   - 摧毁后等待数据刷新
   - 确认摧毁时间持续显示
   - 验证时间不会因数据更新而变化

4. **视觉效果检查**
   - 检查摧毁时间的颜色和样式
   - 验证与"已摧毁"标签的视觉协调性
   - 确认不同屏幕尺寸下的显示效果

## 遵循的项目规范

本实现严格遵循项目的目标状态管理规范:

1. **目标状态管理规范**

   > 当系统检测到任务目标从平台数据中消失时,不应直接清除展示,而应触发摧毁逻辑判断流程,依据业务规则确认其状态(如已摧毁、失联等),并在界面上持久化显示对应状态,确保操作员能获取完整态势信息。

2. **目标摧毁状态检测规范**

   > 当需要判断目标是否被摧毁时,应检查所有平台返回的 tracks 数据中是否仍包含当前锁定的目标;若目标不存在于任何平台的 tracks 中,则判定为目标已被摧毁,否则为目标正常。

3. **历史经验应用**
   - 参考作战测评页面的目标摧毁时间实现
   - 使用统一的目标状态检测算法
   - 保持视觉指示器设计的一致性

## 技术亮点

1. **响应式数据管理**: 使用 Vue 3 的响应式系统,确保数据变化立即反映到 UI
2. **条件渲染优化**: 使用`v-if`确保只在有摧毁时间时才显示时间标签
3. **样式分离**: 针对不同显示位置(列表 vs 状态指示器)使用不同的样式尺寸
4. **日志追踪**: 完整的日志记录便于调试和问题追溯

## 影响范围

### 修改文件

- `/src/renderer/views/pages/UavOperationPage.vue`

### 影响的功能模块

- 无人机操作页面的发现目标列表展示
- 目标状态管理逻辑
- 操作日志记录

### 不影响的功能

- 目标锁定功能
- 传感器控制功能
- 协同报文功能
- 其他页面的目标显示

## 后续优化建议

1. **时间格式增强**

   - 考虑支持多种时间格式显示(演习时间/实际时间切换)
   - 提供时间格式配置选项

2. **摧毁原因记录**

   - 记录目标摧毁的可能原因(打击摧毁/数据丢失等)
   - 提供更详细的摧毁信息

3. **统计功能**

   - 统计特定时间段内的目标摧毁数量
   - 提供目标摧毁时间轴可视化

4. **导出功能**
   - 支持将摧毁目标记录导出到 Excel
   - 包含摧毁时间等详细信息

## 总结

本次实现成功在无人机操作页面添加了目标摧毁时间展示功能,完全遵循项目的目标状态管理规范,为操作员提供了更完整的态势感知信息。通过记录和显示摧毁时间,操作员可以:

1. 准确了解目标被摧毁的时间节点
2. 进行事后的战术分析和评估
3. 与其他系统事件进行时间关联
4. 生成更完整的演习记录

该功能的实现保持了与作战测评页面的一致性,确保了整个系统中目标状态管理的统一性和可靠性。
