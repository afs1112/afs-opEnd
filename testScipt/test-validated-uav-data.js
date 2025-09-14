const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket
const sender = dgram.createSocket('udp4');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let UavFlyStatusInfo = null;

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UaviationSimulationStruct.proto')
    ]);
    
    UavFlyStatusInfo = root.lookupType('UaviationSimulation.UavFlyStatusInfo');
    console.log('✅ Protobuf加载成功');
  } catch (error) {
    console.error('❌ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 严格的数据验证函数
function validateUavFlyStatusData(data) {
  const errors = [];
  
  // 验证 uavID
  if (typeof data.uavID !== 'number') {
    errors.push(`uavID must be a number, got ${typeof data.uavID}: ${data.uavID}`);
  } else if (!Number.isInteger(data.uavID)) {
    errors.push(`uavID must be an integer, got: ${data.uavID}`);
  } else if (data.uavID < -2147483648 || data.uavID > 2147483647) {
    errors.push(`uavID out of int32 range: ${data.uavID}`);
  }
  
  // 验证坐标
  if (data.coord) {
    if (typeof data.coord.longitude !== 'number') {
      errors.push(`coord.longitude must be a number, got ${typeof data.coord.longitude}`);
    }
    if (typeof data.coord.latitude !== 'number') {
      errors.push(`coord.latitude must be a number, got ${typeof data.coord.latitude}`);
    }
    if (typeof data.coord.altitude !== 'number') {
      errors.push(`coord.altitude must be a number, got ${typeof data.coord.altitude}`);
    }
  }
  
  // 验证姿态信息
  if (data.attitudeInfo) {
    const numericFields = ['roll', 'pitch', 'yaw', 'speed', 'height'];
    numericFields.forEach(field => {
      if (data.attitudeInfo[field] !== undefined && typeof data.attitudeInfo[field] !== 'number') {
        errors.push(`attitudeInfo.${field} must be a number, got ${typeof data.attitudeInfo[field]}`);
      }
    });
  }
  
  return errors;
}

// 创建协议数据包
function createProtocolPacket(protobufData, packageType = 0x01, protocolID = 0x01) {
  const dataLength = protobufData.length;
  const packet = Buffer.allocUnsafe(8 + dataLength);
  
  packet[0] = 0xAA;  // 协议头1
  packet[1] = 0x55;  // 协议头2
  packet[2] = protocolID;  // 协议ID
  packet[3] = packageType; // 包类型
  packet.writeUInt32LE(dataLength, 4); // 数据长度(小端序)
  
  protobufData.copy(packet, 8);
  return packet;
}

// 安全的数据创建函数
function createValidatedUavFlyStatus(data) {
  console.log('🔍 开始数据验证...');
  
  // 验证输入数据
  const errors = validateUavFlyStatusData(data);
  if (errors.length > 0) {
    throw new Error(`数据验证失败:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
  
  console.log('✅ 数据验证通过');
  
  // 创建消息
  const message = UavFlyStatusInfo.create(data);
  
  // 使用 protobuf 内置验证
  const verifyError = UavFlyStatusInfo.verify(data);
  if (verifyError) {
    throw new Error(`Protobuf验证失败: ${verifyError}`);
  }
  
  console.log('✅ Protobuf验证通过');
  
  // 编码
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
  
  // 解码验证（确保往返一致性）
  const decoded = UavFlyStatusInfo.decode(protobufBuffer);
  if (decoded.uavID !== data.uavID) {
    throw new Error(`数据往返不一致: 原始=${data.uavID}, 解码=${decoded.uavID}`);
  }
  
  console.log('✅ 往返一致性验证通过');
  
  return createProtocolPacket(protobufBuffer, 0x01, 0x01);
}

// 测试不同的数据
async function testValidatedData() {
  const testCases = [
    {
      name: "✅ 正确的数据",
      data: {
        uavID: 1,
        coord: { longitude: 106.319248, latitude: 36.221109, altitude: 1000 },
        attitudeInfo: { roll: 0.0, pitch: 0.0, yaw: 45.0, speed: 120, height: 1000 }
      },
      shouldPass: true
    },
    {
      name: "❌ 字符串 uavID",
      data: {
        uavID: 'A',
        coord: { longitude: 106.319248, latitude: 36.221109, altitude: 1000 },
        attitudeInfo: { roll: 0.0, pitch: 0.0, yaw: 45.0, speed: 120, height: 1000 }
      },
      shouldPass: false
    },
    {
      name: "❌ 浮点数 uavID",
      data: {
        uavID: 1.5,
        coord: { longitude: 106.319248, latitude: 36.221109, altitude: 1000 },
        attitudeInfo: { roll: 0.0, pitch: 0.0, yaw: 45.0, speed: 120, height: 1000 }
      },
      shouldPass: false
    },
    {
      name: "❌ 超出范围的 uavID",
      data: {
        uavID: 999999999999999,
        coord: { longitude: 106.319248, latitude: 36.221109, altitude: 1000 },
        attitudeInfo: { roll: 0.0, pitch: 0.0, yaw: 45.0, speed: 120, height: 1000 }
      },
      shouldPass: false
    },
    {
      name: "❌ 字符串坐标",
      data: {
        uavID: 2,
        coord: { longitude: 'invalid', latitude: 36.221109, altitude: 1000 },
        attitudeInfo: { roll: 0.0, pitch: 0.0, yaw: 45.0, speed: 120, height: 1000 }
      },
      shouldPass: false
    },
    {
      name: "✅ 负数 uavID (在范围内)",
      data: {
        uavID: -1,
        coord: { longitude: 106.319248, latitude: 36.221109, altitude: 1000 },
        attitudeInfo: { roll: 0.0, pitch: 0.0, yaw: 45.0, speed: 120, height: 1000 }
      },
      shouldPass: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 测试: ${testCase.name}`);
    console.log(`📊 输入数据:`, JSON.stringify(testCase.data, null, 2));
    console.log(`🎯 预期结果: ${testCase.shouldPass ? '通过' : '失败'}`);
    
    try {
      const packet = createValidatedUavFlyStatus(testCase.data);
      
      // 发送数据包
      await new Promise((resolve, reject) => {
        sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
          if (err) {
            console.log(`❌ 发送失败: ${err.message}`);
            reject(err);
          } else {
            console.log(`✅ 数据包创建并发送成功 (${packet.length} 字节)`);
            resolve();
          }
        });
      });
      
      if (!testCase.shouldPass) {
        console.log(`⚠️  意外通过: 预期应该失败但实际成功了`);
      }
      
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
      
      if (testCase.shouldPass) {
        console.log(`⚠️  意外失败: 预期应该成功但实际失败了`);
      } else {
        console.log(`✅ 按预期失败`);
      }
    }
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  await loadProtobuf();
  
  console.log('🛡️  带验证的无人机数据测试');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('🔒 启用严格的数据类型验证');
  
  await testValidatedData();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 测试完成！');
  console.log('💡 只有通过验证的数据包会被发送到接收端');
  
  sender.close();
}

main().catch(console.error);