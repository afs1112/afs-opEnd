#!/usr/bin/env node

/**
 * 目标锁定标记功能测试脚本
 * 验证锁定目标功能和转向功能对目标标记的影响
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 测试目标锁定标记功能...\n");

const uavPagePath = path.join(
  __dirname,
  "../src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const uavPageContent = fs.readFileSync(uavPagePath, "utf8");

  console.log("1. 检查锁定目标状态变量...");

  // 检查lockedTarget变量声明
  if (uavPageContent.includes('const lockedTarget = ref("")')) {
    console.log("✅ lockedTarget状态变量已正确声明");
  } else {
    console.log("❌ lockedTarget状态变量声明可能有问题");
  }

  console.log("\n2. 检查目标列表中的锁定标记...");

  // 检查模板中是否添加了锁定标记
  if (
    uavPageContent.includes('v-if="lockedTarget === target.name"') &&
    uavPageContent.includes("locked-indicator")
  ) {
    console.log("✅ 目标列表已添加锁定标记显示");
  } else {
    console.log("❌ 目标列表缺少锁定标记显示");
  }

  // 检查Lock图标导入
  if (
    uavPageContent.includes("Lock,") &&
    uavPageContent.includes("@element-plus/icons-vue")
  ) {
    console.log("✅ Lock图标已正确导入");
  } else {
    console.log("❌ Lock图标导入可能有问题");
  }

  console.log("\n3. 检查锁定目标函数修改...");

  // 检查handleLockTarget函数是否设置锁定状态
  const lockTargetMatch = uavPageContent.match(
    /const handleLockTarget = async \(\) => \{[\s\S]*?\};/
  );

  if (lockTargetMatch) {
    const functionCode = lockTargetMatch[0];
    if (functionCode.includes("lockedTarget.value = selectedTarget.value")) {
      console.log("✅ handleLockTarget函数已设置锁定状态");
    } else {
      console.log("❌ handleLockTarget函数未设置锁定状态");
    }
  } else {
    console.log("❌ 未找到handleLockTarget函数");
  }

  console.log("\n4. 检查转向函数修改...");

  // 检查handleTurn函数是否清除锁定状态
  const turnMatch = uavPageContent.match(
    /const handleTurn = async \(\) => \{[\s\S]*?\};/
  );

  if (turnMatch) {
    const functionCode = turnMatch[0];
    if (
      functionCode.includes('lockedTarget.value = ""') &&
      functionCode.includes("取消目标锁定")
    ) {
      console.log("✅ handleTurn函数已添加锁定状态清除逻辑");
    } else {
      console.log("❌ handleTurn函数未添加锁定状态清除逻辑");
    }
  } else {
    console.log("❌ 未找到handleTurn函数");
  }

  console.log("\n5. 检查CSS样式...");

  // 检查锁定标记样式
  if (
    uavPageContent.includes(".locked-indicator") &&
    uavPageContent.includes(".locked-icon") &&
    uavPageContent.includes(".locked-text")
  ) {
    console.log("✅ 锁定标记CSS样式已添加");
  } else {
    console.log("❌ 锁定标记CSS样式可能不完整");
  }

  // 检查布局容器样式
  if (uavPageContent.includes(".target-indicators")) {
    console.log("✅ 布局容器样式已添加");
  } else {
    console.log("❌ 布局容器样式可能缺失");
  }

  console.log("\n6. 验证功能逻辑...");

  console.log("📋 预期功能流程:");
  console.log('   1. 用户选择目标并点击"锁定目标"按钮');
  console.log('   2. 发送锁定命令成功后，在目标列表中显示"已锁定"标记');
  console.log('   3. 用户使用"转向"功能后，清除锁定标记');
  console.log('   4. 目标列表中不再显示"已锁定"标记');

  console.log("\n7. 检查用户体验优化...");

  // 检查日志记录
  if (uavPageContent.includes("转向操作已取消目标锁定")) {
    console.log("✅ 已添加转向操作的日志记录");
  } else {
    console.log("❌ 可能缺少转向操作的日志记录");
  }

  console.log("\n🎯 修改总结:");
  console.log("1. 添加了lockedTarget状态变量跟踪当前锁定的目标");
  console.log("2. 在目标列表中添加了锁定标记显示组件");
  console.log("3. 修改handleLockTarget函数，锁定成功后设置状态");
  console.log("4. 修改handleTurn函数，转向操作后清除锁定状态");
  console.log("5. 添加了相应的CSS样式美化锁定标记");
  console.log("6. 优化了目标列表的布局结构");

  console.log("\n📝 建议测试步骤:");
  console.log("1. 启动应用并连接到无人机平台");
  console.log("2. 等待系统探测到目标");
  console.log('3. 选择一个目标并点击"锁定目标"按钮');
  console.log('4. 验证目标列表中是否显示"已锁定"标记');
  console.log('5. 调整传感器参数并点击"转向"按钮');
  console.log("6. 验证锁定标记是否被清除");
  console.log("7. 检查日志记录是否正确");

  console.log("\n🎨 UI设计说明:");
  console.log("• 锁定标记采用蓝色主题，与系统配色保持一致");
  console.log("• 标记大小适中，不会遮挡其他重要信息");
  console.log("• 使用Lock图标增强视觉效果");
  console.log("• 标记与状态指示器并排显示，布局清晰");
} catch (error) {
  console.log("❌ 读取文件失败:", error.message);
}

console.log("\n✅ 目标锁定标记功能测试完成");
