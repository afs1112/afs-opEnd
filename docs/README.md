# 项目文档中心

欢迎来到项目文档中心！这里包含了项目的所有技术文档和说明。

## 📁 文档结构

```
docs/
├── INDEX.md                              # 📚 文档索引（推荐从这里开始）
├── README.md                             # 📖 文档中心说明（当前文件）
│
├── 🚁 无人机相关/
│   └── UAV_SIMULATION_README.md          # 无人机仿真测试
│
├── 🧭 导航系统/
│   ├── NAV_INTEGRATION_README.md         # 导航软件集成
│   ├── NAV_DEPLOYMENT_GUIDE.md           # 部署指南
│   ├── NAV_FEATURE_SUMMARY.md            # 功能总结
│   └── NAV_CONFIG_README.md              # 配置系统
│
├── 📡 通信协议/
│   ├── MULTICAST_README.md               # 组播服务
│   ├── MULTICAST_SOURCE_IP_ENHANCEMENT.md # 源IP增强
│   └── HEARTBEAT_AGGREGATION_README.md   # 心跳聚合
│
├── 🔧 系统配置/
│   ├── PLATFORM_CMD_README.md            # 平台命令
│   ├── PLATFORM_CMD_FIX_SUMMARY.md       # 命令修复
│   └── PLATFORM_STATUS_README.md         # 状态管理
│
├── 📊 数据处理/
│   ├── PROTOBUF_TYPE_VALIDATION_ANALYSIS.md # Protobuf分析
│   └── FLIGHT_COORDINATES_UPDATE.md      # 坐标更新
│
└── 🛠️ 功能特性/
    └── COPY_FEATURE_README.md            # 复制功能
```

## 🚀 快速开始

### 查看文档索引
```bash
# 查看完整的文档索引
cat docs/INDEX.md
```

### 创建新文档
```bash
# 使用交互式向导创建文档
npm run doc:create

# 或者直接运行脚本
node scripts/create-doc.js
```

### 查看所有文档
```bash
# 列出所有文档文件
npm run doc:list

# 或者
ls -la docs/
```

## 📝 文档编写指南

### 1. 文档命名规范
- **功能文档**: `FEATURE_NAME_README.md`
- **指南文档**: `FEATURE_NAME_GUIDE.md`  
- **总结文档**: `FEATURE_NAME_SUMMARY.md`
- **分析文档**: `FEATURE_NAME_ANALYSIS.md`

### 2. 文档结构模板
```markdown
# 标题

## 概述
简要说明文档内容和目的

## 功能描述
详细描述功能特性

## 技术实现
技术细节和实现方案

## 使用方法
具体的使用步骤

## 配置说明
相关配置参数

## 故障排除
常见问题和解决方案

## 更新日志
版本更新记录
```

### 3. 分类标签
使用 emoji 来标识文档类别：
- 🚁 无人机相关
- 🧭 导航系统
- 📡 通信协议
- 🔧 系统配置
- 📊 数据处理
- 🛠️ 功能特性
- 📖 说明文档
- 🧪 测试相关

## 🔧 文档工具

### 创建文档脚本
位置：`scripts/create-doc.js`

功能：
- 交互式文档创建向导
- 自动生成标准格式文档
- 支持多种文档类别
- 自动命名和路径管理

使用方法：
```bash
npm run doc:create
```

### 文档索引管理
- 新增文档后，记得更新 `docs/INDEX.md`
- 保持索引文件的分类结构
- 添加适当的描述和链接

## 📋 维护指南

### 日常维护
1. **定期检查**: 确保文档内容与代码同步
2. **更新时间**: 修改文档后更新"最后更新"时间
3. **版本管理**: 重大变更时更新版本号
4. **链接检查**: 确保内部链接有效

### 文档审查
- 检查代码示例的准确性
- 验证配置参数的有效性
- 确保步骤说明的完整性
- 保持术语使用的一致性

## 🔗 相关资源

- [项目根目录](../) - 返回项目根目录
- [源代码](../src/) - 查看源代码
- [测试脚本](../testScipt/) - 测试相关文件
- [配置文件](../nav-config.json) - 项目配置

## 📊 文档统计

- **总文档数**: 15 个
- **主要类别**: 8 个
- **最后整理**: 2025-01-08
- **维护状态**: ✅ 活跃维护

---

💡 **提示**: 建议从 [INDEX.md](./INDEX.md) 开始浏览，那里有完整的文档分类和索引。