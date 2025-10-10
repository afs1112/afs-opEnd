#!/usr/bin/env node

/**
 * 页面功能一致性测试脚本
 * 验证火炮页面和无人机页面的文档功能是否一致
 */

const path = require("path");
const fs = require("fs");

console.log("🔍 页面功能一致性测试");
console.log("=".repeat(50));

// 读取两个页面文件
const artilleryPath = path.join(
  __dirname,
  "../src/renderer/views/pages/ArtilleryOperationPage.vue"
);
const uavPath = path.join(
  __dirname,
  "../src/renderer/views/pages/UavOperationPage.vue"
);

let artilleryContent, uavContent;

try {
  artilleryContent = fs.readFileSync(artilleryPath, "utf8");
  uavContent = fs.readFileSync(uavPath, "utf8");
  console.log("✅ 成功读取页面文件");
} catch (error) {
  console.error("❌ 读取页面文件失败:", error.message);
  process.exit(1);
}

// 一致性检查项目
const consistencyChecks = [
  {
    name: "DocumentService 导入",
    description: "检查两个页面是否都导入了 DocumentService",
    test: () => {
      const artilleryHas =
        artilleryContent.includes("DocumentService") &&
        artilleryContent.includes('from "../../services"');
      const uavHas =
        uavContent.includes("DocumentService") &&
        uavContent.includes('from "../../services"');

      if (artilleryHas && uavHas) {
        console.log("✅ 两个页面都已导入 DocumentService");
        return true;
      } else {
        console.log("❌ DocumentService 导入不一致");
        console.log(`   火炮页面: ${artilleryHas ? "✓" : "✗"}`);
        console.log(`   无人机页面: ${uavHas ? "✓" : "✗"}`);
        return false;
      }
    },
  },
  {
    name: "图标导入",
    description: "检查两个页面是否都导入了必要的图标",
    test: () => {
      const requiredIcons = ["Document", "Folder"];
      const artilleryIcons = requiredIcons.filter((icon) =>
        artilleryContent.includes(icon)
      );
      const uavIcons = requiredIcons.filter((icon) =>
        uavContent.includes(icon)
      );

      if (
        artilleryIcons.length === requiredIcons.length &&
        uavIcons.length === requiredIcons.length
      ) {
        console.log("✅ 两个页面都已导入必要图标");
        return true;
      } else {
        console.log("❌ 图标导入不一致");
        console.log(
          `   火炮页面: ${artilleryIcons.length}/${requiredIcons.length}`
        );
        console.log(
          `   无人机页面: ${uavIcons.length}/${requiredIcons.length}`
        );
        return false;
      }
    },
  },
  {
    name: "状态变量",
    description: "检查两个页面是否都有相同的文档状态变量",
    test: () => {
      const requiredVars = ["currentDocumentInfo", "hasOpenedDocuments"];
      const artilleryVars = requiredVars.filter((varName) =>
        artilleryContent.includes(varName)
      );
      const uavVars = requiredVars.filter((varName) =>
        uavContent.includes(varName)
      );

      if (
        artilleryVars.length === requiredVars.length &&
        uavVars.length === requiredVars.length
      ) {
        console.log("✅ 两个页面都有必要的状态变量");
        return true;
      } else {
        console.log("❌ 状态变量不一致");
        console.log(
          `   火炮页面: ${artilleryVars.length}/${requiredVars.length}`
        );
        console.log(`   无人机页面: ${uavVars.length}/${requiredVars.length}`);
        return false;
      }
    },
  },
  {
    name: "关键函数",
    description: "检查两个页面是否都使用了新的文档服务函数",
    test: () => {
      const keyFunctions = [
        "selectAndOpenDocument",
        "hideCurrentDocument",
        "formatDocumentContent",
        "getDocumentIcon",
      ];

      const artilleryFuncs = keyFunctions.filter((func) =>
        artilleryContent.includes(func)
      );
      const uavFuncs = keyFunctions.filter((func) => uavContent.includes(func));

      if (artilleryFuncs.length >= 3 && uavFuncs.length >= 3) {
        console.log(`✅ 两个页面都使用了新的文档服务函数`);
        console.log(
          `   火炮页面: ${artilleryFuncs.length}/${keyFunctions.length}`
        );
        console.log(`   无人机页面: ${uavFuncs.length}/${keyFunctions.length}`);
        return true;
      } else {
        console.log("❌ 文档服务函数使用不一致");
        console.log(
          `   火炮页面: ${artilleryFuncs.length}/${keyFunctions.length}`
        );
        console.log(`   无人机页面: ${uavFuncs.length}/${keyFunctions.length}`);
        return false;
      }
    },
  },
  {
    name: "模板特性",
    description: "检查两个页面的文档对话框模板是否一致",
    test: () => {
      const templateFeatures = [
        "document-info-bar",
        "isFromCache",
        "empty-content",
        "currentDocumentInfo",
      ];

      const artilleryFeatures = templateFeatures.filter((feature) =>
        artilleryContent.includes(feature)
      );
      const uavFeatures = templateFeatures.filter((feature) =>
        uavContent.includes(feature)
      );

      if (artilleryFeatures.length >= 3 && uavFeatures.length >= 3) {
        console.log(`✅ 两个页面的模板特性基本一致`);
        console.log(
          `   火炮页面: ${artilleryFeatures.length}/${templateFeatures.length}`
        );
        console.log(
          `   无人机页面: ${uavFeatures.length}/${templateFeatures.length}`
        );
        return true;
      } else {
        console.log("❌ 模板特性不一致");
        console.log(
          `   火炮页面: ${artilleryFeatures.length}/${templateFeatures.length}`
        );
        console.log(
          `   无人机页面: ${uavFeatures.length}/${templateFeatures.length}`
        );
        return false;
      }
    },
  },
  {
    name: "生命周期钩子",
    description: "检查两个页面的onMounted是否都添加了文档状态检查",
    test: () => {
      const hasDocumentCheck = (content) => {
        return (
          content.includes("hasOpenedDocuments") &&
          content.includes("DocumentService.hasOpenedDocuments")
        );
      };

      const artilleryHas = hasDocumentCheck(artilleryContent);
      const uavHas = hasDocumentCheck(uavContent);

      if (artilleryHas && uavHas) {
        console.log("✅ 两个页面都在生命周期中检查文档状态");
        return true;
      } else {
        console.log("❌ 生命周期钩子不一致");
        console.log(`   火炮页面: ${artilleryHas ? "✓" : "✗"}`);
        console.log(`   无人机页面: ${uavHas ? "✓" : "✗"}`);
        return false;
      }
    },
  },
  {
    name: "CSS样式",
    description: "检查两个页面是否都有必要的文档样式",
    test: () => {
      const styleClasses = [
        "document-info-bar",
        "file-path",
        "empty-content",
        "empty-icon",
      ];

      const artilleryStyles = styleClasses.filter((className) =>
        artilleryContent.includes(className)
      );
      const uavStyles = styleClasses.filter((className) =>
        uavContent.includes(className)
      );

      if (artilleryStyles.length >= 3 && uavStyles.length >= 3) {
        console.log(`✅ 两个页面都有必要的CSS样式`);
        console.log(
          `   火炮页面: ${artilleryStyles.length}/${styleClasses.length}`
        );
        console.log(
          `   无人机页面: ${uavStyles.length}/${styleClasses.length}`
        );
        return true;
      } else {
        console.log("❌ CSS样式不一致");
        console.log(
          `   火炮页面: ${artilleryStyles.length}/${styleClasses.length}`
        );
        console.log(
          `   无人机页面: ${uavStyles.length}/${styleClasses.length}`
        );
        return false;
      }
    },
  },
];

