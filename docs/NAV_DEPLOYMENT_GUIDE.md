# 导航软件部署指南

## 概述

本指南说明如何在不同环境下正确部署导航软件，确保应用程序能够找到并启动 Nav.exe。

## 部署步骤

### 1. 开发环境部署

在项目根目录创建 Nav 文件夹：

```bash
# 在项目根目录执行
mkdir Nav
# 将 Nav.exe 放入 Nav 目录
cp /path/to/your/Nav.exe Nav/
```

目录结构：
```
your-project/
├── src/
├── Nav/
│   └── Nav.exe          # 导航软件
├── package.json
└── ...
```

### 2. Windows 生产环境部署

将 Nav 文件夹放在应用程序可执行文件的同级目录：

```
C:\Program Files\YourApp\
├── YourApp.exe          # 主程序
├── Nav/
│   └── Nav.exe          # 导航软件
├── resources/
└── ...
```

### 3. macOS 生产环境部署

将 Nav 文件夹放在 .app 文件的同级目录：

```
/Applications/
├── YourApp.app/         # 主程序包
└── Nav/
    └── Nav.exe          # 导航软件
```

## 自动化部署

### 使用 electron-builder 配置

在 `electron-builder.json` 中添加额外资源配置：

```json
{
  "extraResources": [
    {
      "from": "Nav",
      "to": "../Nav",
      "filter": ["**/*"]
    }
  ]
}
```

### 使用构建脚本

创建 `scripts/copy-nav.js`：

```javascript
const fs = require('fs-extra');
const path = require('path');

async function copyNavFiles() {
  const source = path.join(__dirname, '..', 'Nav');
  const target = path.join(__dirname, '..', 'dist', 'Nav');
  
  try {
    await fs.copy(source, target);
    console.log('✅ Nav 文件复制成功');
  } catch (error) {
    console.error('❌ Nav 文件复制失败:', error);
  }
}

copyNavFiles();
```

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "postbuild": "node scripts/copy-nav.js"
  }
}
```

## 验证部署

### 1. 检查文件存在

```bash
# Windows
dir "C:\Program Files\YourApp\Nav\Nav.exe"

# macOS/Linux
ls -la "/Applications/Nav/Nav.exe"
```

### 2. 检查权限

```bash
# macOS/Linux
chmod +x "/Applications/Nav/Nav.exe"
```

### 3. 测试启动

在应用程序中点击"打开导航软件"按钮，检查：
- 是否显示成功消息
- 是否在操作日志中记录启动信息
- 导航软件是否实际启动

## 故障排除

### 常见问题

1. **文件不存在错误**
   - 检查 Nav 目录是否在正确位置
   - 检查文件名是否正确（Nav.exe）

2. **权限错误**
   - 确保 Nav.exe 有执行权限
   - 在 macOS 上运行 `chmod +x Nav.exe`

3. **路径错误**
   - 检查应用程序日志中的路径信息
   - 确认部署结构是否符合要求

### 调试信息

应用程序会在控制台输出详细的路径信息：

```
[Nav] 应用目录: /Applications
[Nav] 导航软件路径: /Applications/Nav/Nav.exe
[Nav] 导航软件已启动，PID: 12345
```

## 最佳实践

1. **版本管理**: 将 Nav 目录加入版本控制
2. **自动化**: 使用构建脚本自动复制文件
3. **测试**: 在不同环境下测试部署
4. **文档**: 为最终用户提供部署说明

## 支持的平台

- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Linux (Ubuntu, CentOS 等)

## 更新导航软件

1. 替换 Nav 目录中的 Nav.exe 文件
2. 重新启动主应用程序
3. 测试导航软件启动功能