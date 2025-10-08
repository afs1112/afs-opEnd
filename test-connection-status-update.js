#!/usr/bin/env node

/**
 * 连接状态实时更新诊断测试
 *
 * 这个脚本模拟平台连接后的状态更新问题，检查：
 * 1. 平台数据监听是否正常
 * 2. 连接后的状态同步机制
 * 3. 数据源指示器更新逻辑
 * 4. 载荷状态同步问题
 */

const dgram = require("dgram");
const protobuf = require("protobufjs");
const path = require("path");

// 模拟连接的平台信息
const TEST_PLATFORM = {
  name: "无人机-001",
  group: "第一无人机大队",
  type: "UAV01",
};

// 创建测试用的平台状态数据
async function createPlatformStatusData() {
  try {
    // 加载protobuf定义
    const protoPath = path.join(__dirname, "src/protobuf/PlatformStatus.proto");
    const root = await protobuf.load(protoPath);
    const PlatformsMessage = root.lookupType("PlatformStatus.Platforms");

    // 创建一个包含传感器状态变化的平台数据
    const platformData = {
      platform: [
        {
          base: {
            name: TEST_PLATFORM.name,
            type: TEST_PLATFORM.type,
            side: "red",
            group: TEST_PLATFORM.group,
            broken: false,
            location: {
              longitude: 116.397428 + (Math.random() - 0.5) * 0.001, // 轻微位置变化
              latitude: 39.90923 + (Math.random() - 0.5) * 0.001,
              altitude: 150 + Math.random() * 50,
            },
            roll: Math.random() * 10 - 5,
            pitch: Math.random() * 10 - 5,
            yaw: Math.random() * 360,
            speed: 50 + Math.random() * 20,
          },
          updateTime: Date.now() / 1000, // 演习时间
          mover: {
            type: "Quadrotor",
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
          sensors: [
            {
              base: {
                name: "光电吊舱",
                type: "EOIR_CAMERA",
                isTurnedOn: Math.random() > 0.5, // 随机开关状态
                currentEl: Math.random() * 90 - 45, // 俯仰角
                currentAz: Math.random() * 360, // 方位角
              },
              mode: "搜索模式",
            },
            {
              base: {
                name: "激光测距仪",
                type: "LASER_RANGEFINDER",
                isTurnedOn: Math.random() > 0.3, // 随机开关状态
                currentEl: Math.random() * 90 - 45,
                currentAz: Math.random() * 360,
              },
              mode: "待机模式",
              laserCode: Math.floor(Math.random() * 9999) + 1000, // 随机激光编码
            },
          ],
          weapons: [
            {
              base: {
                name: "小型导弹",
                type: "MISSILE",
                isTurnedOn: true,
              },
              quantity: Math.floor(Math.random() * 4) + 1,
            },
          ],
          tracks: [
            // 随机生成一些跟踪目标
            ...(Math.random() > 0.6
              ? [
                  {
                    sensorName: "光电吊舱",
                    targetName: `目标-${Math.floor(Math.random() * 100) + 1}`,
                    targetType: "地面目标",
                  },
                ]
              : []),
          ],
        },
      ],
      // 添加环境参数
      evironment: {
        temperature: 20 + Math.random() * 15, // 20-35度
        windSpeed: Math.random() * 10, // 0-10 m/s
        windDirection: Math.random() * 360, // 风向角度
        cloudLowerAlt: Math.random() * 2000,
        cloudUpperAlt: 2000 + Math.random() * 3000,
        rainRate: Math.random() * 0.001, // 降水率 m/s
      },
    };

    return PlatformsMessage;
  } catch (error) {
    console.error("创建平台数据失败:", error);
    throw error;
  }
}

// 构建完整的组播数据包
function buildMulticastPacket(platformsMessage, platformData) {
  try {
    // 编码Protobuf数据
    const encodedData = platformsMessage.encode(platformData).finish();

    // 构建完整的数据包
    const packetHeader = Buffer.alloc(8);
    packetHeader[0] = 0xaa; // 包头1
    packetHeader[1] = 0x55; // 包头2
    packetHeader[2] = 0x01; // 版本号
    packetHeader[3] = 0x29; // 包类型 (PlatformStatus)

    // 数据长度 (小端序)
    const dataLength = encodedData.length;
    packetHeader.writeUInt32LE(dataLength, 4);

    // 组合数据包
    return Buffer.concat([packetHeader, encodedData]);
  } catch (error) {
    console.error("构建数据包失败:", error);
    throw error;
  }
}

// 发送测试数据
async function sendTestData() {
  console.log("🚀 开始连接状态更新诊断测试...\n");

  try {
    const platformsMessage = await createPlatformStatusData();
    const client = dgram.createSocket("udp4");

    // 多播地址和端口
    const MULTICAST_ADDR = "239.255.43.21";
    const MULTICAST_PORT = 10086;

    let sequence = 0;

    console.log(`📡 目标平台: ${TEST_PLATFORM.name} (${TEST_PLATFORM.group})`);
    console.log(`🔗 发送地址: ${MULTICAST_ADDR}:${MULTICAST_PORT}`);
    console.log("⏰ 开始发送实时状态更新...\n");

    // 定期发送数据包来模拟实时更新
    const interval = setInterval(async () => {
      try {
        sequence++;

        // 创建平台数据
        const platformData = {
          platform: [
            {
              base: {
                name: TEST_PLATFORM.name,
                type: TEST_PLATFORM.type,
                side: "red",
                group: TEST_PLATFORM.group,
                broken: false,
                location: {
                  longitude: 116.397428 + (Math.random() - 0.5) * 0.002,
                  latitude: 39.90923 + (Math.random() - 0.5) * 0.002,
                  altitude: 150 + Math.sin(sequence * 0.1) * 20, // 高度缓慢变化
                },
                roll: Math.sin(sequence * 0.2) * 5,
                pitch: Math.cos(sequence * 0.15) * 3,
                yaw: (sequence * 2) % 360,
                speed: 50 + Math.sin(sequence * 0.3) * 10,
              },
              updateTime: sequence, // 递增的演习时间
              sensors: [
                {
                  base: {
                    name: "光电吊舱",
                    type: "EOIR_CAMERA",
                    isTurnedOn: sequence % 10 < 7, // 周期性开关
                    currentEl: Math.sin(sequence * 0.1) * 45,
                    currentAz: (sequence * 5) % 360,
                  },
                  mode: sequence % 10 < 7 ? "搜索模式" : "待机模式",
                },
                {
                  base: {
                    name: "激光测距仪",
                    type: "LASER_RANGEFINDER",
                    isTurnedOn: sequence % 15 < 10, // 不同的周期
                    currentEl: Math.cos(sequence * 0.12) * 30,
                    currentAz: (sequence * 3) % 360,
                  },
                  mode: "测距模式",
                  laserCode: 1234 + (sequence % 100), // 激光编码变化
                },
              ],
              weapons: [
                {
                  base: {
                    name: "小型导弹",
                    type: "MISSILE",
                    isTurnedOn: true,
                  },
                  quantity: Math.max(1, 4 - Math.floor(sequence / 20)), // 弹药逐渐减少
                },
              ],
              tracks:
                sequence % 5 === 0
                  ? []
                  : [
                      {
                        sensorName: "光电吊舱",
                        targetName: `目标-${100 + (sequence % 5)}`,
                        targetType: "地面车辆",
                      },
                    ],
            },
          ],
          evironment: {
            temperature: 25 + Math.sin(sequence * 0.05) * 5, // 温度变化
            windSpeed: 3 + Math.random() * 2,
            windDirection: (sequence * 10) % 360,
            cloudLowerAlt: 1000 + Math.sin(sequence * 0.02) * 500,
            cloudUpperAlt: 3000 + Math.cos(sequence * 0.03) * 1000,
            rainRate: Math.max(0, Math.sin(sequence * 0.01) * 0.002),
          },
        };

        // 构建并发送数据包
        const packet = buildMulticastPacket(platformsMessage, platformData);

        client.send(packet, MULTICAST_PORT, MULTICAST_ADDR, (err) => {
          if (err) {
            console.error(`❌ 发送失败 #${sequence}:`, err.message);
          } else {
            console.log(`✅ #${sequence} - 平台状态已更新:`);
            console.log(
              `   位置: ${platformData.platform[0].base.location.longitude.toFixed(
                6
              )}, ${platformData.platform[0].base.location.latitude.toFixed(6)}`
            );
            console.log(
              `   姿态: 俯仰${platformData.platform[0].base.pitch.toFixed(
                1
              )}° 偏航${platformData.platform[0].base.yaw.toFixed(1)}°`
            );
            console.log(
              `   光电: ${
                platformData.platform[0].sensors[0].base.isTurnedOn
                  ? "开启"
                  : "关闭"
              } 激光: ${
                platformData.platform[0].sensors[1].base.isTurnedOn
                  ? "开启"
                  : "关闭"
              }`
            );
            console.log(
              `   环境: ${platformData.platform[0].evironment.temperature.toFixed(
                1
              )}°C 风速${platformData.platform[0].evironment.windSpeed.toFixed(
                1
              )}m/s`
            );
            console.log(`   目标: ${platformData.platform[0].tracks.length}个`);
            console.log("");
          }
        });
      } catch (error) {
        console.error(`❌ 发送数据包 #${sequence} 时出错:`, error.message);
      }
    }, 2000); // 每2秒发送一次，模拟实时更新

    // 10分钟后停止测试
    setTimeout(() => {
      clearInterval(interval);
      client.close();
      console.log("\n🏁 连接状态更新测试已结束");
      console.log("\n📋 测试总结:");
      console.log(`   总共发送: ${sequence} 个状态更新`);
      console.log(`   测试平台: ${TEST_PLATFORM.name}`);
      console.log("\n🔍 请检查操作页面是否实时显示了以下内容的变化:");
      console.log("   1. 平台位置和姿态");
      console.log("   2. 载荷开关状态 (光电/激光)");
      console.log("   3. 环境参数 (温度/风速)");
      console.log('   4. 数据源指示器 (应显示"实时数据")');
      console.log("   5. 目标跟踪信息");

      process.exit(0);
    }, 10 * 60 * 1000); // 10分钟
  } catch (error) {
    console.error("❌ 测试初始化失败:", error);
    process.exit(1);
  }
}

// 检查问题的诊断函数
function printDiagnosticInfo() {
  console.log("🔍 连接状态不更新问题诊断指南:\n");

  console.log("🚨 可能的问题原因:");
  console.log("1. 事件监听未正确绑定");
  console.log("   - 检查 window.electronAPI.multicast.onPacket 是否可用");
  console.log("   - 确认 handlePlatformStatus 函数被正确调用\n");

  console.log("2. 连接状态同步失败");
  console.log("   - connectedPlatform.value 可能未正确指向已连接平台");
  console.log("   - isConnected.value 状态可能不准确\n");

  console.log("3. 数据过滤或匹配问题");
  console.log("   - 平台名称不匹配导致数据被忽略");
  console.log("   - 平台类型识别错误\n");

  console.log("4. 载荷状态同步问题");
  console.log("   - 传感器 isTurnedOn 字段未正确解析");
  console.log("   - 开关状态未同步到界面组件\n");

  console.log("🛠️  调试建议:");
  console.log("1. 在浏览器开发者工具中检查console日志");
  console.log("2. 确认平台数据包正确解析 (packageType === 0x29)");
  console.log("3. 验证 connectedPlatformName.value 与收到的平台名称匹配");
  console.log("4. 检查 updatePlatformStatusDisplay 函数是否被调用");
  console.log("5. 确认数据源指示器逻辑正确\n");
}

// 主函数
async function main() {
  printDiagnosticInfo();

  console.log("🎯 即将开始发送测试数据...");
  console.log("请确保:");
  console.log("1. 应用程序正在运行");
  console.log("2. 已连接到目标平台 (无人机-001)");
  console.log("3. 开启了组播监听");
  console.log("\n按 Enter 继续...");

  // 等待用户确认
  process.stdin.once("data", () => {
    sendTestData();
  });
}

// 处理程序退出
process.on("SIGINT", () => {
  console.log("\n\n🛑 测试被用户中断");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ 未捕获的异常:", error);
  process.exit(1);
});

// 启动测试
main().catch((error) => {
  console.error("❌ 测试启动失败:", error);
  process.exit(1);
});
