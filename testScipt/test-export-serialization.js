#!/usr/bin/env node

/**
 * 测试导出序列化功能
 * 验证各种数据类型的序列化处理
 */

console.log('=== 导出序列化测试 ===\n');

// 模拟数据清理函数（与main.ts中的函数相同）
function cleanDataForSerialization(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'function') {
    return '[Function]';
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (obj instanceof Buffer) {
    return {
      type: 'Buffer',
      data: Array.from(obj),
      length: obj.length
    };
  }
  
  if (obj instanceof Error) {
    return {
      type: 'Error',
      name: obj.name,
      message: obj.message,
      stack: obj.stack
    };
  }
  
  // 检查循环引用
  const seen = new WeakSet();
  
  function cleanRecursive(item) {
    if (item === null || item === undefined) {
      return item;
    }
    
    if (typeof item === 'function') {
      return '[Function]';
    }
    
    if (typeof item === 'symbol') {
      return item.toString();
    }
    
    if (typeof item === 'bigint') {
      return item.toString();
    }
    
    if (item instanceof Date) {
      return item.toISOString();
    }
    
    if (item instanceof Buffer) {
      return {
        type: 'Buffer',
        data: Array.from(item.slice(0, 100)),
        length: item.length,
        truncated: item.length > 100
      };
    }
    
    if (typeof item === 'object') {
      if (seen.has(item)) {
        return '[Circular Reference]';
      }
      
      seen.add(item);
      
      if (Array.isArray(item)) {
        return item.map(cleanRecursive);
      }
      
      const cleaned = {};
      for (const [key, value] of Object.entries(item)) {
        if (key.startsWith('_') || key === 'constructor' || key === 'prototype') {
          continue;
        }
        
        try {
          cleaned[key] = cleanRecursive(value);
        } catch (error) {
          cleaned[key] = `[Serialization Error: ${error.message}]`;
        }
      }
      
      return cleaned;
    }
    
    return item;
  }
  
  return cleanRecursive(obj);
}

// 测试基本数据类型
function testBasicTypes() {
  console.log('1. 测试基本数据类型');
  
  const testData = {
    string: 'Hello World',
    number: 42,
    boolean: true,
    null: null,
    undefined: undefined,
    array: [1, 2, 3],
    object: { a: 1, b: 2 }
  };
  
  try {
    const cleaned = cleanDataForSerialization(testData);
    const serialized = JSON.stringify(cleaned);
    const parsed = JSON.parse(serialized);
    
    console.log('   ✅ 基本数据类型序列化成功');
    console.log(`   📊 原始键数: ${Object.keys(testData).length}, 清理后键数: ${Object.keys(cleaned).length}`);
    return true;
  } catch (error) {
    console.log(`   ❌ 基本数据类型序列化失败: ${error.message}`);
    return false;
  }
}

// 测试特殊对象
function testSpecialObjects() {
  console.log('\n2. 测试特殊对象');
  
  const testData = {
    date: new Date(),
    buffer: Buffer.from('Hello Buffer'),
    error: new Error('Test Error'),
    function: function() { return 'test'; },
    symbol: Symbol('test'),
    bigint: BigInt(123456789),
    regex: /test/g
  };
  
  try {
    const cleaned = cleanDataForSerialization(testData);
    const serialized = JSON.stringify(cleaned);
    const parsed = JSON.parse(serialized);
    
    console.log('   ✅ 特殊对象序列化成功');
    console.log('   📋 转换结果:');
    console.log(`   - Date: ${typeof cleaned.date} (${cleaned.date})`);
    console.log(`   - Buffer: ${cleaned.buffer.type} (长度: ${cleaned.buffer.length})`);
    console.log(`   - Error: ${cleaned.error.type} (${cleaned.error.message})`);
    console.log(`   - Function: ${cleaned.function}`);
    console.log(`   - Symbol: ${cleaned.symbol}`);
    console.log(`   - BigInt: ${cleaned.bigint}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ 特殊对象序列化失败: ${error.message}`);
    return false;
  }
}

// 测试循环引用
function testCircularReference() {
  console.log('\n3. 测试循环引用');
  
  const testData = {
    name: 'root',
    child: {
      name: 'child'
    }
  };
  
  // 创建循环引用
  testData.child.parent = testData;
  testData.self = testData;
  
  try {
    const cleaned = cleanDataForSerialization(testData);
    const serialized = JSON.stringify(cleaned);
    const parsed = JSON.parse(serialized);
    
    console.log('   ✅ 循环引用处理成功');
    console.log(`   📋 child.parent: ${cleaned.child.parent}`);
    console.log(`   📋 self: ${cleaned.self}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ 循环引用处理失败: ${error.message}`);
    return false;
  }
}

