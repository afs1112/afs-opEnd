const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

console.log('=== 最终命令解析验证 ===\n');

async function testFinalCommandParsing() {
  try {
    // 加载protobuf定义
    const protoPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protoPath, 'PublicStruct.proto'),
      path.join(protoPath, 'PlatformCmd.proto')
    ]);

    const PlatformCmd = root.lookupType('PlatformStatus.PlatformCmd');
    
    console.log('1. 测试传感器开命令解析');
    
    // 创建传感器开命令 (这是你发送的命令)
    const sensorOnCommand = {
      commandID: Date.now(),
      platformName: 'UAV-001',
      command: 1, // Uav_Sensor_On
      sensorParam: {
        sensorName: 'EO-Pod-1',
        azSlew: 45.0,
        elSlew: -10.0
      }
    };

    console.log('   📤 发送命令: 传感器开 (command: 1)');

    // 编码
    const encoded = PlatformCmd.encode(sensorOnCommand).finish();
    
    // 解码 - 模拟protobuf parser service的行为
    const decoded = PlatformCmd.decode(encoded);
    
    // 使用String枚举显示 (修复后的方式)
    const decodedWithStringEnum = PlatformCmd.toObject(decoded, {
      longs: String,
      enums: String,  // 显示枚举名称
      bytes: String,
      defaults: true
    });

    // 使用Number枚举显示 (修复前的方式)
    const decodedWithNumberEnum = PlatformCmd.toObject(decoded, {
      longs: String,
      enums: Number,  // 显示枚举数值
      bytes: String,
      defaults: true
    });

    console.log('\n2. 解析结果对比:');
    console.log('   🔧 修复前 (enums: Number):');
    console.log('      command:', decodedWithNumberEnum.command, '(只显示数字)');
    
    console.log('   ✅ 修复后 (enums: String):');
    console.log('      command:', decodedWithStringEnum.command, '(显示枚举名称)');

    console.log('\n3. 完整解析结果:');
    console.log('   📋 命令详情:');
    console.log('      - 命令ID:', decodedWithStringEnum.commandID);
    console.log('      - 平台名称:', decodedWithStringEnum.platformName);
    console.log('      - 命令类型:', decodedWithStringEnum.command);
    console.log('      - 传感器参数:', decodedWithStringEnum.sensorParam);

    console.log('\n4. 验证其他命令类型:');
    
    const testCommands = [
      { name: '传感器关', command: 2, expected: 'Uav_Sensor_Off' },
      { name: '传感器转向', command: 3, expected: 'Uav_Sensor_Turn' },
      { name: '激光照射', command: 4, expected: 'Uav_LazerPod_Lasing' },
      { name: '激光停止', command: 5, expected: 'Uav_LazerPod_Cease' },
      { name: '航线规划', command: 6, expected: 'Uav_Nav' },
      { name: '目标装订', command: 7, expected: 'Arty_Target_Set' },
      { name: '火炮发射', command: 8, expected: 'Arty_Fire' }
    ];

    for (const test of testCommands) {
      const testCmd = {
        commandID: Date.now(),
        platformName: 'TEST-PLATFORM',
        command: test.command
      };
      
      const testEncoded = PlatformCmd.encode(testCmd).finish();
      const testDecoded = PlatformCmd.decode(testEncoded);
      const testObject = PlatformCmd.toObject(testDecoded, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true
      });
      
      const isCorrect = testObject.command === test.expected;
      console.log(`   ${isCorrect ? '✅' : '❌'} ${test.name}: ${test.command} → ${testObject.command}`);
    }

    console.log('\n=== 修复总结 ===');
    console.log('🔧 问题原因:');
    console.log('   1. build目录中的protobuf文件使用了旧的枚举定义');
    console.log('   2. protobuf parser使用 enums: Number 只显示数值');
    console.log('   3. 枚举值不匹配导致解析错误');
    
    console.log('\n✅ 修复措施:');
    console.log('   1. 更新了build目录中的PlatformCmd.proto文件');
    console.log('   2. 修改protobuf parser使用 enums: String 显示名称');
    console.log('   3. 更新了所有测试脚本中的枚举值');
    console.log('   4. 重新构建项目确保一致性');

    console.log('\n🎉 现在发送"传感器开"命令应该正确显示为: Uav_Sensor_On');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFinalCommandParsing();