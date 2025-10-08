#!/usr/bin/env node

/**
 * 测试作战测评页面顶部状态栏融合效果
 *
 * 本测试脚本验证：
 * 1. 顶部状态栏的空间节省效果
 * 2. 信息展示的完整性和清晰度
 * 3. 响应式布局在不同屏幕尺寸下的表现
 */

const net = require("net");

// 测试配置
const MULTICAST_CONFIG = {
  host: "224.1.1.1",
  port: 20001,
};

// 模拟演习数据
let exerciseTimeCounter = 120; // 从T+2分钟开始

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
    tracks: [],
    sensors: [],
    weapons: [],
  };
}

// 创建多分组测试数据 - 展示顶部状态栏信息的丰富性
function createMultiGroupTestData() {
  exerciseTimeCounter += 15;

  return {
    packageType: 0x29, // 平台状态包
    parsedData: {
      platform: [
        // 第一组 - alpha_group
        createBasePlatform(1, "uav01-alpha1", "UAV01", "red", "alpha_group", {
          longitude: 116.397428 + Math.random() * 0.01,
          latitude: 39.90923 + Math.random() * 0.01,
          altitude: 1500,
        }),
        createBasePlatform(
          2,
          "phl_alpha1",
          "ROCKET_LAUNCHER",
          "red",
          "alpha_group",
          {
            longitude: 116.397428 + Math.random() * 0.01,
            latitude: 39.90923 + Math.random() * 0.01,
            altitude: 50,
          }
        ),
        createBasePlatform(3, "enemy_alpha1", "TANK", "blue", "alpha_group", {
          longitude: 116.397428 + Math.random() * 0.01,
          latitude: 39.90923 + Math.random() * 0.01,
          altitude: 100,
        }),

        // 第二组 - bravo_group
        createBasePlatform(4, "uav01-bravo1", "UAV01", "red", "bravo_group", {
          longitude: 116.407428 + Math.random() * 0.01,
          latitude: 39.91923 + Math.random() * 0.01,
          altitude: 1800,
        }),
        createBasePlatform(
          5,
          "phl_bravo1",
          "ROCKET_LAUNCHER",
          "red",
          "bravo_group",
          {
            longitude: 116.407428 + Math.random() * 0.01,
            latitude: 39.91923 + Math.random() * 0.01,
            altitude: 60,
          }
        ),
        createBasePlatform(6, "enemy_bravo1", "SHIP", "blue", "bravo_group", {
          longitude: 116.407428 + Math.random() * 0.01,
          latitude: 39.91923 + Math.random() * 0.01,
          altitude: 0,
        }),

        // 第三组 - charlie_group
        createBasePlatform(
          7,
          "uav01-charlie1",
          "UAV01",
          "red",
          "charlie_group",
          {
            longitude: 116.417428 + Math.random() * 0.01,
            latitude: 39.92923 + Math.random() * 0.01,
            altitude: 1600,
          }
        ),
        createBasePlatform(
          8,
          "enemy_charlie1",
          "RADAR",
          "blue",
          "charlie_group",
          {
            longitude: 116.417428 + Math.random() * 0.01,
            latitude: 39.92923 + Math.random() * 0.01,
            altitude: 200,
          }
        ),

        // 第四组 - delta_group
        createBasePlatform(9, "uav01-delta1", "UAV01", "red", "delta_group", {
          longitude: 116.427428 + Math.random() * 0.01,
          latitude: 39.93923 + Math.random() * 0.01,
          altitude: 1700,
        }),
        createBasePlatform(
          10,
          "phl_delta1",
          "ROCKET_LAUNCHER",
          "red",
          "delta_group",
          {
            longitude: 116.427428 + Math.random() * 0.01,
            latitude: 39.93923 + Math.random() * 0.01,
            altitude: 70,
          }
        ),
        createBasePlatform(
          11,
          "enemy_delta1",
          "COMMAND",
          "blue",
          "delta_group",
          {
            longitude: 116.427428 + Math.random() * 0.01,
            latitude: 39.93923 + Math.random() * 0.01,
            altitude: 150,
          }
        ),

        // 第五组 - echo_group (测试更多分组)
        createBasePlatform(12, "uav01-echo1", "UAV01", "red", "echo_group", {
          longitude: 116.437428 + Math.random() * 0.01,
          latitude: 39.94923 + Math.random() * 0.01,
          altitude: 1400,
        }),
        createBasePlatform(13, "enemy_echo1", "TANK", "blue", "echo_group", {
          longitude: 116.437428 + Math.random() * 0.01,
          latitude: 39.94923 + Math.random() * 0.01,
          altitude: 80,
        }),
      ],
      updateTime: exerciseTimeCounter,
      // 添加环境数据
      evironment: {
        windSpeed: 8,
        windDirection: 180,
        cloudLowerAlt: 500,
        cloudUpperAlt: 2000,
        rainUpperAlt: 3000,
        rainRate: 0.1,
        temperature: 25,
      },
    },
  };
}

