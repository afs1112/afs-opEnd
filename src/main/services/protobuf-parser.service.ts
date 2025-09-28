import * as protobuf from "protobufjs";
import { join } from "path";
import { app } from "electron";

export interface ParsedPacket {
  timestamp: number;
  source: string;
  packageType: number;
  packageTypeName: string;
  parsedData: any;
  rawData: Buffer;
  size: number;
  protocolID: number;
}

export class ProtobufParserService {
  private root: protobuf.Root | null = null;
  private packageTypes: Map<number, string> = new Map();

  constructor() {
    this.initializePackageTypes();
  }

  private initializePackageTypes() {
    // 根据PublicStruct.proto中的PackageType枚举初始化
    this.packageTypes.set(0x00, "PackType_Invalid");
    this.packageTypes.set(0x01, "PackType_Flystatus");
    this.packageTypes.set(0x02, "PackType_HeartbeatInternal");
    this.packageTypes.set(0x03, "PackType_SceneDataInit");
    this.packageTypes.set(0x10, "PackType_FlyControl");
    this.packageTypes.set(0x11, "PackType_AttitudeControl");
    this.packageTypes.set(0x12, "PackType_EngineControl");
    this.packageTypes.set(0x13, "PackType_DataChainControl");
    this.packageTypes.set(0x14, "PackType_FlyControlReply");
    this.packageTypes.set(0x20, "PackType_RouteUpload");
    this.packageTypes.set(0x21, "PackType_SecurityBoundaryControl");
    this.packageTypes.set(0x22, "PackType_FixedPointNavigation");
    this.packageTypes.set(0x23, "PackType_RangePointSelect");
    this.packageTypes.set(0x24, "PackType_NavReply");
    this.packageTypes.set(0x25, "PackType_RouteUploadReply");
    this.packageTypes.set(0x26, "PackType_NavModeRequest");
    this.packageTypes.set(0x27, "PackType_PositioningModeRequest");
    this.packageTypes.set(0x28, "PackType_RecoveryrouteCmd");
    this.packageTypes.set(0x29, "PackageType_PlatformStatus"); // 平台状态回传
    this.packageTypes.set(0x2a, "PackageType_PlatformCommand"); // 平台控制命令
    this.packageTypes.set(0x2b, "PackageType_PlatformDeleteCommand"); // 平台删除命令
  }

  public async loadProtobufDefinitions(): Promise<void> {
    try {
      const fs = require("fs");

      // 判断环境，优先尝试build/main/src/protobuf，再尝试src/protobuf
      const pathList = [
        join(app.getAppPath(), "main", "src", "protobuf"), // 生产环境打包后
        join(app.getAppPath(), "src", "protobuf"), // 开发环境
        join(process.cwd(), "src", "protobuf"), // 当前工作目录
        join(__dirname, "..", "..", "protobuf"), // 相对于当前文件
      ];

      let protobufPath = "";
      let found = false;

      console.log("[Protobuf] 尝试查找protobuf定义文件...");
      for (const p of pathList) {
        console.log(`[Protobuf] 检查路径: ${p}`);
        if (fs.existsSync(p)) {
          protobufPath = p;
          found = true;
          console.log(`[Protobuf] ✅ 找到protobuf目录: ${p}`);
          break;
        }
      }

      if (!found) {
        throw new Error(
          `未找到protobuf定义目录，已尝试路径: ${pathList.join(", ")}`
        );
      }

      // 自动扫描protobuf目录中的所有.proto文件
      const files = fs
        .readdirSync(protobufPath)
        .filter((file) => file.endsWith(".proto"));

      console.log(`[Protobuf] 发现 ${files.length} 个.proto文件:`, files);

      // 按依赖关系排序加载，先加载基础的PublicStruct.proto
      const sortedFiles: string[] = [];

      // 优先加载公共结构，因为其他文件都依赖它
      if (files.includes("PublicStruct.proto")) {
        sortedFiles.push("PublicStruct.proto");
      }

      // 然后加载其他文件
      files.forEach((file: string) => {
        if (file !== "PublicStruct.proto") {
          sortedFiles.push(file);
        }
      });

      const availableFiles: string[] = [];
      for (const file of sortedFiles) {
        const filePath = join(protobufPath, file);
        if (fs.existsSync(filePath)) {
          availableFiles.push(filePath);
          console.log(`[Protobuf] ✅ 找到文件: ${file}`);
        } else {
          console.log(`[Protobuf] ❌ 缺少文件: ${file}`);
        }
      }

      if (availableFiles.length === 0) {
        throw new Error("未找到任何protobuf定义文件");
      }

      // 加载protobuf定义文件
      console.log(`[Protobuf] 开始加载 ${availableFiles.length} 个文件...`);
      console.log(`[Protobuf] 文件列表:`, availableFiles);

      try {
        this.root = await protobuf.load(availableFiles);
        console.log(
          "[Protobuf] ✅ Protobuf定义文件加载成功，目录：",
          protobufPath
        );
        console.log(
          "[Protobuf] 可用的消息类型:",
          Object.keys(this.root.nested || {})
        );

        // 详细显示每个命名空间的内容
        if (this.root.nested) {
          for (const [namespace, content] of Object.entries(this.root.nested)) {
            if (content instanceof protobuf.Namespace && content.nested) {
              console.log(
                `[Protobuf] 命名空间 ${namespace}:`,
                Object.keys(content.nested)
              );
            } else {
              console.log(
                `[Protobuf] 对象 ${namespace}:`,
                content.constructor.name
              );
            }
          }
        }
      } catch (loadError) {
        console.error("[Protobuf] ❌ protobuf.load() 失败:", loadError);

        // 尝试单独加载每个文件来诊断问题
        console.log("[Protobuf] 🔍 尝试单独加载文件进行诊断...");
        for (const filePath of availableFiles) {
          try {
            await protobuf.load([filePath]);
            console.log(`[Protobuf] ✅ 单独加载成功: ${filePath}`);
          } catch (singleError) {
            console.error(
              `[Protobuf] ❌ 单独加载失败 ${filePath}:`,
              singleError
            );
          }
        }

        throw loadError;
      }
    } catch (error) {
      console.error("[Protobuf] ❌ 加载Protobuf定义文件失败:", error);
      throw error;
    }
  }

