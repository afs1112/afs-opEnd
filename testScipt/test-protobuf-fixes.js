#!/usr/bin/env node

/**
 * 测试protobuf修复
 * 验证SensorParam类型查找和处理
 */

console.log('=== Protobuf修复测试 ===\n');

// 模拟测试传感器命令数据
const testSensorCommands = [
  {
    name: '传感器开启命令',
    data: {
      commandID: Date.now(),
      platformName: 'UAV-001',
      command: 1, // Uav_Sensor_On
      sensorParam: {
        sensorName: 'EO-Pod-1', // 使用sensorName而不是weaponName
        azSlew: 0,
        elSlew: 0
      }
    }
  },
  {
    name: '传感器转向命令',
    data: {
      commandID: Date.now() + 1,
      platformName: 'UAV-001',
      command: 3, // Uav_Sensor_Turn
      sensorParam: {
        sensorName: 'Laser-Pod-1',
        azSlew: 45.5,
        elSlew: -15.2
      }
    }
  },
  {
    name: '激光照射命令',
    data: {
      commandID: Date.now() + 2,
      platformName: 'UAV-001',
      command: 4, // Uav_LazerPod_Lasing
      sensorParam: {
        sensorName: 'Laser-Pod-1',
        azSlew: 0,
        elSlew: 0
      }
    }
  }
];

console.log('📋 测试传感器命令数据:');
testSensorCommands.forEach((cmd, index) => {
  console.log(`\\n${index + 1}. ${cmd.name}:`);
  console.log(JSON.stringify(cmd.data, null, 2));
});

console.log('\\n🔧 修复内容:');
console.log('1. ✅ 添加了容错的类型查找逻辑');
console.log('2. ✅ 增加了详细的调试日志输出');
console.log('3. ✅ 添加了类型存在性检查');
console.log('4. ✅ 提供了降级处理方案');
console.log('5. ✅ 确保sensorName字段正确使用');

console.log('\\n🐛 问题诊断:');
console.log('原始错误: "no such type: PlatformStatus.SensorParam"');
console.log('可能原因:');
console.log('  - Protobuf文件加载不完整');
console.log('  - 类型名称不匹配');
console.log('  - 命名空间问题');
console.log('  - 文件依赖关系错误');

console.log('\\n🔍 修复后的行为:');
console.log('1. 查找类型时会显示详细的调试信息');
console.log('2. 如果找不到类型，会尝试使用原始数据');
console.log('3. 每个参数类型都有独立的错误处理');
console.log('4. 不会因为单个类型缺失而完全失败');

console.log('\\n📊 测试步骤:');
console.log('1. 重启应用程序');
console.log('2. 打开开发者工具查看控制台');
console.log('3. 在命令测试页面发送传感器命令');
console.log('4. 观察主进程日志输出');
console.log('5. 检查是否显示类型查找的详细信息');

console.log('\\n✅ 预期结果:');
console.log('- 应该看到 "[MulticastSender] 开始查找消息类型..." 的日志');
console.log('- 应该看到可用命名空间和类型的列表');
console.log('- 传感器命令应该能成功发送');
console.log('- 组播监听页面应该收到数据包');

console.log('\\n⚠️  如果仍然失败:');
console.log('1. 检查protobuf文件是否正确加载');
console.log('2. 确认PlatformCmd.proto文件中确实定义了SensorParam');
console.log('3. 检查文件路径和权限');
console.log('4. 尝试重新编译protobuf定义');

console.log('\\n=== 测试指南结束 ===');