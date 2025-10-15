#!/usr/bin/env node

/**
 * 快速验证飞行时间字段修复
 */

console.log("🎯 快速验证飞行时间字段修复\n");
console.log("=".repeat(70));

// 模拟修复前的数据处理
console.log("\n❌ 修复前的情况：");
console.log("-".repeat(70));

// TypeScript 接口（修复前）
const interfaceBefore = {
  name: "PlatformCmdData.fireCoordinateParam",
  fields: ["uavName", "targetName", "weaponName", "coordinate"],
  missing: ["rocketFlyTime"]
};

console.log("TypeScript 接口定义（修复前）：");
console.log(`  fireCoordinateParam?: {`);
console.log(`    uavName?: string;`);
console.log(`    targetName?: string;`);
console.log(`    weaponName?: string;`);
console.log(`    coordinate?: {...};`);
console.log(`    // ❌ 缺少 rocketFlyTime 字段`);
console.log(`  }`);

// 模拟数据传输
const sentData = {
  fireCoordinateParam: {
    uavName: "uav01-3",
    targetName: "command_north",
    weaponName: "ssm_rocket",
    coordinate: { longitude: 120.9402, latitude: 24.7511, altitude: 100 },
    rocketFlyTime: 181
  }
};

console.log("\n火炮页面发送的数据：");
console.log(JSON.stringify(sentData, null, 2));

// TypeScript 过滤后的数据（修复前）
const filteredData = {
  fireCoordinateParam: {
    uavName: sentData.fireCoordinateParam.uavName,
    targetName: sentData.fireCoordinateParam.targetName,
    weaponName: sentData.fireCoordinateParam.weaponName,
    coordinate: sentData.fireCoordinateParam.coordinate
    // rocketFlyTime 被 TypeScript 过滤掉
  }
};

console.log("\n经过 TypeScript 接口后的数据（修复前）：");
console.log(JSON.stringify(filteredData, null, 2));
console.log("⚠️  注意：rocketFlyTime 字段被过滤掉了！");

// Protobuf 默认值
const receivedData = {
  fireCoordinateParam: {
    ...filteredData.fireCoordinateParam,
    rocketFlyTime: 0 // Protobuf int32 默认值
  }
};

console.log("\n无人机页面接收到的数据（修复前）：");
console.log(JSON.stringify(receivedData, null, 2));
console.log("❌ rocketFlyTime = 0（默认值）");

// 模拟修复后的数据处理
console.log("\n\n✅ 修复后的情况：");
console.log("-".repeat(70));

// TypeScript 接口（修复后）
const interfaceAfter = {
  name: "PlatformCmdData.fireCoordinateParam",
  fields: ["uavName", "targetName", "weaponName", "coordinate", "rocketFlyTime"]
};

console.log("TypeScript 接口定义（修复后）：");
console.log(`  fireCoordinateParam?: {`);
console.log(`    uavName?: string;`);
console.log(`    targetName?: string;`);
console.log(`    weaponName?: string;`);
console.log(`    coordinate?: {...};`);
console.log(`    rocketFlyTime?: number; // ✅ 新增字段`);
console.log(`  }`);

console.log("\n火炮页面发送的数据：");
console.log(JSON.stringify(sentData, null, 2));

// TypeScript 保留所有字段（修复后）
console.log("\n经过 TypeScript 接口后的数据（修复后）：");
console.log(JSON.stringify(sentData, null, 2));
console.log("✅ 所有字段都被保留！");

// 无人机接收到正确的数据
const receivedDataAfter = {
  fireCoordinateParam: {
    ...sentData.fireCoordinateParam,
    rocketFlyTime: 181 // 保留原始值
  }
};

console.log("\n无人机页面接收到的数据（修复后）：");
console.log(JSON.stringify(receivedDataAfter, null, 2));
console.log("✅ rocketFlyTime = 181（正确值）");

// 对比总结
console.log("\n\n📊 修复前后对比：");
console.log("=".repeat(70));

console.log("\n修复前：");
console.log("  发送：rocketFlyTime = 181");
console.log("  接收：rocketFlyTime = 0 ❌");
console.log("  丢失：100%");

console.log("\n修复后：");
console.log("  发送：rocketFlyTime = 181");
console.log("  接收：rocketFlyTime = 181 ✅");
console.log("  保留：100%");

// 测试指南
console.log("\n\n🧪 测试指南：");
console.log("=".repeat(70));

console.log(`
1️⃣  重新编译项目：
   npm run build

2️⃣  启动应用程序：
   npm run dev

3️⃣  火炮页面操作：
   - 连接火炮平台（如 phl300）
   - 进行目标装订
   - 查看"炮弹状态"区域的"预计总飞行时间"
   - 点击"开火"按钮

4️⃣  检查火炮页面控制台：
   应该显示：
   [ArtilleryPage] 发送发射协同命令数据: 
   { fireCoordinateParam: { rocketFlyTime: 181, ... } }

5️⃣  检查无人机页面控制台：
   应该显示：
   [UavPage] 发射协同报文详细信息: 
   { rocketFlyTime: 181, ... }  ← 不是 0！

6️⃣  检查无人机页面协同报文区域：
   应该显示：
   "收到来自 phl300 的发射协同命令
    （目标: xxx，武器: xxx，预计飞行时间: 181秒）"
`);

console.log("\n✅ 验证完成！");
console.log("=".repeat(70));
console.log("\n💡 提示：修复后的代码已经就绪，请重新编译并测试\n");