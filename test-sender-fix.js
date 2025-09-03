// 测试 MulticastSenderService 修复
const { MulticastSenderService } = require('./build/main/services/multicast-sender.service.js');

async function testSenderService() {
  console.log('🚀 开始测试 MulticastSenderService...');
  
  const service = new MulticastSenderService();
  
  try {
    console.log('1. 检查初始化状态:', service.isInitialized());
    
    console.log('2. 尝试初始化...');
    await service.initialize();
    
    console.log('3. 检查初始化后状态:', service.isInitialized());
    
    console.log('4. 测试发送 PlatformCmd...');
    const testData = {
      commandID: Date.now(),
      platformName: 'test-artillery',
      platformType: 'Artillery',
      command: 10, // Arty_Fire
      fireParam: {
        weaponName: '测试武器',
        targetName: '测试目标',
        quantity: 1
      }
    };
    
    await service.sendPlatformCmd(testData);
    console.log('✅ 发送成功!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    service.close();
    console.log('🔚 测试完成');
  }
}

// 设置模拟的 app.getAppPath 
global.app = {
  getAppPath: () => process.cwd()
};

testSenderService();