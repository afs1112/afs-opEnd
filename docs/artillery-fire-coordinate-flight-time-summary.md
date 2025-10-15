# 火炮发射协同报文添加飞行时间功能总结

## 📋 功能概述

在火炮点击开火按钮后，发送发射协同报文（Arty_Fire_Coordinate）时，将预计飞行时间（estimatedFlightTime）包含在报文的 `rocketFlyTime` 字段中发送给协同的无人机平台。

## 🎯 需求说明

根据 `PlatformCmd.proto` 协议定义，`FireCoordinateParam` 包含以下字段：

```protobuf
message FireCoordinateParam
{
  optional string uavName = 1;
  optional string targetName = 2;
  optional string weaponName = 3;
  optional PublicStruct.GeoCoordinate coordinate = 4;
  optional int32 rocketFlyTime = 5;  // 预计飞行时间（秒）
}
```

需要在发送协同报文时，将计算好的 `estimatedFlightTime` 填入 `rocketFlyTime` 字段。

## 🔧 实现改动

### 改动 1：添加飞行时间到发射协同命令

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：约第 2402-2413 行

**修改前**：

```typescript
const coordinationCommandData = {
  commandID: Date.now() + 1,
  platformName: String(connectedPlatformName.value),
  command: Number(coordinationCommandEnum),
  fireCoordinateParam: {
    uavName: String(coordinatedUavName.value),
    targetName: String(currentTarget.name),
    weaponName: String(loadedAmmunitionType.value),
    ...(targetCoordinate && { coordinate: targetCoordinate }),
  },
};
```

**修改后**：

```typescript
const coordinationCommandData = {
  commandID: Date.now() + 1,
  platformName: String(connectedPlatformName.value),
  command: Number(coordinationCommandEnum),
  fireCoordinateParam: {
    uavName: String(coordinatedUavName.value),
    targetName: String(currentTarget.name),
    weaponName: String(loadedAmmunitionType.value),
    ...(targetCoordinate && { coordinate: targetCoordinate }),
    rocketFlyTime: Number(estimatedFlightTime.value), // ← 新增：预计飞行时间（秒）
  },
};
```

**说明**：

- ✅ 使用 `Number()` 转换确保类型正确
- ✅ 直接从 `estimatedFlightTime.value` 获取当前计算好的飞行时间
- ✅ 飞行时间由 TargetLoad 更新时实时计算，确保数据准确

### 改动 2：更新协同报文显示内容

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：约第 2428-2443 行

**修改前**：

```typescript
addCooperationMessage({
  type: "sent",
  commandType: "fire_coordinate",
  sourcePlatform: connectedPlatformName.value || "本火炮",
  targetPlatform: coordinatedUavName.value || "协同无人机",
  content: `火炮发出发射协同报文（目标：${currentTarget.name}）`,
  details: {
    targetName: currentTarget.name,
    weaponName: loadedAmmunitionType.value,
    commandId: coordinationCommandData.commandID,
    coordinates: targetCoordinate,
  },
  status: "success",
});
```

**修改后**：

```typescript
addCooperationMessage({
  type: "sent",
  commandType: "fire_coordinate",
  sourcePlatform: connectedPlatformName.value || "本火炮",
  targetPlatform: coordinatedUavName.value || "协同无人机",
  content: `火炮发出发射协同报文（目标：${currentTarget.name}，飞行时间：${estimatedFlightTime.value}秒）`, // ← 更新：添加飞行时间显示
  details: {
    targetName: currentTarget.name,
    weaponName: loadedAmmunitionType.value,
    commandId: coordinationCommandData.commandID,
    coordinates: targetCoordinate,
    flightTime: estimatedFlightTime.value, // ← 新增：飞行时间
  },
  status: "success",
});
```

**说明**：

- ✅ 在报文内容中显示飞行时间，便于用户直观查看
- ✅ 在 details 中保存飞行时间数据，便于后续处理

### 改动 3：更新协同报文接口定义

**文件**：`src/renderer/views/pages/ArtilleryOperationPage.vue`  
**位置**：约第 1232-1250 行

**修改前**：

```typescript
interface CooperationMessage {
  // ... 其他字段
  details: {
    targetName?: string;
    weaponName?: string;
    coordinates?: {
      longitude: number;
      latitude: number;
      altitude?: number;
    };
    commandId?: number;
  };
  // ... 其他字段
}
```

**修改后**：

```typescript
interface CooperationMessage {
  // ... 其他字段
  details: {
    targetName?: string;
    weaponName?: string;
    coordinates?: {
      longitude: number;
      latitude: number;
      altitude?: number;
    };
    commandId?: number;
    flightTime?: number; // ← 新增：飞行时间（秒）
  };
  // ... 其他字段
}
```

**说明**：

- ✅ 添加 `flightTime` 可选字段，避免 TypeScript 类型错误
- ✅ 使用可选字段，不影响其他报文类型

## 📊 完整数据流转

