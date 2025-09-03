#!/usr/bin/env node

const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

class PlatformStatusSender {
    constructor() {
        this.socket = dgram.createSocket('udp4');
        this.root = null;
        this.multicastAddress = '239.255.43.21';
        this.multicastPort = 10086;
        this.sendInterval = 2000; // 2秒发送一次
        this.platformId = 1001;
        this.intervalId = null;

        // 模拟位置数据
        this.longitude = 116.3974; // 北京经度
        this.latitude = 39.9093;   // 北京纬度
        this.altitude = 100.0;

        // 位置变化参数
        this.lonStep = 0.001;
        this.latStep = 0.001;
        this.altStep = 1.0;
    }

    async initialize() {
        try {
            console.log('正在加载protobuf定义文件...');

            // 加载protobuf定义文件
            this.root = await protobuf.load([
                path.join(__dirname, 'src/protobuf/PublicStruct.proto'),
                path.join(__dirname, 'src/protobuf/PlatFormStatus.proto')
            ]);

            console.log('Protobuf定义文件加载成功');

            // 设置socket选项
            this.socket.bind(() => {
                this.socket.setBroadcast(true);
                this.socket.setMulticastTTL(128);
                console.log(`平台状态发送器已启动，目标地址: ${this.multicastAddress}:${this.multicastPort}`);
                console.log(`发送间隔: ${this.sendInterval}ms`);
                console.log('按 Ctrl+C 停止发送\n');
            });

        } catch (error) {
            console.error('初始化失败:', error);
            process.exit(1);
        }
    }

    createPlatformStatusPacket() {
        try {
            // 获取消息类型
            const PlatformStatusInfo = this.root.lookupType('PlatformStatus.PlatformStatusInfo');
            const GeoCoordinate = this.root.lookupType('PublicStruct.GeoCoordinate');

            // 更新位置数据（模拟移动）
            this.longitude += (Math.random() - 0.5) * this.lonStep;
            this.latitude += (Math.random() - 0.5) * this.latStep;
            this.altitude += (Math.random() - 0.5) * this.altStep;

            // 创建地理坐标 (使用PublicStruct.GeoCoordinate)
            const coord = GeoCoordinate.create({
                longitude: this.longitude,
                latitude: this.latitude,
                altitude: this.altitude
            });

            // 创建平台状态信息 (使用有效的平台类型: 0, 2, 3, 4)
            const validTypes = [0, 2, 3, 4]; // PlatForm_Uav, PlatForm_Artillery, PlatForm_Shell, PlatForm_Target
            const randomType = validTypes[Math.floor(Math.random() * validTypes.length)];

            const platformStatus = PlatformStatusInfo.create({
                PlatformId: this.platformId,
                type: randomType,
                coord: coord
            });

            // 编码protobuf数据
            const protobufData = PlatformStatusInfo.encode(platformStatus).finish();

            // 调试输出
            console.log('创建的平台状态数据:', JSON.stringify(platformStatus, null, 2));
            console.log('Protobuf数据长度:', protobufData.length);

            // 构建完整数据包: 0xAA 0x55 + protocolID + packageType + size + protobufData
            const packetSize = 8 + protobufData.length;
            const packet = Buffer.alloc(packetSize);

            let offset = 0;
            packet[offset++] = 0xAA;           // 包头1
            packet[offset++] = 0x55;           // 包头2
            packet[offset++] = 0x01;           // protocolID
            packet[offset++] = 0x29;           // packageType (PackType_PlatformStatus)
            packet.writeUInt32LE(protobufData.length, offset); // protobuf数据长度
            offset += 4;
            protobufData.copy(packet, offset); // protobuf数据

            return {
                packet,
                platformStatus: {
                    platformId: this.platformId,
                    type: platformStatus.type,
                    longitude: this.longitude.toFixed(6),
                    latitude: this.latitude.toFixed(6),
                    altitude: this.altitude.toFixed(1)
                }
            };

        } catch (error) {
            console.error('创建数据包失败:', error);
            return null;
        }
    }

    sendPacket() {
        const result = this.createPlatformStatusPacket();
        if (!result) return;

        const { packet, platformStatus } = result;

        this.socket.send(packet, this.multicastPort, this.multicastAddress, (error) => {
            if (error) {
                console.error('发送失败:', error);
            } else {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`[${timestamp}] 已发送平台状态 - ID:${platformStatus.platformId}, 类型:${this.getPlatformTypeName(platformStatus.type)}, 位置:(${platformStatus.longitude}, ${platformStatus.latitude}, ${platformStatus.altitude}m)`);
            }
        });
    }

    getPlatformTypeName(type) {
        const types = {
            0: '无人机',
            2: '火炮',
            3: '炮弹',
            4: '目标'
        };
        return types[type] || '未知';
    }

    start() {
        console.log('开始发送平台状态数据包...\n');

        // 立即发送一次
        this.sendPacket();

        // 设置定时发送
        this.intervalId = setInterval(() => {
            this.sendPacket();
        }, this.sendInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.socket) {
            this.socket.close();
        }

        console.log('\n平台状态发送器已停止');
    }
}

// 主程序
async function main() {
    const sender = new PlatformStatusSender();

    // 处理退出信号
    process.on('SIGINT', () => {
        sender.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        sender.stop();
        process.exit(0);
    });

    try {
        await sender.initialize();
        sender.start();
    } catch (error) {
        console.error('程序启动失败:', error);
        process.exit(1);
    }
}

// 启动程序
if (require.main === module) {
    main();
}

module.exports = PlatformStatusSender;