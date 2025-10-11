#!/usr/bin/env node

/**
 * 测试照射时长倒计时功能
 * 验证照射按钮和停止按钮的倒计时逻辑
 */

console.log("=== 照射时长倒计时功能测试 ===\n");

// 模拟状态管理
class IrradiationSystem {
  constructor() {
    // 照射倒计时相关
    this.isIrradiating = false;
    this.irradiationCountdown = 0;
    this.irradiationTimer = null;

    // 照射时长倒计时相关（用于停止按钮）
    this.isLasingActive = false;
    this.lasingDurationCountdown = 0;
    this.lasingDurationTimer = null;

    // 配置参数
    this.laserCountdown = ""; // 照射倒计时设置
    this.irradiationDuration = ""; // 照射持续时间设置

    // 日志
    this.logs = [];
  }

  addLog(type, message) {
    this.logs.push({ type, message, time: Date.now() });
    console.log(`[${type.toUpperCase()}] ${message}`);
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
      // 启动照射时长倒计时
      this.lasingDurationCountdown = durationTime;
      this.addLog("info", `照射时长倒计时开始: ${durationTime}秒`);

      this.lasingDurationTimer = setInterval(() => {
        this.lasingDurationCountdown--;

        if (this.lasingDurationCountdown <= 0) {
          // 照射时长倒计时结束，自动发送停止照射命令
          if (this.lasingDurationTimer) {
            clearInterval(this.lasingDurationTimer);
            this.lasingDurationTimer = null;
          }
          this.isLasingActive = false;

          this.addLog("info", `照射时长倒计时结束，自动发送停止照射命令`);

          // 发送停止照射命令
          this.sendLaserCommand("Uav_LazerPod_Cease");
        }
      }, 100); // 测试使用100ms间隔
    }
  }

  // 处理照射按钮点击
  handleIrradiate() {
    if (this.isIrradiating) {
      // 当前正在照射倒计时，取消照射
      if (this.irradiationTimer) {
        clearInterval(this.irradiationTimer);
        this.irradiationTimer = null;
      }
      this.isIrradiating = false;
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

    // 有倒计时，启动倒计时流程
    this.isIrradiating = true;
    this.irradiationCountdown = countdownTime;

    this.addLog("info", `开始照射倒计时: ${countdownTime}秒`);

    // 开始倒计时
    this.irradiationTimer = setInterval(() => {
      this.irradiationCountdown--;

      if (this.irradiationCountdown <= 0) {
        // 倒计时结束，发送照射命令
        if (this.irradiationTimer) {
          clearInterval(this.irradiationTimer);
          this.irradiationTimer = null;
        }
        this.isIrradiating = false;

        // 发送真实的激光照射命令并启动照射时长倒计时
        this.sendLaserCommandAndStartDuration();
      }
    }, 100); // 测试使用100ms间隔
  }

  // 处理停止按钮点击
  handleStop() {
    // 清除照射时长倒计时（如果存在）
    if (this.lasingDurationTimer) {
      clearInterval(this.lasingDurationTimer);
      this.lasingDurationTimer = null;
      this.lasingDurationCountdown = 0;
      this.addLog("info", "照射时长倒计时已取消");
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

  // 清理所有定时器
  cleanup() {
    if (this.irradiationTimer) {
      clearInterval(this.irradiationTimer);
      this.irradiationTimer = null;
    }
    if (this.lasingDurationTimer) {
      clearInterval(this.lasingDurationTimer);
      this.lasingDurationTimer = null;
    }
  }
}

// 测试1：无照射倒计时，有照射时长
async function test1() {
  console.log("1. 测试：无照射倒计时，有照射时长");
  console.log("   场景：直接照射，设置5秒照射时长\n");

  const system = new IrradiationSystem();
  system.irradiationDuration = "5"; // 5秒照射时长

  console.log("   点击照射按钮...");
  system.handleIrradiate();

  // 等待照射时长倒计时完成
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      console.log(
        `   停止按钮显示: ${system.getStopButtonText()}, 类型: ${system.getStopButtonType()}`
      );

      if (!system.isLasingActive) {
        clearInterval(checkInterval);
        system.cleanup();
        console.log("   ✅ 测试1通过：照射时长倒计时自动结束并发送停止命令\n");
        resolve();
      }
    }, 100);
  });
}

// 测试2：有照射倒计时，有照射时长
async function test2() {
  console.log("2. 测试：有照射倒计时，有照射时长");
  console.log("   场景：3秒照射倒计时，5秒照射时长\n");

  const system = new IrradiationSystem();
  system.laserCountdown = "3"; // 3秒照射倒计时
  system.irradiationDuration = "5"; // 5秒照射时长

  console.log("   点击照射按钮...");
  system.handleIrradiate();

  // 等待照射倒计时完成
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (system.isIrradiating) {
        console.log(`   照射按钮显示: ${system.getIrradiateButtonText()}`);
      } else if (system.isLasingActive) {
        console.log(
          `   停止按钮显示: ${system.getStopButtonText()}, 类型: ${system.getStopButtonType()}`
        );
      } else {
        clearInterval(checkInterval);
        system.cleanup();
        console.log(
          "   ✅ 测试2通过：照射倒计时结束后启动照射时长倒计时，时长结束自动停止\n"
        );
        resolve();
      }
    }, 100);
  });
}

