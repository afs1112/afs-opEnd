/**
 * 高度设置命令端到端测试
 *
 * 测试流程：
 * 1. 创建高度设置命令
 * 2. 编码为二进制
 * 3. 解码二进制
 * 4. 验证 setAltitudeParam 字段是否存在
 */

const protobuf = require("protobufjs");
const path = require("path");

// 加载 proto 文件
const protoPath = path.join(__dirname, "../src/protobuf/PlatformCmd.proto");
const publicProtoPath = path.join(
  __dirname,
  "../src/protobuf/PublicStruct.proto"
);

async function testAltitudeCommandEndToEnd() {
  console.log("🧪 开始端到端测试高度设置命令...\n");

  const root = new protobuf.Root();
  root.resolvePath = (origin, target) => {
    if (target === "PublicStruct.proto") {
      return publicProtoPath;
    }
    return path.resolve(path.dirname(origin), target);
  };

  await root.load(protoPath);

  const PlatformCmd = root.lookupType("PlatformStatus.PlatformCmd");
  const SetAltitudeParamType = root.lookupType(
    "PlatformStatus.SetAltitudeparam"
  );

  console.log("📦 步骤1: 创建高度设置命令（模拟发送端）");

  const testAltitude = 1500;
  const commandData = {
    commandID: Date.now(),
    platformName: "UAV_001",
    command: 13, // Uav_Set_Altitude
    setAltitudeParam: {
      altitude: testAltitude,
    },
  };

  console.log("  发送端数据:", JSON.stringify(commandData, null, 2));

  console.log("\n🔧 步骤2: 编码为二进制（模拟网络传输）");

  // 方法1：直接创建并编码
  const message1 = PlatformCmd.create(commandData);
  const buffer1 = PlatformCmd.encode(message1).finish();

  console.log("  方法1 - 直接创建:");
  console.log("    二进制长度:", buffer1.length);
  console.log(
    "    十六进制:",
    Buffer.from(buffer1).toString("hex").toUpperCase()
  );
  console.log(
    "    创建的消息对象:",
    JSON.stringify(PlatformCmd.toObject(message1, { defaults: false }), null, 2)
  );

  // 方法2：显式创建参数对象再编码
  const setAltitudeParam = SetAltitudeParamType.create({
    altitude: testAltitude,
  });

  const message2 = PlatformCmd.create({
    commandID: commandData.commandID,
    platformName: commandData.platformName,
    command: commandData.command,
    setAltitudeParam: setAltitudeParam,
  });
  const buffer2 = PlatformCmd.encode(message2).finish();

  console.log("\n  方法2 - 显式创建参数:");
  console.log("    二进制长度:", buffer2.length);
  console.log(
    "    十六进制:",
    Buffer.from(buffer2).toString("hex").toUpperCase()
  );
  console.log(
    "    创建的消息对象:",
    JSON.stringify(PlatformCmd.toObject(message2, { defaults: false }), null, 2)
  );

  console.log("\n📡 步骤3: 解码二进制（模拟接收端）");

  // 解码方法1的数据
  console.log("\n  解码方法1的数据:");
  const decoded1 = PlatformCmd.decode(buffer1);
  const decodedObj1_noDefaults = PlatformCmd.toObject(decoded1, {
    defaults: false,
  });
  const decodedObj1_withDefaults = PlatformCmd.toObject(decoded1, {
    defaults: true,
  });

  console.log(
    "    不含默认值:",
    JSON.stringify(decodedObj1_noDefaults, null, 2)
  );
  console.log(
    "    包含默认值:",
    JSON.stringify(decodedObj1_withDefaults, null, 2)
  );

  if (decodedObj1_noDefaults.setAltitudeParam) {
    console.log("    ✅ setAltitudeParam 字段存在（不含默认值）");
    console.log(
      "    高度值:",
      decodedObj1_noDefaults.setAltitudeParam.altitude
    );
  } else {
    console.log("    ❌ setAltitudeParam 字段不存在（不含默认值）");
  }

  // 解码方法2的数据
  console.log("\n  解码方法2的数据:");
  const decoded2 = PlatformCmd.decode(buffer2);
  const decodedObj2_noDefaults = PlatformCmd.toObject(decoded2, {
    defaults: false,
  });
  const decodedObj2_withDefaults = PlatformCmd.toObject(decoded2, {
    defaults: true,
  });

  console.log(
    "    不含默认值:",
    JSON.stringify(decodedObj2_noDefaults, null, 2)
  );
  console.log(
    "    包含默认值:",
    JSON.stringify(decodedObj2_withDefaults, null, 2)
  );

  if (decodedObj2_noDefaults.setAltitudeParam) {
    console.log("    ✅ setAltitudeParam 字段存在（不含默认值）");
    console.log(
      "    高度值:",
      decodedObj2_noDefaults.setAltitudeParam.altitude
    );
  } else {
    console.log("    ❌ setAltitudeParam 字段不存在（不含默认值）");
  }

  console.log("\n🔍 步骤4: 检查原始解码对象");

  console.log("  方法1 - decoded1 对象属性:");
  console.log("    commandID:", decoded1.commandID);
  console.log("    platformName:", decoded1.platformName);
  console.log("    command:", decoded1.command);
  console.log("    setAltitudeParam:", decoded1.setAltitudeParam);
  console.log("    setAltitudeParam 是否存在:", !!decoded1.setAltitudeParam);

  if (decoded1.setAltitudeParam) {
    console.log(
      "    setAltitudeParam.altitude:",
      decoded1.setAltitudeParam.altitude
    );
  }

  console.log("\n  方法2 - decoded2 对象属性:");
  console.log("    commandID:", decoded2.commandID);
  console.log("    platformName:", decoded2.platformName);
  console.log("    command:", decoded2.command);
  console.log("    setAltitudeParam:", decoded2.setAltitudeParam);
  console.log("    setAltitudeParam 是否存在:", !!decoded2.setAltitudeParam);

  if (decoded2.setAltitudeParam) {
    console.log(
      "    setAltitudeParam.altitude:",
      decoded2.setAltitudeParam.altitude
    );
  }

  console.log("\n🧐 步骤5: 验证字段编号");

  const fields = PlatformCmd.fields;
  console.log("  PlatformCmd 的所有字段:");
  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName];
    console.log(`    ${field.id}. ${fieldName} (${field.type})`);
  });

  console.log("\n✅ 步骤6: 验证结果");

  let success = true;

  if (
    !decoded1.setAltitudeParam ||
    decoded1.setAltitudeParam.altitude !== testAltitude
  ) {
    console.log("  ❌ 方法1: setAltitudeParam 字段丢失或值不正确");
    success = false;
  } else {
    console.log("  ✅ 方法1: setAltitudeParam 字段正确");
  }

  if (
    !decoded2.setAltitudeParam ||
    decoded2.setAltitudeParam.altitude !== testAltitude
  ) {
    console.log("  ❌ 方法2: setAltitudeParam 字段丢失或值不正确");
    success = false;
  } else {
    console.log("  ✅ 方法2: setAltitudeParam 字段正确");
  }

  return success;
}

// 运行测试
testAltitudeCommandEndToEnd()
  .then((result) => {
    if (result) {
      console.log("\n✅ 端到端测试通过！高度设置命令可以正确编码和解码。");
      process.exit(0);
    } else {
      console.log("\n❌ 端到端测试失败！");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ 测试过程中发生错误:", error);
    process.exit(1);
  });
