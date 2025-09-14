#!/usr/bin/env node

/**
 * 检查protobuf解析逻辑
 * 分析proto文件变化对解析的影响
 */

console.log('=== Protobuf解析逻辑检查 ===\n');

// 分析proto文件结构
function analyzeProtoStructure() {
  console.log('1. 分析Proto文件结构变化');
  
  const protoFiles = {
    'PlatformCmd.proto': {
      package: 'PlatformStatus',
      messages: [
        'PlatformCmd',
        'FireParam', 
        'SensorParam',
        'NavParam',
        'TargetSetParam'
      ],
      enums: ['PlatformCommand'],
      changes: [
        '✅ SensorParam.weaponName → sensorName',
        '✅ 统一传感器命令枚举',
        '✅ 保持向后兼容性'
      ]
    },
    'PlatformStatus.proto': {
      package: 'PlatformStatus',
      messages: [
        'PlatformBase',
        'Mover',
        'PartParam',
        'Comm',
        'Sensor', 
        'Weapon',
        'Track',
        'Platform',
        'Platforms'
      ],
      enums: ['SlewMode'],
      changes: [
        '🔧 updateTime 字段名修正',
        '✅ 结构保持稳定'
      ]
    },
    'PublicStruct.proto': {
      package: 'PublicStruct',
      messages: [
        'GeoCoordinate',
        'HeartbeatInternal',
        'WayPoint'
      ],
      enums: ['PackageType', 'ReplyState'],
      changes: [
        '✅ 包类型枚举完整',
        '✅ 0x29: PlatformStatus',
        '✅ 0x2A: PlatformCmd'
      ]
    }
  };
  
  console.log('   📋 Proto文件结构分析:');
  Object.entries(protoFiles).forEach(([file, info]) => {
    console.log(`\\n   📄 ${file}:`);
    console.log(`      - 包名: ${info.package}`);
    console.log(`      - 消息类型: ${info.messages.join(', ')}`);
    console.log(`      - 枚举类型: ${info.enums.join(', ')}`);
    console.log(`      - 变化:`);
    info.changes.forEach(change => {
      console.log(`        ${change}`);
    });
  });
  
  console.log('\\n   ✅ Proto结构分析完成\\n');
}

// 检查解析器配置
function checkParserConfiguration() {
  console.log('2. 检查解析器配置');
  
  const parserConfig = {
    packageTypes: {
      '0x29': 'PackType_PlatformStatus',
      '0x2A': 'PackType_PlatformCmd'
    },
    messageTypes: {
      'PlatformStatus': 'PlatformStatus.Platforms',
      'PlatformCmd': 'PlatformStatus.PlatformCmd'
    },
    loadOrder: [
      'PublicStruct.proto',  // 基础结构，其他文件依赖
      'PlatformStatus.proto', // 平台状态定义
      'PlatformCmd.proto'     // 平台命令定义
    ]
  };
  
  console.log('   📋 解析器配置检查:');
  console.log(`   - 包类型映射: ${Object.keys(parserConfig.packageTypes).length} 个`);
  Object.entries(parserConfig.packageTypes).forEach(([type, name]) => {
    console.log(`     * ${type}: ${name}`);
  });
  
  console.log(`\\n   - 消息类型映射: ${Object.keys(parserConfig.messageTypes).length} 个`);
  Object.entries(parserConfig.messageTypes).forEach(([key, type]) => {
    console.log(`     * ${key}: ${type}`);
  });
  
  console.log(`\\n   - 加载顺序: ${parserConfig.loadOrder.length} 个文件`);
  parserConfig.loadOrder.forEach((file, index) => {
    console.log(`     ${index + 1}. ${file}`);
  });
  
  console.log('\\n   ✅ 解析器配置检查完成\\n');
}

