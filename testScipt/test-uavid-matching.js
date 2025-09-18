console.log('🔍 UavId匹配测试指南');
console.log('===================');

console.log('\n📋 测试步骤:');
console.log('1. 启动应用程序');
console.log('2. 打开命令测试页面');
console.log('3. 设置或生成UavId (记住这个ID)');
console.log('4. 选择一个平台');
console.log('5. 使用相同的UavId发送航线数据');

console.log('\n🎯 测试场景:');

console.log('\n   ✅ 场景1: UavId匹配 + 已选择平台');
console.log('   - 系统UavId: 1234');
console.log('   - 航线UavId: 1234');
console.log('   - 已选择平台: UAV-001');
console.log('   - 预期结果: 航线转换成功，使用UAV-001作为platformName');

console.log('\n   ❌ 场景2: UavId不匹配');
console.log('   - 系统UavId: 1234');
console.log('   - 航线UavId: 5678');
console.log('   - 预期结果: 显示UavId不匹配警告，不进行转换');

console.log('\n   ⚠️  场景3: UavId匹配但未选择平台');
console.log('   - 系统UavId: 1234');
console.log('   - 航线UavId: 1234');
console.log('   - 未选择平台');
console.log('   - 预期结果: 显示"请先选择平台"警告');

console.log('\n🧪 测试命令:');
console.log('# 发送匹配的UavId (假设系统UavId是1234)');
console.log('node testScipt/test-route-conversion.js 1234');
console.log('');
console.log('# 发送不匹配的UavId');
console.log('node testScipt/test-route-conversion.js 5678');
console.log('');
console.log('# 使用默认UavId (1234)');
console.log('node testScipt/test-route-conversion.js');

console.log('\n📊 验证方法:');
console.log('1. 观察命令测试页面的消息提示');
console.log('2. 查看命令历史中的日志记录');
console.log('3. 使用test-converted-route-listener.js监听转换结果');
console.log('4. 检查控制台的详细日志');

console.log('\n✅ 成功标准:');
console.log('- UavId匹配时: 显示"航线转换成功"消息');
console.log('- UavId不匹配时: 显示"UavId不匹配"警告');
console.log('- 未选择平台时: 显示"请先选择平台"警告');
console.log('- 转换后的PlatformCmd使用正确的平台名称');

console.log('\n🔧 调试技巧:');
console.log('- 在命令测试页面查看当前UavId');
console.log('- 确保选择了平台后再发送航线');
console.log('- 观察主进程控制台的详细日志');
console.log('- 使用开发者工具查看前端日志');

console.log('\n🚀 开始测试UavId匹配功能！');