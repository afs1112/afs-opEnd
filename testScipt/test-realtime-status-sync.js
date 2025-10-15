#!/usr/bin/env node

/**
 * 实时状态同步验证测试
 *
 * 这个脚本测试连接后平台状态的实时更新功能
 * 模拟平台状态变化，验证界面是否实时响应
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

// 测试用的平台配置
const TEST_PLATFORMS = [
  {
    name: "无人机-001",
    type: "UAV01",
    group: "第一无人机大队",
    side: "red",
  },
  {
    name: "155mm榴弹炮-01",
    type: "Artillery",
    group: "第一火炮营",
    side: "red",
  },
];

// 创建测试数据
async function createTestPlatformData(sequence) {
  try {
    const protoPath = path.join(__dirname, "src/protobuf/PlatformStatus.proto");
    const root = await protobuf.load(protoPath);
    const PlatformsMessage = root.lookupType("PlatformStatus.Platforms");

    // 创建包含多个平台的动态数据
    const platformData = {
      platform: TEST_PLATFORMS.map((testPlatform, index) => {
        const isUav = testPlatform.type === "UAV01";

        // 基础平台数据
        const basePlatform = {
          base: {
            name: testPlatform.name,
            type: testPlatform.type,
            side: testPlatform.side,
            group: testPlatform.group,
            broken: false,
            location: {
              longitude:
                116.397428 +
                index * 0.01 +
                Math.sin(sequence * 0.1 + index) * 0.005,
              latitude:
                39.90923 +
                index * 0.01 +
                Math.cos(sequence * 0.1 + index) * 0.005,
              altitude: 150 + index * 100 + Math.sin(sequence * 0.05) * 50,
            },
            roll: Math.sin(sequence * 0.2 + index) * 10,
            pitch: Math.cos(sequence * 0.15 + index) * 8,
            yaw: (sequence * 3 + index * 45) % 360,
            speed: 30 + Math.sin(sequence * 0.3 + index) * 20,
          },
          updateTime: sequence,
          mover: {
            type: isUav ? "Quadrotor" : "Vehicle",
            route: [],
          },
          comms: [
            {
              base: {
                name: "数据链路",
                type: "DataLink",
                isTurnedOn: true,
              },
              network: "军用网络",
            },
          ],
        };

        if (isUav) {
          // 无人机特有的传感器配置
          basePlatform.sensors = [
            {
              base: {
                name: "光电吊舱",
                type: "EOIR_CAMERA",
                isTurnedOn: (sequence + index * 3) % 8 < 5, // 动态开关
                currentEl: Math.sin(sequence * 0.1 + index) * 45,
                currentAz: (sequence * 2 + index * 30) % 360,
              },
              mode: (sequence + index * 3) % 8 < 5 ? "搜索模式" : "待机模式",
            },
            {
              base: {
                name: "激光测距仪",
                type: "LASER_RANGEFINDER",
                isTurnedOn: (sequence + index * 5) % 10 < 6, // 不同的开关周期
                currentEl: Math.cos(sequence * 0.12 + index) * 30,
                currentAz: (sequence * 4 + index * 45) % 360,
              },
              mode: "测距模式",
              laserCode: 1000 + (sequence % 500) + index * 100,
            },
          ];

          basePlatform.weapons = [
            {
              base: {
                name: "小型导弹",
                type: "MISSILE",
                isTurnedOn: true,
              },
              quantity: Math.max(
                0,
                4 - Math.floor((sequence + index * 10) / 30)
              ),
            },
          ];

          // 动态目标跟踪
          basePlatform.tracks =
            sequence % 4 === index
              ? [
                  {
                    sensorName: "光电吊舱",
                    targetName: `目标-${200 + (sequence % 10) + index}`,
                    targetType: "地面车辆",
                  },
                ]
              : [];
        } else {
          // 火炮特有的武器配置
          basePlatform.weapons = [
            {
              base: {
                name: "155mm榴弹炮弹",
                type: "ARTILLERY_SHELL",
                isTurnedOn: true,
              },
              quantity: Math.max(
                5,
                50 - Math.floor((sequence + index * 5) / 20)
              ),
            },
            {
              base: {
                name: "烟雾弹",
                type: "SMOKE_SHELL",
                isTurnedOn: true,
              },
              quantity: Math.max(
                2,
                20 - Math.floor((sequence + index * 3) / 40)
              ),
            },
          ];

          // 目标装订信息 (TargetLoad)
          if (sequence % 6 === 0) {
            basePlatform.targetLoad = {
              targetName: `目标-${300 + (sequence % 5)}`,
              distance: 3000 + Math.sin(sequence * 0.02) * 500,
              bearing: (sequence * 5) % 360,
              elevationDifference: Math.sin(sequence * 0.03) * 200,
              azimuth: (sequence * 3) % 360,
              pitch: Math.sin(sequence * 0.04) * 45,
            };
          }
        }

        return basePlatform;
      }),

      // 环境参数
      evironment: {
        temperature: 22 + Math.sin(sequence * 0.02) * 8, // 温度变化 14-30度
        windSpeed: 2 + Math.sin(sequence * 0.05) * 3, // 风速 0-5 m/s
        windDirection: (sequence * 15) % 360,
        cloudLowerAlt: 800 + Math.sin(sequence * 0.03) * 400,
        cloudUpperAlt: 2500 + Math.cos(sequence * 0.04) * 800,
        rainRate: Math.max(0, Math.sin(sequence * 0.02) * 0.003), // 降水率
      },
    };

    return { PlatformsMessage, platformData };
  } catch (error) {
    console.error("创建测试数据失败:", error);
    throw error;
  }
}

// 构建组播数据包
function buildPacket(platformsMessage, platformData) {
  try {
    const encodedData = platformsMessage.encode(platformData).finish();

    const header = Buffer.alloc(8);
    header[0] = 0xaa;
    header[1] = 0x55;
    header[2] = 0x01;
    header[3] = 0x29; // PlatformStatus
    header.writeUInt32LE(encodedData.length, 4);

    return Buffer.concat([header, encodedData]);
  } catch (error) {
    console.error("构建数据包失败:", error);
    throw error;
  }
}

// 主测试函数
async function runRealtimeStatusTest() {
  console.log("🔄 启动实时状态同步测试...\n");

  try {
    const client = dgram.createSocket("udp4");
    const MULTICAST_ADDR = "239.255.43.21";
    const MULTICAST_PORT = 10086;

    let sequence = 0;

    console.log("📊 测试目标:");
    TEST_PLATFORMS.forEach((platform, index) => {
      console.log(`   ${index + 1}. ${platform.name} (${platform.group})`);
    });
    console.log(`\n📡 组播地址: ${MULTICAST_ADDR}:${MULTICAST_PORT}`);
    console.log("⏱️  发送间隔: 每1.5秒\n");

    const interval = setInterval(async () => {
      try {
        sequence++;

        const { PlatformsMessage, platformData } = await createTestPlatformData(
          sequence
        );
        const packet = buildPacket(PlatformsMessage, platformData);

        client.send(packet, MULTICAST_PORT, MULTICAST_ADDR, (err) => {
          if (err) {
            console.error(`❌ 发送失败 #${sequence}:`, err.message);
          } else {
            console.log(`✅ #${sequence} - 状态更新已发送:`);

            // 显示关键状态变化
            platformData.platform.forEach((platform, index) => {
              const isUav = platform.base.type === "UAV01";
              console.log(`   ${platform.base.name}:`);
              console.log(
                `     位置: ${platform.base.location.longitude.toFixed(
                  6
                )}, ${platform.base.location.latitude.toFixed(6)}`
              );
              console.log(
                `     姿态: 俯仰${platform.base.pitch.toFixed(
                  1
                )}° 偏航${platform.base.yaw.toFixed(1)}°`
              );

              if (isUav && platform.sensors) {
                const optoSensor = platform.sensors[0];
                const laserSensor = platform.sensors[1];
                console.log(
                  `     载荷: 光电${
                    optoSensor.base.isTurnedOn ? "开" : "关"
                  } 激光${laserSensor.base.isTurnedOn ? "开" : "关"}`
                );
                console.log(`     激光编码: ${laserSensor.laserCode}`);
                console.log(`     目标: ${platform.tracks.length}个`);
              }

              if (!isUav && platform.weapons) {
                const totalAmmo = platform.weapons.reduce(
                  (sum, w) => sum + w.quantity,
                  0
                );
                console.log(`     弹药: ${totalAmmo}发`);
                if (platform.targetLoad) {
                  console.log(
                    `     装订: ${
                      platform.targetLoad.targetName
                    } 距离${platform.targetLoad.distance.toFixed(0)}m`
                  );
                }
              }
            });

            console.log(
              `   环境: ${platformData.evironment.temperature.toFixed(
                1
              )}°C 风速${platformData.evironment.windSpeed.toFixed(1)}m/s`
            );
            console.log("");
          }
        });
      } catch (error) {
        console.error(`❌ 处理数据包 #${sequence} 时出错:`, error.message);
      }
    }, 1500); // 每1.5秒发送一次

    // 5分钟后停止测试
    setTimeout(() => {
      clearInterval(interval);
      client.close();
      console.log("\n🏁 实时状态同步测试已结束");
      console.log(`\n📈 测试统计:`);
      console.log(`   发送次数: ${sequence}`);
      console.log(`   测试平台: ${TEST_PLATFORMS.length}个`);
      console.log(`   测试时长: 5分钟`);

      console.log("\n🔍 验证要点:");
      console.log('1. 连接后，界面上的数据源指示器应显示"实时数据"');
      console.log("2. 平台位置、姿态应实时变化");
      console.log("3. 无人机的载荷开关状态应周期性变化");
      console.log("4. 激光编码应实时更新");
      console.log("5. 火炮的弹药数量应逐渐减少");
      console.log("6. 环境参数应实时更新");
      console.log("7. 目标跟踪信息应动态显示");

      process.exit(0);
    }, 5 * 60 * 1000); // 5分钟
  } catch (error) {
    console.error("❌ 测试初始化失败:", error);
    process.exit(1);
  }
}

// 程序入口
async function main() {
  console.log("🎯 实时状态同步测试");
  console.log("=====================================");
  console.log("此测试将验证连接后平台状态的实时更新功能");
  console.log("");
  console.log("测试内容:");
  console.log("• 平台位置和姿态的实时变化");
  console.log("• 载荷状态的动态开关");
  console.log("• 激光编码的实时更新");
  console.log("• 弹药数量的动态变化");
  console.log("• 环境参数的实时同步");
  console.log("• 目标跟踪信息的动态显示");
  console.log("");
  console.log("🚨 重要提示:");
  console.log("1. 确保应用程序正在运行");
  console.log("2. 在操作页面连接到对应的平台");
  console.log('3. 观察数据源指示器是否显示"实时数据"');
  console.log("4. 检查各项状态是否实时更新");
  console.log("");
  console.log("按 Enter 开始测试...");

  process.stdin.once("data", () => {
    runRealtimeStatusTest();
  });
}

process.on("SIGINT", () => {
  console.log("\n\n🛑 测试被用户中断");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ 未捕获的异常:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ 测试启动失败:", error);
  process.exit(1);
});
