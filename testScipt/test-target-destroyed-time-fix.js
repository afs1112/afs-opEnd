/**
 * 测试目标摧毁时间记录修复
 *
 * 测试目标：验证无人机页面和测评页面记录的目标摧毁时间是否一致
 *
 * 修复内容：
 * - 无人机页面：使用当前报文的updateTime作为摧毁时间
 * - 测评页面：使用当前报文的updateTime作为摧毁时间
 *
 * 正确逻辑：
 * - 在第一次接收到没有该目标状态的报文时，记录该报文的updateTime作为摧毁时间
 * - 后续报文不应更新已记录的摧毁时间
 */

const protobuf = require("protobufjs");
const dgram = require("dgram");
const path = require("path");

// 组播配置
const MULTICAST_ADDRESS = "239.255.0.1";
const MULTICAST_PORT = 7788;

// 创建UDP socket用于发送组播消息
const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

// Protobuf消息类型
let PlatformStatus;
let PlatformBase;
let Location;

// 初始化Protobuf
async function initProtobuf() {
  try {
    const root = await protobuf.load(
      path.join(__dirname, "../src/protobuf/PlatformStatus.proto")
    );
    PlatformStatus = root.lookupType("PlatformStatus");
    PlatformBase = root.lookupType("PlatformBase");
    Location = root.lookupType("Location");
    console.log("✓ Protobuf协议加载成功");
  } catch (error) {
    console.error("✗ Protobuf加载失败:", error);
    process.exit(1);
  }
}

// 发送平台状态数据
function sendPlatformStatus(platforms, updateTime) {
  const payload = {
    platform: platforms,
    updateTime: updateTime,
    evironment: {
      temperature: 293.15, // 20°C
      windSpeed: 5.0,
      windDirection: 90, // 东风
      cloudLowerAlt: 1000,
      cloudUpperAlt: 3000,
      rainRate: 0,
    },
  };

  const errMsg = PlatformStatus.verify(payload);
  if (errMsg) {
    console.error("✗ 消息验证失败:", errMsg);
    return;
  }

  const message = PlatformStatus.create(payload);
  const buffer = PlatformStatus.encode(message).finish();

  // 构造完整数据包：packageType(1字节) + 长度(4字节) + protobuf数据
  const packageType = Buffer.from([0x29]);
  const length = Buffer.alloc(4);
  length.writeUInt32LE(buffer.length, 0);
  const packet = Buffer.concat([packageType, length, buffer]);

  socket.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error("✗ 发送失败:", err);
    } else {
      console.log(
        `✓ 发送平台状态数据 (updateTime: ${updateTime}秒, 平台数: ${platforms.length})`
      );
    }
  });
}

// 创建无人机平台
function createUAVPlatform(name, group, longitude, latitude, altitude) {
  return {
    base: {
      name: name,
      type: "UAV01",
      side: "red",
      group: group,
      location: {
        longitude: longitude,
        latitude: latitude,
        altitude: altitude,
      },
      broken: false,
    },
    sensors: [
      {
        sensorName: "光电传感器",
        sensorType: "EO",
        sensorStatus: "ON",
      },
      {
        sensorName: "激光传感器",
        sensorType: "LASER",
        sensorStatus: "ON",
      },
    ],
    tracks: [
      {
        targetName: "蓝方目标-001",
        targetType: "TANK",
        sensorName: "光电传感器",
      },
    ],
  };
}

// 创建蓝方目标平台
function createBlueTargetPlatform(name, group, longitude, latitude, altitude) {
  return {
    base: {
      name: name,
      type: "TANK",
      side: "blue",
      group: group,
      location: {
        longitude: longitude,
        latitude: latitude,
        altitude: altitude,
      },
      broken: false,
    },
    sensors: [],
    tracks: [],
  };
}

