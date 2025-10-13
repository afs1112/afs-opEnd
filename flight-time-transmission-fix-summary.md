# 火炮发射协同报文飞行时间传输修复总结

## 📋 问题描述

在火炮页面发送发射协同报文时，`rocketFlyTime` 字段值为 181 秒，但无人机页面接收到的值变成了 0。

### 问题日志

**火炮页面发送时：**
```javascript
[ArtilleryPage] 发送发射协同命令数据: 
{
  commandID: 1760332110108,
  platformName: 'phl300',
  command: 12,
  fireCoordinateParam: {
    uavName: 'uav01-3',
    targetName: 'command_north',
    weaponName: 'ssm_rocket',
    coordinate: {...},
    rocketFlyTime: 181  ← 发送时有值
  }
}
```

**无人机页面接收时：**
```javascript
[UavPage] 发射协同报文详细信息: 
{
  targetName: 'command_north',
  weaponName: 'ssm_rocket',
  rocketFlyTime: 0,  ← 接收时变成0
  coordinate: {...}
}
```

## 🔍 问题根因分析

### 数据传输链路

```
火炮页面 (Renderer)
    ↓ IPC通信
主进程 (Main Process) - TypeScript 接口验证
    ↓ Protobuf序列化
组播网络
    ↓ Protobuf反序列化
主进程解析
    ↓ IPC通信
无人机页面 (Renderer)
```

### 根本原因

**TypeScript 接口定义不完整**，导致数据在主进程被过滤掉。

**文件**：`src/main/services/multicast-sender.service.ts`

**问题代码**（修复前）：
```typescript
export interface PlatformCmdData {
  // ... 其他字段
  fireCoordinateParam?: {
    uavName?: string;
    targetName?: string;
    weaponName?: string;
    coordinate?: {
      longitude?: number;
      latitude?: number;
      altitude?: number;
    };
    // ❌ 缺少 rocketFlyTime 字段定义
  };
}
```

### 技术细节

1. **TypeScript 类型检查**：当渲染进程通过 IPC 发送数据到主进程时，TypeScript 编译器会根据接口定义进行类型检查
2. **字段过滤**：未在接口中定义的字段会被 TypeScript 忽略或过滤
3. **数据丢失**：`rocketFlyTime` 字段在传递给 Protobuf 序列化器之前就已经丢失
4. **默认值**：Protobuf 反序列化时，缺失的 `int32` 字段会被设置为默认值 0

## ✅ 修复方案

### 修改内容

**文件**：`src/main/services/multicast-sender.service.ts`

**位置**：第 47-56 行

**修复代码**：
```typescript
export interface PlatformCmdData {
  // ... 其他字段
  fireCoordinateParam?: {
    uavName?: string;
    targetName?: string;
    weaponName?: string;
    coordinate?: {
      longitude?: number;
      latitude?: number;
      altitude?: number;
    };
    rocketFlyTime?: number; // ✅ 新增：预计飞行时间（秒）
  };
}
```

### 修复效果

```
修复前：
  火炮页面 → {rocketFlyTime: 181} 
             ↓
  主进程接口 → TypeScript 过滤 → {无 rocketFlyTime}
             ↓
  Protobuf → {rocketFlyTime: 0}
             ↓
  无人机页面 → 显示 0 秒 ❌

修复后：
  火炮页面 → {rocketFlyTime: 181}
             ↓
  主进程接口 → TypeScript 保留 → {rocketFlyTime: 181}
             ↓
  Protobuf → {rocketFlyTime: 181}
             ↓
  无人机页面 → 显示 181 秒 ✅
```

## 🧪 测试步骤

### 1. 重新编译项目

```bash
npm run build
# 或
npm run dev
```

### 2. 火炮页面测试

1. 启动应用程序
2. 连接火炮平台（如 `phl300`）
3. 进行目标装订（确保 `estimatedFlightTime` 有值）
4. 检查"炮弹状态"区域显示的"预计总飞行时间"
5. 点击"开火"按钮
6. 查看浏览器控制台日志

**预期日志**：
```javascript
[ArtilleryPage] 发送发射协同命令数据: 
{
  fireCoordinateParam: {
    // ...
    rocketFlyTime: 181  ← 应该有正确的值
  }
}
```

### 3. 无人机页面验证

1. 连接无人机平台
2. 等待接收发射协同报文
3. 查看"协同报文区域"
4. 查看浏览器控制台日志

**预期结果**：
```javascript
[UavPage] 收到来自 phl300 的发射协同命令（目标: command_north，武器: ssm_rocket，坐标: 120.9402°, 24.7511°，预计飞行时间: 181秒）

[UavPage] 发射协同报文详细信息: 
{
  targetName: 'command_north',
  weaponName: 'ssm_rocket',
  rocketFlyTime: 181,  ← 应该是 181，不是 0
  coordinate: {...}
}
```

### 4. 界面验证

**协同报文区域应显示**：
```
收到来自 phl300 的发射协同命令
（目标: command_north，武器: ssm_rocket，预计飞行时间: 181秒）
```

并在消息标签中显示：
```
[橙色标签] 预计飞行时间: 181秒
```

## 📊 相关文件

| 文件 | 作用 | 修改内容 |
|------|------|----------|
| `src/main/services/multicast-sender.service.ts` | 组播发送服务，定义数据接口 | ✅ 添加 `rocketFlyTime` 字段 |
| `src/protobuf/PlatformCmd.proto` | Protobuf 协议定义 | ✓ 已包含 `rocketFlyTime` 字段 |
| `src/renderer/views/pages/ArtilleryOperationPage.vue` | 火炮操作页面 | ✓ 发送逻辑正常 |
| `src/renderer/views/pages/UavOperationPage.vue` | 无人机操作页面 | ✓ 接收逻辑正常 |

## 🎯 修复总结

### 修改概要

- **修改文件数**：1 个文件
- **修改行数**：+1 行
- **修改类型**：接口定义完善

### 关键要点

1. ✅ **TypeScript 接口定义必须与 Protobuf 协议定义保持一致**
2. ✅ **IPC 传输的数据字段必须在接口中明确定义**
3. ✅ **可选字段使用 `?:` 语法，避免强制要求**
4. ✅ **修复后无需修改业务逻辑代码**

### 经验教训

在跨进程通信时，特别是使用 TypeScript + IPC + Protobuf 的架构中：
- 必须确保 TypeScript 接口定义包含所有需要传输的字段
- 接口定义应与 Protobuf 协议定义保持同步
- 新增 Protobuf 字段时，同步更新 TypeScript 接口定义

## 📝 后续建议

### 1. 实现规范要求的展现机制

根据项目规范，无人机页面接收到发射协同报文时，应实现双重展现机制：

**橙色高亮区域**：
- 时钟图标
- 24px 加粗白色数字显示秒数
- 脉冲呼吸动画效果

**顶部橙色警告弹窗**：
- 显示 "收到发射协同！预计飞行时间 X 秒"
- 持续 5 秒可关闭

### 2. 数据校验

在主进程序列化前添加数据有效性检查：
```typescript
if (data.fireCoordinateParam?.rocketFlyTime !== undefined) {
  console.log(`[MulticastSender] 飞行时间: ${data.fireCoordinateParam.rocketFlyTime}秒`);
}
```

### 3. 接口同步机制

建立自动化工具，在 Protobuf 协议定义变更时，自动检查并更新 TypeScript 接口定义。

---

**修复日期**：2025-10-13  
**测试状态**：✅ 待重新编译测试  
**协议版本**：PlatformCmd.proto v1.0  
**相关规范**：发射协同报文飞行时间注入规范
