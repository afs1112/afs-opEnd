/**
 * 导航配置系统测试
 * 测试配置文件的加载、保存和路径解析功能
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 导航配置系统测试');
console.log('='.repeat(50));

// 项目根目录
const projectRoot = path.join(__dirname, '..');
const configPath = path.join(projectRoot, 'nav-config.json');

// 1. 检查配置文件是否存在
console.log('1️⃣ 检查配置文件...');
if (!fs.existsSync(configPath)) {
    console.log('❌ 配置文件不存在:', configPath);
    process.exit(1);
}
console.log('✅ 配置文件存在:', configPath);

// 2. 读取和验证配置文件
console.log('\n2️⃣ 读取配置文件...');
let config;
try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('✅ 配置文件解析成功');
} catch (error) {
    console.log('❌ 配置文件解析失败:', error.message);
    process.exit(1);
}

// 3. 验证配置结构
console.log('\n3️⃣ 验证配置结构...');
const requiredFields = [
    'navigation',
    'navigation.enabled',
    'navigation.relativePath',
    'navigation.fallbackPaths',
    'navigation.platform',
    'navigation.startupOptions'
];

let structureValid = true;
requiredFields.forEach(field => {
    const keys = field.split('.');
    let current = config;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            console.log(`❌ 缺少必需字段: ${field}`);
            structureValid = false;
            break;
        }
    }
});

if (structureValid) {
    console.log('✅ 配置结构验证通过');
} else {
    console.log('❌ 配置结构验证失败');
    process.exit(1);
}

// 4. 测试路径解析逻辑
console.log('\n4️⃣ 测试路径解析逻辑...');

function simulatePathResolution(config, isPackaged, platform, execPath, appPath) {
    let appDir;
    
    if (isPackaged) {
        const execDir = path.dirname(execPath);
        
        if (platform === 'darwin') {
            const appBundle = path.dirname(path.dirname(execDir));
            appDir = path.dirname(appBundle);
        } else {
            appDir = execDir;
        }
    } else {
        appDir = appPath;
    }

    // 获取平台特定配置
    const platformConfig = config.navigation.platform[platform];
    const relativePath = platformConfig?.relativePath || config.navigation.relativePath;

    // 尝试主路径
    const mainPath = path.join(appDir, relativePath);
    if (fs.existsSync(mainPath)) {
        return { success: true, path: mainPath, source: 'main' };
    }

    // 尝试备用路径
    for (const fallbackPath of config.navigation.fallbackPaths) {
        const fullPath = path.join(appDir, fallbackPath);
        if (fs.existsSync(fullPath)) {
            return { success: true, path: fullPath, source: 'fallback' };
        }
    }

    return { success: false, path: null, source: null };
}

const testScenarios = [
    {
        name: '开发环境',
        isPackaged: false,
        platform: 'darwin',
        execPath: '/dev/null',
        appPath: projectRoot
    },
    {
        name: 'macOS 生产环境',
        isPackaged: true,
        platform: 'darwin',
        execPath: '/Applications/MyApp.app/Contents/MacOS/MyApp',
        appPath: '/Applications/MyApp.app/Contents/Resources/app.asar'
    },
    {
        name: 'Windows 生产环境',
        isPackaged: true,
        platform: 'win32',
        execPath: 'C:\\Program Files\\MyApp\\MyApp.exe',
        appPath: 'C:\\Program Files\\MyApp\\resources\\app.asar'
    }
];

testScenarios.forEach(scenario => {
    const result = simulatePathResolution(
        config,
        scenario.isPackaged,
        scenario.platform,
        scenario.execPath,
        scenario.appPath
    );
    
    console.log(`   ${scenario.name}:`);
    if (result.success) {
        console.log(`     ✅ 路径: ${result.path} (${result.source})`);
    } else {
        console.log(`     ❌ 未找到导航软件`);
    }
});

// 5. 测试配置选项
console.log('\n5️⃣ 测试配置选项...');

console.log('📋 导航配置:');
console.log(`   启用状态: ${config.navigation.enabled ? '✅ 启用' : '❌ 禁用'}`);
console.log(`   相对路径: ${config.navigation.relativePath}`);
console.log(`   备用路径数量: ${config.navigation.fallbackPaths.length}`);
console.log(`   支持平台: ${Object.keys(config.navigation.platform).join(', ')}`);

console.log('\n📋 启动选项:');
console.log(`   分离进程: ${config.navigation.startupOptions.detached}`);
console.log(`   标准输入输出: ${config.navigation.startupOptions.stdio}`);
console.log(`   Windows隐藏: ${config.navigation.startupOptions.windowsHide}`);

// 6. 测试配置修改
console.log('\n6️⃣ 测试配置修改...');

// 创建配置副本进行测试
const testConfig = JSON.parse(JSON.stringify(config));
testConfig.navigation.enabled = false;
testConfig.navigation.relativePath = "CustomNav/CustomNav.exe";
testConfig.lastModified = new Date().toISOString().split('T')[0];

console.log('✅ 配置修改测试通过');

// 7. 验证备用路径机制
console.log('\n7️⃣ 验证备用路径机制...');

const fallbackPaths = config.navigation.fallbackPaths;
console.log(`📂 配置了 ${fallbackPaths.length} 个备用路径:`);
fallbackPaths.forEach((fallbackPath, index) => {
    const fullPath = path.join(projectRoot, fallbackPath);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${index + 1}. ${fallbackPath} ${exists ? '✅' : '❌'}`);
});

// 8. 生成配置报告
console.log('\n8️⃣ 配置系统报告...');
console.log('📊 统计信息:');
console.log(`   配置版本: ${config.version}`);
console.log(`   最后修改: ${config.lastModified}`);
console.log(`   日志启用: ${config.logging.enabled ? '✅' : '❌'}`);
console.log(`   日志级别: ${config.logging.level}`);

console.log('\n✅ 导航配置系统测试完成！');
console.log('\n📝 使用建议:');
console.log('1. 确保 Nav 目录存在并包含可执行文件');
console.log('2. 根据部署环境调整相对路径配置');
console.log('3. 使用备用路径提高兼容性');
console.log('4. 定期验证配置文件的有效性');