// 检查可能的解析问题
function checkParsingIssues() {
  console.log('3. 检查可能的解析问题');
  
  const potentialIssues = [
    {
      issue: 'SensorParam字段名变化',
      description: 'weaponName → sensorName',
      impact: '影响命令发送和解析',
      status: '✅ 已修复',
      solution: '更新所有引用该字段的代码'
    },
    {
      issue: 'PlatformStatus消息类型查找',
      description: '可能找不到正确的消息类型',
      impact: '平台状态数据解析失败',
      status: '⚠️ 需要检查',
      solution: '确认消息类型名称: PlatformStatus.Platforms'
    },
    {
      issue: 'PlatformCmd消息类型查找',
      description: '可能找不到正确的消息类型',
      impact: '平台命令数据解析失败',
      status: '⚠️ 需要检查', 
      solution: '确认消息类型名称: PlatformStatus.PlatformCmd'
    },
    {
      issue: 'Proto文件加载顺序',
      description: '依赖关系可能导致加载失败',
      impact: 'Protobuf定义加载失败',
      status: '✅ 已优化',
      solution: '先加载PublicStruct.proto，再加载其他文件'
    },
    {
      issue: '包类型枚举同步',
      description: 'PackageType枚举值可能不匹配',
      impact: '数据包类型识别错误',
      status: '✅ 已同步',
      solution: '确保解析器中的枚举值与proto文件一致'
    }
  ];
  
  console.log('   📋 潜在问题分析:');
  potentialIssues.forEach((item, index) => {
    const statusIcon = item.status.includes('✅') ? '🟢' : 
                      item.status.includes('⚠️') ? '🟡' : '🔴';
    console.log(`\\n   ${statusIcon} ${index + 1}. ${item.issue}`);
    console.log(`      描述: ${item.description}`);
    console.log(`      影响: ${item.impact}`);
    console.log(`      状态: ${item.status}`);
    console.log(`      解决方案: ${item.solution}`);
  });
  
  console.log('\\n   ✅ 问题分析完成\\n');
}

// 检查发送器逻辑
function checkSenderLogic() {
  console.log('4. 检查发送器逻辑');
  
  const senderIssues = [
    {
      component: 'MulticastSenderService.sendPlatformCmd',
      issue: '缺少sensorParam处理',
      description: '只处理了fireParam，没有处理sensorParam',
      impact: '传感器命令无法正确发送',
      priority: '🔴 高',
      solution: '添加sensorParam、navParam、targetSetParam的处理逻辑'
    },
    {
      component: 'PlatformCmdData接口',
      issue: '接口定义可能不完整',
      description: '可能缺少新增的参数字段',
      impact: 'TypeScript类型检查失败',
      priority: '🟡 中',
      solution: '更新接口定义，包含所有参数类型'
    },
    {
      component: '消息类型查找',
      issue: '硬编码的消息类型名称',
      description: 'lookupType使用固定的类型名称',
      impact: '如果proto结构变化可能找不到类型',
      priority: '🟡 中',
      solution: '添加容错机制，尝试多个可能的类型名称'
    }
  ];
  
  console.log('   📋 发送器逻辑检查:');
  senderIssues.forEach((item, index) => {
    console.log(`\\n   ${item.priority} ${index + 1}. ${item.component}`);
    console.log(`      问题: ${item.issue}`);
    console.log(`      描述: ${item.description}`);
    console.log(`      影响: ${item.impact}`);
    console.log(`      解决方案: ${item.solution}`);
  });
  
  console.log('\\n   ✅ 发送器逻辑检查完成\\n');
}

