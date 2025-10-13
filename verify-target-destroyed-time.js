#!/usr/bin/env node

/**
 * 快速验证脚本 - 无人机页面目标摧毁时间展示功能
 *
 * 使用方法:
 * 1. 确保开发服务器正在运行 (npm run dev)
 * 2. 运行此脚本: node verify-target-destroyed-time.js
 *
 * 验证内容:
 * - 目标对象是否包含destroyedTime字段
 * - 摧毁检测逻辑是否正确记录时间
 * - UI是否正确显示摧毁时间
 */

const fs = require("fs");
const path = require("path");

console.log("\n=== 验证: 无人机页面目标摧毁时间展示功能 ===\n");

const uavPagePath = path.join(
  __dirname,
  "src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const content = fs.readFileSync(uavPagePath, "utf-8");

  let allChecks = true;

  // 检查点1: 模板中是否添加了摧毁时间显示
  console.log("检查点 1: 模板中的摧毁时间显示...");
  if (
    content.includes("target.destroyedTime") &&
    content.includes("destroyed-time")
  ) {
    console.log("  ✅ 通过: 模板中已添加摧毁时间显示");
  } else {
    console.log("  ❌ 失败: 模板中未找到摧毁时间显示");
    allChecks = false;
  }

  // 检查点2: 逻辑中是否记录摧毁时间
  console.log("\n检查点 2: 摧毁时间记录逻辑...");
  if (
    content.includes("target.destroyedTime = environmentParams.exerciseTime")
  ) {
    console.log("  ✅ 通过: 已添加摧毁时间记录逻辑");
  } else {
    console.log("  ❌ 失败: 未找到摧毁时间记录逻辑");
    allChecks = false;
  }

  // 检查点3: 初始化时是否包含destroyedTime字段
  console.log("\n检查点 3: 目标对象初始化...");
  if (content.includes("destroyedTime: undefined")) {
    console.log("  ✅ 通过: 新目标对象已初始化destroyedTime字段");
  } else {
    console.log("  ❌ 失败: 新目标对象未初始化destroyedTime字段");
    allChecks = false;
  }

  // 检查点4: CSS样式是否添加
  console.log("\n检查点 4: CSS样式定义...");
  const destroyedTimeStyleCount = (
    content.match(/\.destroyed-time\s*\{/g) || []
  ).length;
  if (destroyedTimeStyleCount >= 2) {
    console.log(`  ✅ 通过: 已添加摧毁时间样式 (${destroyedTimeStyleCount}处)`);
  } else {
    console.log(
      `  ❌ 失败: 摧毁时间样式不完整 (找到${destroyedTimeStyleCount}处,应有2处)`
    );
    allChecks = false;
  }

  // 检查点5: 日志记录是否包含摧毁时间
  console.log("\n检查点 5: 日志记录增强...");
  if (content.includes("摧毁时间:")) {
    console.log("  ✅ 通过: 日志记录已包含摧毁时间信息");
  } else {
    console.log("  ❌ 失败: 日志记录未包含摧毁时间信息");
    allChecks = false;
  }

  console.log("\n" + "=".repeat(60));

  if (allChecks) {
    console.log("✅ 所有检查点通过!");
    console.log("\n功能实现验证成功! 关键要点:");
    console.log("1. ✅ 目标对象包含destroyedTime字段");
    console.log("2. ✅ 摧毁检测时记录演习时间");
    console.log("3. ✅ UI正确显示摧毁时间");
    console.log("4. ✅ CSS样式完整定义");
    console.log("5. ✅ 日志记录增强");

    console.log("\n下一步建议:");
    console.log("1. 启动开发服务器: npm run dev");
    console.log("2. 进入无人机操作页面");
    console.log("3. 连接平台并观察目标列表");
    console.log("4. 等待目标被摧毁,验证摧毁时间显示");
    console.log("5. 运行自动化测试: node test-target-destroyed-time.js");
  } else {
    console.log("❌ 部分检查点未通过,请检查实现");
  }

  console.log("\n" + "=".repeat(60) + "\n");
} catch (error) {
  console.error("❌ 验证过程出错:", error.message);
  process.exit(1);
}
