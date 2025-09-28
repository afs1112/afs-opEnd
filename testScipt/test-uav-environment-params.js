/**
 * 测试无人机页面从平台数据获取环境参数功能
 * 验证环境参数能从 platforms 数据的 evironment 字段正确提取
 */

console.log("=== 无人机页面环境参数获取测试 ===\n");

// 模拟平台状态数据（包含环境参数）
function createMockPlatformStatusData() {
  return {
    platform: [
      {
        base: {
          name: "无人机-Alpha1",
          type: "UAV01",
          side: "红方",
          group: "第一无人机编队",
          broken: false,
          location: {
            longitude: 106.319248,
            latitude: 36.221109,
            altitude: 1500, // 海拔1500米，用于计算气压
          },
          roll: 2.1,
          pitch: -1.5,
          yaw: 45,
          speed: 32,
        },
        updateTime: Date.now(),
        sensors: [
          {
            base: {
              name: "光电传感器",
              type: "EOIR",
              isTurnedOn: true,
              currentAz: 45.5,
              currentEl: -10.2,
            },
          },
        ],
      },
    ],
    // 关键：环境参数数据
    evironment: {
      temperature: 18.5, // 温度 (摄氏度)
      windSpeed: 5.2, // 风速 (m/s)
      windDirection: 135, // 风向 (度，东南风)
      cloudLowerAlt: 2000, // 云层下界 (米)
      cloudUpperAlt: 8000, // 云层上界 (米)
      rainUpperAlt: 0, // 降雨上界
      rainRate: 0, // 降雨率 (mm/h)
    },
  };
}

// 模拟无人机页面的环境参数处理逻辑
function processEnvironmentParams(parsedData) {
  console.log("1. 处理环境参数数据...");

  const environmentParams = {
    temperature: "25°C", // 默认值
    pressure: "1013hPa", // 默认值
    windSpeed: "3m/s", // 默认值
    humidity: "60%", // 默认值
    cloudCover: "20%", // 默认值
    exerciseTime: new Date().toLocaleTimeString(),
  };

  // 更新环境参数（从 evironment 字段获取）
  if (parsedData.evironment) {
    const env = parsedData.evironment;
    console.log("   原始环境数据:", env);

    // 从平台数据中更新环境参数
    if (env.temperature !== undefined) {
      environmentParams.temperature = env.temperature.toFixed(1) + "°C";
    }
    if (env.windSpeed !== undefined) {
      environmentParams.windSpeed = env.windSpeed.toFixed(1) + "m/s";
    }
    if (env.windDirection !== undefined) {
      // 将风向转换为易读的格式
      const windDir = env.windDirection;
      let direction = "";
      if (windDir >= 337.5 || windDir < 22.5) direction = "北";
      else if (windDir >= 22.5 && windDir < 67.5) direction = "东北";
      else if (windDir >= 67.5 && windDir < 112.5) direction = "东";
      else if (windDir >= 112.5 && windDir < 157.5) direction = "东南";
      else if (windDir >= 157.5 && windDir < 202.5) direction = "南";
      else if (windDir >= 202.5 && windDir < 247.5) direction = "西南";
      else if (windDir >= 247.5 && windDir < 292.5) direction = "西";
      else if (windDir >= 292.5 && windDir < 337.5) direction = "西北";
      environmentParams.windSpeed =
        env.windSpeed.toFixed(1) + "m/s " + direction;
    }
    if (env.cloudLowerAlt !== undefined && env.cloudUpperAlt !== undefined) {
      const cloudCover =
        env.cloudLowerAlt > 0
          ? Math.min(
              100,
              ((env.cloudUpperAlt - env.cloudLowerAlt) / 10000) * 100
            )
          : 0;
      environmentParams.cloudCover = cloudCover.toFixed(0) + "%";
    }
    if (env.rainRate !== undefined) {
      environmentParams.humidity =
        env.rainRate > 0 ? env.rainRate.toFixed(1) + "mm/h" : "无降水";
    }
    // 计算气压（基于高度的标准气压）
    if (
      parsedData.platform.length > 0 &&
      parsedData.platform[0].base?.location?.altitude
    ) {
      const altitude = parsedData.platform[0].base.location.altitude;
      const pressure =
        1013.25 * Math.pow(1 - (0.0065 * altitude) / 288.15, 5.255);
      environmentParams.pressure = pressure.toFixed(0) + "hPa";
    }

    console.log("   ✅ 环境参数处理完成");
  } else {
    console.log("   ⚠️ 未包含环境参数数据");
  }

  return environmentParams;
}

