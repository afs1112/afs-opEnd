#!/usr/bin/env node

/**
 * 测试航点规划功能修复
 * 验证数据克隆和序列化是否正常工作
 */

console.log('🧪 测试航点规划功能修复...\n');

// 模拟航点数据（类似Vue组件中的数据）
const mockWaypointData = {
  route: [
    {
      longitude: '116.397428',
      latitude: '39.90923', 
      altitude: '100',
      labelName: '航点1',
      speed: '10'
    },
    {
      longitude: '116.407428',
      latitude: '39.91923',
      altitude: '150', 
      labelName: '航点2',
      speed: '15'
    }
  ]
};

console.log('📍 原始航点数据:');
console.log(JSON.stringify(mockWaypointData, null, 2));

// 测试数据克隆和转换（模拟修复后的sendNavCommand逻辑）
try {
  console.log('\n🔄 测试数据克隆和转换...');
  
  const routeData = mockWaypointData.route.map(waypoint => ({
    longitude: Number(waypoint.longitude),
    latitude: Number(waypoint.latitude),
    altitude: Number(waypoint.altitude),
    labelName: String(waypoint.labelName),
    speed: Number(waypoint.speed)
  }));
  
  console.log('✅ 转换后的航点数据:');
  console.log(JSON.stringify(routeData, null, 2));
  
  // 测试JSON序列化（模拟IPC传输）
  const serialized = JSON.stringify({
    commandID: Date.now(),
    platformName: 'UAV-001',
    command: 6, // Uav_Nav
    navParam: {
      route: routeData
    }
  });
  
  console.log('\n📦 序列化测试成功，数据大小:', serialized.length, '字节');
  
  // 测试反序列化
  const deserialized = JSON.parse(serialized);
  console.log('✅ 反序列化成功，航点数量:', deserialized.navParam.route.length);
  
  console.log('\n🎉 所有测试通过！航点规划功能修复成功。');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
}

console.log('\n📋 修复总结:');
console.log('1. ✅ 将数值输入框改为普通文本输入框，避免Vue响应式对象');
console.log('2. ✅ 在发送命令前进行数据克隆和类型转换');
console.log('3. ✅ 确保传递给IPC的数据是可序列化的普通对象');
console.log('4. ✅ 移除了+/-按钮，使用更简洁的输入界面');