  public parsePacket(
    data: Buffer,
    source: string,
    timestamp: number
  ): ParsedPacket | null {
    try {
      if (!this.root) {
        console.warn("Protobuf定义文件未加载");
        return null;
      }

      // 检查数据包格式: 0xAA 0x55 + protocolID + packageType + size + protobufData
      if (data.length < 8) {
        console.warn("数据包长度不足，至少需要8字节");
        return null;
      }

      // 检查包头
      if (data[0] !== 0xaa || data[1] !== 0x55) {
        console.warn("数据包包头错误，期望0xAA 0x55");
        return null;
      }

      const protocolID = data[2];
      const packageType = data[3];
      const size = data.readUInt32LE(4); // 4字节的protobuf数据长度

      console.log(`[Parser] 包解析详情:`, {
        protocolID: `0x${protocolID.toString(16)}`,
        packageType: `0x${packageType.toString(16)}`,
        declaredSize: size,
        actualPacketLength: data.length,
        remainingBytes: data.length - 8,
        sizeBytes: data.subarray(4, 8).toString("hex"),
      });

      // 如果声明的大小明显错误，尝试使用剩余的所有字节
      let actualSize = size;
      if (size > data.length - 8 || size <= 0) {
        actualSize = data.length - 8;
        console.log(`[Parser] 🔧 大小字段异常，使用剩余字节数: ${actualSize}`);
      }

      const messageData = data.subarray(8, 8 + actualSize); // protobuf数据

      console.log(`[Parser] 提取的protobuf数据:`, {
        expectedSize: size,
        actualSize: actualSize,
        extractedLength: messageData.length,
        protobufHex: messageData.toString("hex"),
      });

      const packageTypeName = this.packageTypes.get(packageType) || "Unknown";

      let parsedData: any = null;

      // 根据包类型解析数据
      switch (packageType) {
        case 0x01: // PackType_Flystatus
          parsedData = this.parseFlyStatus(messageData);
          break;
        case 0x02: // PackType_HeartbeatInternal
          parsedData = this.parseHeartbeatInternal(messageData);
          break;
        case 0x03: // PackType_SceneDataInit
          parsedData = this.parseSceneDataInit(messageData);
          break;
        case 0x10: // PackType_FlyControl
          parsedData = this.parseFlyControl(messageData);
          break;
        case 0x11: // PackType_AttitudeControl
          parsedData = this.parseAttitudeControl(messageData);
          break;
        case 0x12: // PackType_EngineControl
          parsedData = this.parseEngineControl(messageData);
          break;
        case 0x14: // PackType_FlyControlReply
          parsedData = this.parseFlyControlReply(messageData);
          break;
        case 0x20: // PackType_RouteUpload
          parsedData = this.parseRouteUpload(messageData);
          break;
        case 0x21: // PackType_SecurityBoundaryControl
          parsedData = this.parseSecurityBoundaryControl(messageData);
          break;
        case 0x22: // PackType_FixedPointNavigation
          parsedData = this.parseFixedPointNavigation(messageData);
          break;
        case 0x23: // PackType_RangePointSelect
          parsedData = this.parseRangePointSelect(messageData);
          break;
        case 0x24: // PackType_NavReply
          parsedData = this.parseNavReply(messageData);
          break;
        case 0x25: // PackType_RouteUploadReply
          parsedData = this.parseRouteUploadReply(messageData);
          break;
        case 0x26: // PackType_NavModeRequest
          parsedData = this.parseNavModeRequest(messageData);
          break;
        case 0x27: // PackType_PositioningModeRequest
          parsedData = this.parsePositioningModeRequest(messageData);
          break;
        case 0x28: // PackType_RecoveryrouteCmd
          parsedData = this.parseRecoveryrouteCmd(messageData);
          break;
        case 0x29: // PackageType_PlatformStatus
          parsedData = this.parsePlatformStatus(messageData);
          break;
        case 0x2a: // PackageType_PlatformCommand
          parsedData = this.parsePlatformCmd(messageData);
          break;
        case 0x2b: // PackageType_PlatformDeleteCommand
          parsedData = this.parsePlatformDeleteCmd(messageData);
          break;
        default:
          console.warn(`未知的包类型: 0x${packageType.toString(16)}`);
          parsedData = { raw: messageData.toString("hex") };
      }

      return {
        timestamp,
        source,
        packageType,
        packageTypeName,
        parsedData,
        rawData: data,
        size: data.length,
        protocolID: protocolID,
      };
    } catch (error) {
      console.error("解析数据包失败:", error);
      return null;
    }
  }

