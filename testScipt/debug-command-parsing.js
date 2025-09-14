#!/usr/bin/env node

/**
 * 调试命令解析问题
 * 分析为什么发送的命令和解析的命令不一致
 */

console.log('=== 命令解析调试 ===\n');

// 分析问题
function analyzeIssue() {
  console.log('1. 问题分析');
  
  const issue = {
    sent: {
      command: 1,
      commandName: 'Uav_Sensor_On',
      sensorParam: {
        sensorName: 'Laser-Pod-1',
        azSlew: 0,
        elSlew: 0
      }
    },
    received: {
      command: 'Uav_EoPod_Off',
      commandID: 866461297,
      platformName: 'UAV-001',
      platformType: '',
      fireParam: null,
      sensorParam: '缺失'
    }
  };
  
  console.log('   📤 发送的数据:');
  console.log('   - command:', issue.sent.command, '(数字)');
  console.log('   - 期望命令名:', issue.sent.commandName);
  console.log('   - sensorParam:', JSON.stringify(issue.sent.sensorParam, null, 4));
  
  console.log('\\n   📥 解析的数据:');
  console.log('   - command:', issue.received.command, '(字符串)');
  console.log('   - commandID:', issue.received.commandID);
  console.log('   - platformName:', issue.received.platformName);
  console.log('   - sensorParam:', issue.received.sensorParam);
  
  console.log('\\n   🔍 问题分析:');
  console.log('   1. 🔴 命令枚举错误: 1 → "Uav_EoPod_Off" (应该是 "Uav_Sensor_On")');
  console.log('   2. 🔴 sensorParam丢失: 发送时有数据，解析时为null');
  console.log('   3. 🟡 出现了不存在的枚举值: "Uav_EoPod_Off" 不在当前proto定义中');
  
  console.log('\\n   ✅ 问题分析完成\\n');
}

// 检查枚举定义
function checkEnumDefinition() {
  console.log('2. 检查枚举定义');
  
  const currentEnum = {
    'Command_inValid': 0,
    'Uav_Sensor_On': 1,      // ✅ 应该对应发送的 1
    'Uav_Sensor_Off': 2,
    'Uav_Sensor_Turn': 3,
    'Uav_LazerPod_Lasing': 4,
    'Uav_LazerPod_Cease': 5,
    'Uav_Nav': 6,
    'Arty_Target_Set': 7,
    'Arty_Fire': 8
  };
  
  const oldEnum = {
    'Command_inValid': 0,
    'Uav_EoPod_On': 1,       // ❌ 旧的定义
    'Uav_EoPod_Off': 2,      // ❌ 这个值出现在解析结果中！
    'Uav_EoPod_Turn': 3,
    'Uav_LazerPod_On': 4,
    'Uav_LazerPod_Off': 5,
    // ...
  };
  
  console.log('   📋 当前枚举定义:');
  Object.entries(currentEnum).forEach(([name, value]) => {
    console.log(`   - ${value}: ${name}`);
  });
  
  console.log('\\n   📋 可能的旧枚举定义:');
  Object.entries(oldEnum).forEach(([name, value]) => {
    console.log(`   - ${value}: ${name}`);
  });
  
  console.log('\\n   🔍 分析结果:');
  console.log('   - 发送的值 1 在当前枚举中应该是: Uav_Sensor_On');
  console.log('   - 但解析出来的是: Uav_EoPod_Off (值为2的旧枚举)');
  console.log('   - 这说明protobuf可能在使用旧的枚举定义');
  
  console.log('\\n   ✅ 枚举检查完成\\n');
}

// 分析可能的原因
function analyzePossibleCauses() {
  console.log('3. 分析可能的原因');
  
  const causes = [
    {
      cause: 'Protobuf缓存问题',
      description: 'protobuf定义被缓存，没有重新加载新的枚举',
      probability: '🔴 高',
      solution: '重启应用程序，清除protobuf缓存'
    },
    {
      cause: '编码/解码不匹配',
      description: '发送时使用新枚举，解析时使用旧枚举',
      probability: '🔴 高',
      solution: '确保发送器和解析器使用相同的proto定义'
    },
    {
      cause: 'Proto文件版本不一致',
      description: '不同的proto文件版本被加载',
      probability: '🟡 中',
      solution: '检查proto文件的加载路径和版本'
    },
    {
      cause: '数据包损坏',
      description: '网络传输过程中数据包被损坏',
      probability: '🟢 低',
      solution: '检查网络连接和数据包完整性'
    },
    {
      cause: 'sensorParam编码问题',
      description: 'sensorParam没有被正确编码到protobuf中',
      probability: '🟡 中',
      solution: '检查MulticastSenderService中的sensorParam处理'
    }
  ];
  
  console.log('   📋 可能的原因:');
  causes.forEach((item, index) => {
    console.log(`\\n   ${item.probability} ${index + 1}. ${item.cause}`);
    console.log(`      描述: ${item.description}`);
    console.log(`      解决方案: ${item.solution}`);
  });
  
  console.log('\\n   ✅ 原因分析完成\\n');
}

