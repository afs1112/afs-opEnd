/**
 * 导航软件集成测试
 * 测试无人机页面中打开导航软件的功能
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 导航软件集成测试');
console.log('='.repeat(50));

// 测试导航软件路径
const navPath = path.join(__dirname, '..', 'Nav', 'Nav.exe');
console.log(`📍 导航软件路径: ${navPath}`);

// 检查文件是否存在
if (!fs.existsSync(navPath)) {
    console.error('❌ 导航软件文件不存在');
    process.exit(1);
}

console.log('✅ 导航软件文件存在');

// 测试启动导航软件
console.log('\n🚀 测试启动导航软件...');

try {
    const child = spawn(navPath, [], {
        detached: true,
        stdio: 'pipe'
    });

    console.log(`✅ 导航软件进程已启动，PID: ${child.pid}`);

    // 监听输出
    child.stdout.on('data', (data) => {
        console.log(`📤 导航软件输出: ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`❌ 导航软件错误: ${data.toString().trim()}`);
    });

    // 5秒后终止进程
    setTimeout(() => {
        console.log('\n⏰ 5秒测试时间到，终止导航软件进程');
        child.kill();
        console.log('✅ 导航软件集成测试完成');
        process.exit(0);
    }, 5000);

    child.on('exit', (code) => {
        console.log(`📋 导航软件进程退出，退出码: ${code}`);
    });

} catch (error) {
    console.error('❌ 启动导航软件失败:', error.message);
    process.exit(1);
}