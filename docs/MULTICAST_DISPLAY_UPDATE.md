# 组播监听页面命令显示更新

## 更新概述

为了支持新增的无人机速度设置命令（`Uav_Set_Speed`），对组播监听页面（MulticastPage.vue）进行了功能增强，添加了对平台控制命令的专门解析和显示支持。

## 主要更新内容

### 1. 新增平台控制命令显示区域

#### 特殊显示区域
- **包类型**: 0x2A (PackType_PlatformCmd)
- **背景色**: 绿色主题 (`bg-green-50`)
- **图标**: 🎮 (游戏手柄，表示控制命令)

#### 基本信息显示
```vue
<div class="grid grid-cols-2 gap-2 text-xs">
  <div><strong>命令ID:</strong> {{ parsedData.commandID }}</div>
  <div><strong>目标平台:</strong> {{ parsedData.platformName }}</div>
  <div><strong>命令类型:</strong> {{ getPlatformCommandName(parsedData.command) }}</div>
  <div><strong>命令码:</strong> {{ parsedData.command }}</div>
</div>
```

### 2. 命令参数分类显示

#### 传感器参数 (`sensorParam`)
- **图标**: 📡
- **颜色**: 蓝色主题
- **显示内容**: 传感器名称、方位角、俯仰角

#### 火力参数 (`fireParam`)
- **图标**: 🔥
- **颜色**: 红色主题
- **显示内容**: 武器名称、目标名称、发射次数

#### 导航参数 (`navParam`)
- **图标**: 🗺️
- **颜色**: 紫色主题
- **显示内容**: 航点数量、航点列表（最多显示3个，超出部分折叠）

#### 目标装订参数 (`targetSetParam`)
- **图标**: 🎯
- **颜色**: 橙色主题
- **显示内容**: 目标名称

#### 速度设置参数 (`setSpeedParam`) - 新增
- **图标**: ⚡
- **颜色**: 青色主题
- **显示内容**: 目标速度（m/s）

### 3. 命令名称映射

新增 `getPlatformCommandName` 函数，支持所有平台控制命令的名称映射：

```javascript
const getPlatformCommandName = (command: number): string => {
  const commands: Record<number, string> = {
    0: '无效命令',
    1: '传感器开启',
    2: '传感器关闭', 
    3: '传感器转向',
    4: '激光照射',
    5: '停止照射',
    6: '航线规划',
    7: '目标装订',
    8: '火炮发射',
    9: '设置速度'  // 新增
  };
  return commands[command] || `未知命令(${command})`;
};
```

### 4. 统计信息更新

#### 新增平台命令计数器
```javascript
const platformCmdCount = computed(() => {
  return packets.value.filter(p => p.parsedPacket?.packageType === 0x2A).length;
});
```

#### 状态栏布局调整
- 从7列扩展为8列
- 新增"平台命令"统计项，使用青色主题
- 显示接收到的平台控制命令总数

### 5. 界面布局优化

#### 状态栏更新
```vue
<div class="grid grid-cols-1 md:grid-cols-8 gap-4">
  <!-- 原有7列 -->
  <div class="text-center">
    <div class="text-2xl font-bold text-cyan-600">{{ platformCmdCount }}</div>
    <div class="text-sm text-gray-500">平台命令</div>
  </div>
  <!-- 心跳包列 -->
</div>
```

## 显示效果示例

### 速度设置命令显示
```
🎮 平台控制命令:
┌─────────────────────────────────────┐
│ 命令ID: 1234567890                  │
│ 目标平台: UAV-001                   │
│ 命令类型: 设置速度                   │
│ 命令码: 9                           │
│                                     │
│ ⚡ 速度设置参数:                     │
│ └─ 目标速度: 25 m/s                 │
└─────────────────────────────────────┘
```

### 航线规划命令显示
```
🎮 平台控制命令:
┌─────────────────────────────────────┐
│ 命令ID: 1234567891                  │
│ 目标平台: UAV-002                   │
│ 命令类型: 航线规划                   │
│ 命令码: 6                           │
│                                     │
│ 🗺️ 导航参数:                        │
│ └─ 航点数量: 5                      │
│    航点列表:                        │
│    1. 航点1 (116.397, 39.909, 100m, 10m/s) │
│    2. 航点2 (116.407, 39.919, 150m, 15m/s) │
│    3. 航点3 (116.417, 39.929, 200m, 20m/s) │
│    ... 还有 2 个航点                │
└─────────────────────────────────────┘
```

## 技术实现

### 1. 条件渲染
使用 Vue 的条件渲染来根据不同的命令类型显示对应的参数区域：

```vue
<div v-if="packet.parsedPacket.parsedData.setSpeedParam" class="bg-white rounded p-2 mt-2">
  <div class="text-cyan-600 font-semibold text-xs mb-1">⚡ 速度设置参数:</div>
  <div class="text-xs">
    <div><strong>目标速度:</strong> {{ packet.parsedPacket.parsedData.setSpeedParam.speed }} m/s</div>
  </div>
</div>
```

### 2. 响应式计算
使用 Vue 的计算属性来实时统计不同类型的数据包：

```javascript
const platformCmdCount = computed(() => {
  return packets.value.filter(p => p.parsedPacket?.packageType === 0x2A).length;
});
```

### 3. 数据验证
在显示前验证数据的完整性，避免显示错误信息：

```vue
<div v-if="packet.parsedPacket.parsedData.setSpeedParam" ...>
  <!-- 只有当setSpeedParam存在时才显示 -->
</div>
```

## 兼容性

### 向后兼容
- 保持对现有命令类型的完整支持
- 不影响其他数据包类型的显示
- 保持原有的界面布局和交互逻辑

### 扩展性
- 命令名称映射支持新增命令类型
- 参数显示区域支持新增参数类型
- 统计功能支持新增数据包类型

## 测试验证

### 功能测试
- ✅ 速度设置命令正确解析和显示
- ✅ 所有现有命令类型正常显示
- ✅ 统计信息准确计算
- ✅ 界面布局适配良好

### 边界测试
- ✅ 缺少参数时的容错处理
- ✅ 未知命令类型的降级显示
- ✅ 大量航点的折叠显示
- ✅ 长文本的截断处理

这些更新确保了组播监听页面能够完整地显示和解析新增的速度设置命令，同时保持了良好的用户体验和系统稳定性。