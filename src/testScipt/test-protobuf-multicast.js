const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket用于发送组播数据
const sender = dgram.createSocket('udp4');

// 组播地址和端口
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

// 加载protobuf定义
let root = null;
let messageTypes = {};

async function loadProtobufDefinitions() {
  try {
    const protobufPath = path.join(__dirname, 'src', 'protobuf');
    
    root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UavNavMonitorStruct.proto'),
      path.join(protobufPath, 'UavFlyMonitorStruct.proto'),
      path.join(protobufPath, 'UaviationSimulationStruct.proto')
    ]);

    // 获取消息类型
    messageTypes = {
      HeartbeatInternal: root.lookupType('PublicStruct.HeartbeatInternal'),
      UavFlyStatusInfo: root.lookupType('UaviationSimulation.UavFlyStatusInfo'),
      UavFlyControlRequest: root.lookupType('UavFlyMonitor.UavFlyControlRequest'),
      UavAttitudeControl: root.lookupType('UavFlyMonitor.UavAttitudeControl'),
      UavEngineControl: root.lookupType('UavFlyMonitor.UavEngineControl'),
      UavRouteUpload: root.lookupType('UavNavMonitor.UavRouteUpload'),
      UavSecurityBoundaryControl: root.lookupType('UavNavMonitor.UavSecurityBoundaryControl'),
      UavNavReplyInfo: root.lookupType('UavNavMonitor.UavNavReplyInfo')
    };

    console.log('Protobuf定义文件加载成功');
  } catch (error) {
    console.error('加载Protobuf定义文件失败:', error);
    process.exit(1);
  }
}

// 创建心跳数据
function createHeartbeatData() {
  const heartbeatData = {
    softwareID: 1,
    state: 1,
    reserve: 0
  };

  const message = messageTypes.HeartbeatInternal.create(heartbeatData);
  const buffer = messageTypes.HeartbeatInternal.encode(message).finish();
  
  // 添加包类型字节 (0x02 = PackType_HeartbeatInternal)
  const packet = Buffer.concat([Buffer.from([0x02]), buffer]);
  return packet;
}

// 创建飞行状态数据
function createFlyStatusData() {
  const flyStatusData = {
    uavID: 1,
    coord: {
      longitude: 116.3974,
      latitude: 39.9093,
      altitude: 1000
    },
    attitudeInfo: {
      roll: 0.1,
      pitch: 0.2,
      yaw: 45.0,
      speed: 120.5,
      height: 1000
    },
    cylinderTemperatureInfo: {
      temperature1: 85.5,
      temperature2: 86.2,
      temperature3: 84.8,
      temperature4: 85.1
    },
    engineDisplay: {
      throttle_butterfly: 75.0,
      air_passage: 80.0,
      rotate_speed: 2500,
      oil_quantity: 85.0
    },
    flyStatus: {
      control_value: {
        elevator: 0.1,
        left_aileron: 0.05,
        right_aileron: 0.05,
        damper: 0.0,
        airway: 80.0
      }
    },
    flyWarningInfo: {
      fly_stop_state: 0,
      height_state: 0,
      speed_state: 0,
      atttiude_state: 0,
      engine_state: 0
    },
    otherInfoExtra: {
      currentExecuteState: "正常飞行",
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };

  const message = messageTypes.UavFlyStatusInfo.create(flyStatusData);
  const buffer = messageTypes.UavFlyStatusInfo.encode(message).finish();
  
  // 添加包类型字节 (0x01 = PackType_Flystatus)
  const packet = Buffer.concat([Buffer.from([0x01]), buffer]);
  return packet;
}

// 创建飞行控制数据
function createFlyControlData() {
  const flyControlData = {
    uavID: 1,
    type: 1 // Cmd_start_fly
  };

  const message = messageTypes.UavFlyControlRequest.create(flyControlData);
  const buffer = messageTypes.UavFlyControlRequest.encode(message).finish();
  
  // 添加包类型字节 (0x10 = PackType_FlyControl)
  const packet = Buffer.concat([Buffer.from([0x10]), buffer]);
  return packet;
}

// 创建姿态控制数据
function createAttitudeControlData() {
  const attitudeControlData = {
    uavID: 1,
    yaw: 90.0,
    height: 1500
  };

  const message = messageTypes.UavAttitudeControl.create(attitudeControlData);
  const buffer = messageTypes.UavAttitudeControl.encode(message).finish();
  
  // 添加包类型字节 (0x11 = PackType_AttitudeControl)
  const packet = Buffer.concat([Buffer.from([0x11]), buffer]);
  return packet;
}

// 创建发动机控制数据
function createEngineControlData() {
  const engineControlData = {
    uavID: 1,
    throttle_butterfly: 80.0,
    air_passage: 85.0,
    rotate_speed: 2800
  };

  const message = messageTypes.UavEngineControl.create(engineControlData);
  const buffer = messageTypes.UavEngineControl.encode(message).finish();
  
  // 添加包类型字节 (0x12 = PackType_EngineControl)
  const packet = Buffer.concat([Buffer.from([0x12]), buffer]);
  return packet;
}

// 发送数据
function sendData(data, description) {
  sender.send(data, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('发送失败:', err);
    } else {
      console.log(`已发送 ${description} 到 ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
      console.log(`数据大小: ${data.length} 字节`);
      console.log(`包类型: 0x${data[0].toString(16)}`);
      console.log('---');
    }
  });
}

// 主函数
async function main() {
  await loadProtobufDefinitions();
  
  console.log('开始发送Protobuf格式的组播测试数据...');
  console.log(`目标地址: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  console.log('按 Ctrl+C 停止');
  console.log('---');

  // 立即发送一次各种类型的数据
  sendData(createHeartbeatData(), '心跳数据');
  
  setTimeout(() => {
    sendData(createFlyStatusData(), '飞行状态数据');
  }, 1000);
  
  setTimeout(() => {
    sendData(createFlyControlData(), '飞行控制数据');
  }, 2000);
  
  setTimeout(() => {
    sendData(createAttitudeControlData(), '姿态控制数据');
  }, 3000);
  
  setTimeout(() => {
    sendData(createEngineControlData(), '发动机控制数据');
  }, 4000);

  // 每10秒发送一次心跳数据
  setInterval(() => {
    sendData(createHeartbeatData(), '心跳数据');
  }, 10000);

  // 每15秒发送一次飞行状态数据
  setInterval(() => {
    sendData(createFlyStatusData(), '飞行状态数据');
  }, 15000);
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n停止发送...');
  sender.close();
  process.exit(0);
});

// 启动
main().catch(console.error); 