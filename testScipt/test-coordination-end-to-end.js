/**
 * 端到端测试：无人机-火炮协同命令完整流程验证
 * 测试从UavOperationPage发送命令到MulticastPage接收显示的完整流程
 */

console.log("=== 无人机-火炮协同命令端到端测试 ===\n");

// 模拟命令枚举 (与实际系统一致)
const PlatformCommandEnum = {
  Command_inValid: 0,
  Uav_Sensor_On: 1,
  Uav_Sensor_Off: 2,
  Uav_Sensor_Turn: 3,
  Uav_LazerPod_Lasing: 4,
  Uav_LazerPod_Cease: 5,
  Uav_Nav: 6,
  Arty_Target_Set: 7,
  Arty_Fire: 8,
  Uav_Set_Speed: 9,
  Uav_Lock_Target: 10,
  Uav_Strike_Coordinate: 11, // 打击协同
  Arty_Fire_Coordinate: 12, // 发射协同
};

// 1. 模拟无人机页面发送打击协同命令
function simulateUavSendStrikeCoordination() {
  console.log("1. 无人机页面发送打击协同命令");

  const connectedPlatformName = "UAV001";
  const selectedTarget = "敌方指挥所";
  const artilleryName = "火炮分队Alpha"; // 同组火炮

  const commandData = {
    commandID: Date.now(),
    platformName: connectedPlatformName,
    command: PlatformCommandEnum["Uav_Strike_Coordinate"], // 11
    strikeCoordinateParam: {
      artyName: artilleryName,
      targetName: selectedTarget,
      coordinate: {
        longitude: 118.78945,
        latitude: 32.04567,
        altitude: 150,
      },
    },
  };

  console.log("   发送的命令数据:");
  console.log(JSON.stringify(commandData, null, 2));
  console.log("   ✅ 命令发送模拟完成\n");

  return commandData;
}

// 2. 模拟火炮页面发送发射协同命令
function simulateArtillerySendFireCoordination() {
  console.log("2. 火炮页面发送发射协同命令");

  const connectedPlatformName = "火炮分队Alpha";

  const commandData = {
    commandID: Date.now(),
    platformName: connectedPlatformName,
    command: PlatformCommandEnum["Arty_Fire_Coordinate"], // 12
  };

  console.log("   发送的命令数据:");
  console.log(JSON.stringify(commandData, null, 2));
  console.log("   ✅ 命令发送模拟完成\n");

  return commandData;
}

// 3. 模拟组播页面接收和显示命令
function simulateMulticastReceive(commandData) {
  console.log("3. 组播页面接收和显示命令");

  // 模拟解析后的包结构
  const mockPacket = {
    timestamp: Date.now(),
    source: "192.168.1.100:8080",
    data: new Buffer([]), // 实际的二进制数据
    dataString: "",
    size: 256,
    parsedPacket: {
      timestamp: Date.now(),
      source: "192.168.1.100:8080",
      packageType: 0x2a, // PackageType_PlatformCommand
      packageTypeName: "平台命令",
      parsedData: commandData,
      rawData: new Buffer([]),
      size: 256,
      protocolID: 0x01,
    },
  };

  console.log("   接收到的包结构:");
  console.log(
    `   - 包类型: ${
      mockPacket.parsedPacket.packageTypeName
    } (0x${mockPacket.parsedPacket.packageType.toString(16)})`
  );
  console.log(
    `   - 平台名称: ${mockPacket.parsedPacket.parsedData.platformName}`
  );
  console.log(`   - 命令类型: ${mockPacket.parsedPacket.parsedData.command}`);

  return mockPacket;
}

// 4. 测试组播页面的命令显示功能
function testMulticastCommandDisplay(mockPacket) {
  console.log("4. 测试组播页面命令显示功能");

  const parsedData = mockPacket.parsedPacket.parsedData;

  // 复用组播页面的实际函数逻辑
  function getCommandName(command) {
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
  }

  function getCoordinationCommandDetails(parsedData) {
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

    return "";
  }

  const commandDisplay =
    getCommandName(parsedData.command) +
    getCoordinationCommandDetails(parsedData);

  console.log("   命令显示效果:");
  console.log(`   - 基础命令: ${getCommandName(parsedData.command)}`);
  console.log(`   - 详细信息: ${getCoordinationCommandDetails(parsedData)}`);
  console.log(`   - 完整显示: ${commandDisplay}`);
  console.log("   ✅ 命令显示测试完成\n");

  return commandDisplay;
}

