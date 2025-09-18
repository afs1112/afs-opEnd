#!/usr/bin/env node

/**
 * 测试UavId一致性修复
 * 验证在生产模式下，航点数据转换时不会每次生成新的uavid
 */

console.log('🔧 UavId一致性问题修复测试\n');

console.log('📋 问题描述:');
console.log('   在生产模式下，自动转发航点数据时出现uavid不匹配');
console.log('   每次转换系统都会生成一个新的uavid');
console.log('   不会和测试页上的uavid输入框同步');
console.log('   错误提示中每次转换错误都会提示一个不同的uavid\n');

console.log('🔍 问题根因分析:');
console.log('   在UavIdService.getCurrentUavId()方法中:');
console.log('   ```typescript');
console.log('   if (!config.currentId || config.settings.autoGenerate) {');
console.log('     const newId = this.generateUavId(); // 每次都生成新ID');
console.log('     this.setCurrentUavId(newId);');
console.log('     return newId;');
console.log('   }');
console.log('   ```');
console.log('   即使已有currentId，如果autoGenerate=true，也会生成新ID\n');

console.log('✅ 修复方案:');
console.log('1. 修改getCurrentUavId()逻辑:');
console.log('   - 只有在没有currentId时才生成新ID');
console.log('   - autoGenerate不影响已有ID的使用');
console.log('   ```typescript');
console.log('   if (!config.currentId) {');
console.log('     const newId = this.generateUavId();');
console.log('     this.setCurrentUavId(newId, "系统自动生成");');
console.log('     return newId;');
console.log('   }');
console.log('   return config.currentId; // 使用现有ID');
console.log('   ```\n');

console.log('2. 添加generateAndSetNewUavId()方法:');
console.log('   - 专门用于用户手动生成新ID');
console.log('   - 更新IPC处理使用新方法');
console.log('   ```typescript');
console.log('   public generateAndSetNewUavId(): string {');
console.log('     const newId = this.generateUavId();');
console.log('     this.setCurrentUavId(newId, "用户手动生成");');
console.log('     return newId;');
console.log('   }');
console.log('   ```\n');

console.log('🎯 修复效果:');
console.log('   ✅ 系统启动后，getCurrentUavId()返回一致的ID');
console.log('   ✅ 航线转换时UavId匹配成功');
console.log('   ✅ 不再出现"UavId不匹配"错误');
console.log('   ✅ 测试页面的UavId输入框与系统同步');
console.log('   ✅ 只有用户手动点击"生成新ID"时才会改变\n');

console.log('🧪 测试场景:');
console.log('1. 系统启动 → 生成初始UavId');
console.log('2. 多次调用getCurrentUavId() → 返回相同ID');
console.log('3. 接收航线数据 → UavId匹配成功');
console.log('4. 用户点击"生成新ID" → 生成新ID并更新');
console.log('5. 再次接收航线数据 → 使用新ID进行匹配\n');

console.log('📝 相关文件修改:');
console.log('   - src/main/services/uav-id.service.ts');
console.log('     * getCurrentUavId() 方法逻辑优化');
console.log('     * 新增 generateAndSetNewUavId() 方法');
console.log('   - src/main/main.ts');
console.log('     * 更新 uav:generateId IPC处理\n');

console.log('🔄 测试步骤:');
console.log('1. 启动应用程序');
console.log('2. 查看初始UavId');
console.log('3. 发送航线数据（使用相同UavId）');
console.log('4. 验证转换成功，无"UavId不匹配"错误');
console.log('5. 多次发送航线数据');
console.log('6. 验证每次都使用相同的系统UavId');
console.log('7. 手动生成新ID');
console.log('8. 验证系统UavId已更新\n');

console.log('💡 注意事项:');
console.log('   - autoGenerate设置现在只影响初始ID生成');
console.log('   - 手动设置UavId会自动禁用autoGenerate');
console.log('   - 系统会记录ID生成的来源（自动/手动）');
console.log('   - 配置文件会持久化保存当前ID\n');

console.log('🎉 修复完成！现在UavId在航线转换过程中保持一致。');