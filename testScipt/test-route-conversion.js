const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket
const sender = dgram.createSocket('udp4');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let UavRouteUpload = null;

// 测试航线数据 - 使用命令行参数或默认值
const testUavId = process.argv[2] ? parseInt(process.argv[2]) : 1234;

const testRoute = {
  uavID: testUavId,
  routeType: 0, // RouteType_Cruise
  wayPointSize: 3,
  wayPointList: [
    {
      index: 1,
      coord: {
        longitude: 116.397428,
        latitude: 39.90923,
        altitude: 100
      },
      command1: "起飞",
      command2: ""
    },
    {
      index: 2,
      coord: {
        longitude: 116.407428,
        latitude: 39.91923,
        altitude: 150
      },
      command1: "巡航",
      command2: ""
    },
    {
      index: 3,
      coord: {
        longitude: 116.417428,
        latitude: 39.92923,
        altitude: 100
      },
      command1: "降落",
      command2: ""
    }
  ]
};

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UavNavMonitorStruct.proto')
    ]);
    
    UavRouteUpload = root.lookupType('UavNavMonitor.UavRouteUpload');
    console.log('✓ Protobuf加载成功');
  } catch (error) {
    console.error('✗ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 创建符合协议格式的数据包
function createProtocolPacket(protobufData, packageType = 0x20, protocolID = 0x01) {
  const dataLength = protobufData.length;
  
  // 创建协议头: AA55 + 协议ID + 包类型 + 数据长度(4字节小端序) + 数据
  const packet = Buffer.allocUnsafe(8 + dataLength);
  
  packet[0] = 0xAA;  // 协议头1
  packet[1] = 0x55;  // 协议头2
  packet[2] = protocolID;  // 协议ID
  packet[3] = packageType; // 包类型 (0x20 = PackType_RouteUpload)
  packet.writeUInt32LE(dataLength, 4); // 数据长度(小端序)
  
  // 复制protobuf数据
  protobufData.copy(packet, 8);
  
  return packet;
}

// 发送航线上传数据包
function sendRouteUpload() {
  console.log('🛩️ 发送航线上传数据包');
  console.log('航线数据:', JSON.stringify(testRoute, null, 2));
  
  const message = UavRouteUpload.create(testRoute);
  const protobufBuffer = UavRouteUpload.encode(message).finish();
  
  // 创建符合协议格式的完整数据包
  const packet = createProtocolPacket(protobufBuffer, 0x20, 0x01);
  
  sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('✗ 发送失败:', err);
    } else {
      console.log(`✅ 航线上传数据包发送成功`);
      console.log(`📊 协议: AA55 01 20, 总包长: ${packet.length} 字节`);
      console.log(`🆔 UAV ID: ${testRoute.uavID}`);
      console.log(`📍 航点数量: ${testRoute.wayPointList.length}`);
      console.log(`🗺️ 航线类型: ${testRoute.routeType} (巡航航线)`);
    }
  });
}

async function main() {
  await loadProtobuf();
  
  console.log('🧪 航线转换功能测试 (UavId验证版)');
  console.log('================================');
  console.log(`📡 组播地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log(`🆔 测试UAV ID: ${testRoute.uavID}`);
  console.log(`📍 测试航点数: ${testRoute.wayPointList.length}`);
  console.log('');
  
  console.log('💡 UavId匹配说明:');
  console.log('- 系统会验证航线UavId与设定的UavId是否一致');
  console.log('- 只有匹配时才会进行航线转换');
  console.log('- 如需测试特定UavId，请使用: node test-route-conversion.js <UavId>');
  console.log('');

  console.log('💡 测试步骤:');
  console.log('1. 确保应用程序正在运行');
  console.log('2. 打开命令测试页面');
  console.log('3. 观察控制台和页面的航线转换消息');
  console.log('4. 检查是否收到PlatformCmd格式的航线数据');
  console.log('');

  console.log('🎯 预期结果:');
  console.log('- 应用程序接收到0x20数据包');
  console.log('- 自动转换为PlatformCmd格式');
  console.log('- 页面显示"航线已转换"消息');
  console.log('- 发送0x2A数据包到组播');
  console.log('');

  // 发送测试数据包
  sendRouteUpload();
  
  console.log('📦 数据包已发送，请观察应用程序的反应');
  console.log('按 Ctrl+C 退出');
}

process.on('SIGINT', () => {
  console.log('\\n🛑 测试结束');
  sender.close();
  process.exit(0);
});

main().catch(console.error);