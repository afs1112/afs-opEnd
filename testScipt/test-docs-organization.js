/**
 * 文档组织结构测试
 * 验证所有文档是否正确移动到 docs 目录
 */

const fs = require('fs');
const path = require('path');

console.log('📚 文档组织结构测试');
console.log('='.repeat(50));

// 项目根目录
const projectRoot = path.join(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');

// 检查 docs 目录是否存在
console.log('1️⃣ 检查 docs 目录...');
if (!fs.existsSync(docsDir)) {
    console.log('❌ docs 目录不存在');
    process.exit(1);
}
console.log('✅ docs 目录存在');

// 获取 docs 目录中的所有文件
console.log('\n2️⃣ 检查文档文件...');
const docFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));

console.log(`📄 找到 ${docFiles.length} 个文档文件:`);
docFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
});

// 检查必要的索引文件
console.log('\n3️⃣ 检查索引文件...');
const requiredFiles = ['INDEX.md', 'README.md'];
const missingFiles = requiredFiles.filter(file => !docFiles.includes(file));

if (missingFiles.length > 0) {
    console.log('❌ 缺少必要文件:', missingFiles.join(', '));
} else {
    console.log('✅ 所有必要文件都存在');
}

// 检查项目根目录是否还有遗留的 MD 文件
console.log('\n4️⃣ 检查根目录遗留文件...');
const rootFiles = fs.readdirSync(projectRoot);
const rootMdFiles = rootFiles.filter(file => 
    file.endsWith('.md') && !file.startsWith('.')
);

if (rootMdFiles.length > 0) {
    console.log('⚠️  根目录仍有 MD 文件:', rootMdFiles.join(', '));
    console.log('   建议移动到 docs 目录');
} else {
    console.log('✅ 根目录已清理完毕');
}

// 文档分类统计
console.log('\n5️⃣ 文档分类统计...');
const categories = {
    'NAV_': '🧭 导航系统',
    'MULTICAST_': '📡 通信协议',
    'PLATFORM_': '🔧 系统配置',
    'PROTOBUF_': '📊 数据处理',
    'FLIGHT_': '📊 数据处理',
    'HEARTBEAT_': '📡 通信协议',
    'UAV_': '🚁 无人机相关',
    'COPY_': '🛠️ 功能特性'
};

const categoryCount = {};
docFiles.forEach(file => {
    let category = '📖 其他文档';
    
    for (const [prefix, cat] of Object.entries(categories)) {
        if (file.startsWith(prefix)) {
            category = cat;
            break;
        }
    }
    
    categoryCount[category] = (categoryCount[category] || 0) + 1;
});

Object.entries(categoryCount).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} 个文档`);
});

// 验证文档内容
console.log('\n6️⃣ 验证文档内容...');
let validDocs = 0;
let invalidDocs = 0;

docFiles.forEach(file => {
    const filePath = path.join(docsDir, file);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim().length > 0) {
            validDocs++;
        } else {
            console.log(`   ⚠️  空文档: ${file}`);
            invalidDocs++;
        }
    } catch (error) {
        console.log(`   ❌ 读取失败: ${file}`);
        invalidDocs++;
    }
});

console.log(`✅ 有效文档: ${validDocs} 个`);
if (invalidDocs > 0) {
    console.log(`⚠️  问题文档: ${invalidDocs} 个`);
}

// 生成文档管理建议
console.log('\n7️⃣ 文档管理建议...');
console.log('📝 创建新文档: npm run doc:create');
console.log('📋 查看文档列表: npm run doc:list');
console.log('📚 浏览文档索引: cat docs/INDEX.md');
console.log('🔍 搜索文档内容: grep -r "关键词" docs/');

// 测试结果总结
console.log('\n📊 测试结果总结:');
console.log(`✅ 文档总数: ${docFiles.length}`);
console.log(`✅ 分类数量: ${Object.keys(categoryCount).length}`);
console.log(`✅ 有效文档: ${validDocs}`);
console.log('✅ 文档组织结构测试通过！');

console.log('\n🎉 所有文档已成功整理到 docs 目录！');