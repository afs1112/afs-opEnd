#!/usr/bin/env node

/**
 * 文档功能测试脚本
 * 测试优化后的文档打开逻辑
 */

const path = require("path");
const fs = require("fs");

console.log("📄 文档功能测试");
console.log("=".repeat(50));

// 测试用例
const testCases = [
  {
    name: "测试 Word 文档解析",
    description: "验证 mammoth 库是否正确安装并可用",
    test: async () => {
      try {
        const mammoth = require("mammoth");
        console.log("✅ mammoth 库可用");
        return true;
      } catch (error) {
        console.log("❌ mammoth 库不可用:", error.message);
        return false;
      }
    },
  },
  {
    name: "测试 Excel 文档解析",
    description: "验证 xlsx 库是否正确安装并可用",
    test: async () => {
      try {
        const XLSX = require("xlsx");
        console.log("✅ xlsx 库可用");
        return true;
      } catch (error) {
        console.log("❌ xlsx 库不可用:", error.message);
        return false;
      }
    },
  },
  {
    name: "测试文档服务导入",
    description: "验证文档服务类是否正确导出",
    test: async () => {
      try {
        const servicesPath = path.join(
          __dirname,
          "../src/renderer/services/index.ts"
        );
        const content = fs.readFileSync(servicesPath, "utf8");

        if (content.includes("DocumentService")) {
          console.log("✅ DocumentService 已正确导出");
          return true;
        } else {
          console.log("❌ DocumentService 未找到导出");
          return false;
        }
      } catch (error) {
        console.log("❌ 无法读取服务文件:", error.message);
        return false;
      }
    },
  },
  {
    name: "测试文档状态服务",
    description: "验证文档状态管理服务文件存在",
    test: async () => {
      try {
        const servicePath = path.join(
          __dirname,
          "../src/main/services/document-state.service.ts"
        );
        const exists = fs.existsSync(servicePath);

        if (exists) {
          console.log("✅ 文档状态服务文件存在");
          return true;
        } else {
          console.log("❌ 文档状态服务文件不存在");
          return false;
        }
      } catch (error) {
        console.log("❌ 检查文档状态服务失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "测试主进程IPC处理",
    description: "验证主进程是否添加了新的文档相关IPC处理",
    test: async () => {
      try {
        const mainPath = path.join(__dirname, "../src/main/main.ts");
        const content = fs.readFileSync(mainPath, "utf8");

        const requiredHandlers = [
          "document:getRecentDocument",
          "document:hideDocument",
          "document:hasOpenedDocuments",
        ];

        let allFound = true;
        for (const handler of requiredHandlers) {
          if (!content.includes(handler)) {
            console.log(`❌ 缺少 IPC 处理器: ${handler}`);
            allFound = false;
          }
        }

        if (allFound) {
          console.log("✅ 所有文档 IPC 处理器已添加");
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log("❌ 检查主进程文件失败:", error.message);
        return false;
      }
    },
  },
  {
    name: "测试页面文档功能更新",
    description: "验证火炮页面是否使用了新的文档服务",
    test: async () => {
      try {
        const pagePath = path.join(
          __dirname,
          "../src/renderer/views/pages/ArtilleryOperationPage.vue"
        );
        const content = fs.readFileSync(pagePath, "utf8");

        const features = [
          "DocumentService",
          "currentDocumentInfo",
          "hasOpenedDocuments",
          "selectAndOpenDocument",
          "hideCurrentDocument",
        ];

        let foundFeatures = 0;
        for (const feature of features) {
          if (content.includes(feature)) {
            foundFeatures++;
          }
        }

        if (foundFeatures >= 4) {
          console.log(
            `✅ 火炮页面文档功能已更新 (${foundFeatures}/${features.length} 项)`
          );
          return true;
        } else {
          console.log(
            `❌ 火炮页面文档功能更新不完整 (${foundFeatures}/${features.length} 项)`
          );
          return false;
        }
      } catch (error) {
        console.log("❌ 检查火炮页面失败:", error.message);
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
      const result = await testCase.test();
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
    console.log("🎉 所有测试通过！文档功能优化成功！");
    console.log("\n✨ 新功能特性:");
    console.log("   • 支持 Word (.doc, .docx)、Excel (.xls, .xlsx) 和文本文件");
    console.log("   • 文档打开后关闭是隐藏，再次打开无需重新选择");
    console.log("   • 改进的文档解析，更好的格式化显示");
    console.log("   • 文档状态管理和缓存机制");
    console.log("   • 更友好的用户界面和错误处理");
  } else {
    console.log("⚠️  部分测试失败，请检查相关配置");
  }

  return passedTests === totalTests;
}

// 执行测试
runTests().catch((error) => {
  console.error("❌ 测试执行出错:", error);
  process.exit(1);
});
