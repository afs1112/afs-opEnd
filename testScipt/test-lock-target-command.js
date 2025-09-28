#!/usr/bin/env node

/**
 * 测试锁定目标命令的发送和解析
 * 验证新增的LockParam支持
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

console.log("=== 锁定目标命令测试 ===\n");

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

    // 加载PlatformCmd相关的protobuf定义
    root = await protobuf.load([
      path.join(protoPath, "PublicStruct.proto"),
      path.join(protoPath, "PlatformCmd.proto"),
    ]);

    console.log("✅ Protobuf定义文件加载成功");

    // 验证LockParam类型是否存在
    try {
      const LockParam = root.lookupType("PlatformStatus.LockParam");
      console.log("✅ 找到LockParam类型定义");
    } catch (e) {
      console.log("❌ LockParam类型未找到:", e.message);
    }

    // 验证PlatformCmd类型
    try {
      const PlatformCmd = root.lookupType("PlatformStatus.PlatformCmd");
      console.log("✅ 找到PlatformCmd类型定义");
    } catch (e) {
      console.log("❌ PlatformCmd类型未找到:", e.message);
    }
  } catch (error) {
    console.error("❌ 加载Protobuf定义文件失败:", error);
    process.exit(1);
  }
}

// 创建锁定目标命令数据
function createLockTargetCommand() {
  try {
    const PlatformCmd = root.lookupType("PlatformStatus.PlatformCmd");
    const LockParam = root.lookupType("PlatformStatus.LockParam");

    console.log("1. 创建锁定目标命令数据");

    // 创建锁定参数
    const lockParam = LockParam.create({
      targetName: "敌方无人机-001",
      sensorName: "EO-Camera-1",
    });

    console.log("   🎯 锁定参数:", {
      targetName: lockParam.targetName,
      sensorName: lockParam.sensorName,
    });

    // 创建完整的平台命令
    const platformCmd = PlatformCmd.create({
      commandID: Date.now(),
      platformName: "UAV-Hunter-001",
      command: 10, // Uav_Lock_Target
      lockParam: lockParam,
    });

    console.log("   📤 平台命令:", {
      commandID: platformCmd.commandID,
      platformName: platformCmd.platformName,
      command: platformCmd.command + " (Uav_Lock_Target)",
      lockParam: platformCmd.lockParam,
    });

    return PlatformCmd.encode(platformCmd).finish();
  } catch (error) {
    console.error("❌ 创建锁定目标命令失败:", error);
    throw error;
  }
}

// 创建协议数据包
function createProtocolPacket(
  protobufData,
  protocolID = 0x01,
  packageType = 0x2a
) {
  const size = protobufData.length;
  const packet = Buffer.alloc(8 + size);

  packet.writeUInt8(0xaa, 0); // 包头1
  packet.writeUInt8(0x55, 1); // 包头2
  packet.writeUInt8(protocolID, 2); // 协议ID
  packet.writeUInt8(packageType, 3); // 包类型 (0x2A = PackageType_PlatformCommand)
  packet.writeUInt32LE(size, 4); // 数据长度
  protobufData.copy(packet, 8); // protobuf数据

  return packet;
}

// 测试命令解析
function testCommandParsing(protobufData) {
  try {
    console.log("\n2. 测试命令解析");

    const PlatformCmd = root.lookupType("PlatformStatus.PlatformCmd");

    // 解码
    const decoded = PlatformCmd.decode(protobufData);
    console.log("   ✅ 解码成功");

    // 转换为对象 (模拟解析服务的行为)
    const decodedObject = PlatformCmd.toObject(decoded, {
      longs: String,
      enums: String, // 显示枚举名称
      bytes: String,
      defaults: true,
    });

    console.log("   📥 解析结果:", JSON.stringify(decodedObject, null, 4));

    // 验证关键字段
    const validation = {
      hasCommandID: !!decodedObject.commandID,
      hasPlatformName: !!decodedObject.platformName,
      hasCorrectCommand: decodedObject.command === "Uav_Lock_Target",
      hasLockParam: !!decodedObject.lockParam,
      hasTargetName:
        decodedObject.lockParam && !!decodedObject.lockParam.targetName,
      hasSensorName:
        decodedObject.lockParam && !!decodedObject.lockParam.sensorName,
    };

    console.log("   🔍 验证结果:");
    Object.entries(validation).forEach(([key, passed]) => {
      console.log(`     ${passed ? "✅" : "❌"} ${key}: ${passed}`);
    });

    const allPassed = Object.values(validation).every((v) => v);
    console.log(
      `   ${allPassed ? "🎉" : "⚠️"} 整体验证: ${allPassed ? "通过" : "失败"}`
    );

    return allPassed;
  } catch (error) {
    console.error("❌ 解析测试失败:", error);
    return false;
  }
}

// 发送数据
function sendLockTargetCommand(packet) {
  return new Promise((resolve, reject) => {
    sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error("❌ 发送失败:", err);
        reject(err);
      } else {
        console.log("\n3. 数据包发送");
        console.log(
          `   ✅ 已发送锁定目标命令到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`
        );
        console.log(`   📦 数据包大小: ${packet.length} 字节`);
        console.log(
          `   📋 包类型: 0x${packet[3].toString(
            16
          )} (PackageType_PlatformCommand)`
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

    // 创建锁定目标命令
    const protobufData = createLockTargetCommand();

    // 测试解析
    const parseSuccess = testCommandParsing(protobufData);

    if (!parseSuccess) {
      console.log("\n⚠️ 解析测试失败，但仍将发送数据包");
    }

    // 创建完整的协议数据包
    const packet = createProtocolPacket(protobufData);

    // 发送命令
    await sendLockTargetCommand(packet);

    console.log("\n=== 测试完成 ===");
    console.log("🎯 已发送锁定目标命令，请查看应用程序的组播监听页面");
    console.log("📝 检查项目:");
    console.log("   1. 应用程序是否收到了数据包");
    console.log("   2. 是否正确解析了LockParam参数");
    console.log("   3. 是否在日志中显示了锁定目标的特殊标记");
    console.log("   4. MulticastSenderService是否支持lockParam发送");
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