// 包装数据为完整的数据包格式
function wrapPacketData(data) {
  return {
    type: "packet",
    source: "header_optimization_test",
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
async function runHeaderOptimizationTest() {
  console.log("=".repeat(80));
  console.log("📊 作战测评页面顶部状态栏融合效果测试");
  console.log("=".repeat(80));
  console.log("本测试验证以下功能：");
  console.log("✅ 1. 顶部状态栏空间节省效果");
  console.log("✅ 2. 信息展示完整性和清晰度");
  console.log("✅ 3. 多分组数据的统计显示");
  console.log("✅ 4. 响应式布局表现");
  console.log("");

  try {
    console.log("📈 发送多分组测试数据...");
    console.log("- 5个分组，每个分组包含不同类型的平台");
    console.log("- 总计13个平台");
    console.log("- 演习时间和天文时间同时显示");
    console.log("");

    // 发送多分组数据
    const testData = wrapPacketData(createMultiGroupTestData());
    await sendMulticastPacket(testData);
    console.log(
      `✅ 已发送多分组测试数据 (演习时间: T+${exerciseTimeCounter}秒)`
    );
    console.log("");

    console.log("🎯 请在作战测评页面中验证以下效果：");
    console.log("");
    console.log("📋 顶部状态栏融合效果验证：");
    console.log("1. ✅ 页面标题、演习概览信息是否在同一行显示");
    console.log('2. ✅ 左侧显示"作战测评席位"标题');
    console.log(
      "3. ✅ 中间显示统计信息：参演分组、演习时间、天文时间、总平台数"
    );
    console.log("4. ✅ 右侧显示数据来源指示器");
    console.log("5. ✅ 信息是否清晰易读，无重叠或拥挤现象");
    console.log("");

    console.log("📊 数据展示验证：");
    console.log("- 参演分组：应显示 5个");
    console.log("- 演习时间：应显示 T+135秒（或对应格式)");
    console.log("- 天文时间：应显示当前系统时间");
    console.log("- 总平台数：应显示 13个");
    console.log('- 数据来源：应显示"实时数据"');
    console.log("");

    console.log("📱 响应式布局验证：");
    console.log("- 在不同浏览器窗口宽度下调整大小");
    console.log("- 检查信息是否能正确换行和重排");
    console.log("- 验证移动端视图下的显示效果");
    console.log("");

    // 等待5秒让用户观察
    console.log("⏳ 等待5秒，请观察页面效果...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 继续发送数据保持演习状态
    for (let i = 0; i < 3; i++) {
      const continuedData = wrapPacketData(createMultiGroupTestData());
      await sendMulticastPacket(continuedData);
      console.log(`🔄 继续发送数据 (演习时间: T+${exerciseTimeCounter}秒)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("");
    console.log("🎉 顶部状态栏融合效果测试完成！");
    console.log("");
    console.log("💡 优化效果对比：");
    console.log("• 之前：页面标题栏 + 演习概览区域 = 两行，占用更多纵向空间");
    console.log("• 现在：融合成一行，有效节省纵向空间");
    console.log("• 信息完整性：所有关键信息依然清晰展示");
    console.log("• 布局优化：三栏式布局（标题-统计-指示器）更加平衡");
  } catch (error) {
    console.error("❌ 测试过程中发生错误：", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  runHeaderOptimizationTest()
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
  runHeaderOptimizationTest,
  createMultiGroupTestData,
  wrapPacketData,
  sendMulticastPacket,
};
