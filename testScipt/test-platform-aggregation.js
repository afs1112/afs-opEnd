console.log('📊 平台状态和命令信息归拢测试');
console.log('==============================');

console.log('\n🎯 测试目标:');
console.log('- 验证平台状态包 (0x29) 的归拢功能');
console.log('- 验证平台命令包 (0x2A) 的归拢功能');
console.log('- 确认只保留最近10条记录');
console.log('- 验证统计信息的准确性');

console.log('\n📋 测试步骤:');
console.log('1. 启动应用程序');
console.log('2. 打开组播监听页面');
console.log('3. 启动组播监听');
console.log('4. 运行数据源发送测试数据');
console.log('5. 观察归拢效果');

console.log('\n🧪 测试数据源:');
console.log('# 发送平台状态数据');
console.log('node testScipt/test-simple-uav-track.js');
console.log('');
console.log('# 发送平台命令数据');
console.log('# (在命令测试页面发送各种命令)');
console.log('');
console.log('# 发送航线转换数据');
console.log('node testScipt/test-route-conversion.js');

console.log('\n📊 验证内容:');

console.log('\n   📈 平台状态归拢:');
console.log('   - 状态包计数器正确显示');
console.log('   - 平台状态汇聚区域出现');
console.log('   - 显示平台数量统计');
console.log('   - 只保留最近10条状态');
console.log('   - 可以展开/折叠详情');
console.log('   - 复制摘要功能正常');

console.log('\n   🎮 平台命令归拢:');
console.log('   - 命令包计数器正确显示');
console.log('   - 平台命令汇聚区域出现');
console.log('   - 显示命令类型统计');
console.log('   - 只保留最近10条命令');
console.log('   - 命令名称正确显示');
console.log('   - 复制摘要功能正常');

console.log('\n   🔄 数据包列表:');
console.log('   - 主列表不显示平台状态包 (0x29)');
console.log('   - 主列表不显示平台命令包 (0x2A)');
console.log('   - 主列表不显示心跳包 (0x02)');
console.log('   - 其他类型包正常显示');

console.log('\n✅ 成功标准:');
console.log('- 平台状态和命令包被正确归拢');
console.log('- 统计信息准确显示');
console.log('- 最多保留10条记录');
console.log('- 汇聚区域UI正常显示');
console.log('- 复制和清空功能正常');
console.log('- 主数据包列表保持整洁');

console.log('\n🔍 观察要点:');
console.log('- 发送超过10条状态/命令后，旧记录被自动清理');
console.log('- 统计信息实时更新');
console.log('- 不同来源的数据包被正确统计');
console.log('- 时间戳和持续时间计算正确');

console.log('\n🎨 UI验证:');
console.log('- 💓 蓝色: 心跳包汇聚');
console.log('- 📊 橙色: 平台状态汇聚');
console.log('- 🎮 青色: 平台命令汇聚');
console.log('- 每个汇聚区域有独立的展开/折叠控制');

console.log('\n🚀 开始测试平台信息归拢功能！');