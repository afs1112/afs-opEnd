# 项目文档索引

本文件夹包含项目的所有技术文档，按功能模块分类整理。

## 📚 文档分类

### 🚁 无人机相关
- [UAV_SIMULATION_README.md](./UAV_SIMULATION_README.md) - 无人机仿真测试文档

### 🧭 导航软件集成
- [NAV_INTEGRATION_README.md](./NAV_INTEGRATION_README.md) - 导航软件集成技术文档
- [NAV_DEPLOYMENT_GUIDE.md](./NAV_DEPLOYMENT_GUIDE.md) - 导航软件部署指南
- [NAV_FEATURE_SUMMARY.md](./NAV_FEATURE_SUMMARY.md) - 导航功能总结
- [NAV_CONFIG_README.md](./NAV_CONFIG_README.md) - 导航配置系统文档

### 📡 组播通信
- [MULTICAST_README.md](./MULTICAST_README.md) - 组播服务基础文档
- [MULTICAST_SOURCE_IP_ENHANCEMENT.md](./MULTICAST_SOURCE_IP_ENHANCEMENT.md) - 组播源IP增强
- [HEARTBEAT_AGGREGATION_README.md](./HEARTBEAT_AGGREGATION_README.md) - 心跳聚合功能

### 🔧 平台命令
- [PLATFORM_CMD_README.md](./PLATFORM_CMD_README.md) - 平台命令系统
- [PLATFORM_CMD_FIX_SUMMARY.md](./PLATFORM_CMD_FIX_SUMMARY.md) - 平台命令修复总结
- [PLATFORM_STATUS_README.md](./PLATFORM_STATUS_README.md) - 平台状态管理

### 📊 数据协议
- [PROTOBUF_TYPE_VALIDATION_ANALYSIS.md](./PROTOBUF_TYPE_VALIDATION_ANALYSIS.md) - Protobuf 类型验证分析
- [FLIGHT_COORDINATES_UPDATE.md](./FLIGHT_COORDINATES_UPDATE.md) - 飞行坐标更新

### 🛠️ 功能特性
- [COPY_FEATURE_README.md](./COPY_FEATURE_README.md) - 复制功能文档

### 📖 项目说明
- [README.md](./README.md) - 项目主要说明文档
- [DOCS_USAGE_GUIDE.md](./DOCS_USAGE_GUIDE.md) - 文档使用指南

## 📝 文档编写规范

### 文件命名规范
- 使用大写字母和下划线命名：`FEATURE_NAME_README.md`
- 功能文档以 `_README.md` 结尾
- 指南文档以 `_GUIDE.md` 结尾
- 总结文档以 `_SUMMARY.md` 结尾
- 分析文档以 `_ANALYSIS.md` 结尾

### 文档结构规范
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

### 文档分类标签
使用 emoji 标签来快速识别文档类型：
- 🚁 无人机相关
- 🧭 导航系统
- 📡 通信协议
- 🔧 系统配置
- 📊 数据处理
- 🛠️ 功能特性
- 📖 说明文档
- 🧪 测试相关

## 📋 文档维护

### 新增文档
1. 在 `docs/` 目录下创建新的 MD 文件
2. 按照命名规范命名文件
3. 使用标准的文档结构
4. 更新本索引文件

### 更新文档
1. 修改对应的 MD 文件
2. 更新文档中的"最后更新"时间
3. 如有重大变更，更新版本号

### 文档审查
- 定期检查文档的准确性
- 确保代码示例可以正常运行
- 保持文档与实际功能同步

## 🔗 相关链接

- [项目根目录](../) - 返回项目根目录
- [源代码](../src/) - 查看源代码
- [测试脚本](../testScipt/) - 查看测试脚本
- [配置文件](../nav-config.json) - 导航配置文件

---

**文档总数**: 17 个  
**最后更新**: 2025-01-08  
**维护者**: 项目开发团队