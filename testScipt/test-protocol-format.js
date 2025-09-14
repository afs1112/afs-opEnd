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

// 创建测试数据
function createTestData() {
  const testData = {
    uavID: 1,
    coord: {
      longitude: 106.319248,
      latitude: 36.221109,
      altitude: 1000
    },
    attitudeInfo: {
      roll: 0.0,
      pitch: 0.0,
      yaw: 0.0,
      speed: 100,
      height: 1000
    },
    otherInfoExtra: {
      currentExecuteState: "协议测试",
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };

  const message = UavFlyStatusInfo.create(testData);
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
  
  return createProtocolPacket(protobufBuffer, 0x01, 0x01);
}

// 分析数据包格式
function analyzePacket(packet) {
  console.log('\n📊 数据包分析:');
  console.log(`总长度: ${packet.length} 字节`);
  console.log(`协议头: ${packet.subarray(0, 2).toString('hex').toUpperCase()} (期望: AA55)`);
  console.log(`协议ID: 0x${packet[2].toString(16).padStart(2, '0').toUpperCase()}`);
  console.log(`包类型: 0x${packet[3].toString(16).padStart(2, '0').toUpperCase()}`);
  
  const dataLength = packet.readUInt32LE(4);
  console.log(`数据长度: ${dataLength} 字节 (小端序: ${packet.subarray(4, 8).toString('hex').toUpperCase()})`);
  console.log(`实际数据长度: ${packet.length - 8} 字节`);
  console.log(`数据长度匹配: ${dataLength === packet.length - 8 ? '✅' : '❌'}`);
  
  console.log(`完整包头 (前8字节): ${packet.subarray(0, 8).toString('hex').toUpperCase()}`);
  console.log(`Protobuf数据 (前16字节): ${packet.subarray(8, Math.min(24, packet.length)).toString('hex').toUpperCase()}`);
}

async function main() {
  await loadProtobuf();
  
  console.log('🧪 协议格式测试');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  
  const packet = createTestData();
  analyzePacket(packet);
  
  console.log('\n📤 发送测试数据包...');
  
  sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('❌ 发送失败:', err);
    } else {
      console.log('✅ 发送成功!');
      console.log('\n💡 提示: 检查你的接收端是否能正确解析此数据包');
      console.log('   期望的解析结果应该包含:');
      console.log('   - uavID: 1');
      console.log('   - 坐标: 36.221109, 106.319248, 1000m');
      console.log('   - 状态: "协议测试"');
    }
    
    sender.close();
  });
}

main().catch(console.error);