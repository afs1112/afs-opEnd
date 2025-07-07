const dgram = require('dgram');

// 创建UDP socket用于发送组播数据
const sender = dgram.createSocket('udp4');

// 组播地址和端口
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

// 发送测试数据
function sendTestData() {
  const message = Buffer.from(`测试数据 - ${new Date().toISOString()}`);
  
  sender.send(message, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('发送失败:', err);
    } else {
      console.log(`已发送数据到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}:`, message.toString());
    }
  });
}

// 每5秒发送一次测试数据
console.log('开始发送组播测试数据...');
console.log(`目标地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
console.log('按 Ctrl+C 停止');

setInterval(sendTestData, 5000);
sendTestData(); // 立即发送一次

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n停止发送...');
  sender.close();
  process.exit(0);
}); 