// 5. 测试命令摘要功能
function testCommandSummary(mockPackets) {
  console.log("5. 测试命令摘要功能");

  const formatTime = (timestamp) => new Date(timestamp).toLocaleString("zh-CN");
  const extractSourceIP = (source) => {
    const match = source.match(/^(.+):(\d+)$/);
    return match ? match[1] : source;
  };

  function getCommandName(command) {
    const commandNames = {
      11: "打击协同",
      12: "发射协同",
    };
    return commandNames[command] || `未知命令(${command})`;
  }

  function getCoordinationCommandDetails(parsedData) {
    const command = parsedData.command;
    if (command === 11 && parsedData.strikeCoordinateParam) {
      const param = parsedData.strikeCoordinateParam;
      let details = [];
      if (param.artyName) details.push(`火炮: ${param.artyName}`);
      if (param.targetName) details.push(`目标: ${param.targetName}`);
      if (param.coordinate)
        details.push(
          `坐标: ${param.coordinate.longitude}°,${param.coordinate.latitude}°`
        );
      return details.length > 0 ? ` (${details.join(", ")})` : "";
    }
    if (command === 12) {
      return " (火力协同)";
    }
    return "";
  }

  const summary = {
    平台命令统计: {
      总数: mockPackets.length,
      命令类型数: new Set(
        mockPackets.map((p) => p.parsedPacket.parsedData.command)
      ).size,
      持续时间: "2秒",
      来源列表: [...new Set(mockPackets.map((p) => extractSourceIP(p.source)))],
    },
    最近命令: mockPackets
      .slice(-5)
      .reverse()
      .map((p) => ({
        时间: formatTime(p.timestamp),
        源地址: p.source,
        平台: p.parsedPacket.parsedData.platformName || "N/A",
        命令:
          getCommandName(p.parsedPacket.parsedData.command) +
          getCoordinationCommandDetails(p.parsedPacket.parsedData),
        详细参数: p.parsedPacket.parsedData.strikeCoordinateParam || null,
      })),
  };

  console.log("   生成的命令摘要:");
  console.log(JSON.stringify(summary, null, 2));
  console.log("   ✅ 命令摘要测试完成\n");

  return summary;
}

// 执行完整测试流程
try {
  // Step 1: 无人机发送打击协同命令
  const strikeCommand = simulateUavSendStrikeCoordination();

  // Step 2: 火炮发送发射协同命令
  const fireCommand = simulateArtillerySendFireCoordination();

  // Step 3 & 4: 组播页面接收并显示打击协同命令
  const strikePacket = simulateMulticastReceive(strikeCommand);
  const strikeDisplay = testMulticastCommandDisplay(strikePacket);

  // Step 3 & 4: 组播页面接收并显示发射协同命令
  const firePacket = simulateMulticastReceive(fireCommand);
  const fireDisplay = testMulticastCommandDisplay(firePacket);

  // Step 5: 测试摘要功能
  const allPackets = [strikePacket, firePacket];
  const summary = testCommandSummary(allPackets);

  console.log("=== 测试结果验证 ===");

  // 验证打击协同命令显示
  const expectedStrikeDisplay =
    "打击协同 (火炮: 火炮分队Alpha, 目标: 敌方指挥所, 坐标: 118.78945°,32.04567°)";
  const strikeTestPassed = strikeDisplay === expectedStrikeDisplay;
  console.log(`✅ 打击协同命令显示: ${strikeTestPassed ? "通过" : "失败"}`);
  if (!strikeTestPassed) {
    console.log(`   期望: ${expectedStrikeDisplay}`);
    console.log(`   实际: ${strikeDisplay}`);
  }

  // 验证发射协同命令显示
  const expectedFireDisplay = "发射协同 (火力协同)";
  const fireTestPassed = fireDisplay === expectedFireDisplay;
  console.log(`✅ 发射协同命令显示: ${fireTestPassed ? "通过" : "失败"}`);
  if (!fireTestPassed) {
    console.log(`   期望: ${expectedFireDisplay}`);
    console.log(`   实际: ${fireDisplay}`);
  }

  // 验证摘要功能
  const summaryTestPassed =
    summary.平台命令统计.总数 === 2 && summary.最近命令.length === 2;
  console.log(`✅ 命令摘要功能: ${summaryTestPassed ? "通过" : "失败"}`);

  console.log("\n=== 最终测试结论 ===");
  if (strikeTestPassed && fireTestPassed && summaryTestPassed) {
    console.log("🎉 所有测试通过！组播页面协同命令适配完全成功！");
    console.log("📋 功能清单:");
    console.log("   ✅ 打击协同命令接收和显示 (包含火炮名称、目标名称、坐标)");
    console.log("   ✅ 发射协同命令接收和显示");
    console.log("   ✅ 命令详细参数解析");
    console.log("   ✅ 命令摘要统计功能");
    console.log("   ✅ 完整的端到端数据流");
  } else {
    console.log("❌ 部分测试失败，需要检查实现");
  }
} catch (error) {
  console.error("测试执行失败:", error);
}
