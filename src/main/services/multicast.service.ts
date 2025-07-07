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

        this.socket = dgram.createSocket('udp4');

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
            const parsed = protobufParserService.parsePacket(msg, source, timestamp);
            if (parsed) {
              parsedPacket = parsed;
              // 打印结构化数据到后台
              console.log('[Multicast][Protobuf解析]', {
                time: new Date(timestamp).toLocaleString('zh-CN'),
                source,
                packageType: parsed.packageTypeName + ` (0x${parsed.packageType.toString(16)})`,
                protocolID: parsed.protocolID,
                parsedData: parsed.parsedData
              });
            }
          } catch (error) {
            console.warn('Protobuf解析失败:', error);
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
        this.socket.bind(this.multicastPort, this.interfaceAddress, () => {
          if (this.socket) {
            // 加入组播组
            this.socket.addMembership(this.multicastAddress, this.interfaceAddress);
            console.log(`已加入组播组: ${this.multicastAddress}`);
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