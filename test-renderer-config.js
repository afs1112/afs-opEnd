// 模拟渲染进程获取配置的过程
console.log('=== 渲染进程配置测试 ===');

// 模拟从主进程获取的配置
const mockGetConfig = async () => {
  // 模拟环境变量（实际应该从主进程获取）
  const envConfig = {
    MULTICAST_ADDRESS: '239.255.43.21',
    MULTICAST_PORT: '10086',
    INTERFACE_ADDRESS: '0.0.0.0'
  };

  return {
    address: envConfig.MULTICAST_ADDRESS || '224.0.0.1',
    port: parseInt(envConfig.MULTICAST_PORT || '8888'),
    interfaceAddress: envConfig.INTERFACE_ADDRESS || '0.0.0.0'
  };
};

// 模拟页面加载配置
const loadConfig = async () => {
  try {
    const config = await mockGetConfig();
    console.log('获取到的配置:', config);
    
    // 模拟更新页面配置
    const pageConfig = {
      address: config.address,
      port: config.port,
      interfaceAddress: config.interfaceAddress
    };
    
    console.log('页面配置:', pageConfig);
    return pageConfig;
  } catch (error) {
    console.error('加载配置失败:', error);
    return null;
  }
};

// 执行测试
loadConfig().then(config => {
  if (config) {
    console.log('✅ 配置加载成功');
    console.log('组播地址:', config.address);
    console.log('端口:', config.port);
    console.log('接口地址:', config.interfaceAddress);
  } else {
    console.log('❌ 配置加载失败');
  }
});

console.log('=========================='); 