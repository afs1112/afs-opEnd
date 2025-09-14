#!/usr/bin/env node

/**
 * 测试导航配置文件路径
 * 验证配置文件是否在正确的位置创建
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== 导航配置文件路径测试 ===\n');

// 模拟不同环境下的路径解析
function testConfigPath() {
  console.log('1. 测试路径解析逻辑');
  
  // 模拟开发环境
  const devPath = process.cwd();
  const devConfigPath = path.join(devPath, 'nav-config.json');
  console.log(`   开发环境配置路径: ${devConfigPath}`);
  
  // 模拟生产环境 (Windows)
  if (process.platform === 'win32') {
    const winExecPath = 'C:\\Program Files\\MyApp\\MyApp.exe';
    const winExecDir = path.dirname(winExecPath);
    const winConfigPath = path.join(winExecDir, 'nav-config.json');
    console.log(`   Windows生产环境配置路径: ${winConfigPath}`);
  }
  
  // 模拟生产环境 (macOS)
  if (process.platform === 'darwin') {
    const macExecPath = '/Applications/MyApp.app/Contents/MacOS/MyApp';
    const macExecDir = path.dirname(macExecPath); // Contents/MacOS
    const macContentsDir = path.dirname(macExecDir); // Contents
    const macAppDir = path.dirname(macContentsDir); // MyApp.app
    const macParentDir = path.dirname(macAppDir); // Applications
    const macConfigPath = path.join(macParentDir, 'nav-config.json');
    console.log(`   macOS生产环境配置路径: ${macConfigPath}`);
  }
  
  console.log('');
}

// 测试当前项目中的配置文件
function testCurrentConfig() {
  console.log('2. 测试当前项目配置文件');
  
  const projectConfigPath = path.join(process.cwd(), 'nav-config.json');
  console.log(`   项目配置文件路径: ${projectConfigPath}`);
  
  if (fs.existsSync(projectConfigPath)) {
    console.log('   ✅ 配置文件存在');
    try {
      const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
      console.log(`   📋 配置版本: ${config.version}`);
      console.log(`   📋 导航启用: ${config.navigation?.enabled}`);
      console.log(`   📋 相对路径: ${config.navigation?.relativePath}`);
    } catch (error) {
      console.log(`   ❌ 配置文件格式错误: ${error.message}`);
    }
  } else {
    console.log('   ⚠️  配置文件不存在');
  }
  
  console.log('');
}

// 测试创建配置文件
function testCreateConfig() {
  console.log('3. 测试创建配置文件');
  
  const testConfigPath = path.join(process.cwd(), 'test-nav-config.json');
  
  const defaultConfig = {
    navigation: {
      enabled: true,
      relativePath: "Nav/Nav.exe",
      description: "导航软件配置",
      fallbackPaths: [
        "Nav/Nav.exe",
        "Navigation/Nav.exe",
        "../Nav/Nav.exe",
        "./external/Nav/Nav.exe"
      ],
      platform: {
        win32: {
          executable: "Nav.exe",
          relativePath: "Nav/Nav.exe"
        },
        darwin: {
          executable: "Nav.exe",
          relativePath: "Nav/Nav.exe"
        },
        linux: {
          executable: "Nav",
          relativePath: "Nav/Nav"
        }
      },
      startupOptions: {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
        setWorkingDirectory: true,
        inheritEnv: true
      },
      timeout: 5000,
      retryAttempts: 3
    },
    logging: {
      enabled: true,
      level: "info"
    },
    version: "1.0.0",
    lastModified: new Date().toISOString().split('T')[0]
  };
  
  try {
    fs.writeFileSync(testConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    console.log(`   ✅ 测试配置文件创建成功: ${testConfigPath}`);
    
    // 验证文件内容
    const savedConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    console.log(`   ✅ 配置文件验证成功，版本: ${savedConfig.version}`);
    
    // 清理测试文件
    fs.unlinkSync(testConfigPath);
    console.log(`   🧹 测试文件已清理`);
    
  } catch (error) {
    console.log(`   ❌ 创建配置文件失败: ${error.message}`);
  }
  
  console.log('');
}

// 运行所有测试
async function runTests() {
  testConfigPath();
  testCurrentConfig();
  testCreateConfig();
  
  console.log('=== 测试完成 ===');
  console.log('');
  console.log('📝 说明:');
  console.log('   - 开发环境: 配置文件在项目根目录');
  console.log('   - 生产环境: 配置文件在可执行文件同级目录');
  console.log('   - macOS: 配置文件在 .app 包的父目录');
  console.log('   - Windows/Linux: 配置文件在 .exe 文件同级目录');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testConfigPath,
  testCurrentConfig,
  testCreateConfig,
  runTests
};