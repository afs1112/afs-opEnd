const dotenv = require('dotenv');
const path = require('path');

// 加载环境配置
const envPath = path.join(__dirname, 'config.env');
dotenv.config({ path: envPath });

console.log('=== 环境配置测试 ===');
console.log('MULTICAST_ADDRESS:', process.env.MULTICAST_ADDRESS);
console.log('MULTICAST_PORT:', process.env.MULTICAST_PORT);
console.log('INTERFACE_ADDRESS:', process.env.INTERFACE_ADDRESS);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('===================');

// 验证配置是否正确
const config = {
  address: process.env.MULTICAST_ADDRESS || '224.0.0.1',
  port: parseInt(process.env.MULTICAST_PORT || '8888'),
  interfaceAddress: process.env.INTERFACE_ADDRESS || '0.0.0.0'
};

console.log('解析后的配置:', config); 