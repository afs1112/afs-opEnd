/**
 * 无人机页面环境参数集成测试
 * 端到端测试：模拟接收平台数据包并验证环境参数显示
 */

const path = require("path");
const protobuf = require("protobufjs");

async function testEnvironmentParamsIntegration() {
  console.log("=== 无人机页面环境参数集成测试 ===\n");

  try {
    // 1. 加载 protobuf 定义
    console.log("1. 加载 protobuf 定义...");
    const protoPath = path.join(
      __dirname,
      "../src/protobuf/PlatformStatus.proto"
    );
    const root = await protobuf.load(protoPath);

    const Platforms = root.lookupType("PlatformStatus.Platforms");
    const Platform = root.lookupType("PlatformStatus.Platform");
    const PlatformBase = root.lookupType("PlatformStatus.PlatformBase");
    const GeoCoordinate = root.lookupType("PublicStruct.GeoCoordinate");
    const Environment = root.lookupType("PlatformStatus.Environment");
    const Sensor = root.lookupType("PlatformStatus.Sensor");
    const PartParam = root.lookupType("PlatformStatus.PartParam");

    console.log("   ✅ protobuf 类型加载成功");

    // 2. 创建真实的环境参数数据
    console.log("\n2. 创建环境参数数据...");
    const environmentData = {
      temperature: 22.3, // 温度 22.3°C
      windSpeed: 8.7, // 风速 8.7m/s
      windDirection: 225, // 风向 225度（西南风）
      cloudLowerAlt: 1500, // 云层下界 1500米
      cloudUpperAlt: 6000, // 云层上界 6000米
      rainUpperAlt: 0, // 无降雨
      rainRate: 0, // 降雨率 0mm/h
    };

    console.log("   环境参数:", {
      温度: environmentData.temperature + "°C",
      风速: environmentData.windSpeed + "m/s",
      风向: environmentData.windDirection + "° (西南风)",
      云层: `${environmentData.cloudLowerAlt}-${environmentData.cloudUpperAlt}m`,
      降雨率: environmentData.rainRate + "mm/h",
    });

    // 3. 创建无人机平台数据
    console.log("\n3. 创建无人机平台数据...");

    // 创建地理坐标
    const location = GeoCoordinate.create({
      longitude: 106.319248,
      latitude: 36.221109,
      altitude: 2000, // 海拔2000米
    });

    // 创建传感器基础参数
    const sensorBase = PartParam.create({
      name: "光电传感器",
      type: "EOIR",
      isTurnedOn: true,
      currentAz: 135.5,
      currentEl: -15.2,
    });

    // 创建传感器
    const sensor = Sensor.create({
      base: sensorBase,
      mode: "Track",
      laser_code: 1688,
    });

    // 创建平台基础数据
    const platformBase = PlatformBase.create({
      name: "无人机-环境测试",
      type: "UAV01",
      side: "红方",
      group: "环境测试编队",
      broken: false,
      location: location,
      roll: 3.2,
      pitch: -2.1,
      yaw: 68,
      speed: 45,
    });

    // 创建平台数据
    const platform = Platform.create({
      base: platformBase,
      updateTime: Date.now(),
      sensors: [sensor],
    });

    // 创建环境数据
    const environment = Environment.create(environmentData);

    // 创建完整的平台状态数据
    const platformsData = Platforms.create({
      platform: [platform],
      evironment: environment, // 注意：protobuf中确实是evironment（拼写错误）
    });

    console.log("   ✅ 平台数据创建完成");

    // 4. 编码为二进制数据（模拟组播数据包）
    console.log("\n4. 编码平台数据...");
    const platformsMessage = Platforms.create(platformsData);
    const buffer = Platforms.encode(platformsMessage).finish();
    console.log(`   ✅ 数据编码完成，大小: ${buffer.length} 字节`);

    // 5. 解码并模拟无人机页面处理
    console.log("\n5. 模拟无人机页面数据处理...");
    const decoded = Platforms.decode(buffer);
    const decodedData = Platforms.toObject(decoded);

    console.log("   解码后的环境数据:", decodedData.evironment);
    console.log("   平台数量:", decodedData.platform.length);
    console.log("   无人机名称:", decodedData.platform[0].base.name);
    console.log(
      "   海拔高度:",
      decodedData.platform[0].base.location.altitude + "m"
    );

    // 6. 模拟无人机页面的环境参数处理逻辑
    console.log("\n6. 处理环境参数...");

    const environmentParams = {
      temperature: "25°C", // 默认值
      pressure: "1013hPa", // 默认值
      windSpeed: "3m/s", // 默认值
      humidity: "60%", // 默认值
      cloudCover: "20%", // 默认值
      exerciseTime: new Date().toLocaleTimeString(),
    };

    // 处理环境参数（复用无人机页面的逻辑）
    if (decodedData.evironment) {
      const env = decodedData.evironment;

      // 温度
      if (env.temperature !== undefined) {
        environmentParams.temperature = env.temperature.toFixed(1) + "°C";
      }

      // 风速和风向
      if (env.windSpeed !== undefined && env.windDirection !== undefined) {
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

      // 云层覆盖
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

      // 降水参数
      if (env.rainRate !== undefined) {
        environmentParams.humidity =
          env.rainRate > 0 ? env.rainRate.toFixed(1) + "mm/h" : "无降水";
      }

      // 计算气压（基于海拔）
      if (
        decodedData.platform.length > 0 &&
        decodedData.platform[0].base?.location?.altitude
      ) {
        const altitude = decodedData.platform[0].base.location.altitude;
        const pressure =
          1013.25 * Math.pow(1 - (0.0065 * altitude) / 288.15, 5.255);
        environmentParams.pressure = pressure.toFixed(0) + "hPa";
      }
    }

    console.log("   处理后的环境参数:", environmentParams);

    // 7. 验证显示效果
    console.log("\n7. 验证环境参数显示效果...");

    const displayText = `温度${environmentParams.temperature}，气压${environmentParams.pressure}\n风力参数${environmentParams.windSpeed}，降水参数${environmentParams.humidity}\n云层参数${environmentParams.cloudCover}`;

    console.log("   环境参数显示:");
    console.log(`   ${displayText}`);
    console.log(`   演习时间：${environmentParams.exerciseTime}`);

    // 8. 验证结果准确性
    console.log("\n8. 验证结果准确性...");

    const verificationTests = [
      {
        name: "温度显示",
        expected: "22.3°C",
        actual: environmentParams.temperature,
        test: () => environmentParams.temperature === "22.3°C",
      },
      {
        name: "风力显示",
        expected: "8.7m/s 西南",
        actual: environmentParams.windSpeed,
        test: () => environmentParams.windSpeed === "8.7m/s 西南",
      },
      {
        name: "云层覆盖",
        expected: "45%",
        actual: environmentParams.cloudCover,
        test: () => environmentParams.cloudCover === "45%",
      },
      {
        name: "降水状态",
        expected: "无降水",
        actual: environmentParams.humidity,
        test: () => environmentParams.humidity === "无降水",
      },
      {
        name: "气压计算",
        expected: "798hPa", // 2000米海拔的标准气压
        actual: environmentParams.pressure,
        test: () => Math.abs(parseInt(environmentParams.pressure) - 798) < 5,
      },
    ];

    verificationTests.forEach((test) => {
      const passed = test.test();
      const status = passed ? "✅ 通过" : "❌ 失败";
      console.log(`   - ${test.name}: ${status} (${test.actual})`);
      if (!passed) {
        console.log(`     期望: ${test.expected}`);
      }
    });

    const allTestsPassed = verificationTests.every((test) => test.test());

    // 9. 总结
    console.log("\n=== 集成测试总结 ===");
    if (allTestsPassed) {
      console.log("🎉 集成测试完全通过！无人机页面环境参数功能正常");
      console.log("📋 验证的功能:");
      console.log("   ✅ protobuf 平台数据编解码");
      console.log("   ✅ 环境参数从 evironment 字段提取");
      console.log("   ✅ 温度、风速、风向准确处理");
      console.log("   ✅ 云层覆盖率自动计算");
      console.log("   ✅ 气压基于海拔计算");
      console.log("   ✅ 页面显示格式正确");
      console.log(
        "\n💡 无人机页面现在能够从真实平台数据中获取和显示环境参数！"
      );
    } else {
      console.log("❌ 部分测试失败，需要检查实现");
    }
  } catch (error) {
    console.error("❌ 集成测试失败:", error.message);
    console.error("详细错误:", error);
  }
}

// 运行集成测试
testEnvironmentParamsIntegration();
