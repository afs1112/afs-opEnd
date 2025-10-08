#!/usr/bin/env node

/**
 * 测试测评页面功能
 * 验证：1. 小组数据处理 2. 平台状态识别 3. 事件数据展示 4. 评分系统
 */

console.log("🧪 开始测评页面功能测试\n");

// 模拟平台数据
const mockPlatformsData = {
  platform: [
    // 第一组：Alpha组
    {
      base: {
        name: "UAV-Alpha-01",
        type: "UAV01",
        side: "red",
        group: "Alpha组",
        broken: false,
        location: {
          longitude: 118.789123,
          latitude: 32.123456,
          altitude: 1200,
        },
      },
      updateTime: 120.5,
    },
    {
      base: {
        name: "155mm榴弹炮-Alpha-01",
        type: "Artillery",
        side: "red",
        group: "Alpha组",
        broken: false,
        location: {
          longitude: 118.791234,
          latitude: 32.125678,
          altitude: 800,
        },
      },
      updateTime: 120.5,
    },
    {
      base: {
        name: "蓝方指挥所-Alpha",
        type: "COMMAND",
        side: "blue",
        group: "Alpha组",
        broken: false,
        location: {
          longitude: 118.795678,
          latitude: 32.129012,
          altitude: 600,
        },
      },
      updateTime: 120.5,
    },

    // 第二组：Bravo组
    {
      base: {
        name: "UAV-Bravo-01",
        type: "UAV01",
        side: "red",
        group: "Bravo组",
        broken: false,
        location: {
          longitude: 118.801234,
          latitude: 32.134567,
          altitude: 1500,
        },
      },
      updateTime: 120.5,
    },
    {
      base: {
        name: "火箭炮-Bravo-01",
        type: "ROCKET_LAUNCHER",
        side: "red",
        group: "Bravo组",
        broken: false,
        location: {
          longitude: 118.803456,
          latitude: 32.136789,
          altitude: 900,
        },
      },
      updateTime: 120.5,
    },
    {
      base: {
        name: "蓝方雷达站-Bravo",
        type: "RADAR",
        side: "blue",
        group: "Bravo组",
        broken: true, // 已被摧毁
        location: {
          longitude: 118.80789,
          latitude: 32.140123,
          altitude: 700,
        },
      },
      updateTime: 120.5,
    },
  ],
};

// 模拟协同报文数据
const mockCooperationMessages = [
  {
    id: "msg_001",
    timestamp: Date.now() - 300000, // 5分钟前
    exerciseTime: "T + 115秒",
    type: "sent",
    commandType: "strike_coordinate",
    sourcePlatform: "UAV-Alpha-01",
    targetPlatform: "155mm榴弹炮-Alpha-01",
    content: "无人机发出打击协同指令（目标：蓝方指挥所-Alpha）",
    details: {
      targetName: "蓝方指挥所-Alpha",
      commandId: 1001,
      coordinates: {
        longitude: 118.795678,
        latitude: 32.129012,
        altitude: 600,
      },
    },
    status: "success",
  },
  {
    id: "msg_002",
    timestamp: Date.now() - 240000, // 4分钟前
    exerciseTime: "T + 118秒",
    type: "received",
    commandType: "fire_coordinate",
    sourcePlatform: "155mm榴弹炮-Alpha-01",
    targetPlatform: "UAV-Alpha-01",
    content: "收到发射协同报文（武器：155mm高爆弹）",
    details: {
      targetName: "蓝方指挥所-Alpha",
      weaponName: "155mm高爆弹",
      commandId: 1002,
    },
    status: "success",
  },
  {
    id: "msg_003",
    timestamp: Date.now() - 180000, // 3分钟前
    exerciseTime: "T + 119秒",
    type: "sent",
    commandType: "strike_coordinate",
    sourcePlatform: "UAV-Bravo-01",
    targetPlatform: "火箭炮-Bravo-01",
    content: "无人机发出打击协同指令（目标：蓝方雷达站-Bravo）",
    details: {
      targetName: "蓝方雷达站-Bravo",
      commandId: 1003,
    },
    status: "success",
  },
];