  private parseFlyStatus(data: Buffer): any {
    try {
      const UavFlyStatusInfo = this.root!.lookupType(
        "UaviationSimulation.UavFlyStatusInfo"
      );
      return UavFlyStatusInfo.decode(data);
    } catch (error) {
      console.error("解析飞行状态失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parsePlatformStatus(data: Buffer): any {
    try {
      console.log("[Parser] 尝试解析平台状态数据...");

      if (!this.root) {
        throw new Error("Protobuf root 未初始化");
      }

      // 根据新的PlatformStatus.proto结构，查找Platforms类型
      let PlatformsType: protobuf.Type;
      try {
        PlatformsType = this.root.lookupType("PlatformStatus.Platforms");
        console.log("[Parser] ✅ 找到 PlatformStatus.Platforms 类型");
      } catch (lookupError: unknown) {
        console.log("[Parser] 尝试其他可能的类型名...");
        // 尝试不同的命名空间和类型名
        try {
          PlatformsType = this.root.lookupType("Platforms");
          console.log("[Parser] ✅ 找到 Platforms 类型");
        } catch (e) {
          console.log(
            "[Parser] 可用的类型:",
            Object.keys(this.root.nested || {})
          );
          if (this.root.nested && this.root.nested["PlatformStatus"]) {
            const platformNested = this.root.nested[
              "PlatformStatus"
            ] as protobuf.Namespace;
            console.log(
              "[Parser] PlatformStatus命名空间中的类型:",
              Object.keys(platformNested.nested || {})
            );
          }
          const errorMessage =
            lookupError instanceof Error
              ? lookupError.message
              : String(lookupError);
          throw new Error(
            `无法找到 PlatformStatus.Platforms 类型: ${errorMessage}`
          );
        }
      }

      console.log("[Parser] 🔍 开始解码平台状态数据，数据长度:", data.length);
      console.log(
        "[Parser] 🔍 数据前32字节:",
        data.subarray(0, Math.min(32, data.length)).toString("hex")
      );

      const decoded = PlatformsType.decode(data);
      console.log("[Parser] ✅ 平台状态解码成功");

      // 转换为普通对象
      const decodedObject = PlatformsType.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true,
      });

      // 检查Environment消息中的温度字段
      if (
        decodedObject.evironment &&
        decodedObject.evironment.temperature !== undefined
      ) {
        console.log(
          "[Parser] 🌡️ 检测到环境温度数据:",
          decodedObject.evironment.temperature,
          "°C"
        );
      }

      console.log("[Parser] ✅ 平台状态解析完成");

      return decodedObject;
    } catch (error) {
      console.error("[Parser] ❌ 解析平台状态失败:", error);
      return {
        error: "解析失败",
        errorMessage: error instanceof Error ? error.message : String(error),
        raw: data.toString("hex"),
        dataLength: data.length,
      };
    }
  }

