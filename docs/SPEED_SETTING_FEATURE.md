# 无人机速度设置功能

## 功能概述

根据 protobuf 定义中新增的 `Uav_Set_Speed` 命令，在命令控制测试页面添加了无人机速度设置功能。

## Protobuf 定义

### 命令枚举
```protobuf
enum PlatformCommand {
  // ... 其他命令
  Uav_Set_Speed = 9; // 设定无人机速度
}
```

### 参数结构
```protobuf
message SetSpeedparam {
  optional int32 speed = 1;
}
```

### 平台命令消息
```protobuf
message PlatformCmd {
  // ... 其他字段
  optional SetSpeedparam setSpeedParam = 8; // 速度设定参数
}
```

## 功能实现

### 1. 前端界面

#### 位置
- 在"导航控制"区域新增"设置速度"按钮
- 与"航线规划"按钮并列显示

#### 对话框
- 标题：无人机速度设置
- 字段：
  - 平台名称（只读，显示当前选择的平台）
  - 目标速度（数值输入，范围 1-100 m/s）

#### 交互逻辑
- 只有选择了平台后才能点击"设置速度"按钮
- 输入速度范围限制在 1-100 m/s
- 支持步进调节，步长为 1

### 2. 数据结构

#### 前端表单
```typescript
const setSpeedForm = reactive({
  speed: 10  // 默认速度 10 m/s
});
```

#### 命令数据
```typescript
const commandData = {
  commandID: Date.now(),
  platformName: String(selectedPlatform.value),
  command: 9, // Uav_Set_Speed
  setSpeedParam: {
    speed: Number(setSpeedForm.speed)
  }
};
```

### 3. 后端支持

#### 接口扩展
在 `PlatformCmdData` 接口中新增：
```typescript
setSpeedParam?: {
  speed?: number;
};
```

#### Protobuf 处理
- 查找 `PlatformStatus.SetSpeedparam` 消息类型
- 创建速度参数对象并添加到命令数据中
- 支持容错处理，如果类型未找到会记录警告

## 使用方法

### 操作步骤
1. 在命令测试页面选择目标无人机平台
2. 点击"导航控制"区域的"设置速度"按钮
3. 在弹出的对话框中设置目标速度（1-100 m/s）
4. 点击"确定"发送速度设置命令

### 命令日志
系统会记录以下日志信息：
- 发送速度设置命令的详细信息
- 命令发送成功/失败状态
- 错误信息（如果有）

## 技术特性

### 数据安全
- 使用 `String()` 和 `Number()` 进行明确的类型转换
- 避免传递 Vue 响应式对象给 IPC
- 确保数据可序列化

### 错误处理
- 输入验证：速度范围检查
- 平台选择验证：未选择平台时按钮禁用
- 网络错误处理：显示具体错误信息

### 用户体验
- 实时反馈：命令发送状态提示
- 默认值：合理的默认速度设置
- 范围提示：显示速度单位和范围说明

## 测试验证

### 功能测试
- ✅ 命令枚举正确映射（Uav_Set_Speed = 9）
- ✅ 数据结构完整性验证
- ✅ 序列化/反序列化测试
- ✅ 边界值测试（1 m/s, 100 m/s）

### 集成测试
- ✅ 界面交互正常
- ✅ 与现有功能无冲突
- ✅ 命令日志记录正确
- ✅ 错误处理机制有效

## 扩展性

该功能的实现遵循了现有的命令处理模式，为后续添加其他无人机控制命令提供了良好的参考：

1. **命令枚举扩展**：在 `PlatformCommandEnum` 中添加新命令
2. **参数结构定义**：创建对应的参数表单和数据结构
3. **界面集成**：在合适的控制区域添加按钮和对话框
4. **后端支持**：扩展 `PlatformCmdData` 接口和 protobuf 处理逻辑

这种模式化的实现方式确保了代码的一致性和可维护性。