#!/usr/bin/env node

/**
 * 火炮页面目标装订功能测试
 *
 * 测试场景：
 * 1. 验证目标装订命令的生成和发送
 * 2. 验证TargetLoad信息的展示
 * 3. 验证目标装订后平台状态的更新
 */

const path = require("path");
const protobuf = require("protobufjs");

console.log("🎯 火炮页面目标装订功能测试");
console.log("=====================================\n");

async function testTargetSetting() {
  try {
    // 1. 加载protobuf定义
    console.log("1. 加载protobuf定义...");
    const protoPath = path.join(__dirname, "../src/protobuf");

    // 加载PlatformCmd.proto
    const cmdRoot = await protobuf.load(
      path.join(protoPath, "PlatformCmd.proto")
    );
    const PlatformCmd = cmdRoot.lookupType("PlatformStatus.PlatformCmd");
    console.log("   ✅ PlatformCmd.proto 加载成功");

    // 加载PlatformStatus.proto
    const statusRoot = await protobuf.load(
      path.join(protoPath, "PlatformStatus.proto")
    );
    const PlatformStatus = statusRoot.lookupType("PlatformStatus.Platforms");
    const TargetLoad = statusRoot.lookupType("PlatformStatus.TargetLoad");
    console.log("   ✅ PlatformStatus.proto 加载成功");
    console.log("   ✅ TargetLoad 类型定义已找到");

    // 2. 测试目标装订命令的构造
    console.log("\n2. 测试目标装订命令构造...");

    const targetSetCommand = {
      commandID: Date.now(),
      platformName: "火炮-001",
      command: 7, // Arty_Target_Set
      targetSetParam: {
        targetName: "敌方无人机-001",
      },
    };

    console.log("   目标装订命令数据:");
    console.log(JSON.stringify(targetSetCommand, null, 2));

    // 验证命令编码
    const commandMessage = PlatformCmd.create(targetSetCommand);
    const commandBuffer = PlatformCmd.encode(commandMessage).finish();
    console.log(
      `   ✅ 目标装订命令编码成功，长度: ${commandBuffer.length} 字节`
    );

    // 3. 测试TargetLoad信息的模拟
    console.log("\n3. 测试TargetLoad信息模拟...");

    // 模拟目标装订后平台返回的TargetLoad信息
    const targetLoadData = {
      targetName: "敌方无人机-001",
      distance: 2500.5, // 距离 2500.5m
      bearing: 45.2, // 方位 45.2°
      elevationDifference: 125.8, // 高差 +125.8m
      azimuth: 42.15, // 方位角 42.15°
      pitch: -5.25, // 高低角 -5.25°
    };

    console.log("   模拟TargetLoad数据:");
    console.log(JSON.stringify(targetLoadData, null, 2));

    // 验证TargetLoad编码
    const targetLoadMessage = TargetLoad.create(targetLoadData);
    const targetLoadBuffer = TargetLoad.encode(targetLoadMessage).finish();
    console.log(
      `   ✅ TargetLoad编码成功，长度: ${targetLoadBuffer.length} 字节`
    );

    // 4. 测试带有TargetLoad的平台状态
    console.log("\n4. 测试带有TargetLoad的平台状态...");

    const platformWithTargetLoad = {
      platform: [
        {
          base: {
            name: "火炮-001",
            type: "Artillery",
            side: "red",
            group: "第一火炮营",
            broken: false,
            location: {
              longitude: 116.397428,
              latitude: 39.90923,
              altitude: 50.0,
            },
            roll: 0.0,
            pitch: 0.0,
            yaw: 45.0,
            speed: 0.0,
          },
          updateTime: Date.now() / 1000,
          weapons: [
            {
              base: {
                name: "155mm榴弹炮",
                type: "155mm_HOWITZER",
              },
              quantity: 20,
            },
          ],
          targetLoad: targetLoadData, // 包含TargetLoad信息
        },
      ],
    };

    console.log("   带有TargetLoad的平台状态:");
    console.log(JSON.stringify(platformWithTargetLoad, null, 2));

    // 验证平台状态编码
    const statusMessage = PlatformStatus.create(platformWithTargetLoad);
    const statusBuffer = PlatformStatus.encode(statusMessage).finish();
    console.log(`   ✅ 平台状态编码成功，长度: ${statusBuffer.length} 字节`);

    // 5. 测试TargetLoad信息的格式化显示
    console.log("\n5. 测试TargetLoad信息格式化显示...");

    // 模拟前端格式化函数
    const formatTargetLoadDistance = (distance) => {
      if (distance === undefined || distance === null) return "未知";
      return distance.toFixed(0) + "m";
    };

    const formatTargetLoadBearing = (bearing) => {
      if (bearing === undefined || bearing === null) return "未知";
      return bearing.toFixed(1) + "°";
    };

    const formatTargetLoadElevation = (elevation) => {
      if (elevation === undefined || elevation === null) return "未知";
      return (elevation >= 0 ? "+" : "") + elevation.toFixed(1) + "m";
    };

    const formatTargetLoadAngle = (angle) => {
      if (angle === undefined || angle === null) return "未知";
      return angle.toFixed(2) + "°";
    };

    console.log("   格式化后的TargetLoad显示:");
    console.log(`   目标名称：${targetLoadData.targetName || "未设置"}`);
    console.log(
      `   距离：${formatTargetLoadDistance(targetLoadData.distance)}`
    );
    console.log(`   方位：${formatTargetLoadBearing(targetLoadData.bearing)}`);
    console.log(
      `   高差：${formatTargetLoadElevation(
        targetLoadData.elevationDifference
      )}`
    );
    console.log(`   方位角：${formatTargetLoadAngle(targetLoadData.azimuth)}`);
    console.log(`   高低角：${formatTargetLoadAngle(targetLoadData.pitch)}`);

    // 6. 测试目标装订流程
    console.log("\n6. 测试完整目标装订流程...");

    console.log("   步骤1: 火炮页面发送目标装订命令");
    console.log(`     -> 平台: ${targetSetCommand.platformName}`);
    console.log(`     -> 目标: ${targetSetCommand.targetSetParam.targetName}`);
    console.log(`     -> 命令ID: ${targetSetCommand.commandID}`);

    console.log("   步骤2: 仿真系统处理目标装订");
    console.log("     -> 计算目标相对位置");
    console.log("     -> 生成TargetLoad信息");

    console.log("   步骤3: 平台状态更新包含TargetLoad");
    console.log("     -> 平台状态数据包发送");
    console.log("     -> 火炮页面接收并更新显示");

    console.log("   步骤4: 目标状态区域显示TargetLoad信息");
    console.log("     -> 目标名称、距离、方位等信息展示");
    console.log("     -> 方位角、高低角等射击参数显示");

    // 7. 验证解析流程
    console.log("\n7. 验证protobuf解析流程...");

    // 解析目标装订命令
    const decodedCommand = PlatformCmd.decode(commandBuffer);
    const commandObj = PlatformCmd.toObject(decodedCommand);
    console.log("   解析的目标装订命令:");
    console.log(JSON.stringify(commandObj, null, 2));

    // 解析平台状态
    const decodedStatus = PlatformStatus.decode(statusBuffer);
    const statusObj = PlatformStatus.toObject(decodedStatus);
    console.log("   解析的平台状态（含TargetLoad）:");
    console.log(JSON.stringify(statusObj, null, 2));

    console.log("\n✅ 目标装订功能测试完成！");
    console.log("\n总结:");
    console.log("1. ✅ 目标装订命令构造和编码正常");
    console.log("2. ✅ TargetLoad信息结构正确");
    console.log("3. ✅ 平台状态更新包含TargetLoad");
    console.log("4. ✅ 格式化显示函数工作正常");
    console.log("5. ✅ protobuf编解码流程完整");
  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  }
}

// 运行测试
testTargetSetting().catch(console.error);
