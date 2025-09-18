console.log('🔄 导航软件进程管理测试');
console.log('========================');

console.log('\n🎯 测试目标:');
console.log('- 验证导航软件进程检测功能');
console.log('- 测试重复启动时的窗口恢复功能');
console.log('- 验证进程状态显示和管理功能');
console.log('- 确保不会创建多个导航进程');

console.log('\n🔧 新增功能:');
console.log('1. 进程检测: 检查导航软件是否已在运行');
console.log('2. 窗口恢复: 如果已运行，恢复窗口到前台');
console.log('3. 状态显示: 实时显示导航软件运行状态');
console.log('4. 进程管理: 提供停止导航软件的功能');

console.log('\n🧪 测试场景:');

console.log('\n   📝 场景1: 首次启动测试');
console.log('   步骤:');
console.log('   1. 确保导航软件未运行');
console.log('   2. 点击"打开导航软件"按钮');
console.log('   3. 观察导航软件启动');
console.log('   预期: 启动新进程，显示"导航软件已启动"');

console.log('\n   🔄 场景2: 重复启动测试');
console.log('   步骤:');
console.log('   1. 导航软件已在运行');
console.log('   2. 再次点击"打开导航软件"按钮');
console.log('   3. 观察系统行为');
console.log('   预期: 不启动新进程，恢复现有窗口，显示"已恢复到前台"');

console.log('\n   📊 场景3: 状态显示测试');
console.log('   步骤:');
console.log('   1. 启动导航软件');
console.log('   2. 观察UavOperationPage的状态显示');
console.log('   3. 检查按钮状态变化');
console.log('   预期: 显示"运行中 (PID: XXXX)"，启动按钮禁用，停止按钮启用');

console.log('\n   🛑 场景4: 停止功能测试');
console.log('   步骤:');
console.log('   1. 导航软件运行中');
console.log('   2. 点击"停止导航软件"按钮');
console.log('   3. 观察进程是否正确终止');
console.log('   预期: 导航软件关闭，状态更新为"未运行"');

console.log('\n   🔄 场景5: 窗口最小化恢复测试');
console.log('   步骤:');
console.log('   1. 启动导航软件');
console.log('   2. 手动最小化导航软件窗口');
console.log('   3. 再次点击"打开导航软件"');
console.log('   预期: 导航软件窗口恢复到前台');

console.log('\n📊 验证要点:');

console.log('\n   🔍 进程检测验证:');
console.log('   - 系统能正确检测导航软件是否在运行');
console.log('   - 进程PID显示正确');
console.log('   - 状态更新及时准确');

console.log('\n   🎯 用户体验验证:');
console.log('   - 重复点击不会创建多个进程');
console.log('   - 窗口恢复功能正常工作');
console.log('   - 按钮状态正确反映系统状态');
console.log('   - 提示消息清晰准确');

console.log('\n   📝 日志验证:');
console.log('   主进程控制台应显示:');
console.log('   - "[NavProcess] 导航软件已在运行，PID: XXXX"');
console.log('   - "[NavProcess] 启动新的导航软件进程..."');
console.log('   - "[Nav] 是否为新进程: true/false"');
console.log('   ');
console.log('   渲染进程应显示:');
console.log('   - "导航软件已启动" (新进程)');
console.log('   - "导航软件已恢复到前台" (现有进程)');

console.log('\n🚨 常见问题排查:');

console.log('\n   ❌ 问题1: 窗口恢复不工作');
console.log('   可能原因:');
console.log('   - 平台特定的窗口管理API失败');
console.log('   - 权限不足');
console.log('   - 导航软件窗口句柄无效');
console.log('   ');
console.log('   排查方法:');
console.log('   - 检查控制台的窗口恢复日志');
console.log('   - 验证平台特定的恢复逻辑');
console.log('   - 测试不同操作系统的兼容性');

console.log('\n   ❌ 问题2: 进程检测不准确');
console.log('   可能原因:');
console.log('   - 进程PID缓存过期');
console.log('   - 进程意外终止未被检测到');
console.log('   - 权限问题导致检测失败');
console.log('   ');
console.log('   排查方法:');
console.log('   - 检查进程检测逻辑');
console.log('   - 验证进程退出事件监听');
console.log('   - 测试异常情况处理');

console.log('\n   ❌ 问题3: 状态更新延迟');
console.log('   可能原因:');
console.log('   - 定时器间隔过长');
console.log('   - 状态查询性能问题');
console.log('   - 事件监听器未正确设置');
console.log('   ');
console.log('   排查方法:');
console.log('   - 调整状态更新频率');
console.log('   - 优化状态查询逻辑');
console.log('   - 检查事件驱动更新');

console.log('\n🎨 平台兼容性:');

console.log('\n   🪟 Windows:');
console.log('   - 使用PowerShell和Win32 API');
console.log('   - 支持窗口最小化检测和恢复');
console.log('   - 进程名称: Nav.exe');

console.log('\n   🍎 macOS:');
console.log('   - 使用AppleScript');
console.log('   - 支持应用程序可见性控制');
console.log('   - 进程名称: Nav');

console.log('\n   🐧 Linux:');
console.log('   - 使用wmctrl工具');
console.log('   - 需要安装窗口管理工具');
console.log('   - 进程名称: Nav');

console.log('\n✅ 成功标准:');
console.log('- 重复启动不创建多个进程');
console.log('- 窗口恢复功能在所有平台正常工作');
console.log('- 状态显示准确及时');
console.log('- 停止功能正确终止进程');
console.log('- 用户体验流畅直观');

console.log('\n📋 测试步骤:');
console.log('1. 启动应用程序');
console.log('2. 打开UavOperationPage');
console.log('3. 按照测试场景1-5依次测试');
console.log('4. 验证所有平台的兼容性');
console.log('5. 检查日志输出和错误处理');

console.log('\n🔧 调试技巧:');
console.log('- 使用任务管理器/活动监视器查看进程');
console.log('- 观察主进程和渲染进程的控制台日志');
console.log('- 测试异常情况（手动终止进程等）');
console.log('- 验证不同操作系统的行为差异');

console.log('\n🚀 开始测试导航软件进程管理功能！');
console.log('\n💡 提示: 建议在不同操作系统上都进行测试，确保跨平台兼容性');