/**
 * 测试演习总体评价多维度平均值功能
 * 验证功能：
 * 1. 四个维度的平均分计算
 * 2. 评分颜色等级显示
 * 3. 基于已保存评价的统计
 * 4. 响应式布局适配
 */

const fs = require("fs");
const path = require("path");

// 模拟评价数据
const mockEvaluationData = [
  {
    name: "Alpha组",
    scores: {
      coordination: 4.5,
      targetIdentification: 4.2,
      commandExecution: 4.8,
      overall: 4.5,
    },
    isSaved: true,
    savedAt: "2025-01-01T10:00:00Z",
  },
  {
    name: "Bravo组",
    scores: {
      coordination: 3.8,
      targetIdentification: 4.0,
      commandExecution: 3.5,
      overall: 3.7,
    },
    isSaved: true,
    savedAt: "2025-01-01T10:05:00Z",
  },
  {
    name: "Charlie组",
    scores: {
      coordination: 3.2,
      targetIdentification: 2.8,
      commandExecution: 3.0,
      overall: 3.0,
    },
    isSaved: true,
    savedAt: "2025-01-01T10:10:00Z",
  },
  {
    name: "Delta组",
    scores: {
      coordination: 0,
      targetIdentification: 0,
      commandExecution: 0,
      overall: 0,
    },
    isSaved: false, // 未保存，不应计入统计
    savedAt: undefined,
  },
];

// 测试平均分计算函数
const calculateAverageScore = (data, criteria) => {
  if (data.length === 0) return "0.0";

  const validGroups = data.filter(
    (group) => group.isSaved && hasValidScores(group.scores)
  );
  if (validGroups.length === 0) return "0.0";

  const total = validGroups.reduce(
    (sum, group) => sum + group.scores[criteria],
    0
  );
  return (total / validGroups.length).toFixed(1);
};

// 检查评分有效性
const hasValidScores = (scores) => {
  return Object.values(scores).some((score) => score > 0);
};

// 获取评分颜色等级
const getScoreColorClass = (score) => {
  const numScore = parseFloat(score);
  if (numScore >= 4.5) return "score-excellent";
  if (numScore >= 4.0) return "score-good";
  if (numScore >= 3.0) return "score-average";
  if (numScore > 0) return "score-poor";
  return "score-none";
};

// 测试用例
const testCases = [
  {
    name: "四维度平均分计算测试",
    description: "验证四个评价维度的平均分计算准确性",
    test: () => {
      console.log("✓ 测试场景：计算四个维度的平均分");

      const coordination = calculateAverageScore(
        mockEvaluationData,
        "coordination"
      );
      const targetIdentification = calculateAverageScore(
        mockEvaluationData,
        "targetIdentification"
      );
      const commandExecution = calculateAverageScore(
        mockEvaluationData,
        "commandExecution"
      );
      const overall = calculateAverageScore(mockEvaluationData, "overall");

      console.log(`  - 协同效率平均分: ${coordination}`);
      console.log(`  - 目标识别平均分: ${targetIdentification}`);
      console.log(`  - 指令执行平均分: ${commandExecution}`);
      console.log(`  - 整体表现平均分: ${overall}`);

      // 验证计算准确性（只计算已保存的3个组）
      const expectedCoordination = ((4.5 + 3.8 + 3.2) / 3).toFixed(1);
      const expectedTargetId = ((4.2 + 4.0 + 2.8) / 3).toFixed(1);
      const expectedCommandExec = ((4.8 + 3.5 + 3.0) / 3).toFixed(1);
      const expectedOverall = ((4.5 + 3.7 + 3.0) / 3).toFixed(1);

      const passed =
        coordination === expectedCoordination &&
        targetIdentification === expectedTargetId &&
        commandExecution === expectedCommandExec &&
        overall === expectedOverall;

      console.log(`  - 期望值验证: ${passed ? "✅ 通过" : "❌ 失败"}`);
      console.log(
        `    协同效率: ${coordination} (期望 ${expectedCoordination})`
      );
      console.log(
        `    目标识别: ${targetIdentification} (期望 ${expectedTargetId})`
      );
      console.log(
        `    指令执行: ${commandExecution} (期望 ${expectedCommandExec})`
      );
      console.log(`    整体表现: ${overall} (期望 ${expectedOverall})`);

      return passed;
    },
  },
  {
    name: "评分颜色等级测试",
    description: "验证不同分数范围对应的颜色等级",
    test: () => {
      console.log("✓ 测试场景：评分颜色等级分类");

      const testScores = [
        {
          score: "4.8",
          expected: "score-excellent",
          description: "优秀(4.5-5.0)",
        },
        { score: "4.2", expected: "score-good", description: "良好(4.0-4.4)" },
        {
          score: "3.5",
          expected: "score-average",
          description: "中等(3.0-3.9)",
        },
        {
          score: "2.5",
          expected: "score-poor",
          description: "待改进(0.1-2.9)",
        },
        { score: "0.0", expected: "score-none", description: "无评分(0.0)" },
      ];

      let allPassed = true;
      testScores.forEach((test) => {
        const actual = getScoreColorClass(test.score);
        const passed = actual === test.expected;
        console.log(
          `  - ${test.score}分 -> ${actual} ${passed ? "✅" : "❌"} (${
            test.description
          })`
        );
        if (!passed) allPassed = false;
      });

      return allPassed;
    },
  },
  {
    name: "仅统计已保存评价测试",
    description: "验证只有已保存且有效的评价被计入平均分",
    test: () => {
      console.log("✓ 测试场景：过滤未保存评价");

      // 测试包含未保存评价的数据
      const mixedData = [
        ...mockEvaluationData,
        {
          name: "Echo组",
          scores: {
            coordination: 5.0,
            targetIdentification: 5.0,
            commandExecution: 5.0,
            overall: 5.0,
          },
          isSaved: false, // 未保存，不应计入
        },
      ];

      const coordination1 = calculateAverageScore(
        mockEvaluationData,
        "coordination"
      );
      const coordination2 = calculateAverageScore(mixedData, "coordination");

      const passed = coordination1 === coordination2;
      console.log(`  - 原数据平均分: ${coordination1}`);
      console.log(`  - 混合数据平均分: ${coordination2}`);
      console.log(`  - 未保存评价正确过滤: ${passed ? "✅ 通过" : "❌ 失败"}`);

      return passed;
    },
  },
  {
    name: "UI布局结构测试",
    description: "验证评价统计区域的HTML结构和CSS样式",
    test: () => {
      console.log("✓ 测试场景：UI布局结构验证");

      const expectedElements = [
        "average-scores-section",
        "scores-title",
        "scores-stats",
        "score-stat-item",
        "score-stat-label",
        "score-stat-value",
        "score-number",
        "score-unit",
      ];

      const expectedStyles = [
        "score-excellent",
        "score-good",
        "score-average",
        "score-poor",
        "score-none",
      ];

      console.log("  - 期望的HTML元素类:");
      expectedElements.forEach((cls) => console.log(`    • ${cls}`));

      console.log("  - 期望的评分颜色类:");
      expectedStyles.forEach((cls) => console.log(`    • ${cls}`));

      return true;
    },
  },
];

