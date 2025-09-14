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

// 创建最小化的飞行状态数据
function createMinimalFlyStatus() {
  const data = {
    uavID: 1,
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
    }
  };

  const message = UavFlyStatusInfo.create(data);
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
  
  return createProtocolPacket(protobufBuffer, 0x01, 0x01);
}

async function main() {
  await loadProtobuf();
  
  console.log('🚁 发送最小化无人机飞行状态数据');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  
  const packet = createMinimalFlyStatus();
  
  console.log(`📊 数据包信息:`);
  console.log(`   总长度: ${packet.length} 字节`);
  console.log(`   协议头: ${packet.subarray(0, 8).toString('hex').toUpperCase()}`);
  console.log(`   Protobuf数据长度: ${packet.length - 8} 字节`);
  
  sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('❌ 发送失败:', err);
    } else {
      console.log('✅ 发送成功!');
      console.log('💡 检查接收端是否能正确解析 UaviationSimulation.UavFlyStatusInfo');
    }
    
    sender.close();
  });
}

main().catch(console.error);