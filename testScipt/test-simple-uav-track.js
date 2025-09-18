const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket
const sender = dgram.createSocket('udp4');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let UavFlyStatusInfo = null;

// 简单的航迹点数组（模拟一个矩形飞行路径）
const flightPath = [
  { lat: 36.221109, lon: 106.319248, alt: 1000 }, // 起点：新坐标
  { lat: 36.231109, lon: 106.319248, alt: 1100 }, // 北飞 (+0.01度纬度)
  { lat: 36.231109, lon: 106.329248, alt: 1200 }, // 东飞 (+0.01度经度)
  { lat: 36.221109, lon: 106.329248, alt: 1100 }, // 南飞 (回到原纬度)
  { lat: 36.221109, lon: 106.319248, alt: 1000 }  // 西飞回起点
];

let currentWaypointIndex = 0;
let progress = 0; // 0-1之间，表示到下一个航点的进度

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UaviationSimulationStruct.proto')
    ]);

    UavFlyStatusInfo = root.lookupType('UaviationSimulation.UavFlyStatusInfo');
    console.log('✓ Protobuf加载成功');
  } catch (error) {
    console.error('✗ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 线性插值计算当前位置
function getCurrentPosition() {
  const current = flightPath[currentWaypointIndex];
  const next = flightPath[(currentWaypointIndex + 1) % flightPath.length];

  return {
    latitude: current.lat + (next.lat - current.lat) * progress,
    longitude: current.lon + (next.lon - current.lon) * progress,
    altitude: current.alt + (next.alt - current.alt) * progress
  };
}

// 更新航迹进度
function updateProgress() {
  progress += 0.05; // 每次增加5%

  if (progress >= 1.0) {
    progress = 0;
    currentWaypointIndex = (currentWaypointIndex + 1) % flightPath.length;
    console.log(`→ 航向下一个航点: ${currentWaypointIndex + 1}/${flightPath.length}`);
  }
}

// 创建符合协议格式的数据包
function createProtocolPacket(protobufData, packageType = 0x01, protocolID = 0x01) {
  const dataLength = protobufData.length;

  // 创建协议头: AA55 + 协议ID + 包类型 + 数据长度(4字节小端序) + 数据
  const packet = Buffer.allocUnsafe(8 + dataLength);

  packet[0] = 0xAA;  // 协议头1
  packet[1] = 0x55;  // 协议头2
  packet[2] = protocolID;  // 协议ID
  packet[3] = packageType; // 包类型
  packet.writeUInt32LE(dataLength, 4); // 数据长度(小端序)

  // 复制protobuf数据
  protobufData.copy(packet, 8);

  return packet;
}

// 创建飞行状态数据
function createFlyStatusMessage() {
  const position = getCurrentPosition();

  const data = {
    uavID: 0,
    coord: {
      longitude: position.longitude,
      latitude: position.latitude,
      altitude: position.altitude
    },
    attitudeInfo: {
      roll: Math.sin(Date.now() * 0.001) * 2,    // 轻微横滚 ±2°
      pitch: Math.sin(Date.now() * 0.0008) * 1,  // 轻微俯仰 ±1°
      yaw: 45 + currentWaypointIndex * 90,       // 根据航段调整航向
      speed: 120,
      height: position.altitude
    },
    cylinderTemperatureInfo: {
      temperature1: 85 + Math.random() * 2,
      temperature2: 86 + Math.random() * 2,
      temperature3: 84 + Math.random() * 2,
      temperature4: 85 + Math.random() * 2
    },
    engineDisplay: {
      throttle_butterfly: 75,
      rotate_speed: 2500,
      oil_quantity: 90 - (Date.now() % 100000) * 0.0001 // 缓慢消耗
    },
    flyWarningInfo: {
      fly_stop_state: 0,
      height_state: 0,
      speed_state: 0,
      atttiude_state: 0,
      engine_state: 0
    },
    otherInfoExtra: {
      currentExecuteState: "自动巡航",
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };

  const message = UavFlyStatusInfo.create(data);
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();

  // 创建符合协议格式的完整数据包
  return createProtocolPacket(protobufBuffer, 0x01, 0x01);
}

// 发送数据
function sendData() {
  updateProgress();

  const packet = createFlyStatusMessage(); // 已经包含完整协议格式

  sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('✗ 发送失败:', err);
    } else {
      const pos = getCurrentPosition();
      console.log(`[${new Date().toLocaleTimeString()}] ✅ 发送航迹数据`);
      console.log(`  📍 坐标: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`);
      console.log(`  🛩️  高度: ${pos.altitude.toFixed(1)}m | 航点: ${currentWaypointIndex + 1}/${flightPath.length} (${(progress * 100).toFixed(1)}%)`);
      console.log(`  📊 协议: AA55 01 01, 总包长: ${packet.length} 字节`);
    }
  });
}

async function main() {
  await loadProtobuf();

  console.log('🚁 无人机航迹模拟器启动');
  console.log(`📡 组播地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log(`🆔 无人机ID: 1`);
  console.log(`🗺️  航迹点数: ${flightPath.length}`);
  console.log(`📍 起始坐标: ${flightPath[0].lat}°N, ${flightPath[0].lon}°E`);
  console.log('按 Ctrl+C 停止\n');

  // 立即发送一次
  sendData();

  // 每2秒发送一次
  const timer = setInterval(sendData, 2000);

  process.on('SIGINT', () => {
    console.log('\n🛑 停止模拟...');
    clearInterval(timer);
    sender.close();
    process.exit(0);
  });
}

main().catch(console.error);