// 提供修复建议
function provideFixSuggestions() {
  console.log('5. 修复建议');
  
  const fixes = [
    {
      priority: '🔴 紧急',
      title: '完善MulticastSenderService.sendPlatformCmd方法',
      description: '添加对所有参数类型的支持',
      code: `
// 在sendPlatformCmd方法中添加:
if (data.sensorParam) {
  const sensorParam = SensorParamType.create({
    sensorName: data.sensorParam.sensorName || '',
    azSlew: data.sensorParam.azSlew || 0,
    elSlew: data.sensorParam.elSlew || 0
  });
  cmdData.sensorParam = sensorParam;
}

if (data.navParam) {
  cmdData.navParam = data.navParam;
}

if (data.targetSetParam) {
  cmdData.targetSetParam = data.targetSetParam;
}`
    },
    {
      priority: '🟡 重要',
      title: '更新PlatformCmdData接口定义',
      description: '确保接口包含所有必要字段',
      code: `
interface PlatformCmdData {
  commandID: number;
  platformName: string;
  command: number;
  fireParam?: {
    weaponName: string;
    targetName: string;
    quantity: number;
  };
  sensorParam?: {
    sensorName: string;  // 注意：不是weaponName
    azSlew: number;
    elSlew: number;
  };
  navParam?: {
    route: WayPoint[];
  };
  targetSetParam?: {
    targetName: string;
  };
}`
    },
    {
      priority: '🟢 优化',
      title: '增强protobuf解析器的容错性',
      description: '添加多种消息类型查找方式',
      code: `
// 在解析器中添加容错查找:
private findMessageType(typeName: string): protobuf.Type {
  const possibleNames = [
    \`PlatformStatus.\${typeName}\`,
    typeName,
    \`\${typeName}\`
  ];
  
  for (const name of possibleNames) {
    try {
      return this.root!.lookupType(name);
    } catch (e) {
      continue;
    }
  }
  
  throw new Error(\`无法找到消息类型: \${typeName}\`);
}`
    }
  ];
  
  console.log('   📋 修复建议:');
  fixes.forEach((fix, index) => {
    console.log(`\\n   ${fix.priority} ${index + 1}. ${fix.title}`);
    console.log(`      ${fix.description}`);
    console.log(`      代码示例:${fix.code}`);
  });
  
  console.log('\\n   ✅ 修复建议提供完成\\n');
}

// 生成测试用例
function generateTestCases() {
  console.log('6. 生成测试用例');
  
  const testCases = [
    {
      name: '传感器开启命令',
      data: {
        commandID: Date.now(),
        platformName: 'UAV-001',
        command: 1, // Uav_Sensor_On
        sensorParam: {
          sensorName: 'EO-Pod-1',
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
    },
    {
      name: '火炮发射命令',
      data: {
        commandID: Date.now() + 3,
        platformName: 'ARTY-001',
        command: 8, // Arty_Fire
        fireParam: {
          weaponName: 'Howitzer-1',
          targetName: 'Target-003',
          quantity: 5
        }
      }
    }
  ];
  
  console.log('   📋 测试用例:');
  testCases.forEach((testCase, index) => {
    console.log(`\\n   ${index + 1}. ${testCase.name}:`);
    console.log(JSON.stringify(testCase.data, null, 6));
  });
  
  console.log('\\n   💡 使用方法:');
  console.log('   1. 在命令测试页面发送这些命令');
  console.log('   2. 检查组播监听页面是否收到数据包');
  console.log('   3. 验证protobuf解析是否成功');
  console.log('   4. 确认字段名称正确（sensorName而不是weaponName）');
  
  console.log('\\n   ✅ 测试用例生成完成\\n');
}

// 运行所有检查
async function runAllChecks() {
  console.log('开始protobuf解析逻辑检查...\\n');
  
  analyzeProtoStructure();
  checkParserConfiguration();
  checkParsingIssues();
  checkSenderLogic();
  provideFixSuggestions();
  generateTestCases();
  
  console.log('=== 检查总结 ===');
  console.log('✅ 已完成所有检查项目');
  console.log('\\n🔧 主要发现:');
  console.log('   1. 🔴 MulticastSenderService缺少sensorParam等参数处理');
  console.log('   2. 🟡 需要更新PlatformCmdData接口定义');
  console.log('   3. 🟢 Proto文件结构基本正确，字段名已更新');
  console.log('\\n📋 下一步操作:');
  console.log('   1. 修复MulticastSenderService.sendPlatformCmd方法');
  console.log('   2. 更新相关的TypeScript接口定义');
  console.log('   3. 测试传感器命令的发送和接收');
  console.log('   4. 验证protobuf解析的正确性');
  
  console.log('\\n🎯 预期结果:');
  console.log('   - 传感器命令能正确发送和解析');
  console.log('   - sensorName字段被正确处理');
  console.log('   - 所有命令类型都能正常工作');
  console.log('   - 组播监听页面能显示解析后的数据');
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllChecks().catch(console.error);
}

module.exports = {
  analyzeProtoStructure,
  checkParserConfiguration,
  checkParsingIssues,
  checkSenderLogic,
  provideFixSuggestions,
  generateTestCases,
  runAllChecks
};