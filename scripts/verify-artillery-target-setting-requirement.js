/**
 * 验证脚本：火炮开火按钮的目标装订状态检查
 *
 * 目的：验证开火按钮是否正确检查目标装订状态
 *
 * 根据规范：
 * - 火炮页面目标装订上方的目标信息，若未收到协同命令报文则显示'暂无目标信息'
 * - 目标装订按钮和开火按钮均应禁用
 * - 只有在接收到报文并加载目标后，方可进行装订和开火操作
 */

console.log("=".repeat(80));
console.log("火炮开火按钮目标装订状态检查验证");
console.log("=".repeat(80));

// 定义测试场景
const testScenarios = [
  {
    name: "场景1：未连接平台",
    state: {
      isConnected: false,
      artilleryStatus: { isLoaded: false },
      loadedAmmunitionType: "",
      currentTarget: { name: "" },
      connectedPlatform: null,
      actualLoadedCount: 0,
    },
    expectedDisabled: true,
    reason: "平台未连接，所有操作应禁用",
  },
  {
    name: "场景2：已连接但未装填弹药",
    state: {
      isConnected: true,
      artilleryStatus: { isLoaded: false },
      loadedAmmunitionType: "",
      currentTarget: { name: "目标-001" },
      connectedPlatform: { targetLoad: { targetName: "目标-001" } },
      actualLoadedCount: 0,
    },
    expectedDisabled: true,
    reason: "弹药未装填，开火按钮应禁用",
  },
  {
    name: "场景3：已装填但未装订目标",
    state: {
      isConnected: true,
      artilleryStatus: { isLoaded: true },
      loadedAmmunitionType: "155mm榴弹",
      currentTarget: { name: "" },
      connectedPlatform: null,
      actualLoadedCount: 5,
    },
    expectedDisabled: true,
    reason: "目标未装订（currentTarget.name为空），开火按钮应禁用",
  },
  {
    name: "场景4：已装填但未收到TargetLoad反馈",
    state: {
      isConnected: true,
      artilleryStatus: { isLoaded: true },
      loadedAmmunitionType: "155mm榴弹",
      currentTarget: { name: "目标-001" },
      connectedPlatform: null, // 没有targetLoad数据
      actualLoadedCount: 5,
    },
    expectedDisabled: true,
    reason: "虽有目标名称但未收到平台TargetLoad反馈，开火按钮应禁用",
  },
  {
    name: "场景5：已装填且目标已装订（完整状态）",
    state: {
      isConnected: true,
      artilleryStatus: { isLoaded: true },
      loadedAmmunitionType: "155mm榴弹",
      currentTarget: { name: "目标-001" },
      connectedPlatform: {
        targetLoad: {
          targetName: "目标-001",
          distance: 25000,
          bearing: 45,
          azimuth: 45.5,
          pitch: 12.3,
        },
      },
      actualLoadedCount: 5,
    },
    expectedDisabled: false,
    reason: "所有条件满足，开火按钮应启用",
  },
  {
    name: "场景6：装填数量为0",
    state: {
      isConnected: true,
      artilleryStatus: { isLoaded: true },
      loadedAmmunitionType: "155mm榴弹",
      currentTarget: { name: "目标-001" },
      connectedPlatform: {
        targetLoad: { targetName: "目标-001" },
      },
      actualLoadedCount: 0, // 数量为0
    },
    expectedDisabled: true,
    reason: "装填数量为0，开火按钮应禁用",
  },
];

// 模拟开火按钮的禁用逻辑
function isFireButtonDisabled(state) {
  return (
    !state.isConnected ||
    !state.artilleryStatus.isLoaded ||
    !state.loadedAmmunitionType ||
    !state.currentTarget.name ||
    !state.connectedPlatform?.targetLoad ||
    state.actualLoadedCount < 1
  );
}

// 执行测试
console.log("\n测试结果：\n");
console.log(
  "场景名称".padEnd(40) + "预期状态".padEnd(15) + "实际状态".padEnd(15) + "结果"
);
console.log("-".repeat(80));

let passCount = 0;
let failCount = 0;

testScenarios.forEach((scenario) => {
  const actualDisabled = isFireButtonDisabled(scenario.state);
  const passed = actualDisabled === scenario.expectedDisabled;

  if (passed) passCount++;
  else failCount++;

  const statusText = actualDisabled ? "禁用" : "启用";
  const expectedText = scenario.expectedDisabled ? "禁用" : "启用";
  const resultIcon = passed ? "✓" : "✗";

  console.log(
    scenario.name.padEnd(40) +
      expectedText.padEnd(15) +
      statusText.padEnd(15) +
      resultIcon
  );

  if (!passed) {
    console.log(`  错误原因：预期${expectedText}，实际${statusText}`);
  }
  console.log(`  规范说明：${scenario.reason}`);
  console.log();
});

// 测试总结
console.log("=".repeat(80));
console.log("测试总结");
console.log("=".repeat(80));
console.log(`总测试数：${testScenarios.length}`);
console.log(`通过数：${passCount} ✓`);
console.log(`失败数：${failCount} ✗`);
console.log(
  `通过率：${((passCount / testScenarios.length) * 100).toFixed(2)}%`
);

// 关键检查点说明
console.log("\n" + "=".repeat(80));
console.log("开火按钮禁用条件详解");
console.log("=".repeat(80));
console.log(`
1. !isConnected
   → 平台未连接时禁用

2. !artilleryStatus.isLoaded
   → 弹药未装填时禁用

3. !loadedAmmunitionType
   → 没有选择弹药类型时禁用

4. !currentTarget.name (关键新增)
   → 没有目标名称时禁用（确保已接收协同命令）

5. !connectedPlatform?.targetLoad (关键新增)
   → 没有收到平台TargetLoad反馈时禁用（确保目标已成功装订）

6. actualLoadedCount < 1
   → 装填数量小于1时禁用

说明：
- 条件4和5共同确保了"只有在接收到报文并加载目标后，方可进行开火操作"
- currentTarget.name 确保收到了协同命令报文
- connectedPlatform?.targetLoad 确保平台已成功装订并返回目标参数
- 这两个条件缺一不可，提供了双重保障
`);

console.log("\n" + "=".repeat(80));
console.log("代码实现位置");
console.log("=".repeat(80));
console.log(`
文件：src/renderer/views/pages/ArtilleryOperationPage.vue
位置：约第333-346行

代码片段：
<el-button
  class="target-setting-btn"
  @click="fireAtDrone"
  :type="isFiring ? 'danger' : 'primary'"
  :disabled="
    !isConnected ||
    !artilleryStatus.isLoaded ||
    !loadedAmmunitionType ||
    !currentTarget.name ||                    ← 确保有目标名称
    !connectedPlatform?.targetLoad ||         ← 确保收到TargetLoad反馈
    actualLoadedCount < 1
  "
>
  <span v-if="isFiring">开火中...</span>
  <span v-else>开火 ({{ actualLoadedCount }}发)</span>
</el-button>
`);

console.log("\n" + "=".repeat(80));
console.log("验证完成！");
console.log("=".repeat(80));

// 退出码
process.exit(failCount > 0 ? 1 : 0);
