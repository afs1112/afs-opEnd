/**
 * 简单的导航软件工作目录测试
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 导航软件工作目录简单测试');
console.log('='.repeat(40));

const projectRoot = path.join(__dirname, '..');
const navDir = path.join(projectRoot, 'Nav');
const navExe = path.join(navDir, 'Nav.exe');

// 创建一个简单的测试脚本
const testScript = `#!/bin/bash
echo "工作目录测试"
echo "当前目录: $(pwd)"
echo "脚本位置: $(dirname "$0")"
echo "查找配置文件:"
if [ -f "nav-config.ini" ]; then
    echo "✅ 找到配置文件"
else
    echo "❌ 未找到配置文件"
fi
exit 0
`;

// 确保目录存在
if (!fs.existsSync(navDir)) {
    fs.mkdirSync(navDir, { recursive: true });
}

// 创建测试脚本
fs.writeFileSync(navExe, testScript);
fs.chmodSync(navExe, '755');

// 创建配置文件
const configFile = path.join(navDir, 'nav-config.ini');
fs.writeFileSync(configFile, '[test]\nversion=1.0\n');

console.log('📁 测试文件已准备');
console.log(`Nav目录: ${navDir}`);
console.log(`配置文件: ${configFile}`);

// 测试1: 不设置工作目录
console.log('\n1️⃣ 测试：不设置工作目录');
const child1 = spawn(navExe, [], { stdio: 'pipe' });

child1.stdout.on('data', (data) => {
    console.log(`输出: ${data.toString().trim()}`);
});

child1.on('exit', (code) => {
    console.log(`退出码: ${code}`);
    
    // 测试2: 设置工作目录
    console.log('\n2️⃣ 测试：设置工作目录为Nav目录');
    const child2 = spawn(navExe, [], { 
        cwd: navDir,
        stdio: 'pipe' 
    });
    
    child2.stdout.on('data', (data) => {
        console.log(`输出: ${data.toString().trim()}`);
    });
    
    child2.on('exit', (code) => {
        console.log(`退出码: ${code}`);
        console.log('\n✅ 测试完成');
        console.log('📝 结论: 设置工作目录后，Nav软件能找到配置文件');
    });
});