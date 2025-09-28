/**
 * 测试火炮端接收打击协同命令的完整流程
 * 验证：1. 报文区域显示 2. 目标装订区域更新
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

async function testArtilleryCoordinationReception() {
  console.log("🧪 开始火炮端协同命令接收测试");

  try {
    // 加载protobuf定义
    const protoPath = path.join(__dirname, "../src/protobuf");
    const requiredFiles = [
      path.join(protoPath, "PublicStruct.proto"),
      path.join(protoPath, "PlatformCmd.proto"),
    ];

    const root = await protobuf.load(requiredFiles);
    console.log("✅ Protobuf定义文件加载成功");

    // 创建接收socket
    const receiverSocket = dgram.createSocket({
      type: "udp4",
      reuseAddr: true,
    });
    const senderSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });

    const multicastAddress = "239.255.43.21";
    const multicastPort = 10086;

    // 设置接收器
    await new Promise((resolve, reject) => {
      receiverSocket.on("message", (msg, rinfo) => {
        handleReceivedMessage(msg, rinfo, root);
      });

      receiverSocket.on("error", reject);

      receiverSocket.bind(multicastPort, () => {
        receiverSocket.addMembership(multicastAddress);
        console.log(`📡 接收器已绑定到 ${multicastAddress}:${multicastPort}`);
        resolve();
      });
    });

    // 设置发送器
    await new Promise((resolve) => {
      senderSocket.bind(() => {
        senderSocket.setBroadcast(true);
        console.log("📤 发送器已初始化");
        resolve();
      });
    });

    // 等待2秒
    console.log("⏳ 等待2秒让接收器准备好...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 发送测试的打击协同命令
    await sendTestStrikeCoordinateCommand(
      root,
      senderSocket,
      multicastAddress,
      multicastPort
    );

    // 等待5秒观察结果
    console.log("⏳ 等待5秒观察接收结果...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 关闭socket
    receiverSocket.close();
    senderSocket.close();
    console.log("🏁 测试完成");
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

function handleReceivedMessage(buffer, rinfo, root) {
  try {
    console.log(
      `\n📨 收到消息 (${buffer.length} 字节) from ${rinfo.address}:${rinfo.port}`
    );

    // 解析包头
    if (buffer.length < 8) {
      console.log("❌ 数据包太短，无法解析包头");
      return;
    }

    const header1 = buffer[0];
    const header2 = buffer[1];
    const protocolID = buffer[2];
    const packageType = buffer[3];
    const dataLength = buffer.readUInt32LE(4);

    console.log("📦 包头信息:", {
      header: `0x${header1.toString(16)} 0x${header2.toString(16)}`,
      protocolID: `0x${protocolID.toString(16)}`,
      packageType: `0x${packageType.toString(16)}`,
      声明长度: dataLength,
      实际负载长度: buffer.length - 8,
    });

    // 检查是否是平台命令包 (0x2A)
    if (packageType === 0x2a) {
      console.log("🎯 这是平台命令包，开始解析...");

      // 提取protobuf数据
      const protobufData = buffer.slice(8);

      // 解析protobuf消息
      const PlatformCmdType = root.lookupType("PlatformStatus.PlatformCmd");
      const decoded = PlatformCmdType.decode(protobufData);
      const message = PlatformCmdType.toObject(decoded);

      console.log("🔍 解析后的消息:", JSON.stringify(message, null, 2));

      // 检查是否是打击协同命令
      if (message.command === 11 && message.strikeCoordinateParam) {
        console.log("✅ 找到打击协同命令 (command: 11)!");

        const strikeParam = message.strikeCoordinateParam;
        console.log("🎯 打击协同参数:", {
          artyName: strikeParam.artyName,
          targetName: strikeParam.targetName,
          coordinate: strikeParam.coordinate,
        });

        // 模拟火炮端的处理逻辑
        console.log("\n🔥 火炮端处理逻辑：");
        console.log(
          `1. ✅ 报文区域显示：收到来自 ${message.platformName} 的打击协同命令（目标：${strikeParam.targetName}）`
        );
        console.log(`2. ✅ 目标装订更新：目标名称 = ${strikeParam.targetName}`);

        if (strikeParam.coordinate) {
          const coord = strikeParam.coordinate;
          const lonDeg = Math.floor(coord.longitude);
          const lonMin = Math.floor((coord.longitude - lonDeg) * 60);
          const lonSec = Math.floor(
            ((coord.longitude - lonDeg) * 60 - lonMin) * 60
          );

          const latDeg = Math.floor(coord.latitude);
          const latMin = Math.floor((coord.latitude - latDeg) * 60);
          const latSec = Math.floor(
            ((coord.latitude - latDeg) * 60 - latMin) * 60
          );

          const coordinateStr = `E${lonDeg}°${lonMin}'${lonSec}" N${latDeg}°${latMin}'${latSec}"`;
          console.log(`3. ✅ 坐标信息更新：${coordinateStr}`);
        }

        console.log("🎉 火炮端接收打击协同命令测试成功！");
      } else {
        console.log("ℹ️ 不是打击协同命令，跳过处理");
      }
    } else {
      console.log(
        `ℹ️ 跳过非平台命令包 (packageType: 0x${packageType.toString(16)})`
      );
    }
  } catch (error) {
    console.error("❌ 解析消息失败:", error);
  }
}

async function sendTestStrikeCoordinateCommand(root, socket, address, port) {
  try {
    console.log("\n🚀 发送测试的打击协同命令...");

    const PlatformCmdType = root.lookupType("PlatformStatus.PlatformCmd");
    const StrikeCoordinateParamType = root.lookupType(
      "PlatformStatus.StrikeCoordinateParam"
    );

    // 创建测试数据 - 模拟无人机发送给火炮的打击协同命令
    const testData = {
      commandID: Date.now(),
      platformName: "uav01-1a", // 无人机名称
      command: 11, // Uav_Strike_Coordinate
      strikeCoordinateParam: StrikeCoordinateParamType.create({
        artyName: "phl_1", // 目标火炮名称
        targetName: "ship1", // 目标名称
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

    console.log("📦 数据包信息:", {
      总长度: fullPacket.length,
      包头: header.toString("hex"),
      协议ID: `0x${protocolID.toString(16)}`,
      包类型: `0x${packageType.toString(16)}`,
      数据长度: size,
    });

    // 发送数据包
    await new Promise((resolve, reject) => {
      socket.send(fullPacket, port, address, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`📡 测试打击协同命令已发送到 ${address}:${port}`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("❌ 发送测试命令失败:", error);
  }
}

// 运行测试
if (require.main === module) {
  testArtilleryCoordinationReception().then(() => {
    process.exit(0);
  });
}

module.exports = testArtilleryCoordinationReception;
