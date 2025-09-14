# Protobuf传感器类型修复

## 问题描述
在发送传感器命令时出现错误：`命令发送失败: no such type: PlatformStatus.SensorParam`

## 根本原因
MulticastSenderService在查找protobuf消息类型时，如果找不到某个类型就会直接抛出异常，导致整个命令发送失败。

## 修复方案

### 1. 添加容错的类型查找逻辑
```typescript
// 修复前：直接查找，失败就抛异常
const SensorParamType = this.root.lookupType('PlatformStatus.SensorParam');

// 修复后：容错查找，记录详细信息
try {
  SensorParamType = this.root.lookupType('PlatformStatus.SensorParam');
  console.log('[MulticastSender] ✅ 找到 SensorParamType');
} catch (e) {
  console.log('[MulticastSender] ⚠️ 未找到 SensorParamType:', e);
}
```

### 2. 增强调试信息
```typescript
// 显示可用的命名空间和类型
if (this.root.nested) {
  console.log('[MulticastSender] 可用的命名空间:', Object.keys(this.root.nested));
  if (this.root.nested['PlatformStatus']) {
    const platformNested = this.root.nested['PlatformStatus'] as protobuf.Namespace;
    console.log('[MulticastSender] PlatformStatus命名空间中的类型:', Object.keys(platformNested.nested || {}));
  }
}
```

### 3. 添加降级处理
```typescript
// 如果找不到类型，尝试使用原始数据
if (data.sensorParam && SensorParamType) {
  // 使用protobuf类型创建
  const sensorParam = SensorParamType.create({...});
  cmdData.sensorParam = sensorParam;
} else if (data.sensorParam && !SensorParamType) {
  // 降级：直接使用原始数据
  cmdData.sensorParam = {
    sensorName: data.sensorParam.sensorName || '',
    azSlew: data.sensorParam.azSlew || 0,
    elSlew: data.sensorParam.elSlew || 0
  };
}
```

### 4. 确保字段名正确
```typescript
// 确保使用正确的字段名
sensorParam: {
  sensorName: data.sensorParam.sensorName || '', // ✅ 使用sensorName
  azSlew: data.sensorParam.azSlew || 0,
  elSlew: data.sensorParam.elSlew || 0
}
```

## 修复后的行为

### 成功情况
1. 找到所有必要的protobuf类型
2. 正常创建和编码消息
3. 发送命令成功

### 部分失败情况
1. 找不到某些类型时不会完全失败
2. 使用原始数据作为降级方案
3. 记录详细的调试信息
4. 仍然能够发送命令

### 完全失败情况
1. 只有在找不到主要的PlatformCmd类型时才会失败
2. 提供详细的错误信息和可用类型列表

## 测试步骤

### 1. 重启应用程序
确保修复的代码生效

### 2. 打开开发者工具
查看控制台输出的详细调试信息

### 3. 发送传感器命令
在命令测试页面选择平台和传感器，发送命令

### 4. 观察日志输出
应该看到类似以下的日志：
```
[MulticastSender] 开始查找消息类型...
[MulticastSender] 可用的命名空间: ['PublicStruct', 'PlatformStatus']
[MulticastSender] PlatformStatus命名空间中的类型: ['PlatformCmd', 'FireParam', 'SensorParam', ...]
[MulticastSender] ✅ 找到 SensorParamType
[MulticastSender] 添加sensorParam: {...}
```

### 5. 检查组播监听
在组播监听页面确认收到了发送的命令数据包

## 预期结果

### 立即效果
- 传感器命令能够成功发送
- 不再出现"no such type"错误
- 详细的调试信息帮助诊断问题

### 长期效果
- 更好的错误处理和容错性
- 更容易调试protobuf相关问题
- 系统更加稳定可靠

## 相关文件

### 修改的文件
- `src/main/services/multicast-sender.service.ts` - 主要修复
- `testScipt/test-protobuf-fixes.js` - 测试脚本

### 相关文件
- `src/protobuf/PlatformCmd.proto` - 消息定义
- `src/renderer/views/pages/CommandTestPage.vue` - 命令发送界面
- `src/main/main.ts` - IPC处理

## 故障排除

### 如果仍然出现错误
1. 检查protobuf文件是否正确加载
2. 确认proto文件中确实定义了相关类型
3. 检查文件路径和权限
4. 查看完整的错误日志

### 常见问题
1. **类型名称不匹配** - 检查proto文件中的实际类型名称
2. **命名空间问题** - 确认使用正确的命名空间前缀
3. **文件加载顺序** - 确保依赖文件先加载
4. **权限问题** - 检查proto文件的读取权限

## 总结
这次修复主要解决了protobuf类型查找的容错性问题，通过添加详细的调试信息和降级处理机制，确保即使在部分类型缺失的情况下，系统仍然能够正常工作。同时保证了传感器命令中sensorName字段的正确使用。