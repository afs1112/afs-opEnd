const { app } = require('electron');
const dotenv = require('dotenv');
const path = require('path');

// 模拟主进程的环境配置加载
const envPath = path.join(__dirname, 'config.env');
dotenv.config({ path: envPath });

console.log('=== 主进程环境配置测试 ===');
console.log('app.getAppPath():', app.getAppPath());
console.log('config.env路径:', envPath);
console.log('MULTICAST_ADDRESS:', process.env.MULTICAST_ADDRESS);
console.log('MULTICAST_PORT:', process.env.MULTICAST_PORT);
console.log('INTERFACE_ADDRESS:', process.env.INTERFACE_ADDRESS);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 模拟getConfig的返回值
const config = {
  address: process.env.MULTICAST_ADDRESS || '224.0.0.1',
  port: parseInt(process.env.MULTICAST_PORT || '8888'),
  interfaceAddress: process.env.INTERFACE_ADDRESS || '0.0.0.0'
};

console.log('getConfig返回值:', config);
console.log('=========================='); 