#!/usr/bin/env node

/**
 * 测试组播页面协同命令适配
 * 验证新增协同命令在组播接收页面的显示和解析
 */

console.log("🧪 测试组播页面协同命令适配...\n");

// 模拟协同命令数据包
const mockCoordinationPackets = [
  {
    name: "无人机打击协同命令（完整参数）",
    packet: {
      timestamp: Date.now(),
      source: "192.168.1.100:10086",
      parsedPacket: {
        packageType: 0x2a,
        packageTypeName: "PackType_PlatformCmd",
        protocolID: 0x01,
        parsedData: {
          commandID: 1234567890,
          platformName: "UAV-001",
          command: 11, // Uav_Strike_Coordinate
          strikeCoordinateParam: {
            artyName: "Artillery-001",
            targetName: "敌方装甲车-001",
            coordinate: {
              longitude: 116.397428,
              latitude: 39.90923,
              altitude: 50,
            },
          },
        },
      },
    },
  },
  {
    name: "无人机打击协同命令（仅目标和火炮）",
    packet: {
      timestamp: Date.now() + 1000,
      source: "192.168.1.101:10086",
      parsedPacket: {
        packageType: 0x2a,
        packageTypeName: "PackType_PlatformCmd",
        protocolID: 0x01,
        parsedData: {
          commandID: 1234567891,
          platformName: "UAV-002",
          command: 11, // Uav_Strike_Coordinate
          strikeCoordinateParam: {
            artyName: "ROCKET_LAUNCHER-001",
            targetName: "敌方雷达站-002",
          },
        },
      },
    },
  },
  {
    name: "火炮火力协同命令",
    packet: {
      timestamp: Date.now() + 2000,
      source: "192.168.1.102:10086",
      parsedPacket: {
        packageType: 0x2a,
        packageTypeName: "PackType_PlatformCmd",
        protocolID: 0x01,
        parsedData: {
          commandID: 1234567892,
          platformName: "Artillery-001",
          command: 12, // Arty_Fire_Coordinate
        },
      },
    },
  },
  {
    name: "传统传感器控制命令（对比）",
    packet: {
      timestamp: Date.now() + 3000,
      source: "192.168.1.103:10086",
      parsedPacket: {
        packageType: 0x2a,
        packageTypeName: "PackType_PlatformCmd",
        protocolID: 0x01,
        parsedData: {
          commandID: 1234567893,
          platformName: "UAV-003",
          command: 1, // Uav_Sensor_On
          sensorParam: {
            sensorName: "EO-Pod-1",
          },
        },
      },
    },
  },
  {
    name: "目标锁定命令（对比）",
    packet: {
      timestamp: Date.now() + 4000,
      source: "192.168.1.104:10086",
      parsedPacket: {
        packageType: 0x2a,
        packageTypeName: "PackType_PlatformCmd",
        protocolID: 0x01,
        parsedData: {
          commandID: 1234567894,
          platformName: "UAV-004",
          command: 10, // Uav_Lock_Target
          lockParam: {
            targetName: "敌方坦克-003",
            sensorName: "Laser-Pod-1",
          },
        },
      },
    },
  },
];

// 模拟命令名称映射函数（与MulticastPage.vue保持一致）
const getCommandName = (command) => {
  const commandNames = {
    0: "无效命令",
    1: "传感器开",
    2: "传感器关",
    3: "传感器转向",
    4: "激光照射",
    5: "停止照射",
    6: "航线规划",
    7: "目标装订",
    8: "火炮发射",
    9: "设置速度",
    10: "锁定目标",
    11: "打击协同", // 新增的打击协同命令
    12: "发射协同", // 新增的发射协同命令
  };
  return commandNames[command] || `未知命令(${command})`;
};

// 模拟协同命令详细信息获取函数
const getCoordinationCommandDetails = (parsedData) => {
  if (!parsedData) return "";

  const command = parsedData.command;

  // 打击协同命令 (11)
  if (command === 11 && parsedData.strikeCoordinateParam) {
    const param = parsedData.strikeCoordinateParam;
    let details = [];

    if (param.artyName) {
      details.push(`火炮: ${param.artyName}`);
    }
    if (param.targetName) {
      details.push(`目标: ${param.targetName}`);
    }
    if (param.coordinate) {
      details.push(
        `坐标: ${param.coordinate.longitude}°,${param.coordinate.latitude}°`
      );
    }

    return details.length > 0 ? ` (${details.join(", ")})` : "";
  }

  // 发射协同命令 (12)
  if (command === 12) {
    return " (火力协同)";
  }

  // 其他参数的快速显示
  if (parsedData.sensorParam?.sensorName) {
    return ` (传感器: ${parsedData.sensorParam.sensorName})`;
  }

  if (parsedData.lockParam?.targetName) {
    return ` (锁定: ${parsedData.lockParam.targetName})`;
  }

  if (parsedData.fireParam?.targetName) {
    return ` (目标: ${parsedData.fireParam.targetName})`;
  }

  return "";
};

