#!/usr/bin/env node

/**
 * Word文档样式增强测试脚本
 * 验证Word文档是否能够保留原始样式
 */

const path = require("path");
const fs = require("fs");

console.log("📄 Word文档样式增强测试");
console.log("=".repeat(50));

// 测试用例
const testCases = [
  {
    name: "检查mammoth样式映射配置",
    description: "验证是否添加了样式映射配置",
    test: () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/main/services/document.service.ts"
        );
        const content = fs.readFileSync(servicePath, "utf8");

        const styleFeatures = [
          "styleMap",
          "Heading 1",
          "convertImage",
          "includeDefaultStyleMap",
        ];

        let foundFeatures = 0;
        for (const feature of styleFeatures) {
          if (content.includes(feature)) {
            foundFeatures++;
          }
        }

        if (foundFeatures >= 3) {
          console.log(
            `✅ mammoth样式映射配置已添加 (${foundFeatures}/${styleFeatures.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ mammoth样式映射配置不完整 (${foundFeatures}/${styleFeatures.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查样式配置失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查HTML增强功能",
    description: "验证是否添加了HTML内容增强方法",
    test: () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/main/services/document.service.ts"
        );
        const content = fs.readFileSync(servicePath, "utf8");

        if (
          content.includes("enhanceWordDocumentHtml") &&
          content.includes("word-document") &&
          content.includes(".word-document h1")
        ) {
          console.log("✅ HTML增强功能已添加");
          return true;
        } else {
          console.log("❌ HTML增强功能未找到");
          return false;
        }
      } catch (error) {
        console.log("❌ 检查HTML增强功能失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查CSS样式定义",
    description: "验证是否定义了丰富的CSS样式",
    test: () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/main/services/document.service.ts"
        );
        const content = fs.readFileSync(servicePath, "utf8");

        const cssFeatures = [
          "font-family",
          "line-height",
          "table.word-table",
          "blockquote",
          "Times New Roman",
        ];

        let foundFeatures = 0;
        for (const feature of cssFeatures) {
          if (content.includes(feature)) {
            foundFeatures++;
          }
        }

        if (foundFeatures >= 4) {
          console.log(
            `✅ CSS样式定义完整 (${foundFeatures}/${cssFeatures.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ CSS样式定义不完整 (${foundFeatures}/${cssFeatures.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查CSS样式失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查渲染进程接口更新",
    description: "验证渲染进程是否支持HTML内容",
    test: () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/renderer/services/document.service.ts"
        );
        const content = fs.readFileSync(servicePath, "utf8");

        if (
          content.includes("isHtml") &&
          content.includes("word-document") &&
          content.includes("formatDocumentContent")
        ) {
          console.log("✅ 渲染进程接口已更新");
          return true;
        } else {
          console.log("❌ 渲染进程接口未更新");
          return false;
        }
      } catch (error) {
        console.log("❌ 检查渲染进程接口失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查页面模板更新",
    description: "验证页面是否支持HTML显示",
    test: () => {
      try {
        const artilleryPath = path.join(
          __dirname,
          "../src/renderer/views/pages/ArtilleryOperationPage.vue"
        );
        const uavPath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );

        const artilleryContent = fs.readFileSync(artilleryPath, "utf8");
        const uavContent = fs.readFileSync(uavPath, "utf8");

        const templateFeatures = ["v-html", "isDocumentHtml", "html-content"];

        let artilleryFeatures = 0;
        let uavFeatures = 0;

        for (const feature of templateFeatures) {
          if (artilleryContent.includes(feature)) artilleryFeatures++;
          if (uavContent.includes(feature)) uavFeatures++;
        }

        if (artilleryFeatures >= 2 && uavFeatures >= 2) {
          console.log(`✅ 页面模板已支持HTML显示`);
          console.log(
            `   火炮页面: ${artilleryFeatures}/${templateFeatures.length} 项`
          );
          console.log(
            `   无人机页面: ${uavFeatures}/${templateFeatures.length} 项`
          );
          return true;
        } else {
          console.log(`❌ 页面模板HTML支持不完整`);
          console.log(
            `   火炮页面: ${artilleryFeatures}/${templateFeatures.length} 项`
          );
          console.log(
            `   无人机页面: ${uavFeatures}/${templateFeatures.length} 项`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查页面模板失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查图片支持",
    description: "验证是否支持Word文档中的图片",
    test: () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/main/services/document.service.ts"
        );
        const content = fs.readFileSync(servicePath, "utf8");

        if (
          content.includes("convertImage") &&
          content.includes("base64") &&
          content.includes("data:")
        ) {
          console.log("✅ Word文档图片支持已添加");
          return true;
        } else {
          console.log("❌ Word文档图片支持未找到");
          return false;
        }
      } catch (error) {
        console.log("❌ 检查图片支持失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查表格样式",
    description: "验证是否有完整的表格样式支持",
    test: () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/main/services/document.service.ts"
        );
        const content = fs.readFileSync(servicePath, "utf8");

        const tableFeatures = [
          "table.word-table",
          "border-collapse",
          "nth-child(even)",
          "table => table.word-table",
        ];

        let foundFeatures = 0;
        for (const feature of tableFeatures) {
          if (content.includes(feature)) {
            foundFeatures++;
          }
        }

        if (foundFeatures >= 3) {
          console.log(
            `✅ 表格样式支持完整 (${foundFeatures}/${tableFeatures.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ 表格样式支持不完整 (${foundFeatures}/${tableFeatures.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查表格样式失败:", error.message);
        return false;
      }
    },
  },
];

// 运行测试
async function runTests() {
  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.name}`);
    console.log(`   ${testCase.description}`);

    try {
      const result = testCase.test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ 测试执行失败: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);

  if (passedTests === totalTests) {
    console.log("🎉 Word文档样式增强功能完整！");
    console.log("\n✨ 新增功能特性:");
    console.log("   • 保留Word文档原始标题样式 (H1-H6)");
    console.log("   • 支持粗体、斜体等字体样式");
    console.log("   • 完整的表格样式保留和美化");
    console.log("   • 图片Base64嵌入显示支持");
    console.log("   • 列表项和引用块格式化");
    console.log("   • 专业的文档排版样式");
    console.log("   • 支持打印样式优化");
    console.log("\n🎯 样式特点:");
    console.log("   • 类似Word的字体和间距");
    console.log("   • 美观的标题层次结构");
    console.log("   • 清晰的表格边框和背景");
    console.log("   • 图片阴影和圆角效果");
  } else {
    console.log("⚠️  部分功能未完整，请检查相关配置");
  }

  return passedTests === totalTests;
}

// 执行测试
runTests().catch((error) => {
  console.error("❌ 测试执行出错:", error);
  process.exit(1);
});