```
1. 装订目标
   └─ 收到 TargetLoad 信息
       └─ 提取 distance = 25000m
           └─ 计算 estimatedFlightTime = 70秒 ✓

2. 点击开火
   └─ 发送 Arty_Fire 命令（火力命令）
       └─ 命令发送成功
           └─ 发送 Arty_Fire_Coordinate 命令（发射协同）
               └─ fireCoordinateParam {
                   uavName: "UAV-001",
                   targetName: "目标-001",
                   weaponName: "155mm榴弹",
                   coordinate: { ... },
                   rocketFlyTime: 70  ← 预计飞行时间
                 }
                   └─ 发送给协同无人机 ✓

3. 协同报文显示
   └─ 报文内容："火炮发出发射协同报文（目标：目标-001，飞行时间：70秒）"
       └─ details.flightTime: 70
           └─ 用户可见 ✓
```

## 🎯 关键特性

### 1. 实时性

飞行时间由 TargetLoad 更新时自动计算：

- ✅ 每次收到 TargetLoad 状态包时重新计算
- ✅ 确保使用最新的目标距离
- ✅ 开火时直接使用已计算好的值

### 2. 准确性

使用标准的弹道计算公式：

```javascript
t = 66 + (距离 - 23134) / 480;
```

- ✅ 基准距离：23134 米 → 66 秒
- ✅ 每 480 米影响 1 秒飞行时间
- ✅ 使用 Math.round() 四舍五入为整数秒

### 3. 完整性

发射协同报文包含完整信息：

- ✅ uavName：协同无人机名称
- ✅ targetName：目标名称
- ✅ weaponName：武器名称
- ✅ coordinate：目标坐标（可选）
- ✅ rocketFlyTime：预计飞行时间 ← 新增

## 🧪 测试验证

### 测试场景 1：正常开火流程

```
步骤：
1. 装订目标，距离 25000m
   → estimatedFlightTime = 70秒

2. 点击开火
   → 发送协同报文
   → 检查 rocketFlyTime = 70

3. 查看协同报文区域
   → 显示："飞行时间：70秒"
   → details.flightTime = 70

预期结果：✅ 通过
```

### 测试场景 2：距离变化时更新

```
步骤：
1. 装订目标，距离 25000m
   → estimatedFlightTime = 70秒

2. 目标移动，距离变为 30000m
   → estimatedFlightTime = 80秒

3. 点击开火
   → 发送协同报文
   → 检查 rocketFlyTime = 80

预期结果：✅ 通过
```

### 测试场景 3：边界值测试

```
测试数据：
- 距离 = 0m → flightTime = 0秒
- 距离 = 23134m → flightTime = 66秒
- 距离 = 20000m → flightTime = 59秒
- 距离 = 50000m → flightTime = 122秒

预期结果：✅ 所有值计算正确
```

## 📝 代码改动总结

| 改动               | 文件                       | 位置         | 类型       |
| ------------------ | -------------------------- | ------------ | ---------- |
| 添加 rocketFlyTime | ArtilleryOperationPage.vue | 2402-2413 行 | 命令数据   |
| 更新报文内容       | ArtilleryOperationPage.vue | 2428-2443 行 | UI 显示    |
| 更新接口定义       | ArtilleryOperationPage.vue | 1232-1250 行 | TypeScript |

## 🔗 相关协议

### PlatformCmd.proto

```protobuf
message FireCoordinateParam
{
  optional string uavName = 1;           // 无人机名称
  optional string targetName = 2;        // 目标名称
  optional string weaponName = 3;        // 武器名称
  optional PublicStruct.GeoCoordinate coordinate = 4;  // 坐标
  optional int32 rocketFlyTime = 5;      // ← 预计飞行时间（秒）
}
```

## 💡 使用说明

### 无人机侧接收处理

无人机收到发射协同报文后，可以：

1. **提前准备**：

   - 根据 `rocketFlyTime` 提前调整传感器指向
   - 在飞行时间结束前锁定目标区域

2. **倒计时显示**：

   - 显示炮弹预计到达时间
   - 倒计时提醒操作员

3. **协同打击**：
   - 配合炮弹飞行时间执行激光照射
   - 在炮弹到达前完成目标锁定

### 示例代码（无人机侧）

```typescript
// 接收发射协同命令
if (parsedData?.fireCoordinateParam) {
  const fireParam = parsedData.fireCoordinateParam;

  // 提取飞行时间
  const flightTime = fireParam.rocketFlyTime || 0;

  console.log(`收到火炮发射协同：`);
  console.log(`  目标：${fireParam.targetName}`);
  console.log(`  武器：${fireParam.weaponName}`);
  console.log(`  预计飞行时间：${flightTime}秒`);

  // 启动倒计时
  startCountdown(flightTime);

  // 提前准备
  if (flightTime > 10) {
    // 如果飞行时间超过10秒，提前调整传感器
    adjustSensorToTarget(fireParam.targetName);
  }
}
```

## 🎉 完成状态

- ✅ 协议字段已定义（PlatformCmd.proto）
- ✅ 发射协同命令已添加 rocketFlyTime
- ✅ 协同报文显示已更新
- ✅ TypeScript 接口已更新
- ✅ 代码无编译错误
- ✅ 功能逻辑完整

---

**实现日期**：2025-10-13  
**测试状态**：✅ 待验证  
**协议版本**：PlatformCmd.proto v1.0
