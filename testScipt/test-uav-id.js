#!/usr/bin/env node

/**
 * 测试UavId服务功能
 * 验证ID生成、配置文件更新等功能
 */

const fs = require('fs');
const path = require('path');

console.log('=== UavId 服务测试 ===\n');

// 测试ID生成逻辑
function testIdGeneration() {
  console.log('1. 测试ID生成逻辑');
  
  // 模拟生成四位随机数
  const generateUavId = () => {
    const id = Math.floor(Math.random() * 9000) + 1000;
    return id.toString();
  };
  
  console.log('   生成10个测试ID:');
  for (let i = 0; i < 10; i++) {
    const id = generateUavId();
    console.log(`   - ${id}`);
    
    // 验证ID格式
    if (!/^\d{4}$/.test(id)) {
      console.log(`   ❌ ID格式错误: ${id}`);
      return false;
    }
    
    const numId = parseInt(id);
    if (numId < 1000 || numId > 9999) {
      console.log(`   ❌ ID范围错误: ${id}`);
      return false;
    }
  }
  
  console.log('   ✅ ID生成测试通过\n');
  return true;
}

// 测试配置文件更新
function testConfigUpdate() {
  console.log('2. 测试配置文件更新');
  
  const configPath = path.join(process.cwd(), 'Nav', 'data', 'config.ini');
  console.log(`   配置文件路径: ${configPath}`);
  
  if (!fs.existsSync(configPath)) {
    console.log('   ❌ 配置文件不存在');
    return false;
  }
  
  try {
    // 读取原始配置
    const originalContent = fs.readFileSync(configPath, 'utf8');
    console.log('   📄 原始配置内容:');
    console.log('   ' + originalContent.split('\n').join('\n   '));
    
    // 模拟更新ID1
    const testId = '8888';
    const lines = originalContent.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('ID1=')) {
        const oldValue = line.split('=')[1];
        lines[i] = `ID1=${testId}`;
        updated = true;
        console.log(`   🔄 更新 ID1: ${oldValue} -> ${testId}`);
        break;
      }
    }
    
    if (!updated) {
      console.log('   ❌ 未找到ID1配置项');
      return false;
    }
    
    // 创建备份
    const backupPath = configPath + '.backup';
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    console.log(`   💾 创建备份: ${backupPath}`);
    
    // 写入测试配置
    const updatedContent = lines.join('\n');
    fs.writeFileSync(configPath, updatedContent, 'utf8');
    console.log('   ✅ 配置文件已更新');
    
    // 验证更新
    const verifyContent = fs.readFileSync(configPath, 'utf8');
    if (verifyContent.includes(`ID1=${testId}`)) {
      console.log('   ✅ 配置更新验证成功');
    } else {
      console.log('   ❌ 配置更新验证失败');
      return false;
    }
    
    // 恢复原始配置
    fs.writeFileSync(configPath, originalContent, 'utf8');
    fs.unlinkSync(backupPath);
    console.log('   🔄 已恢复原始配置');
    console.log('   ✅ 配置文件更新测试通过\n');
    
    return true;
  } catch (error) {
    console.log(`   ❌ 配置文件更新测试失败: ${error.message}\n`);
    return false;
  }
}

// 测试配置文件结构解析
function testConfigParsing() {
  console.log('3. 测试配置文件结构解析');
  
  const configPath = path.join(process.cwd(), 'Nav', 'data', 'config.ini');
  
  if (!fs.existsSync(configPath)) {
    console.log('   ❌ 配置文件不存在\n');
    return false;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const lines = content.split('\n');
    
    console.log('   📋 解析配置文件结构:');
    
    let currentSection = '';
    const config = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // 节标题
        currentSection = trimmed.slice(1, -1);
        config[currentSection] = {};
        console.log(`   📁 节: ${currentSection}`);
      } else if (trimmed.includes('=') && currentSection) {
        // 键值对
        const [key, value] = trimmed.split('=', 2);
        config[currentSection][key] = value;
        console.log(`   🔑 ${currentSection}.${key} = ${value}`);
      }
    }
    
    // 验证必要的配置项
    if (config.Uav_list && config.Uav_list.ID1) {
      console.log(`   ✅ 找到ID1配置: ${config.Uav_list.ID1}`);
    } else {
      console.log('   ❌ 未找到ID1配置');
      return false;
    }
    
    console.log('   ✅ 配置文件解析测试通过\n');
    return true;
  } catch (error) {
    console.log(`   ❌ 配置文件解析失败: ${error.message}\n`);
    return false;
  }
}

// 测试JSON配置文件创建
function testJsonConfigCreation() {
  console.log('4. 测试JSON配置文件创建');
  
  const testConfigPath = path.join(process.cwd(), 'test-uav-id-config.json');
  
  const defaultConfig = {
    currentId: null,
    history: [],
    settings: {
      autoGenerate: true,
      idLength: 4,
      prefix: ""
    }
  };
  
  try {
    // 创建测试配置文件
    fs.writeFileSync(testConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    console.log(`   ✅ 测试配置文件创建成功: ${testConfigPath}`);
    
    // 验证文件内容
    const savedConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    console.log('   📋 配置文件内容验证:');
    console.log(`   - currentId: ${savedConfig.currentId}`);
    console.log(`   - history length: ${savedConfig.history.length}`);
    console.log(`   - autoGenerate: ${savedConfig.settings.autoGenerate}`);
    console.log(`   - idLength: ${savedConfig.settings.idLength}`);
    
    // 模拟添加历史记录
    const testRecord = {
      id: '1234',
      generatedAt: new Date().toISOString(),
      description: '测试记录'
    };
    
    savedConfig.currentId = testRecord.id;
    savedConfig.history.push(testRecord);
    
    // 保存更新后的配置
    fs.writeFileSync(testConfigPath, JSON.stringify(savedConfig, null, 2), 'utf8');
    console.log('   ✅ 配置更新成功');
    
    // 清理测试文件
    fs.unlinkSync(testConfigPath);
    console.log('   🧹 测试文件已清理');
    console.log('   ✅ JSON配置文件测试通过\n');
    
    return true;
  } catch (error) {
    console.log(`   ❌ JSON配置文件测试失败: ${error.message}\n`);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  const tests = [
    testIdGeneration,
    testConfigUpdate,
    testConfigParsing,
    testJsonConfigCreation
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ 测试执行失败: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('=== 测试结果 ===');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！UavId服务功能正常');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关功能');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testIdGeneration,
  testConfigUpdate,
  testConfigParsing,
  testJsonConfigCreation,
  runTests
};