#!/usr/bin/env node

/**
 * 文档创建脚本
 * 用于快速创建标准格式的项目文档
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 文档模板
const docTemplate = (title, category, description) => `# ${title}

## 概述

${description}

## 功能描述

[详细描述功能特性]

## 技术实现

[技术细节和实现方案]

## 使用方法

[具体的使用步骤]

## 配置说明

[相关配置参数]

## 故障排除

[常见问题和解决方案]

## 更新日志

### v1.0.0 (${new Date().toISOString().split('T')[0]})
- 初始版本

---

**分类**: ${category}  
**状态**: 📝 编写中  
**最后更新**: ${new Date().toISOString().split('T')[0]}  
**维护者**: 项目开发团队
`;

// 文档类别选项
const categories = {
  '1': '🚁 无人机相关',
  '2': '🧭 导航系统', 
  '3': '📡 通信协议',
  '4': '🔧 系统配置',
  '5': '📊 数据处理',
  '6': '🛠️ 功能特性',
  '7': '📖 说明文档',
  '8': '🧪 测试相关'
};

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createDocument() {
  console.log('📝 文档创建向导');
  console.log('='.repeat(40));
  
  try {
    // 获取文档标题
    const title = await askQuestion('请输入文档标题: ');
    if (!title) {
      console.log('❌ 标题不能为空');
      process.exit(1);
    }

    // 获取文档描述
    const description = await askQuestion('请输入文档描述: ');

    // 显示类别选项
    console.log('\n请选择文档类别:');
    Object.entries(categories).forEach(([key, value]) => {
      console.log(`${key}. ${value}`);
    });
    
    const categoryChoice = await askQuestion('\n请输入类别编号 (1-8): ');
    const category = categories[categoryChoice];
    
    if (!category) {
      console.log('❌ 无效的类别选择');
      process.exit(1);
    }

    // 生成文件名
    const fileName = title
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '') + '_README.md';
    
    const filePath = path.join(__dirname, '..', 'docs', fileName);

    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      const overwrite = await askQuestion(`文件 ${fileName} 已存在，是否覆盖? (y/N): `);
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ 操作已取消');
        process.exit(0);
      }
    }

    // 创建文档内容
    const content = docTemplate(title, category, description || '[请填写功能描述]');

    // 写入文件
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`\n✅ 文档创建成功!`);
    console.log(`📁 文件路径: docs/${fileName}`);
    console.log(`📝 请编辑文件完善内容`);
    console.log(`🔗 记得更新 docs/INDEX.md 中的索引`);

  } catch (error) {
    console.error('❌ 创建文档失败:', error.message);
  } finally {
    rl.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createDocument();
}

module.exports = { createDocument };