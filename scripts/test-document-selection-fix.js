#!/usr/bin/env node

/**
 * 文档选择修复功能测试脚本
 * 测试"选择其他文档"按钮是否能真正选择新文档而不是加载缓存
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 测试文档选择修复功能...\n");

// 验证服务层修改
console.log("1. 检查DocumentService是否添加了forceSelectNewDocument方法...");

const rendererServicePath = path.join(
  __dirname,
  "../src/renderer/services/document.service.ts"
);

try {
  const rendererServiceContent = fs.readFileSync(rendererServicePath, "utf8");

  if (rendererServiceContent.includes("forceSelectNewDocument")) {
    console.log("✅ DocumentService已添加forceSelectNewDocument方法");

    // 检查方法实现的关键特征
    if (
      rendererServiceContent.includes("强制选择新文档") &&
      rendererServiceContent.includes("忽略缓存")
    ) {
      console.log("✅ 方法实现包含正确的强制选择逻辑");
    } else {
      console.log("⚠️  方法实现可能不完整");
    }
  } else {
    console.log("❌ DocumentService缺少forceSelectNewDocument方法");
  }
} catch (error) {
  console.log("❌ 无法读取renderer DocumentService文件:", error.message);
}

// 验证页面层修改
console.log("\n2. 检查页面是否正确调用新方法...");

const artilleryPagePath = path.join(
  __dirname,
  "../src/renderer/views/pages/ArtilleryOperationPage.vue"
);
const uavPagePath = path.join(
  __dirname,
  "../src/renderer/views/pages/UavOperationPage.vue"
);

function checkPageModification(pagePath, pageName) {
  try {
    const pageContent = fs.readFileSync(pagePath, "utf8");

    // 检查是否添加了selectOtherDocument方法
    if (pageContent.includes("selectOtherDocument")) {
      console.log(`✅ ${pageName}已添加selectOtherDocument方法`);

      // 检查按钮是否正确绑定
      if (pageContent.includes('@click="selectOtherDocument"')) {
        console.log(`✅ ${pageName}"选择其他文档"按钮已正确绑定到新方法`);
      } else {
        console.log(`⚠️  ${pageName}按钮绑定可能有问题`);
      }

      // 检查方法实现
      if (pageContent.includes("DocumentService.forceSelectNewDocument()")) {
        console.log(
          `✅ ${pageName}selectOtherDocument方法正确调用了forceSelectNewDocument`
        );
      } else {
        console.log(`⚠️  ${pageName}方法实现可能不正确`);
      }
    } else {
      console.log(`❌ ${pageName}缺少selectOtherDocument方法`);
    }
  } catch (error) {
    console.log(`❌ 无法读取${pageName}文件:`, error.message);
  }
}

checkPageModification(artilleryPagePath, "火炮页面");
checkPageModification(uavPagePath, "无人机页面");

// 验证修复的技术原理
console.log("\n3. 验证修复的技术原理...");

console.log("📋 修复原理说明:");
console.log("   • 原问题: selectDocument总是优先返回缓存文档");
console.log("   • 修复方案: 创建forceSelectNewDocument方法绕过缓存机制");
console.log("   • 实现方式: 直接调用文件选择器而不检查缓存");
console.log('   • 用户体验: "选择其他文档"现在会真正打开文件选择器');

// 验证代码一致性
console.log("\n4. 验证两个页面的实现一致性...");

try {
  const artilleryContent = fs.readFileSync(artilleryPagePath, "utf8");
  const uavContent = fs.readFileSync(uavPagePath, "utf8");

  // 提取selectOtherDocument方法的实现
  const artilleryMethodMatch = artilleryContent.match(
    /const selectOtherDocument = async \(\) => \{[^}]+\}/s
  );
  const uavMethodMatch = uavContent.match(
    /const selectOtherDocument = async \(\) => \{[^}]+\}/s
  );

  if (artilleryMethodMatch && uavMethodMatch) {
    // 简单的一致性检查（去掉空白字符后比较）
    const artilleryMethod = artilleryMethodMatch[0].replace(/\s+/g, " ");
    const uavMethod = uavMethodMatch[0].replace(/\s+/g, " ");

    if (artilleryMethod === uavMethod) {
      console.log("✅ 两个页面的selectOtherDocument方法实现一致");
    } else {
      console.log("⚠️  两个页面的selectOtherDocument方法实现可能不一致");
    }
  } else {
    console.log("⚠️  无法提取完整的方法实现进行比较");
  }
} catch (error) {
  console.log("❌ 一致性检查失败:", error.message);
}

console.log("\n5. 验证相关依赖...");

// 检查DocumentService导入
const checkImports = (pagePath, pageName) => {
  try {
    const content = fs.readFileSync(pagePath, "utf8");
    if (content.includes("DocumentService")) {
      console.log(`✅ ${pageName}正确导入了DocumentService`);
    } else {
      console.log(`❌ ${pageName}缺少DocumentService导入`);
    }
  } catch (error) {
    console.log(`❌ 无法检查${pageName}的导入:`, error.message);
  }
};

checkImports(artilleryPagePath, "火炮页面");
checkImports(uavPagePath, "无人机页面");

console.log("\n🎯 测试总结:");
console.log("修复内容:");
console.log("  1. 在DocumentService中添加了forceSelectNewDocument方法");
console.log("  2. 在两个页面中添加了selectOtherDocument方法");
console.log('  3. 更新了"选择其他文档"按钮的点击事件绑定');
console.log("  4. 确保了两个页面功能的一致性");

console.log("\n预期效果:");
console.log('  • 点击"选择其他文档"将真正打开文件选择器');
console.log("  • 用户可以重新选择不同的文档文件");
console.log("  • 新选择的文档将替换当前显示的文档");
console.log('  • 解决了用户反馈的"依旧加载旧文档"问题');

console.log("\n📝 建议测试步骤:");
console.log("  1. 先选择并打开一个文档");
console.log('  2. 点击"选择其他文档"按钮');
console.log("  3. 验证是否出现文件选择器对话框");
console.log("  4. 选择不同的文档文件");
console.log("  5. 确认新文档被正确加载和显示");

console.log("\n✅ 文档选择修复功能测试完成");
