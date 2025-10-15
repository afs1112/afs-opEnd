# 火炮页面分组选择功能

## 功能概述

在火炮页面上方的选择链接仿真端的位置，添加分组接入真实的分组信息。分组信息来自平台状态回传的每一个platform的属性。一旦用户选择某个组后，在下一个选择火炮的框中筛选出全部属于该组的type是ROCKET_LAUNCHER的平台展示出来供用户选择。

## 实现详情

### 1. 数据来源

分组信息来自平台状态数据包（PackageType_PlatformStatus, 0x29），具体结构：

```protobuf
message PlatformBase {
    optional string name = 1;        // 平台名称
    optional string type = 2;        // 平台类型
    optional string side = 3;        // 所属方
    optional string group = 4;       // 分组信息 ← 关键字段
    optional bool broken = 5;        // 是否损坏
    // ... 其他字段
}

message Platform {
    optional PlatformBase base = 1;  // 基础信息
    // ... 其他字段
}

message Platforms {
    repeated Platform platform = 1;  // 平台列表
    // ... 其他字段
}
```

### 2. 筛选逻辑

火炮筛选条件：
- `platform.base.type === 'ROCKET_LAUNCHER'` （类型为火炮）
- `platform.base.broken !== true` （未损坏）
- `platform.base.group === selectedGroup` （属于选定分组）

### 3. 代码实现

**文件**: `src/renderer/views/pages/ArtilleryOperationPage.vue`

#### 3.1 数据结构定义

```typescript
// 平台信息接口
interface Platform {
  base: {
    name: string;
    type: string;
    side: string;
    group: string;
    broken: boolean;
    location: {
      longitude: number;
      latitude: number;
      altitude: number;
    };
    roll: number;
    pitch: number;
    yaw: number;
    speed: number;
  };
  updateTime: number;
}

// 分组选项接口
interface GroupOption {
  label: string;
  value: string;
}

// 火炮选项接口
interface ArtilleryOption {
  label: string;
  value: string;
  platform: Platform;
}
```

#### 3.2 响应式数据

```typescript
// 平台数据
const platforms = ref<Platform[]>([]);
const selectedGroup = ref('');
const selectedInstance = ref('');
```

#### 3.3 计算属性

```typescript
// 可用的分组选项
const groupOptions = computed<GroupOption[]>(() => {
  const groups = new Set<string>();
  
  platforms.value.forEach(platform => {
    if (platform.base?.group && platform.base?.type === 'ROCKET_LAUNCHER') {
      groups.add(platform.base.group);
    }
  });
  
  return Array.from(groups).map(group => ({
    label: group,
    value: group
  }));
});

// 当前分组下的火炮选项
const artilleryOptions = computed<ArtilleryOption[]>(() => {
  if (!selectedGroup.value) {
    return [];
  }
  
  return platforms.value
    .filter(platform => 
      platform.base?.group === selectedGroup.value && 
      platform.base?.type === 'ROCKET_LAUNCHER' &&
      !platform.base?.broken
    )
    .map(platform => ({
      label: platform.base.name || '未命名火炮',
      value: platform.base.name || '',
      platform: platform
    }));
});
```

#### 3.4 平台状态监听

```typescript
// 处理平台状态数据包
const handlePlatformStatus = (packet: any) => {
  try {
    if (packet.parsedPacket?.packageType === 0x29) {
      const parsedData = packet.parsedPacket.parsedData;
      
      if (parsedData?.platform && Array.isArray(parsedData.platform)) {
        // 更新平台数据
        platforms.value = parsedData.platform;
        lastUpdateTime.value = Date.now();
      }
    }
  } catch (error) {
    console.error('[ArtilleryPage] 处理平台状态数据失败:', error);
  }
};

// 生命周期钩子
onMounted(() => {
  // 监听平台状态数据
  if (window.electronAPI?.multicast?.onPacket) {
    window.electronAPI.multicast.onPacket(handlePlatformStatus);
  }
});
```

#### 3.5 UI模板

```vue
<template>
  <el-select 
    v-model="selectedGroup" 
    placeholder="选择分组" 
    style="width: 150px;"
    @change="onGroupChange"
    clearable
  >
    <el-option 
      v-for="group in groupOptions" 
      :key="group.value"
      :label="group.label" 
      :value="group.value" 
    />
  </el-select>
  
  <el-select 
    v-model="selectedInstance" 
    placeholder="选择火炮" 
    style="width: 150px;"
    :disabled="!selectedGroup || artilleryOptions.length === 0"
    clearable
  >
    <el-option 
      v-for="artillery in artilleryOptions" 
      :key="artillery.value"
      :label="artillery.label" 
      :value="artillery.value" 
    />
  </el-select>
</template>
```

## 功能特性

### ✅ 实现的功能

1. **动态分组加载**: 从平台状态数据中自动提取分组信息
2. **智能筛选**: 只显示类型为ROCKET_LAUNCHER且未损坏的平台
3. **级联选择**: 选择分组后自动筛选对应的火炮列表
4. **实时更新**: 平台状态变化时自动更新选项
5. **状态显示**: 显示当前平台数据和火炮数量
6. **自动选择**: 当分组下只有一个火炮时自动选择

### 📊 数据流程

```
平台状态数据包 → 解析平台列表 → 提取分组信息 → 筛选火炮平台 → 更新UI选项
     ↓
PackageType_PlatformStatus (0x29) → platforms.value → groupOptions → artilleryOptions → 选择框
```

### 🔄 交互流程

1. **页面加载**: 开始监听平台状态数据
2. **接收数据**: 处理平台状态数据包，更新平台列表
3. **提取分组**: 从火炮平台中提取唯一的分组信息
4. **用户选择分组**: 触发火炮列表筛选
5. **显示火炮**: 展示该分组下所有可用的火炮
6. **用户选择火炮**: 完成选择，可以进行后续操作

## 测试验证

### 测试数据

创建了测试脚本 `testScipt/test-artillery-group-selection.js`，包含：

- **第一炮兵群**: 火炮-A1, 火炮-A2 (2个火炮)
- **第二炮兵群**: 火炮-B1 (1个火炮)  
- **第三炮兵群**: 火炮-C1 (损坏，应被过滤)
- **其他平台**: 无人机-001 (非火炮，应被过滤)

### 测试场景

1. **分组显示**: 验证只显示有火炮的分组
2. **火炮筛选**: 验证只显示对应分组的火炮
3. **损坏过滤**: 验证损坏的火炮被过滤掉
4. **类型过滤**: 验证非ROCKET_LAUNCHER类型被过滤掉
5. **实时更新**: 验证平台状态变化时UI自动更新

### 验证要点

- ✅ 分组选择框显示正确的分组
- ✅ 火炮选择框根据分组正确筛选
- ✅ 损坏和非火炮平台被正确过滤
- ✅ 平台数据实时更新
- ✅ UI状态正确显示

## 相关文件

- `src/renderer/views/pages/ArtilleryOperationPage.vue` - 主要实现文件
- `src/protobuf/PlatformStatus.proto` - 平台状态数据结构定义
- `testScipt/test-artillery-group-selection.js` - 功能测试脚本

## 总结

通过监听平台状态数据包，成功实现了火炮页面的分组选择功能。用户可以根据真实的分组信息选择对应的火炮平台，系统会自动筛选出类型为ROCKET_LAUNCHER且未损坏的平台供用户选择。这个功能提供了更好的用户体验和更准确的平台管理能力。