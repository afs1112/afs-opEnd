# 无人机飞行状态模拟测试脚本

本目录包含两个用于模拟 UavFlyStatusInfo 消息的测试脚本，用于测试无人机飞行状态数据的发送和接收。

## 脚本说明

### 1. test-uav-fly-status-simulation.js
**完整功能模拟器**

- ✅ 完整的 UavFlyStatusInfo 消息结构
- ✅ 真实的飞行物理模拟（速度、姿态、发动机参数）
- ✅ 渐进式地理位置更新（模拟真实航迹）
- ✅ 动态参数变化（油量消耗、温度变化、姿态调整）
- ✅ 智能航向变化（每30秒随机转向）
- ✅ 状态警告模拟（低油量、低高度等）

### 2. test-simple-uav-track.js  
**简化航迹模拟器**

- ✅ 预定义矩形航迹路径
- ✅ 线性插值位置计算
- ✅ 简化的飞行参数
- ✅ 清晰的进度显示
- ✅ 轻量级实现

## 使用方法

### 安装依赖
```bash
npm install protobufjs
```

### 运行完整模拟器
```bash
node testScipt/test-uav-fly-status-simulation.js
```

### 运行简化模拟器
```bash
node testScipt/test-simple-uav-track.js
```

## 消息格式

### 数据包结构
```
[0xAA] + [0x55] + [协议ID: 0x01] + [包类型: 0x01] + [数据长度: 4字节小端序] + [Protobuf编码的UavFlyStatusInfo数据]
```

**协议格式说明:**
- `0xAA 0x55`: 固定协议头，用于包同步
- `协议ID`: 0x01 (固定值)
- `包类型`: 0x01 (表示飞行状态信息)
- `数据长度`: 4字节小端序，表示后续Protobuf数据的长度
- `Protobuf数据`: UavFlyStatusInfo消息的二进制编码

### 组播配置
- **地址**: 239.255.43.21
- **端口**: 10086
- **协议**: UDP
- **频率**: 每2秒发送一次

## UavFlyStatusInfo 消息内容

| 字段 | 类型 | 说明 |
|------|------|------|
| uavID | int32 | 无人机ID（固定为1） |
| coord | GeoCoordinate | 地理坐标（经度、纬度、高度） |
| attitudeInfo | UavAttitudeDisplay | 姿态信息（横滚、俯仰、航向、速度等） |
| cylinderTemperatureInfo | UavTemperature | 缸温信息 |
| engineDisplay | UavEngineDisplay | 发动机信息（油门、转速、油量等） |
| dataChainInfo | DataChainDisplay | 链路信息 |
| flyStatus | UavFlyStatus | 飞行参数（控制量、输出量、电压等） |
| flyWarningInfo | FlyWarningInfo | 预警信息 |
| otherInfoExtra | OtherInfoExtra | 其他信息 |

## 航迹特点

### 完整模拟器航迹
- 起始位置：指定坐标 (36.221109°N, 106.319248°E)
- 飞行模式：连续飞行，动态航向变化
- 高度变化：1000m ± 正弦波动
- 姿态变化：模拟真实飞行中的小幅摆动

### 简化模拟器航迹
- 矩形路径：起始点 → 北 → 东 → 南 → 西 → 回起点
- 航点间线性插值
- 高度变化：1000m - 1200m
- 固定航向：根据航段自动调整

## 监控输出

### 完整模拟器输出示例
```
[14:30:15] 发送无人机飞行状态数据
  位置: 36.221456, 106.319523, 1005.2m
  姿态: 横滚=2.1°, 俯仰=1.3°, 航向=67.5°
  速度: 120.5 km/h, 油量: 89.2%
  状态: 正常巡航
---
```

### 简化模拟器输出示例
```
[14:30:15] ✓ 发送航迹数据
  坐标: 36.221456, 106.319523
  高度: 1005.1m | 航点: 2/5 (35.0%)
```

## 协议兼容性

✅ **已修正**: 脚本现在完全遵循你的 multicast.service.ts 中定义的协议格式
- 包含正确的协议头 `0xAA 0x55`
- 协议ID和包类型字段
- 小端序数据长度字段
- 完整的Protobuf数据负载

## 注意事项

1. **protobuf 文件路径**: 脚本会自动查找 `src/protobuf/` 目录下的 .proto 文件
2. **无人机ID**: 两个脚本都使用固定的 uavID = 1
3. **网络配置**: 确保组播地址 239.255.43.21 在你的网络环境中可用
4. **停止方式**: 使用 Ctrl+C 优雅停止脚本
5. **协议格式**: 数据包现在完全符合你的接收端期望的格式

## 扩展建议

- 可以修改 `flightPath` 数组来自定义航迹
- 可以调整发送频率（当前为2秒）
- 可以添加多架无人机模拟（修改 uavID）
- 可以集成 GPS 轨迹文件导入功能