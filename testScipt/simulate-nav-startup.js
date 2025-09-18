console.log('🚀 模拟导航软件启动测试');
console.log('========================');

console.log('\n📋 说明:');
console.log('此脚本用于模拟导航软件启动过程，测试UavId同步功能');
console.log('不会真正启动Nav.exe，只是触发UavId生成和通知机制');

console.log('\n🔧 测试步骤:');
console.log('1. 确保应用程序正在运行');
console.log('2. 打开命令测试页面');
console.log('3. 记录当前显示的UavId');
console.log('4. 在主进程控制台运行此测试');
console.log('5. 观察测试页面UavId是否自动更新');

console.log('\n💡 使用方法:');
console.log('在主进程控制台中执行以下代码:');

console.log('\n```javascript');
console.log('// 模拟导航软件启动');
console.log('const { uavIdService } = require("./src/main/services/uav-id.service");');
console.log('const { BrowserWindow } = require("electron");');
console.log('');
console.log('// 生成新的UavId');
console.log('const result = uavIdService.prepareForNavigation();');
console.log('console.log("模拟导航启动结果:", result);');
console.log('');
console.log('// 通知所有窗口');
console.log('if (result.success && result.uavId) {');
console.log('  const allWindows = BrowserWindow.getAllWindows();');
console.log('  allWindows.forEach(window => {');
console.log('    window.webContents.send("nav:uavIdUpdated", {');
console.log('      uavId: result.uavId,');
console.log('      timestamp: Date.now()');
console.log('    });');
console.log('  });');
console.log('  console.log(`已通知 ${allWindows.length} 个窗口，UavId: ${result.uavId}`);');
console.log('}');
console.log('```');

console.log('\n🔍 预期结果:');
console.log('- 控制台显示新生成的UavId');
console.log('- 测试页面UavId输入框自动更新');
console.log('- 系统UavId标签同步更新');
console.log('- 状态指示器显示"✓ 已同步"');
console.log('- 出现"导航软件已启动，UavId已更新为: XXXX"消息');

console.log('\n📝 验证清单:');
console.log('□ 主进程控制台显示"模拟导航启动结果: { success: true, uavId: \'XXXX\' }"');
console.log('□ 主进程控制台显示"已通知 X 个窗口，UavId: XXXX"');
console.log('□ 渲染进程控制台显示"[CommandTestPage] 导航软件启动，UavId已更新: XXXX"');
console.log('□ 测试页面显示"导航软件已启动，UavId已更新为: XXXX"消息');
console.log('□ UavId输入框值已更新');
console.log('□ 系统UavId标签已更新');
console.log('□ 状态指示器显示"✓ 已同步"');

console.log('\n🚨 故障排除:');
console.log('如果测试失败，请检查:');
console.log('- 应用程序是否正在运行');
console.log('- 命令测试页面是否已打开');
console.log('- 事件监听器是否正确设置');
console.log('- 控制台是否有错误信息');

console.log('\n🎯 成功标准:');
console.log('- 所有验证清单项目都通过');
console.log('- 界面响应及时（< 100ms）');
console.log('- 无控制台错误');
console.log('- 用户体验流畅');

console.log('\n🚀 准备开始模拟测试！');
console.log('请在主进程控制台中复制粘贴上述代码并执行。');