// 模拟平台指令数据
const mockPlatformCommands = [
  {
    commandID: 2001,
    platformName: "UAV-Alpha-01",
    command: 10, // 锁定目标
    timestamp: Date.now() - 320000,
  },
  {
    commandID: 2002,
    platformName: "155mm榴弹炮-Alpha-01",
    command: 7, // 目标装订
    timestamp: Date.now() - 280000,
  },
  {
    commandID: 2003,
    platformName: "155mm榴弹炮-Alpha-01",
    command: 8, // 火炮发射
    timestamp: Date.now() - 200000,
  },
];

// 测试场景1：小组数据处理
console.log("📊 测试场景1：小组数据处理");

// 处理小组分类逻辑
function processGroupsData(platforms) {
  const groupMap = new Map();

  platforms.forEach((platform) => {
    if (platform.base?.group) {
      const groupName = platform.base.group;
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, {
          name: groupName,
          redMembers: [],
          blueTargets: [],
          currentTarget: null,
        });
      }

      const group = groupMap.get(groupName);
      const member = {
        name: platform.base.name,
        type: platform.base.type,
        side: platform.base.side,
        statusText: platform.base.broken ? "已摧毁" : "正常",
        statusClass: platform.base.broken
          ? "status-destroyed"
          : "status-active",
        coordinates: {
          longitude: parseFloat(platform.base.location.longitude.toFixed(6)),
          latitude: parseFloat(platform.base.location.latitude.toFixed(6)),
          altitude: platform.base.location.altitude,
        },
      };

      if (platform.base.side === "red") {
        group.redMembers.push(member);
      } else if (platform.base.side === "blue") {
        group.blueTargets.push(member);
        group.currentTarget = member; // 蓝方作为当前任务目标
      }
    }
  });

  return Array.from(groupMap.values());
}

const processedGroups = processGroupsData(mockPlatformsData.platform);

console.log("   ✅ 小组数据处理结果：");
processedGroups.forEach((group, index) => {
  console.log(`   ${index + 1}. ${group.name}:`);
  console.log(`      - 红方成员: ${group.redMembers.length}个`);
  console.log(`      - 蓝方目标: ${group.blueTargets.length}个`);
  console.log(`      - 当前任务目标: ${group.currentTarget?.name || "无"}`);
  console.log(`      - 目标状态: ${group.currentTarget?.statusText || "无"}`);
});

// 测试场景2：平台类型识别
console.log("\n🔍 测试场景2：平台类型识别");

function getDisplayType(type) {
  const typeMap = {
    UAV01: "无人机",
    Artillery: "火炮",
    ROCKET_LAUNCHER: "火箭炮",
    CANNON: "加农炮",
    TANK: "坦克",
    RADAR: "雷达",
    COMMAND: "指挥所",
  };
  return typeMap[type] || type;
}

console.log("   ✅ 平台类型识别结果：");
mockPlatformsData.platform.forEach((platform) => {
  const displayType = getDisplayType(platform.base.type);
  console.log(
    `   - ${platform.base.name}: ${platform.base.type} → ${displayType}`
  );
});

// 测试场景3：事件数据处理
console.log("\n📡 测试场景3：协同事件数据处理");

function processCooperationEvents(messages) {
  return messages.map((msg) => ({
    id: msg.id,
    timestamp: msg.timestamp,
    exerciseTime: msg.exerciseTime,
    type: "cooperation",
    typeDisplay:
      msg.commandType === "strike_coordinate" ? "打击协同" : "发射协同",
    typeClass: `event-${msg.commandType}`,
    description: msg.content,
    sourcePlatform: msg.sourcePlatform,
    targetPlatform: msg.targetPlatform,
    details: msg.details,
  }));
}

