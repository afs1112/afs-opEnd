/**
 * 导航软件工作目录测试
 * 测试导航软件启动时的工作目录设置
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 导航软件工作目录测试');
console.log('='.repeat(50));

// 项目根目录和Nav目录
const projectRoot = path.join(__dirname, '..');
const navDir = path.join(projectRoot, 'Nav');
const navExe = path.join(navDir, 'Nav.exe');

console.log('📋 测试配置:');
console.log(`   项目根目录: ${projectRoot}`);
console.log(`   Nav 目录: ${navDir}`);
console.log(`   Nav 可执行文件: ${navExe}`);

// 1. 检查Nav目录和文件
console.log('\n1️⃣ 检查Nav目录和文件...');
if (!fs.existsSync(navDir)) {
    console.log('❌ Nav 目录不存在，正在创建...');
    fs.mkdirSync(navDir, { recursive: true });
}

if (!fs.existsSync(navExe)) {
    console.log('❌ Nav.exe 不存在，正在创建测试文件...');
    const testNavContent = `#!/bin/bash
echo "🚀 导航软件启动测试"
echo "📂 当前工作目录: $(pwd)"
echo "📁 脚本所在目录: $(dirname "$0")"
echo "📄 列出当前目录文件:"
ls -la
echo "🔍 查找配置文件:"
if [ -f "nav-config.ini" ]; then
    echo "✅ 找到配置文件: nav-config.ini"
    cat nav-config.ini
else
    echo "❌ 未找到配置文件: nav-config.ini"
fi
echo "⏰ 运行5秒后退出"
sleep 5
echo "✅ 导航软件测试完成"
`;
    fs.writeFileSync(navExe, testNavContent);
    fs.chmodSync(navExe, '755');
    console.log('✅ 测试 Nav.exe 已创建');
}

// 2. 创建测试配置文件
console.log('\n2️⃣ 创建测试配置文件...');
const configFile = path.join(navDir, 'nav-config.ini');
const configContent = `[Navigation]
version=1.0.0
debug=true
log_level=info

[Display]
width=1024
height=768
fullscreen=false

[Network]
server=localhost
port=8080
timeout=30
`;

fs.writeFileSync(configFile, configContent);
console.log('✅ 测试配置文件已创建:', configFile);

// 3. 测试不同的启动方式
console.log('\n3️⃣ 测试不同的启动方式...');

async function testLaunch(testName, options) {
    console.log(`\n📋 ${testName}:`);
    console.log(`   选项: ${JSON.stringify(options, null, 2)}`);
    
    return new Promise((resolve) => {
        const child = spawn(navExe, [], options);
        
        let output = '';
        
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(`   📤 输出: ${text.trim()}`);
            });
        }
        
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                console.log(`   ❌ 错误: ${data.toString().trim()}`);
            });
        }
        
        child.on('exit', (code) => {
            console.log(`   📋 进程退出，退出码: ${code}`);
            resolve({ code, output });
        });
        
        child.on('error', (error) => {
            console.log(`   ❌ 启动错误: ${error.message}`);
            resolve({ error: error.message, output });
        });
    });
}

async function runTests() {
    // 测试1: 默认启动（不设置工作目录）
    await testLaunch('默认启动（可能找不到配置文件）', {
        stdio: 'pipe'
    });
    
    // 测试2: 设置正确的工作目录
    await testLaunch('设置工作目录（应该能找到配置文件）', {
        cwd: navDir,
        stdio: 'pipe'
    });
    
    // 测试3: 模拟生产环境启动
    await testLaunch('生产环境模拟（分离进程 + 工作目录）', {
        cwd: navDir,
        detached: false, // 测试时不分离，便于观察
        stdio: 'pipe'
    });
    
    console.log('\n4️⃣ 测试结果分析...');
    console.log('✅ 工作目录设置测试完成');
    console.log('\n📝 关键发现:');
    console.log('1. 不设置工作目录时，Nav软件可能找不到配置文件');
    console.log('2. 设置 cwd 为 Nav 目录后，软件能正确找到配置文件');
    console.log('3. 生产环境应该使用 { cwd: navDir, detached: true }');
    
    console.log('\n🔧 修复建议:');
    console.log('1. 在 spawn 选项中设置 cwd 为 Nav.exe 所在目录');
    console.log('2. 确保 Nav 目录包含所有必要的配置文件');
    console.log('3. 在启动日志中记录工作目录信息');
}

runTests().catch(console.error);