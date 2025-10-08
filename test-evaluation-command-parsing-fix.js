#!/usr/bin/env node

/**
 * 测试作战测评页面命令解析修复效果
 *
 * 本测试脚本验证：
 * 1. 传感器开关机命令识别（命令1和2）
 * 2. 传感器转向命令识别（命令3）
 * 3. 激光照射命令识别（命令4和5）
 * 4. 锁定目标命令识别（命令10）
 * 5. 其他扩展命令的正确识别
 */

const net = require("net");

// 测试配置
const MULTICAST_CONFIG = {
  host: "224.1.1.1",
  port: 20001,
};

// 模拟命令数据
let commandIdCounter = 1000;

// 创建传感器开机命令（命令1）
function createSensorOnCommand() {
  return {
    packageType: 0x2a, // 平台命令包
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 1, // Uav_Sensor_On
      sensorParam: {
        sensorName: "sensor_eoir_1",
      },
    },
  };
}

// 创建传感器关机命令（命令2）
function createSensorOffCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 2, // Uav_Sensor_Off
      sensorParam: {
        sensorName: "sensor_eoir_1",
      },
    },
  };
}

// 创建传感器转向命令（命令3）
function createSensorTurnCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 3, // Uav_Sensor_Turn
      sensorParam: {
        sensorName: "sensor_eoir_1",
        azSlew: 45.5,
        elSlew: -15.2,
      },
    },
  };
}

// 创建激光照射命令（命令4）
function createLaserOnCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 4, // Uav_LazerPod_Lasing
      sensorParam: {
        sensorName: "laser_designator-1212",
      },
    },
  };
}

// 创建激光停止照射命令（命令5）
function createLaserOffCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 5, // Uav_LazerPod_Cease
      sensorParam: {
        sensorName: "laser_designator-1212",
      },
    },
  };
}

// 创建锁定目标命令（命令10）
function createLockTargetCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 10, // Uav_Lock_Target
      lockParam: {
        targetName: "enemy_tank_1",
        sensorName: "sensor_eoir_1",
      },
    },
  };
}

// 创建速度设定命令（命令9）
function createSetSpeedCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 9, // Uav_Set_Speed
      setSpeedParam: {
        speed: 25.5,
      },
    },
  };
}

// 创建打击协同命令（命令11）
function createStrikeCoordinateCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 11, // Uav_Strike_Coordinate
      strikeCoordinateParam: {
        targetName: "enemy_ship_1",
        artyName: "phl_1",
      },
    },
  };
}

// 创建未知命令（测试未映射的命令）
function createUnknownCommand() {
  return {
    packageType: 0x2a,
    parsedData: {
      commandID: commandIdCounter++,
      platformName: "uav01-test",
      command: 99, // 未定义的命令
    },
  };
}

// 包装数据为完整的数据包格式
function wrapPacketData(data) {
  return {
    type: "packet",
    source: "command_parsing_test",
    timestamp: Date.now(),
    parsedPacket: data,
  };
}

