#!/usr/bin/env node

/**
 * 测试Environment消息中的温度字段解析
 * 验证PlatformStatus.proto中新增的temperature字段
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

console.log("=== 环境温度字段测试 ===\n");

// 创建UDP socket用于发送组播数据
const sender = dgram.createSocket("udp4");

// 组播地址和端口
const MULTICAST_ADDRESS = "239.255.43.21";
const MULTICAST_PORT = 10086;

// 加载protobuf定义
let root = null;

async function loadProtobufDefinitions() {
  try {
    const protoPath = path.join(__dirname, "..", "src", "protobuf");

    // 加载PlatformStatus相关的protobuf定义
    root = await protobuf.load([
      path.join(protoPath, "PublicStruct.proto"),
      path.join(protoPath, "PlatformStatus.proto"),
    ]);

    console.log("✅ Protobuf定义文件加载成功");

    // 验证Environment类型是否存在
    try {
      const Environment = root.lookupType("PlatformStatus.Environment");
      console.log("✅ 找到Environment类型定义");

      // 查看Environment类型的字段
      const fields = Environment.fields;
      console.log("📋 Environment字段:");
      Object.keys(fields).forEach((fieldName) => {
        const field = fields[fieldName];
        console.log(
          `   - ${fieldName} (${field.type}): ${
            field.optional ? "optional" : "required"
          }`
        );
      });

      // 特别检查temperature字段
      if (fields.temperature) {
        console.log("🌡️ 温度字段已定义:", {
          name: "temperature",
          type: fields.temperature.type,
          id: fields.temperature.id,
          optional: fields.temperature.optional,
        });
      } else {
        console.log("❌ 未找到temperature字段");
      }
    } catch (e) {
      console.log("❌ Environment类型未找到:", e.message);
    }

    // 验证Platforms类型
    try {
      const Platforms = root.lookupType("PlatformStatus.Platforms");
      console.log("✅ 找到Platforms类型定义");
    } catch (e) {
      console.log("❌ Platforms类型未找到:", e.message);
    }
  } catch (error) {
    console.error("❌ 加载Protobuf定义文件失败:", error);
    process.exit(1);
  }
}

// 创建包含温度数据的平台状态
function createPlatformStatusWithTemperature() {
  try {
    const Platforms = root.lookupType("PlatformStatus.Platforms");
    const Environment = root.lookupType("PlatformStatus.Environment");
    const Platform = root.lookupType("PlatformStatus.Platform");
    const PlatformBase = root.lookupType("PlatformStatus.PlatformBase");
    const GeoCoordinate = root.lookupType("PublicStruct.GeoCoordinate");

    console.log("1. 创建包含温度数据的平台状态");

    // 创建地理坐标
    const location = GeoCoordinate.create({
      longitude: 106.319248,
      latitude: 36.221109,
      altitude: 1000,
    });

    // 创建平台基础数据
    const platformBase = PlatformBase.create({
      name: "无人机-Temperature-Test",
      type: "UAV01",
      side: "红方",
      group: "环境测试组",
      broken: false,
      location: location,
      roll: 0,
      pitch: 0,
      yaw: 90,
      speed: 25,
    });

    // 创建平台数据
    const platform = Platform.create({
      base: platformBase,
      updateTime: Date.now(),
    });

    // 创建环境数据 - 包含新的温度字段
    const environment = Environment.create({
      windSpeed: 5.2,
      windDirection: 45,
      cloudLowerAlt: 2000,
      cloudUpperAlt: 8000,
      rainUpperAlt: 0,
      rainRate: 0,
      temperature: 18.5, // 新增的温度字段 (摄氏度)
    });

    console.log("   🌡️ 环境数据:", {
      windSpeed: environment.windSpeed + " m/s",
      windDirection: environment.windDirection + "°",
      cloudLowerAlt: environment.cloudLowerAlt + " m",
      cloudUpperAlt: environment.cloudUpperAlt + " m",
      rainUpperAlt: environment.rainUpperAlt + " m",
      rainRate: environment.rainRate + " mm/h",
      temperature: environment.temperature + " °C", // 重点关注温度字段
    });

    // 创建完整的平台状态
    const platforms = Platforms.create({
      platform: [platform],
      evironment: environment, // 注意：proto文件中是evironment而不是environment
    });

    console.log("   📤 平台状态已创建，包含温度数据");

    return Platforms.encode(platforms).finish();
  } catch (error) {
    console.error("❌ 创建平台状态失败:", error);
    throw error;
  }
}

// 创建协议数据包
function createProtocolPacket(
  protobufData,
  protocolID = 0x01,
  packageType = 0x29
) {
  const size = protobufData.length;
  const packet = Buffer.alloc(8 + size);

  packet.writeUInt8(0xaa, 0); // 包头1
  packet.writeUInt8(0x55, 1); // 包头2
  packet.writeUInt8(protocolID, 2); // 协议ID
  packet.writeUInt8(packageType, 3); // 包类型 (0x29 = PackageType_PlatformStatus)
  packet.writeUInt32LE(size, 4); // 数据长度
  protobufData.copy(packet, 8); // protobuf数据

  return packet;
}

// 测试温度字段解析
function testTemperatureParsing(protobufData) {
  try {
    console.log("\n2. 测试温度字段解析");

    const Platforms = root.lookupType("PlatformStatus.Platforms");

    // 解码
    const decoded = Platforms.decode(protobufData);
    console.log("   ✅ 解码成功");

    // 转换为对象 (模拟解析服务的行为)
    const decodedObject = Platforms.toObject(decoded, {
      longs: String,
      enums: String,
      bytes: String,
      defaults: true,
    });

    console.log(
      "   📥 解析结果 (环境部分):",
      JSON.stringify(decodedObject.evironment, null, 4)
    );

    // 验证关键字段
    const validation = {
      hasEnvironment: !!decodedObject.evironment,
      hasWindSpeed:
        decodedObject.evironment &&
        decodedObject.evironment.windSpeed !== undefined,
      hasWindDirection:
        decodedObject.evironment &&
        decodedObject.evironment.windDirection !== undefined,
      hasTemperature:
        decodedObject.evironment &&
        decodedObject.evironment.temperature !== undefined,
      temperatureValue: decodedObject.evironment
        ? decodedObject.evironment.temperature
        : null,
    };

    console.log("   🔍 验证结果:");
    Object.entries(validation).forEach(([key, value]) => {
      if (key === "temperatureValue") {
        console.log(`     🌡️ ${key}: ${value} °C`);
      } else {
        console.log(`     ${value ? "✅" : "❌"} ${key}: ${value}`);
      }
    });

    const temperatureSupported =
      validation.hasTemperature && validation.temperatureValue !== null;
    console.log(
      `   ${temperatureSupported ? "🎉" : "⚠️"} 温度字段支持: ${
        temperatureSupported ? "已支持" : "不支持"
      }`
    );

    return temperatureSupported;
  } catch (error) {
    console.error("❌ 解析测试失败:", error);
    return false;
  }
}

// 发送数据
function sendPlatformStatusWithTemperature(packet) {
  return new Promise((resolve, reject) => {
    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error("❌ 发送失败:", err);
        reject(err);
      } else {
        console.log("\n3. 数据包发送");
        console.log(
          `   ✅ 已发送包含温度数据的平台状态到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`
        );
        console.log(`   📦 数据包大小: ${packet.length} 字节`);
        console.log(
          `   📋 包类型: 0x${packet[3].toString(
            16
          )} (PackageType_PlatformStatus)`
        );
        console.log(`   🔗 协议ID: 0x${packet[2].toString(16)}`);
        console.log(`   ⏰ 发送时间: ${new Date().toLocaleString("zh-CN")}`);
        resolve();
      }
    });
  });
}

// 主函数
async function main() {
  try {
    await loadProtobufDefinitions();

    // 创建包含温度数据的平台状态
    const protobufData = createPlatformStatusWithTemperature();

    // 测试解析
    const parseSuccess = testTemperatureParsing(protobufData);

    if (!parseSuccess) {
      console.log("\n⚠️ 温度字段解析测试失败，但仍将发送数据包");
    }

    // 创建完整的协议数据包
    const packet = createProtocolPacket(protobufData);

    // 发送数据
    await sendPlatformStatusWithTemperature(packet);

    console.log("\n=== 测试完成 ===");
    console.log(
      "🌡️ 已发送包含温度数据的平台状态，请查看应用程序的组播监听页面"
    );
    console.log("📝 检查项目:");
    console.log("   1. 应用程序是否收到了数据包");
    console.log("   2. 是否正确解析了Environment中的温度字段");
    console.log("   3. 是否在日志中显示了温度数据的特殊标记");
    console.log("   4. 前端界面是否能显示温度信息");
  } catch (error) {
    console.error("❌ 测试失败:", error);
  } finally {
    // 等待一秒后关闭socket
    setTimeout(() => {
      sender.close();
      process.exit(0);
    }, 1000);
  }
}

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n🛑 停止测试...");
  sender.close();
  process.exit(0);
});

// 启动测试
main().catch(console.error);
