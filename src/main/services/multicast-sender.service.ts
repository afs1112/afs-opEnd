import dgram from "dgram";
import * as protobuf from "protobufjs";
import { join } from "path";
import { app } from "electron";

export interface PlatformCmdData {
  commandID: number;
  platformName: string;
  command: number; // PlatformCommand 枚举值
  fireParam?: {
    weaponName?: string;
    targetName?: string;
    quantity?: number;
  };
  sensorParam?: {
    sensorName?: string; // 注意：使用sensorName而不是weaponName
    azSlew?: number;
    elSlew?: number;
  };
  navParam?: {
    route?: Array<{
      longitude?: number;
      latitude?: number;
      altitude?: number;
      labelName?: string;
      speed?: number;
    }>;
  };
  targetSetParam?: {
    targetName?: string;
  };
  setSpeedParam?: {
    speed?: number;
  };
  lockParam?: {
    targetName?: string;
    sensorName?: string;
  };
  strikeCoordinateParam?: {
    artyName?: string;
    targetName?: string;
    coordinate?: {
      longitude?: number;
      latitude?: number;
      altitude?: number;
    };
  };
  fireCoordinateParam?: {
    uavName?: string;
    targetName?: string;
    weaponName?: string;
    coordinate?: {
      longitude?: number;
      latitude?: number;
      altitude?: number;
    };
  };
}

export interface PlatformHeartbeatData {
  platformName: string;
}

export class MulticastSenderService {
  private socket: dgram.Socket | null = null;
  private root: protobuf.Root | null = null;
  private multicastAddress: string;
  private multicastPort: number;
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map(); // 多平台心跳定时器
  private connectedPlatforms: Set<string> = new Set(); // 已连接的平台集合

  constructor() {
    this.multicastAddress = process.env.MULTICAST_ADDRESS || "239.255.43.21";
    this.multicastPort = parseInt(process.env.MULTICAST_PORT || "10086");
  }

  public isInitialized(): boolean {
    return this.root !== null && this.socket !== null;
  }

  public async initialize(): Promise<void> {
    try {
      // 创建支持端口复用的UDP socket
      this.socket = dgram.createSocket({
        type: "udp4",
        reuseAddr: true, // 允许地址复用
      });

      // 设置socket选项
      if (this.socket) {
        this.socket.on("listening", () => {
          if (this.socket) {
            try {
              this.socket.setBroadcast(true);
              this.socket.setRecvBufferSize(65536); // 增加接收缓冲区大小
              console.log("[MulticastSender] Socket选项设置成功");
            } catch (optionError) {
              console.warn(
                "[MulticastSender] 设置socket选项时出现警告:",
                optionError
              );
            }
          }
        });
      }

      // 加载protobuf定义文件
      await this.loadProtobufDefinitions();

      console.log("[MulticastSender] 组播发送服务初始化成功");
    } catch (error) {
      console.error("[MulticastSender] 初始化失败:", error);
      throw error;
    }
  }

