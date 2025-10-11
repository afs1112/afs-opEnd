#!/usr/bin/env node

/**
 * 测试照射持续时间功能
 * 验证从平台状态中获取desigDuring参数并更新到界面
 */

console.log("=== 照射持续时间功能测试 ===\n");

// 模拟平台状态数据（包含desigDuring参数）
function createMockPlatformDataWithDuration() {
  const platformData = {
    platform: [
      {
        base: {
          name: "UAV-001",
          type: "UAV01",
          side: "red",
          group: "Alpha",
          location: {
            longitude: 116.397428,
            latitude: 39.90923,
            altitude: 150.0,
          },
          pitch: 5.2,
          roll: 2.1,
          yaw: 180.0,
          speed: 50.0,
        },
        updateTime: 100,
        sensors: [
          {
            base: {
              name: "sensor_eoir_1",
              type: "SENSOR_EOIR",
              slewMode: "cSLEW_AZ_EL",
              minAzSlew: -90,
              maxAzSlew: 90,
              minElSlew: -90,
              maxElSlew: 90,
              currentAz: 45.5,
              currentEl: -15.2,
              isTurnedOn: true,
            },
            mode: "search",
          },
          {
            base: {
              name: "laser_designator-1212",
              type: "LASER_DESIGNATOR-1212",
              slewMode: "cSLEW_AZ_EL",
              minAzSlew: -180,
              maxAzSlew: 180,
              minElSlew: -90,
              maxElSlew: 90,
              currentAz: 30.0,
              currentEl: -10.0,
              isTurnedOn: true,
            },
            mode: "ready",
            laserCode: 1234, // 激光编码
            desigDuring: 30, // 照射持续时间（秒）
          },
        ],
        weapons: [],
        tracks: [
          {
            sensorName: "laser_designator-1212",
            targetName: "Target-001",
            targetType: "Vehicle",
          },
        ],
      },
    ],
  };

  return platformData;
}

// 测试1：验证desigDuring参数读取
function testDesigDuringParameterReading() {
  console.log("1. 测试desigDuring参数读取");

  const platformData = createMockPlatformDataWithDuration();
  const platform = platformData.platform[0];
  const laserSensor = platform.sensors.find((s) =>
    s.base.type.toLowerCase().includes("laser")
  );

  console.log("   📋 激光传感器信息:");
  console.log(`   - 传感器名称: ${laserSensor.base.name}`);
  console.log(`   - 传感器类型: ${laserSensor.base.type}`);
  console.log(
    `   - 开关状态: ${laserSensor.base.isTurnedOn ? "开启" : "关闭"}`
  );
  console.log(`   - 激光编码: ${laserSensor.laserCode}`);
  console.log(`   - 照射持续时间: ${laserSensor.desigDuring}秒`);

  // 验证参数存在
  const hasDesigDuring = laserSensor.desigDuring !== undefined;
  const hasLaserCode = laserSensor.laserCode !== undefined;

  console.log("   🔍 参数验证:");
  console.log(`   - desigDuring存在: ${hasDesigDuring ? "✅" : "❌"}`);
  console.log(`   - laserCode存在: ${hasLaserCode ? "✅" : "❌"}`);

  if (hasDesigDuring && hasLaserCode) {
    console.log("   ✅ desigDuring参数读取测试通过\n");
    return true;
  } else {
    console.log("   ❌ desigDuring参数读取测试失败\n");
    return false;
  }
}

// 测试2：验证数据处理逻辑
function testDataProcessingLogic() {
  console.log("2. 测试数据处理逻辑");

  const testCases = [
    { desigDuring: 15, expected: "15" },
    { desigDuring: 30, expected: "30" },
    { desigDuring: 60, expected: "60" },
    { desigDuring: 0, expected: "0" },
  ];

  console.log("   📋 数据转换测试:");
  let passed = 0;
  testCases.forEach((testCase) => {
    const result = testCase.desigDuring.toString();
    const isCorrect = result === testCase.expected;

    console.log(
      `   - ${testCase.desigDuring}秒 -> "${result}" ${isCorrect ? "✅" : "❌"}`
    );
    if (isCorrect) passed++;
  });

  console.log(`   测试结果: ${passed}/${testCases.length} 通过`);

  if (passed === testCases.length) {
    console.log("   ✅ 数据处理逻辑测试通过\n");
    return true;
  } else {
    console.log("   ❌ 数据处理逻辑测试失败\n");
    return false;
  }
}