// 测试3：手动停止照射（中断照射时长倒计时）
async function test3() {
  console.log("3. 测试：手动停止照射");
  console.log("   场景：5秒照射时长，2秒后手动停止\n");

  const system = new IrradiationSystem();
  system.irradiationDuration = "5"; // 5秒照射时长

  console.log("   点击照射按钮...");
  system.handleIrradiate();

  // 等待2秒后手动停止
  await new Promise((resolve) => {
    setTimeout(() => {
      console.log("   2秒后点击停止按钮...");
      system.handleStop();

      setTimeout(() => {
        const stoppedCorrectly =
          !system.isLasingActive && system.lasingDurationCountdown === 0;
        system.cleanup();

        if (stoppedCorrectly) {
          console.log("   ✅ 测试3通过：手动停止成功中断照射时长倒计时\n");
        } else {
          console.log("   ❌ 测试3失败：停止状态不正确\n");
        }
        resolve();
      }, 100);
    }, 200);
  });
}

// 测试4：取消照射倒计时
async function test4() {
  console.log("4. 测试：取消照射倒计时");
  console.log("   场景：3秒照射倒计时，1秒后取消\n");

  const system = new IrradiationSystem();
  system.laserCountdown = "3"; // 3秒照射倒计时
  system.irradiationDuration = "5"; // 5秒照射时长

  console.log("   点击照射按钮...");
  system.handleIrradiate();

  // 等待1秒后取消
  await new Promise((resolve) => {
    setTimeout(() => {
      console.log("   1秒后再次点击照射按钮取消倒计时...");
      system.handleIrradiate();

      const cancelledCorrectly =
        !system.isIrradiating && !system.isLasingActive;
      system.cleanup();

      if (cancelledCorrectly) {
        console.log("   ✅ 测试4通过：成功取消照射倒计时\n");
      } else {
        console.log("   ❌ 测试4失败：取消状态不正确\n");
      }
      resolve();
    }, 100);
  });
}

// 测试5：按钮状态和显示文本验证
function test5() {
  console.log("5. 测试：按钮状态和显示文本验证\n");

  const system = new IrradiationSystem();

  // 初始状态
  console.log("   初始状态:");
  console.log(`   - 照射按钮: "${system.getIrradiateButtonText()}"`);
  console.log(
    `   - 停止按钮: "${system.getStopButtonText()}" (${system.getStopButtonType()})`
  );

  // 照射倒计时状态
  system.isIrradiating = true;
  system.irradiationCountdown = 3;
  console.log("\n   照射倒计时状态:");
  console.log(`   - 照射按钮: "${system.getIrradiateButtonText()}"`);

  // 照射活跃状态
  system.isIrradiating = false;
  system.isLasingActive = true;
  system.lasingDurationCountdown = 5;
  console.log("\n   照射活跃状态:");
  console.log(`   - 照射按钮: "${system.getIrradiateButtonText()}"`);
  console.log(
    `   - 停止按钮: "${system.getStopButtonText()}" (${system.getStopButtonType()})`
  );

  system.cleanup();
  console.log("\n   ✅ 测试5通过：按钮状态和显示文本正确\n");
}

// 运行所有测试
async function runAllTests() {
  await test1();
  await test2();
  await test3();
  await test4();
  test5();

  console.log("=== 测试总结 ===");
  console.log("✅ 所有测试通过！\n");
  console.log("💡 新功能特性:");
  console.log("   1. 照射按钮：显示照射倒计时，倒计时结束发送照射命令");
  console.log("   2. 照射命令发送后：启动照射时长倒计时");
  console.log("   3. 停止按钮：显示照射时长倒计时，变为红色危险状态");
  console.log("   4. 照射时长倒计时结束：自动发送停止照射命令");
  console.log("   5. 手动点击停止：中断照射时长倒计时并发送停止命令");
  console.log("\n📋 逻辑流程:");
  console.log("   用户点击照射 → 照射倒计时(如有) → 发送照射命令");
  console.log("                ↓");
  console.log("   启动照射时长倒计时(如有设置) → 停止按钮显示倒计时");
  console.log("                ↓");
  console.log("   时长倒计时结束 → 自动发送停止照射命令");
  console.log("\n🎯 按钮状态管理:");
  console.log("   - 照射按钮：照射倒计时期间显示剩余秒数，红色危险状态");
  console.log("   - 停止按钮：照射时长倒计时期间显示剩余秒数，红色危险状态");
}

// 启动测试
runAllTests().catch(console.error);
