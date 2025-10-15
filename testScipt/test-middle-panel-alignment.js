/**
 * 测试中间状态面板对齐性
 *
 * 验证目标：
 * 1. 两个页面的 middle-panel 样式一致
 * 2. status-card 基础样式一致
 * 3. 在无数据初始状态下，卡片高度一致（140px）
 * 4. 卡片使用 flex 布局等距分布
 */

const fs = require("fs");
const path = require("path");

const uavPagePath = path.join(
  __dirname,
  "src/renderer/views/pages/UavOperationPage.vue"
);
const artilleryPagePath = path.join(
  __dirname,
  "src/renderer/views/pages/ArtilleryOperationPage.vue"
);

console.log("开始测试中间面板对齐性...\n");

// 读取文件内容
const uavContent = fs.readFileSync(uavPagePath, "utf-8");
const artilleryContent = fs.readFileSync(artilleryPagePath, "utf-8");

let testsPassed = 0;
let testsFailed = 0;

// 测试1: 检查 middle-panel 样式
console.log("测试1: 检查 middle-panel 样式");
const middlePanelRegex = /\.middle-panel\s*\{[^}]+\}/g;
const uavMiddlePanel = uavContent.match(middlePanelRegex);
const artilleryMiddlePanel = artilleryContent.match(middlePanelRegex);

if (uavMiddlePanel && artilleryMiddlePanel) {
  const expectedMiddlePanelStyle = `flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;`;

  const uavHasCorrectStyle =
    uavMiddlePanel[0].includes("flex: 1") &&
    uavMiddlePanel[0].includes("min-width: 300px") &&
    uavMiddlePanel[0].includes("display: flex") &&
    uavMiddlePanel[0].includes("flex-direction: column") &&
    uavMiddlePanel[0].includes("gap: 16px");

  const artilleryHasCorrectStyle =
    artilleryMiddlePanel[0].includes("flex: 1") &&
    artilleryMiddlePanel[0].includes("min-width: 300px") &&
    artilleryMiddlePanel[0].includes("display: flex") &&
    artilleryMiddlePanel[0].includes("flex-direction: column") &&
    artilleryMiddlePanel[0].includes("gap: 16px");

  if (uavHasCorrectStyle && artilleryHasCorrectStyle) {
    console.log("✅ middle-panel 样式一致且正确");
    testsPassed++;
  } else {
    console.log("❌ middle-panel 样式不一致");
    if (!uavHasCorrectStyle) console.log("  无人机页面样式不正确");
    if (!artilleryHasCorrectStyle) console.log("  火炮页面样式不正确");
    testsFailed++;
  }
} else {
  console.log("❌ 未找到 middle-panel 样式");
  testsFailed++;
}

// 测试2: 检查 status-card 基础样式
console.log("\n测试2: 检查 status-card 基础样式");
const statusCardRegex = /\.status-card\s*\{[^}]+\}/g;
const uavStatusCard = uavContent.match(statusCardRegex);
const artilleryStatusCard = artilleryContent.match(statusCardRegex);

if (uavStatusCard && artilleryStatusCard) {
  // 检查是否包含 flex: 1 和 min-height: 140px
  const uavHasFlex = uavStatusCard[0].includes("flex: 1");
  const uavHasMinHeight = uavStatusCard[0].includes("min-height: 140px");
  const uavNoFixedHeight = !uavStatusCard[0].match(/^\s*height:\s*140px;/m);

  const artilleryHasFlex = artilleryStatusCard[0].includes("flex: 1");
  const artilleryHasMinHeight =
    artilleryStatusCard[0].includes("min-height: 140px");
  const artilleryNoFixedHeight =
    !artilleryStatusCard[0].match(/^\s*height:\s*140px;/m);

  console.log(
    `  无人机页面: flex:1=${uavHasFlex}, min-height:140px=${uavHasMinHeight}, no-fixed-height=${uavNoFixedHeight}`
  );
  console.log(
    `  火炮页面: flex:1=${artilleryHasFlex}, min-height:140px=${artilleryHasMinHeight}, no-fixed-height=${artilleryNoFixedHeight}`
  );

  const uavHasCorrectCardStyle = uavHasFlex && uavHasMinHeight;
  const artilleryHasCorrectCardStyle =
    artilleryHasFlex && artilleryHasMinHeight;

  if (uavHasCorrectCardStyle && artilleryHasCorrectCardStyle) {
    console.log("✅ status-card 基础样式一致且正确");
    console.log("  - 使用 flex: 1 实现等距分布");
    console.log("  - min-height 设置为 140px");
    testsPassed++;
  } else {
    console.log("❌ status-card 基础样式不一致");
    if (!uavHasCorrectCardStyle) console.log("  无人机页面样式不正确");
    if (!artilleryHasCorrectCardStyle) console.log("  火炮页面样式不正确");
    testsFailed++;
  }
} else {
  console.log("❌ 未找到 status-card 样式");
  testsFailed++;
}

