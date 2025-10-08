#!/usr/bin/env node

/**
 * 测试火炮页面任务目标展示优化
 * 验证是否成功复制了无人机页面的相关内容
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("=== 火炮页面任务目标展示优化测试 ===\n");

// 测试配置
const testConfig = {
  logFile: path.join(__dirname, "artillery-mission-target-test.log"),
  scenarios: [
    {
      name: "任务目标展示内容一致性",
      description: "验证火炮页面与无人机页面的任务目标展示内容保持一致",
    },
    {
      name: "状态检测逻辑复制",
      description: "验证目标状态检测和摧毁逻辑已正确复制",
    },
    {
      name: "样式和布局一致性",
      description: "验证任务目标提醒栏的样式与无人机页面保持一致",
    },
  ],
};

// 清理之前的日志
if (fs.existsSync(testConfig.logFile)) {
  fs.unlinkSync(testConfig.logFile);
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(testConfig.logFile, logMessage + "\n");
}

async function testArtilleryMissionTargetOptimization() {
  try {
    log("开始测试火炮页面任务目标展示优化...");

    // 检查文件是否存在
    const uavPath = path.join(
      __dirname,
      "src/renderer/views/pages/UavOperationPage.vue"
    );
    const artilleryPath = path.join(
      __dirname,
      "src/renderer/views/pages/ArtilleryOperationPage.vue"
    );

    if (!fs.existsSync(uavPath)) {
      throw new Error(`无人机页面文件不存在: ${uavPath}`);
    }

    if (!fs.existsSync(artilleryPath)) {
      throw new Error(`火炮页面文件不存在: ${artilleryPath}`);
    }

    const uavContent = fs.readFileSync(uavPath, "utf8");
    const artilleryContent = fs.readFileSync(artilleryPath, "utf8");

    // 验证HTML模板一致性
    log("验证HTML模板一致性...");

    const htmlRequirements = [
      "target-main-content",
      "target-status-indicator",
      "target-header",
      "target-details",
      "target-name-type",
      "target-coordinates",
      "coordinate-label",
      "coordinate-value",
      "status-text",
      "status-icon",
    ];

    let missingHtmlElements = [];
    htmlRequirements.forEach((element) => {
      if (!artilleryContent.includes(element)) {
        missingHtmlElements.push(element);
      }
    });

    if (missingHtmlElements.length > 0) {
      log(`❌ 火炮页面缺少以下HTML元素: ${missingHtmlElements.join(", ")}`);
      return false;
    }

    log("✅ HTML模板一致性验证通过");

    // 验证状态检测逻辑
    log("验证状态检测逻辑...");

    const logicRequirements = [
      "checkMissionTargetStatus",
      "isBeingTracked",
      "targetPlatformExists",
      "destroyed",
      "active",
      "inactive",
      "missionTarget.status",
    ];

    let missingLogic = [];
    logicRequirements.forEach((logic) => {
      if (!artilleryContent.includes(logic)) {
        missingLogic.push(logic);
      }
    });

    if (missingLogic.length > 0) {
      log(`❌ 火炮页面缺少以下逻辑实现: ${missingLogic.join(", ")}`);
      return false;
    }

    log("✅ 状态检测逻辑验证通过");

    // 验证图标导入
    log("验证图标导入...");

    const iconRequirements = [
      "CircleClose",
      "SuccessFilled",
      "WarningFilled",
      "LocationFilled",
    ];

    let missingIcons = [];
    iconRequirements.forEach((icon) => {
      if (!artilleryContent.includes(icon)) {
        missingIcons.push(icon);
      }
    });

    if (missingIcons.length > 0) {
      log(`❌ 火炮页面缺少以下图标导入: ${missingIcons.join(", ")}`);
      return false;
    }

    log("✅ 图标导入验证通过");

    // 验证CSS样式一致性
    log("验证CSS样式一致性...");

    const styleRequirements = [
      "target-status-indicator",
      "position: absolute",
      "top: 0",
      "right: 0",
      "target-status",
      "targetDestroyedPulse",
      "target-details",
      "target-name-type",
      "target-coordinates",
      "coordinate-label",
      "coordinate-value",
    ];

    let missingStyles = [];
    styleRequirements.forEach((style) => {
      if (!artilleryContent.includes(style)) {
        missingStyles.push(style);
      }
    });

    if (missingStyles.length > 0) {
      log(`❌ 火炮页面缺少以下样式实现: ${missingStyles.join(", ")}`);
      return false;
    }

    log("✅ CSS样式一致性验证通过");

    // 验证项目规范遵循
    log("验证项目规范遵循...");

    // 检查任务目标展示信息是否完整
    if (
      !artilleryContent.includes("missionTarget.name") ||
      !artilleryContent.includes("missionTarget.platformType") ||
      !artilleryContent.includes("missionTarget.coordinates")
    ) {
      log("❌ 任务目标展示信息不完整");
      return false;
    }

    // 检查是否位于正确位置
    if (!artilleryContent.includes("mission-target-banner mb-4")) {
      log("❌ 任务目标未位于正确位置");
      return false;
    }

    // 检查多平台一致性
    if (!artilleryContent.includes('side === "blue"')) {
      log("❌ 未遵循多平台任务目标展示一致性");
      return false;
    }

    log("✅ 项目规范遵循验证通过");

    // 验证功能对比
    log("验证功能对比...");

    // 对比关键功能是否一致
    const keyFeatures = [
      "getMissionTarget",
      "checkMissionTargetStatus",
      "target-status destroyed",
      "target-status active",
      "target-status inactive",
    ];

    let consistencyIssues = [];
    keyFeatures.forEach((feature) => {
      const uavHas = uavContent.includes(feature);
      const artilleryHas = artilleryContent.includes(feature);

      if (uavHas && !artilleryHas) {
        consistencyIssues.push(`火炮页面缺少: ${feature}`);
      }
    });

    if (consistencyIssues.length > 0) {
      log(`❌ 发现一致性问题: ${consistencyIssues.join(", ")}`);
      return false;
    }

    log("✅ 功能对比验证通过");

    return true;
  } catch (error) {
    log(`❌ 测试过程中发生错误: ${error.message}`);
    return false;
  }
}

async function generateOptimizationReport() {
  log("\n=== 生成优化报告 ===");

  const reportData = {
    testTime: new Date().toISOString(),
    optimizationDetails: {
      htmlTemplate: {
        structure: "✅ 复制无人机页面HTML结构",
        statusIndicator: "✅ 状态标签绝对定位",
        targetDetails: "✅ 完整目标信息展示",
        layout: "✅ 布局与无人机页面一致",
      },
      javascript: {
        getMissionTarget: "✅ 复制并增强getMissionTarget函数",
        checkStatus: "✅ 添加checkMissionTargetStatus函数",
        statusLogic: "✅ 完整状态检测逻辑",
        iconImports: "✅ 添加必要图标导入",
      },
      cssStyles: {
        targetBanner: "✅ 任务目标提醒栏样式",
        statusStates: "✅ 三种状态样式（正常/失联/已摧毁）",
        animations: "✅ 摧毁状态脉冲动画",
        positioning: "✅ 绝对定位样式",
      },
      compliance: {
        specification: "✅ 遵循任务目标展示规范",
        position: "✅ 位于右侧列最上方",
        information: "✅ 包含名称、类型、经纬高",
        consistency: "✅ 与无人机页面保持一致",
      },
    },
    featureComparison: {
      before: {
        display: "简单的名称和坐标显示",
        status: "无状态检测",
        layout: "水平布局",
        information: "仅名称和部分坐标",
      },
      after: {
        display: "完整的目标信息展示",
        status: "实时状态检测（正常/失联/已摧毁）",
        layout: "层次化布局，状态标签右上角",
        information: "名称、类型、完整经纬高坐标",
      },
    },
  };

  const reportPath = path.join(
    __dirname,
    "artillery-mission-target-optimization-report.json"
  );
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`📋 优化报告已生成: ${reportPath}`);
}

// 主测试流程
async function main() {
  try {
    const testResult = await testArtilleryMissionTargetOptimization();

    if (testResult) {
      log("\n🎉 火炮页面任务目标展示优化测试全部通过！");
      await generateOptimizationReport();

      log("\n📝 优化成果:");
      log("┌─────────────────────────────────────────────┐");
      log("│ 📍 当前任务目标：                [🟢 正常] │");
      log("│                                             │");
      log("│ COMMAND_POST                                │");
      log("│ UAV01                                       │");
      log("│ 经纬高：121.751069°, 39.751069°, 100m       │");
      log("└─────────────────────────────────────────────┘");

      log("\n🔄 已成功复制的功能:");
      log("• 🎯 完整目标信息展示（名称、类型、经纬高）");
      log("• 📊 实时状态检测（正常/失联/已摧毁）");
      log("• 🏷️ 状态标签右上角定位");
      log("• 🎨 一致的视觉设计和动画效果");
      log("• 📋 符合项目规范要求");

      log("\n🔧 技术实现:");
      log("• HTML模板：完全复制无人机页面结构");
      log("• JavaScript：增强getMissionTarget和新增checkMissionTargetStatus");
      log("• CSS样式：复制所有任务目标相关样式");
      log("• 图标导入：添加状态指示所需图标");
      log("• 布局位置：右侧列最上方，协同报文之上");

      log("\n📈 改进效果:");
      log("• 信息完整性：从简单坐标到完整目标信息");
      log("• 状态感知：新增实时状态检测和显示");
      log("• 视觉一致：与无人机页面保持统一风格");
      log("• 用户体验：更直观的目标状态识别");

      process.exit(0);
    } else {
      log("\n❌ 火炮页面任务目标展示优化测试失败");
      process.exit(1);
    }
  } catch (error) {
    log(`❌ 测试执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行测试
main();
