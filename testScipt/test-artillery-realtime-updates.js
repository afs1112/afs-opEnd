#!/usr/bin/env node

/**
 * 持续发送火炮平台状态数据，用于测试实时更新功能
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

// 配置
const MULTICAST_ADDRESS = "239.255.43.21";
const MULTICAST_PORT = 10086;
const SEND_INTERVAL = 2000; // 每2秒发送一次

let root;
let PlatformStatus;
let sendCount = 0;

// 基础火炮平台数据
const basePlatforms = [
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
      roll: 0,
      pitch: 0,
      yaw: 180,
      speed: 0,
    },
    weapons: [
      {
        type: "155mm Howitzer",
        quantity: 20,
        status: "正常",
      },
    ],
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
      roll: 0,
      pitch: 0,
      yaw: 225,
      speed: 0,
    },
    weapons: [
      {
        type: "Multiple Rocket Launcher",
        quantity: 12,
        status: "就绪",
      },
    ],
  },
];

async function initializeProtobuf() {
  try {
    const protoPath = path.join(__dirname, "..", "src", "protobuf");

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

function generateDynamicData() {
  const time = Date.now();

  // 动态生成环境数据
  const environment = {
    temperature: 298 + Math.sin(time / 60000) * 3, // 温度在25°C±3°C波动
    windSpeed: 3 + Math.random() * 4, // 风速3-7m/s
    windDirection: 135 + Math.sin(time / 30000) * 45, // 风向变化
    humidity: 0.6 + Math.random() * 0.2, // 湿度60-80%
    visibility: 12000 + Math.random() * 8000, // 能见度12-20km
    pressure: 101300 + Math.sin(time / 120000) * 500, // 气压变化
  };

  // 动态更新平台数据
  const platforms = basePlatforms.map((platform, index) => ({
    ...platform,
    base: {
      ...platform.base,
      // 轻微的姿态变化
      roll: Math.sin(time / 10000 + index) * 2,
      pitch: Math.cos(time / 12000 + index) * 1.5,
      yaw: platform.base.yaw + Math.sin(time / 20000 + index) * 5,
      // 模拟轻微位置变化
      location: {
        ...platform.base.location,
        longitude:
          platform.base.location.longitude +
          Math.sin(time / 50000 + index) * 0.0001,
        latitude:
          platform.base.location.latitude +
          Math.cos(time / 50000 + index) * 0.0001,
      },
    },
    weapons: platform.weapons.map((weapon) => ({
      ...weapon,
      // 模拟弹药消耗（偶尔减少）
      quantity:
        weapon.quantity - (sendCount % 20 === 0 && sendCount > 0 ? 1 : 0),
    })),
    updateTime: time,
  }));

  return {
    platform: platforms,
    evironment: environment,
  };
}

function createAndSendPacket() {
  try {
    const data = generateDynamicData();

    const message = PlatformStatus.create(data);
    const buffer = PlatformStatus.encode(message).finish();

    // 创建完整的数据包格式
    const packetTypeBuffer = Buffer.alloc(4);
    packetTypeBuffer.writeUInt32LE(0x29, 0); // 平台状态包类型

    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(buffer.length, 0);

    const fullPacket = Buffer.concat([packetTypeBuffer, lengthBuffer, buffer]);

    // 发送数据包
    const client = dgram.createSocket("udp4");

    client.send(fullPacket, MULTICAST_PORT, MULTICAST_ADDRESS, (error) => {
      if (error) {
        console.error("❌ 发送失败:", error);
      } else {
        sendCount++;
        const env = data.evironment;
        console.log(
          `📡 [${sendCount}] 发送火炮状态更新 - 温度:${(
            env.temperature - 273.15
          ).toFixed(1)}°C 风速:${env.windSpeed.toFixed(1)}m/s 湿度:${(
            env.humidity * 100
          ).toFixed(0)}%`
        );
      }
      client.close();
    });
  } catch (error) {
    console.error("❌ 创建/发送数据包失败:", error);
  }
}

async function main() {
  console.log("🔄 启动火炮页面实时数据测试");
  console.log("📡 每2秒发送一次平台状态更新");
  console.log("🎯 测试火炮页面的实时状态同步功能");
  console.log("");

  // 初始化Protobuf
  const initialized = await initializeProtobuf();
  if (!initialized) {
    process.exit(1);
  }

  console.log("✅ 开始发送实时数据，按Ctrl+C停止...");
  console.log("");

  // 立即发送第一次
  createAndSendPacket();

  // 定时发送
  const interval = setInterval(createAndSendPacket, SEND_INTERVAL);

  // 处理程序退出
  process.on("SIGINT", () => {
    console.log("\n⏹️  停止发送数据...");
    clearInterval(interval);
    console.log(`📊 总共发送了 ${sendCount} 次更新`);
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
