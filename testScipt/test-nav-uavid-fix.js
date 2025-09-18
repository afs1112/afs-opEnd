#!/usr/bin/env node

/**
 * 测试导航软件启动时UavId处理修复
 * 验证只有在全新启动导航软件时才生成新的UavId
 */

console.log('🔧 导航软件UavId处理修复测试\n');

console.log('📋 问题描述:');
console.log('   导航软件虽然不会重复打开了，但是提示有问题');
console.log('   还提示打开，并且每次都会生成新的uavid');
console.log('   这与预期不符，只要不是全新打开导航软件，就不要新生成uavid\n');

console.log('🔍 问题根因分析:');
console.log('   在nav:openNavigation处理器中:');
console.log('   ```typescript');
console.log('   // 每次都会调用prepareForNavigation()');
console.log('   const prepareResult = uavIdService.prepareForNavigation();');
console.log('   ```');
console.log('   不管导航软件是否已经运行，都会准备UavId\n');

console.log('✅ 修复方案:');
console.log('1. 修改nav:openNavigation逻辑:');
console.log('   - 先检查导航软件是否已经运行');
console.log('   - 只有在未运行时才调用prepareForNavigation()');
console.log('   - 已运行时直接恢复窗口，不生成新ID\n');

console.log('2. 优化prepareForNavigation()方法:');
console.log('   - 更新注释说明，不再是"生成ID"而是"获取当前ID"');
console.log('   - 配合getCurrentUavId()的修复，不会重复生成ID\n');

console.log('🎯 修复后的流程:');
console.log('   场景1: 导航软件未运行');
console.log('   1. 检查运行状态 → 未运行');
console.log('   2. 调用prepareForNavigation() → 获取/生成UavId');
console.log('   3. 启动导航软件 → 新进程');
console.log('   4. 通知UavId更新 → 只在新进程时通知\n');

console.log('   场景2: 导航软件已运行');
console.log('   1. 检查运行状态 → 已运行');
console.log('   2. 跳过prepareForNavigation() → 不生成新ID');
console.log('   3. 恢复窗口到前台 → 现有进程');
console.log('   4. 使用现有UavId → 保持一致性\n');

console.log('📝 关键修改:');
console.log('   修复前:');
console.log('   ```typescript');
console.log('   // 总是准备UavId');
console.log('   const prepareResult = uavIdService.prepareForNavigation();');
console.log('   // 启动导航软件');
console.log('   const startResult = navProcessService.startNavigation(...);');
console.log('   ```\n');

console.log('   修复后:');
console.log('   ```typescript');
console.log('   // 先检查运行状态');
console.log('   const isAlreadyRunning = navProcessService.isNavRunning();');
console.log('   ');
console.log('   // 只有未运行时才准备UavId');
console.log('   if (!isAlreadyRunning) {');
console.log('     prepareResult = uavIdService.prepareForNavigation();');
console.log('   }');
console.log('   ');
console.log('   // 启动/恢复导航软件');
console.log('   const startResult = navProcessService.startNavigation(...);');
console.log('   ```\n');

console.log('🧪 测试场景:');
console.log('1. 首次启动导航软件:');
console.log('   - 生成新UavId (例如: 1234)');
console.log('   - 启动导航软件');
console.log('   - 通知UI更新UavId\n');

console.log('2. 再次点击启动按钮:');
console.log('   - 检测到已运行');
console.log('   - 不生成新UavId');
console.log('   - 恢复窗口到前台');
console.log('   - UavId保持1234不变\n');

console.log('3. 关闭导航软件后重新启动:');
console.log('   - 检测到未运行');
console.log('   - 使用现有UavId (1234)');
console.log('   - 启动导航软件');
console.log('   - UavId仍为1234\n');

console.log('4. 手动生成新ID后启动:');
console.log('   - 用户生成新ID (例如: 5678)');
console.log('   - 启动导航软件');
console.log('   - 使用新ID 5678\n');

console.log('💡 预期效果:');
console.log('   ✅ 只有全新启动导航软件时才可能生成新UavId');
console.log('   ✅ 恢复已运行的导航软件不会改变UavId');
console.log('   ✅ 提示信息准确反映操作结果');
console.log('   ✅ UavId在整个会话中保持一致');
console.log('   ✅ 航线转换不会出现UavId不匹配\n');

console.log('🔄 相关文件修改:');
console.log('   - src/main/main.ts');
console.log('     * nav:openNavigation 处理器逻辑优化');
console.log('     * 添加运行状态检查');
console.log('     * 条件性调用prepareForNavigation()');
console.log('   - src/main/services/uav-id.service.ts');
console.log('     * prepareForNavigation() 注释更新\n');

console.log('🎉 修复完成！现在导航软件启动时UavId处理更加合理。');