  private async loadProtobufDefinitions(): Promise<void> {
    try {
      const fs = require("fs");

      // 扩展路径列表，处理各种可能的环境
      const pathList: string[] = [];

      // 尝试获取 app 路径，处理可能的异常
      try {
        const appPath = app.getAppPath();
        pathList.push(
          join(appPath, "main", "src", "protobuf"), // 生产环境打包后
          join(appPath, "src", "protobuf"), // 开发环境
          join(appPath, "build", "main", "src", "protobuf"), // 编译后路径
          join(appPath, "resources", "app", "src", "protobuf") // 打包后的资源路径
        );
      } catch (appError) {
        console.log("[MulticastSender] ⚠️ 无法获取app路径，使用备用方案");
      }

      // 添加通用路径
      pathList.push(
        join(process.cwd(), "src", "protobuf"), // 当前工作目录
        join(__dirname, "..", "..", "protobuf"), // 相对于当前文件
        join(__dirname, "..", "protobuf"), // 备用路径1
        join(__dirname, "protobuf"), // 备用路径2
        join(__dirname, "../../src/protobuf"), // 从build目录向上查找
        join(process.cwd(), "build", "main", "src", "protobuf"), // 编译后的路径
        "/Users/xinnix/code/afs/afs-opEnd/src/protobuf" // 绝对路径作为最后备选
      );

      let protobufPath = "";
      let found = false;

      console.log("[MulticastSender] 尝试查找protobuf定义文件...");
      for (const p of pathList) {
        console.log(`[MulticastSender] 检查路径: ${p}`);
        try {
          if (fs.existsSync(p)) {
            protobufPath = p;
            found = true;
            console.log(`[MulticastSender] ✅ 找到protobuf目录: ${p}`);
            break;
          }
        } catch (pathError) {
          console.log(`[MulticastSender] ⚠️ 路径检查失败: ${p}`);
        }
      }

      if (!found) {
        throw new Error(
          `未找到protobuf定义目录，已尝试 ${pathList.length} 个路径: ${pathList
            .slice(0, 5)
            .join(", ")}...`
        );
      }

      // 加载 PlatformCmd、UavFlyStatusInfo 和 PlatformHeartbeat 相关的protobuf定义
      const requiredFiles = [
        "PublicStruct.proto",
        "PlatformCmd.proto",
        "UaviationSimulationStruct.proto",
      ];
      const availableFiles: string[] = [];

      for (const file of requiredFiles) {
        const filePath = join(protobufPath, file);
        try {
          if (fs.existsSync(filePath)) {
            availableFiles.push(filePath);
            console.log(`[MulticastSender] ✅ 找到文件: ${file}`);
          } else {
            console.log(
              `[MulticastSender] ❌ 缺少文件: ${file} (路径: ${filePath})`
            );
          }
        } catch (fileError) {
          console.log(
            `[MulticastSender] ⚠️ 检查文件失败: ${file} - ${fileError}`
          );
        }
      }

      if (availableFiles.length === 0) {
        throw new Error(
          `缺少必需的protobuf文件，需要: ${requiredFiles.join(
            ", "
          )}，已搜索目录: ${protobufPath}`
        );
      }

      console.log(
        `[MulticastSender] 开始加载 ${availableFiles.length} 个protobuf文件...`
      );
      console.log(
        `[MulticastSender] 文件列表: ${availableFiles
          .map((f) => require("path").basename(f))
          .join(", ")}`
      );

      this.root = await protobuf.load(availableFiles);
      console.log("[MulticastSender] ✅ Protobuf定义文件加载成功");

      // 验证必要的消息类型是否存在
      try {
        const PlatformCmdType = this.root.lookupType(
          "PlatformStatus.PlatformCmd"
        );
        const FireParamType = this.root.lookupType("PlatformStatus.FireParam");

        // 验证PlatformHeartbeat类型
        const PlatformHeartbeatType = this.root.lookupType(
          "PublicStruct.PlatformHeartbeat"
        );

        console.log(
          "[MulticastSender] ✅ 验证消息类型成功（包括PlatformHeartbeat）"
        );
      } catch (verifyError) {
        console.error("[MulticastSender] ❌ 消息类型验证失败:", verifyError);
        if (this.root && this.root.nested) {
          console.log(
            "[MulticastSender] 可用的命名空间:",
            Object.keys(this.root.nested)
          );
          if (this.root.nested["PlatformStatus"]) {
            const platformNested = this.root.nested[
              "PlatformStatus"
            ] as protobuf.Namespace;
            console.log(
              "[MulticastSender] PlatformStatus命名空间中的类型:",
              Object.keys(platformNested.nested || {})
            );
          }
          if (this.root.nested["PublicStruct"]) {
            const publicNested = this.root.nested[
              "PublicStruct"
            ] as protobuf.Namespace;
            console.log(
              "[MulticastSender] PublicStruct命名空间中的类型:",
              Object.keys(publicNested.nested || {})
            );
          }
        }
        throw verifyError;
      }
    } catch (error) {
      console.error("[MulticastSender] ❌ 加载Protobuf定义文件失败:", error);
      throw error;
    }
  }

