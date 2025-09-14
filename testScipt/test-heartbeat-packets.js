const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket
const sender = dgram.createSocket('udp4');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let HeartbeatInternal = null;
let UavFlyStatusInfo = null;

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UaviationSimulationStruct.proto')
    ]);
    
    HeartbeatInternal = root.lookupType('PublicStruct.HeartbeatInternal');
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

// 创建飞行状态包
function createFlyStatusPacket(uavID = 1) {
  const data = {
    uavID: uavID,
    coord: {
      longitude: 106.319248 + Math.random() * 0.01,
      latitude: 36.221109 + Math.random() * 0.01,
      altitude: 1000 + Math.random() * 100
    },
    attitudeInfo: {
      roll: Math.random() * 10 - 5,
      pitch: Math.random() * 10 - 5,
      yaw: Math.random() * 360,
      speed: 100 + Math.random() * 50,
      height: 1000 + Math.random() * 100
    },
    otherInfoExtra: {
      currentExecuteState: "测试飞行",
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };

  const message = UavFlyStatusInfo.create(data);
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
  
  return createProtocolPacket(protobufBuffer, 0x01, 0x01); // 0x01 = PackType_Flystatus
}

// 发送数据包
function sendPacket(packet, description) {
  return new Promise((resolve, reject) => {
    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error(`❌ 发送${description}失败:`, err);
        reject(err);
      } else {
        console.log(`✅ 发送${description}成功 (${packet.length} 字节)`);
        resolve();
      }
    });
  });
}

async function main() {
  await loadProtobuf();
  
  console.log('💓 心跳包和飞行状态包混合测试');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('🎯 测试心跳包汇聚功能');
  console.log('=' .repeat(60));
  
  let heartbeatCount = 0;
  let flyStatusCount = 0;
  
  // 模拟混合数据包发送
  const sendInterval = setInterval(async () => {
    try {
      // 每次发送1-3个心跳包
      const heartbeatNum = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < heartbeatNum; i++) {
        const softwareID = Math.floor(Math.random() * 3) + 1; // 1-3
        const state = Math.random() > 0.1 ? 1 : 0; // 90%正常，10%异常
        const heartbeatPacket = createHeartbeatPacket(softwareID, state);
        await sendPacket(heartbeatPacket, `心跳包 #${++heartbeatCount} (软件ID:${softwareID}, 状态:${state})`);
        
        // 心跳包之间短暂间隔
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 偶尔发送飞行状态包
      if (Math.random() > 0.7) { // 30%概率
        const uavID = Math.floor(Math.random() * 2) + 1; // 1-2
        const flyStatusPacket = createFlyStatusPacket(uavID);
        await sendPacket(flyStatusPacket, `飞行状态包 #${++flyStatusCount} (无人机ID:${uavID})`);
      }
      
    } catch (error) {
      console.error('发送过程中出错:', error);
    }
  }, 2000); // 每2秒发送一轮
  
  // 10秒后停止发送
  setTimeout(() => {
    clearInterval(sendInterval);
    console.log('\n' + '='.repeat(60));
    console.log('🎯 测试完成！');
    console.log(`📊 统计: 发送了 ${heartbeatCount} 个心跳包, ${flyStatusCount} 个飞行状态包`);
    console.log('💡 检查接收端的心跳包汇聚效果');
    console.log('   - 心跳包应该被汇聚显示，不会刷屏');
    console.log('   - 飞行状态包应该正常显示在主列表中');
    console.log('   - 可以通过开关控制心跳包的显示/隐藏');
    
    sender.close();
  }, 10000);
  
  // 优雅退出处理
  process.on('SIGINT', () => {
    console.log('\n🛑 手动停止测试...');
    clearInterval(sendInterval);
    sender.close();
    process.exit(0);
  });
}

main().catch(console.error);