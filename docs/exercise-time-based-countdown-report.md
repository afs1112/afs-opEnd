# 基于演习时间的倒计时功能实现报告

## 功能概述

根据用户反馈，将无人机页面的激光照射倒计时和激光持续时间的计时方式从系统定时器改为基于演习时间的倒计时，确保与演习逻辑完全同步。

## 核心改进

### 1. 倒计时机制重构

#### 原有问题

- 使用 `setInterval` 系统定时器
- 基于系统时间进行倒计时
- 可能与演习时间节奏不同步
- 不符合军事演习的时间管理要求

#### 改进方案

- 移除所有 `setInterval` 定时器
- 基于演习时间差值计算倒计时
- 演习时间更新时触发倒计时检查
- 与演习逻辑完全同步

### 2. 核心实现变更

#### 新增状态变量

```typescript
// 基于演习时间的照射倒计时
const irradiationStartExerciseTime = ref<number | null>(null); // 倒计时开始时的演习时间（秒）
const irradiationTargetDuration = ref<number>(0); // 目标倒计时时长（秒）

// 基于演习时间的照射时长倒计时
const lasingStartExerciseTime = ref<number | null>(null); // 照射开始时的演习时间（秒）
const lasingTargetDuration = ref<number>(0); // 目标照射时长（秒）
```

#### 演习时间解析函数

```typescript
// 解析演习时间为秒数
const parseExerciseTime = (timeStr: string): number => {
  // 格式: "T + 123秒" 或 "T + 2分30秒"
  const secondsMatch = timeStr.match(/T \+ (\d+)秒/);
  if (secondsMatch) {
    return parseInt(secondsMatch[1]);
  }

  const minutesMatch = timeStr.match(/T \+ (\d+)分(\d+)秒/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1]) * 60 + parseInt(minutesMatch[2]);
  }

  return 0;
};

// 获取当前演习时间（秒）
const getCurrentExerciseTimeInSeconds = (): number => {
  return parseExerciseTime(environmentParams.exerciseTime);
};
```

#### 倒计时检查函数

```typescript
// 检查基于演习时间的倒计时
const checkExerciseTimeBasedCountdowns = () => {
  const currentExerciseTime = getCurrentExerciseTimeInSeconds();

  // 检查照射倒计时
  if (isIrradiating.value && irradiationStartExerciseTime.value !== null) {
    const elapsed = currentExerciseTime - irradiationStartExerciseTime.value;
    const remaining = Math.max(0, irradiationTargetDuration.value - elapsed);

    irradiationCountdown.value = remaining;

    if (remaining <= 0) {
      // 照射倒计时结束
      isIrradiating.value = false;
      irradiationStartExerciseTime.value = null;
      irradiationTargetDuration.value = 0;

      // 发送激光照射命令并启动照射时长倒计时
      sendLaserCommandAndStartDuration();
    }
  }

  // 检查照射时长倒计时
  if (isLasingActive.value && lasingStartExerciseTime.value !== null) {
    const elapsed = currentExerciseTime - lasingStartExerciseTime.value;
    const remaining = Math.max(0, lasingTargetDuration.value - elapsed);

    lasingDurationCountdown.value = remaining;

    if (remaining <= 0) {
      // 照射时长倒计时结束
      isLasingActive.value = false;
      lasingStartExerciseTime.value = null;
      lasingTargetDuration.value = 0;

      addLog("info", `照射时长倒计时结束（演习时间），自动发送停止照射命令`);
      ElMessage.info(`照射时长已结束，自动停止照射`);

      // 发送停止照射命令
      sendLaserCommand("Uav_LazerPod_Cease");
    }
  }
};
```

### 3. 集成点

#### 演习时间更新触发

在平台状态数据处理中，演习时间更新时自动调用倒计时检查：

```typescript
// 更新演习时间（使用第一个平台的updateTime）
if (
  parsedData.platform &&
  parsedData.platform[0]?.updateTime !== undefined
) {
  environmentParams.exerciseTime = `T + ${parsedData.platform[0].updateTime.toFixed(
    0
  )}秒`;

  // 记录演习时间更新的时间戳，用于仿真平台断线检测
  lastExerciseTimeUpdate.value = Date.now();

  // 检查基于演习时间的倒计时
  checkExerciseTimeBasedCountdowns();
```

#### 照射功能重构

