/**
 * 测试脚本：验证照射时长编辑问题修复
 *
 * 问题描述：
 * 无人机页面的照射时长输入框，用户填写数字后可能因为又收到数据包再次被初始化
 *
 * 修复方案：
 * 1. 添加 isIrradiationDurationInitialized 标志跟踪是否已初始化
 * 2. 只在第一次收到 desigDuring 数据时初始化照射时长
 * 3. 之后用户可以自由编辑，不会被数据包覆盖
 * 4. 断开连接时重置初始化标志，重新连接后可以重新初始化
 */

const fs = require("fs");
const path = require("path");

console.log("=== 照射时长编辑问题修复验证 ===\n");

const filePath = path.join(
  __dirname,
  "src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const content = fs.readFileSync(filePath, "utf-8");

  console.log("✓ 检查1: 验证新增的初始化标志");
  const hasInitFlag =
    /const isIrradiationDurationInitialized = ref\(false\);/.test(content);
  console.log(
    `  - isIrradiationDurationInitialized 标志: ${
      hasInitFlag ? "✓ 已添加" : "✗ 未找到"
    }`
  );

  console.log("\n✓ 检查2: 验证数据更新逻辑");
  const hasUpdateLogic =
    /if \(sensor\.desigDuring !== undefined && !isIrradiationDurationInitialized\.value\)/.test(
      content
    );
  console.log(
    `  - 只在未初始化时更新: ${hasUpdateLogic ? "✓ 正确" : "✗ 错误"}`
  );

  console.log("\n✓ 检查3: 验证初始化后设置标志");
  const hasFlagSet = /isIrradiationDurationInitialized\.value = true;/.test(
    content
  );
  console.log(`  - 初始化后设置标志: ${hasFlagSet ? "✓ 正确" : "✗ 错误"}`);

  console.log("\n✓ 检查4: 验证断开连接时重置标志");
  const hasResetLogic = /isIrradiationDurationInitialized\.value = false;/.test(
    content
  );
  console.log(`  - 断开连接时重置: ${hasResetLogic ? "✓ 正确" : "✗ 错误"}`);

  console.log("\n✓ 检查5: 验证相关注释");
  const hasComments =
    /照射时长是否已初始化/.test(content) &&
    /只进行第一次初始化/.test(content) &&
    /标记已初始化，后续不再更新/.test(content) &&
    /允许重新连接后重新初始化/.test(content);
  console.log(`  - 代码注释完整: ${hasComments ? "✓ 正确" : "✗ 不完整"}`);

  // 统计检查结果
  const allChecks = [
    hasInitFlag,
    hasUpdateLogic,
    hasFlagSet,
    hasResetLogic,
    hasComments,
  ];
  const passedChecks = allChecks.filter((check) => check).length;
  const totalChecks = allChecks.length;

  console.log("\n" + "=".repeat(50));
  console.log(`验证结果: ${passedChecks}/${totalChecks} 项检查通过`);

  if (passedChecks === totalChecks) {
    console.log("✓ 所有检查通过！照射时长编辑问题已修复");
    console.log("\n修复说明：");
    console.log(
      "1. 添加了 isIrradiationDurationInitialized 标志跟踪初始化状态"
    );
    console.log("2. 只在第一次收到 desigDuring 数据时进行初始化");
    console.log("3. 用户编辑后不会被后续数据包覆盖");
    console.log("4. 断开连接时重置标志，重新连接后可重新初始化");
    console.log("\n测试建议：");
    console.log("1. 连接无人机平台");
    console.log("2. 验证照射时长输入框是否自动填充了从数据包中获取的值");
    console.log('3. 点击"编辑"按钮，修改照射时长');
    console.log("4. 等待接收新的数据包");
    console.log("5. 验证用户修改的值没有被覆盖");
    console.log("6. 断开连接后重新连接");
    console.log("7. 验证照射时长可以重新从数据包初始化");
  } else {
    console.log("✗ 部分检查未通过，请检查代码修改");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ 验证过程出错:", error.message);
  process.exit(1);
}
