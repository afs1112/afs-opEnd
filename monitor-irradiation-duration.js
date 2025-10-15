/**
 * 快速验证脚本：观察照射时长行为
 *
 * 使用方法：
 * 在浏览器控制台中运行此脚本，监控照射时长的变化
 */

console.log(
  "%c=== 照射时长编辑行为监控 ===",
  "color: blue; font-weight: bold; font-size: 14px"
);
console.log("");
console.log("📋 测试步骤：");
console.log("1. 连接无人机平台");
console.log("2. 观察照射时长是否自动填充");
console.log('3. 点击"编辑"按钮，修改照射时长');
console.log('4. 点击"确定"按钮保存');
console.log("5. 等待数据包到达（观察控制台）");
console.log("6. 验证输入框的值是否保持不变");
console.log("");

// 监控日志输出
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function (...args) {
  const message = args.join(" ");

  // 高亮显示与照射时长相关的日志
  if (message.includes("照射持续时间") || message.includes("照射时长")) {
    originalLog(
      "%c" + message,
      "color: green; font-weight: bold; background: #e8f5e9; padding: 2px 4px;"
    );
  } else if (message.includes("desigDuring")) {
    originalLog(
      "%c" + message,
      "color: orange; font-weight: bold; background: #fff3e0; padding: 2px 4px;"
    );
  } else {
    originalLog.apply(console, args);
  }
};

console.warn = function (...args) {
  const message = args.join(" ");

  if (message.includes("照射") || message.includes("duration")) {
    originalWarn(
      "%c⚠️ " + message,
      "color: orange; font-weight: bold; background: #fff3e0; padding: 2px 4px;"
    );
  } else {
    originalWarn.apply(console, args);
  }
};

console.log("");
console.log("%c✓ 监控已启动", "color: green; font-weight: bold;");
console.log("%c  照射时长相关的日志将以绿色高亮显示", "color: gray;");
console.log("");

// 提供辅助函数查看当前状态
window.checkIrradiationDuration = function () {
  console.log("");
  console.log("%c=== 当前照射时长状态 ===", "color: blue; font-weight: bold;");

  // 尝试从Vue组件中获取状态（需要Vue Devtools）
  try {
    const app = document.querySelector("#app");
    if (app && app.__vue_app__) {
      console.log("%c提示：请使用Vue Devtools查看组件状态", "color: gray;");
      console.log("  - irradiationDuration: 照射时长输入框的值");
      console.log("  - isDurationEditing: 是否处于编辑模式");
      console.log("  - isIrradiationDurationInitialized: 是否已初始化");
    }
  } catch (e) {
    console.log("%c无法直接访问Vue状态，请使用Vue Devtools", "color: gray;");
  }

  console.log("");
};

console.log(
  "%c💡 提示：运行 checkIrradiationDuration() 查看当前状态",
  "color: blue;"
);
console.log("");
