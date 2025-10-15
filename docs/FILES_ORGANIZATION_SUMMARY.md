# 文件整理说明

## 📁 整理日期

2025-10-15

## 📋 整理内容

### 1. 文档文件整理

已将根目录下的所有文档文件移动到 `docs/` 目录：

#### 功能实现文档

- ✅ 所有 `.md` 文档（包括功能实现、优化报告、修复总结等）
- ✅ 所有 `.json` 报告文件（评估报告、优化报告等）
- ✅ 所有 `.log` 日志文件（测试日志、验证日志等）
- ✅ 所有 `.csv` 数据文件（导出样例等）

#### 保留在根目录的配置文件

- ✅ `package.json` - NPM 包配置
- ✅ `electron-builder.json` - Electron 构建配置
- ✅ `nav-config.json` - 导航配置
- ✅ `vite.config.js` - Vite 构建配置
- ✅ `postcss.config.mjs` - PostCSS 配置

### 2. 测试文件整理

已将根目录下的所有测试脚本移动到 `testScipt/` 目录：

- ✅ 所有 `test-*.js` 测试文件
- ✅ 所有 `verify-*.js` 验证文件
- ✅ `monitor-irradiation-duration.js` - 照射时长监控脚本
- ✅ `quick-verify-flight-time-fix.js` - 快速验证脚本

### 3. 目录结构

```
opEnd/
├── docs/              # 📚 所有项目文档
│   ├── *.md          # Markdown 文档
│   ├── *.json        # JSON 报告
│   ├── *.log         # 测试日志
│   └── *.csv         # 数据文件
├── testScipt/        # 🧪 所有测试脚本
│   ├── test-*.js     # 测试脚本
│   ├── verify-*.js   # 验证脚本
│   └── monitor-*.js  # 监控脚本
├── src/              # 💻 源代码
├── scripts/          # 🔧 构建脚本
├── mockData/         # 🎭 模拟数据
└── Nav/              # 🧭 导航相关
```

## 📊 统计信息

- **文档总数**: ~76 个 Markdown 文件
- **测试脚本**: ~143 个 JavaScript 测试文件
- **报告文件**: ~5 个 JSON/CSV 报告文件
- **日志文件**: ~4 个测试日志文件

## ✅ 整理效果

1. **根目录更清爽**: 只保留必要的配置文件和目录
2. **文档集中管理**: 所有文档在 `docs/` 目录下便于查找
3. **测试统一存放**: 所有测试脚本在 `testScipt/` 目录下便于维护
4. **结构更清晰**: 项目结构一目了然

## 🔍 查找指南

### 查找文档

```bash
# 查找所有功能实现文档
ls docs/*-summary.md

# 查找所有优化报告
ls docs/*-optimization-*.md

# 查找所有修复报告
ls docs/*-fix-*.md

# 查找所有实现报告
ls docs/*-implementation-*.md
```

### 查找测试

```bash
# 查找特定功能的测试
ls testScipt/test-evaluation-*.js

# 查找所有验证脚本
ls testScipt/verify-*.js

# 查找所有监控脚本
ls testScipt/monitor-*.js
```

## 📝 注意事项

- 所有配置文件保持在根目录，确保项目正常运行
- 测试脚本的相对路径可能需要更新（如果有引用根目录的情况）
- 文档之间的引用链接保持不变
