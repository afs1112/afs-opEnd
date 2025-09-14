# 导航软件集成功能

## 功能概述

在无人机操作页面中新增了"打开导航软件"按钮，用户点击后可以启动应用程序同级目录下的导航软件 `Nav/Nav.exe`。

## 实现细节

### 1. 主进程 (main.ts)
- 添加了 `nav:openNavigation` IPC 处理程序
- 使用 `child_process.spawn` 启动外部程序
- 支持分离进程模式，导航软件独立运行
- 包含错误处理和文件存在性检查

### 2. 预加载脚本 (preload.ts)
- 在 `electronAPI` 中暴露 `nav.openNavigation()` 接口
- 提供类型安全的 API 调用

### 3. 类型定义 (electron.d.ts)
- 添加了导航相关的 TypeScript 类型定义
- 确保编译时类型检查

### 4. Vue 组件 (UavOperationPage.vue)
- 在任务控制区域添加"打开导航软件"按钮
- 实现 `openNavigation()` 函数处理按钮点击
- 集成操作日志记录和消息提示

## 文件结构

```
├── src/
│   ├── main/
│   │   ├── main.ts              # 主进程，添加导航软件启动逻辑
│   │   └── preload.ts           # 预加载脚本，暴露API
│   └── renderer/
│       ├── typings/
│       │   └── electron.d.ts    # 类型定义
│       └── views/pages/
│           └── UavOperationPage.vue  # 无人机页面，添加按钮
├── Nav/
│   └── Nav.exe                  # 导航软件可执行文件
└── testScipt/
    └── test-nav-integration.js  # 集成测试脚本
```

## 使用方法

1. 确保 `./Nav/Nav.exe` 文件存在且可执行
2. 在无人机操作页面点击"打开导航软件"按钮
3. 系统会启动导航软件并显示相应的状态消息

## 错误处理

- 如果导航软件文件不存在，会显示错误消息
- 如果启动失败，会记录错误日志并提示用户
- 所有操作都会在操作日志中记录

## 测试

运行集成测试：
```bash
node testScipt/test-nav-integration.js
```

## 技术特点

- **跨平台兼容**: 支持 Windows (.exe) 和 macOS/Linux 可执行文件
- **进程分离**: 导航软件作为独立进程运行，不影响主应用
- **错误处理**: 完善的错误检查和用户反馈
- **类型安全**: 完整的 TypeScript 类型定义
- **用户体验**: 集成操作日志和消息提示

## 部署结构

### 开发环境
```
项目根目录/
├── src/
├── Nav/
│   └── Nav.exe
└── package.json
```

### Windows 生产环境
```
安装目录/
├── MyApp.exe
├── Nav/
│   └── Nav.exe
└── resources/
```

### macOS 生产环境
```
应用程序目录/
├── MyApp.app/
└── Nav/
    └── Nav.exe
```

## 路径解析逻辑

- **开发模式**: 使用项目根目录
- **Windows 打包**: 使用可执行文件所在目录
- **macOS 打包**: 使用 .app 文件的父目录

## 注意事项

1. 确保 Nav 目录与主程序可执行文件在同一级目录
2. 确保导航软件文件具有执行权限
3. 导航软件启动后会作为独立进程运行
4. 路径解析会自动适配不同的部署环境