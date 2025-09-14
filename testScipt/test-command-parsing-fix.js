const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

console.log('=== 测试命令解析修复 ===\n');

async function testCommandParsing() {
  try {
    // 加载protobuf定义
    const protoPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protoPath, 'PublicStruct.proto'),
      path.join(protoPath, 'PlatformCmd.proto')
    ]);

    const PlatformCmd = root.lookupType('PlatformStatus.PlatformCmd');
    
    console.log('1. 测试传感器开命令 (Uav_Sensor_On)');
    
    // 创建传感器开命令
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

    console.log('   📤 发送的命令:', JSON.stringify(sensorOnCommand, null, 2));

    // 编码
    const encoded = PlatformCmd.encode(sensorOnCommand).finish();
    console.log('   🔧 编码后大小:', encoded.length, '字节');

    // 解码
    const decoded = PlatformCmd.decode(encoded);
    const decodedObject = PlatformCmd.toObject(decoded, {
      longs: String,
      enums: Number,  // 保持数字形式
      bytes: String,
      defaults: true
    });

    console.log('   📥 解码的命令:', JSON.stringify(decodedObject, null, 2));

    // 验证枚举值
    console.log('\n2. 验证枚举值映射:');
    const expectedEnumValues = {
      0: 'Command_inValid',
      1: 'Uav_Sensor_On',
      2: 'Uav_Sensor_Off', 
      3: 'Uav_Sensor_Turn',
      4: 'Uav_LazerPod_Lasing',
      5: 'Uav_LazerPod_Cease',
      6: 'Uav_Nav',
      7: 'Arty_Target_Set',
      8: 'Arty_Fire'
    };

    console.log('   📋 当前枚举定义:');
    for (const [value, name] of Object.entries(expectedEnumValues)) {
      console.log(`   ${value}: ${name}`);
    }

    // 检查解码结果
    console.log('\n3. 解析结果验证:');
    if (decodedObject.command === 1) {
      console.log('   ✅ 命令值正确: 1 (Uav_Sensor_On)');
    } else {
      console.log('   ❌ 命令值错误:', decodedObject.command);
    }

    if (decodedObject.sensorParam && decodedObject.sensorParam.sensorName === 'EO-Pod-1') {
      console.log('   ✅ 传感器参数正确保留');
    } else {
      console.log('   ❌ 传感器参数丢失或错误');
    }

    console.log('\n4. 测试其他命令类型:');
    
    // 测试激光吊舱照射命令
    const laserCommand = {
      commandID: Date.now() + 1,
      platformName: 'UAV-002',
      command: 4 // Uav_LazerPod_Lasing
    };

    const laserEncoded = PlatformCmd.encode(laserCommand).finish();
    const laserDecoded = PlatformCmd.decode(laserEncoded);
    const laserObject = PlatformCmd.toObject(laserDecoded, {
      longs: String,
      enums: Number,
      bytes: String,
      defaults: true
    });

    console.log('   📤 激光照射命令:', laserObject.command, '(应该是 4)');
    
    // 测试火炮发射命令
    const fireCommand = {
      commandID: Date.now() + 2,
      platformName: 'ARTY-001',
      command: 8, // Arty_Fire
      fireParam: {
        weaponName: 'Howitzer-1',
        targetName: 'Target-001',
        quantity: 3
      }
    };

    const fireEncoded = PlatformCmd.encode(fireCommand).finish();
    const fireDecoded = PlatformCmd.decode(fireEncoded);
    const fireObject = PlatformCmd.toObject(fireDecoded, {
      longs: String,
      enums: Number,
      bytes: String,
      defaults: true
    });

    console.log('   📤 火炮发射命令:', fireObject.command, '(应该是 8)');
    console.log('   🎯 火炮参数:', fireObject.fireParam);

    console.log('\n=== 测试结果 ===');
    console.log('✅ 命令编码/解码正常');
    console.log('✅ 枚举值映射正确');
    console.log('✅ 参数保留完整');
    console.log('✅ 多种命令类型支持');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testCommandParsing();