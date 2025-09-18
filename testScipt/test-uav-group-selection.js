#!/usr/bin/env node

/**
 * 测试无人机页面分组选择功能
 * 验证从平台状态数据中提取分组信息并筛选无人机
 */

const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let root = null;
let Platforms = null;

async function loadProtobuf() {
  try {
    root = await protobuf.load([
      path.join(__dirname, '../src/protobuf/PublicStruct.proto'),
      path.join(__dirname, '../src/protobuf/PlatformStatus.proto')
    ]);
    
    Platforms = root.lookupType('PlatformStatus.Platforms');
    console.log('✅ Protobuf加载成功');
  } catch (error) {
    console.error('❌ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 创建测试用的平台状态数据
function createTestPlatformData() {
  const platforms = [
    // 第一组无人机
    {
      base: {
        name: '无人机-Alpha1',
        type: 'UAV01',
        side: '红方',
        group: '第一无人机编队',
        broken: false,
        location: {
          longitude: 106.319248,
          latitude: 36.221109,
          altitude: 1500
        },
        roll: 2.5,
        pitch: -1.2,
        yaw: 45,
        speed: 25
      },
      updateTime: Date.now()
    },
    {
      base: {
        name: '无人机-Alpha2',
        type: 'UAV01',
        side: '红方',
        group: '第一无人机编队',
        broken: false,
        location: {
          longitude: 106.320248,
          latitude: 36.222109,
          altitude: 1600
        },
        roll: -1.8,
        pitch: 0.5,
        yaw: 50,
        speed: 28
      },
      updateTime: Date.now()
    },
    // 第二组无人机
    {
      base: {
        name: '无人机-Bravo1',
        type: 'UAV01',
        side: '红方',
        group: '第二无人机编队',
        broken: false,
        location: {
          longitude: 106.321248,
          latitude: 36.223109,
          altitude: 1400
        },
        roll: 0.8,
        pitch: -2.1,
        yaw: 90,
        speed: 30
      },
      updateTime: Date.now()
    },
    {
      base: {
        name: '无人机-Bravo2',
        type: 'UAV01',
        side: '红方',
        group: '第二无人机编队',
        broken: false,
        location: {
          longitude: 106.322248,
          latitude: 36.224109,
          altitude: 1550
        },
        roll: -0.5,
        pitch: 1.8,
        yaw: 95,
        speed: 32
      },
      updateTime: Date.now()
    },
    // 第三组无人机
    {
      base: {
        name: '无人机-Charlie1',
        type: 'UAV01',
        side: '红方',
        group: '第三无人机编队',
        broken: false,
        location: {
          longitude: 106.323248,
          latitude: 36.225109,
          altitude: 1700
        },
        roll: 1.2,
        pitch: -0.8,
        yaw: 135,
        speed: 27
      },
      updateTime: Date.now()
    },
    // 其他类型平台（不是UAV01）
    {
      base: {
        name: '火炮-001',
        type: 'ROCKET_LAUNCHER',
        side: '红方',
        group: '第一无人机编队',
        broken: false,
        location: {
          longitude: 106.324248,
          latitude: 36.226109,
          altitude: 1200
        },
        roll: 0,
        pitch: 0,
        yaw: 180,
        speed: 0
      },
      updateTime: Date.now()
    },
    // 损坏的无人机（应该被过滤掉）
    {
      base: {
        name: '无人机-Delta1',
        type: 'UAV01',
        side: '红方',
        group: '第四无人机编队',
        broken: true,
        location: {
          longitude: 106.325248,
          latitude: 36.227109,
          altitude: 0
        },
        roll: 0,
        pitch: 0,
        yaw: 0,
        speed: 0
      },
      updateTime: Date.now()
    },
    // 不同类型的无人机（UAV02，应该被过滤掉）
    {
      base: {
        name: '无人机-Echo1',
        type: 'UAV02',
        side: '红方',
        group: '第五无人机编队',
        broken: false,
        location: {
          longitude: 106.326248,
          latitude: 36.228109,
          altitude: 1800
        },
        roll: 1.5,
        pitch: -1.0,
        yaw: 270,
        speed: 35
      },
      updateTime: Date.now()
    }
  ];

  return {
    platform: platforms,
    environment: {
      windSpeed: 8.5,
      windDirection: 120,
      cloudLowerAlt: 3000,
      cloudUpperAlt: 9000,
      rainUpperAlt: 0,
      rainRate: 0
    }
  };
}

// 创建协议数据包
function createProtocolPacket(protobufData, protocolID = 0x01, packageType = 0x29) {
  const size = protobufData.length;
  const packet = Buffer.alloc(8 + size);
  
  packet.writeUInt8(0xAA, 0);        // 包头1
  packet.writeUInt8(0x55, 1);        // 包头2
  packet.writeUInt8(protocolID, 2);  // 协议ID
  packet.writeUInt8(packageType, 3); // 包类型 (0x29 = PackageType_PlatformStatus)
  packet.writeUInt32LE(size, 4);     // 数据长度
  protobufData.copy(packet, 8);      // protobuf数据
  
  return packet;
}

async function sendTestData() {
  console.log('🧪 测试无人机页面分组选择功能\n');
  
  // 创建测试数据
  const platformData = createTestPlatformData();
  
  console.log('📊 测试数据概览:');
  console.log(`   总平台数: ${platformData.platform.length}`);
  
  // 统计各类型平台
  const typeStats = {};
  const groupStats = {};
  
  platformData.platform.forEach(p => {
    const type = p.base.type;
    const group = p.base.group;
    
    typeStats[type] = (typeStats[type] || 0) + 1;
    if (type === 'UAV01' && !p.base.broken) {
      groupStats[group] = (groupStats[group] || 0) + 1;
    }
  });
  
  console.log('   平台类型统计:');
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`     ${type}: ${count} 个`);
  });
  
  console.log('   无人机分组统计 (UAV01类型，可用):');
  Object.entries(groupStats).forEach(([group, count]) => {
    console.log(`     ${group}: ${count} 个无人机`);
  });
  
  // 创建protobuf消息
  const message = Platforms.create(platformData);
  const protobufBuffer = Platforms.encode(message).finish();
  
  console.log(`\n📦 Protobuf编码完成，大小: ${protobufBuffer.length} 字节`);
  
  // 创建完整的协议数据包
  const packet = createProtocolPacket(protobufBuffer);
  
  console.log(`📡 完整数据包大小: ${packet.length} 字节`);
  
  // 发送数据包
  const socket = dgram.createSocket('udp4');
  
  socket.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('❌ 发送失败:', err);
    } else {
      console.log('✅ 平台状态数据包发送成功!');
      console.log(`   组播地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
      console.log(`   包类型: 0x29 (PackageType_PlatformStatus)`);
    }
    
    socket.close();
  });
  
  // 显示预期效果
  console.log('\n🎯 预期效果:');
  console.log('1. 无人机页面应该接收到平台状态数据');
  console.log('2. 分组选择框应该显示:');
  Object.keys(groupStats).forEach(group => {
    console.log(`   - ${group}`);
  });
  console.log('3. 选择"第一无人机编队"后，无人机选择框应该显示:');
  platformData.platform
    .filter(p => p.base.group === '第一无人机编队' && p.base.type === 'UAV01' && !p.base.broken)
    .forEach(p => {
      console.log(`   - ${p.base.name}`);
    });
  console.log('4. 损坏的无人机、其他类型平台和UAV02类型应该被过滤掉');
  
  console.log('\n📋 过滤规则验证:');
  console.log('   ✅ 只显示type为"UAV01"的平台');
  console.log('   ✅ 过滤掉broken为true的平台');
  console.log('   ✅ 按group字段进行分组');
  console.log('   ✅ 不显示ROCKET_LAUNCHER等其他类型');
  console.log('   ✅ 不显示UAV02等其他无人机类型');
}

async function main() {
  await loadProtobuf();
  await sendTestData();
  
  console.log('\n💡 测试说明:');
  console.log('1. 确保无人机操作页面已打开');
  console.log('2. 确保组播监听已启动');
  console.log('3. 观察分组和无人机选择框的变化');
  console.log('4. 验证只有UAV01类型且未损坏的平台被显示');
  console.log('5. 测试分组切换时无人机列表的更新');
}

main().catch(console.error);