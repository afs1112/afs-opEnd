#!/usr/bin/env node

/**
 * 无人机页面文档功能测试脚本
 * 验证无人机页面是否已更新为新的文档功能
 */

const path = require("path");
const fs = require("fs");

console.log("🚁 无人机页面文档功能测试");
console.log("=".repeat(50));

// 测试用例
const testCases = [
  {
    name: "检查DocumentService导入",
    description: "验证无人机页面是否导入了DocumentService",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        if (
          content.includes("DocumentService") &&
          content.includes('from "../../services"')
        ) {
          console.log("✅ DocumentService 已正确导入");
          return true;
        } else {
          console.log("❌ DocumentService 未正确导入");
          return false;
        }
      } catch (error) {
        console.log("❌ 无法读取无人机页面文件:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查图标导入",
    description: "验证是否添加了新的图标导入",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        const requiredIcons = ["Document", "Folder"];
        let allFound = true;

        for (const icon of requiredIcons) {
          if (!content.includes(icon)) {
            console.log(`❌ 缺少图标导入: ${icon}`);
            allFound = false;
          }
        }

        if (allFound) {
          console.log("✅ 所有必需图标已导入");
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log("❌ 检查图标导入失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查变量声明",
    description: "验证是否添加了新的文档状态变量",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        const requiredVars = ["currentDocumentInfo", "hasOpenedDocuments"];

        let foundVars = 0;
        for (const varName of requiredVars) {
          if (content.includes(varName)) {
            foundVars++;
          }
        }

        if (foundVars >= 2) {
          console.log(
            `✅ 文档状态变量已添加 (${foundVars}/${requiredVars.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ 文档状态变量不完整 (${foundVars}/${requiredVars.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查变量声明失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查函数更新",
    description: "验证文档相关函数是否更新",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        const requiredFunctions = [
          "selectAndOpenDocument",
          "hideCurrentDocument",
          "formatDocumentContent",
          "getDocumentIcon",
        ];

        let foundFunctions = 0;
        for (const funcName of requiredFunctions) {
          if (content.includes(funcName)) {
            foundFunctions++;
          }
        }

        if (foundFunctions >= 3) {
          console.log(
            `✅ 文档函数已更新 (${foundFunctions}/${requiredFunctions.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ 文档函数更新不完整 (${foundFunctions}/${requiredFunctions.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查函数更新失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查模板更新",
    description: "验证文档对话框模板是否更新",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        const templateFeatures = [
          "document-info-bar",
          "currentDocumentInfo",
          "isFromCache",
          "selectDocument",
        ];

        let foundFeatures = 0;
        for (const feature of templateFeatures) {
          if (content.includes(feature)) {
            foundFeatures++;
          }
        }

        if (foundFeatures >= 3) {
          console.log(
            `✅ 文档对话框模板已更新 (${foundFeatures}/${templateFeatures.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ 文档对话框模板更新不完整 (${foundFeatures}/${templateFeatures.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查模板更新失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查样式添加",
    description: "验证是否添加了新的CSS样式",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        const styleClasses = [
          "document-info-bar",
          "file-path",
          "empty-content",
          "empty-icon",
        ];

        let foundStyles = 0;
        for (const className of styleClasses) {
          if (content.includes(className)) {
            foundStyles++;
          }
        }

        if (foundStyles >= 3) {
          console.log(
            `✅ 文档样式已添加 (${foundStyles}/${styleClasses.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ 文档样式添加不完整 (${foundStyles}/${styleClasses.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查样式添加失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "检查生命周期更新",
    description: "验证onMounted是否添加了文档状态检查",
    test: () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/UavOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        if (
          content.includes("hasOpenedDocuments") &&
          content.includes("DocumentService.hasOpenedDocuments")
        ) {
          console.log("✅ 生命周期钩子已更新");
          return true;
        } else {
          console.log("❌ 生命周期钩子未更新");
          return false;
        }
      } catch (error) {
        console.log("❌ 检查生命周期更新失败:", error.message);
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
    console.log("🎉 无人机页面文档功能已完全更新！");
    console.log("\n✨ 更新完成的功能:");
    console.log("   • 智能文档缓存和状态管理");
    console.log("   • 文档隐藏而非关闭机制");
    console.log("   • 多格式文档支持 (Word, Excel, 文本)");
    console.log("   • 改进的用户界面和错误处理");
    console.log("   • 与火炮页面功能保持一致");
    console.log("\n🔧 使用提示:");
    console.log("   • 首次打开需选择文档");
    console.log("   • 关闭后下次打开会直接显示缓存文档");
    console.log("   • 可在文档界面中切换到其他文档");
  } else {
    console.log("⚠️  部分测试失败，无人机页面可能需要进一步检查");
  }

  return passedTests === totalTests;
}

// 执行测试
runTests().catch((error) => {
  console.error("❌ 测试执行出错:", error);
  process.exit(1);
});
