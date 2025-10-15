# 无人机页面分组选择功能实现

## 功能概述

在无人机操作页面添加分组选择功能，从平台状态数据中提取分组信息，并筛选出类型为 `UAV01` 的无人机平台供用户选择。

## 实现详情

### 1. 页面布局修改

**文件**: `src/renderer/views/pages/UavOperationPage.vue`

在页面顶部添加了连接区域，包含：
- 分组选择下拉框
- 无人机选择下拉框  
- 操作人输入框
- 连接按钮
- 状态显示

```vue
<!-- 顶部连接区域 -->
<div class="bg-white rounded-lg shadow-md p-4">
  <div class="flex items-center gap-4">
    <span class="text-lg font-semibold text-gray-800">操作模式-无人机</span>
    <el-select v-model="selectedGroup" placeholder="选择分组" @change="onGroupChange">
      <el-option v-for="group in groupOptions" :key="group.value" :label="group.label" :value="group.value" />
    </el-select>
    <el-select v-model="selectedUav" placeholder="选择无人机" :disabled="!selectedGroup || uavOptions.length === 0">
      <el-option v-for="uav in uavOptions" :key="uav.value" :label="uav.label" :value="uav.value" />
    </el-select>
    <!-- 其他控件... -->
  </div>
</div>
```

### 2. 数据结构定义

添加了平台数据相关的接口定义：

```typescript
// 平台信息接口
interface Platform {
  base: {
    name: string;
    type: string;
    side: string;
    group: string;
    broken: boolean;
    location: { longitude: number; latitude: number; altitude: number; };
    roll: number; pitch: number; yaw: number; speed: number;
  };
  updateTime: number;
}

// 分组选项接口
interface GroupOption {
  label: string;
  value: string;
}

// 无人机选项接口
interface UavOption {
  label: string;
  value: string;
  platform: Platform;
}
```

### 3. 响应式数据

```typescript
// 平台选择相关数据
const selectedGroup = ref('');
const selectedUav = ref('');
const operatorName = ref('');
const platforms = ref<Platform[]>([]);
const lastUpdateTime = ref<number>(0);

const connectionStatus = reactive<ConnectionStatus>({
  isConnected: false,
  simulationEndpoint: ''
});
```

### 4. 计算属性

#### 分组选项计算
```typescript
const groupOptions = computed<GroupOption[]>(() => {
  const groups = new Set<string>();
  
  platforms.value.forEach(platform => {
    if (platform.base?.group && platform.base?.type === 'UAV01') {
      groups.add(platform.base.group);
    }
  });
  
  return Array.from(groups).map(group => ({
    label: group,
    value: group
  }));
});
```

#### 无人机选项计算
```typescript
const uavOptions = computed<UavOption[]>(() => {
  if (!selectedGroup.value) {
    return [];
  }
  
  return platforms.value
    .filter(platform => 
      platform.base?.group === selectedGroup.value && 
      platform.base?.type === 'UAV01' &&
      !platform.base?.broken
    )
    .map(platform => ({
      label: platform.base.name || '未命名无人机',
      value: platform.base.name || '',
      platform: platform
    }));
});
```

### 5. 平台状态数据处理

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
        
        console.log('[UavOperationPage] 收到平台状态数据:', {
          平台数量: parsedData.platform.length,
          无人机数量: parsedData.platform.filter((p: any) => p.base?.type === 'UAV01').length,
          分组数量: groupOptions.value.length
        });
      }
    }
  } catch (error) {
    console.error('[UavOperationPage] 处理平台状态数据失败:', error);
  }
};
```

### 6. 事件处理

#### 分组变化处理
```typescript
const onGroupChange = () => {
  selectedUav.value = '';
  if (uavOptions.value.length === 1) {
    // 如果只有一个无人机，自动选择
    selectedUav.value = uavOptions.value[0].value;
  }
};
```

#### 连接处理
```typescript
const connectToUav = () => {
  if (!selectedGroup.value || !selectedUav.value) {
    ElMessage.warning('请选择分组和无人机');
    return;
  }
  
  ElMessage.success(`正在连接到 ${selectedGroup.value} - ${selectedUav.value}`);
  connectionStatus.isConnected = true;
  connectionStatus.simulationEndpoint = `${selectedGroup.value}/${selectedUav.value}`;
  uavStatus.isConnected = true;
  
  addLog('success', `已连接到无人机: ${selectedUav.value} (分组: ${selectedGroup.value})`);
};
```

### 7. 生命周期管理

```typescript
onMounted(() => {
  // 监听平台状态数据
  if (window.electronAPI?.multicast?.onPacket) {
    window.electronAPI.multicast.onPacket(handlePlatformStatus);
    console.log('[UavOperationPage] 已开始监听平台状态数据');
  }
  // 其他初始化...
});

onUnmounted(() => {
  // 清理平台状态监听器
  if (window.electronAPI?.multicast?.removePacketListener) {
    window.electronAPI.multicast.removePacketListener(handlePlatformStatus);
    console.log('[UavOperationPage] 已停止监听平台状态数据');
  }
});
```

## 筛选规则

### 分组筛选
- 从所有平台中提取 `base.group` 字段
- 只考虑 `base.type === 'UAV01'` 的平台
- 去重后生成分组选项列表

### 无人机筛选
- 筛选条件：
  - `base.group === selectedGroup.value` (属于选中分组)
  - `base.type === 'UAV01'` (类型为UAV01)
  - `!base.broken` (未损坏)

### 过滤掉的平台
- ❌ 类型不是 `UAV01` 的平台 (如 `ROCKET_LAUNCHER`, `UAV02` 等)
- ❌ `broken: true` 的损坏平台
- ❌ 不属于当前选中分组的平台

## 用户交互流程

1. **接收平台数据**: 页面监听组播数据，接收平台状态信息
2. **显示分组选项**: 根据UAV01类型平台的分组信息生成下拉选项
3. **选择分组**: 用户选择分组后，无人机选择框自动更新
4. **显示无人机选项**: 显示该分组下所有可用的UAV01类型无人机
5. **自动选择**: 如果分组下只有一个无人机，自动选择
6. **连接无人机**: 用户点击连接按钮，建立与选中无人机的连接

## 状态显示

页面右上角显示：
- 平台数据总数
- 当前可用无人机数量
- 连接状态指示

## 测试验证

### 测试脚本
`testScipt/test-uav-group-selection.js` - 发送包含多种类型平台的测试数据

### 测试数据包含
- 3个分组的UAV01类型无人机 (共5个)
- 1个ROCKET_LAUNCHER类型平台 (应被过滤)
- 1个损坏的UAV01无人机 (应被过滤)  
- 1个UAV02类型无人机 (应被过滤)

### 验证要点
- ✅ 只显示UAV01类型的无人机
- ✅ 损坏的无人机被过滤掉
- ✅ 其他类型平台被过滤掉
- ✅ 分组切换时无人机列表正确更新
- ✅ 单个无人机时自动选择

## 相关文件

- `src/renderer/views/pages/UavOperationPage.vue` - 主要实现文件
- `src/protobuf/PlatformStatus.proto` - 平台状态数据结构定义
- `testScipt/test-uav-group-selection.js` - 测试脚本

## 总结

通过监听平台状态数据并实现智能筛选，无人机操作页面现在能够：

1. **动态获取分组信息**: 从实时平台数据中提取分组
2. **精确筛选无人机**: 只显示UAV01类型且可用的无人机
3. **智能用户体验**: 自动选择、状态显示、错误提示
4. **实时数据更新**: 平台数据变化时界面自动更新

这个实现与火炮页面的分组选择功能保持一致，为用户提供了统一的操作体验。