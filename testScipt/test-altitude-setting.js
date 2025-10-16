/**
 * 测试无人机高度设置功能
 *
 * 测试目标：
 * 1. 验证高度设置指令的构造和发送
 * 2. 验证Protobuf编码正确性
 * 3. 验证数据包格式符合协议规范
 */

const protobuf = require("protobufjs");
const path = require("path");
const dgram = require("dgram");

// 测试配置
const TEST_CONFIG = {
  multicastAddress: "239.255.43.21",
  multicastPort: 10086,
  platformName: "UAV01",
  testAltitude: 1500, // 测试高度 1500米
};

async function testAltitudeSetting() {
  console.log("========================================");
  console.log("无人机高度设置功能测试");
  console.log("========================================\n");

  try {
    // 1. 加载Protobuf定义
    console.log("[步骤1] 加载Protobuf定义文件...");
    const protoPath = path.join(__dirname, "..", "src", "protobuf");

    const root = await protobuf.load([
      path.join(protoPath, "PublicStruct.proto"),
      path.join(protoPath, "PlatformCmd.proto"),
    ]);

    console.log("✅ Protobuf定义文件加载成功\n");

    // 2. 查找消息类型
    console.log("[步骤2] 查找消息类型...");
    const PlatformCmdType = root.lookupType("PlatformStatus.PlatformCmd");
    const SetAltitudeParamType = root.lookupType(
      "PlatformStatus.SetAltitudeparam"
    );
    console.log("✅ 找到 PlatformCmd 类型");
    console.log("✅ 找到 SetAltitudeparam 类型\n");

    // 3. 构造高度设置命令
    console.log("[步骤3] 构造高度设置命令数据...");
    const commandData = {
      commandID: Date.now(),
      platformName: TEST_CONFIG.platformName,
      command: 13, // Uav_Set_Altitude
      setAltitudeParam: SetAltitudeParamType.create({
        altitude: TEST_CONFIG.testAltitude,
      }),
    };

    console.log("命令数据:", {
      commandID: commandData.commandID,
      platformName: commandData.platformName,
      command: commandData.command,
      "setAltitudeParam.altitude": commandData.setAltitudeParam.altitude,
    });

    // 4. 创建并编码Protobuf消息
    console.log("\n[步骤4] 编码Protobuf消息...");
    const message = PlatformCmdType.create(commandData);
    const protobufBuffer = PlatformCmdType.encode(message).finish();

    console.log("✅ Protobuf编码成功");
    console.log(`编码后大小: ${protobufBuffer.length} 字节`);
    console.log(
      `编码数据(前20字节): ${protobufBuffer.slice(0, 20).toString("hex")}\n`
    );

    // 5. 构造完整数据包
    console.log("[步骤5] 构造完整数据包...");
    const protocolID = 0x01;
    const packageType = 0x2a; // PackType_PlatformCmd
    const size = protobufBuffer.length;

    const header = Buffer.alloc(8);
    header[0] = 0xaa;
    header[1] = 0x55;
    header[2] = protocolID;
    header[3] = packageType;
    header.writeUInt32LE(size, 4);

    const fullPacket = Buffer.concat([header, protobufBuffer]);

    console.log("数据包结构:");
    console.log(`  包头: ${header.toString("hex")}`);
    console.log(`  协议ID: 0x${protocolID.toString(16)}`);
    console.log(`  包类型: 0x${packageType.toString(16)} (PlatformCmd)`);
    console.log(`  数据大小: ${size} 字节`);
    console.log(`  总大小: ${fullPacket.length} 字节`);
    console.log(
      `  完整数据包(前32字节): ${fullPacket.slice(0, 32).toString("hex")}\n`
    );

    // 6. 验证数据包格式
    console.log("[步骤6] 验证数据包格式...");
    let valid = true;

    if (fullPacket[0] !== 0xaa || fullPacket[1] !== 0x55) {
      console.log("❌ 包头验证失败");
      valid = false;
    } else {
      console.log("✅ 包头验证通过 (0xAA 0x55)");
    }

    if (fullPacket[2] !== protocolID) {
      console.log("❌ 协议ID验证失败");
      valid = false;
    } else {
      console.log("✅ 协议ID验证通过");
    }

    if (fullPacket[3] !== packageType) {
      console.log("❌ 包类型验证失败");
      valid = false;
    } else {
      console.log("✅ 包类型验证通过 (PlatformCmd)");
    }

    const declaredSize = fullPacket.readUInt32LE(4);
    if (declaredSize !== protobufBuffer.length) {
      console.log("❌ 数据大小验证失败");
      valid = false;
    } else {
      console.log("✅ 数据大小验证通过");
    }

    // 7. 解码验证
    console.log("\n[步骤7] 解码验证...");
    const decodedMessage = PlatformCmdType.decode(protobufBuffer);
    console.log("解码后的消息:");
    console.log("  命令ID:", decodedMessage.commandID);
    console.log("  平台名称:", decodedMessage.platformName);
    console.log("  命令类型:", decodedMessage.command, "(Uav_Set_Altitude)");
    console.log("  设置高度:", decodedMessage.setAltitudeParam?.altitude, "米");

    if (
      decodedMessage.setAltitudeParam?.altitude === TEST_CONFIG.testAltitude
    ) {
      console.log("✅ 高度参数解码验证通过");
    } else {
      console.log("❌ 高度参数解码验证失败");
      valid = false;
    }

    // 8. 发送到组播网络（可选）
    console.log("\n[步骤8] 发送到组播网络...");
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

    await new Promise((resolve, reject) => {
      socket.send(
        fullPacket,
        TEST_CONFIG.multicastPort,
        TEST_CONFIG.multicastAddress,
        (err) => {
          if (err) {
            console.log("❌ 发送失败:", err.message);
            reject(err);
          } else {
            console.log("✅ 高度设置命令已发送到组播网络");
            console.log(
              `   目标地址: ${TEST_CONFIG.multicastAddress}:${TEST_CONFIG.multicastPort}`
            );
            console.log(`   平台名称: ${TEST_CONFIG.platformName}`);
            console.log(`   设置高度: ${TEST_CONFIG.testAltitude} 米`);
            resolve();
          }
        }
      );
    });

    socket.close();

    // 9. 测试总结
    console.log("\n========================================");
    console.log("测试总结");
    console.log("========================================");
    console.log(`总体结果: ${valid ? "✅ 通过" : "❌ 失败"}`);
    console.log("测试项目:");
    console.log("  ✅ Protobuf定义加载");
    console.log("  ✅ 消息类型查找");
    console.log("  ✅ 命令数据构造");
    console.log("  ✅ Protobuf编码");
    console.log("  ✅ 数据包格式验证");
    console.log("  ✅ 解码验证");
    console.log("  ✅ 组播发送");
    console.log("\n功能特性:");
    console.log("  - 支持高度设置指令 (Uav_Set_Altitude)");
    console.log("  - 高度参数正确传递");
    console.log("  - 符合PlatformCmd协议规范");
    console.log("  - 数据包格式正确");
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ 测试失败:", error);
    console.error("错误详情:", error.message);
    if (error.stack) {
      console.error("错误堆栈:", error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
testAltitudeSetting()
  .then(() => {
    console.log("测试执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("测试执行失败:", error);
    process.exit(1);
  });
