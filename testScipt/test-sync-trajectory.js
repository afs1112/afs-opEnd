const dgram = require('dgram');

// 创建UDP监听器来测试同步轨迹功能
const listener = dgram.createSocket('udp4');

const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

listener.bind(MULTICAST_PORT, () => {
  console.log('🎯 轨迹同步测试监听器启动');
  console.log(`📡 监听地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('等待接收同步轨迹数据包...\n');
  
  try {
    listener.addMembership(MULTICAST_ADDRESS);
    console.log('✅ 已加入组播组');
  } catch (error) {
    console.error('❌ 加入组播组失败:', error);
  }
});

listener.on('message', (msg, rinfo) => {
  console.log(`[${new Date().toLocaleTimeString()}] 📦 收到数据包`);
  console.log(`  📍 来源: ${rinfo.address}:${rinfo.port}`);
  console.log(`  📊 大小: ${msg.length} 字节`);
  
  if (msg.length >= 8) {
    const header1 = msg[0];
    const header2 = msg[1];
    const protocolID = msg[2];
    const packageType = msg[3];
    const dataLength = msg.readUInt32LE(4);
    
    console.log(`  🔍 协议头: 0x${header1.toString(16).padStart(2, '0')} 0x${header2.toString(16).padStart(2, '0')}`);
    console.log(`  🆔 协议ID: 0x${protocolID.toString(16)}`);
    console.log(`  📋 包类型: 0x${packageType.toString(16)}`);
    console.log(`  📏 声明长度: ${dataLength} 字节`);
    console.log(`  📏 实际数据长度: ${msg.length - 8} 字节`);
    
    if (header1 === 0xAA && header2 === 0x55) {
      if (packageType === 0x01) {
        console.log('  ✅ 这是一个 UavFlyStatusInfo 数据包 (轨迹同步)');
      } else if (packageType === 0x2A) {
        console.log('  ✅ 这是一个 PlatformCmd 数据包');
      } else {
        console.log(`  ℹ️  未知包类型: 0x${packageType.toString(16)}`);
      }
    } else {
      console.log('  ⚠️  协议头不匹配');
    }
  } else {
    console.log('  ⚠️  数据包太小，可能不是有效的协议数据包');
  }
  
  console.log('');
});

listener.on('error', (err) => {
  console.error('❌ 监听器错误:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 停止监听...');
  listener.close();
  process.exit(0);
});

console.log('💡 使用说明:');
console.log('1. 启动应用程序');
console.log('2. 在命令测试页面选择一个平台');
console.log('3. 点击"打开导航软件"生成UavId');
console.log('4. 点击"同步轨迹"按钮');
console.log('5. 观察此监听器的输出');
console.log('按 Ctrl+C 停止监听\n');