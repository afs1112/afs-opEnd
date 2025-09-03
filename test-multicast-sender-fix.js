#!/usr/bin/env node

/**
 * 测试 MulticastSenderService 修复效果
 * 用于验证 protobuf 文件加载和 PlatformCmd 消息发送功能
 */

const path = require('path');

// 模拟 Electron app 对象
global.app = {
  getAppPath: () => process.cwd(),
  whenReady: () => Promise.resolve()
};

async function testMulticastSender() {
  console.log('🚀 测试 MulticastSenderService 修复效果...\n');
  
  try {
    // 动态导入服务（需要在编译后测试）
    const { MulticastSenderService } = require('./build/main/services/multicast-sender.service.js');
    
    console.log('1. 创建 MulticastSenderService 实例...');
    const service = new MulticastSenderService();
    
    console.log('2. 检查初始化状态:', service.isInitialized());
    
    console.log('3. 尝试初始化服务...');
    await service.initialize();
    
    console.log('4. 检查初始化后状态:', service.isInitialized());
    
    if (service.isInitialized()) {
      console.log('✅ 服务初始化成功！');
      
      console.log('\n5. 测试发送 PlatformCmd 消息...');
      const testData = {
        commandID: Date.now(),
        platformName: 'test-artillery-001',
        platformType: 'Artillery',
        command: 10, // Arty_Fire 火炮发射
        fireParam: {
          weaponName: '155毫米榴弹炮',
          targetName: '测试目标-001',
          quantity: 1
        }
      };
      
      await service.sendPlatformCmd(testData);
      console.log('✅ PlatformCmd 消息发送成功！');
      
      console.log('\n📊 测试数据:', JSON.stringify(testData, null, 2));
      
    } else {
      console.log('❌ 服务初始化失败');
    }
    
    // 清理资源
    service.close();
    console.log('\n🔚 测试完成，资源已清理');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n💡 提示: 请先编译项目');
      console.log('   运行: npm run build');
      console.log('   然后: node test-multicast-sender-fix.js');
    }
    
    process.exit(1);
  }
}

// 运行测试
testMulticastSender()
  .then(() => {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试过程中发生未处理的错误:', error);
    process.exit(1);
  });