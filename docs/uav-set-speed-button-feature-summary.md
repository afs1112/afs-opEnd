# 无人机操作页面设置速度按钮功能添加总结

## 修改概述

根据用户需求，在无人机操作页面的航线规划按钮右侧添加了设置速度按钮，功能完全参考命令测试页面的设置速度实现。

## 具体修改内容

### 1. 界面布局调整

**文件位置**: `/src/renderer/views/pages/UavOperationPage.vue`

**修改前**:

```vue
<div class="control-group">
  <div class="button-row">
    <el-button
      class="route-planning-btn"
      @click="handleRoutePlanning"
    >
      航线规划
    </el-button>
    <!-- 同步轨迹按钮已移除，现在连接时自动开启同步轨迹 -->
  </div>
</div>
```

**修改后**:

```vue
<div class="button-row">
  <div class="control-group">
    <el-button
      class="route-planning-btn"
      @click="handleRoutePlanning"
    >
      航线规划
    </el-button>
    <el-button
      class="set-speed-btn"
      type="success"
      @click="showSetSpeedDialog"
      :disabled="!isConnected"
    >
      设置速度
    </el-button>
    <!-- 同步轨迹按钮已移除，现在连接时自动开启同步轨迹 -->
  </div>
</div>
```

### 2. 添加状态变量和表单数据

**新增变量**:

```javascript
// 设置速度相关
const setSpeedDialogVisible = ref(false);
const setSpeedForm = reactive({
  speed: 15, // 默认速度 15 m/s
});
```

### 3. 添加设置速度相关方法

**showSetSpeedDialog 方法**:

```javascript
const showSetSpeedDialog = () => {
  if (!isConnected.value) {
    ElMessage.warning("请先连接平台");
    return;
  }

  setSpeedForm.speed = 15; // 默认速度
  setSpeedDialogVisible.value = true;
};
```

**sendSetSpeedCommand 方法**:

```javascript
const sendSetSpeedCommand = async () => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Set_Speed"];
    if (commandEnum === undefined) {
      throw new Error("未定义的速度设置命令");
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      setSpeedParam: {
        speed: Number(setSpeedForm.speed),
      },
    };

    addLog(
      "info",
      `发送速度设置命令: 平台 ${connectedPlatformName.value} 设置速度为 ${setSpeedForm.speed} m/s`
    );

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      addLog("success", `速度设置命令发送成功`);
      ElMessage.success("速度设置命令发送成功");
      setSpeedDialogVisible.value = false;
    } else {
      addLog("error", `速度设置命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送速度设置命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};
```

### 4. 添加设置速度对话框

**对话框模板**:

```vue
<!-- 设置速度对话框 -->
<el-dialog v-model="setSpeedDialogVisible" title="无人机速度设置" width="400px">
  <el-form :model="setSpeedForm" label-width="100px">
    <el-form-item label="平台名称">
      <el-input :value="connectedPlatformName" disabled />
    </el-form-item>
    <el-form-item label="目标速度">
      <el-input-number
        v-model="setSpeedForm.speed"
        :min="1"
        :max="100"
        :step="1"
        class="w-full"
      />
      <div class="text-xs text-gray-500 mt-1">单位: m/s，范围: 1-100</div>
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="setSpeedDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="sendSetSpeedCommand">确定</el-button>
  </template>
</el-dialog>
```

### 5. 添加 CSS 样式

**设置速度按钮样式**:

```css
/* 设置速度按钮 */
.set-speed-btn {
  flex: 1;
  height: 45px;
  border: 2px solid #28a745;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.set-speed-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
}

.set-speed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

## 功能特性

### 1. 界面布局

- 设置速度按钮位于航线规划按钮右侧
- 采用绿色主题，与 Element Plus 的 success 类型一致
- 与航线规划按钮等高，保持界面协调

### 2. 交互逻辑

- 只有连接平台后才能点击按钮（与命令测试页面一致）
- 点击按钮显示设置速度对话框
- 输入速度范围限制在 1-100 m/s
- 支持步进调节，步长为 1

### 3. 数据结构

- 使用 `PlatformCommandEnum["Uav_Set_Speed"]` 命令枚举（值为 9）
- 命令参数包含 `setSpeedParam.speed` 字段
- 与 Protobuf 协议定义保持一致

### 4. 错误处理

- 未连接平台时显示提示信息
- 命令发送失败时显示错误消息
- 参数验证确保数据类型正确

### 5. 日志记录

- 发送命令时记录操作日志
- 成功/失败状态都有相应的日志记录
- 日志格式与现有系统保持一致

## 与命令测试页面的兼容性

1. **命令枚举**: 使用相同的 `PlatformCommandEnum["Uav_Set_Speed"]`
2. **数据结构**: 完全相同的 `setSpeedParam` 结构
3. **参数范围**: 相同的 1-100 m/s 范围限制
4. **默认值**: 都使用合理的默认速度值
5. **错误处理**: 相同的错误处理逻辑

## 符合项目规范

1. **UI 布局规范**: 按钮并排放置，符合任务控制区域的设计风格
2. **交互规范**: 只有连接状态下才能使用，符合设备控制页面规范
3. **代码规范**: 遵循现有的命名规范和代码结构
4. **样式规范**: 与现有按钮样式保持一致的设计语言

## 测试建议

1. **基本功能测试**:

   - 未连接状态下按钮是否禁用
   - 连接后按钮是否可点击
   - 对话框是否正常显示

2. **数据验证测试**:

   - 速度范围限制是否生效
   - 输入数据类型验证
   - 命令发送数据格式正确性

3. **交互体验测试**:

   - 按钮响应性能
   - 成功/失败消息提示
   - 对话框关闭逻辑

4. **兼容性测试**:
   - 与命令测试页面功能一致性
   - 组播数据接收和解析
   - 多平台环境下的兼容性

## 修改文件

- `/src/renderer/views/pages/UavOperationPage.vue`

## 总结

成功在无人机操作页面添加了设置速度按钮功能，完全参考命令测试页面的实现，保持了功能的一致性和可靠性。新功能符合项目的 UI 布局规范和交互设计原则，为用户提供了便捷的速度设置操作界面。
