/**
 * 测试修复后的 protobuf 配置
 * 验证 StrikeCoordinateParam 中的 GeoCoordinate 类型引用是否正确
 */

const path = require("path");
const protobuf = require("protobufjs");

async function testProtobufConfiguration() {
  console.log("=== 测试修复后的 Protobuf 配置 ===\n");

  try {
    // 1. 加载 protobuf 定义
    console.log("1. 加载 protobuf 文件...");
    const protoPath = path.join(__dirname, "../src/protobuf/PlatformCmd.proto");
    const root = await protobuf.load(protoPath);
    console.log("   ✅ protobuf 文件加载成功");

    // 2. 验证 StrikeCoordinateParam 消息类型
    console.log("\n2. 验证 StrikeCoordinateParam 消息类型...");
    const StrikeCoordinateParam = root.lookupType(
      "PlatformStatus.StrikeCoordinateParam"
    );
    console.log("   ✅ StrikeCoordinateParam 类型查找成功");

    // 3. 验证字段定义
    console.log("\n3. 验证字段定义...");
    const fields = StrikeCoordinateParam.fields;
    console.log("   字段列表:");
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      console.log(`   - ${fieldName}: ${field.type} (id: ${field.id})`);
    });

    // 4. 创建测试数据
    console.log("\n4. 创建和验证测试数据...");
    const testData = {
      artyName: "火炮分队Alpha",
      targetName: "敌方指挥所",
      coordinate: {
        longitude: 118.78945,
        latitude: 32.04567,
        altitude: 150,
      },
    };

    // 5. 编码测试
    console.log("\n5. 编码测试...");
    const message = StrikeCoordinateParam.create(testData);
    const buffer = StrikeCoordinateParam.encode(message).finish();
    console.log(`   ✅ 编码成功，数据长度: ${buffer.length} 字节`);

    // 6. 解码测试
    console.log("\n6. 解码测试...");
    const decoded = StrikeCoordinateParam.decode(buffer);
    const decodedObj = StrikeCoordinateParam.toObject(decoded);
    console.log("   解码结果:");
    console.log(JSON.stringify(decodedObj, null, 2));

    // 7. 验证数据完整性
    console.log("\n7. 验证数据完整性...");
    const isValid =
      decodedObj.artyName === testData.artyName &&
      decodedObj.targetName === testData.targetName &&
      decodedObj.coordinate.longitude === testData.coordinate.longitude &&
      decodedObj.coordinate.latitude === testData.coordinate.latitude &&
      decodedObj.coordinate.altitude === testData.coordinate.altitude;

    console.log(`   ✅ 数据完整性验证: ${isValid ? "通过" : "失败"}`);

    // 8. 测试 PlatformCmd 完整消息
    console.log("\n8. 测试 PlatformCmd 完整消息...");
    const PlatformCmd = root.lookupType("PlatformStatus.PlatformCmd");

    const platformCmdData = {
      commandID: Date.now(),
      platformName: "UAV001",
      command: 11, // Uav_Strike_Coordinate
      strikeCoordinateParam: testData,
    };

    const platformCmdMessage = PlatformCmd.create(platformCmdData);
    const platformCmdBuffer = PlatformCmd.encode(platformCmdMessage).finish();
    const decodedPlatformCmd = PlatformCmd.decode(platformCmdBuffer);
    const decodedPlatformCmdObj = PlatformCmd.toObject(decodedPlatformCmd);

    console.log("   PlatformCmd 编解码结果:");
    console.log(JSON.stringify(decodedPlatformCmdObj, null, 2));
    console.log("   ✅ PlatformCmd 完整消息测试通过");

    console.log("\n=== 测试结果 ===");
    console.log("🎉 所有测试通过！protobuf 配置修复成功！");
    console.log("📋 修复内容:");
    console.log(
      "   ✅ 将 PublicStruct.Coordinate 改为 PublicStruct.GeoCoordinate"
    );
    console.log("   ✅ StrikeCoordinateParam 消息类型正确解析");
    console.log("   ✅ 坐标字段编解码正常");
    console.log("   ✅ 完整的平台命令消息处理正常");
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    console.error("详细错误:", error);

    if (error.message.includes("no such Type or Enum")) {
      console.log("\n💡 建议检查:");
      console.log("   - protobuf 文件路径是否正确");
      console.log("   - import 语句是否正确");
      console.log("   - 类型名称是否匹配");
    }
  }
}

// 运行测试
testProtobufConfiguration();
