# 航点规划功能修复报告

## 问题描述

在测试航点规划功能时，出现了 "An object could not be cloned" 错误。这个错误通常发生在尝试通过 IPC（进程间通信）传递包含不可序列化对象的数据时。

## 问题原因

1. **Vue响应式对象**: `navParamForm.route` 数组中的对象是Vue的响应式代理对象，包含不可序列化的属性
2. **数值输入组件**: 使用 `el-input-number` 组件可能产生包含额外属性的对象
3. **数据传递**: 直接传递响应式对象给 Electron IPC 导致克隆失败

## 修复方案

### 1. 数据克隆和类型转换

在 `sendNavCommand` 函数中添加数据克隆逻辑：

```javascript
// 深度克隆航点数据，避免传递响应式对象
const routeData = navParamForm.route.map(waypoint => ({
  longitude: Number(waypoint.longitude),
  latitude: Number(waypoint.latitude),
  altitude: Number(waypoint.altitude),
  labelName: String(waypoint.labelName),
  speed: Number(waypoint.speed)
}));
```

### 2. 简化输入界面

将数值输入框改为普通文本输入框：

**修改前:**
```vue
<el-input-number v-model="row.longitude" :precision="6" class="w-full" />
```

**修改后:**
```vue
<el-input v-model="row.longitude" placeholder="116.397428" />
```

### 3. 数据类型调整

将 `navParamForm` 中的数值字段改为字符串类型：

```typescript
const navParamForm = reactive({
  route: [] as Array<{
    longitude: string;  // 改为字符串
    latitude: string;   // 改为字符串
    altitude: string;   // 改为字符串
    labelName: string;
    speed: string;      // 改为字符串
  }>
});
```

### 4. 其他命令函数优化

为确保一致性，也对其他命令发送函数进行了类型转换优化：

```javascript
// 传感器命令
const commandData = {
  commandID: Date.now(),
  platformName: String(selectedPlatform.value),
  command: Number(commandEnum),
  sensorParam: {
    sensorName: String(sensorParamForm.sensorName),
    azSlew: Number(sensorParamForm.azSlew),
    elSlew: Number(sensorParamForm.elSlew)
  }
};
```

## 界面改进

### 移除 +/- 按钮

根据用户要求，移除了数值输入框的 +/- 按钮，改为更简洁的文本输入框：

- 经度输入框：显示示例 "116.397428"
- 纬度输入框：显示示例 "39.90923"  
- 高度输入框：显示示例 "100" 并标注单位 "(m)"
- 速度输入框：显示示例 "10" 并标注单位 "(m/s)"

## 测试验证

创建了测试脚本验证修复效果：

1. **数据克隆测试**: 验证航点数据可以正确克隆和转换
2. **序列化测试**: 验证所有命令数据都可以正常序列化
3. **类型转换测试**: 验证字符串到数值的转换正确性

## 修复效果

✅ **解决了克隆错误**: "An object could not be cloned" 错误已修复  
✅ **界面更简洁**: 移除了 +/- 按钮，使用纯文本输入  
✅ **数据安全**: 确保传递给 IPC 的数据都是可序列化的普通对象  
✅ **类型安全**: 在发送前进行明确的类型转换  
✅ **一致性**: 所有命令发送函数都使用相同的数据处理模式  

## 使用说明

1. 点击"航线规划"按钮打开航点规划对话框
2. 点击"添加航点"添加新的航点
3. 在输入框中直接输入经纬度、高度、速度等数值
4. 点击"确定"发送航点规划命令

航点数据会自动转换为正确的数值类型并安全地传递给后端服务。