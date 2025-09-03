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
    const protobufPath = path.join(__dirname, '..', 'protobuf');
    
    // 加载PlatformCmd相关的protobuf定义
    root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'PlatformCmd.proto')
    ]);

    // 获取消息类型
    messageTypes = {
      PlatformCmd: root.lookupType('PlatformStatus.PlatformCmd'),
      FireParam: root.lookupType('PlatformStatus.FireParam')
    };

    console.log('PlatformCmd Protobuf定义文件加载成功');
    console.log('可用消息类型:', Object.keys(messageTypes));
  } catch (error) {
    console.error('加载PlatformCmd Protobuf定义文件失败:', error);
    process.exit(1);
  }
}

// 创建PlatformCmd测试数据
function createPlatformCmdData() {
  // 创建火炮发射参数
  const fireParam = messageTypes.FireParam.create({
    weaponName: '155毫米榴弹炮',
    targetName: '敌方装甲车',
    quantity: 1
  });

  // 创建平台控制命令
  const platformCmd = messageTypes.PlatformCmd.create({
    commandID: Date.now(),
    platformName: 'artillery1',
    platformType: 'Artillery',
    command: 10, // Arty_Fire = 10
    fireParam: fireParam
  });

  return platformCmd;
}

// 创建带协议头的数据包
function createPlatformCmdPacket() {
  try {
    const platformCmdData = createPlatformCmdData();
    
    // 编码protobuf数据
    const protobufBuffer = messageTypes.PlatformCmd.encode(platformCmdData).finish();
    
    console.log('创建的PlatformCmd数据:', JSON.stringify(messageTypes.PlatformCmd.toObject(platformCmdData), null, 2));
    console.log('Protobuf编码后大小:', protobufBuffer.length, '字节');

    // 构造完整的数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
    const protocolID = 0x01; // 协议ID
    const packageType = 0x2A; // PackType_PlatformCmd
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
    console.error('创建PlatformCmd数据包失败:', error);
    throw error;
  }
}

// 发送数据
function sendPlatformCmdData() {
  try {
    const packet = createPlatformCmdPacket();
    
    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error('发送失败:', err);
      } else {
        console.log(`✅ 已发送PlatformCmd数据到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
        console.log(`📦 数据包大小: ${packet.length} 字节`);
        console.log(`📋 包类型: 0x${packet[3].toString(16)} (PackType_PlatformCmd)`);
        console.log(`🔗 协议ID: 0x${packet[2].toString(16)}`);
        console.log(`⏰ 发送时间: ${new Date().toLocaleString('zh-CN')}`);
        console.log('---');
      }
    });
  } catch (error) {
    console.error('发送PlatformCmd数据失败:', error);
  }
}

// 主函数
async function main() {
  await loadProtobufDefinitions();
  
  console.log('🚀 开始发送PlatformCmd格式的组播测试数据...');
  console.log(`🎯 目标地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('⏹️  按 Ctrl+C 停止');
  console.log('=====================================');

  // 立即发送一次
  console.log('📤 发送PlatformCmd测试数据...');
  sendPlatformCmdData();

  // 每10秒发送一次
  setInterval(() => {
    console.log('📤 定时发送PlatformCmd数据...');
    sendPlatformCmdData();
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