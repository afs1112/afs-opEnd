import * as protobuf from 'protobufjs';
import { join } from 'path';
import { app } from 'electron';

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
    this.packageTypes.set(0x00, 'PackType_Invalid');
    this.packageTypes.set(0x01, 'PackType_Flystatus');
    this.packageTypes.set(0x02, 'PackType_HeartbeatInternal');
    this.packageTypes.set(0x03, 'PackType_SceneDataInit');
    this.packageTypes.set(0x10, 'PackType_FlyControl');
    this.packageTypes.set(0x11, 'PackType_AttitudeControl');
    this.packageTypes.set(0x12, 'PackType_EngineControl');
    this.packageTypes.set(0x13, 'PackType_DataChainControl');
    this.packageTypes.set(0x14, 'PackType_FlyControlReply');
    this.packageTypes.set(0x20, 'PackType_RouteUpload');
    this.packageTypes.set(0x21, 'PackType_SecurityBoundaryControl');
    this.packageTypes.set(0x22, 'PackType_FixedPointNavigation');
    this.packageTypes.set(0x23, 'PackType_RangePointSelect');
    this.packageTypes.set(0x24, 'PackType_NavReply');
    this.packageTypes.set(0x25, 'PackType_RouteUploadReply');
    this.packageTypes.set(0x26, 'PackType_NavModeRequest');
    this.packageTypes.set(0x27, 'PackType_PositioningModeRequest');
    this.packageTypes.set(0x28, 'PackType_RecoveryrouteCmd');
  }

  public async loadProtobufDefinitions(): Promise<void> {
    try {
      // 判断环境，优先尝试build/main/src/protobuf，再尝试src/protobuf
      const pathList = [
        join(app.getAppPath(), 'main', 'src', 'protobuf'), // 生产环境打包后
        join(app.getAppPath(), 'src', 'protobuf'),        // 开发环境
      ];
      let protobufPath = '';
      let found = false;
      const fs = require('fs');
      for (const p of pathList) {
        if (fs.existsSync(p)) {
          protobufPath = p;
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('未找到protobuf定义目录，请检查build/main/src/protobuf或src/protobuf');
      }
      // 加载protobuf定义文件
      this.root = await protobuf.load([
        join(protobufPath, 'PublicStruct.proto'),
        join(protobufPath, 'UavNavMonitorStruct.proto'),
        join(protobufPath, 'UavFlyMonitorStruct.proto'),
        join(protobufPath, 'UaviationSimulationStruct.proto'),
        join(protobufPath, 'UavFlyStatusStruct.proto')
      ]);
      console.log('Protobuf定义文件加载成功，目录：', protobufPath);
    } catch (error) {
      console.error('加载Protobuf定义文件失败:', error);
      throw error;
    }
  }

  public parsePacket(data: Buffer, source: string, timestamp: number): ParsedPacket | null {
    try {
      if (!this.root) {
        console.warn('Protobuf定义文件未加载');
        return null;
      }

      // 检查数据包格式: 0xAA 0x55 + protocolID + packageType + size + protobufData
      if (data.length < 8) {
        console.warn('数据包长度不足，至少需要8字节');
        return null;
      }

      // 检查包头
      if (data[0] !== 0xAA || data[1] !== 0x55) {
        console.warn('数据包包头错误，期望0xAA 0x55');
        return null;
      }

      const protocolID = data[2];
      const packageType = data[3];
      const size = data.readUInt32LE(4); // 4字节的protobuf数据长度
      const messageData = data.slice(8, 8 + size); // protobuf数据

      if (messageData.length !== size) {
        console.warn(`protobuf数据长度不匹配，期望${size}字节，实际${messageData.length}字节`);
        return null;
      }

      const packageTypeName = this.packageTypes.get(packageType) || 'Unknown';

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
        default:
          console.warn(`未知的包类型: 0x${packageType.toString(16)}`);
          parsedData = { raw: messageData.toString('hex') };
      }

      return {
        timestamp,
        source,
        packageType,
        packageTypeName,
        parsedData,
        rawData: data,
        size: data.length,
        protocolID: protocolID
      };

    } catch (error) {
      console.error('解析数据包失败:', error);
      return null;
    }
  }

  private parseFlyStatus(data: Buffer): any {
    try {
      const UavFlyStatusInfo = this.root!.lookupType('UavFlyStatus.UavFlyStatusInfo');
      return UavFlyStatusInfo.decode(data);
    } catch (error) {
      console.error('解析飞行状态失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseHeartbeatInternal(data: Buffer): any {
    try {
      const HeartbeatInternal = this.root!.lookupType('PublicStruct.HeartbeatInternal');
      return HeartbeatInternal.decode(data);
    } catch (error) {
      console.error('解析心跳失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseSceneDataInit(data: Buffer): any {
    try {
      const SceneInitData = this.root!.lookupType('UaviationSimulation.SceneInitData');
      return SceneInitData.decode(data);
    } catch (error) {
      console.error('解析场景初始化数据失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseFlyControl(data: Buffer): any {
    try {
      const UavFlyControlRequest = this.root!.lookupType('UavFlyMonitor.UavFlyControlRequest');
      return UavFlyControlRequest.decode(data);
    } catch (error) {
      console.error('解析飞行控制失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseAttitudeControl(data: Buffer): any {
    try {
      const UavAttitudeControl = this.root!.lookupType('UavFlyMonitor.UavAttitudeControl');
      return UavAttitudeControl.decode(data);
    } catch (error) {
      console.error('解析姿态控制失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseEngineControl(data: Buffer): any {
    try {
      const UavEngineControl = this.root!.lookupType('UavFlyMonitor.UavEngineControl');
      return UavEngineControl.decode(data);
    } catch (error) {
      console.error('解析发动机控制失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseFlyControlReply(data: Buffer): any {
    try {
      const UavFlyControlReply = this.root!.lookupType('UavFlyMonitor.UavFlyControlReply');
      return UavFlyControlReply.decode(data);
    } catch (error) {
      console.error('解析飞行控制回复失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseRouteUpload(data: Buffer): any {
    try {
      const UavRouteUpload = this.root!.lookupType('UavNavMonitor.UavRouteUpload');
      return UavRouteUpload.decode(data);
    } catch (error) {
      console.error('解析航线上传失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseSecurityBoundaryControl(data: Buffer): any {
    try {
      const UavSecurityBoundaryControl = this.root!.lookupType('UavNavMonitor.UavSecurityBoundaryControl');
      return UavSecurityBoundaryControl.decode(data);
    } catch (error) {
      console.error('解析安全边界控制失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseFixedPointNavigation(data: Buffer): any {
    try {
      const UavFixedPointNavigation = this.root!.lookupType('UavNavMonitor.UavFixedPointNavigation');
      return UavFixedPointNavigation.decode(data);
    } catch (error) {
      console.error('解析定点导航失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseRangePointSelect(data: Buffer): any {
    try {
      const UavRangePointSelect = this.root!.lookupType('UavNavMonitor.UavRangePointSelect');
      return UavRangePointSelect.decode(data);
    } catch (error) {
      console.error('解析靶场点选择失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseNavReply(data: Buffer): any {
    try {
      const UavNavReplyInfo = this.root!.lookupType('UavNavMonitor.UavNavReplyInfo');
      return UavNavReplyInfo.decode(data);
    } catch (error) {
      console.error('解析导航回复失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseRouteUploadReply(data: Buffer): any {
    try {
      const UavRouteUploadReply = this.root!.lookupType('UavNavMonitor.UavRouteUploadReply');
      return UavRouteUploadReply.decode(data);
    } catch (error) {
      console.error('解析航线上传回复失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseNavModeRequest(data: Buffer): any {
    try {
      const UavNavModeRequest = this.root!.lookupType('UavNavMonitor.UavNavModeRequest');
      return UavNavModeRequest.decode(data);
    } catch (error) {
      console.error('解析导航模式请求失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parsePositioningModeRequest(data: Buffer): any {
    try {
      const UavPositioningModeRequest = this.root!.lookupType('UavNavMonitor.UavPositioningModeRequest');
      return UavPositioningModeRequest.decode(data);
    } catch (error) {
      console.error('解析定位模式请求失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  private parseRecoveryrouteCmd(data: Buffer): any {
    try {
      const UavRecoveryrouteCmd = this.root!.lookupType('UavNavMonitor.UavRecoveryrouteCmd');
      return UavRecoveryrouteCmd.decode(data);
    } catch (error) {
      console.error('解析回收航线命令失败:', error);
      return { error: '解析失败', raw: data.toString('hex') };
    }
  }

  public getPackageTypeName(packageType: number): string {
    return this.packageTypes.get(packageType) || 'Unknown';
  }

  public getAllPackageTypes(): Map<number, string> {
    return new Map(this.packageTypes);
  }
}

export const protobufParserService = new ProtobufParserService(); 