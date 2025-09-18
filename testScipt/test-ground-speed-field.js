#!/usr/bin/env node

/**
 * 简单测试ground_speed字段的设置和读取
 * 确保使用UaviationSimulation.UavAttitudeDisplay而不是UavFlyStatus.UavAttitudeDisplay
 */

const protobuf = require('protobufjs');
const path = require('path');

async function testGroundSpeedField() {
  try {
    // 只加载UaviationSimulationStruct.proto相关文件，避免命名冲突
    const root = await protobuf.load([
      path.join(__dirname, '../src/protobuf/PublicStruct.proto'),
      path.join(__dirname, '../src/protobuf/UaviationSimulationStruct.proto')
    ]);
    
    // 确保使用正确的命名空间
    const UavAttitudeDisplay = root.lookupType('UaviationSimulation.UavAttitudeDisplay');
    
    console.log('📋 UavAttitudeDisplay字段定义:');
    const fields = UavAttitudeDisplay.fields;
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      console.log(`   ${field.id}: ${fieldName} (${field.type})`);
    });
    
    console.log('🧪 测试ground_speed字段设置和读取\n');
    
    // 创建姿态数据 - 使用camelCase字段名
    const attitudeData = {
      roll: 1.5,
      pitch: -0.8,
      yaw: 120.0,
      speed: 85.5,
      indicatedAirspeed: 81.225,  // camelCase
      groundSpeed: 85.5,          // camelCase - 关键字段
      height: 1200,
      highPressure: 1176,         // camelCase
      highSatellite: 1224         // camelCase
    };
    
    console.log('📊 原始数据:');
    console.log('   groundSpeed:', attitudeData.groundSpeed);
    console.log('   indicatedAirspeed:', attitudeData.indicatedAirspeed);
    console.log('   speed:', attitudeData.speed);
    
    // 创建消息
    const message = UavAttitudeDisplay.create(attitudeData);
    console.log('\n📦 创建的消息:');
    console.log('   groundSpeed:', message.groundSpeed);
    console.log('   indicatedAirspeed:', message.indicatedAirspeed);
    console.log('   speed:', message.speed);
    
    // 编码
    const buffer = UavAttitudeDisplay.encode(message).finish();
    console.log('\n🔄 编码后大小:', buffer.length, '字节');
    
    // 解码
    const decoded = UavAttitudeDisplay.decode(buffer);
    console.log('\n📥 解码结果:');
    console.log('   groundSpeed:', decoded.groundSpeed);
    console.log('   indicatedAirspeed:', decoded.indicatedAirspeed);
    console.log('   speed:', decoded.speed);
    console.log('   roll:', decoded.roll);
    console.log('   pitch:', decoded.pitch);
    console.log('   yaw:', decoded.yaw);
    
    // 验证
    if (decoded.groundSpeed === attitudeData.groundSpeed) {
      console.log('\n✅ groundSpeed字段设置和读取正确!');
    } else {
      console.log('\n❌ groundSpeed字段有问题!');
      console.log(`   期望: ${attitudeData.groundSpeed}, 实际: ${decoded.groundSpeed}`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testGroundSpeedField();