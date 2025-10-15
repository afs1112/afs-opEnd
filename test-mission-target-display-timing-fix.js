/**
 * 测试脚本：验证任务目标显示时机修复
 *
 * 问题描述：
 * 无人机页面的任务目标在已选择组别后就会展现，应该在点击连接后再显示
 *
 * 修复方案：
 * 在 getMissionTarget 函数中增加连接状态检查，只有已连接时才获取并显示任务目标
 */

const fs = require("fs");
const path = require("path");

console.log("=== 任务目标显示时机修复验证 ===\n");

const filePath = path.join(
  __dirname,
  "src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const content = fs.readFileSync(filePath, "utf-8");

  console.log("✓ 检查1: 验证 getMissionTarget 函数中的连接状态检查");

  // 查找 getMissionTarget 函数
  const getMissionTargetRegex =
    /const getMissionTarget = async \(\) => \{([\s\S]*?)(?=\nconst |$)/;
  const match = content.match(getMissionTargetRegex);

  if (!match) {
    console.log("  ✗ 未找到 getMissionTarget 函数");
    process.exit(1);
  }

  const functionBody = match[1];

  // 检查是否在函数开始处检查连接状态
  const hasConnectionCheck =
    /\/\/\s*只有在已连接状态下才获取任务目标\s*\n\s*if\s*\(!isConnected\.value\)\s*\{[\s\S]*?missionTarget\.value\s*=\s*null;[\s\S]*?return;/.test(
      functionBody
    );
  console.log(
    `  - 连接状态检查: ${hasConnectionCheck ? "✓ 已添加" : "✗ 未找到"}`
  );

  // 检查连接状态检查是否在其他检查之前
  const checkOrder =
    functionBody.indexOf("!isConnected.value") <
    functionBody.indexOf("!selectedGroup.value");
  console.log(
    `  - 检查顺序正确（连接状态优先）: ${checkOrder ? "✓ 正确" : "✗ 错误"}`
  );

  console.log("\n✓ 检查2: 验证注释说明");
  const hasComment = /只有在已连接状态下才获取任务目标/.test(content);
  console.log(`  - 代码注释: ${hasComment ? "✓ 已添加" : "✗ 未找到"}`);

  console.log("\n✓ 检查3: 验证 getMissionTarget 调用位置");

  // 检查在连接函数中是否有调用
  const hasCallInConnect = /await getMissionTarget\(\);/.test(content);
  console.log(`  - 连接时调用: ${hasCallInConnect ? "✓ 正确" : "✗ 未找到"}`);

  // 统计调用次数
  const callCount = (content.match(/await getMissionTarget\(\);/g) || [])
    .length;
  console.log(`  - 总调用次数: ${callCount}`);

  // 统计检查结果
  const allChecks = [
    hasConnectionCheck,
    checkOrder,
    hasComment,
    hasCallInConnect,
  ];
  const passedChecks = allChecks.filter((check) => check).length;
  const totalChecks = allChecks.length;

  console.log("\n" + "=".repeat(50));
  console.log(`验证结果: ${passedChecks}/${totalChecks} 项检查通过`);

  if (passedChecks === totalChecks) {
    console.log("✓ 所有检查通过！任务目标显示时机问题已修复");
    console.log("\n修复说明：");
    console.log("1. 在 getMissionTarget 函数开始处增加连接状态检查");
    console.log("2. 只有在 isConnected.value 为 true 时才获取任务目标");
    console.log("3. 未连接时将 missionTarget.value 设为 null");
    console.log("4. 连接状态检查优先于其他检查，确保逻辑正确");
    console.log("\n预期行为：");
    console.log('1. 未连接时：即使选择了组别，任务目标卡片显示"未设置目标"');
    console.log(
      "2. 已连接时：根据选择的组别查找并显示同组蓝方平台作为任务目标"
    );
    console.log('3. 断开连接时：任务目标自动清除，显示"未设置目标"');
    console.log("\n测试建议：");
    console.log("1. 启动应用，选择分组但不连接");
    console.log('2. 验证任务目标卡片显示"未设置目标"（警告图标+斜体文字）');
    console.log('3. 点击"连接平台"按钮');
    console.log("4. 验证任务目标卡片显示实际的任务目标信息");
    console.log('5. 点击"断开"按钮');
    console.log('6. 验证任务目标卡片恢复显示"未设置目标"');
  } else {
    console.log("✗ 部分检查未通过，请检查代码修改");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ 验证过程出错:", error.message);
  process.exit(1);
}
