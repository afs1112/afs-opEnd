/**
 * 简单测试strikeCoordinateParam参数传递
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

async function testStrikeCoordinateParam() {
  console.log("🧪 开始strikeCoordinateParam参数传递测试");

  try {
    // 加载protobuf定义
    const protoPath = path.join(__dirname, "../src/protobuf");
    const requiredFiles = [
      path.join(protoPath, "PublicStruct.proto"),
      path.join(protoPath, "PlatformCmd.proto"),
    ];

    const root = await protobuf.load(requiredFiles);
    console.log("✅ Protobuf定义文件加载成功");

    // 验证消息类型
    const PlatformCmdType = root.lookupType("PlatformStatus.PlatformCmd");
    const StrikeCoordinateParamType = root.lookupType(
      "PlatformStatus.StrikeCoordinateParam"
    );
    console.log("✅ 找到必要的消息类型");
    console.log("PlatformCmd fields:", Object.keys(PlatformCmdType.fields));
    console.log(
      "StrikeCoordinateParam fields:",
      Object.keys(StrikeCoordinateParamType.fields)
    );

    // 创建测试数据
    const testData = {
      commandID: Date.now(),
      platformName: "UAV-Test-001",
      command: 11, // Uav_Strike_Coordinate
      strikeCoordinateParam: StrikeCoordinateParamType.create({
        artyName: "火炮-001",
        targetName: "目标-001",
        coordinate: {
          longitude: 116.397428,
          latitude: 39.90923,
          altitude: 150,
        },
      }),
    };

    console.log("📤 准备发送的数据:", JSON.stringify(testData, null, 2));

    // 创建和编码消息
    const message = PlatformCmdType.create(testData);
    const protobufBuffer = PlatformCmdType.encode(message).finish();

    console.log("🔧 Protobuf编码后大小:", protobufBuffer.length, "字节");

    // 构造完整数据包
    const protocolID = 0x01;
    const packageType = 0x2a;
    const size = protobufBuffer.length;

    const header = Buffer.alloc(8);
    header[0] = 0xaa;
    header[1] = 0x55;
    header[2] = protocolID;
    header[3] = packageType;
    header.writeUInt32LE(size, 4);

    const fullPacket = Buffer.concat([header, protobufBuffer]);

    console.log("📦 完整数据包信息:", {
      总长度: fullPacket.length,
      包头: header.toString("hex"),
      协议ID: `0x${protocolID.toString(16)}`,
      包类型: `0x${packageType.toString(16)}`,
      数据长度: size,
    });

    // 测试解码
    console.log("\n🔍 测试解码...");
    const protobufData = fullPacket.slice(8);
    const decoded = PlatformCmdType.decode(protobufData);
    const decodedMessage = PlatformCmdType.toObject(decoded);

    console.log("🔍 解码后的消息:", JSON.stringify(decodedMessage, null, 2));

    // 检查strikeCoordinateParam
    if (decodedMessage.strikeCoordinateParam) {
      console.log("✅ strikeCoordinateParam 参数成功编码和解码!");
      console.log("🎯 详细信息:", {
        artyName: decodedMessage.strikeCoordinateParam.artyName,
        targetName: decodedMessage.strikeCoordinateParam.targetName,
        coordinate: decodedMessage.strikeCoordinateParam.coordinate,
      });
    } else {
      console.log("❌ strikeCoordinateParam 参数丢失");
    }
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

// 运行测试
if (require.main === module) {
  testStrikeCoordinateParam().then(() => {
    console.log("🏁 测试完成");
    process.exit(0);
  });
}

module.exports = testStrikeCoordinateParam;
