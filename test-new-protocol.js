const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

// 创建UDP socket
const socket = dgram.createSocket('udp4');

// 加载protobuf定义
async function loadProtobuf() {
  try {
    const root = await protobuf.load([
      path.join(__dirname, 'src/protobuf/PublicStruct.proto'),
      path.join(__dirname, 'src/protobuf/UavFlyStatusStruct.proto'),
      path.join(__dirname, 'src/protobuf/UavNavMonitorStruct.proto')
    ]);
    return root;
  } catch (error) {
    console.error('加载protobuf失败:', error);
    return null;
  }
}

// 创建数据包
function createPacket(protocolID, packageType, protobufData) {
  const buffer = Buffer.alloc(8 + protobufData.length);
  
  // 包头: 0xAA 0x55
  buffer[0] = 0xAA;
  buffer[1] = 0x55;
  
  // 协议ID
  buffer[2] = protocolID;
  
  // 包类型
  buffer[3] = packageType;
  
  // protobuf数据长度 (4字节小端序)
  buffer.writeUInt32LE(protobufData.length, 4);
  
  // protobuf数据
  protobufData.copy(buffer, 8);
  
  return buffer;
}

// 发送飞行状态信息 (包类型: 0x01)
async function sendFlyStatus(root) {
  try {
    const UavFlyStatusInfo = root.lookupType('UavFlyStatus.UavFlyStatusInfo');
    const GeoCoordinate = root.lookupType('PublicStruct.GeoCoordinate');
    const UavAttitudeDisplay = root.lookupType('UavFlyStatus.UavAttitudeDisplay');
    const OtherInfoExtra = root.lookupType('UavFlyStatus.OtherInfoExtra');

    // 创建位置信息
    const coord = GeoCoordinate.create({
      longitude: 116.3974 + Math.random() * 0.01,
      latitude: 39.9093 + Math.random() * 0.01,
      altitude: 100 + Math.random() * 50
    });

    // 创建姿态信息
    const attitudeInfo = UavAttitudeDisplay.create({
      ground_speed: 50 + Math.random() * 20,
      yaw: Math.random() * 360,
      pitch: -5 + Math.random() * 10,
      roll: -2 + Math.random() * 4,
      altitude: 100 + Math.random() * 50,
      vertical_speed: -2 + Math.random() * 4
    });

    // 创建其他信息
    const otherInfo = OtherInfoExtra.create({
      securityBoundaryEnabled: false,
      currentExecuteState: "巡航中",
      satNavEnabled: true,
      mission_progress: 65.5,
      current_waypoint: "WP-003"
    });

    // 创建飞行状态信息
    const flyStatus = UavFlyStatusInfo.create({
      uavID: 1,
      coord: coord,
      attitudeInfo: attitudeInfo,
      otherInfoExtra: otherInfo
    });

    // 编码protobuf数据
    const protobufData = UavFlyStatusInfo.encode(flyStatus).finish();
    
    // 创建完整数据包
    const packet = createPacket(0, 0x01, protobufData);
    
    // 发送数据包
    socket.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error('发送飞行状态失败:', err);
      } else {
        console.log('发送飞行状态成功:', {
          protocolID: 0,
          packageType: 0x01,
          size: protobufData.length,
          uavID: flyStatus.uavID,
          longitude: coord.longitude,
          latitude: coord.latitude,
          altitude: coord.altitude,
          groundSpeed: attitudeInfo.ground_speed,
          yaw: attitudeInfo.yaw
        });
      }
    });

  } catch (error) {
    console.error('创建飞行状态数据失败:', error);
  }
}

// 发送航线上传 (包类型: 0x20)
async function sendRouteUpload(root) {
  try {
    const UavRouteUpload = root.lookupType('UavNavMonitor.UavRouteUpload');
    const WayPoint = root.lookupType('UavNavMonitor.WayPoint');
    const GeoCoordinate = root.lookupType('PublicStruct.GeoCoordinate');

    // 创建航点列表
    const waypoints = [];
    for (let i = 0; i < 5; i++) {
      const coord = GeoCoordinate.create({
        longitude: 116.3974 + i * 0.001,
        latitude: 39.9093 + i * 0.001,
        altitude: 100 + i * 10
      });

      const waypoint = WayPoint.create({
        index: i + 1,
        coord: coord,
        command1: `CMD_${i + 1}`,
        command2: `PARAM_${i + 1}`
      });

      waypoints.push(waypoint);
    }

    // 创建航线上传数据
    const routeUpload = UavRouteUpload.create({
      uavID: 1,
      routeType: 0, // 巡航航线
      wayPointSize: waypoints.length,
      wayPointList: waypoints
    });

    // 编码protobuf数据
    const protobufData = UavRouteUpload.encode(routeUpload).finish();
    
    // 创建完整数据包
    const packet = createPacket(0, 0x20, protobufData);
    
    // 发送数据包
    socket.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
      if (err) {
        console.error('发送航线上传失败:', err);
      } else {
        console.log('发送航线上传成功:', {
          protocolID: 0,
          packageType: 0x20,
          size: protobufData.length,
          uavID: routeUpload.uavID,
          routeType: routeUpload.routeType,
          wayPointSize: routeUpload.wayPointSize
        });
      }
    });

  } catch (error) {
    console.error('创建航线上传数据失败:', error);
  }
}

// 主函数
async function main() {
  console.log('开始发送测试数据...');
  console.log(`组播地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);

  const root = await loadProtobuf();
  if (!root) {
    console.error('无法加载protobuf定义');
    return;
  }

  // 定时发送飞行状态信息
  setInterval(() => {
    sendFlyStatus(root);
  }, 2000);

  // 定时发送航线上传
  setInterval(() => {
    sendRouteUpload(root);
  }, 5000);

  // 10秒后停止
  setTimeout(() => {
    console.log('测试完成');
    socket.close();
    process.exit(0);
  }, 10000);
}

// 启动测试
main().catch(console.error); 