#!/usr/bin/env node

/**
 * 测试火炮页面优化效果
 *
 * 本脚本用于验证火炮页面在连接时是否能正确获取相关状态，
 * 包括环境参数、平台状态等的实时同步功能。
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

// 配置
const MULTICAST_ADDRESS = "239.255.43.21";
const MULTICAST_PORT = 10086;

let root;
let PlatformStatus;

// 模拟真实的火炮平台数据
const mockArtilleryPlatforms = [
  {
    base: {
      name: "155mm榴弹炮-01",
      type: "Artillery",
      side: "我方",
      group: "第一火炮营",
      broken: false,
      location: {
        longitude: 116.397428,
        latitude: 39.90923,
        altitude: 50,
      },
      roll: 1.2,
      pitch: -0.8,
      yaw: 180.5,
      speed: 0,
    },
    weapons: [
      {
        type: "155mm Howitzer",
        quantity: 20,
        status: "正常",
      },
    ],
    updateTime: Date.now(),
  },
  {
    base: {
      name: "火箭炮-01",
      type: "ROCKET_LAUNCHER",
      side: "我方",
      group: "第三火炮营",
      broken: false,
      location: {
        longitude: 116.4,
        latitude: 39.91,
        altitude: 45,
      },
      roll: 0.5,
      pitch: 2.1,
      yaw: 225.8,
      speed: 0,
    },
    weapons: [
      {
        type: "Multiple Rocket Launcher",
        quantity: 12,
        status: "就绪",
      },
    ],
    updateTime: Date.now(),
  },
  {
    base: {
      name: "120mm迫击炮-01",
      type: "CANNON",
      side: "我方",
      group: "第一火炮营",
      broken: false,
      location: {
        longitude: 116.395,
        latitude: 39.908,
        altitude: 52,
      },
      roll: -0.3,
      pitch: 1.5,
      yaw: 150.2,
      speed: 0,
    },
    weapons: [
      {
        type: "120mm Mortar",
        quantity: 25,
        status: "正常",
      },
    ],
    updateTime: Date.now(),
  },
];

// 模拟环境数据
const mockEnvironment = {
  temperature: 298.15, // 开尔文温度 (25°C)
  windSpeed: 4.2,
  windDirection: 135, // 东南风
  humidity: 0.68, // 68%
  visibility: 15000, // 15公里
  pressure: 101300, // Pa
};

async function initializeProtobuf() {
  try {
    const protoPath = path.join(__dirname, "..", "src", "protobuf");

    console.log("🔧 加载Protobuf定义...");
    root = await protobuf.load([
      path.join(protoPath, "PublicStruct.proto"),
      path.join(protoPath, "PlatformStatus.proto"),
    ]);

    PlatformStatus = root.lookupType("PlatformStatus.Platforms");

    console.log("✅ Protobuf定义加载成功");
    return true;
  } catch (error) {
    console.error("❌ Protobuf初始化失败:", error.message);
    return false;
  }
}

function createMockPlatformStatusPacket() {
  try {
    const platformsData = {
      platform: mockArtilleryPlatforms,
      evironment: mockEnvironment,
    };

    // 创建Protobuf消息
    const message = PlatformStatus.create(platformsData);
    const buffer = PlatformStatus.encode(message).finish();

    // 创建完整的数据包格式
    const packetTypeBuffer = Buffer.alloc(4);
    packetTypeBuffer.writeUInt32LE(0x29, 0); // 平台状态包类型

    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(buffer.length, 0);

    const fullPacket = Buffer.concat([packetTypeBuffer, lengthBuffer, buffer]);

    console.log("📦 创建模拟火炮平台状态数据包:", {
      火炮数量: mockArtilleryPlatforms.length,
      数据包大小: fullPacket.length,
      包含环境数据: !!mockEnvironment,
    });

    return fullPacket;
  } catch (error) {
    console.error("❌ 创建数据包失败:", error);
    return null;
  }
}

function sendMulticastPacket(packet) {
  const client = dgram.createSocket("udp4");

  client.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (error) => {
    if (error) {
      console.error("❌ 发送失败:", error);
    } else {
      console.log(
        `📡 已发送火炮平台状态数据到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`
      );
      console.log(
        "   包含火炮类型:",
        mockArtilleryPlatforms.map((p) => `${p.base.name}(${p.base.type})`)
      );
      console.log(
        "   环境参数: 温度",
        (mockEnvironment.temperature - 273.15).toFixed(1) + "°C",
        "风速",
        mockEnvironment.windSpeed + "m/s",
        "湿度",
        (mockEnvironment.humidity * 100).toFixed(0) + "%"
      );
    }
    client.close();
  });
}

async function main() {
  console.log("🚀 启动火炮页面优化测试");
  console.log("📋 测试内容:");
  console.log("   1. 发送模拟火炮平台状态数据");
  console.log("   2. 验证环境参数实时更新");
  console.log("   3. 验证平台状态显示优化");
  console.log("");

  // 初始化Protobuf
  const initialized = await initializeProtobuf();
  if (!initialized) {
    process.exit(1);
  }

  // 创建并发送数据包
  const packet = createMockPlatformStatusPacket();
  if (packet) {
    sendMulticastPacket(packet);

    console.log("");
    console.log("✅ 测试数据已发送!");
    console.log("📱 请在火炮操作页面中:");
    console.log("   1. 选择分组 (如: 第一火炮营)");
    console.log("   2. 选择火炮 (如: 155mm榴弹炮-01)");
    console.log('   3. 点击"连接平台"');
    console.log("   4. 观察环境参数和平台状态是否实时更新");
    console.log("");
    console.log("🔍 预期结果:");
    console.log("   - 气候环境显示: 温度25°C, 风速4.2m/s, 湿度68%");
    console.log("   - 平台状态显示: 实时位置、姿态信息");
    console.log("   - 弹药状态显示: 根据武器类型更新数量");
  } else {
    console.error("❌ 无法创建测试数据包");
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
