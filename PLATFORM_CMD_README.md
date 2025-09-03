# 火炮操作页面 PlatformCmd 功能实现说明

## 📋 功能概述

已成功在火炮操作页面中实现了发送 PlatformCmd 平台控制命令的功能，支持火炮发射控制并使用用户输入的武器名称和目标名称。

## ✅ 已实现的功能

### 1. 界面增强
- 在发射按钮上方添加了两个输入框：
  - **武器名称输入框**：默认值为 "155毫米榴弹炮"
  - **目标名称输入框**：默认值为 "无人机-001"
- 发射按钮现在要求两个输入框都有内容才能启用
- 改进了界面布局，使用网格布局并排显示输入框

### 2. 后端服务
- 创建了新的组播发送服务 `MulticastSenderService`
- 自动加载 PlatformCmd.proto 和相关的 protobuf 定义
- 支持发送完整的 PlatformCmd 消息结构

### 3. 协议支持
- 在 protobuf 解析器中添加了 PackType_PlatformCmd (0x2A) 支持
- 实现了 PlatformCmd 消息的解析功能
- 支持 FireParam 子结构的完整解析

### 4. IPC 通信
- 在主进程中添加了 `multicast:sendPlatformCmd` IPC 处理器
- 在 preload.ts 中暴露了发送接口给渲染进程
- 完整的错误处理和结果反馈

### 5. 🔧 最新修复 (2025-09-03)
- **修复了 "Protobuf定义文件未加载" 错误**
- 增强了 protobuf 文件路径查找机制，支持多种环境:
  - 开发环境：`src/protobuf`
  - 编译后环境：`build/main/src/protobuf`
  - 生产环境：多种打包后路径
  - 添加了 fallback 机制和绝对路径备选
- 改进了错误处理，在 IPC 处理器中添加了重新初始化逻辑
- 增强了 TypeScript 类型安全性
- 添加了详细的调试日志输出

## 🎯 使用方式

### 在火炮操作页面：

1. **连接仿真端**：选择组、实例，输入操作人，点击连接
2. **装填弹药**：点击"装填弹药"按钮
3. **设置参数**：
   - 武器名称：输入具体的武器型号（如：155毫米榴弹炮）
   - 目标名称：输入目标标识（如：无人机-001）
4. **发射**：点击"发射"按钮

### 发射时的数据流：

```
用户点击发射 → 创建PlatformCmd数据 → 编码为Protobuf → 添加协议头 → 发送组播消息
```

### PlatformCmd 消息结构：

```javascript
{
  commandID: 时间戳,           // 命令ID
  platformName: "artillery1",  // 平台名称
  platformType: "Artillery",   // 平台类型  
  command: 10,                 // Arty_Fire (火炮发射)
  fireParam: {
    weaponName: "用户输入的武器名称",
    targetName: "用户输入的目标名称", 
    quantity: 1                // 发射次数
  }
}
```

## 🔧 技术细节

### 数据包格式：
```
[包头] [协议ID] [包类型] [数据长度] [Protobuf数据]
 0xAA   0x01     0x2A     4字节LE    变长
 0x55
```

### 关键文件：
- `src/main/services/multicast-sender.service.ts` - 组播发送服务
- `src/main/main.ts` - 主进程 IPC 处理
- `src/main/preload.ts` - 渲染进程接口
- `src/main/services/protobuf-parser.service.ts` - 协议解析
- `src/renderer/views/pages/ArtilleryOperationPage.vue` - 火炮操作界面

### 测试文件：
- `src/testScipt/test-platform-cmd.js` - 独立的 PlatformCmd 发送测试

## 🚀 测试验证

### 方法1：使用火炮操作页面
1. 启动应用：`npm run dev`
2. 切换到火炮操作页面
3. 按照使用方式操作

### 方法2：使用测试脚本
```bash
# 运行独立测试脚本
node src/testScipt/test-platform-cmd.js
```

## 📊 协议兼容性

支持的 PlatformCommand 枚举值：
- `Arty_Load = 9` - 火炮装填
- `Arty_Fire = 10` - 火炮发射 (当前实现)

消息在组播网络中传输，接收端会自动识别并解析 PackType_PlatformCmd (0x2A) 类型的消息。

## 🎉 实现效果

用户现在可以在火炮操作页面中：
1. 输入具体的武器名称和目标名称
2. 点击发射按钮发送真实的 PlatformCmd 控制命令
3. 命令通过组播网络发送给仿真端
4. 接收端可以正确解析并显示命令内容

这为无人机学习场景提供了完整的火炮控制命令发送功能！