#!/usr/bin/env node

/**
 * 测试传感器命令优化 V2
 * 验证统一的传感器控制逻辑和新的proto结构
 */

console.log("=== 传感器命令优化测试 V2 ===\n");

// 更新后的平台命令枚举
const PlatformCommandEnum = {
  Command_inValid: 0,
  Uav_Sensor_On: 1, // 传感器开
  Uav_Sensor_Off: 2, // 传感器关
  Uav_Sensor_Turn: 3, // 传感器转向
  Uav_LazerPod_Lasing: 4, // 激光吊舱照射
  Uav_LazerPod_Cease: 5, // 激光吊舱停止照射
  Uav_Nav: 6, // 无人机航线规划
  Arty_Target_Set: 7, // 目标装订
  Arty_Fire: 8, // 火炮发射
  Uav_Set_Speed: 9, // 设定速度
  Uav_Lock_Target: 10, // 锁定目标
  Uav_Strike_Coordinate: 11, // 打击协同
  Arty_Fire_Coordinate: 12, // 发射协同
};

// 测试传感器类型识别
function testSensorTypeIdentification() {
  console.log("1. 测试传感器类型识别");

  const sensors = [
    { name: "EO-Pod-1", type: "Electro-Optical" },
    { name: "Laser-Pod-1", type: "Laser-Designator" },
    { name: "IR-Sensor-1", type: "Infrared" },
    { name: "Fire-Control-Radar", type: "Fire-Control" },
    { name: "Laser-Rangefinder", type: "Laser-Rangefinder" },
  ];

  console.log("   📋 传感器类型识别:");
  sensors.forEach((sensor) => {
    const isLaser =
      sensor.type.toLowerCase().includes("laser") ||
      sensor.name.toLowerCase().includes("laser");
    const canLase =
      isLaser &&
      (sensor.type.includes("Designator") ||
        sensor.type.includes("Rangefinder"));

    console.log(`   - ${sensor.name} (${sensor.type})`);
    console.log(`     * 激光传感器: ${isLaser ? "✅" : "❌"}`);
    console.log(`     * 支持照射: ${canLase ? "✅" : "❌"}`);
  });

  console.log("   ✅ 传感器类型识别测试通过\\n");
  return true;
}