  public async sendPlatformCmd(data: PlatformCmdData): Promise<void> {
    try {
      if (!this.root) {
        throw new Error("Protobuf定义文件未加载，请先调用 initialize() 方法");
      }

      if (!this.socket) {
        throw new Error("UDP socket未初始化，请先调用 initialize() 方法");
      }

      // 查找消息类型 - 添加容错处理
      console.log("[MulticastSender] 开始查找消息类型...");

      // 先检查可用的类型
      if (this.root.nested) {
        console.log(
          "[MulticastSender] 可用的命名空间:",
          Object.keys(this.root.nested)
        );
        if (this.root.nested["PlatformStatus"]) {
          const platformNested = this.root.nested[
            "PlatformStatus"
          ] as protobuf.Namespace;
          console.log(
            "[MulticastSender] PlatformStatus命名空间中的类型:",
            Object.keys(platformNested.nested || {})
          );
        }
      }

      const PlatformCmdType = this.root.lookupType(
        "PlatformStatus.PlatformCmd"
      );
      console.log("[MulticastSender] ✅ 找到 PlatformCmdType");

      // 容错查找其他类型
      let FireParamType,
        SensorParamType,
        NavParamType,
        TargetSetParamType,
        SetSpeedParamType,
        LockParamType,
        StrikeCoordinateParamType,
        FireCoordinateParamType;

      try {
        FireParamType = this.root.lookupType("PlatformStatus.FireParam");
        console.log("[MulticastSender] ✅ 找到 FireParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 FireParamType:", e);
      }

      try {
        SensorParamType = this.root.lookupType("PlatformStatus.SensorParam");
        console.log("[MulticastSender] ✅ 找到 SensorParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 SensorParamType:", e);
      }

      try {
        NavParamType = this.root.lookupType("PlatformStatus.NavParam");
        console.log("[MulticastSender] ✅ 找到 NavParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 NavParamType:", e);
      }

      try {
        TargetSetParamType = this.root.lookupType(
          "PlatformStatus.TargetSetParam"
        );
        console.log("[MulticastSender] ✅ 找到 TargetSetParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 TargetSetParamType:", e);
      }

      try {
        SetSpeedParamType = this.root.lookupType(
          "PlatformStatus.SetSpeedparam"
        );
        console.log("[MulticastSender] ✅ 找到 SetSpeedParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 SetSpeedParamType:", e);
      }

      try {
        LockParamType = this.root.lookupType("PlatformStatus.LockParam");
        console.log("[MulticastSender] ✅ 找到 LockParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 LockParamType:", e);
      }

      try {
        StrikeCoordinateParamType = this.root.lookupType(
          "PlatformStatus.StrikeCoordinateParam"
        );
        console.log("[MulticastSender] ✅ 找到 StrikeCoordinateParamType");
      } catch (e) {
        console.log(
          "[MulticastSender] ⚠️ 未找到 StrikeCoordinateParamType:",
          e
        );
      }

      try {
        FireCoordinateParamType = this.root.lookupType(
          "PlatformStatus.FireCoordinateParam"
        );
        console.log("[MulticastSender] ✅ 找到 FireCoordinateParamType");
      } catch (e) {
        console.log("[MulticastSender] ⚠️ 未找到 FireCoordinateParamType:", e);
      }

      console.log("[MulticastSender] 创建PlatformCmd消息:", data);

      // 创建消息数据
      const cmdData: any = {
        commandID: data.commandID,
        platformName: data.platformName,
        command: data.command,
      };

      // 如果有fireParam，添加到消息中
      if (data.fireParam && FireParamType) {
        console.log("[MulticastSender] 添加fireParam:", data.fireParam);
        const fireParam = FireParamType.create({
          weaponName: data.fireParam.weaponName || "",
          targetName: data.fireParam.targetName || "",
          quantity: data.fireParam.quantity || 1,
        });
        cmdData.fireParam = fireParam;
      } else if (data.fireParam && !FireParamType) {
        console.log(
          "[MulticastSender] ⚠️ fireParam数据存在但FireParamType未找到，跳过"
        );
      }

      // 如果有sensorParam，添加到消息中
      if (data.sensorParam && SensorParamType) {
        console.log("[MulticastSender] 添加sensorParam:", data.sensorParam);
        const sensorParam = SensorParamType.create({
          sensorName: data.sensorParam.sensorName || "", // 注意：使用sensorName而不是weaponName
          azSlew: data.sensorParam.azSlew || 0,
          elSlew: data.sensorParam.elSlew || 0,
        });
        cmdData.sensorParam = sensorParam;
      } else if (data.sensorParam && !SensorParamType) {
        console.log(
          "[MulticastSender] ⚠️ sensorParam数据存在但SensorParamType未找到，跳过"
        );
        console.log("[MulticastSender] 尝试直接使用原始数据...");
        // 如果找不到类型，尝试直接使用原始数据
        cmdData.sensorParam = {
          sensorName: data.sensorParam.sensorName || "",
          azSlew: data.sensorParam.azSlew || 0,
          elSlew: data.sensorParam.elSlew || 0,
        };
      }

      // 如果有navParam，添加到消息中
      if (data.navParam && NavParamType) {
        console.log("[MulticastSender] 添加navParam:", data.navParam);
        const navParam = NavParamType.create({
          route: data.navParam.route || [],
        });
        cmdData.navParam = navParam;
      } else if (data.navParam && !NavParamType) {
        console.log(
          "[MulticastSender] ⚠️ navParam数据存在但NavParamType未找到，跳过"
        );
      }

      // 如果有targetSetParam，添加到消息中
      if (data.targetSetParam && TargetSetParamType) {
        console.log(
          "[MulticastSender] 添加targetSetParam:",
          data.targetSetParam
        );
        const targetSetParam = TargetSetParamType.create({
          targetName: data.targetSetParam.targetName || "",
        });
        cmdData.targetSetParam = targetSetParam;
      } else if (data.targetSetParam && !TargetSetParamType) {
        console.log(
          "[MulticastSender] ⚠️ targetSetParam数据存在但TargetSetParamType未找到，跳过"
        );
      }

      // 如果有setSpeedParam，添加到消息中
      if (data.setSpeedParam && SetSpeedParamType) {
        console.log("[MulticastSender] 添加setSpeedParam:", data.setSpeedParam);
        const setSpeedParam = SetSpeedParamType.create({
          speed: data.setSpeedParam.speed || 10,
        });
        cmdData.setSpeedParam = setSpeedParam;
      } else if (data.setSpeedParam && !SetSpeedParamType) {
        console.log(
          "[MulticastSender] ⚠️ setSpeedParam数据存在但SetSpeedParamType未找到，跳过"
        );
      }

      // 如果有lockParam，添加到消息中
      if (data.lockParam && LockParamType) {
        console.log("[MulticastSender] 添加lockParam:", data.lockParam);
        const lockParam = LockParamType.create({
          targetName: data.lockParam.targetName || "",
          sensorName: data.lockParam.sensorName || "",
        });
        cmdData.lockParam = lockParam;
      } else if (data.lockParam && !LockParamType) {
        console.log(
          "[MulticastSender] ⚠️ lockParam数据存在但LockParamType未找到，跳过"
        );
        console.log("[MulticastSender] 尝试直接使用原始数据...");
        // 如果找不到类型，尝试直接使用原始数据
        cmdData.lockParam = {
          targetName: data.lockParam.targetName || "",
          sensorName: data.lockParam.sensorName || "",
        };
      }

      // 如果有strikeCoordinateParam，添加到消息中
      if (data.strikeCoordinateParam && StrikeCoordinateParamType) {
        console.log(
          "[MulticastSender] 添加strikeCoordinateParam:",
          data.strikeCoordinateParam
        );
        const strikeCoordinateParam = StrikeCoordinateParamType.create({
          artyName: data.strikeCoordinateParam.artyName || "",
          targetName: data.strikeCoordinateParam.targetName || "",
          coordinate: data.strikeCoordinateParam.coordinate
            ? {
                longitude: data.strikeCoordinateParam.coordinate.longitude || 0,
                latitude: data.strikeCoordinateParam.coordinate.latitude || 0,
                altitude: data.strikeCoordinateParam.coordinate.altitude || 0,
              }
            : undefined,
        });
        cmdData.strikeCoordinateParam = strikeCoordinateParam;
      } else if (data.strikeCoordinateParam && !StrikeCoordinateParamType) {
        console.log(
          "[MulticastSender] ⚠️ strikeCoordinateParam数据存在但StrikeCoordinateParamType未找到，跳过"
        );
        console.log("[MulticastSender] 尝试直接使用原始数据...");
        // 如果找不到类型，尝试直接使用原始数据
        cmdData.strikeCoordinateParam = {
          artyName: data.strikeCoordinateParam.artyName || "",
          targetName: data.strikeCoordinateParam.targetName || "",
          coordinate: data.strikeCoordinateParam.coordinate || undefined,
        };
      }

      // 如果有fireCoordinateParam，添加到消息中
      if (data.fireCoordinateParam && FireCoordinateParamType) {
        console.log(
          "[MulticastSender] 添加fireCoordinateParam:",
          data.fireCoordinateParam
        );
        const fireCoordinateParam = FireCoordinateParamType.create({
          uavName: data.fireCoordinateParam.uavName || "",
          targetName: data.fireCoordinateParam.targetName || "",
          weaponName: data.fireCoordinateParam.weaponName || "",
          coordinate: data.fireCoordinateParam.coordinate
            ? {
                longitude: data.fireCoordinateParam.coordinate.longitude || 0,
                latitude: data.fireCoordinateParam.coordinate.latitude || 0,
                altitude: data.fireCoordinateParam.coordinate.altitude || 0,
              }
            : undefined,
        });
        cmdData.fireCoordinateParam = fireCoordinateParam;
      } else if (data.fireCoordinateParam && !FireCoordinateParamType) {
        console.log(
          "[MulticastSender] ⚠️ fireCoordinateParam数据存在但FireCoordinateParamType未找到，跳过"
        );
        console.log("[MulticastSender] 尝试直接使用原始数据...");
        // 如果找不到类型，尝试直接使用原始数据
        cmdData.fireCoordinateParam = {
          uavName: data.fireCoordinateParam.uavName || "",
          targetName: data.fireCoordinateParam.targetName || "",
          weaponName: data.fireCoordinateParam.weaponName || "",
          coordinate: data.fireCoordinateParam.coordinate || undefined,
        };
      }

      // 创建并编码protobuf消息
      console.log(
        "[MulticastSender] 🔍 最终cmdData:",
        JSON.stringify(cmdData, null, 2)
      );

      const message = PlatformCmdType.create(cmdData);
      console.log("[MulticastSender] 🔍 创建的消息对象:", message);

      // 消息已创建，可以直接使用
      console.log("[MulticastSender] ✅ 消息创建成功");

      const protobufBuffer = PlatformCmdType.encode(message).finish();
      console.log(
        "[MulticastSender] 🔍 Protobuf编码后大小:",
        protobufBuffer.length,
        "字节"
      );

      // 构造完整的数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
      const protocolID = 0x01; // 协议ID
      const packageType = 0x2a; // PackType_PlatformCmd
      const size = protobufBuffer.length;

      // 创建包头
      const header = Buffer.alloc(8);
      header[0] = 0xaa; // 包头标识
      header[1] = 0x55; // 包头标识
      header[2] = protocolID; // 协议ID
      header[3] = packageType; // 包类型
      header.writeUInt32LE(size, 4); // protobuf数据长度（小端序）

      // 组合完整数据包
      const fullPacket = Buffer.concat([header, protobufBuffer]);

      console.log("[MulticastSender] 数据包构造详情:", {
        总长度: fullPacket.length,
        包头: header.toString("hex"),
        协议ID: `0x${protocolID.toString(16)}`,
        包类型: `0x${packageType.toString(16)}`,
        声明大小: size,
        实际protobuf大小: protobufBuffer.length,
      });

      // 发送数据包
      await this.sendPacket(fullPacket);

      console.log("[MulticastSender] ✅ PlatformCmd消息发送成功");
    } catch (error) {
      console.error("[MulticastSender] ❌ 发送PlatformCmd消息失败:", error);
      throw error;
    }
  }

