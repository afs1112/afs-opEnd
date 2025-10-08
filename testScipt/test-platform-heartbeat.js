const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

// 创建UDP socket监听心跳
const receiver = dgram.createSocket("udp4");

// 组播配置
const MULTICAST_ADDRESS = "239.255.43.21";
const MULTICAST_PORT = 10087; // 使用不同的端口避免冲突

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

// 存储收到的心跳信息
const heartbeatStats = new Map();
let totalHeartbeats = 0;
let startTime = Date.now();

// 解析数据包
function parsePacket(data) {
  try {
    // 检查包头 (0xAA 0x55)
    if (data.length < 8 || data[0] !== 0xaa || data[1] !== 0x55) {
      return null;
    }

    const protocolID = data[2];
    const packageType = data[3];
    const dataLength = data.readUInt32LE(4);

    // 检查是否为平台心跳包 (0x2C)
    if (packageType !== 0x2c) {
      return null;
    }

    // 提取protobuf数据
    const protobufData = data.slice(8, 8 + dataLength);

    // 解析平台心跳消息
    const heartbeatMessage = PlatformHeartbeat.decode(protobufData);

    return {
      protocolID,
      packageType,
      platformName: heartbeatMessage.name,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("解析心跳包失败:", error);
    return null;
  }
}

// 处理收到的心跳
function handleHeartbeat(platformName, timestamp) {
  totalHeartbeats++;

  // 更新统计信息
  if (!heartbeatStats.has(platformName)) {
    heartbeatStats.set(platformName, {
      count: 0,
      firstSeen: timestamp,
      lastSeen: timestamp,
      intervals: [],
    });
  }

  const stats = heartbeatStats.get(platformName);

  // 计算间隔
  if (stats.count > 0) {
    const interval = timestamp - stats.lastSeen;
    stats.intervals.push(interval);

    // 只保留最近10个间隔
    if (stats.intervals.length > 10) {
      stats.intervals.shift();
    }
  }

  stats.count++;
  stats.lastSeen = timestamp;

  // 计算平均间隔
  const avgInterval =
    stats.intervals.length > 0
      ? stats.intervals.reduce((a, b) => a + b, 0) / stats.intervals.length
      : 0;

  console.log(
    `💓 [${new Date(timestamp).toLocaleTimeString()}] ${platformName} - 第${
      stats.count
    }次心跳 (间隔: ${
      avgInterval > 0 ? (avgInterval / 1000).toFixed(1) + "s" : "首次"
    })`
  );
}

// 显示统计信息
function showStats() {
  const runtime = (Date.now() - startTime) / 1000;

  console.log("\n" + "=".repeat(60));
  console.log("📊 平台心跳统计信息");
  console.log("=".repeat(60));
  console.log(`运行时间: ${runtime.toFixed(1)}秒`);
  console.log(`总心跳数: ${totalHeartbeats}`);
  console.log(`活跃平台: ${heartbeatStats.size}个`);

  if (heartbeatStats.size > 0) {
    console.log("\n各平台详细信息:");
    heartbeatStats.forEach((stats, platformName) => {
      const avgInterval =
        stats.intervals.length > 0
          ? stats.intervals.reduce((a, b) => a + b, 0) /
            stats.intervals.length /
            1000
          : 0;

      const expectedCount = Math.floor(runtime / 3); // 期望每3秒一次
      const healthStatus = stats.count >= expectedCount * 0.8 ? "健康" : "异常";

      console.log(`  🔸 ${platformName}:`);
      console.log(`     心跳次数: ${stats.count}`);
      console.log(`     平均间隔: ${avgInterval.toFixed(1)}秒`);
      console.log(`     状态: ${healthStatus}`);
      console.log(
        `     首次: ${new Date(stats.firstSeen).toLocaleTimeString()}`
      );
      console.log(
        `     最近: ${new Date(stats.lastSeen).toLocaleTimeString()}`
      );
    });
  }

  console.log("=".repeat(60));
}

async function startMonitoring() {
  await loadProtobuf();

  console.log(`💓 平台心跳监听测试脚本`);
  console.log(`📡 应用组播地址: 239.255.43.21:10086`);
  console.log(`🔍 测试监听地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log("\n📋 测试步骤:");
  console.log("   1. 启动主应用 (npm run dev)");
  console.log("   2. 在应用中连接一个平台");
  console.log("   3. 观察此脚本是否收到心跳包");
  console.log("   4. 断开平台连接，观察心跳是否停止");
  console.log("\n⚠️  注意: 由于应用使用10086端口，此脚本使用10087端口模拟接收");
  console.log("        如需接收真实心跳包，请修改应用的组播端口配置\n");

  // 绑定到组播地址
  receiver.bind(MULTICAST_PORT, () => {
    receiver.addMembership(MULTICAST_ADDRESS);
    console.log(`⏳ 等待心跳包... (预期间隔: 3秒)`);
    console.log("⏹️  按 Ctrl+C 停止监听\n");
  });

  // 监听数据包
  receiver.on("message", (data, rinfo) => {
    const heartbeat = parsePacket(data);
    if (heartbeat) {
      handleHeartbeat(heartbeat.platformName, heartbeat.timestamp);
    }
  });

  receiver.on("error", (err) => {
    console.error("❌ 接收器错误:", err);
  });

  // 每30秒显示统计信息
  setInterval(showStats, 30000);

  // 优雅退出
  process.on("SIGINT", () => {
    console.log("\n🛑 停止监听...");
    showStats();
    console.log("\n💡 测试建议:");
    console.log("   ✅ 心跳间隔应该约为3秒");
    console.log("   ✅ 每个连接的平台都应该发送心跳");
    console.log("   ✅ 断开连接后心跳应该停止");
    console.log("   ✅ 心跳包应该包含正确的平台名称");

    receiver.close();
    process.exit(0);
  });
}

// 启动监听
startMonitoring().catch(console.error);
