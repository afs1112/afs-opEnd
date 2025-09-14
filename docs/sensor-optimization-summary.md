# 传感器命令优化总结

## 概述

基于你的反馈，我们将光电吊舱和激光吊舱统一为传感器控制，并对整个命令系统进行了优化。这次优化使系统更加统一、直观和易用。

## 主要改进

### 1. Proto文件优化

**修改前：**
```proto
message SensorParam {
  optional string weaponName = 1;//武器类型实例化的名称
  optional double azSlew = 2;  //方位角
  optional double elSlew = 3;	//俯仰角
}
```

**修改后：**
```proto
message SensorParam {
  optional string sensorName = 1;//传感器名称
  optional double azSlew = 2;  //方位角
  optional double elSlew = 3;	//俯仰角
}
```

**改进点：**
- 将 `weaponName` 改为 `sensorName`，更准确地反映字段用途
- 统一了传感器参数的命名规范

### 2. 命令枚举优化

**修改前：**
```javascript
const PlatformCommandEnum = {
  'Uav_EoPod_On': 1,
  'Uav_EoPod_Off': 2,
  'Uav_EoPod_Turn': 3,
  'Uav_LazerPod_On': 4,
  'Uav_LazerPod_Off': 5,
  'Uav_LazerPod_Turn': 6,
  'Uav_LazerPod_Lasing': 7,
  'Uav_LazerPod_Cease': 8,
  // ...
};
```

**修改后：**
```javascript
const PlatformCommandEnum = {
  'Uav_Sensor_On': 1,      // 传感器开
  'Uav_Sensor_Off': 2,     // 传感器关
  'Uav_Sensor_Turn': 3,    // 传感器转向
  'Uav_LazerPod_Lasing': 4, // 激光吊舱照射
  'Uav_LazerPod_Cease': 5,  // 激光吊舱停止照射
  // ...
};
```

**改进点：**
- 统一传感器开关命令，适用于所有传感器类型
- 激光功能作为特殊能力独立出来
- 减少了命令数量，提高了系统一致性

### 3. 用户界面优化

**修改前：**
- 分别有"光电吊舱"和"激光吊舱"两个独立的控制区域
- 每种吊舱都有独立的开关和转向命令

**修改后：**
- 统一的"传感器控制"区域，适用于所有传感器
- 独立的"激光功能"区域，仅对激光传感器启用
- 智能显示当前传感器类型和状态

**界面改进：**
```vue
<!-- 传感器控制命令 -->
<div class="border rounded-lg p-4">
  <h4 class="font-medium text-gray-700 mb-3">传感器控制</h4>
  <div class="space-y-2">
    <div class="text-xs text-gray-500 mb-2">
      当前传感器: {{ selectedSensor || '未选择' }}
      <span v-if="selectedSensor" class="ml-2 px-2 py-1 rounded text-xs" 
            :class="isLaserSensor ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'">
        {{ getCurrentSensorType() }}
      </span>
    </div>
    <!-- 统一的传感器控制按钮 -->
  </div>
</div>

<!-- 激光功能命令 -->
<div class="border rounded-lg p-4">
  <h4 class="font-medium text-gray-700 mb-3">激光功能</h4>
  <div class="space-y-2">
    <div class="text-xs text-gray-500 mb-2">
      {{ isLaserSensor ? '激光传感器已选择' : '需要选择激光传感器' }}
    </div>
    <!-- 激光专用功能按钮 -->
  </div>
</div>
```

### 4. 逻辑优化

**新增功能：**

1. **智能传感器类型识别：**
```javascript
const isLaserSensor = computed(() => {
  const platform = platforms.value.find(p => p.name === selectedPlatform.value);
  const sensor = platform?.sensors.find(s => s.name === selectedSensor.value);
  return sensor?.type?.toLowerCase().includes('laser') || 
         sensor?.name?.toLowerCase().includes('laser') || false;
});
```

2. **统一的传感器命令发送：**
```javascript
const sendSensorCommand = async (command: string) => {
  const commandData = {
    commandID: Date.now(),
    platformName: selectedPlatform.value,
    command: PlatformCommandEnum[command],
    sensorParam: {
      sensorName: selectedSensor.value,  // 使用sensorName
      azSlew: 0,
      elSlew: 0
    }
  };
  // 发送逻辑...
};
```

3. **独立的激光命令发送：**
```javascript
const sendLaserCommand = async (command: string) => {
  // 仅对激光传感器有效的命令
};
```

### 5. 数据结构优化

**增强的模拟数据：**
```javascript
const platforms = [
  {
    name: 'UAV-001',
    sensors: [
      { name: 'EO-Pod-1', type: 'Electro-Optical' },
      { name: 'Laser-Pod-1', type: 'Laser-Designator' },
      { name: 'IR-Sensor-1', type: 'Infrared' }
    ],
    // ...
  },
  {
    name: 'ARTY-001',
    sensors: [
      { name: 'Fire-Control-Radar', type: 'Fire-Control' },
      { name: 'Laser-Rangefinder', type: 'Laser-Rangefinder' }
    ],
    // ...
  }
];
```

## 优化效果

### 1. 系统一致性
- 所有传感器使用统一的开关和转向命令
- 激光功能作为传感器的特殊能力处理
- 命令结构更加清晰和一致

### 2. 用户体验
- 更直观的界面布局
- 智能的按钮启用/禁用逻辑
- 清晰的传感器类型显示

### 3. 代码质量
- 减少了重复代码
- 提高了代码复用性
- 更好的可维护性

### 4. 扩展性
- 新增传感器类型时无需修改基础命令
- 激光功能可以轻松扩展到其他传感器
- 更灵活的命令组合

## 测试验证

我们创建了全面的测试套件来验证优化效果：

```bash
node testScipt/test-sensor-optimization-v2.js
```

**测试结果：**
- ✅ 传感器类型识别测试通过
- ✅ 统一传感器命令测试通过
- ✅ 激光功能命令测试通过
- ✅ 命令启用逻辑测试通过
- ✅ Protobuf结构兼容性测试通过
- ✅ UI组件逻辑测试通过

**总计：6/6 测试通过**

## 使用指南

### 1. 传感器控制
1. 选择平台和传感器
2. 使用"传感器控制"区域的按钮进行基本操作：
   - 传感器开启/关闭
   - 传感器转向（需要设置角度参数）

### 2. 激光功能
1. 选择具有激光能力的传感器（类型包含"Laser"）
2. 使用"激光功能"区域的按钮：
   - 激光照射
   - 停止照射

### 3. 传感器类型识别
- 系统自动识别传感器类型
- 激光传感器显示红色标签
- 普通传感器显示蓝色标签

## 后续建议

1. **主进程IPC处理：** 需要在主进程中添加对应的平台命令处理逻辑
2. **组播发送：** 确保组播发送器能正确处理新的命令结构
3. **错误处理：** 增强错误处理和用户反馈机制
4. **日志记录：** 完善命令发送的日志记录功能

## 总结

这次优化成功地将分散的传感器控制统一为一个更加一致和直观的系统。通过将光电吊舱和激光吊舱视为不同类型的传感器，我们不仅简化了用户界面，还提高了系统的可扩展性和维护性。新的设计更好地反映了实际的硬件架构，使系统更加符合用户的心理模型。