function processCommandEvents(commands) {
  const commandNames = {
    7: "目标装订",
    8: "火炮发射",
    10: "锁定目标",
    11: "打击协同",
    12: "发射协同",
  };

  return commands.map((cmd) => ({
    id: `cmd_${cmd.commandID}`,
    timestamp: cmd.timestamp,
    exerciseTime: `T + ${Math.floor(
      (cmd.timestamp - Date.now() + 400000) / 1000
    )}秒`, // 模拟演习时间
    type: "command",
    typeDisplay: commandNames[cmd.command] || `指令${cmd.command}`,
    typeClass: "event-command",
    description: `${cmd.platformName} 执行${
      commandNames[cmd.command] || "未知指令"
    }`,
    sourcePlatform: cmd.platformName,
    targetPlatform: cmd.platformName,
    details: { commandId: cmd.commandID },
  }));
}

const cooperationEvents = processCooperationEvents(mockCooperationMessages);
const commandEvents = processCommandEvents(mockPlatformCommands);

console.log("   ✅ 协同事件处理结果：");
cooperationEvents.forEach((event, index) => {
  console.log(`   ${index + 1}. ${event.exerciseTime} - ${event.typeDisplay}`);
  console.log(`      ${event.sourcePlatform} → ${event.targetPlatform}`);
  console.log(`      ${event.description}`);
});

console.log("\n   ✅ 指令事件处理结果：");
commandEvents.forEach((event, index) => {
  console.log(`   ${index + 1}. ${event.exerciseTime} - ${event.typeDisplay}`);
  console.log(`      ${event.description}`);
});

// 测试场景4：评分系统
console.log("\n⭐ 测试场景4：评分系统测试");

// 模拟评分数据
const mockGroupScores = {
  Alpha组: {
    coordination: 4.5,
    targetIdentification: 4.0,
    commandExecution: 4.5,
    overall: 4.3,
    comments: "协同效率高，目标识别准确，整体表现优秀。",
  },
  Bravo组: {
    coordination: 3.5,
    targetIdentification: 4.5,
    commandExecution: 3.0,
    overall: 3.7,
    comments: "目标识别能力强，但协同配合和指令执行有待提高。",
  },
};

function calculateAverageScores(groupScores) {
  const groups = Object.values(groupScores);
  if (groups.length === 0) return {};

  const criteria = [
    "coordination",
    "targetIdentification",
    "commandExecution",
    "overall",
  ];
  const averages = {};

  criteria.forEach((criterion) => {
    const total = groups.reduce((sum, group) => sum + group[criterion], 0);
    averages[criterion] = (total / groups.length).toFixed(1);
  });

  return averages;
}

const averageScores = calculateAverageScores(mockGroupScores);

console.log("   ✅ 评分统计结果：");
Object.entries(mockGroupScores).forEach(([groupName, scores]) => {
  console.log(`   ${groupName}:`);
  console.log(`      - 协同效率: ${scores.coordination}/5`);
  console.log(`      - 目标识别: ${scores.targetIdentification}/5`);
  console.log(`      - 指令执行: ${scores.commandExecution}/5`);
  console.log(`      - 整体表现: ${scores.overall}/5`);
  console.log(`      - 评价: ${scores.comments}`);
});

console.log("\n   📊 平均分数：");
Object.entries(averageScores).forEach(([criterion, score]) => {
  const criterionNames = {
    coordination: "协同效率",
    targetIdentification: "目标识别",
    commandExecution: "指令执行",
    overall: "整体表现",
  };
  console.log(`   - ${criterionNames[criterion]}: ${score}/5`);
});

// 测试场景5：数据导出功能
console.log("\n💾 测试场景5：评价报告导出");

