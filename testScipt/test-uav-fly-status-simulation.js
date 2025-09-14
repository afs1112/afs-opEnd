const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket用于发送组播数据
const sender = dgram.createSocket('udp4');

// 组播地址和端口
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

// 加载protobuf定义
let root = null;
let UavFlyStatusInfo = null;

// 航迹模拟参数
let currentPosition = {
  longitude: 106.319248,  // 新的起始位置
  latitude: 36.221109,
  altitude: 1000
};

let flightParams = {
  speed: 120.5,           // 飞行速度 km/h
  heading: 45.0,          // 航向角度
  roll: 0.0,              // 横滚角
  pitch: 0.0,             // 俯仰角
  altitude: 1000,         // 高度
  throttle: 75.0,         // 油门
  engineRpm: 2500,        // 发动机转速
  oilQuantity: 100.0,     // 油量百分比
  temperature: 85.0       // 发动机温度
};

let simulationTime = 0;  // 模拟时间（秒）

async function loadProtobufDefinitions() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');

    root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UaviationSimulationStruct.proto')
    ]);

    UavFlyStatusInfo = root.lookupType('UaviationSimulation.UavFlyStatusInfo');
    console.log('Protobuf定义文件加载成功');
  } catch (error) {
    console.error('加载Protobuf定义文件失败:', error);
    process.exit(1);
  }
}

// 更新航迹位置（模拟飞行轨迹）
function updateFlightTrack() {
  simulationTime += 2; // 每2秒更新一次

  // 计算位移（简化的地球坐标计算）
  const speedMs = flightParams.speed * 1000 / 3600; // 转换为米/秒
  const distancePerUpdate = speedMs * 2; // 2秒内的距离

  // 将距离转换为经纬度变化（粗略计算）
  const deltaLat = (distancePerUpdate * Math.cos(flightParams.heading * Math.PI / 180)) / 111000; // 1度纬度约111km
  const deltaLon = (distancePerUpdate * Math.sin(flightParams.heading * Math.PI / 180)) / (111000 * Math.cos(currentPosition.latitude * Math.PI / 180));

  currentPosition.latitude += deltaLat;
  currentPosition.longitude += deltaLon;

  // 模拟高度变化
  currentPosition.altitude += Math.sin(simulationTime * 0.01) * 10;

  // 模拟姿态变化
  flightParams.roll = Math.sin(simulationTime * 0.05) * 5; // ±5度横滚
  flightParams.pitch = Math.sin(simulationTime * 0.03) * 3; // ±3度俯仰

  // 模拟发动机参数变化
  flightParams.throttle = 75 + Math.sin(simulationTime * 0.02) * 10; // 65-85%
  flightParams.engineRpm = 2500 + Math.sin(simulationTime * 0.02) * 200; // 2300-2700 RPM
  flightParams.temperature = 85 + Math.sin(simulationTime * 0.01) * 5; // 80-90度

  // 模拟油量消耗
  flightParams.oilQuantity = Math.max(0, 100 - simulationTime * 0.01); // 缓慢消耗

  // 每30秒改变一次航向（模拟转弯）
  if (simulationTime % 30 === 0) {
    flightParams.heading += (Math.random() - 0.5) * 60; // ±30度随机转向
    if (flightParams.heading < 0) flightParams.heading += 360;
    if (flightParams.heading >= 360) flightParams.heading -= 360;
  }
}

// 创建符合协议格式的数据包
function createProtocolPacket(protobufData, packageType = 0x01, protocolID = 0x00) {
  const dataLength = protobufData.length;

  // 创建协议头: AA55 + 协议ID + 包类型 + 数据长度(4字节小端序) + 数据
  const packet = Buffer.allocUnsafe(8 + dataLength);

  packet[0] = 0xAA;  // 协议头1
  packet[1] = 0x55;  // 协议头2
  packet[2] = protocolID;  // 0议ID
  packet[3] = packageType; // 包类型
  packet.writeUInt32LE(dataLength, 4); // 数据长度(小端序)

  // 复制protobuf数据
  protobufData.copy(packet, 8);

  return packet;
}