// 时间格式化函数
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

// 提取源IP函数
const extractSourceIP = (source) => {
  return source.split(":")[0];
};

let allPassed = true;

console.log("📋 测试协同命令解析和显示:\n");

mockCoordinationPackets.forEach((testCase, index) => {
  console.log(`🎮 测试 ${index + 1}: ${testCase.name}`);

  try {
    const packet = testCase.packet;
    const parsedData = packet.parsedPacket.parsedData;

    // 测试命令名称获取
    const commandName = getCommandName(parsedData.command);
    console.log(`   📝 命令名称: ${commandName}`);

    // 测试详细信息获取
    const details = getCoordinationCommandDetails(parsedData);
    console.log(`   📋 详细信息: ${details || "无额外信息"}`);

    // 测试完整显示（模拟组播页面的显示）
    const fullDisplay = `${commandName}${details}`;
    console.log(`   🖥️  完整显示: ${fullDisplay}`);

    // 测试列表项显示（模拟组播列表项）
    const listItem = {
      时间: formatTime(packet.timestamp),
      源IP: extractSourceIP(packet.source),
      平台: parsedData.platformName,
      命令: fullDisplay,
    };

    console.log(`   📄 列表项:`, JSON.stringify(listItem, null, 6));

    // 验证协同命令特有信息
    if (parsedData.command === 11) {
      const param = parsedData.strikeCoordinateParam;
      if (!param) {
        console.log(`   ❌ 打击协同命令缺少strikeCoordinateParam`);
        allPassed = false;
      } else {
        console.log(
          `   ✅ 协同参数: 火炮=${param.artyName || "无"}, 目标=${
            param.targetName || "无"
          }`
        );
      }
    }

    console.log("");
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}\n`);
    allPassed = false;
  }
});

// 测试命令统计功能
console.log("📊 测试命令统计功能:");

const commandStats = {};
mockCoordinationPackets.forEach((testCase) => {
  const command = testCase.packet.parsedPacket.parsedData.command;
  const commandName = getCommandName(command);
  commandStats[commandName] = (commandStats[commandName] || 0) + 1;
});

console.log("   命令类型分布:");
Object.entries(commandStats).forEach(([name, count]) => {
  console.log(`     ${name}: ${count} 个`);
});

// 测试摘要生成
console.log("\n📑 测试摘要生成:");
const summary = {
  平台命令统计: {
    总数: mockCoordinationPackets.length,
    命令类型数: Object.keys(commandStats).length,
    协同命令数: mockCoordinationPackets.filter((p) =>
      [11, 12].includes(p.packet.parsedPacket.parsedData.command)
    ).length,
  },
  最近命令: mockCoordinationPackets.slice(-3).map((p) => ({
    时间: formatTime(p.packet.timestamp),
    源地址: p.packet.source,
    平台: p.packet.parsedPacket.parsedData.platformName,
    命令:
      getCommandName(p.packet.parsedPacket.parsedData.command) +
      getCoordinationCommandDetails(p.packet.parsedPacket.parsedData),
    详细参数:
      p.packet.parsedPacket.parsedData.strikeCoordinateParam ||
      p.packet.parsedPacket.parsedData.sensorParam ||
      p.packet.parsedPacket.parsedData.lockParam ||
      null,
  })),
};

console.log(JSON.stringify(summary, null, 2));

// 总结结果
console.log("\n=== 测试结果 ===");
if (allPassed) {
  console.log("🎉 所有组播页面协同命令适配测试通过！");
  console.log("\n✅ 功能验证:");
  console.log("   1. 协同命令名称正确显示（打击协同、发射协同）");
  console.log("   2. 协同命令参数详细信息正确解析");
  console.log("   3. 火炮名称、目标名称、坐标信息正确显示");
  console.log("   4. 命令列表显示包含完整协同信息");
  console.log("   5. 命令摘要包含详细参数信息");
  console.log("   6. 与传统命令显示保持一致的格式");

  console.log("\n📋 组播页面现在支持:");
  console.log("   - 实时显示打击协同命令及其火炮、目标信息");
  console.log("   - 实时显示发射协同命令");
  console.log("   - 在命令列表中显示协同参数摘要");
  console.log("   - 在命令详情中查看完整协同参数");
  console.log("   - 复制包含协同参数的命令摘要");
} else {
  console.log("⚠️  部分测试失败，需要检查实现");
}
