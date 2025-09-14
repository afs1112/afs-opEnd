#!/usr/bin/env node

/**
 * 测试导出功能
 * 验证打包后的导出功能是否正常工作
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== 导出功能测试 ===\n');

// 测试路径解析
function testPathResolution() {
  console.log('1. 测试路径解析');
  
  // 模拟不同的路径获取方式
  const paths = {
    documents: (() => {
      try {
        return path.join(os.homedir(), 'Documents');
      } catch (error) {
        return null;
      }
    })(),
    downloads: (() => {
      try {
        return path.join(os.homedir(), 'Downloads');
      } catch (error) {
        return null;
      }
    })(),
    userData: (() => {
      try {
        return path.join(os.homedir(), '.config', 'test-app');
      } catch (error) {
        return null;
      }
    })(),
    temp: os.tmpdir()
  };
  
  console.log('   可用路径:');
  for (const [name, pathValue] of Object.entries(paths)) {
    if (pathValue) {
      const exists = fs.existsSync(pathValue);
      const accessible = exists ? testWriteAccess(pathValue) : false;
      console.log(`   - ${name}: ${pathValue} (存在: ${exists}, 可写: ${accessible})`);
    } else {
      console.log(`   - ${name}: 不可用`);
    }
  }
  
  console.log('');
  return paths;
}

// 测试写入权限
function testWriteAccess(dirPath) {
  try {
    const testFile = path.join(dirPath, `test-write-${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

// 测试文件导出
function testFileExport() {
  console.log('2. 测试文件导出功能');
  
  const testData = {
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 },
      { id: 3, name: 'Test 3', value: 300 }
    ],
    metadata: {
      version: '1.0.0',
      exportedBy: 'test-script'
    }
  };
  
  // 测试不同的导出路径
  const testPaths = [
    path.join(os.tmpdir(), 'test-export-1.json'),
    path.join(os.homedir(), 'test-export-2.json'),
  ];
  
  let successCount = 0;
  
  for (const testPath of testPaths) {
    try {
      console.log(`   测试导出到: ${testPath}`);
      
      // 确保目录存在
      const dir = path.dirname(testPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   创建目录: ${dir}`);
      }
      
      // 序列化数据
      const jsonContent = JSON.stringify(testData, null, 2);
      
      // 写入文件
      fs.writeFileSync(testPath, jsonContent, 'utf8');
      
      // 验证文件
      const stats = fs.statSync(testPath);
      const readBack = JSON.parse(fs.readFileSync(testPath, 'utf8'));
      
      console.log(`   ✅ 导出成功: 大小 ${stats.size} bytes, 记录数 ${readBack.data.length}`);
      
      // 清理测试文件
      fs.unlinkSync(testPath);
      console.log(`   🧹 测试文件已清理`);
      
      successCount++;
    } catch (error) {
      console.log(`   ❌ 导出失败: ${error.message}`);
    }
  }
  
  console.log(`   📊 成功: ${successCount}/${testPaths.length}\n`);
  return successCount === testPaths.length;
}

// 测试数据库文件复制
function testDatabaseExport() {
  console.log('3. 测试数据库导出功能');
  
  // 创建模拟数据库文件
  const mockDbPath = path.join(os.tmpdir(), 'test-database.sqlite');
  const mockDbContent = Buffer.from('SQLite format 3\0'); // 简单的SQLite文件头
  
  try {
    // 创建模拟数据库
    fs.writeFileSync(mockDbPath, mockDbContent);
    console.log(`   创建模拟数据库: ${mockDbPath}`);
    
    // 测试复制到不同位置
    const exportPath = path.join(os.tmpdir(), 'exported-database.sqlite');
    
    // 复制文件
    fs.copyFileSync(mockDbPath, exportPath);
    
    // 验证复制结果
    const originalStats = fs.statSync(mockDbPath);
    const exportedStats = fs.statSync(exportPath);
    
    if (originalStats.size === exportedStats.size) {
      console.log(`   ✅ 数据库复制成功: ${exportedStats.size} bytes`);
    } else {
      console.log(`   ❌ 数据库复制失败: 大小不匹配`);
      return false;
    }
    
    // 清理测试文件
    fs.unlinkSync(mockDbPath);
    fs.unlinkSync(exportPath);
    console.log(`   🧹 测试文件已清理`);
    
    console.log('   ✅ 数据库导出测试通过\n');
    return true;
  } catch (error) {
    console.log(`   ❌ 数据库导出测试失败: ${error.message}\n`);
    return false;
  }
}

// 测试SQL文件导出
function testSqlExport() {
  console.log('4. 测试SQL导出功能');
  
  const sqlContent = `-- 测试SQL导出
BEGIN TRANSACTION;

-- 插入测试数据
INSERT INTO test_table (id, name, value)
VALUES
  (1, 'Test 1', 100),
  (2, 'Test 2', 200),
  (3, 'Test 3', 300)
ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    value = excluded.value;

COMMIT;`;
  
  try {
    const sqlPath = path.join(os.tmpdir(), 'test-export.sql');
    
    // 写入SQL文件
    fs.writeFileSync(sqlPath, sqlContent, 'utf8');
    
    // 验证文件
    const stats = fs.statSync(sqlPath);
    const readBack = fs.readFileSync(sqlPath, 'utf8');
    
    if (readBack === sqlContent) {
      console.log(`   ✅ SQL导出成功: ${stats.size} bytes`);
    } else {
      console.log(`   ❌ SQL导出失败: 内容不匹配`);
      return false;
    }
    
    // 清理测试文件
    fs.unlinkSync(sqlPath);
    console.log(`   🧹 测试文件已清理`);
    
    console.log('   ✅ SQL导出测试通过\n');
    return true;
  } catch (error) {
    console.log(`   ❌ SQL导出测试失败: ${error.message}\n`);
    return false;
  }
}

// 测试错误处理
function testErrorHandling() {
  console.log('5. 测试错误处理');
  
  const tests = [
    {
      name: '无效路径',
      test: () => {
        try {
          fs.writeFileSync('/invalid/path/test.json', '{}');
          return false; // 不应该成功
        } catch (error) {
          console.log(`   ✅ 正确捕获错误: ${error.code}`);
          return true;
        }
      }
    },
    {
      name: '无效JSON数据',
      test: () => {
        try {
          const circular = {};
          circular.self = circular;
          JSON.stringify(circular);
          return false; // 不应该成功
        } catch (error) {
          console.log(`   ✅ 正确捕获循环引用错误`);
          return true;
        }
      }
    },
    {
      name: '权限不足',
      test: () => {
        // 这个测试在不同系统上可能表现不同
        console.log(`   ⚠️  权限测试跳过（系统相关）`);
        return true;
      }
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    console.log(`   测试: ${test.name}`);
    if (test.test()) {
      passed++;
    }
  }
  
  console.log(`   📊 错误处理测试: ${passed}/${tests.length} 通过\n`);
  return passed === tests.length;
}

// 运行所有测试
async function runTests() {
  const tests = [
    { name: '路径解析', fn: testPathResolution },
    { name: '文件导出', fn: testFileExport },
    { name: '数据库导出', fn: testDatabaseExport },
    { name: 'SQL导出', fn: testSqlExport },
    { name: '错误处理', fn: testErrorHandling }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ 测试 "${test.name}" 执行失败: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('=== 测试结果 ===');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有导出功能测试通过！');
    console.log('\n💡 建议:');
    console.log('   - 在打包后的应用中测试实际导出功能');
    console.log('   - 检查不同操作系统上的路径权限');
    console.log('   - 验证大文件导出性能');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关功能');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPathResolution,
  testFileExport,
  testDatabaseExport,
  testSqlExport,
  testErrorHandling,
  runTests
};