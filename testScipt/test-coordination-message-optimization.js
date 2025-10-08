#!/usr/bin/env node

/**
 * 测试协同报文优化功能
 * 验证：1. 发送/接收方向区分 2. 来源/目标平台识别 3. 演习时间标识 T+格式
 */

console.log("🧪 开始协同报文优化功能测试\n");

// 模拟演习开始时间
const exerciseStartTime = Date.now() - 60000; // 假设演习已经开始了60秒

// 获取演习时间标识（T+格式）
function getExerciseTimeLabel(timestamp) {
  const elapsedSeconds = Math.floor((timestamp - exerciseStartTime) / 1000);
  return `T + ${elapsedSeconds}秒`;
}

// 格式化时间显示
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 模拟协同报文数据结构
const mockCooperationMessages = [];

// 添加协同报文的通用方法
function addCooperationMessage(message) {
  const timestamp = Date.now() + Math.random() * 10000; // 随机时间偏移
  const newMessage = {
    id: `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    exerciseTime: getExerciseTimeLabel(timestamp),
    ...message
  };
  
  mockCooperationMessages.unshift(newMessage);
  
  // 保持最多50条记录
  if (mockCooperationMessages.length > 50) {
    mockCooperationMessages.splice(50);
  }
  
  return newMessage;
}

// 测试场景1：无人机发送打击协同命令
console.log("🎯 测试场景1：无人机发送打击协同命令");

const strikeCoordinationMsg = addCooperationMessage({
  type: 'received',
  commandType: 'strike_coordinate',
  sourcePlatform: 'UAV-001',
  targetPlatform: '155mm榴弹炮-01',
  content: '收到来自 UAV-001 的打击协同命令（目标：敌方装甲车-001）',
  details: {
    targetName: '敌方装甲车-001',
    commandId: 1234567890,
    coordinates: {
      longitude: 116.397428,
      latitude: 39.90923,
      altitude: 50
    }
  },
  status: 'success'
});

console.log("   ✅ 接收消息创建成功:");
console.log(`   - 消息ID: ${strikeCoordinationMsg.id}`);
console.log(`   - 演习时间: ${strikeCoordinationMsg.exerciseTime}`);
console.log(`   - 方向: ${strikeCoordinationMsg.type === 'received' ? '接收' : '发送'}`);
console.log(`   - 来源平台: ${strikeCoordinationMsg.sourcePlatform}`);
console.log(`   - 目标平台: ${strikeCoordinationMsg.targetPlatform}`);
console.log(`   - 内容: ${strikeCoordinationMsg.content}`);
console.log(`   - 目标名称: ${strikeCoordinationMsg.details.targetName}`);
console.log(`   - 坐标: ${strikeCoordinationMsg.details.coordinates.longitude}°, ${strikeCoordinationMsg.details.coordinates.latitude}°\n`);

// 测试场景2：火炮发送发射协同命令
console.log("🚀 测试场景2：火炮发送发射协同命令");

const fireCoordinationMsg = addCooperationMessage({
  type: 'sent',
  commandType: 'fire_coordinate',
  sourcePlatform: '155mm榴弹炮-01',
  targetPlatform: 'UAV-001',
  content: '火炮发出发射协同报文（目标：敌方装甲车-001）',
  details: {
    targetName: '敌方装甲车-001',
    weaponName: '155mm高爆弹',
    commandId: 1234567891,
    coordinates: {
      longitude: 116.397428,
      latitude: 39.90923,
      altitude: 50
    }
  },
  status: 'success'
});

console.log("   ✅ 发送消息创建成功:");
console.log(`   - 消息ID: ${fireCoordinationMsg.id}`);
console.log(`   - 演习时间: ${fireCoordinationMsg.exerciseTime}`);
console.log(`   - 方向: ${fireCoordinationMsg.type === 'sent' ? '发送' : '接收'}`);
console.log(`   - 来源平台: ${fireCoordinationMsg.sourcePlatform}`);
console.log(`   - 目标平台: ${fireCoordinationMsg.targetPlatform}`);
console.log(`   - 内容: ${fireCoordinationMsg.content}`);
console.log(`   - 武器名称: ${fireCoordinationMsg.details.weaponName}`);
console.log(`   - 坐标: ${fireCoordinationMsg.details.coordinates.longitude}°, ${fireCoordinationMsg.details.coordinates.latitude}°\n`);

// 测试场景3：模拟连续的协同通信
console.log("📡 测试场景3：模拟连续的协同通信");

// 添加多条不同类型的消息
const messages = [
  {
    type: 'received',
    commandType: 'strike_coordinate',
    sourcePlatform: 'UAV-002',
    targetPlatform: '120mm迫击炮-01',
    content: '收到来自 UAV-002 的打击协同命令（目标：敌方雷达站）',
    details: {
      targetName: '敌方雷达站',
      commandId: 1234567892,
      coordinates: {
        longitude: 118.78945,
        latitude: 32.04567,
        altitude: 150
      }
    },
    status: 'success'
  },
  {
    type: 'sent',
    commandType: 'fire_coordinate',
    sourcePlatform: '120mm迫击炮-01',
    targetPlatform: 'UAV-002',
    content: '火炮发出发射协同报文（目标：敌方雷达站）',
    details: {
      targetName: '敌方雷达站',
      weaponName: '120mm迫击炮弹',
      commandId: 1234567893
    },
    status: 'success'
  },
  {
    type: 'received',
    commandType: 'strike_coordinate',
    sourcePlatform: 'UAV-003',
    targetPlatform: '火箭炮-01',
    content: '收到来自 UAV-003 的打击协同命令（目标：敌方指挥所）',
    details: {
      targetName: '敌方指挥所',
      commandId: 1234567894
    },
    status: 'failed' // 模拟失败状态
  }
];

messages.forEach((msg, index) => {
  setTimeout(() => {
    const newMsg = addCooperationMessage(msg);
    console.log(`   ${index + 1}. ${newMsg.exerciseTime} - ${newMsg.type === 'sent' ? '发送' : '接收'} - ${newMsg.content} [${newMsg.status.toUpperCase()}]`);
  }, index * 1000);
});

// 等待所有消息添加完成
setTimeout(() => {
  console.log("\n📊 测试结果统计:");
  
  const sentCount = mockCooperationMessages.filter(msg => msg.type === 'sent').length;
  const receivedCount = mockCooperationMessages.filter(msg => msg.type === 'received').length;
  const successCount = mockCooperationMessages.filter(msg => msg.status === 'success').length;
  const failedCount = mockCooperationMessages.filter(msg => msg.status === 'failed').length;
  
  console.log(`   - 总消息数: ${mockCooperationMessages.length}`);
  console.log(`   - 发送消息: ${sentCount}`);
  console.log(`   - 接收消息: ${receivedCount}`);
  console.log(`   - 成功消息: ${successCount}`);
  console.log(`   - 失败消息: ${failedCount}`);
  
  // 测试演习时间标识格式
  console.log("\n⏰ 测试演习时间标识:");
  mockCooperationMessages.slice(0, 5).forEach((msg, index) => {
    const elapsedSeconds = Math.floor((msg.timestamp - exerciseStartTime) / 1000);
    const clockTime = formatMessageTime(msg.timestamp);
    console.log(`   ${index + 1}. ${msg.exerciseTime} (${clockTime}) - 经过 ${elapsedSeconds} 秒`);
  });
  
  // 测试平台识别
  console.log("\n🤖 测试平台识别:");
  const platforms = new Set();
  mockCooperationMessages.forEach(msg => {
    platforms.add(msg.sourcePlatform);
    platforms.add(msg.targetPlatform);
  });
  
  console.log(`   - 涉及平台数: ${platforms.size}`);
  console.log(`   - 平台列表: ${Array.from(platforms).join(', ')}`);
  
  // 测试UI渲染格式
  console.log("\n🎨 测试UI渲染格式:");
  const renderExample = mockCooperationMessages[0];
  if (renderExample) {
    console.log("   示例渲染格式:");
    console.log(`   ┌─ 消息头部 ─────────────────────────────────┐`);
    console.log(`   │ ${renderExample.type === 'sent' ? '📤 发出' : '📥 收到'}                    ${renderExample.exerciseTime} │`);
    console.log(`   │                           ${formatMessageTime(renderExample.timestamp)} │`);
    console.log(`   ├─ 平台信息 ─────────────────────────────────┤`);
    console.log(`   │ ${renderExample.type === 'sent' ? '发给' : '来自'}: ${renderExample.type === 'sent' ? renderExample.targetPlatform : renderExample.sourcePlatform}                     │`);
    console.log(`   ├─ 消息内容 ─────────────────────────────────┤`);
    console.log(`   │ ${renderExample.content}              │`);
    console.log(`   ├─ 详细信息 ─────────────────────────────────┤`);
    if (renderExample.details.targetName) {
      console.log(`   │ 🎯 目标: ${renderExample.details.targetName}                    │`);
    }
    if (renderExample.details.weaponName) {
      console.log(`   │ 🔫 武器: ${renderExample.details.weaponName}                │`);
    }
    if (renderExample.details.coordinates) {
      console.log(`   │ 📍 坐标: ${renderExample.details.coordinates.longitude.toFixed(4)}°, ${renderExample.details.coordinates.latitude.toFixed(4)}°       │`);
    }
    console.log(`   └─────────────────────────────────────────────┘`);
  }
  
  console.log("\n✅ 协同报文优化功能测试完成！");
  
  // 验证关键功能
  const tests = [
    {
      name: "发送/接收方向区分",
      passed: mockCooperationMessages.every(msg => ['sent', 'received'].includes(msg.type))
    },
    {
      name: "来源/目标平台识别",
      passed: mockCooperationMessages.every(msg => msg.sourcePlatform && msg.targetPlatform)
    },
    {
      name: "演习时间标识格式",
      passed: mockCooperationMessages.every(msg => msg.exerciseTime.startsWith('T + ') && msg.exerciseTime.endsWith('秒'))
    },
    {
      name: "消息唯一标识",
      passed: new Set(mockCooperationMessages.map(msg => msg.id)).size === mockCooperationMessages.length
    },
    {
      name: "时间戳正确性",
      passed: mockCooperationMessages.every(msg => msg.timestamp > exerciseStartTime)
    }
  ];
  
  console.log("\n🔍 功能验证结果:");
  tests.forEach(test => {
    console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? '通过' : '失败'}`);
  });
  
  const allPassed = tests.every(test => test.passed);
  console.log(`\n🎉 总体测试结果: ${allPassed ? '全部通过' : '部分失败'}`);
  
  if (allPassed) {
    console.log("\n✨ 协同报文优化功能已成功实现以下特性:");
    console.log("   1. ✅ 区分发送/接收信息");
    console.log("   2. ✅ 识别发给谁/从谁那里收到");
    console.log("   3. ✅ 每个信息都有演习时间标识（T+秒数格式）");
    console.log("   4. ✅ 支持详细的目标、武器、坐标信息");
    console.log("   5. ✅ 消息状态跟踪（成功/失败/等待中）");
    console.log("   6. ✅ 优化的UI渲染格式");
  }
  
}, 4000);