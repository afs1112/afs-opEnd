#!/usr/bin/env node

/**
 * 测试作战测评页面的目标摧毁状态检测功能
 *
 * 本测试脚本验证：
 * 1. 目标摧毁状态检测逻辑（参考无人机页面的处理方式）
 * 2. 目标状态的持久化显示（不直接清除，而是更新状态）
 * 3. 目标状态指示器的视觉效果
 */

const net = require("net");

// 测试配置
const MULTICAST_CONFIG = {
  host: "224.1.1.1",
  port: 20001,
};

// 模拟演习数据 - 包含多个分组和目标
let exerciseTimeCounter = 0;

// 创建基础平台数据结构
function createBasePlatform(id, name, type, side, group, coordinates) {
  return {
    base: {
      id: id,
      name: name,
      type: type,
      side: side,
      group: group,
      location: {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        altitude: coordinates.altitude,
      },
      broken: false,
    },
    tracks: [], // 用于目标跟踪数据
    sensors: [],
    weapons: [],
  };
}

// 第一阶段：正常演习状态 - 所有目标存在
function createNormalExerciseData() {
  exerciseTimeCounter += 30;

  return {
    packageType: 0x29, // 平台状态包
    parsedData: {
      platform: [
        // 第一组 - train_group
        createBasePlatform(1, "uav01-1a", "UAV01", "red", "train_group", {
          longitude: 116.397428 + Math.random() * 0.01,
          latitude: 39.90923 + Math.random() * 0.01,
          altitude: 1500,
        }),
        createBasePlatform(
          2,
          "phl_1",
          "ROCKET_LAUNCHER",
          "red",
          "train_group",
          {
            longitude: 116.397428 + Math.random() * 0.01,
            latitude: 39.90923 + Math.random() * 0.01,
            altitude: 50,
          }
        ),
        createBasePlatform(3, "enemy_tank_1", "TANK", "blue", "train_group", {
          longitude: 116.397428 + Math.random() * 0.01,
          latitude: 39.90923 + Math.random() * 0.01,
          altitude: 100,
        }),

        // 第二组 - attack_group
        createBasePlatform(4, "uav01-2a", "UAV01", "red", "attack_group", {
          longitude: 116.407428 + Math.random() * 0.01,
          latitude: 39.91923 + Math.random() * 0.01,
          altitude: 1800,
        }),
        createBasePlatform(
          5,
          "phl_2",
          "ROCKET_LAUNCHER",
          "red",
          "attack_group",
          {
            longitude: 116.407428 + Math.random() * 0.01,
            latitude: 39.91923 + Math.random() * 0.01,
            altitude: 60,
          }
        ),
        createBasePlatform(6, "enemy_ship_1", "SHIP", "blue", "attack_group", {
          longitude: 116.407428 + Math.random() * 0.01,
          latitude: 39.91923 + Math.random() * 0.01,
          altitude: 0,
        }),

        // 第三组 - defense_group
        createBasePlatform(7, "uav01-3a", "UAV01", "red", "defense_group", {
          longitude: 116.417428 + Math.random() * 0.01,
          latitude: 39.92923 + Math.random() * 0.01,
          altitude: 1600,
        }),
        createBasePlatform(
          8,
          "enemy_radar_1",
          "RADAR",
          "blue",
          "defense_group",
          {
            longitude: 116.417428 + Math.random() * 0.01,
            latitude: 39.92923 + Math.random() * 0.01,
            altitude: 200,
          }
        ),
      ],
      updateTime: exerciseTimeCounter,
    },
  };
}

// 第二阶段：部分目标被跟踪状态 - 模拟正常作战过程
function createTrackingPhaseData() {
  exerciseTimeCounter += 45;

  const platforms = [
    // 第一组 - train_group
    createBasePlatform(1, "uav01-1a", "UAV01", "red", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 1500,
    }),
    createBasePlatform(2, "phl_1", "ROCKET_LAUNCHER", "red", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 50,
    }),
    createBasePlatform(3, "enemy_tank_1", "TANK", "blue", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 100,
    }),

    // 第二组 - attack_group
    createBasePlatform(4, "uav01-2a", "UAV01", "red", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 1800,
    }),
    createBasePlatform(5, "phl_2", "ROCKET_LAUNCHER", "red", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 60,
    }),
    createBasePlatform(6, "enemy_ship_1", "SHIP", "blue", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 0,
    }),

    // 第三組 - defense_group
    createBasePlatform(7, "uav01-3a", "UAV01", "red", "defense_group", {
      longitude: 116.417428 + Math.random() * 0.01,
      latitude: 39.92923 + Math.random() * 0.01,
      altitude: 1600,
    }),
    createBasePlatform(8, "enemy_radar_1", "RADAR", "blue", "defense_group", {
      longitude: 116.417428 + Math.random() * 0.01,
      latitude: 39.92923 + Math.random() * 0.01,
      altitude: 200,
    }),
  ];

  // 添加跟踪数据 - 无人机正在跟踪目标
  platforms[0].tracks = [
    {
      targetName: "enemy_tank_1",
      targetType: "TANK",
      sensorName: "optical_sensor",
      status: "active",
    },
  ];

  platforms[3].tracks = [
    {
      targetName: "enemy_ship_1",
      targetType: "SHIP",
      sensorName: "optical_sensor",
      status: "active",
    },
  ];

  platforms[6].tracks = [
    {
      targetName: "enemy_radar_1",
      targetType: "RADAR",
      sensorName: "optical_sensor",
      status: "active",
    },
  ];

  return {
    packageType: 0x29,
    parsedData: {
      platform: platforms,
      updateTime: exerciseTimeCounter,
    },
  };
}

