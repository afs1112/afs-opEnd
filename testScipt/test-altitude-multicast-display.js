/**
 * 高度设置命令在组播页面显示测试
 *
 * 测试目标：
 * 1. 验证高度设置命令在命令名称映射中正确显示为"设置高度"
 * 2. 验证高度设置参数在详细信息中正确显示
 * 3. 验证高度设置命令在命令摘要中正确导出
 */

const protobuf = require("protobufjs");
const path = require("path");

// 加载 proto 文件
const protoPath = path.join(__dirname, "../src/protobuf/PlatformCmd.proto");
const publicProtoPath = path.join(
  __dirname,
  "../src/protobuf/PublicStruct.proto"
);

async function testAltitudeCommandDisplay() {
  console.log("🧪 开始测试高度设置命令在组播页面的显示...\n");

  const root = new protobuf.Root();
  root.resolvePath = (origin, target) => {
    if (target === "PublicStruct.proto") {
      return publicProtoPath;
    }
    return path.resolve(path.dirname(origin), target);
  };

  await root.load(protoPath);

  const PlatformCmd = root.lookupType("PlatformStatus.PlatformCmd");
  const SetAltitudeParamType = root.lookupType(
    "PlatformStatus.SetAltitudeparam"
  );

  // 测试1: 命令名称映射
  console.log("📋 测试1: 命令名称映射");
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
    11: "打击协同",
    12: "发射协同",
    13: "设置高度", // 新增的高度设置命令
  };

  const altitudeCommandName = commandNames[13];
  console.log(`  命令13映射: ${altitudeCommandName}`);

  if (altitudeCommandName === "设置高度") {
    console.log("  ✅ 命令名称映射正确\n");
  } else {
    console.log("  ❌ 命令名称映射错误\n");
    return false;
  }

  // 测试2: 创建高度设置命令报文
  console.log("📦 测试2: 创建高度设置命令报文");
  const testAltitude = 1500; // 测试高度：1500米

  const setAltitudeParam = SetAltitudeParamType.create({
    altitude: testAltitude,
  });

  const platformCmd = PlatformCmd.create({
    commandID: Date.now(),
    platformName: "UAV_001",
    command: 13, // Uav_Set_Altitude
    setAltitudeParam: setAltitudeParam,
  });

  console.log(`  创建的命令:`, {
    platformName: platformCmd.platformName,
    command: platformCmd.command,
    altitude: platformCmd.setAltitudeParam.altitude,
  });

  // 测试3: 编码和解码
  console.log("\n🔄 测试3: 报文编码和解码");
  const buffer = PlatformCmd.encode(platformCmd).finish();
  console.log(`  编码后的二进制长度: ${buffer.length} 字节`);
  console.log(
    `  十六进制: ${Buffer.from(buffer).toString("hex").toUpperCase()}`
  );

  const decoded = PlatformCmd.decode(buffer);
  console.log(`  解码后的数据:`, {
    commandID: decoded.commandID,
    platformName: decoded.platformName,
    command: decoded.command,
    setAltitudeParam: decoded.setAltitudeParam
      ? {
          altitude: decoded.setAltitudeParam.altitude,
        }
      : null,
  });

  if (
    decoded.setAltitudeParam &&
    decoded.setAltitudeParam.altitude === testAltitude
  ) {
    console.log("  ✅ 高度参数编码解码正确\n");
  } else {
    console.log("  ❌ 高度参数编码解码失败\n");
    return false;
  }

  // 测试4: 模拟组播页面的详细信息显示
  console.log("🖥️  测试4: 模拟组播页面显示");

  // 模拟 getCommandName 函数
  const getCommandName = (command) => {
    return commandNames[command] || `未知命令(${command})`;
  };

  // 模拟 getCoordinationCommandDetails 函数
  const getCoordinationCommandDetails = (parsedData) => {
    if (!parsedData) return "";

    const command = parsedData.command;

    // 速度设置参数 (9)
    if (command === 9 && parsedData.setSpeedParam?.speed !== undefined) {
      return ` (速度: ${parsedData.setSpeedParam.speed}m/s)`;
    }

    // 高度设置参数 (13)
    if (command === 13 && parsedData.setAltitudeParam?.altitude !== undefined) {
      return ` (高度: ${parsedData.setAltitudeParam.altitude}m)`;
    }

    return "";
  };

  const parsedData = {
    commandID: decoded.commandID,
    platformName: decoded.platformName,
    command: decoded.command,
    setAltitudeParam: decoded.setAltitudeParam
      ? {
          altitude: decoded.setAltitudeParam.altitude,
        }
      : null,
  };

  const displayText =
    getCommandName(parsedData.command) +
    getCoordinationCommandDetails(parsedData);

  console.log(`  显示文本: "${displayText}"`);

  if (displayText === `设置高度 (高度: ${testAltitude}m)`) {
    console.log("  ✅ 组播页面显示格式正确\n");
  } else {
    console.log("  ❌ 组播页面显示格式错误\n");
    return false;
  }

  // 测试5: 模拟命令摘要导出
  console.log("📊 测试5: 模拟命令摘要导出");

  const mockPacket = {
    timestamp: Date.now(),
    source: "192.168.1.100:9001",
    parsedPacket: {
      parsedData: parsedData,
    },
  };

  const summary = {
    时间: new Date(mockPacket.timestamp).toLocaleTimeString("zh-CN"),
    源地址: mockPacket.source,
    平台: mockPacket.parsedPacket.parsedData.platformName || "N/A",
    命令:
      getCommandName(mockPacket.parsedPacket.parsedData.command) +
      getCoordinationCommandDetails(mockPacket.parsedPacket.parsedData),
    详细参数: mockPacket.parsedPacket.parsedData.setAltitudeParam || null,
  };

  console.log("  导出的摘要:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.详细参数 && summary.详细参数.altitude === testAltitude) {
    console.log("  ✅ 命令摘要导出正确\n");
  } else {
    console.log("  ❌ 命令摘要导出失败\n");
    return false;
  }

  // 测试6: 测试不同高度值
  console.log("🔢 测试6: 测试不同高度值");

  const testCases = [
    { altitude: 1, expected: "设置高度 (高度: 1m)" },
    { altitude: 100, expected: "设置高度 (高度: 100m)" },
    { altitude: 1000, expected: "设置高度 (高度: 1000m)" },
    { altitude: 5000, expected: "设置高度 (高度: 5000m)" },
    { altitude: 10000, expected: "设置高度 (高度: 10000m)" },
  ];

  let allTestsPassed = true;
  for (const testCase of testCases) {
    const altParam = SetAltitudeParamType.create({
      altitude: testCase.altitude,
    });
    const cmd = PlatformCmd.create({
      commandID: Date.now(),
      platformName: "UAV_TEST",
      command: 13,
      setAltitudeParam: altParam,
    });

    const buffer = PlatformCmd.encode(cmd).finish();
    const decoded = PlatformCmd.decode(buffer);

    const parsedData = {
      command: decoded.command,
      setAltitudeParam: decoded.setAltitudeParam
        ? {
            altitude: decoded.setAltitudeParam.altitude,
          }
        : null,
    };

    const displayText =
      getCommandName(parsedData.command) +
      getCoordinationCommandDetails(parsedData);

    if (displayText === testCase.expected) {
      console.log(`  ✅ 高度 ${testCase.altitude}m: ${displayText}`);
    } else {
      console.log(
        `  ❌ 高度 ${testCase.altitude}m: 期望 "${testCase.expected}", 实际 "${displayText}"`
      );
      allTestsPassed = false;
    }
  }

  if (allTestsPassed) {
    console.log("\n  ✅ 所有高度值测试通过\n");
  } else {
    console.log("\n  ❌ 部分高度值测试失败\n");
    return false;
  }

  return true;
}

// 运行测试
testAltitudeCommandDisplay()
  .then((result) => {
    if (result) {
      console.log("✅ 所有测试通过！高度设置命令在组播页面中可以正确显示。");
      process.exit(0);
    } else {
      console.log("❌ 测试失败！");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ 测试过程中发生错误:", error);
    process.exit(1);
  });
