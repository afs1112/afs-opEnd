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

// 测试不同的无效 uavID 值
async function testInvalidUavID() {
  const testCases = [
    { name: "字符串 'A'", value: 'A' },
    { name: "字符串 '123'", value: '123' },
    { name: "浮点数 1.5", value: 1.5 },
    { name: "布尔值 true", value: true },
    { name: "null", value: null },
    { name: "undefined", value: undefined },
    { name: "对象 {}", value: {} },
    { name: "数组 [1]", value: [1] },
    { name: "超大数字", value: 999999999999999 },
    { name: "负数", value: -1 },
    { name: "正常值 1 (对照组)", value: 1 }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 测试案例: ${testCase.name}`);
    console.log(`   值: ${JSON.stringify(testCase.value)}`);
    console.log(`   类型: ${typeof testCase.value}`);
    
    try {
      // 尝试创建数据
      const data = {
        uavID: testCase.value,
        coord: {
          longitude: 106.319248,
          latitude: 36.221109,
          altitude: 1000
        },
        attitudeInfo: {
          roll: 0.0,
          pitch: 0.0,
          yaw: 45.0,
          speed: 120,
          height: 1000
        },
        otherInfoExtra: {
          currentExecuteState: `测试无效uavID: ${testCase.name}`,
          satNavEnabled: true,
          securityBoundaryEnabled: true
        }
      };

      console.log(`   📝 尝试创建消息...`);
      const message = UavFlyStatusInfo.create(data);
      console.log(`   ✅ 消息创建成功`);
      console.log(`   📊 创建后的uavID值: ${message.uavID} (类型: ${typeof message.uavID})`);
      
      console.log(`   📦 尝试编码...`);
      const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
      console.log(`   ✅ 编码成功，长度: ${protobufBuffer.length} 字节`);
      
      // 尝试解码验证
      console.log(`   🔍 尝试解码验证...`);
      const decoded = UavFlyStatusInfo.decode(protobufBuffer);
      console.log(`   ✅ 解码成功`);
      console.log(`   📊 解码后的uavID值: ${decoded.uavID} (类型: ${typeof decoded.uavID})`);
      
      // 创建完整协议包
      const packet = createProtocolPacket(protobufBuffer, 0x01, 0x01);
      console.log(`   📡 协议包大小: ${packet.length} 字节`);
      
      // 发送数据包
      await new Promise((resolve, reject) => {
        sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
          if (err) {
            console.log(`   ❌ 发送失败: ${err.message}`);
            reject(err);
          } else {
            console.log(`   ✅ 发送成功`);
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
      console.log(`   📋 错误详情:`, error.name);
      
      // 如果是验证错误，显示详细信息
      if (error.name === 'Error' && error.message.includes('invalid')) {
        console.log(`   💡 这是protobuf类型验证错误`);
      }
    }
    
    // 等待一秒再测试下一个
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  await loadProtobuf();
  
  console.log('🧪 测试无效 uavID 值的处理');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log(`📋 uavID 字段定义: required int32`);
  console.log('=' .repeat(60));
  
  await testInvalidUavID();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 测试完成！');
  console.log('💡 检查接收端的解析结果，看哪些数据包能正确解析');
  
  sender.close();
}

main().catch(console.error);