// 提供调试步骤
function provideDebuggingSteps() {
  console.log('4. 调试步骤');
  
  const steps = [
    {
      step: '检查protobuf加载',
      actions: [
        '查看主进程启动日志',
        '确认proto文件加载成功',
        '检查枚举定义是否正确'
      ]
    },
    {
      step: '检查发送器日志',
      actions: [
        '查看MulticastSender的详细日志',
        '确认sensorParam是否被正确处理',
        '检查protobuf编码过程'
      ]
    },
    {
      step: '检查解析器日志',
      actions: [
        '查看Parser的详细日志',
        '确认使用的proto类型定义',
        '检查枚举转换过程'
      ]
    },
    {
      step: '对比原始数据',
      actions: [
        '查看发送的十六进制数据',
        '查看接收的十六进制数据',
        '对比数据是否一致'
      ]
    }
  ];
  
  console.log('   📋 调试步骤:');
  steps.forEach((item, index) => {
    console.log(`\\n   ${index + 1}. ${item.step}:`);
    item.actions.forEach(action => {
      console.log(`      - ${action}`);
    });
  });
  
  console.log('\\n   ✅ 调试步骤提供完成\\n');
}

// 提供修复建议
function provideFixSuggestions() {
  console.log('5. 修复建议');
  
  const fixes = [
    {
      priority: '🔴 紧急',
      title: '重启应用程序',
      description: '清除可能的protobuf缓存',
      steps: [
        '完全关闭应用程序',
        '重新启动应用程序',
        '重新测试命令发送'
      ]
    },
    {
      priority: '🔴 紧急',
      title: '修复解析器的枚举转换',
      description: '确保使用数字而不是字符串枚举',
      code: `
// 在parsePlatformCmd中修改:
const decodedObject = PlatformCmdType.toObject(decoded, {
  longs: String,
  enums: Number,  // 改为Number，保持原始枚举值
  bytes: String,
  defaults: true
});`
    },
    {
      priority: '🟡 重要',
      title: '增强发送器日志',
      description: '确认sensorParam是否被正确编码',
      code: `
// 在sendPlatformCmd中添加:
console.log('[MulticastSender] 最终cmdData:', JSON.stringify(cmdData, null, 2));
console.log('[MulticastSender] protobuf编码前验证:', PlatformCmdType.verify(cmdData));`
    },
    {
      priority: '🟢 优化',
      title: '添加数据包验证',
      description: '在发送和接收时验证数据包完整性',
      code: `
// 添加数据包校验
const checksum = calculateChecksum(protobufBuffer);
console.log('[MulticastSender] 数据包校验和:', checksum);`
    }
  ];
  
  console.log('   📋 修复建议:');
  fixes.forEach((fix, index) => {
    console.log(`\\n   ${fix.priority} ${index + 1}. ${fix.title}`);
    console.log(`      ${fix.description}`);
    if (fix.steps) {
      fix.steps.forEach(step => {
        console.log(`      - ${step}`);
      });
    }
    if (fix.code) {
      console.log(`      代码:${fix.code}`);
    }
  });
  
  console.log('\\n   ✅ 修复建议提供完成\\n');
}

// 运行所有分析
async function runAnalysis() {
  console.log('开始命令解析问题调试...\\n');
  
  analyzeIssue();
  checkEnumDefinition();
  analyzePossibleCauses();
  provideDebuggingSteps();
  provideFixSuggestions();
  
  console.log('=== 调试总结 ===');
  console.log('🔍 主要发现:');
  console.log('   1. 🔴 枚举值解析错误: 1 被解析为 "Uav_EoPod_Off"');
  console.log('   2. 🔴 sensorParam数据丢失');
  console.log('   3. 🔴 可能使用了旧的proto定义');
  
  console.log('\\n🚀 立即行动:');
  console.log('   1. 重启应用程序');
  console.log('   2. 修改解析器枚举转换 (enums: Number)');
  console.log('   3. 检查发送器sensorParam处理');
  console.log('   4. 对比发送和接收的原始数据');
  
  console.log('\\n🎯 预期结果:');
  console.log('   - command: 1 应该解析为 "Uav_Sensor_On"');
  console.log('   - sensorParam应该包含完整的传感器参数');
  console.log('   - 不应该出现旧的枚举值');
}

// 如果直接运行此脚本
if (require.main === module) {
  runAnalysis().catch(console.error);
}

module.exports = {
  analyzeIssue,
  checkEnumDefinition,
  analyzePossibleCauses,
  provideDebuggingSteps,
  provideFixSuggestions,
  runAnalysis
};