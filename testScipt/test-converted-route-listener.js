const dgram = require('dgram');

// 创建UDP监听器来验证转换后的PlatformCmd数据包
const listener = dgram.createSocket('udp4');

const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let packetCount = 0;

listener.bind(MULTICAST_PORT, () => {
  console.log('🎯 航线转换结果监听器启动');
  console.log(`📡 监听地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('等待接收转换后的PlatformCmd数据包...\n');
  
  try {
    listener.addMembership(MULTICAST_ADDRESS);
    console.log('✅ 已加入组播组');
  } catch (error) {
    console.error('❌ 加入组播组失败:', error);
  }
});

listener.on('message', (msg, rinfo) => {
  if (msg.length >= 8) {
    const header1 = msg[0];
    const header2 = msg[1];
    const protocolID = msg[2];
    const packageType = msg[3];
    const dataLength = msg.readUInt32LE(4);
    
    packetCount++;
    
    console.log(`[${new Date().toLocaleTimeString()}] 📦 数据包 #${packetCount}`);
    console.log(`  📍 来源: ${rinfo.address}:${rinfo.port}`);
    console.log(`  📊 大小: ${msg.length} 字节`);
    console.log(`  🔍 协议头: 0x${header1.toString(16).padStart(2, '0')} 0x${header2.toString(16).padStart(2, '0')}`);
    console.log(`  🆔 协议ID: 0x${protocolID.toString(16)}`);
    console.log(`  📋 包类型: 0x${packageType.toString(16)}`);
    
    if (header1 === 0xAA && header2 === 0x55) {
      if (packageType === 0x20) {
        console.log('  📥 这是一个 UavRouteUpload 数据包 (航线上传)');
        console.log('  ⏳ 等待系统转换...');
      } else if (packageType === 0x2A) {
        console.log('  📤 这是一个 PlatformCmd 数据包 (转换后的航线命令)');
        console.log('  ✅ 航线转换成功！');
        
        // 尝试解析一些基本信息
        if (msg.length > 8) {
          const protobufData = msg.slice(8);
          console.log(`  📏 Protobuf数据长度: ${protobufData.length} 字节`);
          console.log(`  🔍 数据预览: ${protobufData.slice(0, Math.min(20, protobufData.length)).toString('hex')}...`);
        }
      } else if (packageType === 0x29) {
        console.log('  📊 这是一个 PlatformStatus 数据包');
      } else if (packageType === 0x01) {
        console.log('  🛩️ 这是一个 UavFlyStatusInfo 数据包');
      } else {
        console.log(`  ❓ 未知包类型: 0x${packageType.toString(16)}`);
      }
    } else {
      console.log('  ⚠️ 协议头不匹配');
    }
    
    console.log('');
  }
});

listener.on('error', (err) => {
  console.error('❌ 监听器错误:', err);
});

process.on('SIGINT', () => {
  console.log(`\\n📊 监听统计:`);
  console.log(`   📦 总接收包数: ${packetCount}`);
  console.log('\\n🛑 停止监听...');
  listener.close();
  process.exit(0);
});

console.log('💡 使用说明:');
console.log('1. 启动应用程序');
console.log('2. 运行 test-route-conversion.js 发送航线数据');
console.log('3. 观察此监听器显示的数据包');
console.log('4. 验证是否接收到转换后的PlatformCmd数据包');
console.log('按 Ctrl+C 停止监听\\n');

console.log('🎯 预期流程:');
console.log('1. 接收到 0x20 (UavRouteUpload) 数据包');
console.log('2. 系统自动转换航线格式');
console.log('3. 接收到 0x2A (PlatformCmd) 数据包');
console.log('4. 页面显示"航线已转换"消息\\n');