  private parseHeartbeatInternal(data: Buffer): any {
    try {
      const HeartbeatInternal = this.root!.lookupType(
        "PublicStruct.HeartbeatInternal"
      );
      return HeartbeatInternal.decode(data);
    } catch (error) {
      console.error("解析心跳失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseSceneDataInit(data: Buffer): any {
    try {
      const SceneInitData = this.root!.lookupType(
        "UaviationSimulation.SceneInitData"
      );
      return SceneInitData.decode(data);
    } catch (error) {
      console.error("解析场景初始化数据失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseFlyControl(data: Buffer): any {
    try {
      const UavFlyControlRequest = this.root!.lookupType(
        "UavFlyMonitor.UavFlyControlRequest"
      );
      return UavFlyControlRequest.decode(data);
    } catch (error) {
      console.error("解析飞行控制失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseAttitudeControl(data: Buffer): any {
    try {
      const UavAttitudeControl = this.root!.lookupType(
        "UavFlyMonitor.UavAttitudeControl"
      );
      return UavAttitudeControl.decode(data);
    } catch (error) {
      console.error("解析姿态控制失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseEngineControl(data: Buffer): any {
    try {
      const UavEngineControl = this.root!.lookupType(
        "UavFlyMonitor.UavEngineControl"
      );
      return UavEngineControl.decode(data);
    } catch (error) {
      console.error("解析发动机控制失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseFlyControlReply(data: Buffer): any {
    try {
      const UavFlyControlReply = this.root!.lookupType(
        "UavFlyMonitor.UavFlyControlReply"
      );
      return UavFlyControlReply.decode(data);
    } catch (error) {
      console.error("解析飞行控制回复失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseRouteUpload(data: Buffer): any {
    try {
      const UavRouteUpload = this.root!.lookupType(
        "UavNavMonitor.UavRouteUpload"
      );
      return UavRouteUpload.decode(data);
    } catch (error) {
      console.error("解析航线上传失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseSecurityBoundaryControl(data: Buffer): any {
    try {
      const UavSecurityBoundaryControl = this.root!.lookupType(
        "UavNavMonitor.UavSecurityBoundaryControl"
      );
      return UavSecurityBoundaryControl.decode(data);
    } catch (error) {
      console.error("解析安全边界控制失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseFixedPointNavigation(data: Buffer): any {
    try {
      const UavFixedPointNavigation = this.root!.lookupType(
        "UavNavMonitor.UavFixedPointNavigation"
      );
      return UavFixedPointNavigation.decode(data);
    } catch (error) {
      console.error("解析定点导航失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseRangePointSelect(data: Buffer): any {
    try {
      const UavRangePointSelect = this.root!.lookupType(
        "UavNavMonitor.UavRangePointSelect"
      );
      return UavRangePointSelect.decode(data);
    } catch (error) {
      console.error("解析靶场点选择失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseNavReply(data: Buffer): any {
    try {
      const UavNavReplyInfo = this.root!.lookupType(
        "UavNavMonitor.UavNavReplyInfo"
      );
      return UavNavReplyInfo.decode(data);
    } catch (error) {
      console.error("解析导航回复失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseRouteUploadReply(data: Buffer): any {
    try {
      const UavRouteUploadReply = this.root!.lookupType(
        "UavNavMonitor.UavRouteUploadReply"
      );
      return UavRouteUploadReply.decode(data);
    } catch (error) {
      console.error("解析航线上传回复失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseNavModeRequest(data: Buffer): any {
    try {
      const UavNavModeRequest = this.root!.lookupType(
        "UavNavMonitor.UavNavModeRequest"
      );
      return UavNavModeRequest.decode(data);
    } catch (error) {
      console.error("解析导航模式请求失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parsePositioningModeRequest(data: Buffer): any {
    try {
      const UavPositioningModeRequest = this.root!.lookupType(
        "UavNavMonitor.UavPositioningModeRequest"
      );
      return UavPositioningModeRequest.decode(data);
    } catch (error) {
      console.error("解析定位模式请求失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parseRecoveryrouteCmd(data: Buffer): any {
    try {
      const UavRecoveryrouteCmd = this.root!.lookupType(
        "UavNavMonitor.UavRecoveryrouteCmd"
      );
      return UavRecoveryrouteCmd.decode(data);
    } catch (error) {
      console.error("解析回收航线命令失败:", error);
      return { error: "解析失败", raw: data.toString("hex") };
    }
  }

  private parsePlatformCmd(data: Buffer): any {
    try {
      console.log("[Parser] 尝试解析平台控制命令数据...");

      if (!this.root) {
        throw new Error("Protobuf root 未初始化");
      }

      // 根据新的PlatformCmd.proto结构，查找PlatformCmd类型
      let PlatformCmdType: protobuf.Type;
      try {
        PlatformCmdType = this.root.lookupType("PlatformStatus.PlatformCmd");
        console.log("[Parser] ✅ 找到 PlatformStatus.PlatformCmd 类型");
      } catch (lookupError: unknown) {
        console.log("[Parser] 尝试其他可能的类型名...");
        try {
          PlatformCmdType = this.root.lookupType("PlatformCmd");
          console.log("[Parser] ✅ 找到 PlatformCmd 类型");
        } catch (e) {
          console.log(
            "[Parser] 可用的类型:",
            Object.keys(this.root.nested || {})
          );
          if (this.root.nested && this.root.nested["PlatformStatus"]) {
            const platformNested = this.root.nested[
              "PlatformStatus"
            ] as protobuf.Namespace;
            console.log(
              "[Parser] PlatformStatus命名空间中的类型:",
              Object.keys(platformNested.nested || {})
            );
          }
          const errorMessage =
            lookupError instanceof Error
              ? lookupError.message
              : String(lookupError);
          throw new Error(
            `无法找到 PlatformStatus.PlatformCmd 类型: ${errorMessage}`
          );
        }
      }

      console.log(
        "[Parser] 🔍 开始解码平台控制命令数据，数据长度:",
        data.length
      );
      console.log(
        "[Parser] 🔍 数据前32字节:",
        data.subarray(0, Math.min(32, data.length)).toString("hex")
      );

      const decoded = PlatformCmdType.decode(data);
      console.log("[Parser] ✅ 平台控制命令解码成功");

      // 转换为普通对象
      const decodedObject = PlatformCmdType.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true,
      });

      // 增加锁定目标命令的特殊日志记录
      if (
        decodedObject.command === "Uav_Lock_Target" ||
        decodedObject.command === 10
      ) {
        console.log("[Parser] 🎯 检测到锁定目标命令");
        if (decodedObject.lockParam) {
          console.log(
            "[Parser] 🎯 锁定参数:",
            JSON.stringify(decodedObject.lockParam, null, 2)
          );
        }
      }

      console.log("[Parser] ✅ 平台控制命令解析完成");

      return decodedObject;
    } catch (error) {
      console.error("[Parser] ❌ 解析平台控制命令失败:", error);
      return {
        error: "解析失败",
        errorMessage: error instanceof Error ? error.message : String(error),
        raw: data.toString("hex"),
        dataLength: data.length,
      };
    }
  }

  private parsePlatformDeleteCmd(data: Buffer): any {
    try {
      console.log("[Parser] 尝试解析平台删除命令数据...");

      if (!this.root) {
        throw new Error("Protobuf root 未初始化");
      }

      // 平台删除命令可能使用简单的字符串或者特定的消息类型
      // 如果没有专门的删除命令结构，可能只是平台名称
      console.log("[Parser] 🔍 平台删除命令数据，数据长度:", data.length);
      console.log("[Parser] 🔍 数据内容:", data.toString("hex"));

      // 尝试作为字符串解析
      try {
        const platformName = data.toString("utf8").replace(/\0/g, ""); // 移除null字符
        console.log("[Parser] ✅ 平台删除命令解析为字符串:", platformName);

        return {
          command: "delete_platform",
          platformName: platformName,
          timestamp: Date.now(),
        };
      } catch (stringError) {
        console.log("[Parser] 字符串解析失败，尝试其他方式...");

        // 如果有专门的删除命令结构，在这里添加
        return {
          command: "delete_platform",
          raw: data.toString("hex"),
          dataLength: data.length,
          note: "未知的删除命令格式",
        };
      }
    } catch (error) {
      console.error("[Parser] ❌ 解析平台删除命令失败:", error);
      return {
        error: "解析失败",
        errorMessage: error instanceof Error ? error.message : String(error),
        raw: data.toString("hex"),
        dataLength: data.length,
      };
    }
  }

  public getPackageTypeName(packageType: number): string {
    return this.packageTypes.get(packageType) || "Unknown";
  }

  public getAllPackageTypes(): Map<number, string> {
    return new Map(this.packageTypes);
  }
}

export const protobufParserService = new ProtobufParserService();
