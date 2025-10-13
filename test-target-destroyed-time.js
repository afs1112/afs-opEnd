/**
 * 无人机页面目标摧毁时间展示功能测试脚本
 *
 * 测试场景:
 * 1. 无人机连接并扫描到目标
 * 2. 目标被摧毁（从平台数据中消失）
 * 3. 验证目标显示"已摧毁"状态及摧毁时间
 *
 * 验证要点:
 * - 目标摧毁时应记录当前演习时间
 * - 摧毁时间应持久化显示在目标列表中
 * - 摧毁时间格式应为演习时间格式（如"T + 123秒"）
 */

const { chromium } = require("playwright");

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTargetDestroyedTimeDisplay() {
  console.log("\n=== 开始测试：无人机页面目标摧毁时间展示 ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. 打开应用并进入无人机页面
    console.log("步骤 1: 打开应用...");
    await page.goto("http://localhost:5173");
    await delay(2000);

    console.log('步骤 2: 点击"无人机操作"卡片...');
    const uavCard = page.locator("text=无人机操作").first();
    await uavCard.click();
    await delay(2000);

    // 2. 选择分组和无人机
    console.log("步骤 3: 选择分组...");
    const groupSelect = page.locator(".control-select.short >> nth=0");
    await groupSelect.click();
    await delay(500);

    // 选择第一个分组选项
    const firstGroupOption = page.locator(".el-select-dropdown__item").first();
    await firstGroupOption.click();
    await delay(1000);

    console.log("步骤 4: 选择无人机...");
    const uavSelect = page.locator(".control-select.large >> nth=0");
    await uavSelect.click();
    await delay(500);

    // 选择第一个无人机选项
    const firstUavOption = page.locator(".el-select-dropdown__item").first();
    await firstUavOption.click();
    await delay(1000);

    // 3. 连接平台
    console.log("步骤 5: 连接平台...");
    const connectButton = page.locator('button:has-text("连接平台")');
    await connectButton.click();
    await delay(3000);

    console.log("步骤 6: 等待平台数据更新...");
    await delay(5000);

    // 4. 检查是否有发现目标
    console.log("步骤 7: 检查发现目标列表...");
    const targetsList = page.locator(".targets-list");
    const targetsCount = await targetsList.locator(".target-item").count();
    console.log(`   发现 ${targetsCount} 个目标`);

    if (targetsCount === 0) {
      console.log(
        "   ⚠️ 警告: 当前没有检测到目标，请确保仿真系统正在运行并发送目标数据"
      );
      console.log("   提示: 本测试需要仿真系统提供目标跟踪数据");
    } else {
      // 5. 记录第一个目标的信息
      const firstTarget = targetsList.locator(".target-item").first();
      const targetName = await firstTarget
        .locator(".target-name")
        .textContent();
      console.log(`   第一个目标: ${targetName}`);

      // 检查目标的初始状态
      const targetStatus = await firstTarget
        .locator(".target-status-indicator")
        .textContent();
      console.log(`   初始状态: ${targetStatus}`);

      // 6. 等待一段时间观察目标状态变化
      console.log("\n步骤 8: 监控目标状态变化（等待30秒）...");
      console.log("   说明: 如果目标从平台数据中消失，将被判定为摧毁");

      for (let i = 0; i < 30; i++) {
        await delay(1000);

        // 检查目标状态
        const currentStatus = await firstTarget
          .locator(".target-status-indicator")
          .textContent();

        // 检查是否有摧毁状态
        const destroyedStatus = await firstTarget
          .locator(".destroyed-status")
          .count();

        if (destroyedStatus > 0) {
          console.log(`\n   ✅ 目标已摧毁！`);

          // 检查是否显示了摧毁时间
          const destroyedTime = await firstTarget
            .locator(".destroyed-time")
            .count();

          if (destroyedTime > 0) {
            const timeText = await firstTarget
              .locator(".destroyed-time")
              .textContent();
            console.log(`   ✅ 摧毁时间显示正确: ${timeText}`);
            console.log(`   验证通过: 目标摧毁时间已正确记录和显示`);
          } else {
            console.log(`   ❌ 错误: 目标已摧毁但未显示摧毁时间`);
          }

          break;
        } else {
          process.stdout.write(
            `\r   等待中... ${i + 1}/30秒 (当前状态: ${currentStatus.trim()})`
          );
        }
      }

      console.log("\n\n步骤 9: 检查摧毁目标的持久化显示...");

      // 等待额外5秒，确保摧毁状态持续显示
      await delay(5000);

      const destroyedStatusFinal = await firstTarget
        .locator(".destroyed-status")
        .count();
      if (destroyedStatusFinal > 0) {
        console.log("   ✅ 摧毁状态持久化显示正确");

        const destroyedTimeFinal = await firstTarget
          .locator(".destroyed-time")
          .count();
        if (destroyedTimeFinal > 0) {
          const timeTextFinal = await firstTarget
            .locator(".destroyed-time")
            .textContent();
          console.log(`   ✅ 摧毁时间持久化显示正确: ${timeTextFinal}`);
        }
      }
    }

    console.log("\n步骤 10: 测试完成，保持窗口打开以便手动检查...");
    console.log("   请手动检查以下内容:");
    console.log("   1. 发现目标列表中的目标状态指示器");
    console.log('   2. 已摧毁目标的"已摧毁"标签');
    console.log('   3. 摧毁时间的显示（格式应为"T + XXX秒"）');
    console.log("   4. 摧毁状态的视觉效果（红色背景、动画等）");

    // 保持浏览器打开以便手动检查
    await delay(60000);
  } catch (error) {
    console.error("\n❌ 测试过程中出现错误:", error.message);
    console.error(error.stack);
  } finally {
    console.log("\n关闭浏览器...");
    await browser.close();
    console.log("\n=== 测试结束 ===\n");
  }
}

// 运行测试
testTargetDestroyedTimeDisplay().catch(console.error);