// 第三阶段：部分目标被摧毁 - 关键测试阶段
function createTargetDestroyedData() {
  exerciseTimeCounter += 60;

  const platforms = [
    // 第一组 - train_group (目标enemy_tank_1被摧毁，从平台数据中移除)
    createBasePlatform(1, "uav01-1a", "UAV01", "red", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 1500,
    }),
    createBasePlatform(2, "phl_1", "ROCKET_LAUNCHER", "red", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 50,
    }),
    // enemy_tank_1 被摧毁，不再出现在平台数据中

    // 第二组 - attack_group (目标正常)
    createBasePlatform(4, "uav01-2a", "UAV01", "red", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 1800,
    }),
    createBasePlatform(5, "phl_2", "ROCKET_LAUNCHER", "red", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 60,
    }),
    createBasePlatform(6, "enemy_ship_1", "SHIP", "blue", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 0,
    }),

    // 第三组 - defense_group (目标enemy_radar_1被摧毁，从平台数据中移除)
    createBasePlatform(7, "uav01-3a", "UAV01", "red", "defense_group", {
      longitude: 116.417428 + Math.random() * 0.01,
      latitude: 39.92923 + Math.random() * 0.01,
      altitude: 1600,
    }),
    // enemy_radar_1 被摧毁，不再出现在平台数据中
  ];

  // 更新跟踪数据 - 被摧毁的目标不再被跟踪
  platforms[3].tracks = [
    {
      targetName: "enemy_ship_1",
      targetType: "SHIP",
      sensorName: "optical_sensor",
      status: "active",
    },
  ];

  return {
    packageType: 0x29,
    parsedData: {
      platform: platforms,
      updateTime: exerciseTimeCounter,
    },
  };
}

// 第四阶段：继续演习 - 验证摧毁状态持久化
function createContinuedExerciseData() {
  exerciseTimeCounter += 30;

  const platforms = [
    // 第一组 - train_group (目标依然被摧毁)
    createBasePlatform(1, "uav01-1a", "UAV01", "red", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 1450,
    }),
    createBasePlatform(2, "phl_1", "ROCKET_LAUNCHER", "red", "train_group", {
      longitude: 116.397428 + Math.random() * 0.01,
      latitude: 39.90923 + Math.random() * 0.01,
      altitude: 55,
    }),

    // 第二组 - attack_group (目标正常)
    createBasePlatform(4, "uav01-2a", "UAV01", "red", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 1750,
    }),
    createBasePlatform(5, "phl_2", "ROCKET_LAUNCHER", "red", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 65,
    }),
    createBasePlatform(6, "enemy_ship_1", "SHIP", "blue", "attack_group", {
      longitude: 116.407428 + Math.random() * 0.01,
      latitude: 39.91923 + Math.random() * 0.01,
      altitude: 0,
    }),

    // 第三组 - defense_group (目标依然被摧毁)
    createBasePlatform(7, "uav01-3a", "UAV01", "red", "defense_group", {
      longitude: 116.417428 + Math.random() * 0.01,
      latitude: 39.92923 + Math.random() * 0.01,
      altitude: 1550,
    }),
  ];

  // 继续跟踪剩余目标
  platforms[3].tracks = [
    {
      targetName: "enemy_ship_1",
      targetType: "SHIP",
      sensorName: "optical_sensor",
      status: "active",
    },
  ];

  return {
    packageType: 0x29,
    parsedData: {
      platform: platforms,
      updateTime: exerciseTimeCounter,
    },
  };
}

// 发送协同指令测试数据
function createCooperationCommandData() {
  exerciseTimeCounter += 15;

  return {
    packageType: 0x2a, // 平台命令包
    parsedData: {
      commandID: Math.floor(Math.random() * 10000),
      platformName: "uav01-2a",
      command: 7, // 打击协同命令
      strikeCoordinateParam: {
        targetName: "enemy_ship_1",
        weaponName: "missile_1",
        coordinates: {
          longitude: 116.407428,
          latitude: 39.91923,
          altitude: 0,
        },
      },
    },
  };
}

