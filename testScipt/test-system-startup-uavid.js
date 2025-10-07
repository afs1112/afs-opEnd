#!/usr/bin/env node

/**
 * 测试系统启动时UavId自动生成功能
 * 验证修改后的系统启动时自动生成UavId并写入导航配置文件的功能
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 系统启动时UavId自动生成功能测试\n");

console.log("📋 测试目标:");
console.log("- 验证系统启动时自动生成4位数字UavId");
console.log("- 验证UavId自动写入导航软件配置文件");
console.log("- 验证不再需要点击按钮才生成UavId");
console.log("- 验证prepareForNavigation()不再生成新ID\n");

console.log("🔧 实现原理:");
console.log(
  "1. main.ts的app.whenReady()中调用uavIdService.initializeOnStartup()"
);
console.log("2. initializeOnStartup()会自动获取或生成UavId并写入导航配置");
console.log("3. prepareForNavigation()简化为只获取已有ID，不再生成新ID");
console.log("4. 系统启动即完成UavId的初始化和同步\n");

console.log("🧪 测试场景:\n");

console.log("   📝 场景1: 全新系统启动测试");
console.log("   步骤:");
console.log("   1. 删除现有的uav-id-config.json文件（如果存在）");
console.log("   2. 启动应用程序");
console.log("   3. 观察控制台日志输出");
console.log("   4. 检查是否自动生成了4位数字UavId");
console.log("   5. 检查Nav配置文件是否已更新");
console.log("   预期: 系统启动时自动生成UavId并写入配置文件\n");

console.log("   🔄 场景2: 已有配置启动测试");
console.log("   步骤:");
console.log("   1. 确保已有uav-id-config.json配置文件");
console.log("   2. 重新启动应用程序");
console.log("   3. 观察是否使用现有UavId");
console.log("   4. 检查Nav配置文件是否与现有UavId一致");
console.log("   预期: 使用现有UavId，不生成新的\n");

console.log("   🚀 场景3: 导航启动测试");
console.log("   步骤:");
console.log("   1. 系统已启动并初始化UavId");
console.log('   2. 点击"打开导航软件"按钮');
console.log("   3. 观察是否还会生成新的UavId");
console.log("   4. 检查prepareForNavigation()的行为");
console.log("   预期: 不生成新UavId，直接使用系统启动时的ID\n");

console.log("   🔍 场景4: 配置文件验证测试");
console.log("   步骤:");
console.log("   1. 启动系统后检查生成的配置文件");
console.log("   2. 验证uav-id-config.json的内容");
console.log("   3. 验证Nav/data/config.ini的ID1字段");
console.log("   4. 确认两个文件中的UavId一致");
console.log("   预期: 配置文件正确生成，UavId一致\n");

console.log("📊 验证要点:\n");

console.log("   ✅ 控制台日志验证:");
console.log('   - 看到"[System] 初始化UavId服务..."');
console.log('   - 看到"[System] ✅ UavId服务初始化成功，UavId: XXXX"');
console.log('   - 看到"[UavId] 系统启动初始化成功，UavId: XXXX"');
console.log('   - 看到"[UavId] ✅ 导航配置文件已更新，UavId: XXXX"\n');

console.log("   📁 配置文件验证:");
console.log("   - uav-id-config.json文件存在且包含4位数字UavId");
console.log("   - Nav/data/config.ini文件的ID1字段已更新");
console.log("   - 两个文件中的UavId保持一致\n");

console.log("   🔄 功能验证:");
console.log('   - 点击"航线规划"或"打开导航软件"不再生成新UavId');
console.log("   - prepareForNavigation()只返回现有ID");
console.log("   - 系统重启后使用相同的UavId（除非手动更改）\n");

console.log("🚨 注意事项:");
console.log("- 第一次启动时会自动生成4位数字UavId");
console.log("- 后续启动会复用已有的UavId");
console.log("- 只有手动生成新ID时才会更新");
console.log("- 确保Nav目录结构正确，配置文件能正常写入\n");

console.log("🎯 预期效果:");
console.log("✅ 系统启动即可使用，无需等待用户操作");
console.log("✅ UavId在整个系统生命周期中保持一致");
console.log("✅ 导航软件配置始终与系统UavId同步");
console.log("✅ 用户体验更加流畅，无需手动干预\n");

// 简单的配置文件检查辅助函数
function checkConfigFiles() {
  console.log("🔍 检查配置文件状态...\n");

  // 检查UavId配置文件
  const uavIdConfigPath = path.join(__dirname, "..", "uav-id-config.json");
  if (fs.existsSync(uavIdConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(uavIdConfigPath, "utf8"));
      console.log("✅ uav-id-config.json 存在");
      console.log(`   当前UavId: ${config.currentId || "未设置"}`);
      console.log(
        `   自动生成: ${config.settings?.autoGenerate ? "启用" : "禁用"}`
      );
      console.log(`   历史记录: ${config.history?.length || 0} 条\n`);
    } catch (error) {
      console.log("❌ uav-id-config.json 格式错误");
    }
  } else {
    console.log("ℹ️  uav-id-config.json 不存在（首次启动后会自动创建）\n");
  }

  // 检查Nav配置文件
  const navConfigPath = path.join(__dirname, "..", "Nav", "data", "config.ini");
  if (fs.existsSync(navConfigPath)) {
    try {
      const content = fs.readFileSync(navConfigPath, "utf8");
      const lines = content.split("\n");
      const id1Line = lines.find((line) => line.startsWith("ID1="));
      if (id1Line) {
        const id1Value = id1Line.split("=")[1];
        console.log("✅ Nav/data/config.ini 存在");
        console.log(`   ID1值: ${id1Value}\n`);
      } else {
        console.log("⚠️  Nav/data/config.ini 存在但未找到ID1字段\n");
      }
    } catch (error) {
      console.log("❌ Nav/data/config.ini 读取错误\n");
    }
  } else {
    console.log("ℹ️  Nav/data/config.ini 不存在（首次启动后会自动创建）\n");
  }
}

// 运行配置文件检查
checkConfigFiles();

console.log("💡 使用说明:");
console.log("1. 运行此脚本检查当前配置状态");
console.log("2. 启动应用程序并观察控制台日志");
console.log("3. 检查生成的配置文件");
console.log("4. 验证功能是否按预期工作\n");

console.log("🏁 测试完成！");
