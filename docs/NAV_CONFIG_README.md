# 导航软件配置系统

## 概述

导航软件配置系统允许用户通过配置文件灵活调整导航软件的路径和启动参数，支持多平台部署和备用路径机制。

## 配置文件

### 位置
配置文件 `nav-config.json` 会按以下优先级查找：
1. 应用程序目录下的 `nav-config.json`
2. 用户数据目录下的 `nav-config.json`

### 结构

```json
{
  "navigation": {
    "enabled": true,
    "relativePath": "Nav/Nav.exe",
    "description": "导航软件配置",
    "fallbackPaths": [
      "Nav/Nav.exe",
      "Navigation/Nav.exe",
      "../Nav/Nav.exe",
      "./external/Nav/Nav.exe"
    ],
    "platform": {
      "win32": {
        "executable": "Nav.exe",
        "relativePath": "Nav/Nav.exe"
      },
      "darwin": {
        "executable": "Nav.exe",
        "relativePath": "Nav/Nav.exe"
      },
      "linux": {
        "executable": "Nav",
        "relativePath": "Nav/Nav"
      }
    },
    "startupOptions": {
      "detached": true,
      "stdio": "ignore",
      "windowsHide": false
    },
    "timeout": 5000,
    "retryAttempts": 3
  },
  "logging": {
    "enabled": true,
    "level": "info"
  },
  "version": "1.0.0",
  "lastModified": "2025-01-08"
}
```

## 配置字段说明

### navigation 部分

- **enabled**: 是否启用导航软件功能
- **relativePath**: 主要的相对路径
- **description**: 配置描述
- **fallbackPaths**: 备用路径数组，按顺序尝试
- **platform**: 平台特定配置
  - **executable**: 可执行文件名
  - **relativePath**: 平台特定的相对路径
- **startupOptions**: 启动选项
  - **detached**: 是否分离进程
  - **stdio**: 标准输入输出处理方式
  - **windowsHide**: Windows 下是否隐藏窗口
- **timeout**: 启动超时时间（毫秒）
- **retryAttempts**: 重试次数

### logging 部分

- **enabled**: 是否启用日志
- **level**: 日志级别

## API 接口

### 主进程 IPC 接口

```typescript
// 启动导航软件
ipcMain.handle("nav:openNavigation", async () => Promise<{
  success: boolean;
  error?: string;
  message?: string;
  path?: string;
  pid?: number;
}>)

// 获取配置
ipcMain.handle("nav:getConfig", () => Promise<{
  success: boolean;
  config?: NavConfig;
  error?: string;
}>)

// 更新配置
ipcMain.handle("nav:updateConfig", (_, newConfig) => Promise<{
  success: boolean;
  message?: string;
  error?: string;
}>)

// 重置配置
ipcMain.handle("nav:resetConfig", () => Promise<{
  success: boolean;
  message?: string;
  error?: string;
}>)

// 验证配置
ipcMain.handle("nav:validateConfig", () => Promise<{
  success: boolean;
  validation?: { valid: boolean; errors: string[] };
  error?: string;
}>)

// 获取路径
ipcMain.handle("nav:getPath", () => Promise<{
  success: boolean;
  path?: string;
  exists?: boolean;
  error?: string;
}>)
```

### 渲染进程 API

```typescript
// 通过 electronAPI.nav 访问
window.electronAPI.nav.openNavigation()
window.electronAPI.nav.getConfig()
window.electronAPI.nav.updateConfig(config)
window.electronAPI.nav.resetConfig()
window.electronAPI.nav.validateConfig()
window.electronAPI.nav.getPath()
```

## 路径解析逻辑

### 应用程序目录获取

1. **开发模式**: 使用 `app.getAppPath()`
2. **Windows 生产模式**: 使用可执行文件所在目录
3. **macOS 生产模式**: 从 `.app/Contents/MacOS` 回到 `.app` 的父目录

### 路径查找顺序

1. 平台特定的 `relativePath`
2. 通用的 `relativePath`
3. 按顺序尝试 `fallbackPaths` 中的每个路径

## 使用方法

### 1. 基本配置

修改 `nav-config.json` 文件：

```json
{
  "navigation": {
    "enabled": true,
    "relativePath": "MyNav/MyNav.exe"
  }
}
```

### 2. 多路径配置

```json
{
  "navigation": {
    "relativePath": "Nav/Nav.exe",
    "fallbackPaths": [
      "Nav/Nav.exe",
      "Navigation/Nav.exe",
      "../Nav/Nav.exe",
      "C:/Program Files/Nav/Nav.exe"
    ]
  }
}
```

### 3. 平台特定配置

```json
{
  "navigation": {
    "platform": {
      "win32": {
        "executable": "Nav.exe",
        "relativePath": "Windows/Nav.exe"
      },
      "darwin": {
        "executable": "Nav.app",
        "relativePath": "macOS/Nav.app"
      },
      "linux": {
        "executable": "nav",
        "relativePath": "Linux/nav"
      }
    }
  }
}
```

### 4. 启动选项配置

```json
{
  "navigation": {
    "startupOptions": {
      "detached": false,
      "stdio": "pipe",
      "windowsHide": true
    }
  }
}
```

## UI 配置界面

使用 `NavConfigPanel.vue` 组件可以提供图形化的配置界面：

```vue
<template>
  <NavConfigPanel />
</template>

<script setup>
import NavConfigPanel from '@/components/NavConfigPanel.vue'
</script>
```

## 测试和验证

### 运行配置测试

```bash
node testScipt/test-nav-config.js
```

### 验证配置文件

```javascript
const result = await window.electronAPI.nav.validateConfig();
if (result.success && result.validation.valid) {
  console.log('配置验证通过');
} else {
  console.log('配置错误:', result.validation.errors);
}
```

### 测试路径解析

```javascript
const result = await window.electronAPI.nav.getPath();
console.log('导航软件路径:', result.path);
console.log('文件存在:', result.exists);
```

## 故障排除

### 常见问题

1. **配置文件不存在**
   - 系统会自动创建默认配置文件

2. **路径解析错误**
   - 检查 `relativePath` 是否正确
   - 尝试使用绝对路径进行测试

3. **导航软件启动失败**
   - 验证文件是否存在且有执行权限
   - 检查启动选项配置

### 调试信息

启用日志记录可以获得详细的调试信息：

```json
{
  "logging": {
    "enabled": true,
    "level": "debug"
  }
}
```

## 最佳实践

1. **版本控制**: 将配置文件加入版本控制
2. **备份**: 修改前备份配置文件
3. **测试**: 在不同环境下测试配置
4. **文档**: 为团队提供配置说明
5. **验证**: 定期验证配置文件的正确性

## 更新和维护

### 配置版本管理

配置文件包含版本信息，便于跟踪和管理：

```json
{
  "version": "1.0.0",
  "lastModified": "2025-01-08"
}
```

### 自动更新

系统会在保存配置时自动更新 `lastModified` 字段。

### 迁移支持

未来版本可以通过检查 `version` 字段来进行配置迁移。