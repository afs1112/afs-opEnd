import dgram from 'dgram';
import * as protobuf from 'protobufjs';
import { join } from 'path';
import { app } from 'electron';

export interface PlatformCmdData {
  commandID: number;
  platformName: string;
  platformType: string;
  command: number; // PlatformCommand 枚举值
  fireParam?: {
    weaponName?: string;
    targetName?: string;
    quantity?: number;
  };
}

export class MulticastSenderService {
  private socket: dgram.Socket | null = null;
  private root: protobuf.Root | null = null;
  private multicastAddress: string;
  private multicastPort: number;

  constructor() {
    this.multicastAddress = process.env.MULTICAST_ADDRESS || '239.255.43.21';
    this.multicastPort = parseInt(process.env.MULTICAST_PORT || '10086');
  }

  public isInitialized(): boolean {
    return this.root !== null && this.socket !== null;
  }

  public async initialize(): Promise<void> {
    try {
      // 创建支持端口复用的UDP socket
      this.socket = dgram.createSocket({
        type: 'udp4',
        reuseAddr: true  // 允许地址复用
      });

      // 设置socket选项
      if (this.socket) {
        this.socket.on('listening', () => {
          if (this.socket) {
            try {
              this.socket.setBroadcast(true);
              this.socket.setRecvBufferSize(65536); // 增加接收缓冲区大小
              console.log('[MulticastSender] Socket选项设置成功');
            } catch (optionError) {
              console.warn('[MulticastSender] 设置socket选项时出现警告:', optionError);
            }
          }
        });
      }

      // 加载protobuf定义文件
      await this.loadProtobufDefinitions();

      console.log('[MulticastSender] 组播发送服务初始化成功');
    } catch (error) {
      console.error('[MulticastSender] 初始化失败:', error);
      throw error;
    }
  }

