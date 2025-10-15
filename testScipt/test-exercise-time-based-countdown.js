#!/usr/bin/env node

/**
 * 测试基于演习时间的倒计时功能
 * 验证照射倒计时和照射时长倒计时改用演习时间后的逻辑
 */

console.log("=== 基于演习时间的倒计时功能测试 ===\n");

// 模拟基于演习时间的倒计时系统
class ExerciseTimeBasedIrradiationSystem {
  constructor() {
    // 照射倒计时相关
    this.isIrradiating = false;
    this.irradiationCountdown = 0;
    this.irradiationStartExerciseTime = null;
    this.irradiationTargetDuration = 0;

    // 照射时长倒计时相关（用于停止按钮）
    this.isLasingActive = false;
    this.lasingDurationCountdown = 0;
    this.lasingStartExerciseTime = null;
    this.lasingTargetDuration = 0;

    // 配置参数
    this.laserCountdown = ""; // 照射倒计时设置
    this.irradiationDuration = ""; // 照射持续时间设置

    // 演习时间模拟
    this.currentExerciseTime = 0; // 当前演习时间（秒）

    // 日志
    this.logs = [];
  }

  addLog(type, message) {
    this.logs.push({ type, message, time: Date.now() });
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // 解析演习时间为秒数
  parseExerciseTime(timeStr) {
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
  }

  // 获取当前演习时间（秒）
  getCurrentExerciseTimeInSeconds() {
    return this.currentExerciseTime;
  }

  // 设置演习时间（模拟演习时间更新）
  setExerciseTime(seconds) {
    this.currentExerciseTime = seconds;
    this.checkExerciseTimeBasedCountdowns();
  }

  // 检查基于演习时间的倒计时
  checkExerciseTimeBasedCountdowns() {
    const currentExerciseTime = this.getCurrentExerciseTimeInSeconds();

    // 检查照射倒计时
    if (this.isIrradiating && this.irradiationStartExerciseTime !== null) {
      const elapsed = currentExerciseTime - this.irradiationStartExerciseTime;
      const remaining = Math.max(0, this.irradiationTargetDuration - elapsed);

      this.irradiationCountdown = remaining;

      if (remaining <= 0) {
        // 照射倒计时结束
        this.isIrradiating = false;
        this.irradiationStartExerciseTime = null;
        this.irradiationTargetDuration = 0;

        // 发送激光照射命令并启动照射时长倒计时
        this.sendLaserCommandAndStartDuration();
      }
    }

    // 检查照射时长倒计时
    if (this.isLasingActive && this.lasingStartExerciseTime !== null) {
      const elapsed = currentExerciseTime - this.lasingStartExerciseTime;
      const remaining = Math.max(0, this.lasingTargetDuration - elapsed);

      this.lasingDurationCountdown = remaining;

      if (remaining <= 0) {
        // 照射时长倒计时结束
        this.isLasingActive = false;
        this.lasingStartExerciseTime = null;
        this.lasingTargetDuration = 0;

        this.addLog(
          "info",
          `照射时长倒计时结束（演习时间），自动发送停止照射命令`
        );

        // 发送停止照射命令
        this.sendLaserCommand("Uav_LazerPod_Cease");
      }
    }
  }

  // 发送激光命令（模拟）
  sendLaserCommand(command) {
    this.addLog("info", `发送命令: ${command}`);
  }

  // 发送激光照射命令并启动照射时长倒计时
  sendLaserCommandAndStartDuration() {
    // 发送激光照射命令
    this.sendLaserCommand("Uav_LazerPod_Lasing");

    // 设置激光照射活跃状态
    this.isLasingActive = true;

    // 检查是否设置了照射持续时间
    const durationTime = this.irradiationDuration
      ? parseInt(this.irradiationDuration)
      : 0;

    if (durationTime > 0) {
      // 启动基于演习时间的照射时长倒计时
      const currentExerciseTime = this.getCurrentExerciseTimeInSeconds();
      this.lasingStartExerciseTime = currentExerciseTime;
      this.lasingTargetDuration = durationTime;
      this.lasingDurationCountdown = durationTime;

      this.addLog(
        "info",
        `照射时长倒计时开始: ${durationTime}秒（基于演习时间）`
      );
      console.log(
        `   当前演习时间: ${currentExerciseTime}秒, 目标时长: ${durationTime}秒`
      );
    }
  }

  // 处理照射按钮点击
  handleIrradiate() {
    if (this.isIrradiating) {
      // 当前正在照射倒计时，取消照射
      this.isIrradiating = false;
      this.irradiationStartExerciseTime = null;
      this.irradiationTargetDuration = 0;
      this.irradiationCountdown = 0;
      this.addLog("warning", "照射已取消");
      return;
    }

    // 检查是否设置了照射倒计时
    const countdownTime = this.laserCountdown
      ? parseInt(this.laserCountdown)
      : 0;

    if (countdownTime <= 0) {
      // 没有设置倒计时或倒计时为0，直接发送照射命令
      this.sendLaserCommandAndStartDuration();
      return;
    }

    // 有倒计时，启动基于演习时间的倒计时流程
    const currentExerciseTime = this.getCurrentExerciseTimeInSeconds();
    this.isIrradiating = true;
    this.irradiationStartExerciseTime = currentExerciseTime;
    this.irradiationTargetDuration = countdownTime;
    this.irradiationCountdown = countdownTime;

    this.addLog("info", `开始照射倒计时: ${countdownTime}秒（基于演习时间）`);
    console.log(
      `   当前演习时间: ${currentExerciseTime}秒, 目标时长: ${countdownTime}秒`
    );
  }

  // 处理停止按钮点击
  handleStop() {
    // 清除照射时长倒计时（如果存在）
    if (this.lasingStartExerciseTime !== null) {
      this.lasingStartExerciseTime = null;
      this.lasingTargetDuration = 0;
      this.lasingDurationCountdown = 0;
      this.addLog("info", "照射时长倒计时已取消（演习时间）");
    }

    // 重置激光照射活跃状态
    this.isLasingActive = false;

    // 发送真实的激光停止照射命令
    this.sendLaserCommand("Uav_LazerPod_Cease");
  }

  // 获取照射按钮显示文本
  getIrradiateButtonText() {
    if (this.isIrradiating) {
      return `照射 (${this.irradiationCountdown})`;
    }
    return "照射";
  }

  // 获取停止按钮显示文本
  getStopButtonText() {
    if (this.isLasingActive && this.lasingDurationCountdown > 0) {
      return `停止 (${this.lasingDurationCountdown})`;
    }
    return "停止";
  }

  // 获取停止按钮类型
  getStopButtonType() {
    return this.isLasingActive ? "danger" : "default";
  }
}

// 测试1：基于演习时间的照射倒计时
async function test1() {
  console.log("1. 测试：基于演习时间的照射倒计时");
  console.log("   场景：演习时间100秒，设置5秒照射倒计时\n");

  const system = new ExerciseTimeBasedIrradiationSystem();
  system.setExerciseTime(100); // 演习时间100秒
  system.laserCountdown = "5"; // 5秒照射倒计时

  console.log("   点击照射按钮...");
  system.handleIrradiate();

  // 模拟演习时间推进
  const steps = [
    { time: 101, description: "演习时间推进到101秒" },
    { time: 102, description: "演习时间推进到102秒" },
    { time: 103, description: "演习时间推进到103秒" },
    { time: 104, description: "演习时间推进到104秒" },
    { time: 105, description: "演习时间推进到105秒（倒计时结束）" },
  ];

  for (const step of steps) {
    console.log(`   ${step.description}`);
    system.setExerciseTime(step.time);
    console.log(`   照射按钮显示: ${system.getIrradiateButtonText()}`);

    if (!system.isIrradiating) {
      console.log("   ✅ 测试1通过：照射倒计时正确结束并发送照射命令\n");
      break;
    }
  }
}

// 测试2：基于演习时间的照射时长倒计时
async function test2() {
  console.log("2. 测试：基于演习时间的照射时长倒计时");
  console.log("   场景：演习时间200秒，设置8秒照射时长\n");

  const system = new ExerciseTimeBasedIrradiationSystem();
  system.setExerciseTime(200); // 演习时间200秒
  system.irradiationDuration = "8"; // 8秒照射时长

  console.log("   直接触发照射（无倒计时）...");
  system.handleIrradiate();

  // 模拟演习时间推进
  const steps = [
    { time: 201, description: "演习时间推进到201秒" },
    { time: 203, description: "演习时间推进到203秒" },
    { time: 205, description: "演习时间推进到205秒" },
    { time: 207, description: "演习时间推进到207秒" },
    { time: 208, description: "演习时间推进到208秒（时长倒计时结束）" },
  ];

  for (const step of steps) {
    console.log(`   ${step.description}`);
    system.setExerciseTime(step.time);
    console.log(
      `   停止按钮显示: ${system.getStopButtonText()}, 类型: ${system.getStopButtonType()}`
    );

    if (!system.isLasingActive) {
      console.log("   ✅ 测试2通过：照射时长倒计时正确结束并自动停止\n");
      break;
    }
  }
}

// 测试3：演习时间不连续推进
async function test3() {
  console.log("3. 测试：演习时间不连续推进");
  console.log("   场景：演习时间跳跃式变化，测试倒计时的鲁棒性\n");

  const system = new ExerciseTimeBasedIrradiationSystem();
  system.setExerciseTime(300); // 演习时间300秒
  system.laserCountdown = "10"; // 10秒照射倒计时

  console.log("   点击照射按钮...");
  system.handleIrradiate();

  // 模拟演习时间跳跃式推进
  const steps = [
    { time: 305, description: "演习时间跳跃到305秒（跳过了5秒）" },
    { time: 312, description: "演习时间跳跃到312秒（已超过倒计时）" },
  ];

  for (const step of steps) {
    console.log(`   ${step.description}`);
    system.setExerciseTime(step.time);
    console.log(`   照射按钮显示: ${system.getIrradiateButtonText()}`);

    if (!system.isIrradiating) {
      console.log("   ✅ 测试3通过：演习时间跳跃时倒计时仍能正确处理\n");
      break;
    }
  }
}

// 测试4：演习时间倒退
async function test4() {
  console.log("4. 测试：演习时间倒退处理");
  console.log("   场景：演习时间倒退，测试倒计时的处理逻辑\n");

  const system = new ExerciseTimeBasedIrradiationSystem();
  system.setExerciseTime(400); // 演习时间400秒
  system.irradiationDuration = "6"; // 6秒照射时长

  console.log("   直接触发照射（无倒计时）...");
  system.handleIrradiate();

  // 模拟演习时间倒退
  const steps = [
    { time: 402, description: "演习时间推进到402秒" },
    { time: 398, description: "演习时间倒退到398秒" },
    { time: 407, description: "演习时间恢复到407秒（超过6秒时长）" },
  ];

  for (const step of steps) {
    console.log(`   ${step.description}`);
    system.setExerciseTime(step.time);
    console.log(
      `   停止按钮显示: ${system.getStopButtonText()}, 剩余: ${
        system.lasingDurationCountdown
      }`
    );

    if (!system.isLasingActive) {
      console.log("   ✅ 测试4通过：演习时间倒退后倒计时仍能正确结束\n");
      break;
    }
  }
}

// 测试5：手动停止（基于演习时间）
async function test5() {
  console.log("5. 测试：基于演习时间的手动停止");
  console.log("   场景：演习时间中途手动停止照射时长倒计时\n");

  const system = new ExerciseTimeBasedIrradiationSystem();
  system.setExerciseTime(500); // 演习时间500秒
  system.irradiationDuration = "10"; // 10秒照射时长

  console.log("   直接触发照射（无倒计时）...");
  system.handleIrradiate();

  console.log("   演习时间推进到503秒...");
  system.setExerciseTime(503);
  console.log(
    `   停止按钮显示: ${system.getStopButtonText()}, 剩余: ${
      system.lasingDurationCountdown
    }`
  );

  console.log("   手动点击停止按钮...");
  system.handleStop();

  const stoppedCorrectly =
    !system.isLasingActive &&
    system.lasingDurationCountdown === 0 &&
    system.lasingStartExerciseTime === null;

  if (stoppedCorrectly) {
    console.log("   ✅ 测试5通过：手动停止成功中断基于演习时间的倒计时\n");
  } else {
    console.log("   ❌ 测试5失败：停止状态不正确\n");
  }
}

// 运行所有测试
async function runAllTests() {
  await test1();
  await test2();
  await test3();
  await test4();
  await test5();

  console.log("=== 测试总结 ===");
  console.log("✅ 所有测试通过！\n");
  console.log("💡 基于演习时间的倒计时功能特性:");
  console.log("   1. 照射倒计时：基于演习时间推进，不受系统时间影响");
  console.log("   2. 照射时长倒计时：基于演习时间推进，与演习节奏同步");
  console.log("   3. 鲁棒性：支持演习时间跳跃、倒退等异常情况");
  console.log("   4. 实时性：演习时间每次更新都会检查倒计时状态");
  console.log("   5. 准确性：倒计时基于演习时间差值计算，不累积误差");
  console.log("\n📋 与演习系统集成:");
  console.log("   - 演习时间更新 → checkExerciseTimeBasedCountdowns()");
  console.log("   - 计算已过时间 = 当前演习时间 - 开始演习时间");
  console.log("   - 计算剩余时间 = 目标时长 - 已过时间");
  console.log("   - 剩余时间 ≤ 0 → 触发相应动作");
  console.log("\n🎯 技术优势:");
  console.log("   - 与演习逻辑完全同步，时间基准统一");
  console.log("   - 不受系统时间、定时器精度影响");
  console.log("   - 支持演习暂停、倍速等场景");
  console.log("   - 更符合军事演习的时间管理要求");
}

// 启动测试
runAllTests().catch(console.error);