// UDP组播发送函数
function sendMulticastPacket(data) {
  return new Promise((resolve, reject) => {
    const dgram = require("dgram");
    const client = dgram.createSocket("udp4");

    const message = Buffer.from(JSON.stringify(data));

    client.send(
      message,
      MULTICAST_CONFIG.port,
      MULTICAST_CONFIG.host,
      (err) => {
        client.close();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

// 主测试流程
async function runCommandParsingTest() {
  console.log("=".repeat(80));
  console.log("🔧 作战测评页面命令解析修复验证测试");
  console.log("=".repeat(80));
  console.log("本测试验证修复后的命令解析功能：");
  console.log("✅ 1. 传感器开关机命令（1和2）");
  console.log("✅ 2. 传感器转向命令（3）");
  console.log("✅ 3. 激光照射命令（4和5）");
  console.log("✅ 4. 锁定目标命令（10）");
  console.log("✅ 5. 扩展命令和未知命令处理");
  console.log("");

  try {
    // 首先发送平台数据，确保有分组
    console.log("📊 发送基础平台数据...");
    const platformData = {
      packageType: 0x29,
      parsedData: {
        platform: [
          {
            base: {
              id: 1,
              name: "uav01-test",
              type: "UAV01",
              side: "red",
              group: "test_group",
              location: {
                longitude: 116.397428,
                latitude: 39.90923,
                altitude: 1500,
              },
              broken: false,
            },
          },
        ],
        updateTime: 200,
      },
    };

    await sendMulticastPacket(wrapPacketData(platformData));
    console.log("✅ 基础平台数据已发送");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 测试各种命令
    const testCommands = [
      {
        name: "传感器开机",
        command: createSensorOnCommand(),
        expected: "传感器开机",
      },
      {
        name: "传感器关机",
        command: createSensorOffCommand(),
        expected: "传感器关机",
      },
      {
        name: "传感器转向",
        command: createSensorTurnCommand(),
        expected: "传感器转向",
      },
      {
        name: "激光照射",
        command: createLaserOnCommand(),
        expected: "激光吊舱照射",
      },
      {
        name: "停止照射",
        command: createLaserOffCommand(),
        expected: "激光吊舱停止照射",
      },
      {
        name: "锁定目标",
        command: createLockTargetCommand(),
        expected: "锁定目标",
      },
      {
        name: "速度设定",
        command: createSetSpeedCommand(),
        expected: "设定无人机速度",
      },
      {
        name: "打击协同",
        command: createStrikeCoordinateCommand(),
        expected: "打击协同",
      },
      {
        name: "未知命令",
        command: createUnknownCommand(),
        expected: "未知命令",
      },
    ];

    console.log("🚀 开始发送各种命令进行测试...");
    console.log("");

    for (let i = 0; i < testCommands.length; i++) {
      const test = testCommands[i];
      console.log(`📤 发送${test.name}命令...`);
      console.log(`   命令代码: ${test.command.parsedData.command}`);
      console.log(`   期望显示: ${test.expected}`);

      await sendMulticastPacket(wrapPacketData(test.command));
      console.log(`✅ ${test.name}命令已发送`);

      // 等待1秒让用户观察
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("");
    }

    console.log("🎉 所有命令测试完成！");
    console.log("");
    console.log("📋 请在作战测评页面中验证以下效果：");
    console.log("");
    console.log("🔍 验证要点：");
    console.log("1. ✅ 检查test_group分组中是否出现了所有命令事件");
    console.log('2. ✅ 每个命令是否显示正确的中文名称（不再是"未知命令"）');
    console.log("3. ✅ 传感器转向命令是否显示了方位角和俯仰角参数");
    console.log("4. ✅ 锁定目标命令是否显示了目标名称和传感器名称");
    console.log("5. ✅ 速度设定命令是否显示了速度参数");
    console.log("6. ✅ 打击协同命令是否显示了目标和火炮信息");
    console.log('7. ✅ 未知命令（代码99）仍然显示为"未知命令"');
    console.log("");

    console.log("💡 修复要点总结：");
    console.log("• 更新了commandMap，包含所有PlatformCmd.proto中定义的命令");
    console.log('• 命令4现在正确显示为"激光吊舱照射"而不是"目标锁定"');
    console.log('• 命令5正确显示为"激光吊舱停止照射"');
    console.log("• 新增支持命令9（速度设定）和命令10（锁定目标）等");
    console.log("• 增加了详细的参数解析，提供更丰富的命令信息");
    console.log("• 添加了调试日志，便于排查未识别的命令");
  } catch (error) {
    console.error("❌ 测试过程中发生错误：", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  runCommandParsingTest()
    .then(() => {
      console.log("\n🏁 测试脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 测试失败：", error);
      process.exit(1);
    });
}

module.exports = {
  runCommandParsingTest,
  createSensorOnCommand,
  createSensorOffCommand,
  createSensorTurnCommand,
  createLaserOnCommand,
  createLaserOffCommand,
  createLockTargetCommand,
  createSetSpeedCommand,
  createStrikeCoordinateCommand,
  createUnknownCommand,
  wrapPacketData,
  sendMulticastPacket,
};