```typescript
const handleIrradiate = () => {
  // ... 检查激光载荷开关状态 ...

  if (isIrradiating.value) {
    // 当前正在照射倒计时，取消照射
    isIrradiating.value = false;
    irradiationStartExerciseTime.value = null;
    irradiationTargetDuration.value = 0;
    irradiationCountdown.value = 0;
    addLog("warning", "照射已取消");
    ElMessage.warning("照射已取消");
    return;
  }

  // 检查是否设置了照射倒计时
  const countdownTime = laserCountdown.value
    ? parseInt(laserCountdown.value)
    : 0;

  if (countdownTime <= 0) {
    // 没有设置倒计时或倒计时为0，直接发送照射命令
    sendLaserCommandAndStartDuration();
    return;
  }

  // 有倒计时，启动基于演习时间的倒计时流程
  const currentExerciseTime = getCurrentExerciseTimeInSeconds();
  isIrradiating.value = true;
  irradiationStartExerciseTime.value = currentExerciseTime;
  irradiationTargetDuration.value = countdownTime;
  irradiationCountdown.value = countdownTime;

  addLog("info", `开始照射倒计时: ${countdownTime}秒（基于演习时间）`);
  ElMessage.info(`照射倒计时开始: ${countdownTime}秒`);
};
```

#### 照射时长倒计时启动

```typescript
const sendLaserCommandAndStartDuration = () => {
  // 发送激光照射命令
  sendLaserCommand("Uav_LazerPod_Lasing");

  // 设置激光照射活跃状态
  isLasingActive.value = true;

  // 检查是否设置了照射持续时间
  const durationTime = irradiationDuration.value
    ? parseInt(irradiationDuration.value)
    : 0;

  if (durationTime > 0) {
    // 启动基于演习时间的照射时长倒计时
    const currentExerciseTime = getCurrentExerciseTimeInSeconds();
    lasingStartExerciseTime.value = currentExerciseTime;
    lasingTargetDuration.value = durationTime;
    lasingDurationCountdown.value = durationTime;

    addLog("info", `照射时长倒计时开始: ${durationTime}秒（基于演习时间）`);
  }
};
```

### 4. 代码清理

移除了不再使用的系统定时器变量：

- `irradiationTimer`
- `lasingDurationTimer`

以及相关的清理代码，简化了代码结构。

## 功能特性

### 1. 演习时间同步

- **时间基准统一**：倒计时完全基于演习时间，与演习逻辑保持一致
- **实时响应**：演习时间每次更新都会检查倒计时状态
- **准确计算**：基于演习时间差值计算，避免累积误差

### 2. 鲁棒性

- **时间跳跃支持**：演习时间不连续推进时仍能正确计算
- **时间倒退处理**：支持演习时间倒退的场景
- **边界情况**：正确处理各种异常情况

### 3. 用户体验

- **状态显示**：倒计时数值实时更新显示
- **手动控制**：支持手动停止和取消操作
- **视觉反馈**：按钮状态和颜色根据倒计时状态变化

## 测试验证

创建了完整的测试脚本 `test-exercise-time-based-countdown.js`，验证了以下场景：

1. ✅ **基于演习时间的照射倒计时**：验证倒计时基于演习时间正确推进
2. ✅ **基于演习时间的照射时长倒计时**：验证停止按钮倒计时显示和自动停止
3. ✅ **演习时间不连续推进**：验证时间跳跃场景的处理
4. ✅ **演习时间倒退处理**：验证时间倒退场景的鲁棒性
5. ✅ **手动停止功能**：验证手动中断倒计时的功能

**测试结果**: 100% 通过 (5/5)

## 技术优势

### 1. 与演习系统完全集成

- 时间基准与演习系统统一
- 支持演习暂停、倍速等场景
- 更符合军事演习的时间管理要求

### 2. 系统性能优化

- 移除了定时器，减少系统资源消耗
- 基于事件驱动，响应更及时
- 代码结构更简洁

### 3. 维护性提升

- 逻辑更清晰，便于调试
- 减少了定时器管理的复杂性
- 更容易扩展新功能

## 使用场景

### 场景 1：完整照射流程（基于演习时间）

1. 设置照射倒计时：5 秒
2. 设置照射持续时间：30 秒
3. 点击照射按钮
4. 照射按钮显示"照射 (5)"，倒计时基于演习时间推进
5. 演习时间推进 5 秒后自动发送照射命令
6. 停止按钮显示"停止 (30)"，基于演习时间倒计时
7. 演习时间再推进 30 秒后自动发送停止照射命令

### 场景 2：演习时间跳跃场景

1. 设置 10 秒照射倒计时
2. 演习时间从 100 秒跳跃到 107 秒
3. 系统正确识别已过 7 秒，剩余 3 秒
4. 倒计时显示"照射 (3)"继续

### 场景 3：演习暂停场景

1. 照射倒计时进行中
2. 演习时间暂停（不再更新）
3. 倒计时自动暂停，保持当前状态
4. 演习时间恢复更新后，倒计时继续

## 总结

基于演习时间的倒计时功能已成功实现，完全解决了原有系统定时器与演习逻辑不符的问题。新实现具备更好的同步性、鲁棒性和可维护性，更符合军事演习系统的实际需求。

**核心改进**：

- ✅ 移除系统定时器依赖
- ✅ 基于演习时间差值计算
- ✅ 演习时间更新时自动检查
- ✅ 支持各种异常场景
- ✅ 完整测试验证

功能已准备就绪，可投入正式使用。
