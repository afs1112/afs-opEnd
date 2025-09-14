/**
 * 导航软件路径逻辑测试
 * 测试在不同环境下的路径解析
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 导航软件路径逻辑测试');
console.log('='.repeat(50));

// 模拟不同的环境变量
const scenarios = [
  {
    name: '开发模式',
    isPackaged: false,
    platform: 'darwin',
    execPath: '/Users/user/project/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron',
    appPath: '/Users/user/project'
  },
  {
    name: 'macOS 生产模式',
    isPackaged: true,
    platform: 'darwin',
    execPath: '/Applications/MyApp.app/Contents/MacOS/MyApp',
    appPath: '/Applications/MyApp.app/Contents/Resources/app.asar'
  },
  {
    name: 'Windows 生产模式',
    isPackaged: true,
    platform: 'win32',
    execPath: 'C:\\Program Files\\MyApp\\MyApp.exe',
    appPath: 'C:\\Program Files\\MyApp\\resources\\app.asar'
  }
];

function getAppDir(isPackaged, platform, execPath, appPath) {
  let appDir;
  
  if (isPackaged) {
    const execDir = path.dirname(execPath);
    
    if (platform === 'darwin') {
      // macOS: 可执行文件在 MyApp.app/Contents/MacOS/MyApp
      // execDir = /path/to/MyApp.app/Contents/MacOS
      // 需要回到 /path/to (MyApp.app 的父目录)
      const appBundle = path.dirname(path.dirname(execDir)); // 回到 MyApp.app
      appDir = path.dirname(appBundle); // 回到 MyApp.app 的父目录
    } else {
      // Windows/Linux: 可执行文件直接在应用程序目录
      appDir = execDir;
    }
  } else {
    // 开发模式：使用项目根目录
    appDir = appPath;
  }
  
  return appDir;
}

scenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   平台: ${scenario.platform}`);
  console.log(`   打包状态: ${scenario.isPackaged ? '已打包' : '开发模式'}`);
  console.log(`   可执行文件路径: ${scenario.execPath}`);
  console.log(`   app.getAppPath(): ${scenario.appPath}`);
  
  const appDir = getAppDir(scenario.isPackaged, scenario.platform, scenario.execPath, scenario.appPath);
  const navPath = path.join(appDir, 'Nav', 'Nav.exe');
  
  console.log(`   ✅ 计算出的应用目录: ${appDir}`);
  console.log(`   ✅ 导航软件路径: ${navPath}`);
});

console.log('\n📋 路径逻辑说明:');
console.log('- 开发模式: 使用项目根目录');
console.log('- macOS 生产模式: 从 .app/Contents/MacOS 回到 .app 的父目录');
console.log('- Windows 生产模式: 使用可执行文件所在目录');
console.log('\n✅ 路径逻辑测试完成');