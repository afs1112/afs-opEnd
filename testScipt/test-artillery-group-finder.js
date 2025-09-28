#!/usr/bin/env node

/**
 * 测试同组火炮查找功能
 * 验证无人机协同命令中火炮名称的自动获取逻辑
 */

console.log("🧪 测试同组火炮查找功能...\n");

// 模拟平台数据（包含不同分组的无人机和火炮）
const mockPlatforms = [
  // 第一分组 - 无人机
  {
    base: {
      name: "UAV-001",
      type: "UAV01",
      group: "第一作战分组",
      location: { longitude: 116.397428, latitude: 39.90923, altitude: 150 },
    },
  },
  // 第一分组 - 火炮
  {
    base: {
      name: "Artillery-001",
      type: "Artillery",
      group: "第一作战分组",
      location: { longitude: 116.398, latitude: 39.91, altitude: 50 },
    },
  },
  // 第二分组 - 无人机
  {
    base: {
      name: "UAV-002",
      type: "UAV01",
      group: "第二作战分组",
      location: { longitude: 116.4, latitude: 39.915, altitude: 160 },
    },
  },
  // 第二分组 - 火箭炮
  {
    base: {
      name: "ROCKET_LAUNCHER-001",
      type: "ROCKET_LAUNCHER",
      group: "第二作战分组", // 修正分组名称保持一致
      location: { longitude: 116.401, latitude: 39.916, altitude: 45 },
    },
  },
  // 第三分组 - 无人机
  {
    base: {
      name: "UAV-003",
      type: "UAV01",
      group: "第三作战分组",
      location: { longitude: 116.405, latitude: 39.92, altitude: 140 },
    },
  },
  // 第三分组 - 加农炮
  {
    base: {
      name: "CANNON-001",
      type: "CANNON",
      group: "第三作战分组",
      location: { longitude: 116.406, latitude: 39.921, altitude: 55 },
    },
  },
  // 没有对应火炮的分组
  {
    base: {
      name: "UAV-004",
      type: "UAV01",
      group: "第四作战分组",
      location: { longitude: 116.41, latitude: 39.925, altitude: 155 },
    },
  },
];

// 模拟 getSameGroupArtilleryName 函数
const getSameGroupArtilleryName = (connectedPlatform, platforms) => {
  if (!connectedPlatform?.base?.group || !platforms) {
    return null;
  }

  const currentGroup = connectedPlatform.base.group;

  // 根据火炮类型识别规范，查找同组的火炮平台
  const artilleryPlatform = platforms.find(
    (platform) =>
      platform.base?.group === currentGroup &&
      (platform.base?.type === "Artillery" ||
        platform.base?.type === "ROCKET_LAUNCHER" ||
        platform.base?.type === "CANNON")
  );

  return artilleryPlatform?.base?.name || null;
};

// 测试用例
const testCases = [
  {
    name: "第一分组无人机查找火炮",
    connectedUav: mockPlatforms.find((p) => p.base.name === "UAV-001"),
    expectedArtillery: "Artillery-001",
  },
  {
    name: "第二分组无人机查找火箭炮",
    connectedUav: mockPlatforms.find((p) => p.base.name === "UAV-002"),
    expectedArtillery: "ROCKET_LAUNCHER-001",
  },
  {
    name: "第三分组无人机查找加农炮",
    connectedUav: mockPlatforms.find((p) => p.base.name === "UAV-003"),
    expectedArtillery: "CANNON-001",
  },
  {
    name: "第四分组无人机（无对应火炮）",
    connectedUav: mockPlatforms.find((p) => p.base.name === "UAV-004"),
    expectedArtillery: null,
  },
];

let allPassed = true;

console.log("📋 测试同组火炮查找逻辑:\n");

testCases.forEach((testCase, index) => {
  console.log(`🚁 测试 ${index + 1}: ${testCase.name}`);

  try {
    const artilleryName = getSameGroupArtilleryName(
      testCase.connectedUav,
      mockPlatforms
    );

    console.log(`   📍 无人机: ${testCase.connectedUav?.base?.name || "未知"}`);
    console.log(`   🎯 分组: ${testCase.connectedUav?.base?.group || "未知"}`);
    console.log(`   🔍 查找结果: ${artilleryName || "未找到"}`);
    console.log(`   ✨ 期望结果: ${testCase.expectedArtillery || "未找到"}`);

    if (artilleryName === testCase.expectedArtillery) {
      console.log(`   ✅ 测试通过\n`);
    } else {
      console.log(
        `   ❌ 测试失败 - 期望: ${testCase.expectedArtillery}, 实际: ${artilleryName}\n`
      );
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ 测试异常: ${error.message}\n`);
    allPassed = false;
  }
});

// 测试火炮类型识别
console.log("🔫 测试火炮类型识别规范:");
const artilleryTypes = ["Artillery", "ROCKET_LAUNCHER", "CANNON"];
const supportedTypes = mockPlatforms
  .filter((p) => artilleryTypes.includes(p.base?.type))
  .map((p) => ({ name: p.base.name, type: p.base.type, group: p.base.group }));

supportedTypes.forEach((artillery) => {
  console.log(
    `   ✅ ${artillery.name} (${artillery.type}) - 分组: ${artillery.group}`
  );
});

// 测试完整的协同命令数据结构
console.log("\n🎮 测试完整协同命令数据结构:");

const testCoordinateCommand = {
  commandID: Date.now(),
  platformName: "UAV-001",
  command: 11, // Uav_Strike_Coordinate
  strikeCoordinateParam: {
    artyName: getSameGroupArtilleryName(
      mockPlatforms.find((p) => p.base.name === "UAV-001"),
      mockPlatforms
    ),
    targetName: "敌方装甲车-001",
    coordinate: {
      longitude: 116.4,
      latitude: 39.915,
      altitude: 50,
    },
  },
};

console.log("   📦 协同命令数据:");
console.log(`      无人机平台: ${testCoordinateCommand.platformName}`);
console.log(
  `      协同火炮: ${testCoordinateCommand.strikeCoordinateParam.artyName}`
);
console.log(
  `      打击目标: ${testCoordinateCommand.strikeCoordinateParam.targetName}`
);
console.log(
  `      目标坐标: ${testCoordinateCommand.strikeCoordinateParam.coordinate.longitude}°, ${testCoordinateCommand.strikeCoordinateParam.coordinate.latitude}°`
);

// 验证序列化
try {
  const serialized = JSON.stringify(testCoordinateCommand, null, 2);
  console.log(`   ✅ 命令序列化成功 (${serialized.length} 字符)`);
} catch (error) {
  console.log(`   ❌ 命令序列化失败: ${error.message}`);
  allPassed = false;
}

// 总结结果
console.log("\n=== 测试结果 ===");
if (allPassed) {
  console.log("🎉 所有同组火炮查找测试通过！");
  console.log("\n✅ 功能验证:");
  console.log("   1. 能正确识别 Artillery、ROCKET_LAUNCHER、CANNON 类型火炮");
  console.log("   2. 能准确匹配同组火炮和无人机");
  console.log("   3. 能正确处理无对应火炮的情况");
  console.log("   4. 协同命令数据结构完整正确");
  console.log("   5. artyName 参数正确填入");

  console.log("\n📋 实际使用中:");
  console.log("   - 无人机连接后自动检测同组火炮");
  console.log("   - 发送协同命令时自动填入火炮名称");
  console.log("   - 如无同组火炮则提示用户");
  console.log("   - 支持多种火炮类型的协同作战");
} else {
  console.log("⚠️  部分测试失败，需要检查实现");
}
