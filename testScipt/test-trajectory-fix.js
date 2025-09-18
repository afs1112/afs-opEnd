console.log('🔧 轨迹同步修复测试');
console.log('====================');

console.log('\n📋 测试步骤:');
console.log('1. 启动应用程序');
console.log('2. 打开命令测试页面');
console.log('3. 等待接收到平台状态数据 (应该看到16个平台)');
console.log('4. 选择一个平台 (如: uav01-1a)');
console.log('5. 设置或生成UavId');
console.log('6. 点击"同步轨迹"按钮');

console.log('\n🔍 预期结果:');
console.log('- 不应该再出现 "An object could not be cloned" 错误');
console.log('- 控制台应该显示轨迹同步成功的日志');
console.log('- 主进程日志应该显示平台数据提取信息');

console.log('\n🐛 如果仍有问题:');
console.log('- 检查开发者工具控制台的错误信息');
console.log('- 检查主进程日志 (启动应用时的终端)');
console.log('- 确认平台数据结构是否正确');

console.log('\n📊 调试信息:');
console.log('- 主进程会输出详细的平台数据结构');
console.log('- 包括 platformData, platformBase, location 等');
console.log('- 这些信息有助于确认数据提取是否正确');

console.log('\n✅ 成功标准:');
console.log('- 轨迹同步启动成功');
console.log('- 每2秒发送一次数据包');
console.log('- 使用真实的平台位置和姿态数据');
console.log('- 可以正常停止同步');

console.log('\n🚀 开始测试修复效果！');