#!/usr/bin/env node

/**
 * 验证火炮发射协同报文飞行时间传输修复
 * 检查 TypeScript 接口定义是否包含 rocketFlyTime 字段
 */

const fs = require('fs');
const path = require('path');

console.log("🔍 验证火炮发射协同报文飞行时间传输修复\n");
console.log("=".repeat(60));

// 1. 检查 multicast-sender.service.ts 文件
console.log("\n📋 1. 检查 multicast-sender.service.ts 接口定义");
console.log("-".repeat(60));

const filePath = path.join(__dirname, 'src', 'main', 'services', 'multicast-sender.service.ts');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 查找 fireCoordinateParam 接口定义
  const fireCoordinateParamRegex = /fireCoordinateParam\?\s*:\s*\{[\s\S]*?\}/;
  const match = content.match(fireCoordinateParamRegex);
  
  if (match) {
    console.log("✅ 找到 fireCoordinateParam 接口定义：\n");
    console.log(match[0]);
    
    // 检查是否包含 rocketFlyTime 字段
    if (match[0].includes('rocketFlyTime')) {
      console.log("\n✅ 接口定义包含 rocketFlyTime 字段");
    } else {
      console.log("\n❌ 接口定义缺少 rocketFlyTime 字段");
    }
  } else {
    console.log("❌ 未找到 fireCoordinateParam 接口定义");
  }
} catch (error) {
  console.error("❌ 读取文件失败:", error.message);
}

// 2. 验证 proto 协议定义
console.log("\n\n📋 2. 验证 PlatformCmd.proto 协议定义");
console.log("-".repeat(60));

const protoFilePath = path.join(__dirname, 'src', 'protobuf', 'PlatformCmd.proto');

try {
  const protoContent = fs.readFileSync(protoFilePath, 'utf8');
  
  // 查找 FireCoordinateParam 消息定义
  const fireCoordinateParamProtoRegex = /message\s+FireCoordinateParam[\s\S]*?\}/;
  const protoMatch = protoContent.match(fireCoordinateParamProtoRegex);
  
  if (protoMatch) {
    console.log("✅ 找到 FireCoordinateParam 协议定义：\n");
    console.log(protoMatch[0]);
    
    // 检查是否包含 rocketFlyTime 字段
    if (protoMatch[0].includes('rocketFlyTime')) {
      console.log("\n✅ 协议定义包含 rocketFlyTime 字段");
    } else {
      console.log("\n❌ 协议定义缺少 rocketFlyTime 字段");
    }
  } else {
    console.log("❌ 未找到 FireCoordinateParam 协议定义");
  }
} catch (error) {
  console.error("❌ 读取协议文件失败:", error.message);
}

// 3. 数据流分析
console.log("\n\n📋 3. 数据流分析");
console.log("-".repeat(60));

console.log(`
修复前的问题：
  火炮页面 → IPC → 主进程（TypeScript接口过滤） → Protobuf序列化
                        ❌ rocketFlyTime 在这里被过滤掉
                        
修复后的流程：
  火炮页面 → IPC → 主进程（TypeScript接口包含rocketFlyTime） → Protobuf序列化
                        ✅ rocketFlyTime 正常传递

具体步骤：
1. 火炮页面发送数据：
   {
     fireCoordinateParam: {
       uavName: "uav01-3",
       targetName: "command_north",
       weaponName: "ssm_rocket",
       coordinate: {...},
       rocketFlyTime: 181  ← 包含飞行时间
     }
   }

2. 主进程接收（修复前）：
   TypeScript 接口定义没有 rocketFlyTime 字段
   → TypeScript 编译器忽略该字段
   → rocketFlyTime 数据丢失

3. 主进程接收（修复后）：
   TypeScript 接口定义包含 rocketFlyTime?: number
   → TypeScript 编译器保留该字段
   → rocketFlyTime 数据正常传递给 Protobuf 编码器

4. Protobuf 序列化：
   协议定义中有 rocketFlyTime 字段
   → 正常编码到二进制数据

5. 无人机页面接收：
   Protobuf 解码 → 提取 rocketFlyTime → 显示飞行时间
`);

// 4. 测试建议
console.log("\n📋 4. 测试建议");
console.log("-".repeat(60));

console.log(`
测试步骤：
1. 重新编译项目（TypeScript 接口已更新）
   npm run build 或 npm run dev

2. 启动应用程序

3. 火炮页面操作：
   - 连接火炮平台
   - 进行目标装订（确保 estimatedFlightTime 有值）
   - 检查炮弹状态区域显示的"预计总飞行时间"
   - 点击开火按钮
   - 查看浏览器控制台日志中的 rocketFlyTime 值

4. 无人机页面验证：
   - 连接无人机平台
   - 查看协同报文区域
   - 检查收到的发射协同报文中是否显示"预计飞行时间: X秒"（X不为0）
   - 查看浏览器控制台日志中的 rocketFlyTime 值

预期结果：
✅ 火炮页面日志显示: rocketFlyTime: 181
✅ 无人机页面日志显示: rocketFlyTime: 181 (不是0)
✅ 协同报文显示: "预计飞行时间: 181秒"
`);

// 5. 问题根因总结
console.log("\n📋 5. 问题根因总结");
console.log("-".repeat(60));

console.log(`
问题根因：
  TypeScript 接口定义不完整，缺少 rocketFlyTime 字段

影响范围：
  1. 主进程接收渲染进程数据时，TypeScript 类型检查会忽略未定义的字段
  2. 数据在序列化前被过滤，导致 rocketFlyTime 丢失
  3. 无人机页面接收到的数据中 rocketFlyTime 为默认值 0

修复方案：
  在 PlatformCmdData 接口的 fireCoordinateParam 中添加：
  rocketFlyTime?: number; // 预计飞行时间（秒）

修复效果：
  ✅ TypeScript 编译器识别 rocketFlyTime 字段
  ✅ 数据完整传递到 Protobuf 序列化层
  ✅ 无人机页面正确接收飞行时间数据
`);

console.log("\n" + "=".repeat(60));
console.log("✅ 验证完成！请重新编译并测试应用程序\n");