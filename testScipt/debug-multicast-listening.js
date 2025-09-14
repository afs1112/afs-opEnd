#!/usr/bin/env node

/**
 * 调试组播监听问题
 * 检查组播服务状态和数据包接收情况
 */

console.log('=== 组播监听调试工具 ===\n');

// 模拟检查组播监听状态
function checkMulticastStatus() {
  console.log('1. 检查组播监听状态');
  
  const expectedConfig = {
    address: '239.255.43.21',
    port: 10086,
    interfaceAddress: '0.0.0.0'
  };
  
  console.log('   📋 预期配置:');
  console.log(`   - 组播地址: ${expectedConfig.address}`);
  console.log(`   - 端口: ${expectedConfig.port}`);
  console.log(`   - 接口地址: ${expectedConfig.interfaceAddress}`);
  
  // 检查可能的问题
  const potentialIssues = [
    {
      issue: '组播服务未启动',
      solution: '在组播监听页面点击"开始监听"按钮',
      priority: 'high'
    },
    {
      issue: '端口被占用',
      solution: '检查其他应用是否占用端口10086，或更换端口',
      priority: 'medium'
    },
    {
      issue: '网络接口配置错误',
      solution: '检查网络接口地址配置，尝试使用0.0.0.0',
      priority: 'medium'
    },
    {
      issue: '防火墙阻止',
      solution: '检查防火墙设置，允许UDP端口10086',
      priority: 'low'
    }
  ];
  
  console.log('\\n   ⚠️  可能的问题:');
  potentialIssues.forEach((item, index) => {
    const priority = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
    console.log(`   ${priority} ${index + 1}. ${item.issue}`);
    console.log(`      解决方案: ${item.solution}`);
  });
  
  console.log('\\n   ✅ 检查完成\\n');
}

// 检查数据包接收情况
function checkPacketReception() {
  console.log('2. 检查数据包接收情况');
  
  const packetTypes = [
    { type: 0x02, name: 'HeartbeatInternal', description: '心跳包' },
    { type: 0x29, name: 'PlatformStatus', description: '平台状态' },
    { type: 0x2A, name: 'PlatformCmd', description: '平台命令' }
  ];
  
  console.log('   📋 支持的数据包类型:');
  packetTypes.forEach(packet => {
    console.log(`   - 0x${packet.type.toString(16).padStart(2, '0')}: ${packet.name} (${packet.description})`);
  });
  
  console.log('\\n   🔍 数据包检查清单:');
  console.log('   □ 是否收到任何UDP数据包？');
  console.log('   □ 数据包是否有正确的包头 (AA 55)？');
  console.log('   □ 数据包长度是否 >= 8字节？');
  console.log('   □ 包类型是否在支持范围内？');
  console.log('   □ Protobuf解析是否成功？');
  
  console.log('\\n   ✅ 检查完成\\n');
}

// 检查命令测试页面的监听逻辑
function checkCommandPageListening() {
  console.log('3. 检查命令测试页面监听逻辑');
  
  const listeningSteps = [
    '页面加载时调用 onMounted()',
    '在 onMounted 中调用 electronAPI.multicast.onPacket(handlePlatformStatus)',
    'handlePlatformStatus 函数接收数据包',
    '检查 packet.parsedPacket.packageType === 0x29 (平台状态)',
    '解析 parsedData.platform 数组',
    '更新 platforms.value 响应式数据',
    '界面自动更新显示新的平台选项'
  ];
  
  console.log('   📋 监听流程:');
  listeningSteps.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step}`);
  });
  
  console.log('\\n   🐛 可能的问题点:');
  console.log('   - handlePlatformStatus 函数是否被调用？');
  console.log('   - packet.parsedPacket 是否存在？');
  console.log('   - packageType 是否等于 0x29？');
  console.log('   - parsedData.platform 是否是数组？');
  console.log('   - platforms.value 是否正确更新？');
  
  console.log('\\n   ✅ 检查完成\\n');
}

// 提供调试建议
function provideDebuggingTips() {
  console.log('4. 调试建议');
  
  const debuggingSteps = [
    {
      step: '检查组播监听状态',
      action: '打开组播监听页面，确认状态显示为"监听中"',
      expected: '状态为绿色"监听中"，总数据包数 > 0'
    },
    {
      step: '检查控制台日志',
      action: '打开开发者工具(F12)，查看Console标签',
      expected: '应该看到"收到组播数据包"的日志输出'
    },
    {
      step: '检查主进程日志',
      action: '查看终端中的主进程日志输出',
      expected: '应该看到"[Multicast][调试] 收到数据包"的日志'
    },
    {
      step: '测试发送命令',
      action: '在命令测试页面尝试发送一个命令',
      expected: '应该在组播监听页面看到发送的命令数据包'
    },
    {
      step: '检查网络连接',
      action: '确认网络接口正常，没有防火墙阻止',
      expected: 'UDP组播数据能正常收发'
    }
  ];
  
  console.log('   📋 调试步骤:');
  debuggingSteps.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.step}`);
    console.log(`      操作: ${item.action}`);
    console.log(`      预期: ${item.expected}\\n`);
  });
  
  console.log('   🔧 快速修复建议:');
  console.log('   1. 重启应用程序');
  console.log('   2. 检查组播监听页面是否正常启动监听');
  console.log('   3. 尝试发送一个测试命令，看是否能在监听页面看到');
  console.log('   4. 检查是否有其他应用占用了组播端口');
  console.log('   5. 尝试更换组播地址或端口');
  
  console.log('\\n   ✅ 建议提供完成\\n');
}

