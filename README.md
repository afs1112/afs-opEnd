

# 设备模拟操作端 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron 28](https://img.shields.io/badge/Electron-28-9FEAF9.svg?logo=electron)](https://www.electronjs.org)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D.svg?logo=vuedotjs)](https://vuejs.org)
[![TypeScript Ready](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)

**基于Electron和Vue 3的设备模拟操作端** - 支持组播监听、protobuf解析、无人机通信协议等功能。

![{7E915174-6BEE-45A4-8E5C-82397882E431}](https://github.com/user-attachments/assets/a7928531-a4bc-4c9b-91df-ff7fc8aa7ebb)


## 主要功能 💡

设备模拟操作端的主要功能特性：
✅ **组播监听** - 支持UDP组播数据包监听  
✅ **Protobuf解析** - 支持多种无人机通信协议解析  
✅ **实时数据显示** - 实时显示接收到的数据包信息  
✅ **数据导出** - 支持数据导出和清空功能  
✅ **环境配置** - 支持通过配置文件设置组播参数  
✅ **调试面板** - 内置开发者工具和调试功能

## 核心功能 ✨

### 🛡️ 核心架构
- Electron 28 + Vue 3 + Vite + TypeScript 
- 安全的IPC通信机制
- 原生模块支持 (SQLite3, UDP组播)
- 多环境配置支持 (开发/生产)

### 📡 组播监听
- UDP组播数据包监听
- 实时数据包解析和显示
- 支持多种协议格式
- 数据包统计和日志

### 🔍 Protobuf解析
- 支持多种无人机通信协议
- 实时protobuf数据解析
- 结构化数据显示
- 协议类型识别

### 🎛️ 生产优化
- Electron-builder配置:
  - 自动更新支持
  - 代码签名准备
  - 跨平台构建 (Windows/Mac/Linux)
  - 资源压缩 (asar)
- 性能监控钩子
- 内存泄漏检测

### 🎨 前端特性
- 现代化UI设计
- 响应式布局组件
- 错误边界处理
- 可定制化插件架构
- 深色/浅色主题支持

## 快速开始 🚀

### 系统要求
- Node.js 18+ (推荐LTS版本)
- npm 9+ 或 yarn 1.22+
- Python 3.10+ (用于node-gyp编译)
- 构建工具:
  - **Windows**: Visual Studio Build Tools
  - **Mac**: Xcode Command Line Tools
  - **Linux**: build-essential

### 安装和运行
```bash
# 克隆项目
git clone <repository-url>
cd opEnd

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建生产版本
npm run build

# 启动应用
npm start
```

## 协议配置 📡

### 组播配置
在 `config.env` 文件中配置组播参数：

```ini
# 组播配置
MULTICAST_ADDRESS=239.255.43.21
MULTICAST_PORT=10086
INTERFACE_ADDRESS=0.0.0.0

# 应用配置
NODE_ENV=development
```

### 通信协议格式
数据包格式：`0xAA 0x55 + ProtocolID + PackageType + Size + ProtobufData`

- **包头**: 0xAA 0x55 (固定)
- **ProtocolID**: 协议ID (0或1代表两个飞机)
- **PackageType**: 包类型
- **Size**: Protobuf数据长度 (4字节小端序)
- **ProtobufData**: 实际的protobuf数据

### 支持的协议类型
- **0x01**: 飞行状态信息 (UavFlyStatusInfo)
- **0x20**: 航线上传 (UavRouteUpload)
- **0x21**: 安全边界控制 (UavSecurityBoundaryControl)
- **0x22**: 定点导航 (UavFixedPointNavigation)
- **0x23**: 靶场点选择 (UavRangePointSelect)
- **0x24**: 导航回复信息 (UavNavReplyInfo)
- **0x25**: 航线上传回复 (UavRouteUploadReply)
- **0x26**: 导航模式请求 (UavNavModeRequest)
- **0x27**: 定位模式请求 (UavPositioningModeRequest)
- **0x28**: 回收航线命令 (UavRecoveryrouteCmd)
## 测试和调试 🧪

### 测试脚本
项目提供了多个测试脚本来验证功能：

```bash
# 测试新的协议格式
node test-new-protocol.js

# 测试组播监听
node test-multicast.js

# 测试protobuf数据发送
node test-protobuf-multicast.js
```

### 调试面板
在应用运行时，可以通过以下方式打开调试面板：

1. **键盘快捷键**: 
   - macOS: `Cmd + Option + I` 或 `F12`
   - Windows/Linux: `Ctrl + Shift + I` 或 `F12`

2. **菜单栏**: 
   - 点击 "开发" -> "打开开发者工具"

3. **强制重新加载**: 
   - 点击 "开发" -> "强制重新加载"

## 项目结构 🏗️

```
opEnd/
├── src/
│   ├── main/	# Electron主进程
│   │   ├── database/	# SQLite3数据库
│   │   │   ├── migrations/	# 数据库迁移
│   │   │   └── seeds/	# 初始数据
│   │   ├── services/	# 服务层
│   │   │   ├── multicast.service.ts	# 组播监听服务
│   │   │   └── protobuf-parser.service.ts	# Protobuf解析服务
│   │   ├── main.ts	# 主进程入口
│   │   └── preload.ts	# 预加载脚本
│   │
│   ├── protobuf/	# Protobuf定义文件
│   │   ├── PublicStruct.proto	# 公共结构
│   │   ├── UavFlyStatusStruct.proto	# 飞行状态协议
│   │   ├── UavNavMonitorStruct.proto	# 导航监控协议
│   │   └── UavFlyMonitorStruct.proto	# 飞行监控协议
│   │
│   └── renderer/	# Vue 3渲染进程
│       ├── assets/	# 静态资源
│       ├── services/	# 前端服务
│       ├── typings/	# TypeScript类型定义
│       └── views/	# 页面组件
│           └── pages/
│               └── MulticastPage.vue	# 组播监听页面
│
├── config.env	# 环境配置文件
├── electron-builder.json	# 打包配置
└── package.json	# 项目配置
```

## Database Operations Example 💾

### 1. Create Migration

```typescript
// src/main/database/migrations/20240520_create_users.ts
import type { Database } from 'sqlite3';

export const up = (db: Database) => {
  db.exec(` CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(name) > 2),
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_users_email ON users(email); `);
};

export const down = (db: Database) => {
  db.exec('DROP TABLE IF EXISTS users');
};
```

### 2. Run Migrations

```bash
yarn postinstall
```
### 3. Type-safe CRUD Operations

```typescript

// src/renderer/services/userService.ts
interface User {
  id?: number;
  name: string;
  email: string;
}

export const UserService = {
  async create(user: User) {
    const { lastID } = await db.run(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [user.name, user.email]
    );
    return this.getById(lastID);
  },

  async getById(id: number) {
    return db.get<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
  }
}
```

## Advanced Configuration ⚙️

### Environment Variables

Create  `.env`  file:

```ini
# Main Process
VITE_APP_NAME="My Electron App"
VITE_APP_VERSION=1.0.0

# Database
VITE_DB_NAME=application.db
VITE_DB_ENCRYPTION_KEY=your-secure-key
```

### Build Targets

```bash
# Build for current platform
yarn build

# Build Windows x64
yarn build:win

# Build Linux AppImage
yarn build:linux

# Build macOS universal
yarn build:mac
```

## Best Practices Checklist ✅

1.  **IPC Security**
    
    -   Validate all IPC arguments with Zod
        
    -   Use dedicated channels for sensitive operations
        
    -   Implement rate limiting for high-frequency events
        
2.  **Database Optimization**
    
    -   Use transactions for bulk operations
        
    -   Enable WAL mode for concurrent access
        
    -   Regular vacuum operations for space reclaim
        
3.  **Performance**
    
    -   Freeze Vue non-reactive data
        
    -   Use Web Workers for CPU-heavy tasks
        
    -   Implement main/renderer process monitoring
        
4.  **Packaging**
    
    -   Sign binaries for all target platforms
        
    -   Use environment-specific builds
        
    -   Obfuscate sensitive code areas

## License 📄

Distributed under the MIT License. See  `LICENSE`  for more information.
