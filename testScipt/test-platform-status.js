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
let messageTypes = {};

async function loadProtobufDefinitions() {
  try {
    const protobufPath = path.join(__dirname, '../src/', 'protobuf');
    
    // 加载Platform Status相关的protobuf定义
    root = await protobuf.load([
      path.join(protobufPath, 'PlatformStatus.proto')
    ]);

    // 获取消息类型
    messageTypes = {
      Platforms: root.lookupType('PlatformStatus.Platforms'),
      Platform: root.lookupType('PlatformStatus.Platform'),
      PlatformBase: root.lookupType('PlatformStatus.PlatformBase'),
      Location: root.lookupType('PlatformStatus.Location'),
      WayPoint: root.lookupType('PlatformStatus.WayPoint'),
      Mover: root.lookupType('PlatformStatus.Mover'),
      PartParam: root.lookupType('PlatformStatus.PartParam'),
      Comm: root.lookupType('PlatformStatus.Comm'),
      Sensor: root.lookupType('PlatformStatus.Sensor'),
      Weapon: root.lookupType('PlatformStatus.Weapon'),
      Track: root.lookupType('PlatformStatus.Track')
    };

    console.log('PlatformStatus Protobuf定义文件加载成功');
    console.log('可用消息类型:', Object.keys(messageTypes));
  } catch (error) {
    console.error('加载PlatformStatus Protobuf定义文件失败:', error);
    process.exit(1);
  }
}

// 创建位置信息
function createLocation(longitude, latitude, altitude) {
  return {
    longitude: longitude,
    latitude: latitude,
    altitude: altitude
  };
}

// 创建航迹点
function createWayPoint(longitude, latitude, altitude, labelName, speed) {
  return {
    longitude: longitude,
    latitude: latitude,
    altitude: altitude,
    labelName: labelName || "",
    speed: speed || 0
  };
}

// 创建推进器信息
function createMover(type, wayPoints) {
  return {
    type: type,
    route: wayPoints || []
  };
}

// 创建部件参数
function createPartParam(name, type, slewMode, minAzSlew, maxAzSlew, minElSlew, maxElSlew, currentAz, currentEl, isTurnedOn) {
  return {
    name: name,
    type: type,
    slewMode: slewMode || 0, // cSLEW_FIXED
    minAzSlew: minAzSlew || 0,
    maxAzSlew: maxAzSlew || 360,
    minElSlew: minElSlew || -90,
    maxElSlew: maxElSlew || 90,
    currentAz: currentAz || 0,
    currentEl: currentEl || 0,
    isTurnedOn: isTurnedOn || false
  };
}

// 创建通信设备
function createComm(name, type, network) {
  return {
    base: createPartParam(name, type, 0, 0, 360, -90, 90, 0, 0, true),
    network: network || "Radio"
  };
}

// 创建传感器
function createSensor(name, type, mode) {
  return {
    base: createPartParam(name, type, 3, 0, 360, -90, 90, 45, 30, true), // cSLEW_AZ_EL
    mode: mode || "Search"
  };
}

// 创建武器
function createWeapon(name, type, quantity) {
  return {
    base: createPartParam(name, type, 1, 0, 180, -10, 80, 0, 0, false), // cSLEW_AZ
    quantity: quantity || 0
  };
}

// 创建跟踪目标
function createTrack(sensorName, targetName, targetType) {
  return {
    sensorName: sensorName,
    targetName: targetName,
    targetType: targetType
  };
}

// 创建平台基础信息
function createPlatformBase(name, type, side, group, broken, location) {
  return {
    name: name,
    type: type,
    side: side,
    group: group,
    broken: broken || false,
    location: location
  };
}

// 创建单个平台数据
function createPlatform(platformId, name, type) {
  const location = createLocation(116.3974 + Math.random() * 0.01, 39.9093 + Math.random() * 0.01, 1000 + Math.random() * 500);
  
  const base = createPlatformBase(
    name,
    type,
    "友军",
    "第一编队",
    false,
    location
  );

  // 创建航迹点
  const wayPoints = [
    createWayPoint(116.3974, 39.9093, 1000, "起始点", 50),
    createWayPoint(116.4074, 39.9193, 1200, "航迹点1", 80),
    createWayPoint(116.4174, 39.9293, 1500, "目标点", 60)
  ];

  const mover = createMover("Jet Engine", wayPoints);

  // 通信设备
  const comms = [
    createComm("主通信", "UHF Radio", "UHF"),
    createComm("数据链", "Data Link", "LINK16")
  ];

  // 传感器
  const sensors = [
    createSensor("主雷达", "Search Radar", "Search"),
    createSensor("光电系统", "EO/IR", "Track")
  ];

  // 武器
  const weapons = [
    createWeapon("空空导弹", "AAM", 4),
    createWeapon("机炮", "Gun", 200)
  ];

  // 跟踪目标
  const tracks = [
    createTrack("主雷达", "敌机001", "Fighter"),
    createTrack("光电系统", "敌机002", "Bomber")
  ];

  return {
    base: base,
    updataTime: Date.now() / 1000, // 当前时间戳（秒）
    mover: mover,
    comms: comms,
    sensors: sensors,
    weapons: weapons,
    tracks: tracks
  };
}