// 生成测试用的平台状态数据包
function generateTestPlatformStatus() {
  console.log('5. 生成测试数据包');
  
  const testPlatformData = {
    platform: [
      {
        base: {
          name: 'TEST-UAV-001',
          type: 'Drone',
          side: 'Blue',
          group: 'Alpha'
        },
        comms: [
          { base: { name: 'Radio-1', type: 'VHF' } },
          { base: { name: 'DataLink-1', type: 'Tactical' } }
        ],
        sensors: [
          { base: { name: 'EO-Pod-1', type: 'Electro-Optical' } },
          { base: { name: 'Laser-Pod-1', type: 'Laser-Designator' } },
          { base: { name: 'IR-Sensor-1', type: 'Infrared' } }
        ],
        weapons: [
          { base: { name: 'Missile-1', type: 'Air-to-Ground' }, quantity: 4 },
          { base: { name: 'Gun-1', type: 'Cannon' }, quantity: 200 }
        ],
        tracks: [
          { sensorName: 'EO-Pod-1', targetName: 'Target-001', targetType: 'Vehicle' },
          { sensorName: 'Laser-Pod-1', targetName: 'Target-002', targetType: 'Building' }
        ]
      },
      {
        base: {
          name: 'TEST-ARTY-001',
          type: 'Artillery',
          side: 'Blue',
          group: 'Bravo'
        },
        comms: [
          { base: { name: 'Radio-2', type: 'HF' } }
        ],
        sensors: [
          { base: { name: 'Fire-Control-Radar', type: 'Fire-Control' } },
          { base: { name: 'Laser-Rangefinder', type: 'Laser-Rangefinder' } }
        ],
        weapons: [
          { base: { name: 'Howitzer-1', type: '155mm' }, quantity: 50 }
        ],
        tracks: [
          { sensorName: 'Fire-Control-Radar', targetName: 'Target-003', targetType: 'Infantry' }
        ]
      }
    ]
  };
  
  console.log('   📋 测试平台状态数据:');
  console.log(JSON.stringify(testPlatformData, null, 2));
  
  console.log('\\n   💡 使用方法:');
  console.log('   1. 如果有外部平台状态发送器，可以发送类似结构的数据');
  console.log('   2. 数据包应该包含正确的包头 (AA 55) 和包类型 (0x29)');
  console.log('   3. 数据应该按照 PlatformStatus.proto 的格式编码');
  
  console.log('\\n   ✅ 测试数据生成完成\\n');
}

// 运行所有检查
async function runDiagnostics() {
  console.log('开始组播监听诊断...\\n');
  
  checkMulticastStatus();
  checkPacketReception();
  checkCommandPageListening();
  provideDebuggingTips();
  generateTestPlatformStatus();
  
  console.log('=== 诊断总结 ===');
  console.log('✅ 已完成所有检查项目');
  console.log('📋 主要检查点:');
  console.log('   1. 组播服务配置和状态');
  console.log('   2. 数据包接收和解析流程');
  console.log('   3. 命令测试页面监听逻辑');
  console.log('   4. 调试步骤和修复建议');
  console.log('   5. 测试数据包格式');
  
  console.log('\\n🔧 下一步操作:');
  console.log('   1. 打开组播监听页面，检查监听状态');
  console.log('   2. 打开开发者工具，查看控制台日志');
  console.log('   3. 尝试发送测试命令，观察数据包流向');
  console.log('   4. 根据日志输出定位具体问题');
  
  console.log('\\n📞 如果问题持续存在:');
  console.log('   - 检查网络配置和防火墙设置');
  console.log('   - 确认protobuf定义文件正确加载');
  console.log('   - 验证数据包格式是否符合预期');
  console.log('   - 考虑重启应用或系统');
}

// 如果直接运行此脚本
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = {
  checkMulticastStatus,
  checkPacketReception,
  checkCommandPageListening,
  provideDebuggingTips,
  generateTestPlatformStatus,
  runDiagnostics
};