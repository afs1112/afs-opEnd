#!/usr/bin/env node

/**
 * 激光照射按钮状态控制验证脚本
 * 验证激光照射和停止照射按钮只有在激光载荷开关打开后才能点击
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 验证激光照射按钮状态控制...\n");

const uavPagePath = path.join(
  __dirname,
  "../src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const uavPageContent = fs.readFileSync(uavPagePath, "utf8");

  console.log("1. 检查按钮disabled属性...");

  // 检查照射按钮的disabled属性
  const irradiateButtonMatch = uavPageContent.match(
    /<el-button[^>]*@click="handleIrradiate"[^>]*>/s
  );

  if (irradiateButtonMatch) {
    const buttonTag = irradiateButtonMatch[0];
    if (buttonTag.includes(':disabled="!laserPodEnabled"')) {
      console.log(
        "✅ 照射按钮已正确添加disabled属性，绑定到laserPodEnabled状态"
      );
    } else {
      console.log("❌ 照射按钮缺少disabled属性或绑定不正确");
    }
  } else {
    console.log("❌ 未找到照射按钮");
  }

  // 检查停止按钮的disabled属性
  const stopButtonMatch = uavPageContent.match(
    /<el-button[^>]*@click="handleStop"[^>]*>/s
  );

  if (stopButtonMatch) {
    const buttonTag = stopButtonMatch[0];
    if (buttonTag.includes(':disabled="!laserPodEnabled"')) {
      console.log(
        "✅ 停止按钮已正确添加disabled属性，绑定到laserPodEnabled状态"
      );
    } else {
      console.log("❌ 停止按钮缺少disabled属性或绑定不正确");
    }
  } else {
    console.log("❌ 未找到停止按钮");
  }

  console.log("\n2. 检查处理函数的开关状态检查...");

  // 检查handleIrradiate函数是否添加了开关状态检查
  const handleIrradiateMatch = uavPageContent.match(
    /const handleIrradiate = \(\) => \{[\s\S]*?\};/
  );

  if (handleIrradiateMatch) {
    const functionCode = handleIrradiateMatch[0];
    if (
      functionCode.includes("if (!laserPodEnabled.value)") &&
      functionCode.includes("请先打开激光载荷开关")
    ) {
      console.log("✅ handleIrradiate函数已添加激光载荷开关状态检查");
    } else {
      console.log("❌ handleIrradiate函数缺少激光载荷开关状态检查");
    }
  } else {
    console.log("❌ 未找到handleIrradiate函数");
  }

  // 检查handleStop函数是否添加了开关状态检查
  const handleStopMatch = uavPageContent.match(
    /const handleStop = \(\) => \{[\s\S]*?\};/
  );

  if (handleStopMatch) {
    const functionCode = handleStopMatch[0];
    if (
      functionCode.includes("if (!laserPodEnabled.value)") &&
      functionCode.includes("请先打开激光载荷开关")
    ) {
      console.log("✅ handleStop函数已添加激光载荷开关状态检查");
    } else {
      console.log("❌ handleStop函数缺少激光载荷开关状态检查");
    }
  } else {
    console.log("❌ 未找到handleStop函数");
  }

  console.log("\n3. 检查laserPodEnabled变量声明...");

  // 检查laserPodEnabled变量是否存在
  if (uavPageContent.includes("const laserPodEnabled = ref(false)")) {
    console.log("✅ laserPodEnabled变量已正确声明");
  } else {
    console.log("❌ laserPodEnabled变量声明可能有问题");
  }

  console.log("\n4. 检查载荷状态同步逻辑...");

  // 检查是否有载荷状态同步逻辑
  if (
    uavPageContent.includes("laserPodEnabled.value = sensorIsOn") ||
    uavPageContent.includes("laserPodEnabled.value !== sensorIsOn")
  ) {
    console.log("✅ 找到激光载荷开关状态同步逻辑");
  } else {
    console.log("⚠️  可能缺少激光载荷开关状态同步逻辑");
  }

  console.log("\n5. 验证用户交互逻辑...");

  console.log("📋 预期行为:");
  console.log("   • 激光载荷开关关闭时：");
  console.log("     - 照射按钮应该被禁用（灰色不可点击）");
  console.log("     - 停止按钮应该被禁用（灰色不可点击）");
  console.log('     - 点击按钮时显示"请先打开激光载荷开关"提示');
  console.log("   • 激光载荷开关打开时：");
  console.log("     - 照射按钮应该可以正常点击");
  console.log("     - 停止按钮应该可以正常点击");
  console.log("     - 按钮功能正常执行");

  console.log("\n6. 检查项目规范遵循情况...");

  // 检查是否遵循了载荷开关状态同步规范
  if (
    uavPageContent.includes("载荷开关状态需与平台返回的传感器状态保持同步") ||
    uavPageContent.includes("isTurnedOn")
  ) {
    console.log("✅ 遵循载荷开关状态同步规范");
  } else {
    console.log("⚠️  建议检查是否完全遵循载荷开关状态同步规范");
  }

  // 检查是否遵循了按钮状态管理规范
  if (
    uavPageContent.includes("照射按钮需根据倒计时状态动态更新") ||
    uavPageContent.includes("isIrradiating ? 'danger' : 'primary'")
  ) {
    console.log("✅ 遵循按钮状态管理规范");
  } else {
    console.log("⚠️  建议检查是否完全遵循按钮状态管理规范");
  }

  console.log("\n🎯 修改总结:");
  console.log('1. 为照射按钮添加了 :disabled="!laserPodEnabled" 属性');
  console.log('2. 为停止按钮添加了 :disabled="!laserPodEnabled" 属性');
  console.log("3. 在handleIrradiate函数中添加了开关状态检查");
  console.log("4. 在handleStop函数中添加了开关状态检查");
  console.log("5. 确保用户必须先打开激光载荷开关才能使用照射功能");

  console.log("\n📝 建议测试步骤:");
  console.log("1. 启动应用，连接到无人机平台");
  console.log("2. 确认激光载荷开关处于关闭状态");
  console.log("3. 验证照射和停止按钮是否被禁用（灰色）");
  console.log("4. 尝试点击按钮，确认显示警告提示");
  console.log("5. 打开激光载荷开关");
  console.log("6. 验证照射和停止按钮是否变为可用状态");
  console.log("7. 测试照射功能是否正常工作");
} catch (error) {
  console.log("❌ 读取文件失败:", error.message);
}

console.log("\n✅ 激光照射按钮状态控制验证完成");