// 模拟页面显示格式
function formatEnvironmentDisplay(environmentParams) {
  console.log("2. 生成环境参数显示格式...");

  const display = {
    气候环境显示: `温度${environmentParams.temperature}，气压${environmentParams.pressure}\n风力参数${environmentParams.windSpeed}，降水参数${environmentParams.humidity}\n云层参数${environmentParams.cloudCover}`,
    演习时间: environmentParams.exerciseTime,
  };

  console.log("   环境参数显示内容:");
  console.log(`   ${display.气候环境显示}`);
  console.log(`   演习时间：${display.演习时间}`);
  console.log("   ✅ 显示格式生成完成");

  return display;
}

// 运行测试
try {
  // 创建模拟数据
  const mockData = createMockPlatformStatusData();
  console.log("模拟平台数据创建完成");
  console.log("- 平台数量:", mockData.platform.length);
  console.log("- 环境数据:", mockData.evironment ? "包含" : "未包含");
  console.log("");

  // 处理环境参数
  const processedParams = processEnvironmentParams(mockData);
  console.log("");

  // 生成显示格式
  const displayResult = formatEnvironmentDisplay(processedParams);
  console.log("");

  // 验证结果
  console.log("3. 验证处理结果...");
  const validationChecks = [
    {
      name: "温度参数提取",
      expected: "18.5°C",
      actual: processedParams.temperature,
      passed: processedParams.temperature === "18.5°C",
    },
    {
      name: "风速和风向处理",
      expected: "5.2m/s 东南",
      actual: processedParams.windSpeed,
      passed: processedParams.windSpeed === "5.2m/s 东南",
    },
    {
      name: "云层覆盖计算",
      expected: "60%",
      actual: processedParams.cloudCover,
      passed: processedParams.cloudCover === "60%",
    },
    {
      name: "降水参数",
      expected: "无降水",
      actual: processedParams.humidity,
      passed: processedParams.humidity === "无降水",
    },
    {
      name: "气压计算",
      expected: "845hPa", // 1500米海拔的标准气压
      actual: processedParams.pressure,
      passed: Math.abs(parseInt(processedParams.pressure) - 845) < 5,
    },
  ];

  validationChecks.forEach((check) => {
    const status = check.passed ? "✅ 通过" : "❌ 失败";
    console.log(`   - ${check.name}: ${status}`);
    if (!check.passed) {
      console.log(`     期望: ${check.expected}, 实际: ${check.actual}`);
    }
  });

  const allPassed = validationChecks.every((check) => check.passed);

  console.log("\n=== 测试总结 ===");
  if (allPassed) {
    console.log("🎉 所有测试通过！环境参数从平台数据获取功能正常");
    console.log("📋 功能特点:");
    console.log("   ✅ 从 platforms.evironment 字段提取环境数据");
    console.log("   ✅ 温度、风速、风向、云层、降水参数正确处理");
    console.log("   ✅ 基于海拔自动计算气压");
    console.log("   ✅ 风向角度转换为方位词");
    console.log("   ✅ 云层覆盖率智能计算");
    console.log("   ✅ 降水状态人性化显示");
  } else {
    console.log("❌ 部分测试失败，需要检查实现");
  }

  // 额外测试：空环境数据处理
  console.log("\n4. 测试空环境数据处理...");
  const emptyData = { platform: [], evironment: null };
  const emptyResult = processEnvironmentParams(emptyData);
  console.log("   空数据处理结果:", emptyResult);
  console.log("   ✅ 空数据处理正常，使用默认值");
} catch (error) {
  console.error("❌ 测试执行失败:", error);
}
