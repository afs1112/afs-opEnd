const dgram = require('dgram');
const protobuf = require('protobufjs');
const path = require('path');

// 创建UDP socket
const sender = dgram.createSocket('udp4');

// 组播配置
const MULTICAST_ADDRESS = '239.255.43.21';
const MULTICAST_PORT = 10086;

let UavFlyStatusInfo = null;

async function loadProtobuf() {
  try {
    const protobufPath = path.join(__dirname, '..', 'src', 'protobuf');
    const root = await protobuf.load([
      path.join(protobufPath, 'PublicStruct.proto'),
      path.join(protobufPath, 'UaviationSimulationStruct.proto')
    ]);
    
    UavFlyStatusInfo = root.lookupType('UaviationSimulation.UavFlyStatusInfo');
    console.log('✅ Protobuf加载成功');
  } catch (error) {
    console.error('❌ Protobuf加载失败:', error);
    process.exit(1);
  }
}

// 创建协议数据包
function createProtocolPacket(protobufData, packageType = 0x01, protocolID = 0x01) {
  const dataLength = protobufData.length;
  const packet = Buffer.allocUnsafe(8 + dataLength);
  
  packet[0] = 0xAA;  // 协议头1
  packet[1] = 0x55;  // 协议头2
  packet[2] = protocolID;  // 协议ID
  packet[3] = packageType; // 包类型
  packet.writeUInt32LE(dataLength, 4); // 数据长度(小端序)
  
  protobufData.copy(packet, 8);
  return packet;
}

// 创建完整的飞行状态数据
function createCompleteFlyStatus() {
  const data = {
    uavID: 1,
    coord: {
      longitude: 106.319248,
      latitude: 36.221109,
      altitude: 1000
    },
    attitudeInfo: {
      roll: 2.5,
      pitch: 1.2,
      yaw: 45.0,
      speed: 120.5,
      indicated_airspeed: 118.0,
      ground_speed: 120.5,
      height: 1000,
      high_pressure: 980.0,
      high_satellite: 1020.0
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
      oil_quantity: 85.0,
      cylinder_temperature: {
        temperature1: 85.5,
        temperature2: 87.2,
        temperature3: 84.8,
        temperature4: 86.1
      }
    },
    dataChainInfo: {
      // 链路信息为空
    },
    flyStatus: {
      control_value: {
        elevator: 0.12,
        left_aileron: -0.25,
        right_aileron: 0.25,
        damper: 0.0,
        airway: 75.0
      },
      output_value: {
        elevator: 0.10,
        left_aileron: -0.20,
        right_aileron: 0.20,
        damper: 0.0,
        airway: 73.0
      },
      voltage_value: {
        voltage1: 24.8,
        voltage2: 24.6,
        voltageComputer: 12.2
      },
      main_angular_rate_value: {
        pitch: 0.6,
        roll: 1.25,
        yaw: 0.3,
        acceleration: 0.2
      },
      bak_angular_rate_value: {
        pitch: 0.58,
        roll: 1.20,
        yaw: 0.28,
        acceleration: 0.18
      },
      other_status_value: {
        cylinderTemperature: {
          temperature1: 85.5,
          temperature2: 86.2,
          temperature3: 84.8,
          temperature4: 85.1
        },
        atmospheric_temperature: 20.5,
        ignition_damping: 0.15
      }
    },
    flyWarningInfo: {
      fly_stop_state: 0,
      height_state: 0,
      speed_state: 0,
      atttiude_state: 0,
      engine_state: 0,
      elec_pressure_state: 0,
      self_check_state: 0,
      allow_open_umbrella_state: 0,
      cabin_door_opened_state: 0,
      mid_the_platform_state: 0,
      light_closed_state: 0
    },
    otherInfoExtra: {
      currentExecuteState: "正常巡航测试",
      satNavEnabled: true,
      securityBoundaryEnabled: true
    }
  };

  const message = UavFlyStatusInfo.create(data);
  const protobufBuffer = UavFlyStatusInfo.encode(message).finish();
  
  return createProtocolPacket(protobufBuffer, 0x01, 0x01);
}

async function main() {
  await loadProtobuf();
  
  console.log('🚁 发送完整无人机飞行状态数据测试');
  console.log(`📡 目标: ${MULTICAST_ADDRESS}:${MULTICAST_PORT}`);
  
  const packet = createCompleteFlyStatus();
  
  console.log(`📊 数据包信息:`);
  console.log(`   总长度: ${packet.length} 字节`);
  console.log(`   协议头: ${packet.subarray(0, 8).toString('hex').toUpperCase()}`);
  console.log(`   Protobuf数据长度: ${packet.length - 8} 字节`);
  console.log(`   包含字段: uavID, coord, attitudeInfo, cylinderTemperatureInfo, engineDisplay, flyStatus, flyWarningInfo, otherInfoExtra`);
  
  sender.send(packet, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
    if (err) {
      console.error('❌ 发送失败:', err);
    } else {
      console.log('✅ 发送成功!');
      console.log('💡 这个数据包包含了完整的 UavFlyStatusInfo 结构');
      console.log('   检查接收端是否能正确解析所有字段');
    }
    
    sender.close();
  });
}

main().catch(console.error);