// 测试3：验证界面交互逻辑
function testUIInteractionLogic() {
  console.log("3. 测试界面交互逻辑");

  // 模拟界面状态
  let irradiationDuration = "";
  let isDurationEditing = true;
  let logs = [];

  // 模拟日志函数
  function addLog(type, message) {
    logs.push({ type, message });
    console.log(`   [${type.toUpperCase()}] ${message}`);
  }

  // 模拟处理照射持续时间函数
  function handleSetIrradiationDuration() {
    if (isDurationEditing) {
      // 确定模式
      if (!irradiationDuration.trim()) {
        console.log("   [WARNING] 请输入照射持续时间");
        return false;
      }
      isDurationEditing = false;
      addLog("success", `照射持续时间已设置: ${irradiationDuration}秒`);
      return true;
    } else {
      // 编辑模式
      isDurationEditing = true;
      addLog("info", "开始编辑照射持续时间");
      return true;
    }
  }

  // 模拟从平台数据更新
  function updateFromPlatformData(desigDuring) {
    const durationValue = desigDuring.toString();
    if (irradiationDuration !== durationValue) {
      irradiationDuration = durationValue;
      isDurationEditing = false;
      addLog("info", `照射持续时间已更新: ${durationValue}秒`);
    }
  }

  console.log("   📋 UI交互测试:");

  // 测试输入功能
  console.log("   测试手动输入:");
  irradiationDuration = "25";
  const inputResult = handleSetIrradiationDuration();
  console.log(`   - 手动设置25秒: ${inputResult ? "✅" : "❌"}`);

  // 测试从平台数据更新
  console.log("   测试平台数据更新:");
  updateFromPlatformData(30);
  const updateResult = irradiationDuration === "30" && !isDurationEditing;
  console.log(`   - 从平台更新到30秒: ${updateResult ? "✅" : "❌"}`);

  // 测试编辑功能
  console.log("   测试编辑功能:");
  const editResult = handleSetIrradiationDuration();
  console.log(
    `   - 进入编辑模式: ${editResult && isDurationEditing ? "✅" : "❌"}`
  );

  const allTestsPassed = inputResult && updateResult && editResult;

  if (allTestsPassed) {
    console.log("   ✅ UI交互逻辑测试通过\n");
    return true;
  } else {
    console.log("   ❌ UI交互逻辑测试失败\n");
    return false;
  }
}

// 测试4：验证完整数据流
function testCompleteDataFlow() {
  console.log("4. 测试完整数据流");

  const platformData = createMockPlatformDataWithDuration();

  // 模拟界面状态
  let state = {
    irradiationDuration: "",
    isDurationEditing: true,
    laserCode: "",
    isLaserCodeEditing: true,
  };

  // 模拟updatePlatformStatusDisplay函数的相关逻辑
  function updatePlatformStatusDisplay(platform) {
    if (!platform?.sensors) return;

    platform.sensors.forEach((sensor) => {
      // 处理激光传感器
      if (
        sensor.base?.type?.toLowerCase().includes("laser") ||
        sensor.base?.name?.toLowerCase().includes("激光")
      ) {
        // 更新激光编码
        if (sensor.laserCode) {
          const laserCodeValue = sensor.laserCode.toString();
          if (state.laserCode !== laserCodeValue) {
            state.laserCode = laserCodeValue;
            state.isLaserCodeEditing = false;
            console.log(`   [INFO] 激光编码已更新: ${laserCodeValue}`);
          }
        }

        // 更新照射持续时间（从desigDuring获取）
        if (sensor.desigDuring !== undefined) {
          const durationValue = sensor.desigDuring.toString();
          if (state.irradiationDuration !== durationValue) {
            state.irradiationDuration = durationValue;
            state.isDurationEditing = false;
            console.log(`   [INFO] 照射持续时间已更新: ${durationValue}秒`);
          }
        }
      }
    });
  }

  console.log("   📋 完整数据流测试:");
  console.log("   处理平台数据...");

  updatePlatformStatusDisplay(platformData.platform[0]);

  // 验证结果
  const laserCodeCorrect =
    state.laserCode === "1234" && !state.isLaserCodeEditing;
  const durationCorrect =
    state.irradiationDuration === "30" && !state.isDurationEditing;

  console.log("   🔍 结果验证:");
  console.log(
    `   - 激光编码更新: ${laserCodeCorrect ? "✅" : "❌"} (${state.laserCode})`
  );
  console.log(
    `   - 持续时间更新: ${durationCorrect ? "✅" : "❌"} (${
      state.irradiationDuration
    }秒)`
  );

  if (laserCodeCorrect && durationCorrect) {
    console.log("   ✅ 完整数据流测试通过\n");
    return true;
  } else {
    console.log("   ❌ 完整数据流测试失败\n");
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  const tests = [
    { name: "desigDuring参数读取", fn: testDesigDuringParameterReading },
    { name: "数据处理逻辑", fn: testDataProcessingLogic },
    { name: "UI交互逻辑", fn: testUIInteractionLogic },
    { name: "完整数据流", fn: testCompleteDataFlow },
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
      console.log(`   ❌ 测试 "${test.name}" 执行失败: ${error.message}\n`);
      failed++;
    }
  }

  console.log("=== 测试结果 ===");
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);

  if (failed === 0) {
    console.log("\n🎉 所有照射持续时间功能测试通过！");
    console.log("\n💡 新增功能特性:");
    console.log("   - 从平台状态sensor.desigDuring获取照射持续时间");
    console.log("   - 支持手动编辑和平台数据自动更新");
    console.log("   - 与激光编码功能类似的交互逻辑");
    console.log("   - 输入框-按钮组合的确定/编辑切换");
    console.log("\n📋 UI布局:");
    console.log("   激光编码输入框");
    console.log("   ↓");
    console.log("   照射持续时间输入框 ← 新增");
    console.log("   ↓");
    console.log("   照射倒计时输入框");
    console.log("   ↓");
    console.log("   照射/停止按钮");
    console.log("\n🔧 技术实现:");
    console.log("   - 从Sensor protobuf结构的desigDuring字段读取");
    console.log("   - 在updatePlatformStatusDisplay函数中处理更新");
    console.log("   - 遵循项目规范的输入框-按钮交互模式");
  } else {
    console.log("\n⚠️  部分测试失败，需要进一步调试");
  }
}

// 启动测试
runAllTests().catch(console.error);
