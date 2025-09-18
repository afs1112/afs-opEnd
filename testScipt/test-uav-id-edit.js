console.log('🧪 UavId编辑功能测试指南');
console.log('=====================================');

console.log('\n📋 测试步骤:');
console.log('1. 启动应用程序');
console.log('2. 打开命令测试页面');
console.log('3. 查看顶部选择区域的UavId输入框');
console.log('4. 测试以下功能:');

console.log('\n🔧 功能测试项目:');

console.log('\n   📝 UavId输入框测试:');
console.log('   - 输入4位数字 (如: 1234)');
console.log('   - 尝试输入字母 (应该被过滤)');
console.log('   - 尝试输入超过4位数字 (应该被限制)');
console.log('   - 检查"当前选择"信息是否显示UavId');

console.log('\n   🎲 生成按钮测试:');
console.log('   - 点击🎲按钮生成新的4位数UavId');
console.log('   - 检查是否显示成功消息');
console.log('   - 检查输入框是否自动填充新ID');
console.log('   - 检查命令历史是否记录生成操作');

console.log('\n   🚁 同步轨迹测试:');
console.log('   - 选择一个平台');
console.log('   - 设置或生成UavId');
console.log('   - 点击"同步轨迹"按钮');
console.log('   - 检查是否使用编辑的UavId');

console.log('\n   🔄 自动加载测试:');
console.log('   - 重新加载页面');
console.log('   - 检查UavId是否自动加载之前的值');

console.log('\n✅ 预期结果:');
console.log('- UavId输入框只接受4位数字');
console.log('- 生成按钮能创建新的随机4位数ID');
console.log('- 同步轨迹使用编辑框中的UavId');
console.log('- 页面重载后能恢复之前的UavId');
console.log('- 所有操作都有相应的用户反馈');

console.log('\n🐛 常见问题排查:');
console.log('- 如果UavId不显示: 检查uav相关的IPC是否正常');
console.log('- 如果生成失败: 检查主进程的uav-id.service是否正常');
console.log('- 如果同步轨迹失败: 检查UavId是否为有效的4位数字');

console.log('\n💡 测试技巧:');
console.log('- 打开开发者工具查看控制台日志');
console.log('- 使用test-sync-trajectory.js监听组播数据');
console.log('- 检查命令历史区域的操作记录');

console.log('\n🎯 测试完成标准:');
console.log('- ✅ 能正常输入和验证UavId');
console.log('- ✅ 生成按钮工作正常');
console.log('- ✅ 同步轨迹使用正确的UavId');
console.log('- ✅ 页面状态持久化正常');
console.log('- ✅ 用户反馈清晰准确');

console.log('\n🚀 开始测试吧！');