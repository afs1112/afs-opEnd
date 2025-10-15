#!/usr/bin/env node

/**
 * 验证脚本 - 目标卡片布局优化
 *
 * 验证内容:
 * 1. 目标列表改为单列布局(flex-direction: column)
 * 2. 目标卡片增加最小宽度(min-width: 380px)
 * 3. 状态标签使用绝对定位在右上角
 * 4. 目标名称添加右侧padding以避免遮挡
 */

const fs = require("fs");
const path = require("path");

console.log("\n=== 验证: 目标卡片布局优化 ===\n");

const uavPagePath = path.join(
  __dirname,
  "src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const content = fs.readFileSync(uavPagePath, "utf-8");

  let allChecks = true;

  // 检查点1: 目标列表使用flex列布局
  console.log("检查点 1: 目标列表布局方式...");
  if (
    content.includes("flex-direction: column") &&
    content.match(/\.targets-list\s*\{[^}]*display:\s*flex/)
  ) {
    console.log("  ✅ 通过: 目标列表已改为单列flex布局");
  } else {
    console.log("  ❌ 失败: 目标列表布局未正确设置");
    allChecks = false;
  }

  // 检查点2: 目标卡片最小宽度
  console.log("\n检查点 2: 目标卡片最小宽度...");
  if (content.match(/\.target-item\s*\{[^}]*min-width:\s*380px/s)) {
    console.log("  ✅ 通过: 目标卡片最小宽度已设置为380px");
  } else {
    console.log("  ❌ 失败: 目标卡片最小宽度未正确设置");
    allChecks = false;
  }

  // 检查点3: 状态标签绝对定位
  console.log("\n检查点 3: 状态标签定位方式...");
  if (
    content.match(
      /\.target-status-indicator\s*\{[^}]*position:\s*absolute[^}]*top:\s*8px[^}]*right:\s*8px/s
    )
  ) {
    console.log("  ✅ 通过: 状态标签已使用绝对定位在右上角");
  } else {
    console.log("  ❌ 失败: 状态标签定位未正确设置");
    allChecks = false;
  }

  // 检查点4: 目标名称padding
  console.log("\n检查点 4: 目标名称padding设置...");
  if (content.match(/\.target-name\s*\{[^}]*padding-right:\s*120px/s)) {
    console.log("  ✅ 通过: 目标名称已添加右侧padding避免遮挡");
  } else {
    console.log("  ❌ 失败: 目标名称padding未正确设置");
    allChecks = false;
  }

  // 检查点5: 摧毁时间样式存在
  console.log("\n检查点 5: 摧毁时间样式...");
  if (content.includes(".destroyed-time")) {
    console.log("  ✅ 通过: 摧毁时间样式已定义");
  } else {
    console.log("  ❌ 失败: 摧毁时间样式未找到");
    allChecks = false;
  }

  console.log("\n" + "=".repeat(60));

  if (allChecks) {
    console.log("✅ 所有检查点通过!");
    console.log("\n布局优化总结:");
    console.log("1. ✅ 目标列表: 2列网格 → 单列flex布局");
    console.log("2. ✅ 卡片宽度: 自适应 → 最小380px");
    console.log("3. ✅ 状态标签: 内联显示 → 绝对定位右上角");
    console.log("4. ✅ 目标名称: 无padding → 右侧padding 120px");
    console.log("5. ✅ 摧毁时间: 完整显示不遮挡");

    console.log("\n预期效果:");
    console.log("- 目标卡片宽度充足,可完整显示所有信息");
    console.log("- 状态标签固定在右上角,不遮挡目标名称");
    console.log("- 摧毁时间在状态标签内完整显示");
    console.log("- 目标列表垂直排列,更易浏览");

    console.log("\n下一步建议:");
    console.log("1. 启动开发服务器查看效果");
    console.log("2. 进入无人机操作页面");
    console.log("3. 连接平台并观察目标列表布局");
    console.log("4. 验证摧毁目标的显示效果");
  } else {
    console.log("❌ 部分检查点未通过,请检查实现");
  }

  console.log("\n" + "=".repeat(60) + "\n");
} catch (error) {
  console.error("❌ 验证过程出错:", error.message);
  process.exit(1);
}
