const { app } = require('electron');
const dotenv = require('dotenv');
const path = require('path');

// 模拟主进程启动
console.log('=== 主进程环境变量调试 ===');

// 检查config.env文件是否存在
const envPath = path.join(__dirname, 'config.env');
const fs = require('fs');

if (fs.existsSync(envPath)) {
  console.log('✅ config.env文件存在:', envPath);
  
  // 读取文件内容
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('文件内容:');
  console.log(envContent);
  
  // 加载环境变量
  dotenv.config({ path: envPath });
  
  console.log('\n环境变量:');
  console.log('MULTICAST_ADDRESS:', process.env.MULTICAST_ADDRESS);
  console.log('MULTICAST_PORT:', process.env.MULTICAST_PORT);
  console.log('INTERFACE_ADDRESS:', process.env.INTERFACE_ADDRESS);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // 模拟getConfig返回值
  const config = {
    address: process.env.MULTICAST_ADDRESS || '224.0.0.1',
    port: parseInt(process.env.MULTICAST_PORT || '8888'),
    interfaceAddress: process.env.INTERFACE_ADDRESS || '0.0.0.0'
  };
  
  console.log('\ngetConfig返回值:', config);
  
} else {
  console.log('❌ config.env文件不存在:', envPath);
}

console.log('=========================='); 