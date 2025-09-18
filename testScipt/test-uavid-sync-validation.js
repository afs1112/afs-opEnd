console.log('🔍 UavId同步修复验证指南');
console.log('==========================');

console.log('\n📋 验证清单:');

console.log('\n✅ 1. 基础功能验证');
console.log('   □ 应用启动后，测试页面能正确加载当前UavId');
console.log('   □ UavId输入框与系统UavId标签显示一致');
console.log('   □ 状态指示器正确显示同步状态');

console.log('\n✅ 2. 导航启动同步验证');
console.log('   □ 点击启动导航软件按钮');
console.log('   □ 观察到"导航软件已启动，UavId已更新为: XXXX"消息');
console.log('   □ UavId输入框自动更新为新生成的ID');
console.log('   □ 系统UavId标签同步更新');
console.log('   □ 状态指示器显示"✓ 已同步"');

console.log('\n✅ 3. 航线转换验证');
console.log('   □ 选择一个平台');
console.log('   □ 使用当前显示的UavId发送航线数据');
console.log('   □ 不再出现"UavId不匹配"错误');
console.log('   □ 航线转换成功完成');

console.log('\n✅ 4. 手动操作验证');
console.log('   □ 手动修改UavId输入框');
console.log('   □ 自动同步功能正常工作');
console.log('   □ 生成新ID功能正常');
console.log('   □ 从系统加载功能正常');

console.log('\n🧪 详细测试步骤:');

console.log('\n📝 测试场景A: 冷启动测试');
console.log('1. 关闭应用程序');
console.log('2. 重新启动应用程序');
console.log('3. 打开命令测试页面');
console.log('4. 记录初始UavId (例如: 1234)');
console.log('5. 点击"启动导航软件"');
console.log('6. 验证UavId是否自动更新 (例如: 5678)');
console.log('7. 发送航线数据，验证匹配成功');

console.log('\n📝 测试场景B: 热更新测试');
console.log('1. 应用已运行，测试页面已打开');
console.log('2. 当前UavId为 1234');
console.log('3. 在其他页面启动导航软件');
console.log('4. 返回测试页面，验证UavId是否更新');
console.log('5. 验证状态同步是否正确');

console.log('\n📝 测试场景C: 多次启动测试');
console.log('1. 启动导航软件，记录UavId A');
console.log('2. 关闭导航软件');
console.log('3. 再次启动导航软件，记录UavId B');
console.log('4. 验证测试页面显示UavId B');
console.log('5. 验证航线转换使用UavId B');

console.log('\n🔍 关键验证点:');

console.log('\n   🎯 界面同步验证:');
console.log('   - UavId输入框值 === 系统UavId标签值');
console.log('   - 状态指示器显示"✓ 已同步"');
console.log('   - 消息提示正确显示');

console.log('\n   🎯 功能验证:');
console.log('   - getCurrentUavId() 返回的值与界面显示一致');
console.log('   - 航线转换时UavId匹配成功');
console.log('   - Nav配置文件中的ID1与界面一致');

console.log('\n   🎯 日志验证:');
console.log('   主进程控制台应显示:');
console.log('   - "[Nav] 使用UavId: XXXX"');
console.log('   - "[UavId] 生成UavId: XXXX"');
console.log('   ');
console.log('   渲染进程控制台应显示:');
console.log('   - "[CommandTestPage] 导航软件启动，UavId已更新: XXXX"');
console.log('   - "UavId已更新: XXXX"');

console.log('\n🚨 常见问题排查:');

console.log('\n   ❌ 问题1: 界面没有自动更新');
console.log('   可能原因:');
console.log('   - 事件监听器未正确设置');
console.log('   - 主进程未发送通知事件');
console.log('   - 渲染进程未接收到事件');
console.log('   ');
console.log('   排查方法:');
console.log('   - 检查控制台是否有事件相关日志');
console.log('   - 验证allWindows是否包含当前窗口');
console.log('   - 检查事件名称是否匹配');

console.log('\n   ❌ 问题2: UavId仍然不匹配');
console.log('   可能原因:');
console.log('   - 界面更新了但系统UavId没有更新');
console.log('   - 配置文件写入失败');
console.log('   - 缓存问题');
console.log('   ');
console.log('   排查方法:');
console.log('   - 检查uav-id-config.json文件内容');
console.log('   - 检查Nav/data/config.ini文件的ID1值');
console.log('   - 重启应用程序清除缓存');

console.log('\n   ❌ 问题3: 状态指示器不正确');
console.log('   可能原因:');
console.log('   - updateSyncStatus方法逻辑错误');
console.log('   - 变量值比较问题');
console.log('   ');
console.log('   排查方法:');
console.log('   - 打印currentUavId和systemUavId的值');
console.log('   - 检查字符串比较是否正确');

console.log('\n📊 性能验证:');
console.log('- 事件响应时间 < 100ms');
console.log('- 界面更新流畅，无卡顿');
console.log('- 内存使用正常，无泄漏');

console.log('\n🎯 用户体验验证:');
console.log('- 操作直观，无需额外说明');
console.log('- 状态反馈及时准确');
console.log('- 错误提示清晰有用');
console.log('- 整体流程顺畅');

console.log('\n✅ 验证通过标准:');
console.log('- 所有测试场景都能正确工作');
console.log('- 界面显示与系统状态完全一致');
console.log('- 不再出现UavId不匹配错误');
console.log('- 用户操作体验良好');

console.log('\n🚀 开始验证UavId同步修复效果！');
console.log('\n💡 提示: 建议按照测试场景A→B→C的顺序进行验证');