// 创建多平台状态数据
function createPlatformsData() {
  const platforms = [
    createPlatform(1, "战斗机-001", "Fighter"),
    createPlatform(2, "轰炸机-001", "Bomber"),
    createPlatform(3, "预警机-001", "AWACS"),
    createPlatform(4, "运输机-001", "Transport")
  ];

  const platformsData = {
    platform: platforms
  };

  return platformsData;
}

// 创建带协议头的数据包
function createPlatformStatusPacket() {
  try {
    const platformsData = createPlatformsData();
    
    // 编码protobuf数据
    const message = messageTypes.Platforms.create(platformsData);
    const protobufBuffer = messageTypes.Platforms.encode(message).finish();
    
    console.log('创建的平台数据:', JSON.stringify(platformsData, null, 2));
    console.log('Protobuf编码后大小:', protobufBuffer.length, '字节');

    // 构造完整的数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
    const protocolID = 0x01; // 协议ID
    const packageType = 0x29; // PackType_PlatformStatus
    const size = protobufBuffer.length;

    // 创建包头
    const header = Buffer.alloc(8);
    header[0] = 0xAA; // 包头标识
    header[1] = 0x55; // 包头标识
    header[2] = protocolID; // 协议ID
    header[3] = packageType; // 包类型
    header.writeUInt32LE(size, 4); // protobuf数据长度（小端序）

    // 组合完整数据包
    const fullPacket = Buffer.concat([header, protobufBuffer]);
    
    console.log('数据包构造详情:', {
      总长度: fullPacket.length,
      包头: header.toString('hex'),
      协议ID: `0x${protocolID.toString(16)}`,
      包类型: `0x${packageType.toString(16)}`,
      声明大小: size,
      实际protobuf大小: protobufBuffer.length,
      完整包前16字节: fullPacket.subarray(0, Math.min(16, fullPacket.length)).toString('hex')
    });

    return fullPacket;
  } catch (error) {
    console.error('创建平台状态数据包失败:', error);
    throw error;
  }
}

// 发送数据
function sendPlatformStatusData() {
  try {
    const packet = createPlatformStatusPacket();
    
    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error('发送失败:', err);
      } else {
        console.log(`✅ 已发送平台状态数据到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
        console.log(`📦 数据包大小: ${packet.length} 字节`);
        console.log(`📋 包类型: 0x${packet[3].toString(16)} (PackType_PlatformStatus)`);
        console.log(`🔗 协议ID: 0x${packet[2].toString(16)}`);
        console.log(`⏰ 发送时间: ${new Date().toLocaleString('zh-CN')}`);
        console.log('---');
      }
    });
  } catch (error) {
    console.error('发送平台状态数据失败:', error);
  }
}

// 创建简化的单平台测试数据
function createSimplePlatformData() {
  const simplePlatform = {
    base: {
      name: "测试平台-001",
      type: "Fighter",
      side: "友军",
      group: "测试组",
      broken: false,
      location: {
        longitude: 116.3974,
        latitude: 39.9093,
        altitude: 1000
      }
    },
    updataTime: Date.now() / 1000
  };

  const platformsData = {
    platform: [simplePlatform]
  };

  return platformsData;
}

// 发送简化测试数据
function sendSimplePlatformData() {
  try {
    const platformsData = createSimplePlatformData();
    
    // 编码protobuf数据
    const message = messageTypes.Platforms.create(platformsData);
    const protobufBuffer = messageTypes.Platforms.encode(message).finish();
    
    console.log('创建的简化平台数据:', JSON.stringify(platformsData, null, 2));

    // 构造完整的数据包
    const protocolID = 0x01;
    const packageType = 0x29;
    const size = protobufBuffer.length;

    const header = Buffer.alloc(8);
    header[0] = 0xAA;
    header[1] = 0x55;
    header[2] = protocolID;
    header[3] = packageType;
    header.writeUInt32LE(size, 4);

    const fullPacket = Buffer.concat([header, protobufBuffer]);
    
    sender.send(fullPacket, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error('发送简化数据失败:', err);
      } else {
        console.log(`✅ 已发送简化平台状态数据到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
        console.log(`📦 数据包大小: ${fullPacket.length} 字节`);
        console.log('---');
      }
    });
  } catch (error) {
    console.error('发送简化平台状态数据失败:', error);
  }
}

// 主函数
async function main() {
  await loadProtobufDefinitions();
  
  console.log('🚀 开始发送PlatformStatus格式的组播测试数据...');
  console.log(`🎯 目标地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('⏹️  按 Ctrl+C 停止');
  console.log('=====================================');

  // 立即发送一次简化数据
  console.log('📤 发送简化平台状态数据...');
  sendSimplePlatformData();

  // 2秒后发送完整数据
  setTimeout(() => {
    console.log('📤 发送完整平台状态数据...');
    sendPlatformStatusData();
  }, 2000);

  // 每30秒发送一次平台状态数据
  setInterval(() => {
    console.log('📤 定时发送平台状态数据...');
    sendPlatformStatusData();
  }, 30000);

  // 每10秒发送一次简化数据
  setInterval(() => {
    console.log('📤 定时发送简化平台状态数据...');
    sendSimplePlatformData();
  }, 10000);
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 停止发送...');
  sender.close();
  process.exit(0);
});

// 启动
main().catch(console.error);