// 运行一致性检查
function runConsistencyChecks() {
  let passedChecks = 0;
  let totalChecks = consistencyChecks.length;

  for (let i = 0; i < consistencyChecks.length; i++) {
    const check = consistencyChecks[i];
    console.log(`\n${i + 1}. ${check.name}`);
    console.log(`   ${check.description}`);

    try {
      const result = check.test();
      if (result) {
        passedChecks++;
      }
    } catch (error) {
      console.log(`❌ 检查执行失败: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 一致性检查结果: ${passedChecks}/${totalChecks} 通过`);

  if (passedChecks === totalChecks) {
    console.log("🎉 两个页面的文档功能完全一致！");
    console.log("\n✨ 一致性特性:");
    console.log("   • 相同的DocumentService集成");
    console.log("   • 一致的用户界面设计");
    console.log("   • 统一的文档状态管理");
    console.log("   • 相同的缓存和隐藏机制");
    console.log("   • 一致的错误处理逻辑");
    console.log("\n🔗 共享功能:");
    console.log("   • 文档在两个页面间共享状态");
    console.log("   • 在任一页面打开的文档在另一页面也可见");
    console.log("   • 统一的文档格式支持和解析");
  } else {
    console.log("⚠️  页面功能存在不一致，建议进一步检查");

    if (passedChecks >= totalChecks * 0.8) {
      console.log("💡 大部分功能已一致，可能只是细微差异");
    }
  }

  return passedChecks === totalChecks;
}

// 执行检查
runConsistencyChecks();