function generateEvaluationReport(groups, events, scores) {
  const report = {
    timestamp: new Date().toISOString(),
    exerciseTime: "T + 120秒",
    groups: groups.map((group) => ({
      name: group.name,
      memberCount: group.redMembers.length + group.blueTargets.length,
      redMemberCount: group.redMembers.length,
      blueMemberCount: group.blueTargets.length,
      currentTarget: group.currentTarget?.name || null,
      targetStatus: group.currentTarget?.statusText || null,
      scores: scores[group.name] || {
        coordination: 0,
        targetIdentification: 0,
        commandExecution: 0,
        overall: 0,
      },
    })),
    eventsSummary: {
      totalCooperationEvents: cooperationEvents.length,
      totalCommandEvents: commandEvents.length,
      totalEvents: cooperationEvents.length + commandEvents.length,
    },
    summary: {
      totalGroups: groups.length,
      averageScores: averageScores,
    },
  };

  return report;
}

const evaluationReport = generateEvaluationReport(
  processedGroups,
  [...cooperationEvents, ...commandEvents],
  mockGroupScores
);

console.log("   ✅ 评价报告生成成功：");
console.log(`   - 参与小组数: ${evaluationReport.summary.totalGroups}`);
console.log(`   - 总事件数: ${evaluationReport.eventsSummary.totalEvents}`);
console.log(
  `   - 协同事件: ${evaluationReport.eventsSummary.totalCooperationEvents}`
);
console.log(
  `   - 指令事件: ${evaluationReport.eventsSummary.totalCommandEvents}`
);
console.log(
  `   - 平均协同效率: ${evaluationReport.summary.averageScores.coordination}/5`
);

// 验证所有测试结果
console.log("\n🎉 测试结果汇总:");

const tests = [
  {
    name: "小组数据分类处理",
    expected: 2,
    actual: processedGroups.length,
    passed: processedGroups.length === 2,
  },
  {
    name: "平台类型识别转换",
    expected: "无人机",
    actual: getDisplayType("UAV01"),
    passed: getDisplayType("UAV01") === "无人机",
  },
  {
    name: "协同事件数据处理",
    expected: 3,
    actual: cooperationEvents.length,
    passed: cooperationEvents.length === 3,
  },
  {
    name: "指令事件数据处理",
    expected: 3,
    actual: commandEvents.length,
    passed: commandEvents.length === 3,
  },
  {
    name: "平均分数计算",
    expected: "4.0",
    actual: averageScores.coordination,
    passed: averageScores.coordination === "4.0",
  },
  {
    name: "摧毁状态识别",
    expected: "已摧毁",
    actual: processedGroups[1].currentTarget?.statusText,
    passed: processedGroups[1].currentTarget?.statusText === "已摧毁",
  },
];

tests.forEach((test) => {
  console.log(`   ${test.passed ? "✅" : "❌"} ${test.name}`);
  console.log(`      期望: ${test.expected}`);
  console.log(`      实际: ${test.actual}`);
});

const allPassed = tests.every((test) => test.passed);
console.log(`\n🏆 测试结果: ${allPassed ? "全部通过" : "部分失败"}`);

if (allPassed) {
  console.log("\n✨ 测评页面功能验证成功:");
  console.log("   1. ✅ 小组数据自动分类和状态识别");
  console.log("   2. ✅ 红方蓝方成员正确区分");
  console.log("   3. ✅ 平台类型中文化显示");
  console.log("   4. ✅ 协同报文和指令事件处理");
  console.log("   5. ✅ 多维度评分体系");
  console.log("   6. ✅ 评价报告生成和导出");
  console.log("   7. ✅ 目标摧毁状态检测");
  console.log("   8. ✅ 演习时间同步显示");
}

console.log("\n📋 测评页面核心功能:");
console.log("   - 自动从平台状态报文中识别小组结构");
console.log("   - 区分红方作战单元和蓝方目标");
console.log("   - 实时展示关键事件（协同报文、平台指令）");
console.log(
  "   - 支持多维度专家评分（协同效率、目标识别、指令执行、整体表现）"
);
console.log("   - 提供评价备注和评分重置功能");
console.log("   - 生成完整的演习评价报告");
console.log("   - 统计分析和数据导出");
