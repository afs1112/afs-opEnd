const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

// 创建UDP socket
const sender = dgram.createSocket("udp4");

// 组播配置
const MULTICAST_ADDRESS = "239.255.43.21";
const MULTICAST_PORT = 10086;

let PlatformHeartbeat = null;

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, "..", "src", "protobuf");
    const root = await protobuf.load([
      path.join(protobufPath, "PublicStruct.proto"),
    ]);

    PlatformHeartbeat = root.lookupType("PublicStruct.PlatformHeartbeat");
    console.log("✅ Protobuf加载成功");
  } catch (error) {
    console.error("❌ Protobuf加载失败:", error);
    process.exit(1);
  }
}

// 创建协议数据包
function createProtocolPacket(
  protobufData,
  packageType = 0x2c,
  protocolID = 0x01
) {
  const dataLength = protobufData.length;
  const packet = Buffer.allocUnsafe(8 + dataLength);

  packet[0] = 0xaa; // 协议头1
  packet[1] = 0x55; // 协议头2
  packet[2] = protocolID; // 协议ID
  packet[3] = packageType; // 包类型 (0x2C = PackageType_PlatformHeartbeat)
  packet.writeUInt32LE(dataLength, 4); // 数据长度(小端序)

  protobufData.copy(packet, 8);
  return packet;
}

// 创建平台心跳包
function createPlatformHeartbeat(platformName) {
  const data = {
    name: platformName,
  };

  const message = PlatformHeartbeat.create(data);
  const buffer = PlatformHeartbeat.encode(message).finish();
  return createProtocolPacket(buffer);
}

// 发送心跳包
async function sendHeartbeat(platformName) {
  try {
    const packet = createPlatformHeartbeat(platformName);

    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error(`❌ 发送失败 (${platformName}):`, err.message);
      } else {
        console.log(
          `💓 [${new Date().toLocaleTimeString()}] 发送心跳: ${platformName}`
        );
      }
    });
  } catch (error) {
    console.error("❌ 创建心跳包失败:", error);
  }
}

async function main() {
  await loadProtobuf();

  console.log("💓 平台心跳发送模拟器");
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log("🎯 模拟多个平台同时发送心跳");
  console.log("⏰ 每个平台每3秒发送一次心跳");
  console.log("⏹️  按 Ctrl+C 停止发送");
  console.log("=".repeat(50));

  // 模拟的平台列表
  const platforms = [
    "UAV-001-Alpha",
    "UAV-002-Alpha",
    "Artillery-001-Alpha",
    "Artillery-002-Bravo",
  ];

  let sendCount = 0;

  // 为每个平台设置独立的心跳定时器
  const timers = platforms.map((platformName, index) => {
    // 为每个平台设置不同的启动延迟，避免同时发送
    const startDelay = index * 500; // 500ms间隔启动

    return setTimeout(() => {
      console.log(`🚀 启动平台心跳: ${platformName}`);

      // 立即发送一次
      sendHeartbeat(platformName);
      sendCount++;

      // 每3秒发送一次
      const timer = setInterval(() => {
        sendHeartbeat(platformName);
        sendCount++;
      }, 3000);

      return timer;
    }, startDelay);
  });

  // 每30秒显示统计
  const statsTimer = setInterval(() => {
    const runtime = process.uptime();
    const expectedTotal = platforms.length * Math.floor(runtime / 3);

    console.log("\n" + "=".repeat(50));
    console.log("📊 发送统计:");
    console.log(`   运行时间: ${runtime.toFixed(1)}秒`);
    console.log(`   已发送: ${sendCount} 个心跳包`);
    console.log(`   活跃平台: ${platforms.length} 个`);
    console.log(`   预期总数: ~${expectedTotal} 个`);
    console.log("=".repeat(50));
  }, 30000);

  // 优雅退出
  process.on("SIGINT", () => {
    console.log("\n🛑 停止发送心跳...");

    // 清理所有定时器
    timers.forEach((timer) => {
      if (timer) clearInterval(timer);
    });
    clearInterval(statsTimer);

    console.log("📊 最终统计:");
    console.log(`   总共发送: ${sendCount} 个心跳包`);
    console.log(`   平台数量: ${platforms.length} 个`);
    console.log("\n✨ 模拟器已停止");

    sender.close();
    process.exit(0);
  });
}

// 启动模拟器
main().catch(console.error);
