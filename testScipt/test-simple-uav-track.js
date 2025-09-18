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
  { lat: 36.221109, lon: 106.319248, alt: 1000, heading: 0 },   // 起点：新坐标，航向北
  { lat: 36.231109, lon: 106.319248, alt: 1100, heading: 90 },  // 北飞，转向东
  { lat: 36.231109, lon: 106.329248, alt: 1200, heading: 180 }, // 东飞，转向南
  { lat: 36.221109, lon: 106.329248, alt: 1100, heading: 270 }, // 南飞，转向西
  { lat: 36.221109, lon: 106.319248, alt: 1000, heading: 0 }    // 西飞回起点，转向北
];

let currentWaypointIndex = 0;
let progress = 0; // 0-1之间，表示到下一个航点的进度
let baseTime = Date.now(); // 用于计算时间相关的变化

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

// 计算两点间的航向角（度）
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // 确保结果在0-360度之间
}

// 线性插值计算当前位置和航向
function getCurrentPosition() {
  const current = flightPath[currentWaypointIndex];
  const next = flightPath[(currentWaypointIndex + 1) % flightPath.length];

  // 计算当前位置
  const position = {
    latitude: current.lat + (next.lat - current.lat) * progress,
    longitude: current.lon + (next.lon - current.lon) * progress,
    altitude: current.alt + (next.alt - current.alt) * progress
  };

  // 计算真实航向角
  let targetHeading = calculateBearing(current.lat, current.lon, next.lat, next.lon);

  // 在转弯时添加平滑的航向变化
  let currentHeading = current.heading;

  // 处理航向角的跨越360度问题
  let headingDiff = targetHeading - currentHeading;
  if (headingDiff > 180) headingDiff -= 360;
  if (headingDiff < -180) headingDiff += 360;

  // 在航段的前30%进行转弯
  if (progress < 0.3) {
    const turnProgress = progress / 0.3;
    currentHeading = currentHeading + headingDiff * turnProgress;
  } else {
    currentHeading = targetHeading;
  }

  // 添加轻微的航向摆动（模拟真实飞行中的小幅调整）
  const timeOffset = (Date.now() - baseTime) * 0.001;
  const headingOscillation = Math.sin(timeOffset * 2) * 2; // ±2度的摆动

  position.yaw = (currentHeading + headingOscillation + 360) % 360;

  return position;
}

// 更新航迹进度
function updateProgress() {
  progress += 0.03; // 每次增加3%，让转弯更平滑

  if (progress >= 1.0) {
    progress = 0;
    const prevWaypoint = currentWaypointIndex + 1;
    currentWaypointIndex = (currentWaypointIndex + 1) % flightPath.length;
    const nextWaypoint = currentWaypointIndex + 1;

    console.log(`→ 完成航段 ${prevWaypoint}，航向下一个航点: ${nextWaypoint}/${flightPath.length}`);

    // 显示航向变化信息
    const current = flightPath[currentWaypointIndex];
    const next = flightPath[(currentWaypointIndex + 1) % flightPath.length];
    const newHeading = calculateBearing(current.lat, current.lon, next.lat, next.lon);
    console.log(`  🧭 新航向: ${newHeading.toFixed(1)}°`);
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
  const timeOffset = (Date.now() - baseTime) * 0.001;

  // 在转弯时增加横滚角
  let rollAngle = Math.sin(timeOffset) * 1; // 基础横滚 ±1°

  // 如果在转弯阶段（progress < 0.3），增加转弯横滚
  if (progress < 0.3) {
    const current = flightPath[currentWaypointIndex];
    const next = flightPath[(currentWaypointIndex + 1) % flightPath.length];
    const targetHeading = calculateBearing(current.lat, current.lon, next.lat, next.lon);

    let headingDiff = targetHeading - current.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    // 根据转弯方向和角度增加横滚
    const turnIntensity = Math.abs(headingDiff) / 90; // 90度转弯为最大强度
    rollAngle += (headingDiff > 0 ? 15 : -15) * turnIntensity * (progress / 0.3);
  }

  const data = {
    uavID: 8086,
    coord: {
      longitude: position.longitude,
      latitude: position.latitude,
      altitude: position.altitude
    },
    attitudeInfo: {
      roll: rollAngle,                           // 动态横滚角，转弯时更明显
      pitch: Math.sin(timeOffset * 0.8) * 1.5,  // 轻微俯仰 ±1.5°
      yaw: position.yaw,                         // 使用计算出的真实航向角
      speed: 120,
      indicatedAirspeed: 114,                    // 指示空速
      groundSpeed: 120,                          // 地速
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
      const timeOffset = (Date.now() - baseTime) * 0.001;

      // 计算当前转弯状态
      let turnStatus = "直飞";
      let rollAngle = Math.sin(timeOffset) * 1;

      if (progress < 0.3) {
        turnStatus = "转弯中";
        const current = flightPath[currentWaypointIndex];
        const next = flightPath[(currentWaypointIndex + 1) % flightPath.length];
        const targetHeading = calculateBearing(current.lat, current.lon, next.lat, next.lon);

        let headingDiff = targetHeading - current.heading;
        if (headingDiff > 180) headingDiff -= 360;
        if (headingDiff < -180) headingDiff += 360;

        const turnIntensity = Math.abs(headingDiff) / 90;
        rollAngle += (headingDiff > 0 ? 15 : -15) * turnIntensity * (progress / 0.3);
        turnStatus = headingDiff > 0 ? "右转" : "左转";
      }

      console.log(`[${new Date().toLocaleTimeString()}] ✅ 发送航迹数据`);
      console.log(`  📍 坐标: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`);
      console.log(`  🛩️  高度: ${pos.altitude.toFixed(1)}m | 航点: ${currentWaypointIndex + 1}/${flightPath.length} (${(progress * 100).toFixed(1)}%)`);
      console.log(`  🧭 航向: ${pos.yaw.toFixed(1)}° | 横滚: ${rollAngle.toFixed(1)}° | 状态: ${turnStatus}`);
      console.log(`  📊 协议: AA55 01 01, 总包长: ${packet.length} 字节`);
    }
  });
}

async function main() {
  await loadProtobuf();

  console.log('🚁 无人机航迹模拟器启动 - 增强航向变化版本');
  console.log(`📡 组播地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log(`🆔 无人机ID: 8086`);
  console.log(`🗺️  航迹点数: ${flightPath.length}`);
  console.log(`📍 起始坐标: ${flightPath[0].lat}°N, ${flightPath[0].lon}°E`);
  console.log('🧭 航向变化说明:');
  console.log('   - 北飞: 0°   → 东飞: 90°  (右转90°)');
  console.log('   - 东飞: 90°  → 南飞: 180° (右转90°)');
  console.log('   - 南飞: 180° → 西飞: 270° (右转90°)');
  console.log('   - 西飞: 270° → 北飞: 0°   (右转90°)');
  console.log('   - 转弯时会有明显的横滚角变化');
  console.log('   - 直飞时有轻微的航向摆动和横滚');
  console.log('按 Ctrl+C 停止\n');

  // 立即发送一次
  sendData();

  // 每1.5秒发送一次，让变化更流畅
  const timer = setInterval(sendData, 1500);

  process.on('SIGINT', () => {
    console.log('\n🛑 停止模拟...');
    clearInterval(timer);
    sender.close();
    process.exit(0);
  });
}

main().catch(console.error);