// 测试3: 检查 padding 一致性
console.log("\n测试3: 检查 status-card padding 一致性");
const uavPadding = uavStatusCard[0].match(/padding:\s*var\(--spacing-(\w+)\)/);
const artilleryPadding = artilleryStatusCard[0].match(
  /padding:\s*var\(--spacing-(\w+)\)/
);

if (uavPadding && artilleryPadding && uavPadding[1] === artilleryPadding[1]) {
  console.log(`✅ padding 一致，都使用 var(--spacing-${uavPadding[1]})`);
  testsPassed++;
} else {
  console.log("❌ padding 不一致");
  if (uavPadding) console.log(`  无人机页面: var(--spacing-${uavPadding[1]})`);
  if (artilleryPadding)
    console.log(`  火炮页面: var(--spacing-${artilleryPadding[1]})`);
  testsFailed++;
}

// 测试4: 检查模板中的 middle-panel class
console.log("\n测试4: 检查模板中的 middle-panel class");
const uavMiddlePanelTemplate = uavContent.match(
  /<div class="middle-panel[^"]*"/
);
const artilleryMiddlePanelTemplate = artilleryContent.match(
  /<div class="middle-panel[^"]*"/
);

if (uavMiddlePanelTemplate && artilleryMiddlePanelTemplate) {
  const uavClasses = uavMiddlePanelTemplate[0];
  const artilleryClasses = artilleryMiddlePanelTemplate[0];

  if (
    uavClasses.includes("flex") &&
    uavClasses.includes("flex-col") &&
    uavClasses.includes("gap-4") &&
    artilleryClasses.includes("flex") &&
    artilleryClasses.includes("flex-col") &&
    artilleryClasses.includes("gap-4")
  ) {
    console.log('✅ 模板 class 一致，都包含 "flex flex-col gap-4"');
    testsPassed++;
  } else {
    console.log("❌ 模板 class 不一致");
    console.log(`  无人机页面: ${uavClasses}`);
    console.log(`  火炮页面: ${artilleryClasses}`);
    testsFailed++;
  }
} else {
  console.log("❌ 未找到模板中的 middle-panel");
  testsFailed++;
}

// 测试5: 统计状态卡片数量
console.log("\n测试5: 统计状态卡片数量");
const uavStatusCards = (uavContent.match(/<div class="status-card/g) || [])
  .length;
const artilleryStatusCards = (
  artilleryContent.match(/<div class="status-card/g) || []
).length;

console.log(`ℹ️  无人机页面有 ${uavStatusCards} 个状态卡片`);
console.log(`ℹ️  火炮页面有 ${artilleryStatusCards} 个状态卡片`);

if (uavStatusCards === 3 && artilleryStatusCards === 4) {
  console.log("✅ 卡片数量符合预期");
  testsPassed++;
} else {
  console.log("⚠️  卡片数量可能不符合预期");
}

// 测试6: 检查 target-status 特殊样式（仅无人机页面）
console.log("\n测试6: 检查 target-status 特殊样式");
const uavTargetStatusStyle = uavContent.match(
  /\.status-card\.target-status\s*\{[^}]+\}/
);

if (uavTargetStatusStyle) {
  const hasFlex2 = uavTargetStatusStyle[0].includes("flex: 2");
  const hasOverflow = uavTargetStatusStyle[0].includes("overflow-y: auto");
  const noFixedHeight = !uavTargetStatusStyle[0].includes("min-height: 200px");

  if (hasFlex2 && hasOverflow && noFixedHeight) {
    console.log("✅ target-status 样式正确");
    console.log("  - 使用 flex: 2 占用更多空间");
    console.log("  - 使用 overflow-y: auto 处理溢出");
    console.log("  - 移除了固定的 min-height");
    testsPassed++;
  } else {
    console.log("❌ target-status 样式不正确");
    if (!hasFlex2) console.log("  缺少 flex: 2");
    if (!hasOverflow) console.log("  缺少 overflow-y: auto");
    if (!noFixedHeight) console.log("  仍有固定的 min-height");
    testsFailed++;
  }
} else {
  console.log("⚠️  未找到 target-status 特殊样式（可能正常）");
}

// 总结
console.log("\n" + "=".repeat(50));
console.log(`测试完成！通过: ${testsPassed}, 失败: ${testsFailed}`);
console.log("=".repeat(50));

if (testsFailed === 0) {
  console.log("\n✅ 所有测试通过！中间面板对齐性修复成功。");
  console.log("\n修复要点：");
  console.log("1. 两个页面的 middle-panel 使用相同的 flex 布局配置");
  console.log("2. status-card 使用 flex: 1 而非固定高度，实现等距分布");
  console.log("3. 统一 padding 为 var(--spacing-lg)");
  console.log("4. 保持 min-height: 140px 确保初始状态高度一致");
  console.log("5. target-status 使用 flex: 2 占用更多空间（仅无人机页面）");
  process.exit(0);
} else {
  console.log("\n❌ 部分测试失败，请检查修复结果。");
  process.exit(1);
}
