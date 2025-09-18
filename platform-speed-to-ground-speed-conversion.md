# 平台Speed转换为Ground Speed功能实现

## 概述

在同步无人机状态功能时，需要将从platforms里获取的speed字段转换为protobuf协议中的`ground_speed`字段（地速）。

## 实现详情

### 1. Protobuf定义

在`src/protobuf/UaviationSimulationStruct.proto`中，`UavAttitudeDisplay`消息包含以下速度相关字段：

```protobuf
message UavAttitudeDisplay
{
    optional double roll                 = 1;    //横滚
    optional double pitch                = 2;    //俯仰
    optional double yaw                  = 3;    //偏航
    optional double speed                = 4;    //速度
    optional double indicated_airspeed   = 5;    //指示空速
    optional double ground_speed         = 6;    //地速
    optional double height               = 7;    //高度
    optional double high_pressure        = 8;    //气压计
    optional double high_satellite       = 9;    //卫星高
}
```

### 2. 字段命名转换

由于protobuf.js会将snake_case字段名转换为camelCase，实际在JavaScript代码中使用的字段名为：
- `ground_speed` → `groundSpeed`
- `indicated_airspeed` → `indicatedAirspeed`
- `high_pressure` → `highPressure`
- `high_satellite` → `highSatellite`

### 3. 代码修改

#### 3.1 MulticastSenderService修改

在`src/main/services/multicast-sender.service.ts`中，修改了两个方法：

**方法1：syncTrajectoryDataWithPlatform**
```typescript
// 提取姿态信息 (如果没有姿态数据，使用0作为默认值)
const attitudeInfo = {
  roll: platformBase.roll || 0,
  pitch: platformBase.pitch || 0,
  yaw: platformBase.yaw || 0,
  speed: platformBase.speed || 0,
  indicatedAirspeed: (platformBase.speed || 0) * 0.95, // 指示空速略小于地速
  groundSpeed: platformBase.speed || 0,  // 地速：从platforms里拿到的speed转换为groundSpeed
  height: coord.altitude
};
```

**方法2：syncTrajectoryData**
```typescript
attitudeInfo: {
  roll: Math.sin(Date.now() * 0.001) * 2,    // 轻微横滚 ±2°
  pitch: Math.sin(Date.now() * 0.0008) * 1,  // 轻微俯仰 ±1°
  yaw: 45 + Math.random() * 90,              // 随机航向
  speed: 120,
  indicatedAirspeed: 114,                    // 指示空速略小于地速
  groundSpeed: 120,                          // 地速：模拟数据中的固定值
  height: 1000 + Math.random() * 200
},
```

### 4. 转换逻辑

1. **数据来源**：从platforms数据结构中获取`speed`字段值
2. **转换规则**：
   - `groundSpeed` = `platformBase.speed` （地速直接使用平台速度）
   - `indicatedAirspeed` = `platformBase.speed * 0.95` （指示空速略小于地速）
   - `speed` = `platformBase.speed` （保持原有字段兼容性）

### 5. 测试验证

创建了测试脚本验证转换功能：

- `testScipt/test-platform-speed-to-ground-speed.js` - 完整的转换功能测试
- `testScipt/test-ground-speed-field.js` - 基础字段设置和读取测试

测试结果显示：
- ✅ platforms中的speed字段正确转换为protobuf中的groundSpeed字段
- ✅ 同时保留了speed和indicatedAirspeed字段以保持兼容性
- ✅ 数据包可以正常编码和解码

### 6. 使用示例

```javascript
// 从platforms获取的数据
const platformData = {
  name: "测试平台-001",
  base: {
    speed: 85.5,  // 平台速度 m/s
    location: { longitude: 106.319248, latitude: 36.221109, altitude: 1200 },
    roll: 1.5, pitch: -0.8, yaw: 120.0
  }
};

// 转换后的UavFlyStatusInfo数据
const uavStatusData = {
  uavID: 1001,
  attitudeInfo: {
    speed: 85.5,              // 原始速度
    indicatedAirspeed: 81.225, // 指示空速 (95%的地速)
    groundSpeed: 85.5,        // 地速 (关键字段)
    roll: 1.5, pitch: -0.8, yaw: 120.0
  }
  // ... 其他字段
};
```

## 总结

通过这次修改，成功实现了在同步无人机状态时，将platforms里的speed字段转换为protobuf协议中的`ground_speed`字段。这确保了数据的正确传输和协议的完整性。