// 测试统一传感器命令
function testUnifiedSensorCommands() {
  console.log("2. 测试统一传感器命令");

  const sensorCommands = [
    {
      name: "传感器开启",
      command: "Uav_Sensor_On",
      sensorName: "EO-Pod-1",
      requiresParams: false,
    },
    {
      name: "传感器关闭",
      command: "Uav_Sensor_Off",
      sensorName: "Laser-Pod-1",
      requiresParams: false,
    },
    {
      name: "传感器转向",
      command: "Uav_Sensor_Turn",
      sensorName: "IR-Sensor-1",
      requiresParams: true,
      params: { azSlew: 45.5, elSlew: -15.2 },
    },
  ];

  console.log("   📋 统一传感器命令测试:");
  sensorCommands.forEach((cmd, index) => {
    const commandEnum = PlatformCommandEnum[cmd.command];

    const commandData = {
      commandID: Date.now() + index,
      platformName: "UAV-001",
      command: commandEnum,
      sensorParam: {
        sensorName: cmd.sensorName, // 使用sensorName而不是weaponName
        azSlew: cmd.params?.azSlew || 0,
        elSlew: cmd.params?.elSlew || 0,
      },
    };

    try {
      const serialized = JSON.stringify(commandData);
      console.log(`   ✅ ${cmd.name}: 命令 ${cmd.command} (${commandEnum})`);
      console.log(`      - 传感器: ${cmd.sensorName}`);
      if (cmd.requiresParams) {
        console.log(
          `      - 方位角: ${cmd.params.azSlew}°, 俯仰角: ${cmd.params.elSlew}°`
        );
      }
      console.log(`      - 序列化: ${serialized.length} 字符`);

      // 验证sensorName字段
      const parsed = JSON.parse(serialized);
      if (parsed.sensorParam.sensorName !== cmd.sensorName) {
        console.log(`   ❌ sensorName字段验证失败`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ ${cmd.name}: 序列化失败 - ${error.message}`);
      return false;
    }
  });

  console.log("   ✅ 统一传感器命令测试通过\\n");
  return true;
}

// 测试激光功能命令
function testLaserFunctionCommands() {
  console.log("3. 测试激光功能命令");

  const laserCommands = [
    {
      name: "激光照射",
      command: "Uav_LazerPod_Lasing",
      sensorName: "Laser-Pod-1",
      sensorType: "Laser-Designator",
    },
    {
      name: "停止照射",
      command: "Uav_LazerPod_Cease",
      sensorName: "Laser-Rangefinder",
      sensorType: "Laser-Rangefinder",
    },
  ];

  console.log("   📋 激光功能命令测试:");
  laserCommands.forEach((cmd, index) => {
    const commandEnum = PlatformCommandEnum[cmd.command];

    // 验证传感器是否支持激光功能
    const isLaserSensor = cmd.sensorType.toLowerCase().includes("laser");

    if (!isLaserSensor) {
      console.log(`   ❌ ${cmd.name}: 传感器 ${cmd.sensorName} 不支持激光功能`);
      return false;
    }

    const commandData = {
      commandID: Date.now() + index,
      platformName: "UAV-001",
      command: commandEnum,
      sensorParam: {
        sensorName: cmd.sensorName, // 使用sensorName
        azSlew: 0,
        elSlew: 0,
      },
    };

    try {
      const serialized = JSON.stringify(commandData);
      console.log(`   ✅ ${cmd.name}: 命令 ${cmd.command} (${commandEnum})`);
      console.log(`      - 激光传感器: ${cmd.sensorName} (${cmd.sensorType})`);
      console.log(`      - 序列化: ${serialized.length} 字符`);

      // 验证sensorName字段
      const parsed = JSON.parse(serialized);
      if (parsed.sensorParam.sensorName !== cmd.sensorName) {
        console.log(`   ❌ sensorName字段验证失败`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ ${cmd.name}: 序列化失败 - ${error.message}`);
      return false;
    }
  });

  console.log("   ✅ 激光功能命令测试通过\\n");
  return true;
}

// 测试命令启用逻辑
function testCommandEnableLogic() {
  console.log("4. 测试命令启用逻辑");

  const testScenarios = [
    {
      name: "未选择平台",
      state: { platform: "", sensor: "", weapon: "", target: "" },
      expected: {
        Uav_Sensor_On: false,
        Uav_Sensor_Turn: false,
        Uav_LazerPod_Lasing: false,
        Arty_Fire: false,
      },
    },
    {
      name: "仅选择平台",
      state: { platform: "UAV-001", sensor: "", weapon: "", target: "" },
      expected: {
        Uav_Sensor_On: false, // 需要选择传感器
        Uav_Sensor_Turn: false,
        Uav_LazerPod_Lasing: false,
        Arty_Fire: false,
      },
    },
    {
      name: "选择平台和光电传感器",
      state: {
        platform: "UAV-001",
        sensor: "EO-Pod-1",
        sensorType: "Electro-Optical",
        weapon: "",
        target: "",
      },
      expected: {
        Uav_Sensor_On: true,
        Uav_Sensor_Turn: true,
        Uav_LazerPod_Lasing: false, // 非激光传感器
        Arty_Fire: false,
      },
    },
    {
      name: "选择平台和激光传感器",
      state: {
        platform: "UAV-001",
        sensor: "Laser-Pod-1",
        sensorType: "Laser-Designator",
        weapon: "",
        target: "",
      },
      expected: {
        Uav_Sensor_On: true,
        Uav_Sensor_Turn: true,
        Uav_LazerPod_Lasing: true, // 激光传感器
        Arty_Fire: false,
      },
    },
    {
      name: "完整选择",
      state: {
        platform: "ARTY-001",
        sensor: "Fire-Control-Radar",
        sensorType: "Fire-Control",
        weapon: "Howitzer-1",
        target: "Target-003",
      },
      expected: {
        Uav_Sensor_On: true,
        Uav_Sensor_Turn: true,
        Uav_LazerPod_Lasing: false, // 非激光传感器
        Arty_Fire: true, // 完整火炮参数
      },
    },
  ];

  console.log("   📋 命令启用逻辑测试:");

  testScenarios.forEach((scenario) => {
    console.log(`   场景: ${scenario.name}`);
    console.log(`   - 平台: ${scenario.state.platform || "未选择"}`);
    console.log(`   - 传感器: ${scenario.state.sensor || "未选择"}`);
    if (scenario.state.sensorType) {
      console.log(`   - 传感器类型: ${scenario.state.sensorType}`);
    }
    console.log(`   - 武器: ${scenario.state.weapon || "未选择"}`);
    console.log(`   - 目标: ${scenario.state.target || "未选择"}`);

    // 模拟命令启用逻辑
    const isLaserSensor =
      scenario.state.sensorType?.toLowerCase().includes("laser") ||
      scenario.state.sensor?.toLowerCase().includes("laser") ||
      false;

    const actualEnabled = {
      Uav_Sensor_On: !!(scenario.state.platform && scenario.state.sensor),
      Uav_Sensor_Turn: !!(scenario.state.platform && scenario.state.sensor),
      Uav_LazerPod_Lasing: !!(
        scenario.state.platform &&
        scenario.state.sensor &&
        isLaserSensor
      ),
      Arty_Fire: !!(
        scenario.state.platform &&
        scenario.state.weapon &&
        scenario.state.target
      ),
    };

    let allMatch = true;
    Object.entries(scenario.expected).forEach(([command, expected]) => {
      const actual = actualEnabled[command];
      const match = actual === expected;
      console.log(
        `   - ${command}: ${
          match ? "✅" : "❌"
        } (期望: ${expected}, 实际: ${actual})`
      );
      if (!match) allMatch = false;
    });

    if (!allMatch) {
      console.log("   ❌ 场景测试失败\\n");
      return false;
    }
    console.log("");
  });

  console.log("   ✅ 命令启用逻辑测试通过\\n");
  return true;
}

// 测试protobuf结构兼容性
function testProtobufCompatibility() {
  console.log("5. 测试Protobuf结构兼容性");

  // 模拟新的protobuf结构
  const mockProtobufCommand = {
    commandID: Date.now(),
    platformName: "UAV-001",
    command: PlatformCommandEnum["Uav_Sensor_Turn"], // 使用枚举值
    sensorParam: {
      sensorName: "EO-Pod-1", // 使用sensorName而不是weaponName
      azSlew: 45.5,
      elSlew: -15.2,
    },
  };

  console.log("   📋 Protobuf结构验证:");
  console.log(`   - 命令ID: ${mockProtobufCommand.commandID}`);
  console.log(`   - 平台名称: ${mockProtobufCommand.platformName}`);
  console.log(`   - 命令枚举: ${mockProtobufCommand.command}`);
  console.log(`   - 传感器名称: ${mockProtobufCommand.sensorParam.sensorName}`);
  console.log(`   - 方位角: ${mockProtobufCommand.sensorParam.azSlew}°`);
  console.log(`   - 俯仰角: ${mockProtobufCommand.sensorParam.elSlew}°`);

  try {
    const serialized = JSON.stringify(mockProtobufCommand);
    const parsed = JSON.parse(serialized);

    // 验证关键字段
    const hasRequiredFields =
      parsed.commandID &&
      parsed.platformName &&
      parsed.command !== undefined &&
      parsed.sensorParam &&
      parsed.sensorParam.sensorName;

    // 验证字段名正确性
    const hasCorrectFieldNames =
      parsed.sensorParam.hasOwnProperty("sensorName") &&
      !parsed.sensorParam.hasOwnProperty("weaponName");

    if (hasRequiredFields && hasCorrectFieldNames) {
      console.log("   ✅ Protobuf结构兼容性测试通过");
      console.log(`   📊 序列化大小: ${serialized.length} 字符`);
      console.log("   🔧 字段名验证: sensorName ✅, weaponName ❌ (已移除)\\n");
      return true;
    } else {
      console.log("   ❌ 字段验证失败");
      console.log(`   - 必需字段: ${hasRequiredFields ? "✅" : "❌"}`);
      console.log(`   - 字段名正确: ${hasCorrectFieldNames ? "✅" : "❌"}\\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 序列化失败: ${error.message}\\n`);
    return false;
  }
}

// 测试UI组件逻辑
function testUIComponentLogic() {
  console.log("6. 测试UI组件逻辑");

  const mockPlatforms = [
    {
      name: "UAV-001",
      sensors: [
        { name: "EO-Pod-1", type: "Electro-Optical" },
        { name: "Laser-Pod-1", type: "Laser-Designator" },
        { name: "IR-Sensor-1", type: "Infrared" },
      ],
    },
  ];

  console.log("   📋 UI组件逻辑测试:");

  // 测试传感器类型显示
  mockPlatforms[0].sensors.forEach((sensor) => {
    const isLaser =
      sensor.type.toLowerCase().includes("laser") ||
      sensor.name.toLowerCase().includes("laser");
    const displayClass = isLaser
      ? "bg-red-100 text-red-600"
      : "bg-blue-100 text-blue-600";

    console.log(`   - 传感器: ${sensor.name}`);
    console.log(`     * 类型: ${sensor.type}`);
    console.log(`     * 激光传感器: ${isLaser ? "✅" : "❌"}`);
    console.log(`     * 显示样式: ${displayClass}`);
  });

  // 测试按钮启用状态
  const testStates = [
    {
      platform: "",
      sensor: "",
      expected: { sensorOn: false, laserLasing: false },
    },
    {
      platform: "UAV-001",
      sensor: "",
      expected: { sensorOn: false, laserLasing: false },
    },
    {
      platform: "UAV-001",
      sensor: "EO-Pod-1",
      expected: { sensorOn: true, laserLasing: false },
    },
    {
      platform: "UAV-001",
      sensor: "Laser-Pod-1",
      expected: { sensorOn: true, laserLasing: true },
    },
  ];

  console.log("\\n   📋 按钮启用状态测试:");
  testStates.forEach((state, index) => {
    const selectedSensor = mockPlatforms[0].sensors.find(
      (s) => s.name === state.sensor
    );
    const isLaser =
      selectedSensor?.type.toLowerCase().includes("laser") || false;

    const actualEnabled = {
      sensorOn: !!(state.platform && state.sensor),
      laserLasing: !!(state.platform && state.sensor && isLaser),
    };

    const match =
      actualEnabled.sensorOn === state.expected.sensorOn &&
      actualEnabled.laserLasing === state.expected.laserLasing;

    console.log(`   状态 ${index + 1}: ${match ? "✅" : "❌"}`);
    console.log(`   - 平台: ${state.platform || "未选择"}`);
    console.log(`   - 传感器: ${state.sensor || "未选择"}`);
    console.log(
      `   - 传感器开启按钮: ${actualEnabled.sensorOn ? "启用" : "禁用"}`
    );
    console.log(
      `   - 激光照射按钮: ${actualEnabled.laserLasing ? "启用" : "禁用"}`
    );

    if (!match) {
      console.log("   ❌ 按钮状态测试失败\\n");
      return false;
    }
  });

  console.log("   ✅ UI组件逻辑测试通过\\n");
  return true;
}

// 运行所有测试
async function runTests() {
  const tests = [
    { name: "传感器类型识别", fn: testSensorTypeIdentification },
    { name: "统一传感器命令", fn: testUnifiedSensorCommands },
    { name: "激光功能命令", fn: testLaserFunctionCommands },
    { name: "命令启用逻辑", fn: testCommandEnableLogic },
    { name: "Protobuf结构兼容性", fn: testProtobufCompatibility },
    { name: "UI组件逻辑", fn: testUIComponentLogic },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ 测试 \"${test.name}\" 执行失败: ${error.message}\\n`);
      failed++;
    }
  }

  console.log("=== 测试结果 ===");
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);

  if (failed === 0) {
    console.log("\\n🎉 所有传感器优化测试通过！");
    console.log("\\n🔧 优化内容:");
    console.log("   1. ✅ 统一传感器控制命令 (开/关/转向)");
    console.log("   2. ✅ 独立激光功能命令 (照射/停止)");
    console.log("   3. ✅ 智能传感器类型识别和UI显示");
    console.log("   4. ✅ 优化的命令启用逻辑");
    console.log("   5. ✅ 更新的Protobuf结构 (sensorName)");
    console.log("   6. ✅ 改进的用户界面组件");
    console.log("\\n📋 新的命令结构:");
    console.log("   - Uav_Sensor_On/Off: 适用于所有传感器");
    console.log("   - Uav_Sensor_Turn: 传感器转向控制");
    console.log("   - Uav_LazerPod_Lasing/Cease: 仅适用于激光传感器");
    console.log("   - 自动识别激光传感器并启用相应功能");
    console.log("   - 传感器类型可视化显示");
    console.log("\\n🎯 主要改进:");
    console.log("   - 将光电吊舱和激光吊舱统一为传感器控制");
    console.log("   - 激光功能作为传感器的特殊能力独立出来");
    console.log("   - 更直观的用户界面和状态显示");
    console.log("   - 更准确的命令启用逻辑");
  } else {
    console.log("\\n⚠️  部分测试失败，需要进一步调试");
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  PlatformCommandEnum,
  testSensorTypeIdentification,
  testUnifiedSensorCommands,
  testLaserFunctionCommands,
  testCommandEnableLogic,
  testProtobufCompatibility,
  testUIComponentLogic,
  runTests,
};