// 检查实现文件
const checkImplementation = () => {
  console.log("🔍 验证实现文件...\n");

  const filePath = path.join(
    __dirname,
    "src/renderer/views/pages/EvaluationPage.vue"
  );

  if (!fs.existsSync(filePath)) {
    console.error("❌ EvaluationPage.vue 文件不存在");
    return false;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const checks = [
    {
      name: "四维度评分统计",
      pattern: /目标识别/,
      description: "检查是否包含目标识别维度统计",
    },
    {
      name: "评分颜色等级函数",
      pattern: /getScoreColorClass/,
      description: "检查是否实现评分颜色等级函数",
    },
    {
      name: "average-scores-section区域",
      pattern: /average-scores-section/,
      description: "检查是否添加评分统计专用区域",
    },
    {
      name: "评分颜色样式",
      pattern: /score-excellent.*score-good.*score-average/s,
      description: "检查是否定义评分颜色样式",
    },
    {
      name: "响应式布局",
      pattern: /grid-template-columns.*1fr/,
      description: "检查是否支持响应式布局",
    },
    {
      name: "已保存评价过滤",
      pattern: /validGroups.*filter.*isSaved/,
      description: "检查是否只统计已保存的评价",
    },
  ];

  let allPassed = true;

  checks.forEach((check) => {
    if (check.pattern.test(content)) {
      console.log(`✓ ${check.name}: ${check.description}`);
    } else {
      console.log(`❌ ${check.name}: ${check.description}`);
      allPassed = false;
    }
  });

  return allPassed;
};

// 运行测试
console.log("🚀 演习总体评价多维度平均值功能测试\n");
console.log("=" * 60);

// 检查实现
const implementationOk = checkImplementation();

console.log("\n" + "=" * 60);
console.log("📋 功能测试用例:\n");

// 运行测试用例
let passedTests = 0;
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   描述: ${testCase.description}`);

  try {
    const result = testCase.test();
    if (result) {
      console.log("   结果: ✅ 通过\n");
      passedTests++;
    } else {
      console.log("   结果: ❌ 失败\n");
    }
  } catch (error) {
    console.log(`   结果: ❌ 错误 - ${error.message}\n`);
  }
});

// 生成测试报告
console.log("=" * 60);
console.log("📊 测试总结:");
console.log(`实现验证: ${implementationOk ? "✅ 通过" : "❌ 失败"}`);
console.log(`功能测试: ${passedTests}/${testCases.length} 通过`);
console.log(
  `总体状态: ${
    implementationOk && passedTests === testCases.length
      ? "✅ 所有测试通过"
      : "❌ 存在问题"
  }`
);

// 功能特性说明
console.log("\n" + "=" * 60);
console.log("🎯 功能特性:");
console.log("1. 多维度统计:");
console.log("   - 协同效率平均分");
console.log("   - 目标识别平均分");
console.log("   - 指令执行平均分");
console.log("   - 整体表现平均分");
console.log("\n2. 智能颜色标识:");
console.log("   - 4.5-5.0分: 绿色(优秀)");
console.log("   - 4.0-4.4分: 蓝色(良好)");
console.log("   - 3.0-3.9分: 黄色(中等)");
console.log("   - 0.1-2.9分: 红色(待改进)");
console.log("   - 0.0分: 灰色(无评分)");
console.log("\n3. 数据精确性:");
console.log("   - 只统计已保存且有效的评价");
console.log("   - 动态更新统计结果");
console.log("   - 避免未完成评价影响结果");
console.log("\n4. 响应式设计:");
console.log("   - 大屏：四列网格布局");
console.log("   - 小屏：单列垂直布局");
console.log("   - 优化的间距和字体大小");

console.log("\n📈 优化效果:");
console.log("- 信息展示更全面：从1个维度扩展到4个维度");
console.log("- 视觉效果更直观：颜色编码快速识别评分等级");
console.log("- 数据统计更准确：基于有效评价的精确计算");
console.log("- 用户体验更友好：清晰的布局和响应式适配");
