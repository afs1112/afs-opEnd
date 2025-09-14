#!/usr/bin/env node

/**
 * 组播回环测试
 * 测试发送命令后是否能在监听页面看到数据包
 */

console.log('=== 组播回环测试 ===\n');

// 模拟平台命令数据
const testPlatformCommand = {
  commandID: Date.now(),
  platformName: 'TEST-UAV-001',
  command: 1, // Uav_Sensor_On
  sensorParam: {
    sensorName: 'EO-Pod-1',
    azSlew: 0,
    elSlew: 0
  }
};

console.log('📋 测试平台命令数据:');
console.log(JSON.stringify(testPlatformCommand, null, 2));

console.log('\\n🔧 测试步骤:');
console.log('1. 确保应用程序正在运行');
console.log('2. 打开组播监听页面，点击"开始监听"');
console.log('3. 打开命令测试页面');
console.log('4. 选择平台: TEST-UAV-001 (如果可用)');
console.log('5. 选择传感器: EO-Pod-1 (如果可用)');
console.log('6. 点击"传感器开启"按钮');
console.log('7. 检查组播监听页面是否收到数据包');

console.log('\\n✅ 预期结果:');
console.log('- 命令测试页面显示"传感器命令发送成功"');
console.log('- 组播监听页面显示新的数据包');
console.log('- 数据包类型应该是 PlatformCmd (0x2A)');
console.log('- 解析数据应该包含发送的命令信息');

console.log('\\n🐛 如果没有看到数据包:');
console.log('1. 检查组播监听状态是否为"监听中"');
console.log('2. 检查控制台是否有错误信息');
console.log('3. 检查主进程日志输出');
console.log('4. 尝试重启应用程序');

console.log('\\n📊 数据包格式检查:');
console.log('- 包头: AA 55');
console.log('- 协议ID: 应该匹配protobuf定义');
console.log('- 包类型: 0x2A (PlatformCmd)');
console.log('- 数据长度: > 8字节');
console.log('- Protobuf解析: 应该成功');

console.log('\\n🔍 调试提示:');
console.log('如果发送成功但监听页面没有显示:');
console.log('- 可能是组播地址/端口配置不匹配');
console.log('- 可能是网络接口配置问题');
console.log('- 可能是防火墙阻止了组播数据');
console.log('- 可能是protobuf解析失败');

console.log('\\n✨ 测试完成后:');
console.log('如果测试成功，说明组播发送和接收都正常工作');
console.log('如果测试失败，请按照调试提示逐步排查问题');

console.log('\\n=== 测试指南结束 ===');