// 创建UavFlyStatusInfo数据
function createUavFlyStatusData() {
  updateFlightTrack();

  const flyStatusData = {
    uavID: 1, // 固定使用ID为1
    coord: {
      longitude: currentPosition.longitude,
      latitude: currentPosition.latitude,
      altitude: currentPosition.altitude
    },
    attitudeInfo: {
      roll: flightParams.roll,
      pitch: flightParams.pitch,
      yaw: flightParams.heading,
      speed: flightParams.speed,
      indicated_airspeed: flightParams.speed * 0.9, // 指示空速略小于真空速
      ground_speed: flightParams.speed,
      height: currentPosition.altitude,
      high_pressure: currentPosition.altitude * 0.98, // 气压高度
      high_satellite: currentPosition.altitude * 1.02  // 卫星高度
    },
    cylinderTemperatureInfo: {
      temperature1: flightParams.temperature,
      temperature2: flightParams.temperature + 1,
      temperature3: flightParams.temperature - 1,
      temperature4: flightParams.temperature + 0.5
    },
    engineDisplay: {
      throttle_butterfly: flightParams.throttle,
      air_passage: flightParams.throttle * 1.1,
      rotate_speed: flightParams.engineRpm,
      oil_quantity: flightParams.oilQuantity,
      cylinder_temperature: {
        temperature1: flightParams.temperature,
        temperature2: flightParams.temperature + 2,
        temperature3: flightParams.temperature - 1,
        temperature4: flightParams.temperature + 1
      }
    },
    dataChainInfo: {
      // 链路信息暂时为空
    },
    flyStatus: {
      control_value: {
        elevator: flightParams.pitch * 0.1,      // 升降舵与俯仰角相关
        left_aileron: -flightParams.roll * 0.1,  // 左副翼与横滚角相关
        right_aileron: flightParams.roll * 0.1,  // 右副翼与横滚角相关
        damper: 0.0,
        airway: flightParams.throttle
      },
      output_value: {
        elevator: flightParams.pitch * 0.08,
        left_aileron: -flightParams.roll * 0.08,
        right_aileron: flightParams.roll * 0.08,
        damper: 0.0,
        airway: flightParams.throttle * 0.95
      },
      voltage_value: {
        voltage1: 24.5 + Math.random() * 0.5,    // 24.5-25V
        voltage2: 24.3 + Math.random() * 0.5,    // 24.3-24.8V
        voltageComputer: 12.1 + Math.random() * 0.2 // 12.1-12.3V
      },
      main_angular_rate_value: {
        pitch: flightParams.pitch * 0.5,
        roll: flightParams.roll * 0.5,
        yaw: (Math.random() - 0.5) * 2,
        acceleration: Math.random() * 0.5
      },
      bak_angular_rate_value: {
        pitch: flightParams.pitch * 0.48,
        roll: flightParams.roll * 0.48,
        yaw: (Math.random() - 0.5) * 1.8,
        acceleration: Math.random() * 0.45
      },
      other_status_value: {
        cylinderTemperature: {
          temperature1: flightParams.temperature,
          temperature2: flightParams.temperature + 1,
          temperature3: flightParams.temperature - 1,
          temperature4: flightParams.temperature + 0.5
        },
        atmospheric_temperature: 15 + Math.random() * 10, // 15-25度环境温度
        ignition_damping: 0.1 + Math.random() * 0.1
      }
    },
    flyWarningInfo: {
      fly_stop_state: 0,        // 正常
      height_state: currentPosition.altitude < 500 ? 1 : 0,  // 低高度警告
      speed_state: flightParams.speed < 80 ? 1 : 0,          // 低速警告
      atttiude_state: Math.abs(flightParams.roll) > 30 ? 1 : 0, // 姿态警告
      engine_state: flightParams.temperature > 90 ? 1 : 0,   // 发动机温度警告
      elec_pressure_state: 0,   // 电压正常
      self_check_state: 0,      // 自检正常
      allow_open_umbrella_state: 0,
      cabin_door_opened_state: 0,
      mid_the_platform_state: 0,
      light_closed_state: 0
    },
    otherInfoExtra: {
      currentExecuteState: getFlightState(),
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };

  const message = UavFlyStatusInfo.create(flyStatusData);
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();

  // 创建符合协议格式的完整数据包
  const packet = createProtocolPacket(protobufBuffer, 0x01, 0x01);
  return packet;
}

// 获取飞行状态描述
function getFlightState() {
  if (flightParams.oilQuantity < 20) return "低油量警告";
  if (currentPosition.altitude < 500) return "低空飞行";
  if (flightParams.speed < 80) return "低速飞行";
  if (Math.abs(flightParams.roll) > 20) return "大坡度转弯";
  return "正常巡航";
}

// 发送数据
function sendUavFlyStatusData() {
  const data = createUavFlyStatusData();

  sender.send(data, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('发送失败:', err);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ 发送无人机飞行状态数据`);
      console.log(`  📍 位置: ${currentPosition.latitude.toFixed(6)}, ${currentPosition.longitude.toFixed(6)}, ${currentPosition.altitude.toFixed(1)}m`);
      console.log(`  🛩️  姿态: 横滚=${flightParams.roll.toFixed(1)}°, 俯仰=${flightParams.pitch.toFixed(1)}°, 航向=${flightParams.heading.toFixed(1)}°`);
      console.log(`  ⚡ 速度: ${flightParams.speed.toFixed(1)} km/h, 油量: ${flightParams.oilQuantity.toFixed(1)}%`);
      console.log(`  📊 协议: AA55 01 01, 数据长度: ${data.length - 8} 字节, 总包长: ${data.length} 字节`);
      console.log(`  🔄 状态: ${getFlightState()}`);
      console.log('---');
    }
  });
}

// 主函数
async function main() {
  await loadProtobufDefinitions();

  console.log('开始发送无人机飞行状态模拟数据...');
  console.log(`目标地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log(`无人机ID: 1`);
  console.log(`起始位置: ${currentPosition.latitude}°N, ${currentPosition.longitude}°E`);
  console.log('按 Ctrl+C 停止');
  console.log('===================================');

  // 立即发送一次
  sendUavFlyStatusData();

  // 每2秒发送一次飞行状态数据（模拟实时航迹）
  const interval = setInterval(sendUavFlyStatusData, 2000);

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n停止发送模拟数据...');
    clearInterval(interval);
    sender.close();
    process.exit(0);
  });
}

// 启动
main().catch(console.error);