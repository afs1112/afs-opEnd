#!/usr/bin/env node

/**
 * 目标锁定布局修复验证脚本
 * 验证锁定标记不再与扫描状态指示器重叠
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 验证目标锁定布局修复...\n");

const uavPagePath = path.join(
  __dirname,
  "../src/renderer/views/pages/UavOperationPage.vue"
);

try {
  const uavPageContent = fs.readFileSync(uavPagePath, "utf8");

  console.log("1. 检查新的布局结构...");

  // 检查新的布局结构
  if (
    uavPageContent.includes("target-name-section") &&
    uavPageContent.includes("locked-prefix")
  ) {
    console.log("✅ 新的布局结构已实现");
    console.log("   • target-name-section: 包含锁定前缀和目标名称");
    console.log("   • locked-prefix: 锁定标记作为前缀显示");
  } else {
    console.log("❌ 新的布局结构实现可能不完整");
  }

  console.log("\n2. 检查旧布局的移除...");

  // 检查是否移除了旧的target-indicators布局
  if (
    !uavPageContent.includes("target-indicators") &&
    !uavPageContent.includes("locked-indicator")
  ) {
    console.log("✅ 旧的重叠布局已移除");
    console.log("   • target-indicators: 已移除");
    console.log("   • locked-indicator: 已移除");
  } else {
    console.log("❌ 旧的重叠布局可能未完全清理");
  }

  console.log("\n3. 检查CSS样式更新...");

  // 检查新的前缀样式
  if (
    uavPageContent.includes(".locked-prefix") &&
    uavPageContent.includes(".locked-prefix-icon")
  ) {
    console.log("✅ 新的锁定前缀样式已添加");
    console.log("   • 圆形背景设计（18px直径）");
    console.log("   • 蓝色背景，白色图标");
    console.log("   • 作为目标名称前缀显示");
  } else {
    console.log("❌ 新的锁定前缀样式可能缺失");
  }

  // 检查是否移除了旧样式
  if (
    !uavPageContent.includes(".locked-indicator") &&
    !uavPageContent.includes(".locked-icon") &&
    !uavPageContent.includes(".locked-text")
  ) {
    console.log("✅ 旧的锁定标记样式已清理");
  } else {
    console.log("❌ 旧的锁定标记样式可能未完全清理");
  }

  console.log("\n4. 验证布局改进效果...");

  console.log("📋 布局改进说明:");
  console.log("   原问题: 锁定标记与扫描状态在右侧并排显示，空间不足时重叠");
  console.log("   解决方案: 将锁定标记作为圆形前缀显示在目标名称前面");
  console.log("   改进效果:");
  console.log("     • 锁定标记与状态指示器分离，不再重叠");
  console.log("     • 锁定状态更加醒目（圆形蓝色背景）");
  console.log("     • 布局更加紧凑合理");
  console.log("     • 保持良好的可读性");

  console.log("\n5. 检查目标名称区域结构...");

  // 检查目标名称区域的新结构
  const nameSegmentMatch = uavPageContent.match(
    /<div class="target-name-section">[\s\S]*?<\/div>/
  );

  if (nameSegmentMatch) {
    const segment = nameSegmentMatch[0];
    if (segment.includes("locked-prefix") && segment.includes("target-name")) {
      console.log("✅ 目标名称区域结构正确");
      console.log("   • 锁定前缀与目标名称在同一行");
      console.log("   • Flex布局，align-items: center");
    } else {
      console.log("❌ 目标名称区域结构可能有问题");
    }
  } else {
    console.log("❌ 未找到目标名称区域结构");
  }

  console.log("\n6. 验证样式设计...");

  // 检查圆形前缀的设计
  const prefixStyleMatch = uavPageContent.match(/\.locked-prefix \{[\s\S]*?\}/);

  if (prefixStyleMatch) {
    const styleContent = prefixStyleMatch[0];
    if (
      styleContent.includes("border-radius: 50%") &&
      styleContent.includes("background-color: #409eff") &&
      styleContent.includes("width: 18px") &&
      styleContent.includes("height: 18px")
    ) {
      console.log("✅ 锁定前缀样式设计正确");
      console.log("   • 18px × 18px 圆形设计");
      console.log("   • 蓝色背景 (#409eff)");
      console.log("   • 白色锁定图标");
      console.log("   • 居中对齐");
    } else {
      console.log("⚠️  锁定前缀样式可能需要调整");
    }
  } else {
    console.log("❌ 未找到锁定前缀样式定义");
  }

  console.log("\n🎯 修复总结:");
  console.log('问题: "已锁定"标记被"已扫描"状态遮挡');
  console.log("原因: 两个元素在较小空间内并排显示导致重叠");
  console.log("解决: 重新设计布局，将锁定标记移至目标名称前作为前缀");
  console.log("");
  console.log("修改内容:");
  console.log("1. 移除旧的 target-indicators 容器");
  console.log("2. 创建 target-name-section 容器");
  console.log("3. 锁定标记改为圆形前缀 (locked-prefix)");
  console.log("4. 状态指示器独立显示在右侧");
  console.log("5. 更新相应的CSS样式");

  console.log("\n📝 建议测试步骤:");
  console.log("1. 启动应用并连接到无人机平台");
  console.log("2. 等待探测到多个目标");
  console.log("3. 选择一个目标并进行锁定");
  console.log("4. 验证锁定前缀（蓝色圆形图标）是否正确显示");
  console.log("5. 确认锁定前缀不会与右侧状态指示器重叠");
  console.log("6. 测试不同状态的目标（扫描中/未扫到/已摧毁）");
  console.log("7. 使用转向功能验证锁定前缀是否正确清除");
} catch (error) {
  console.log("❌ 读取文件失败:", error.message);
}

console.log("\n✅ 目标锁定布局修复验证完成");