  private sendPacket(packet: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("UDP socket未初始化"));
        return;
      }

      this.socket.send(
        packet,
        this.multicastPort,
        this.multicastAddress,
        (err) => {
          if (err) {
            reject(err);
          } else {
            // 对于心跳包，减少日志输出以避免刷屏
            const isHeartbeat = packet[3] === 0x2c; // PackageType_PlatformHeartbeat
            if (!isHeartbeat) {
              console.log(
                `[MulticastSender] 已发送数据包到 ${this.multicastAddress}:${this.multicastPort}`
              );
              console.log(
                `[MulticastSender] 数据包大小: ${packet.length} 字节`
              );
              console.log(
                `[MulticastSender] 发送时间: ${new Date().toLocaleString(
                  "zh-CN"
                )}`
              );
            }
            resolve();
          }
        }
      );
    });
  }

  public async syncTrajectoryWithPlatformData(data: {
    platformName: string;
    uavId: number;
    platformData: any;
  }): Promise<void> {
    try {
      if (!this.root) {
        throw new Error("Protobuf定义文件未加载，请先调用 initialize() 方法");
      }

      if (!this.socket) {
        throw new Error("UDP socket未初始化，请先调用 initialize() 方法");
      }

      console.log(
        "[MulticastSender] 开始同步轨迹数据 (使用平台数据):",
        data.platformName,
        "UavId:",
        data.uavId
      );

      // 查找 UavFlyStatusInfo 消息类型
      let UavFlyStatusInfoType;
      try {
        UavFlyStatusInfoType = this.root.lookupType(
          "UaviationSimulation.UavFlyStatusInfo"
        );
        console.log("[MulticastSender] ✅ 找到 UavFlyStatusInfoType");
      } catch (e) {
        console.error("[MulticastSender] ❌ 未找到 UavFlyStatusInfo 类型:", e);
        throw new Error(
          "未找到 UavFlyStatusInfo protobuf 定义，请确保加载了 UaviationSimulationStruct.proto"
        );
      }

      // 从平台数据中提取位置和姿态信息
      const platformData = data.platformData;
      console.log(
        "[MulticastSender] 接收到的平台数据:",
        JSON.stringify(platformData, null, 2)
      );

      const platformBase = platformData.base || {};
      console.log(
        "[MulticastSender] 平台基础数据:",
        JSON.stringify(platformBase, null, 2)
      );

      // 提取位置信息 (location字段)
      const location = platformBase.location || {};
      console.log(
        "[MulticastSender] 位置信息:",
        JSON.stringify(location, null, 2)
      );

      // 检查是否有有效的位置数据
      if (!location.longitude || !location.latitude) {
        console.log(
          "[MulticastSender] ⚠️ 平台缺少有效的位置数据，跳过轨迹同步"
        );
        throw new Error("平台缺少有效的位置数据 (经纬度)");
      }

      const coord = {
        longitude: location.longitude,
        latitude: location.latitude,
        altitude: location.altitude || 0,
      };

      // 提取姿态信息 (如果没有姿态数据，使用0作为默认值)
      const attitudeInfo = {
        roll: platformBase.roll || 0,
        pitch: platformBase.pitch || 0,
        yaw: platformBase.yaw || 0,
        speed: platformBase.speed || 0,
        indicatedAirspeed: (platformBase.speed || 0) * 0.95, // 指示空速略小于地速
        groundSpeed: platformBase.speed || 0, // 地速：从platforms里拿到的speed转换为groundSpeed
        height: coord.altitude,
      };

      console.log("[MulticastSender] ✅ 使用真实平台数据:", {
        位置: coord,
        姿态: attitudeInfo,
      });

      // 创建飞行状态数据
      const flyStatusData = {
        uavID: data.uavId,
        coord: coord,
        attitudeInfo: attitudeInfo,
        cylinderTemperatureInfo: {
          temperature1: 85 + Math.random() * 2,
          temperature2: 86 + Math.random() * 2,
          temperature3: 84 + Math.random() * 2,
          temperature4: 85 + Math.random() * 2,
        },
        engineDisplay: {
          throttle_butterfly: 75,
          rotate_speed: 2500,
          oil_quantity: 90 - (Date.now() % 100000) * 0.0001,
        },
        flyWarningInfo: {
          fly_stop_state: 0,
          height_state: 0,
          speed_state: 0,
          atttiude_state: 0,
          engine_state: 0,
        },
        otherInfoExtra: {
          currentExecuteState: `同步自${data.platformName}`,
          satNavEnabled: true,
          securityBoundaryEnabled: true,
        },
      };

      console.log("[MulticastSender] 创建飞行状态数据:", {
        uavID: flyStatusData.uavID,
        coord: flyStatusData.coord,
        attitude: flyStatusData.attitudeInfo,
      });

      // 创建并编码protobuf消息
      const message = UavFlyStatusInfoType.create(flyStatusData);
      const protobufBuffer = UavFlyStatusInfoType.encode(message).finish();

      console.log(
        "[MulticastSender] Protobuf编码后大小:",
        protobufBuffer.length,
        "字节"
      );

      // 构造完整的数据包
      const protocolID = 0x01;
      const packageType = 0x01;
      const size = protobufBuffer.length;

      const header = Buffer.alloc(8);
      header[0] = 0xaa;
      header[1] = 0x55;
      header[2] = protocolID;
      header[3] = packageType;
      header.writeUInt32LE(size, 4);

      const fullPacket = Buffer.concat([header, protobufBuffer]);

      // 发送数据包
      await this.sendPacket(fullPacket);

      console.log("[MulticastSender] ✅ 轨迹同步数据发送成功 (使用平台数据)");
    } catch (error) {
      console.error("[MulticastSender] ❌ 同步轨迹失败 (使用平台数据):", error);
      throw error;
    }
  }

  public async syncTrajectory(data: {
    platformName: string;
    uavId: number;
  }): Promise<void> {
    try {
      if (!this.root) {
        throw new Error("Protobuf定义文件未加载，请先调用 initialize() 方法");
      }

      if (!this.socket) {
        throw new Error("UDP socket未初始化，请先调用 initialize() 方法");
      }

      console.log("[MulticastSender] 开始同步轨迹数据:", data);

      // 查找 UavFlyStatusInfo 消息类型
      let UavFlyStatusInfoType;
      try {
        UavFlyStatusInfoType = this.root.lookupType(
          "UaviationSimulation.UavFlyStatusInfo"
        );
        console.log("[MulticastSender] ✅ 找到 UavFlyStatusInfoType");
      } catch (e) {
        console.error("[MulticastSender] ❌ 未找到 UavFlyStatusInfo 类型:", e);
        throw new Error(
          "未找到 UavFlyStatusInfo protobuf 定义，请确保加载了 UaviationSimulationStruct.proto"
        );
      }

      // 创建模拟的飞行状态数据（基于测试脚本的格式）
      const flyStatusData = {
        uavID: data.uavId,
        coord: {
          longitude: 106.319248 + Math.random() * 0.01, // 模拟位置变化
          latitude: 36.221109 + Math.random() * 0.01,
          altitude: 1000 + Math.random() * 200,
        },
        attitudeInfo: {
          roll: Math.sin(Date.now() * 0.001) * 2, // 轻微横滚 ±2°
          pitch: Math.sin(Date.now() * 0.0008) * 1, // 轻微俯仰 ±1°
          yaw: 45 + Math.random() * 90, // 随机航向
          speed: 120,
          indicatedAirspeed: 114, // 指示空速略小于地速
          groundSpeed: 120, // 地速：模拟数据中的固定值
          height: 1000 + Math.random() * 200,
        },
        cylinderTemperatureInfo: {
          temperature1: 85 + Math.random() * 2,
          temperature2: 86 + Math.random() * 2,
          temperature3: 84 + Math.random() * 2,
          temperature4: 85 + Math.random() * 2,
        },
        engineDisplay: {
          throttle_butterfly: 75,
          rotate_speed: 2500,
          oil_quantity: 90 - (Date.now() % 100000) * 0.0001, // 缓慢消耗
        },
        flyWarningInfo: {
          fly_stop_state: 0,
          height_state: 0,
          speed_state: 0,
          atttiude_state: 0,
          engine_state: 0,
        },
        otherInfoExtra: {
          currentExecuteState: `同步自${data.platformName}`,
          satNavEnabled: true,
          securityBoundaryEnabled: true,
        },
      };

      console.log("[MulticastSender] 创建飞行状态数据:", flyStatusData);

      // 创建并编码protobuf消息
      const message = UavFlyStatusInfoType.create(flyStatusData);
      const protobufBuffer = UavFlyStatusInfoType.encode(message).finish();

      console.log(
        "[MulticastSender] Protobuf编码后大小:",
        protobufBuffer.length,
        "字节"
      );

      // 构造完整的数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
      const protocolID = 0x01; // 协议ID
      const packageType = 0x01; // 根据测试脚本，UavFlyStatusInfo 使用 0x01
      const size = protobufBuffer.length;

      // 创建包头
      const header = Buffer.alloc(8);
      header[0] = 0xaa; // 包头标识
      header[1] = 0x55; // 包头标识
      header[2] = protocolID; // 协议ID
      header[3] = packageType; // 包类型
      header.writeUInt32LE(size, 4); // protobuf数据长度（小端序）

      // 组合完整数据包
      const fullPacket = Buffer.concat([header, protobufBuffer]);

      console.log("[MulticastSender] 轨迹数据包构造详情:", {
        总长度: fullPacket.length,
        包头: header.toString("hex"),
        协议ID: `0x${protocolID.toString(16)}`,
        包类型: `0x${packageType.toString(16)}`,
        UavId: data.uavId,
        平台名称: data.platformName,
      });

      // 发送数据包
      await this.sendPacket(fullPacket);

      console.log("[MulticastSender] ✅ 轨迹同步数据发送成功");
    } catch (error) {
      console.error("[MulticastSender] ❌ 同步轨迹失败:", error);
      throw error;
    }
  }

  /**
   * 发送平台心跳消息
   * @param platformName 平台名称
   */
  public async sendPlatformHeartbeat(platformName: string): Promise<void> {
    try {
      if (!this.root) {
        throw new Error("Protobuf定义文件未加载，请先调用 initialize() 方法");
      }

      if (!this.socket) {
        throw new Error("UDP socket未初始化，请先调用 initialize() 方法");
      }

      console.log(`[MulticastSender] 发送平台心跳: ${platformName}`);

      // 查找PlatformHeartbeat消息类型
      const PlatformHeartbeatType = this.root.lookupType(
        "PublicStruct.PlatformHeartbeat"
      );

      // 创建心跳数据
      const heartbeatData = {
        name: platformName,
      };

      // 创建并编码protobuf消息
      const message = PlatformHeartbeatType.create(heartbeatData);
      const protobufBuffer = PlatformHeartbeatType.encode(message).finish();

      console.log(
        `[MulticastSender] 平台心跳Protobuf编码后大小: ${protobufBuffer.length} 字节`
      );

      // 构造完整的数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
      const protocolID = 0x01; // 协议ID
      const packageType = 0x2c; // PackageType_PlatformHeartbeat
      const size = protobufBuffer.length;

      // 创建包头
      const header = Buffer.alloc(8);
      header[0] = 0xaa; // 包头标识
      header[1] = 0x55; // 包头标识
      header[2] = protocolID; // 协议ID
      header[3] = packageType; // 包类型
      header.writeUInt32LE(size, 4); // protobuf数据长度（小端序）

      // 组合完整数据包
      const fullPacket = Buffer.concat([header, protobufBuffer]);

      console.log(`[MulticastSender] 平台心跳数据包构造详情:`, {
        平台名称: platformName,
        总长度: fullPacket.length,
        包头: header.toString("hex"),
        协议ID: `0x${protocolID.toString(16)}`,
        包类型: `0x${packageType.toString(16)}`,
        声明大小: size,
        实际protobuf大小: protobufBuffer.length,
      });

      // 发送数据包
      await this.sendPacket(fullPacket);

      console.log(`[MulticastSender] ✅ 平台心跳发送成功: ${platformName}`);
    } catch (error) {
      console.error(
        `[MulticastSender] ❌ 发送平台心跳失败: ${platformName}`,
        error
      );
      throw error;
    }
  }

  /**
   * 启动平台心跳定时器（支持多平台并发）
   * @param platformName 平台名称
   * @param intervalMs 心跳间隔（毫秒），默认3000ms（3秒）
   */
  public startPlatformHeartbeat(
    platformName: string,
    intervalMs: number = 3000
  ): void {
    // 如果该平台已经在发送心跳，先停止
    if (this.heartbeatIntervals.has(platformName)) {
      this.stopPlatformHeartbeat(platformName);
    }

    // 记录已连接的平台
    this.connectedPlatforms.add(platformName);

    console.log(
      `[MulticastSender] 启动平台心跳定时器: ${platformName}, 间隔: ${intervalMs}ms`
    );

    // 立即发送一次心跳
    this.sendPlatformHeartbeat(platformName).catch((error) => {
      console.error(`[MulticastSender] 立即发送心跳失败:`, error);
    });

    // 设置定时器
    const interval = setInterval(async () => {
      try {
        await this.sendPlatformHeartbeat(platformName);
      } catch (error) {
        console.error(`[MulticastSender] 定时心跳发送失败:`, error);
      }
    }, intervalMs);

    // 保存该平台的定时器
    this.heartbeatIntervals.set(platformName, interval);

    console.log(`[MulticastSender] ✅ 平台心跳定时器已启动: ${platformName}`);
    console.log(
      `[MulticastSender] 当前活跃心跳平台数量: ${this.heartbeatIntervals.size}`
    );
  }

  /**
   * 停止平台心跳定时器（支持多平台并发）
   * @param platformName 要停止的平台名称（可选，如果不提供则停止所有心跳）
   */
  public stopPlatformHeartbeat(platformName?: string): void {
    if (platformName) {
      // 停止指定平台的心跳
      const interval = this.heartbeatIntervals.get(platformName);
      if (interval) {
        clearInterval(interval);
        this.heartbeatIntervals.delete(platformName);
        this.connectedPlatforms.delete(platformName);
        console.log(`[MulticastSender] 平台心跳定时器已停止: ${platformName}`);
      } else {
        console.log(`[MulticastSender] 未找到平台心跳定时器: ${platformName}`);
      }
    } else {
      // 停止所有平台的心跳
      console.log(
        `[MulticastSender] 停止所有平台心跳，当前数量: ${this.heartbeatIntervals.size}`
      );

      this.heartbeatIntervals.forEach((interval, name) => {
        clearInterval(interval);
        console.log(`[MulticastSender] 停止平台心跳: ${name}`);
      });

      this.heartbeatIntervals.clear();
      this.connectedPlatforms.clear();
    }

    console.log(
      `[MulticastSender] 当前活跃心跳平台数量: ${this.heartbeatIntervals.size}`
    );
  }

  /**
   * 获取当前心跳状态（支持多平台）
   */
  public getHeartbeatStatus(): {
    isRunning: boolean;
    platformCount: number;
    platforms: string[];
  } {
    return {
      isRunning: this.heartbeatIntervals.size > 0,
      platformCount: this.heartbeatIntervals.size,
      platforms: Array.from(this.connectedPlatforms),
    };
  }

  public close(): void {
    // 停止心跳定时器
    this.stopPlatformHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log("[MulticastSender] UDP socket已关闭");
    }
  }
}

export const multicastSenderService = new MulticastSenderService();