// 测试复杂嵌套对象
function testComplexNesting() {
  console.log('\n4. 测试复杂嵌套对象');
  
  const testData = {
    level1: {
      level2: {
        level3: {
          data: 'deep data',
          array: [
            { id: 1, func: () => 'test' },
            { id: 2, date: new Date() },
            { id: 3, buffer: Buffer.from('test') }
          ]
        }
      }
    },
    metadata: {
      created: new Date(),
      version: '1.0.0',
      _private: 'should be skipped',
      constructor: 'should be skipped'
    }
  };
  
  try {
    const cleaned = cleanDataForSerialization(testData);
    const serialized = JSON.stringify(cleaned);
    const parsed = JSON.parse(serialized);
    
    console.log('   ✅ 复杂嵌套对象序列化成功');
    console.log(`   📊 序列化后大小: ${serialized.length} 字符`);
    console.log(`   📋 深层数据: ${cleaned.level1.level2.level3.data}`);
    console.log(`   📋 数组长度: ${cleaned.level1.level2.level3.array.length}`);
    console.log(`   📋 私有属性被跳过: ${!cleaned.metadata.hasOwnProperty('_private')}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ 复杂嵌套对象序列化失败: ${error.message}`);
    return false;
  }
}

// 测试大型Buffer处理
function testLargeBuffer() {
  console.log('\n5. 测试大型Buffer处理');
  
  const largeBuffer = Buffer.alloc(1000, 'A');
  const testData = {
    smallBuffer: Buffer.from('small'),
    largeBuffer: largeBuffer,
    data: 'other data'
  };
  
  try {
    const cleaned = cleanDataForSerialization(testData);
    const serialized = JSON.stringify(cleaned);
    const parsed = JSON.parse(serialized);
    
    console.log('   ✅ 大型Buffer处理成功');
    console.log(`   📋 小Buffer长度: ${cleaned.smallBuffer.length}, 截断: ${cleaned.smallBuffer.truncated || false}`);
    console.log(`   📋 大Buffer长度: ${cleaned.largeBuffer.length}, 截断: ${cleaned.largeBuffer.truncated}`);
    console.log(`   📊 序列化后大小: ${serialized.length} 字符`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ 大型Buffer处理失败: ${error.message}`);
    return false;
  }
}

// 测试模拟组播数据
function testMulticastData() {
  console.log('\n6. 测试模拟组播数据');
  
  // 模拟组播页面的数据结构
  const mockConfig = {
    address: '239.255.43.21',
    port: 10086,
    interfaceAddress: '0.0.0.0'
  };
  
  const mockStatus = {
    isListening: true,
    address: '239.255.43.21',
    port: 10086
  };
  
  const mockPackets = [
    {
      timestamp: Date.now(),
      source: '192.168.1.100',
      dataString: 'Test packet 1',
      size: 100,
      data: Buffer.from('test data 1') // 这个会被清理
    },
    {
      timestamp: Date.now() + 1000,
      source: '192.168.1.101',
      dataString: 'Test packet 2',
      size: 200,
      data: Buffer.from('test data 2') // 这个会被清理
    }
  ];
  
  const exportData = {
    config: mockConfig,
    status: mockStatus,
    packets: mockPackets,
    exportTime: new Date().toISOString(),
    totalPackets: mockPackets.length
  };
  
  try {
    const cleaned = cleanDataForSerialization(exportData);
    const serialized = JSON.stringify(cleaned);
    const parsed = JSON.parse(serialized);
    
    console.log('   ✅ 组播数据序列化成功');
    console.log(`   📊 数据包数量: ${cleaned.totalPackets}`);
    console.log(`   📊 序列化后大小: ${serialized.length} 字符`);
    console.log(`   📋 第一个数据包Buffer处理: ${cleaned.packets[0].data ? '已转换' : '已移除'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ 组播数据序列化失败: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  const tests = [
    { name: '基本数据类型', fn: testBasicTypes },
    { name: '特殊对象', fn: testSpecialObjects },
    { name: '循环引用', fn: testCircularReference },
    { name: '复杂嵌套对象', fn: testComplexNesting },
    { name: '大型Buffer处理', fn: testLargeBuffer },
    { name: '模拟组播数据', fn: testMulticastData }
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
      console.log(`   ❌ 测试 "${test.name}" 执行失败: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n=== 测试结果 ===');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有序列化测试通过！');
    console.log('\n💡 修复说明:');
    console.log('   - 添加了数据清理函数处理不可序列化对象');
    console.log('   - 处理循环引用问题');
    console.log('   - 转换Buffer为可序列化格式');
    console.log('   - 跳过私有属性和构造函数');
    console.log('   - 限制大型Buffer的序列化大小');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步调试');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  cleanDataForSerialization,
  testBasicTypes,
  testSpecialObjects,
  testCircularReference,
  testComplexNesting,
  testLargeBuffer,
  testMulticastData,
  runTests
};