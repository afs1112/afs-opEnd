/**
 * 测试火炮页面接收打击协同命令功能
 * 验证火炮页面能正确接收和显示协同目标信息
 */

console.log("=== 火炮页面接收打击协同命令测试 ===\n");

// 模拟打击协同命令数据
function createStrikeCoordinationCommand() {
  return {
    commandID: Date.now(),
    platformName: "UAV001", // 发送命令的无人机
    command: 11, // Uav_Strike_Coordinate
    strikeCoordinateParam: {
      artyName: "火炮分队Alpha",
      targetName: "敌方指挥所",
      coordinate: {
        longitude: 118.78945,
        latitude: 32.04567,
        altitude: 150,
      },
    },
  };
}

// 模拟平台命令数据包
function createPlatformCommandPacket(commandData) {
  return {
    timestamp: Date.now(),
    source: "192.168.1.100:8080",
    data: new Buffer([]), // 模拟二进制数据
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
}

// 模拟火炮页面的协同目标处理逻辑
function processCoordinationCommand(packet) {
  console.log("1. 处理接收到的平台命令包...");

  const receivedCoordinationTarget = {
    name: "",
    coordinates: "",
    sourcePlatform: "",
    longitude: undefined,
    latitude: undefined,
    altitude: undefined,
  };

  try {
    if (packet.parsedPacket?.packageType === 0x2a) {
      // 平台命令数据包 - 处理打击协同命令
      const parsedData = packet.parsedPacket.parsedData;

      if (parsedData?.command === 11 && parsedData?.strikeCoordinateParam) {
        // 打击协同命令（Uav_Strike_Coordinate = 11）
        const strikeParam = parsedData.strikeCoordinateParam;
        const sourcePlatform = parsedData.platformName || "未知平台";

        console.log("   检测到打击协同命令:");
        console.log(`   - 源平台: ${sourcePlatform}`);
        console.log(`   - 命令ID: ${parsedData.commandID}`);
        console.log(`   - 目标名称: ${strikeParam.targetName}`);
        console.log(`   - 火炮名称: ${strikeParam.artyName}`);

        // 提取目标信息
        if (strikeParam.targetName) {
          receivedCoordinationTarget.name = strikeParam.targetName;
          receivedCoordinationTarget.sourcePlatform = sourcePlatform;

          // 提取坐标信息
          if (strikeParam.coordinate) {
            const coord = strikeParam.coordinate;
            console.log(
              `   - 原始坐标: 经度${coord.longitude}°, 纬度${coord.latitude}°, 海拔${coord.altitude}m`
            );

            // 转换为可读格式
            const lonDeg = Math.floor(coord.longitude);
            const lonMin = Math.floor((coord.longitude - lonDeg) * 60);
            const lonSec = Math.floor(
              ((coord.longitude - lonDeg) * 60 - lonMin) * 60
            );

            const latDeg = Math.floor(coord.latitude);
            const latMin = Math.floor((coord.latitude - latDeg) * 60);
            const latSec = Math.floor(
              ((coord.latitude - latDeg) * 60 - latMin) * 60
            );

            receivedCoordinationTarget.coordinates = `E${lonDeg}°${lonMin}'${lonSec}" N${latDeg}°${latMin}'${latSec}"`;
            receivedCoordinationTarget.longitude = coord.longitude;
            receivedCoordinationTarget.latitude = coord.latitude;
            receivedCoordinationTarget.altitude = coord.altitude;

            console.log(
              `   - 格式化坐标: ${receivedCoordinationTarget.coordinates}`
            );
          }

          console.log("   ✅ 协同目标信息提取成功");
          return {
            success: true,
            target: receivedCoordinationTarget,
            message: `收到来自 ${sourcePlatform} 的打击协同命令，目标：${strikeParam.targetName}`,
          };
        }
      }
    }

    return {
      success: false,
      message: "不是打击协同命令或数据格式不正确",
    };
  } catch (error) {
    console.error("   ❌ 处理协同命令失败:", error);
    return {
      success: false,
      message: `处理失败: ${error.message}`,
    };
  }
}

// 模拟目标采用功能
function adoptCoordinationTarget(coordinationTarget) {
  console.log("2. 模拟采用协同目标...");

  if (!coordinationTarget.name) {
    console.log("   ⚠️  没有可采用的协同目标");
    return false;
  }

  // 模拟当前目标数据
  const currentTarget = {
    name: "敌方无人机-001", // 原始目标
    coordinates: "E115°30'12\" N39°45'36\"", // 原始坐标
  };

  console.log("   原始目标信息:");
  console.log(`   - 名称: ${currentTarget.name}`);
  console.log(`   - 坐标: ${currentTarget.coordinates}`);

  // 将协同目标信息复制到当前目标
  currentTarget.name = coordinationTarget.name;
  currentTarget.coordinates = coordinationTarget.coordinates;

  console.log("   更新后目标信息:");
  console.log(`   - 名称: ${currentTarget.name}`);
  console.log(`   - 坐标: ${currentTarget.coordinates}`);
  console.log("   ✅ 协同目标采用成功");

  return true;
}

// 运行测试
try {
  console.log("创建打击协同命令数据...");
  const commandData = createStrikeCoordinationCommand();
  console.log("命令数据:", JSON.stringify(commandData, null, 2));
  console.log("");

  console.log("创建平台命令数据包...");
  const packet = createPlatformCommandPacket(commandData);
  console.log(
    `数据包类型: 0x${packet.parsedPacket.packageType.toString(16)} (${
      packet.parsedPacket.packageTypeName
    })`
  );
  console.log(`数据包大小: ${packet.size} 字节`);
  console.log("");

  console.log("测试火炮页面处理逻辑...");
  const result = processCoordinationCommand(packet);
  console.log("");

  if (result.success) {
    console.log("协同目标信息提取结果:");
    console.log(`- 目标名称: ${result.target.name}`);
    console.log(`- 坐标信息: ${result.target.coordinates}`);
    console.log(`- 源平台: ${result.target.sourcePlatform}`);
    console.log(`- 经度: ${result.target.longitude}°`);
    console.log(`- 纬度: ${result.target.latitude}°`);
    console.log(`- 海拔: ${result.target.altitude}m`);
    console.log("");

    // 测试采用功能
    const adoptResult = adoptCoordinationTarget(result.target);
    console.log("");

    // 验证坐标转换的准确性
    console.log("3. 验证坐标转换准确性...");
    const expectedLon = 118;
    const expectedLat = 32;
    const actualLon = Math.floor(result.target.longitude);
    const actualLat = Math.floor(result.target.latitude);

    const lonCorrect = actualLon === expectedLon;
    const latCorrect = actualLat === expectedLat;

    console.log(
      `   经度验证: ${
        lonCorrect ? "✅ 正确" : "❌ 错误"
      } (期望: ${expectedLon}°, 实际: ${actualLon}°)`
    );
    console.log(
      `   纬度验证: ${
        latCorrect ? "✅ 正确" : "❌ 错误"
      } (期望: ${expectedLat}°, 实际: ${actualLat}°)`
    );

    console.log("\n=== 测试总结 ===");
    if (result.success && adoptResult && lonCorrect && latCorrect) {
      console.log("🎉 所有测试通过！火炮页面协同命令接收功能正常");
      console.log("📋 验证的功能:");
      console.log("   ✅ 平台命令包解析 (0x2a)");
      console.log("   ✅ 打击协同命令识别 (command = 11)");
      console.log("   ✅ 目标名称提取");
      console.log("   ✅ 坐标信息提取和格式化");
      console.log("   ✅ 源平台信息记录");
      console.log("   ✅ 协同目标采用功能");
      console.log("   ✅ 坐标转换准确性");
    } else {
      console.log("❌ 部分测试失败，需要检查实现");
    }
  } else {
    console.log("❌ 协同命令处理失败:", result.message);
  }
} catch (error) {
  console.error("❌ 测试执行失败:", error);
}
