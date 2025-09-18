#!/usr/bin/env node

/**
 * 测试火炮页面分组选择功能
 * 验证从平台状态数据中提取分组信息并筛选火炮
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
    // 第一组火炮
    {
      base: {
        name: '火炮-A1',
        type: 'ROCKET_LAUNCHER',
        side: '红方',
        group: '第一炮兵群',
        broken: false,
        location: {
          longitude: 106.319248,
          latitude: 36.221109,
          altitude: 1200
        },
        roll: 0,
        pitch: 0,
        yaw: 45,
        speed: 0
      },
      updateTime: Date.now()
    },
    {
      base: {
        name: '火炮-A2',
        type: 'ROCKET_LAUNCHER',
        side: '红方',
        group: '第一炮兵群',
        broken: false,
        location: {
          longitude: 106.320248,
          latitude: 36.222109,
          altitude: 1200
        },
        roll: 0,
        pitch: 0,
        yaw: 45,
        speed: 0
      },
      updateTime: Date.now()
    },
    // 第二组火炮
    {
      base: {
        name: '火炮-B1',
        type: 'ROCKET_LAUNCHER',
        side: '红方',
        group: '第二炮兵群',
        broken: false,
        location: {
          longitude: 106.321248,
          latitude: 36.223109,
          altitude: 1200
        },
        roll: 0,
        pitch: 0,
        yaw: 90,
        speed: 0
      },
      updateTime: Date.now()
    },
    // 其他类型平台（不是火炮）
    {
      base: {
        name: '无人机-001',
        type: 'UAV',
        side: '红方',
        group: '第一炮兵群',
        broken: false,
        location: {
          longitude: 106.322248,
          latitude: 36.224109,
          altitude: 1500
        },
        roll: 2,
        pitch: -1,
        yaw: 120,
        speed: 50
      },
      updateTime: Date.now()
    },
    // 损坏的火炮（应该被过滤掉）
    {
      base: {
        name: '火炮-C1',
        type: 'ROCKET_LAUNCHER',
        side: '红方',
        group: '第三炮兵群',
        broken: true,
        location: {
          longitude: 106.323248,
          latitude: 36.225109,
          altitude: 1200
        },
        roll: 0,
        pitch: 0,
        yaw: 180,
        speed: 0
      },
      updateTime: Date.now()
    }
  ];

  return {
    platform: platforms,
    environment: {
      windSpeed: 5.2,
      windDirection: 45,
      cloudLowerAlt: 2000,
      cloudUpperAlt: 8000,
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
  console.log('🧪 测试火炮页面分组选择功能\n');
  
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
    if (type === 'ROCKET_LAUNCHER' && !p.base.broken) {
      groupStats[group] = (groupStats[group] || 0) + 1;
    }
  });
  
  console.log('   平台类型统计:');
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`     ${type}: ${count} 个`);
  });
  
  console.log('   火炮分组统计 (可用):');
  Object.entries(groupStats).forEach(([group, count]) => {
    console.log(`     ${group}: ${count} 个火炮`);
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
  console.log('1. 火炮页面应该接收到平台状态数据');
  console.log('2. 分组选择框应该显示:');
  Object.keys(groupStats).forEach(group => {
    console.log(`   - ${group}`);
  });
  console.log('3. 选择"第一炮兵群"后，火炮选择框应该显示:');
  platformData.platform
    .filter(p => p.base.group === '第一炮兵群' && p.base.type === 'ROCKET_LAUNCHER' && !p.base.broken)
    .forEach(p => {
      console.log(`   - ${p.base.name}`);
    });
  console.log('4. 损坏的火炮和其他类型平台应该被过滤掉');
}

async function main() {
  await loadProtobuf();
  await sendTestData();
  
  console.log('\n💡 测试说明:');
  console.log('1. 确保火炮页面已打开');
  console.log('2. 确保组播监听已启动');
  console.log('3. 观察分组和火炮选择框的变化');
  console.log('4. 验证只有ROCKET_LAUNCHER类型且未损坏的平台被显示');
}

main().catch(console.error);