// 包装数据为完整的数据包格式
function wrapPacketData(data) {
  return {
    type: "packet",
    source: "test_simulation",
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
async function runEvaluationTargetDestructionTest() {
  console.log("=".repeat(80));
  console.log("🎯 作战测评页面目标摧毁状态检测测试");
  console.log("=".repeat(80));
  console.log("本测试验证以下功能：");
  console.log("✅ 1. 目标摧毁状态检测逻辑（参考无人机页面）");
  console.log("✅ 2. 目标状态持久化显示（不直接清除）");
  console.log("✅ 3. 目标状态指示器视觉效果");
  console.log("✅ 4. 多分组目标状态管理");
  console.log("");

  try {
    // 阶段1: 正常演习状态
    console.log("📊 阶段1: 发送正常演习数据...");
    console.log("- 3个分组，每个分组包含红方平台和蓝方目标");
    console.log("- 所有目标状态正常");
    const normalData = wrapPacketData(createNormalExerciseData());
    await sendMulticastPacket(normalData);
    console.log(`✅ 已发送正常演习数据 (演习时间: T+${exerciseTimeCounter}秒)`);
    console.log("");

    // 等待2秒
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 阶段2: 目标跟踪阶段
    console.log("🎯 阶段2: 发送目标跟踪数据...");
    console.log("- 无人机开始跟踪各自的蓝方目标");
    console.log('- 目标状态应显示为"正常"');
    const trackingData = wrapPacketData(createTrackingPhaseData());
    await sendMulticastPacket(trackingData);
    console.log(`✅ 已发送跟踪阶段数据 (演习时间: T+${exerciseTimeCounter}秒)`);
    console.log("");

    // 等待3秒
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 阶段3: 目标摧毁阶段（关键测试）
    console.log("💥 阶段3: 发送目标摧毁数据（关键测试阶段）...");
    console.log("- enemy_tank_1 (train_group目标) 被摧毁，从平台数据中移除");
    console.log("- enemy_radar_1 (defense_group目标) 被摧毁，从平台数据中移除");
    console.log("- enemy_ship_1 (attack_group目标) 继续存在");
    console.log("");
    console.log("⚠️  预期结果:");
    console.log('   - train_group: 目标状态应显示为"已摧毁"（红色，带动画）');
    console.log('   - defense_group: 目标状态应显示为"已摧毁"（红色，带动画）');
    console.log('   - attack_group: 目标状态应显示为"正常"（绿色）');
    const destroyedData = wrapPacketData(createTargetDestroyedData());
    await sendMulticastPacket(destroyedData);
    console.log(`✅ 已发送摧毁阶段数据 (演习时间: T+${exerciseTimeCounter}秒)`);
    console.log("");

    // 等待5秒让用户观察效果
    console.log("⏳ 等待5秒，请观察作战测评页面中的目标状态变化...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 发送协同指令测试
    console.log("📡 发送协同指令测试...");
    const cooperationData = wrapPacketData(createCooperationCommandData());
    await sendMulticastPacket(cooperationData);
    console.log(`✅ 已发送协同指令 (演习时间: T+${exerciseTimeCounter}秒)`);
    console.log("");

    // 等待2秒
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 阶段4: 持续演习验证
    console.log("🔄 阶段4: 发送持续演习数据...");
    console.log("- 验证摧毁状态的持久化显示");
    console.log('- 被摧毁的目标应继续显示为"已摧毁"状态');
    const continuedData = wrapPacketData(createContinuedExerciseData());
    await sendMulticastPacket(continuedData);
    console.log(`✅ 已发送持续演习数据 (演习时间: T+${exerciseTimeCounter}秒)`);
    console.log("");

    console.log("🎉 目标摧毁状态检测测试完成！");
    console.log("");
    console.log("📋 测试验证要点：");
    console.log('1. ✅ 检查train_group的目标是否显示为"已摧毁"状态');
    console.log('2. ✅ 检查defense_group的目标是否显示为"已摧毁"状态');
    console.log('3. ✅ 检查attack_group的目标是否显示为"正常"状态');
    console.log("4. ✅ 验证摧毁状态的视觉效果（红色背景+动画）");
    console.log("5. ✅ 确认被摧毁的目标没有从界面中消失，而是持久化显示");
    console.log("6. ✅ 检查协同指令事件是否正确记录到对应分组");
    console.log("");
    console.log("💡 实现要点（参考无人机页面）：");
    console.log(
      "- checkMissionTargetStatus() 函数检测目标是否在平台数据中存在"
    );
    console.log('- 目标不存在时标记为"destroyed"状态而不是删除');
    console.log("- 使用视觉指示器显示不同的目标状态");
    console.log("- 状态变化触发动画效果提醒操作员");
  } catch (error) {
    console.error("❌ 测试过程中发生错误：", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  runEvaluationTargetDestructionTest()
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
  runEvaluationTargetDestructionTest,
  createNormalExerciseData,
  createTrackingPhaseData,
  createTargetDestroyedData,
  createContinuedExerciseData,
  wrapPacketData,
  sendMulticastPacket,
};
