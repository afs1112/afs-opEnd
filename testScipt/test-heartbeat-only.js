const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket
const sender = dgram.createSocket('udp4');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let HeartbeatInternal = null;

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto')
    ]);
    
    HeartbeatInternal = root.lookupType('PublicStruct.HeartbeatInternal');
    console.log('✅ Protobuf加载成功');
  } catch (error) {
    console.error('❌ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 创建协议数据包
function createProtocolPacket(protobufData, packageType = 0x02, protocolID = 0x01) {
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

// 创建心跳包
function createHeartbeatPacket(softwareID = 1, state = 1) {
  const data = {
    softwareID: softwareID,
    state: state,
    reserve: 0
  };

  const message = HeartbeatInternal.create(data);
  const protobufBuffer = HeartbeatInternal.encode(message).finish();
  
  return createProtocolPacket(protobufBuffer, 0x02, 0x01); // 0x02 = PackType_HeartbeatInternal
}

// 发送心跳包
function sendHeartbeat(softwareID, state) {
  return new Promise((resolve, reject) => {
    const packet = createHeartbeatPacket(softwareID, state);
    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error(`❌ 发送心跳包失败:`, err);
        reject(err);
      } else {
        console.log(`💓 发送心跳包: 软件ID=${softwareID}, 状态=${state} (${packet.length}字节)`);
        resolve();
      }
    });
  });
}

async function main() {
  await loadProtobuf();
  
  console.log('💓 心跳包连续发送测试');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('🎯 测试心跳包汇聚和频率统计');
  console.log('⏰ 每秒发送2个心跳包，持续15秒');
  console.log('=' .repeat(50));
  
  let count = 0;
  const softwareIDs = [1, 2, 3]; // 模拟3个不同的软件
  
  const interval = setInterval(async () => {
    try {
      // 每次发送2个心跳包
      for (let i = 0; i < 2; i++) {
        const softwareID = softwareIDs[count % softwareIDs.length];
        const state = Math.random() > 0.05 ? 1 : 0; // 95%正常，5%异常
        
        await sendHeartbeat(softwareID, state);
        count++;
        
        // 短暂间隔
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('发送心跳包时出错:', error);
    }
  }, 1000); // 每秒发送
  
  // 15秒后停止
  setTimeout(() => {
    clearInterval(interval);
    console.log('\n' + '='.repeat(50));
    console.log('🎯 测试完成！');
    console.log(`📊 总共发送了 ${count} 个心跳包`);
    console.log('💡 检查接收端的心跳包汇聚效果:');
    console.log('   ✅ 心跳包应该汇聚在专门区域');
    console.log('   ✅ 显示正确的频率统计 (约120/分钟)');
    console.log('   ✅ 显示3个不同的来源');
    console.log('   ✅ 主数据包列表应该保持干净');
    
    sender.close();
  }, 15000);
  
  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n🛑 手动停止测试...');
    clearInterval(interval);
    sender.close();
    process.exit(0);
  });
}

main().catch(console.error);