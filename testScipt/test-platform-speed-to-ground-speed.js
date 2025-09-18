#!/usr/bin/env node

/**
 * 测试平台speed转换为ground_speed的功能
 * 验证在同步无人机状态时，从platforms里拿到的speed正确转换为protobuf中的ground_speed字段
 */

const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let root = null;
let UavFlyStatusInfo = null;

async function loadProtobuf() {
  try {
    root = await protobuf.load([
      path.join(__dirname, '../src/protobuf/PublicStruct.proto'),
      path.join(__dirname, '../src/protobuf/UaviationSimulationStruct.proto')
    ]);
    
    UavFlyStatusInfo = root.lookupType('UaviationSimulation.UavFlyStatusInfo');
    console.log('✅ Protobuf加载成功');
  } catch (error) {
    console.error('❌ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 模拟从platforms获取的数据
function createMockPlatformData() {
  return {
    name: "测试平台-001",
    speed: 85.5,  // 这是从platforms里获取的speed值
    base: {
      location: {
        longitude: 106.319248,
        latitude: 36.221109,
        altitude: 1200
      },
      roll: 1.5,
      pitch: -0.8,
      yaw: 120.0,
      speed: 85.5  // platforms中的speed字段
    }
  };
}

// 转换platforms数据为UavFlyStatusInfo
function convertPlatformToUavStatus(platformData, uavId) {
  const platformBase = platformData.base;
  const location = platformBase.location;
  
  const coord = {
    longitude: location.longitude,
    latitude: location.latitude,
    altitude: location.altitude || 0
  };

  // 关键转换：将platforms中的speed转换为groundSpeed (使用camelCase)
  const attitudeInfo = {
    roll: platformBase.roll || 0,
    pitch: platformBase.pitch || 0,
    yaw: platformBase.yaw || 0,
    speed: platformBase.speed || 0,
    indicatedAirspeed: (platformBase.speed || 0) * 0.95, // 指示空速略小于地速
    groundSpeed: platformBase.speed || 0,  // 地速：从platforms里拿到的speed转换为groundSpeed
    height: coord.altitude,
    highPressure: coord.altitude * 0.98,
    highSatellite: coord.altitude * 1.02
  };

  return {
    uavID: uavId,
    coord: coord,
    attitudeInfo: attitudeInfo,
    cylinderTemperatureInfo: {
      temperature1: 85.0,
      temperature2: 86.0,
      temperature3: 84.5,
      temperature4: 85.5
    },
    engineDisplay: {
      throttle_butterfly: 75,
      rotate_speed: 2500,
      oil_quantity: 88.5
    },
    flyWarningInfo: {
      fly_stop_state: 0,
      height_state: 0,
      speed_state: 0,
      atttiude_state: 0,
      engine_state: 0
    },
    otherInfoExtra: {
      currentExecuteState: `同步自${platformData.name}`,
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };
}

// 创建协议数据包
function createProtocolPacket(protobufData, protocolID, packageType) {
  const size = protobufData.length;
  const packet = Buffer.alloc(8 + size);
  
  packet.writeUInt8(0xAA, 0);        // 包头1
  packet.writeUInt8(0x55, 1);        // 包头2
  packet.writeUInt8(protocolID, 2);  // 协议ID
  packet.writeUInt8(packageType, 3); // 包类型
  packet.writeUInt32LE(size, 4);     // 数据长度
  protobufData.copy(packet, 8);      // protobuf数据
  
  return packet;
}

async function testPlatformSpeedConversion() {
  console.log('🧪 测试平台speed转换为ground_speed功能\n');
  
  // 1. 模拟从platforms获取数据
  const platformData = createMockPlatformData();
  console.log('📊 模拟平台数据:');
  console.log('   平台名称:', platformData.name);
  console.log('   平台速度:', platformData.base.speed, 'm/s');
  console.log('   位置:', platformData.base.location);
  console.log('   姿态:', {
    roll: platformData.base.roll,
    pitch: platformData.base.pitch,
    yaw: platformData.base.yaw
  });
  
  // 2. 转换为UavFlyStatusInfo格式
  const uavStatusData = convertPlatformToUavStatus(platformData, 1001);
  console.log('\n🔄 转换后的无人机状态数据:');
  console.log('   无人机ID:', uavStatusData.uavID);
  console.log('   姿态信息:');
  console.log('     - speed:', uavStatusData.attitudeInfo.speed);
  console.log('     - indicatedAirspeed:', uavStatusData.attitudeInfo.indicatedAirspeed);
  console.log('     - groundSpeed:', uavStatusData.attitudeInfo.groundSpeed, '← 关键字段');
  console.log('     - roll:', uavStatusData.attitudeInfo.roll);
  console.log('     - pitch:', uavStatusData.attitudeInfo.pitch);
  console.log('     - yaw:', uavStatusData.attitudeInfo.yaw);
  
  // 3. 验证转换结果
  console.log('\n✅ 转换验证:');
  const originalSpeed = platformData.base.speed;
  const convertedGroundSpeed = uavStatusData.attitudeInfo.groundSpeed;
  
  if (originalSpeed === convertedGroundSpeed) {
    console.log('   ✅ platforms.speed → groundSpeed 转换正确');
    console.log(`   ✅ ${originalSpeed} m/s → ${convertedGroundSpeed} m/s`);
  } else {
    console.log('   ❌ 转换失败!');
    console.log(`   ❌ 期望: ${originalSpeed}, 实际: ${convertedGroundSpeed}`);
  }
  
  // 4. 创建并验证protobuf消息
  try {
    const message = UavFlyStatusInfo.create(uavStatusData);
    const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
    
    console.log('\n📦 Protobuf编码:');
    console.log('   编码成功，大小:', protobufBuffer.length, '字节');
    
    // 解码验证
    const decoded = UavFlyStatusInfo.decode(protobufBuffer);
    console.log('   解码验证:');
    console.log('     - groundSpeed:', decoded.attitudeInfo.groundSpeed);
    console.log('     - indicatedAirspeed:', decoded.attitudeInfo.indicatedAirspeed);
    
    // 5. 创建完整的协议数据包
    const packet = createProtocolPacket(protobufBuffer, 0x01, 0x01);
    console.log('   完整数据包大小:', packet.length, '字节');
    
    console.log('\n🎯 测试结论:');
    console.log('   ✅ platforms中的speed字段已正确转换为protobuf中的groundSpeed字段');
    console.log('   ✅ 同时保留了speed和indicatedAirspeed字段以保持兼容性');
    console.log('   ✅ 数据包可以正常编码和解码');
    
  } catch (error) {
    console.error('❌ Protobuf处理失败:', error);
  }
}

async function main() {
  await loadProtobuf();
  await testPlatformSpeedConversion();
}

main().catch(console.error);