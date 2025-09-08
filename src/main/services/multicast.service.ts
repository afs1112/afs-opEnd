import dgram from 'dgram';
import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { app } from 'electron';
import { protobufParserService, ParsedPacket } from './protobuf-parser.service';

// 加载环境配置
const envPath = join(app.getAppPath(), 'config.env');
dotenv.config({ path: envPath });

export interface MulticastPacket {
  timestamp: number;
  source: string;
  data: Buffer;
  dataString: string;
  size: number;
  parsedPacket?: ParsedPacket;
}

export class MulticastService extends EventEmitter {
  private socket: dgram.Socket | null = null;
  private isListening = false;
  private multicastAddress: string;
  private multicastPort: number;
  private interfaceAddress: string;

  constructor() {
    super();
    this.multicastAddress = process.env.MULTICAST_ADDRESS || '239.255.43.21';
    this.multicastPort = parseInt(process.env.MULTICAST_PORT || '10086');
    this.interfaceAddress = process.env.INTERFACE_ADDRESS || '0.0.0.0';
  }

  public start(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isListening) {
          resolve();
          return;
        }

        // 加载protobuf定义文件
        try {
          await protobufParserService.loadProtobufDefinitions();
        } catch (error) {
          console.warn('Protobuf定义文件加载失败，将使用原始数据显示:', error);
        }

        // 创建支持端口复用的socket
        this.socket = dgram.createSocket({
          type: 'udp4',
          reuseAddr: true  // 允许地址复用，这是解决端口占用问题的关键
        });

        this.socket.on('error', (err) => {
          console.error('组播监听错误:', err);
          this.emit('error', err);
        });

        this.socket.on('message', (msg, rinfo) => {
          const timestamp = Date.now();
          const source = `${rinfo.address}:${rinfo.port}`;

          // 尝试解析protobuf数据
          let parsedPacket: ParsedPacket | undefined;
          try {
            console.log('[Multicast][调试] 收到数据包:', {
              length: msg.length,
              header: msg.subarray(0, 8).toString('hex'),
              fullPacket: msg.toString('hex'),
              packageType: `0x${msg[3].toString(16).padStart(2, '0')}`,
              protocolID: `0x${msg[2].toString(16).padStart(2, '0')}`,
              dataSize: msg.length >= 8 ? msg.readUInt32LE(4) : 'N/A',
              source
            });

            const parsed = protobufParserService.parsePacket(msg, source, timestamp);
            if (parsed) {
              parsedPacket = parsed;
              // 打印结构化数据到后台
              console.log('[Multicast][Protobuf解析成功] ✅', {
                time: new Date(timestamp).toLocaleString('zh-CN'),
                source,
                packageType: parsed.packageTypeName + ` (0x${parsed.packageType.toString(16)})`,
                protocolID: `0x${parsed.protocolID.toString(16)}`,
                parsedData: parsed.parsedData,
                rawDataSize: parsed.size
              });

              // 如果是平台状态数据，额外打印详细信息
              if (parsed.packageType === 0x29) {
                const platforms = parsed.parsedData?.platform || [];
                console.log('[Multicast][平台状态详情] 🚁', {
                  平台数量: platforms.length,
                  平台信息: platforms.map((platform: any, index: number) => ({
                    编号: index + 1,
                    名称: platform.base?.name,
                    类型: platform.base?.type,
                    阵营: platform.base?.side,
                    编队: platform.base?.group,
                    坐标: platform.base?.location ? {
                      经度: platform.base.location.longitude,
                      纬度: platform.base.location.latitude,
                      高度: platform.base.location.altitude
                    } : null,
                    更新时间: new Date((platform.updataTime || 0) * 1000).toLocaleString('zh-CN'),
                    通信设备数: platform.comms?.length || 0,
                    传感器数: platform.sensors?.length || 0,
                    武器数: platform.weapons?.length || 0,
                    跟踪目标数: platform.tracks?.length || 0,
                    航迹点数: platform.mover?.route?.length || 0
                  })),
                  时间戳: new Date(timestamp).toISOString()
                });
              }
            } else {
              console.log('[Multicast][Protobuf解析] ❌ 返回null，可能是包格式不匹配');
              console.log('[Multicast][调试] 包头检查:', {
                expectedHeader: 'aa55',
                actualHeader: msg.subarray(0, 2).toString('hex'),
                isValidHeader: msg[0] === 0xAA && msg[1] === 0x55,
                minLength: msg.length >= 8
              });
            }
          } catch (error) {
            console.error('[Multicast][Protobuf解析失败] ❌:', error);
            console.log('[Multicast][错误详情]', {
              errorMessage: error instanceof Error ? error.message : String(error),
              packetLength: msg.length,
              packetHex: msg.toString('hex')
            });
          }

          const packet: MulticastPacket = {
            timestamp,
            source,
            data: msg,
            dataString: msg.toString('utf8'),
            size: msg.length,
            parsedPacket
          };

          this.emit('packet', packet);
        });

        this.socket.on('listening', () => {
          console.log(`开始监听组播地址: ${this.multicastAddress}:${this.multicastPort}`);
          this.isListening = true;
          this.emit('started');
          resolve();
        });

        // 绑定到指定端口
        this.socket.bind({
          port: this.multicastPort,
          address: this.interfaceAddress,
          exclusive: false // 允许端口复用
        }, () => {
          if (this.socket) {
            try {
              // 加入组播组
              this.socket.addMembership(this.multicastAddress, this.interfaceAddress);
              console.log(`已加入组播组: ${this.multicastAddress}`);
            } catch (membershipError) {
              console.warn('[Multicast] 加入组播组时出现警告:', membershipError);
              // 尝试使用默认接口
              try {
                this.socket.addMembership(this.multicastAddress);
                console.log(`[Multicast] 已使用默认接口加入组播组: ${this.multicastAddress}`);
              } catch (defaultMembershipError) {
                console.error('[Multicast] 无法加入组播组:', defaultMembershipError);
                this.emit('error', new Error('无法加入组播组，请检查网络配置'));
              }
            }
          }
        });

      } catch (error) {
        console.error('启动组播监听失败:', error);
        reject(error);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket && this.isListening) {
        this.socket.close(() => {
          this.socket = null;
          this.isListening = false;
          console.log('组播监听已停止');
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getStatus(): { isListening: boolean; address: string; port: number } {
    return {
      isListening: this.isListening,
      address: this.multicastAddress,
      port: this.multicastPort
    };
  }

  public updateConfig(address: string, port: number, interfaceAddr: string): void {
    this.multicastAddress = address;
    this.multicastPort = port;
    this.interfaceAddress = interfaceAddr;
  }
}

export const multicastService = new MulticastService();