// 测试场景
async function runTest() {
  console.log("=".repeat(60));
  console.log("测试：目标摧毁时间记录修复");
  console.log("=".repeat(60));

  await initProtobuf();

  console.log("\n测试步骤：");
  console.log("1. 发送初始状态（updateTime=100秒）- 包含无人机和蓝方目标");
  console.log("2. 等待2秒");
  console.log(
    "3. 发送目标摧毁报文（updateTime=120秒）- 蓝方目标消失 ⭐ 关键时刻"
  );
  console.log("4. 等待2秒");
  console.log("5. 发送后续报文1（updateTime=130秒）- 目标继续不存在");
  console.log("6. 等待2秒");
  console.log("7. 发送后续报文2（updateTime=140秒）- 目标继续不存在");
  console.log("8. 等待5秒结束测试");
  console.log("\n预期结果：");
  console.log("- 无人机页面和测评页面都应记录目标摧毁时间为：T + 120秒");
  console.log("- 两个页面记录的摧毁时间应该完全一致（都使用报文的updateTime）");
  console.log("- 不应该被后续报文（130秒、140秒）覆盖");
  console.log("\n开始测试...\n");

  // 步骤1: 发送初始状态（updateTime=100秒）
  console.log("\n[步骤1] 发送初始状态 (updateTime=100秒)");
  const initialPlatforms = [
    createUAVPlatform("红方无人机-001", "第一组", 120.5, 30.5, 1000),
    createBlueTargetPlatform("蓝方目标-001", "第一组", 120.52, 30.52, 100),
  ];
  sendPlatformStatus(initialPlatforms, 100);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 步骤2: 发送目标摧毁报文（updateTime=120秒）- 蓝方目标消失
  console.log("\n[步骤2] 发送目标摧毁报文 (updateTime=120秒) - 蓝方目标消失");
  console.log("⚠️  关键时刻：第一次检测到目标不存在，应记录updateTime=120秒");
  const destroyedPlatforms = [
    createUAVPlatform("红方无人机-001", "第一组", 120.5, 30.5, 1000),
    // 蓝方目标-001消失了
  ];
  sendPlatformStatus(destroyedPlatforms, 120);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 步骤3: 发送后续报文1（updateTime=130秒）
  console.log("\n[步骤3] 发送后续报文1 (updateTime=130秒) - 目标继续不存在");
  console.log("⚠️  不应更新摧毁时间，应保持120秒");
  sendPlatformStatus(destroyedPlatforms, 130);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 步骤4: 发送后续报文2（updateTime=140秒）
  console.log("\n[步骤4] 发送后续报文2 (updateTime=140秒) - 目标继续不存在");
  console.log("⚠️  不应更新摧毁时间，应保持120秒");
  sendPlatformStatus(destroyedPlatforms, 140);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\n" + "=".repeat(60));
  console.log("测试完成！");
  console.log("=".repeat(60));
  console.log("\n验证方法：");
  console.log("1. 打开无人机操作页面，连接到'红方无人机-001'");
  console.log("2. 查看'探测到的目标'列表，找到'蓝方目标-001'，查看摧毁时间");
  console.log("   → 应该显示：'T + 120秒'");
  console.log("3. 打开作战测评页面，查看'第一组'的目标摧毁时间");
  console.log("   → 应该显示：'T + 120秒'");
  console.log("4. 对比两个页面的摧毁时间，应该完全一致");
  console.log("\n修复前的问题：");
  console.log("- 可能记录为'T + 130秒'或'T + 140秒'（使用了后续报文的时间）");
  console.log("- 或两个页面记录的时间不一致");
  console.log("\n修复后的正确结果：");
  console.log(
    "- 两个页面都记录为'T + 120秒'（第一次检测到目标不存在的报文时间）"
  );
  console.log("- 两个页面的摧毁时间完全一致");
  console.log("- 不会被后续报文覆盖，始终保持120秒");
  console.log("\n调试提示：");
  console.log(
    "- 查看控制台日志，搜索 '[UavPage] 目标被摧毁' 和 '[EvaluationPage] 检测到目标'"
  );
  console.log("- 日志中应该显示 '(报文updateTime: 120)'");
  console.log("- 确认只在第一次检测到时记录，后续不再更新");

  setTimeout(() => {
    socket.close();
    process.exit(0);
  }, 1000);
}

// 启动测试
runTest().catch((error) => {
  console.error("测试失败:", error);
  socket.close();
  process.exit(1);
});