  private async loadProtobufDefinitions(): Promise<void> {
    try {
      const fs = require('fs');

      // 扩展路径列表，处理各种可能的环境
      const pathList: string[] = [];
      
      // 尝试获取 app 路径，处理可能的异常
      try {
        const appPath = app.getAppPath();
        pathList.push(
          join(appPath, 'main', 'src', 'protobuf'), // 生产环境打包后
          join(appPath, 'src', 'protobuf'),        // 开发环境
          join(appPath, 'build', 'main', 'src', 'protobuf'), // 编译后路径
          join(appPath, 'resources', 'app', 'src', 'protobuf') // 打包后的资源路径
        );
      } catch (appError) {
        console.log('[MulticastSender] ⚠️ 无法获取app路径，使用备用方案');
      }
      
      // 添加通用路径
      pathList.push(
        join(process.cwd(), 'src', 'protobuf'),           // 当前工作目录
        join(__dirname, '..', '..', 'protobuf'),          // 相对于当前文件
        join(__dirname, '..', 'protobuf'),                // 备用路径1
        join(__dirname, 'protobuf'),                      // 备用路径2
        join(__dirname, '../../src/protobuf'),            // 从build目录向上查找
        join(process.cwd(), 'build', 'main', 'src', 'protobuf'), // 编译后的路径
        '/Users/xinnix/code/afs/afs-opEnd/src/protobuf'    // 绝对路径作为最后备选
      );

      let protobufPath = '';
      let found = false;

      console.log('[MulticastSender] 尝试查找protobuf定义文件...');
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
        throw new Error(`未找到protobuf定义目录，已尝试 ${pathList.length} 个路径: ${pathList.slice(0, 5).join(', ')}...`);
      }

      // 加载 PlatformCmd 相关的protobuf定义
      const requiredFiles = ['PublicStruct.proto', 'PlatformCmd.proto'];
      const availableFiles: string[] = [];

      for (const file of requiredFiles) {
        const filePath = join(protobufPath, file);
        try {
          if (fs.existsSync(filePath)) {
            availableFiles.push(filePath);
            console.log(`[MulticastSender] ✅ 找到文件: ${file}`);
          } else {
            console.log(`[MulticastSender] ❌ 缺少文件: ${file} (路径: ${filePath})`);
          }
        } catch (fileError) {
          console.log(`[MulticastSender] ⚠️ 检查文件失败: ${file} - ${fileError}`);
        }
      }

      if (availableFiles.length === 0) {
        throw new Error(`缺少必需的protobuf文件，需要: ${requiredFiles.join(', ')}，已搜索目录: ${protobufPath}`);
      }

      console.log(`[MulticastSender] 开始加载 ${availableFiles.length} 个protobuf文件...`);
      console.log(`[MulticastSender] 文件列表: ${availableFiles.map(f => require('path').basename(f)).join(', ')}`);
      
      this.root = await protobuf.load(availableFiles);
      console.log('[MulticastSender] ✅ Protobuf定义文件加载成功');
      
      // 验证必要的消息类型是否存在
      try {
        const PlatformCmdType = this.root.lookupType('PlatformStatus.PlatformCmd');
        const FireParamType = this.root.lookupType('PlatformStatus.FireParam');
        console.log('[MulticastSender] ✅ 验证消息类型成功');
      } catch (verifyError) {
        console.error('[MulticastSender] ❌ 消息类型验证失败:', verifyError);
        if (this.root && this.root.nested) {
          console.log('[MulticastSender] 可用的命名空间:', Object.keys(this.root.nested));
          if (this.root.nested['PlatformStatus']) {
            const platformNested = this.root.nested['PlatformStatus'] as protobuf.Namespace;
            console.log('[MulticastSender] PlatformStatus命名空间中的类型:', Object.keys(platformNested.nested || {}));
          }
        }
        throw verifyError;
      }
    } catch (error) {
      console.error('[MulticastSender] ❌ 加载Protobuf定义文件失败:', error);
      throw error;
    }
  }

  public async sendPlatformCmd(data: PlatformCmdData): Promise<void> {
    try {
      if (!this.root) {
        throw new Error('Protobuf定义文件未加载，请先调用 initialize() 方法');
      }

      if (!this.socket) {
        throw new Error('UDP socket未初始化，请先调用 initialize() 方法');
      }

      // 查找消息类型
      const PlatformCmdType = this.root.lookupType('PlatformStatus.PlatformCmd');
      const FireParamType = this.root.lookupType('PlatformStatus.FireParam');

      console.log('[MulticastSender] 创建PlatformCmd消息:', data);

      // 创建消息数据
      const cmdData: any = {
        commandID: data.commandID,
        platformName: data.platformName,
        platformType: data.platformType,
        command: data.command
      };

      // 如果有fireParam，添加到消息中
      if (data.fireParam) {
        const fireParam = FireParamType.create({
          weaponName: data.fireParam.weaponName || '',
          targetName: data.fireParam.targetName || '',
          quantity: data.fireParam.quantity || 1
        });
        cmdData.fireParam = fireParam;
      }

      // 创建并编码protobuf消息
      const message = PlatformCmdType.create(cmdData);
      const protobufBuffer = PlatformCmdType.encode(message).finish();

      console.log('[MulticastSender] Protobuf编码后大小:', protobufBuffer.length, '字节');

      // 构造完整的数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
      const protocolID = 0x01; // 协议ID
      const packageType = 0x2A; // PackType_PlatformCmd
      const size = protobufBuffer.length;

      // 创建包头
      const header = Buffer.alloc(8);
      header[0] = 0xAA; // 包头标识
      header[1] = 0x55; // 包头标识
      header[2] = protocolID; // 协议ID
      header[3] = packageType; // 包类型
      header.writeUInt32LE(size, 4); // protobuf数据长度（小端序）

      // 组合完整数据包
      const fullPacket = Buffer.concat([header, protobufBuffer]);

      console.log('[MulticastSender] 数据包构造详情:', {
        总长度: fullPacket.length,
        包头: header.toString('hex'),
        协议ID: `0x${protocolID.toString(16)}`,
        包类型: `0x${packageType.toString(16)}`,
        声明大小: size,
        实际protobuf大小: protobufBuffer.length
      });

      // 发送数据包
      await this.sendPacket(fullPacket);

      console.log('[MulticastSender] ✅ PlatformCmd消息发送成功');
    } catch (error) {
      console.error('[MulticastSender] ❌ 发送PlatformCmd消息失败:', error);
      throw error;
    }
  }

  private sendPacket(packet: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('UDP socket未初始化'));
        return;
      }

      this.socket.send(packet, this.multicastPort, this.multicastAddress, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[MulticastSender] 已发送数据包到 ${this.multicastAddress}:${this.multicastPort}`);
          console.log(`[MulticastSender] 数据包大小: ${packet.length} 字节`);
          console.log(`[MulticastSender] 发送时间: ${new Date().toLocaleString('zh-CN')}`);
          resolve();
        }
      });
    });
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log('[MulticastSender] UDP socket已关闭');
    }
  }
}

export const multicastSenderService = new MulticastSenderService();