#!/usr/bin/env node

/**
 * 测试作战测评页面字符串命令解析功能
 *
 * 本测试脚本验证：
 * 1. 字符串枚举命令的正确识别（如 "Uav_Sensor_On"）
 * 2. 数字命令的兼容性保持
 * 3. 混合命令类型的处理
 */

const net = require("net");

// 测试配置
const MULTICAST_CONFIG = {
  host: "224.1.1.1",
  port: 20001,
};

// 模拟命令数据
let commandIdCounter = 2000;

// 创建字符串枚举命令测试数据
function createStringCommands() {
  return [
    {
      name: "传感器开机（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_Sensor_On", // 字符串枚举
          sensorParam: {
            sensorName: "sensor_eoir_1",
          },
        },
      },
      expected: "传感器开机",
    },
    {
      name: "传感器关机（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_Sensor_Off", // 字符串枚举
          sensorParam: {
            sensorName: "sensor_eoir_1",
          },
        },
      },
      expected: "传感器关机",
    },
    {
      name: "传感器转向（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_Sensor_Turn", // 字符串枚举
          sensorParam: {
            sensorName: "sensor_eoir_1",
            azSlew: 30.5,
            elSlew: -10.2,
          },
        },
      },
      expected: "传感器转向",
    },
    {
      name: "激光照射（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_LazerPod_Lasing", // 字符串枚举
          sensorParam: {
            sensorName: "laser_designator-1212",
          },
        },
      },
      expected: "激光吊舱照射",
    },
    {
      name: "停止照射（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_LazerPod_Cease", // 字符串枚举
          sensorParam: {
            sensorName: "laser_designator-1212",
          },
        },
      },
      expected: "激光吊舱停止照射",
    },
    {
      name: "锁定目标（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_Lock_Target", // 字符串枚举
          lockParam: {
            targetName: "enemy_tank_2",
            sensorName: "sensor_eoir_1",
          },
        },
      },
      expected: "锁定目标",
    },
    {
      name: "打击协同（字符串）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-string-test",
          command: "Uav_Strike_Coordinate", // 字符串枚举
          strikeCoordinateParam: {
            targetName: "enemy_ship_2",
            artyName: "phl_2",
          },
        },
      },
      expected: "打击协同",
    },
  ];
}

// 创建数字命令测试数据（确保兼容性）
function createNumericCommands() {
  return [
    {
      name: "传感器开机（数字）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-numeric-test",
          command: 1, // 数字枚举
          sensorParam: {
            sensorName: "sensor_eoir_2",
          },
        },
      },
      expected: "传感器开机",
    },
    {
      name: "激光照射（数字）",
      command: {
        packageType: 0x2a,
        parsedData: {
          commandID: commandIdCounter++,
          platformName: "uav01-numeric-test",
          command: 4, // 数字枚举
          sensorParam: {
            sensorName: "laser_designator-2121",
          },
        },
      },
      expected: "激光吊舱照射",
    },
  ];
}

// 包装数据为完整的数据包格式
function wrapPacketData(data) {
  return {
    type: "packet",
    source: "string_command_parsing_test",
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
async function runStringCommandParsingTest() {
  console.log("=".repeat(80));
  console.log("🔤 作战测评页面字符串命令解析测试");
  console.log("=".repeat(80));
  console.log("本测试验证字符串枚举命令解析功能：");
  console.log('✅ 1. 字符串枚举命令识别（如 "Uav_Sensor_On"）');
  console.log("✅ 2. 数字命令兼容性保持");
  console.log("✅ 3. 混合命令类型处理");
  console.log("✅ 4. 调试信息输出");
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
              name: "uav01-string-test",
              type: "UAV01",
              side: "red",
              group: "string_test_group",
              location: {
                longitude: 116.397428,
                latitude: 39.90923,
                altitude: 1500,
              },
              broken: false,
            },
          },
          {
            base: {
              id: 2,
              name: "uav01-numeric-test",
              type: "UAV01",
              side: "red",
              group: "numeric_test_group",
              location: {
                longitude: 116.407428,
                latitude: 39.91923,
                altitude: 1600,
              },
              broken: false,
            },
          },
        ],
        updateTime: 300,
      },
    };

    await sendMulticastPacket(wrapPacketData(platformData));
    console.log("✅ 基础平台数据已发送");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 测试字符串命令
    console.log("🔤 测试字符串枚举命令...");
    const stringCommands = createStringCommands();

    for (let i = 0; i < stringCommands.length; i++) {
      const test = stringCommands[i];
      console.log(`📤 发送${test.name}...`);
      console.log(`   命令值: "${test.command.parsedData.command}" (字符串)`);
      console.log(`   期望显示: ${test.expected}`);

      await sendMulticastPacket(wrapPacketData(test.command));
      console.log(`✅ ${test.name}已发送`);

      // 等待1秒让用户观察
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("");
    }

    // 测试数字命令（确保兼容性）
    console.log("🔢 测试数字命令兼容性...");
    const numericCommands = createNumericCommands();

    for (let i = 0; i < numericCommands.length; i++) {
      const test = numericCommands[i];
      console.log(`📤 发送${test.name}...`);
      console.log(`   命令值: ${test.command.parsedData.command} (数字)`);
      console.log(`   期望显示: ${test.expected}`);

      await sendMulticastPacket(wrapPacketData(test.command));
      console.log(`✅ ${test.name}已发送`);

      // 等待1秒让用户观察
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("");
    }

    console.log("🎉 字符串命令解析测试完成！");
    console.log("");
    console.log("📋 请在作战测评页面中验证以下效果：");
    console.log("");
    console.log("🔍 验证要点：");
    console.log("1. ✅ 检查string_test_group分组中的字符串命令事件");
    console.log("2. ✅ 检查numeric_test_group分组中的数字命令事件");
    console.log('3. ✅ 确认所有命令都显示正确的中文名称（不是"未知命令"）');
    console.log("4. ✅ 查看控制台输出的调试信息，确认命令类型识别正确");
    console.log("5. ✅ 传感器转向命令显示完整的角度参数");
    console.log("6. ✅ 锁定目标命令显示目标和传感器信息");
    console.log("");

    console.log("💡 修复要点总结：");
    console.log('• 支持字符串枚举命令（如 "Uav_Sensor_On"）');
    console.log("• 保持数字命令的兼容性");
    console.log("• 添加详细的调试日志，显示命令类型和映射过程");
    console.log("• 根据命令类型动态选择相应的映射表");
    console.log("• 增强错误处理，对未识别命令提供更详细的信息");
    console.log("");

    console.log("🔧 技术实现亮点：");
    console.log("• 函数参数类型修改为 number | string，支持两种命令格式");
    console.log("• 分别定义 numericCommandMap 和 stringCommandMap");
    console.log("• 运行时类型检查，动态选择合适的映射表");
    console.log("• 完整的调试信息输出，便于问题排查");
  } catch (error) {
    console.error("❌ 测试过程中发生错误：", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  runStringCommandParsingTest()
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
  runStringCommandParsingTest,
  createStringCommands,
  createNumericCommands,
  wrapPacketData,
  sendMulticastPacket,
};
