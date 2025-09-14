# 文档使用指南

## 📚 如何使用项目文档

### 快速开始

1. **浏览文档索引**
   ```bash
   cat docs/INDEX.md
   ```

2. **查看所有文档**
   ```bash
   npm run doc:list
   # 或者
   ls -la docs/
   ```

3. **搜索文档内容**
   ```bash
   grep -r "关键词" docs/
   ```

### 创建新文档

使用交互式向导：
```bash
npm run doc:create
```

向导会引导你：
1. 输入文档标题
2. 输入文档描述
3. 选择文档类别
4. 自动生成标准格式文档

### 文档管理命令

```bash
# 创建新文档
npm run doc:create

# 查看文档列表
npm run doc:list

# 测试文档组织结构
node testScipt/test-docs-organization.js
```

### 文档编辑最佳实践

1. **使用标准结构**
   - 概述
   - 功能描述
   - 技术实现
   - 使用方法
   - 配置说明
   - 故障排除
   - 更新日志

2. **保持更新**
   - 修改代码时同步更新文档
   - 更新"最后更新"时间
   - 记录版本变更

3. **分类管理**
   - 使用正确的 emoji 标签
   - 按功能模块分类
   - 更新索引文件

### 文档查找技巧

1. **按类别查找**
   - 🚁 无人机相关
   - 🧭 导航系统
   - 📡 通信协议
   - 🔧 系统配置
   - 📊 数据处理
   - 🛠️ 功能特性

2. **按文件名查找**
   ```bash
   find docs/ -name "*NAV*" -type f
   ```

3. **按内容搜索**
   ```bash
   grep -r "导航软件" docs/
   ```

## 🔧 维护工具

### 文档创建脚本
- 位置：`scripts/create-doc.js`
- 功能：交互式创建标准格式文档
- 使用：`npm run doc:create`

### 文档验证脚本
- 位置：`testScipt/test-docs-organization.js`
- 功能：验证文档结构和完整性
- 使用：`node testScipt/test-docs-organization.js`

---

💡 **提示**: 所有新的 MD 文档都应该放在 `docs/` 目录下，便于统一管理和查找。