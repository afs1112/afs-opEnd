const dgram = require('dgram');

// 创建UDP监听器来测试持续轨迹同步功能
const listener = dgram.createSocket('udp4');

const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let packetCount = 0;
let lastUavId = null;
let startTime = Date.now();

listener.bind(MULTICAST_PORT, () => {
  console.log('🎯 持续轨迹同步测试监听器启动');
  console.log(`📡 监听地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('等待接收持续轨迹同步数据包...\n');
  
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
    
    // 只处理UavFlyStatusInfo数据包 (0x01)
    if (header1 === 0xAA && header2 === 0x55 && packageType === 0x01) {
      packetCount++;
      const currentTime = Date.now();
      const elapsed = ((currentTime - startTime) / 1000).toFixed(1);
      
      console.log(`[${new Date().toLocaleTimeString()}] 📦 轨迹数据包 #${packetCount}`);
      console.log(`  ⏱️  运行时间: ${elapsed}s`);
      console.log(`  📍 来源: ${rinfo.address}:${rinfo.port}`);
      console.log(`  📊 大小: ${msg.length} 字节 (头部8 + 数据${dataLength})`);
      
      // 尝试解析UavId (简单的字节解析，实际需要protobuf解析)
      if (msg.length > 8) {
        // UavId通常在protobuf数据的开始部分
        try {
          // 简单的启发式方法来提取UavId
          const protobufData = msg.slice(8);
          if (protobufData.length > 0) {
            // 查找可能的UavId值 (1-4字节的整数)
            for (let i = 0; i < Math.min(protobufData.length - 4, 20); i++) {
              const possibleId = protobufData.readUInt32LE(i);
              if (possibleId > 1000 && possibleId < 10000) {
                if (lastUavId === null) {
                  lastUavId = possibleId;
                  console.log(`  🆔 检测到UavId: ${possibleId}`);
                } else if (lastUavId === possibleId) {
                  console.log(`  🆔 UavId: ${possibleId} (一致)`);
                } else {
                  console.log(`  🆔 UavId变更: ${lastUavId} → ${possibleId}`);
                  lastUavId = possibleId;
                }
                break;
              }
            }
          }
        } catch (parseError) {
          console.log(`  ⚠️  UavId解析失败`);
        }
      }
      
      // 计算发送频率
      if (packetCount > 1) {
        const avgInterval = (currentTime - startTime) / (packetCount - 1);
        console.log(`  📈 平均间隔: ${avgInterval.toFixed(0)}ms`);
      }
      
      console.log('');
      
      // 每10个包显示一次统计
      if (packetCount % 10 === 0) {
        console.log(`📊 统计信息 (${packetCount}个包):`);
        console.log(`   ⏱️  总运行时间: ${elapsed}s`);
        console.log(`   📦 包接收率: ${(packetCount / parseFloat(elapsed)).toFixed(1)} 包/秒`);
        console.log(`   🆔 当前UavId: ${lastUavId || '未检测到'}`);
        console.log('');
      }
    }
  }
});

listener.on('error', (err) => {
  console.error('❌ 监听器错误:', err);
});

process.on('SIGINT', () => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n📊 最终统计:');
  console.log(`   📦 总接收包数: ${packetCount}`);
  console.log(`   ⏱️  总运行时间: ${elapsed}s`);
  console.log(`   📈 平均接收率: ${(packetCount / parseFloat(elapsed)).toFixed(1)} 包/秒`);
  console.log(`   🆔 最后UavId: ${lastUavId || '未检测到'}`);
  
  console.log('\n🛑 停止监听...');
  listener.close();
  process.exit(0);
});

console.log('💡 测试说明:');
console.log('1. 启动应用程序');
console.log('2. 在命令测试页面选择平台并设置UavId');
console.log('3. 点击"同步轨迹"开始持续发送');
console.log('4. 观察此监听器显示的数据包接收情况');
console.log('5. 点击"停止同步"停止发送');
console.log('6. 按 Ctrl+C 停止此监听器\n');

console.log('🎯 预期结果:');
console.log('- 每2秒接收一个轨迹数据包');
console.log('- UavId保持一致');
console.log('- 数据包格式正确 (0xAA 0x55 0x01 0x01)');
console.log('- 点击停止后不再接收数据包\n');