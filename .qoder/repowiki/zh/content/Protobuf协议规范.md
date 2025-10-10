# Protobuf协议规范

<cite>
**本文档中引用的文件**   
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto) - *最近提交中更新*
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto) - *最近提交中更新*
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto) - *最近提交中更新*
- [UavFlyStatusStruct.proto](file://src/protobuf/UavFlyStatusStruct.proto)
- [UavFlyMonitorStruct.proto](file://src/protobuf/UavFlyMonitorStruct.proto)
- [UavNavMonitorStruct.proto](file://src/protobuf/UavNavMonitorStruct.proto)
- [UaviationSimulationStruct.proto](file://src/protobuf/UaviationSimulationStruct.proto)
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts) - *更新以支持新协议*
- [debug-protobuf.js](file://debug-protobuf.js)
- [test-protobuf-multicast.js](file://test-protobuf-multicast.js)
- [test-new-protocol.js](file://test-new-protocol.js)
- [test-platform-cmd.js](file://src/testScipt/test-platform-cmd.js) - *新增测试文件*
- [test-platform-status.js](file://src/testScipt/test-platform-status.js) - *新增测试文件*
- [PLATFORM_CMD_README.md](file://PLATFORM_CMD_README.md) - *新增使用说明*
- [PLATFORM_STATUS_README.md](file://PLATFORM_STATUS_README.md) - *新增使用说明*
</cite>

## 更新摘要
**变更内容**   
- 更新了PlatformCmd.proto和PublicStruct.proto协议文件的详细分析
- 修正了PackageType枚举中PlatformCmd和PlatformStatus的命名一致性
- 更新了PlatformCmd消息结构的字段编号
- 更新了protobuf-parser.service.ts中包类型映射的初始化
- 修正了示例数据包和解析输出格式中的枚举值
- 更新了故障排除指南以反映最新的命名约定

## 目录
1. [引言](#引言)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概述](#架构概述)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 引言
本文档全面记录了afs-opEnd项目所支持的所有Protobuf协议定义。通过逐个解析每个.proto文件，详细说明其消息类型、字段编号、数据类型和嵌套结构。文档解释了PublicStruct.proto作为公共结构体被其他协议引用的机制，描述了protobuf-parser.service.ts如何加载这些.proto文件并编译成JavaScript对象，以及如何将接收到的二进制数据反序列化为可读的JSON对象。提供了每个消息类型的示例数据包和解析后的输出格式，并说明了协议版本管理策略和向后兼容性处理方法。

## 项目结构
项目采用分层架构设计，主要分为三个目录：scripts、src和测试文件。src目录包含main（主进程）、protobuf（协议定义）和renderer（渲染进程）三个子目录。protobuf目录存放所有.proto协议文件，是本项目的核心数据交换规范。

```
graph TB
subgraph "根目录"
scripts[scripts]
src[src]
test[测试文件]
end
subgraph "src"
main[main]
protobuf[protobuf]
renderer[renderer]
end
subgraph "main"
database[database]
services[services]
end
subgraph "services"
multicast[MulticastService]
protobufParser[ProtobufParserService]
end
subgraph "protobuf"
PublicStruct[PublicStruct.proto]
PlatformCmd[PlatformCmd.proto]
PlatformStatus[PlatformStatus.proto]
UavFlyStatus[UavFlyStatusStruct.proto]
UavFlyMonitor[UavFlyMonitorStruct.proto]
UavNavMonitor[UavNavMonitorStruct.proto]
UaviationSimulation[UaviationSimulationStruct.proto]
end
protobufParser --> PublicStruct
protobufParser --> PlatformStatus
protobufParser --> PlatformCmd
protobufParser --> UavFlyStatus
protobufParser --> UavFlyMonitor
protobufParser --> UavNavMonitor
protobufParser --> UaviationSimulation
```

**图示来源**
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto)
- [UavFlyStatusStruct.proto](file://src/protobuf/UavFlyStatusStruct.proto)
- [UavFlyMonitorStruct.proto](file://src/protobuf/UavFlyMonitorStruct.proto)
- [UavNavMonitorStruct.proto](file://src/protobuf/UavNavMonitorStruct.proto)
- [UaviationSimulationStruct.proto](file://src/protobuf/UaviationSimulationStruct.proto)

**本节来源**
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto)
- [UavFlyStatusStruct.proto](file://src/protobuf/UavFlyStatusStruct.proto)
- [UavFlyMonitorStruct.proto](file://src/protobuf/UavFlyMonitorStruct.proto)
- [UavNavMonitorStruct.proto](file://src/protobuf/UavNavMonitorStruct.proto)
- [UaviationSimulationStruct.proto](file://src/protobuf/UaviationSimulationStruct.proto)

## 核心组件
核心组件包括Protobuf协议定义文件和Protobuf解析服务。协议定义文件使用.proto格式描述数据结构，而Protobuf解析服务负责加载这些定义并处理二进制数据的序列化与反序列化。新增的PlatformCmd和PlatformStatus协议扩展了系统的控制和状态报告能力。

**本节来源**
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto)

## 架构概述
系统采用模块化架构，通过Protobuf实现高效的数据序列化。主进程中的Protobuf解析服务加载所有.proto定义文件，构建类型系统，然后根据接收到的数据包类型字段动态选择相应的解析器进行反序列化。新增了对平台控制命令(PackType_PlatformCommand)和平台状态(PackType_PlatformStatus)的支持。

```
sequenceDiagram
participant 接收端 as 数据接收端
participant 解析器 as ProtobufParserService
participant 类型系统 as Protobuf类型系统
接收端->>解析器 : 发送二进制数据包
解析器->>解析器 : 验证包头(0xAA,0x55)
解析器->>解析器 : 提取协议ID和包类型
解析器->>解析器 : 读取数据长度
解析器->>解析器 : 提取Protobuf数据
解析器->>类型系统 : 根据包类型查找消息类型
类型系统-->>解析器 : 返回消息类型
解析器->>解析器 : 解码Protobuf数据
解析器-->>接收端 : 返回解析后的JSON对象
```

**图示来源**
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts#L116-L172)

## 详细组件分析

### Protobuf协议定义分析

#### PublicStruct.proto - 公共结构体
该文件定义了所有协议共享的枚举类型和基础结构体，作为其他协议文件的依赖基础。

**PackageType枚举**
```protobuf
enum PackageType {
    PackType_Invalid                  = 0;          //无效信息
    PackType_Flystatus                = 0x01;       //飞行状态信息
    PackType_HeartbeatInternal        = 0x02;       //内部心跳
    PackType_SceneDataInit            = 0x03;       //场景数据初始化
    PackType_FlyControl               = 0x10;       //飞行控制
    PackType_AttitudeControl          = 0x11;       //姿态控制
    PackType_EngineControl            = 0x12;       //发动机控制
    PackType_DataChainControl         = 0x13;       //链路控制
    PackType_FlyControlReply          = 0x14;       //飞行控制回复
    PackType_RouteUpload              = 0x20;       //航线上传
    PackType_SecurityBoundaryControl  = 0x21;       //安全边界控制
    PackType_FixedPointNavigation     = 0x22;       //定点导航
    PackType_RangePointSelect         = 0x23;       //靶场点选择
    PackType_NavReply                 = 0x24;       //导航信息回复
    PackType_RouteUploadReply         = 0x25;       //航线上传回复
    PackType_NavModeRequest           = 0x26;       //导航模式
    PackType_PositioningModeRequest   = 0x27;       //定位模式
    PackType_RecoveryrouteCmd         = 0x28;       //回收航线命令
    PackageType_PlatformStatus		  = 0x29;		//平台状态回传
    PackageType_PlatformCommand		  = 0x2A;		//平台控制命令
    PackageType_PlatformDeleteCommand = 0x2B;		//平台删除命令
    PackageType_PlatformHeartbeat	 = 0x2C;		//平台心跳
}
```

**ReplyState枚举**
```protobuf
enum ReplyState {
    ReplyState_Normal  = 0;   //正常
    ReplyState_Warning = 1;   //警告
    ReplyState_Error   = 2;   //错误     
}
```

**GeoCoordinate消息**
```protobuf
message GeoCoordinate {
    optional double longitude = 1;    
    optional double latitude  = 2;
    optional double altitude  = 3;
}
```

**HeartbeatInternal消息**
```protobuf
message HeartbeatInternal {
    required int32 softwareID  = 1;             //软件ID
    required int32 state       = 2;             //当前状态
    optional int32 reserve     = 3;             //预留
}
```

**本节来源**
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto#L5-L56)

#### PlatformCmd.proto - 平台命令协议
定义了平台控制命令的枚举和消息结构。

**PlatformCommand枚举**
```protobuf
enum PlatformCommand {
    Command_inValid = 0;// 错误命令
    Uav_Sensor_On = 1;// 传感器开
    Uav_Sensor_Off = 2;// 传感器关
    Uav_Sensor_Turn = 3;// 传感器转向
    Uav_LazerPod_Lasing = 4;// 激光吊舱照射
    Uav_LazerPod_Cease = 5;// 激光吊舱停止照射
    Uav_Nav = 6;// 无人机航线规划
    Arty_Target_Set = 7;  // 目标装订
    Arty_Fire = 8;        // 火炮发射
    Uav_Set_Speed = 9; //设定无人机速度
    Uav_Lock_Target = 10;  //锁定目标
    Uav_Strike_Coordinate = 11; //打击协同
    Arty_Fire_Coordinate = 12; // 发射协同
}
```

**PlatformCmd消息**
```protobuf
// 平台控制命令
message PlatformCmd {
  optional int32 commandID = 1;
  optional string platformName = 2;//无人机ID
  optional PlatformCommand command = 3;// 命令
  optional FireParam fireParam = 4;// 开火附加参数
  optional SensorParam sensorParam = 5; // 转向附加参数
  optional NavParam navParam = 6; // 导航附加参数
  optional TargetSetParam targetSetParam = 7; // 目标装订附加参数
  optional SetSpeedparam setSpeedParam =8; //速度设定参数
  optional LockParam lockParam =9; //锁定目标参数
  optional StrikeCoordinateParam strikeCoordinateParam =10; //打击协同参数
  optional FireCoordinateParam fireCoordinateParam =11; //发射协同参数
};
```

**FireParam消息**
```protobuf
//武器发射参数
message FireParam {
  optional string weaponName = 1;//武器类型实例化的名称
  optional string targetName = 2;//目标平台名称
  optional int32 quantity = 3;//发射次数默认为1
}
```

**SensorParam消息**
```protobuf
//传感器控制参数
message SensorParam {
  optional string sensorName = 1;//传感器名称
  optional double azSlew = 2;  //方位角
  optional double elSlew = 3;  //俯仰角
}
```

**NavParam消息**
```protobuf
//航线规划参数
message NavParam {
  repeated  PublicStruct.WayPoint route = 1;
}
```

**TargetSetParam消息**
```protobuf
//目标装订参数
message TargetSetParam {
  optional string targetName = 1; 
}
```

**SetSpeedparam消息**
```protobuf
//速度设定参数
message SetSpeedparam {
  optional  double speed = 1;
}
```

**LockParam消息**
```protobuf
message LockParam {
  optional string targetName = 1;
  optional string sensorName = 2;
}
```

**StrikeCoordinateParam消息**
```protobuf
message StrikeCoordinateParam {
  optional string artyName = 1;
  optional string targetName = 2;
  optional PublicStruct.GeoCoordinate coordinate = 3;
}
```

**FireCoordinateParam消息**
```protobuf
message FireCoordinateParam {
  optional string uavName = 1;
  optional string targetName = 2;
  optional string weaponName = 3;
  optional PublicStruct.GeoCoordinate coordinate = 4;
}
```

**示例数据包**
```json
{
  "commandID": 1730555200000,
  "platformName": "artillery1",
  "command": 8,
  "fireParam": {
    "weaponName": "155毫米榴弹炮",
    "targetName": "无人机-001",
    "quantity": 1
  }
}
```

**解析后的输出格式**
```json
{
  "timestamp": 1730555200000,
  "source": "multicast",
  "packageType": 42,
  "packageTypeName": "PackageType_PlatformCommand",
  "parsedData": {
    "commandID": 1730555200000,
    "platformName": "artillery1",
    "command": 8,
    "fireParam": {
      "weaponName": "155毫米榴弹炮",
      "targetName": "无人机-001",
      "quantity": 1
    }
  },
  "rawData": "AA55012A0000003C08D085E4B4051209617274696C6C657279311A08417274696C6C6572720A0A1208313535E6B091E7B1B3E688907F1A0B5541562D3030312001",
  "size": 68,
  "protocolID": 1
}
```

**本节来源**
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto#L1-L38)
- [test-platform-cmd.js](file://src/testScipt/test-platform-cmd.js)
- [PLATFORM_CMD_README.md](file://PLATFORM_CMD_README.md)

#### PlatformStatus.proto - 平台状态协议
定义了平台基础数据和状态信息的完整结构。

**主要消息类型**

**Location消息**
```protobuf
message Location 
{
  optional double longitude = 1;
  optional double latitude = 2;
  optional double altitude = 3;
}
```

**PlatformBase消息**
```protobuf
///平台基础数据
message PlatformBase
{
	optional	string name = 1;
	optional	string type = 2;
	optional	string side = 3;
	optional	string group = 4;
	optional	bool broken  = 5;	
	optional	PublicStruct.GeoCoordinate location = 6;
	optional double roll                 = 7;    //横滚
	optional double pitch                = 8;    //俯仰
	optional double yaw                  = 9;    //偏航
	optional double speed                = 10;    //速度
}
```

**WayPoint消息**
```protobuf
//航迹点
message WayPoint
{
	optional double longitude = 1;
	optional double latitude = 2;
	optional double altitude = 3;
	optional string labelName = 4;
	optional double speed = 5;
}
```

**Mover消息**
```protobuf
//推进器
message Mover
{
	optional string type = 1;
	repeated PublicStruct.WayPoint route = 2;
}
```

**SlewMode枚举**
```protobuf
enum SlewMode
{
	cSLEW_FIXED = 0;
	cSLEW_AZ = 1;
	cSLEW_EL = 2; 
	cSLEW_AZ_EL = 3  ;
}
```

**PartParam消息**
```protobuf
message PartParam
{
	optional string name = 1;
	optional string type = 2;
	optional SlewMode slewMode = 3;
	optional double minAzSlew = 4;  //方位角
	optional double maxAzSlew = 5;
	optional double minElSlew = 6;	//俯仰角
	optional double maxElSlew = 7;
	optional double currentAz = 8;  //当前方位角
	optional double currentEl = 9;  //当前俯仰角
	optional bool isTurnedOn = 10;  //开关标识
}
```

**Comm消息**
```protobuf
//通信
message Comm
{
	optional PartParam base = 1;
	optional string network = 2;
}
```

**Sensor消息**
```protobuf
//传感器
message Sensor
{
	optional PartParam base = 1;
	optional string mode = 2;
	optional int32 laser_code = 3;
}
```

**Weapon消息**
```protobuf
//武器
message Weapon
{
	optional PartParam base = 1;
	optional int32 quantity = 2;	
}
```

**Track消息**
```protobuf
message Track 
{
	optional string sensorName = 1;
	optional string targetName = 2;
	optional string targetType = 3;
}
```

**TargetLoad消息**
```protobuf
message TargetLoad
{
	optional string targetName = 1;       		//
   	optional double distance = 2;				//距离
	optional double bearing = 3;				//方位
	optional double elevationDifference = 4;	//高差	
	optional double azimuth = 5;				//方位角
	optional double pitch = 6;					//高低角
}
```

**Platform消息**
```protobuf
//上报的每个平台所有数据
message Platform
{
	optional PlatformBase base = 1;	
	optional double updateTime = 2;  // 修正拼写错误
	optional Mover mover = 3;
	repeated Comm comms = 4;
	repeated Sensor sensors = 5;
	repeated Weapon weapons = 6;
	repeated Track tracks = 7;
	optional TargetLoad targetLoad = 8;
}
```

**Environment消息**
```protobuf
//环境参数
message Environment
{
	optional double windSpeed = 1;
	optional double windDirection  = 2;
 	optional double cloudLowerAlt = 3;
 	optional double cloudUpperAlt = 4;
	optional double rainUpperAlt = 5;
	optional double rainRate = 6;
	optional double temperature = 7;
}
```

**Platforms消息**
```protobuf
//所有平台
message Platforms
{
	repeated Platform platform =1;
	optional Environment evironment = 2;
}	
```

**PlatformDeleteParam消息**
```protobuf
message PlatformDeleteParam
{
	optional string name = 1;
	optional double updateTime = 2; 
}
```

**示例数据包**
```json
{
  "platform": [
    {
      "base": {
        "name": "战斗机-001",
        "type": "Fighter",
        "side": "友军",
        "group": "第一编队",
        "broken": false,
        "location": {
          "longitude": 116.3974,
          "latitude": 39.9093,
          "altitude": 1000
        },
        "roll": 0.5,
        "pitch": 1.2,
        "yaw": 45.0,
        "speed": 250.0
      },
      "updateTime": 1730555200,
      "mover": {
        "type": "Jet Engine",
        "route": [
          {
            "longitude": 116.3974,
            "latitude": 39.9093,
            "altitude": 1000,
            "labelName": "起始点",
            "speed": 50
          }
        ]
      },
      "comms": [
        {
          "base": {
            "name": "主通信",
            "type": "UHF Radio",
            "slewMode": 0,
            "minAzSlew": 0,
            "maxAzSlew": 360,
            "minElSlew": -90,
            "maxElSlew": 90,
            "currentAz": 0,
            "currentEl": 0,
            "isTurnedOn": true
          },
          "network": "UHF"
        }
      ],
      "sensors": [
        {
          "base": {
            "name": "主雷达",
            "type": "Search Radar",
            "slewMode": 3,
            "minAzSlew": 0,
            "maxAzSlew": 360,
            "minElSlew": -90,
            "maxElSlew": 90,
            "currentAz": 45,
            "currentEl": 30,
            "isTurnedOn": true
          },
          "mode": "Search",
          "laser_code": 1234
        }
      ],
      "weapons": [
        {
          "base": {
            "name": "空空导弹",
            "type": "AAM",
            "slewMode": 1,
            "minAzSlew": 0,
            "maxAzSlew": 180,
            "minElSlew": -10,
            "maxElSlew": 80,
            "currentAz": 0,
            "currentEl": 0,
            "isTurnedOn": false
          },
          "quantity": 4
        }
      ],
      "tracks": [
        {
          "sensorName": "主雷达",
          "targetName": "敌机001",
          "targetType": "Fighter"
        }
      ],
      "targetLoad": {
        "targetName": "目标-001",
        "distance": 15000,
        "bearing": 45,
        "elevationDifference": 1000,
        "azimuth": 45,
        "pitch": 5
      }
    }
  ],
  "evironment": {
    "windSpeed": 5.0,
    "windDirection": 180,
    "cloudLowerAlt": 2000,
    "cloudUpperAlt": 4000,
    "rainUpperAlt": 3000,
    "rainRate": 2.5,
    "temperature": 25.0
  }
}
```

**解析后的输出格式**
```json
{
  "timestamp": 1730555200000,
  "source": "multicast",
  "packageType": 41,
  "packageTypeName": "PackageType_PlatformStatus",
  "parsedData": {
    "platform": [
      {
        "base": {
          "name": "战斗机-001",
          "type": "Fighter",
          "side": "友军",
          "group": "第一编队",
          "broken": false,
          "location": {
            "longitude": 116.3974,
            "latitude": 39.9093,
            "altitude": 1000
          },
          "roll": 0.5,
          "pitch": 1.2,
          "yaw": 45.0,
          "speed": 250.0
        },
        "updateTime": 1730555200,
        "mover": {
          "type": "Jet Engine",
          "route": [
            {
              "longitude": 116.3974,
              "latitude": 39.9093,
              "altitude": 1000,
              "labelName": "起始点",
              "speed": 50
            }
          ]
        },
        "comms": [
          {
            "base": {
              "name": "主通信",
              "type": "UHF Radio",
              "slewMode": "cSLEW_FIXED",
              "minAzSlew": 0,
              "maxAzSlew": 360,
              "minElSlew": -90,
              "maxElSlew": 90,
              "currentAz": 0,
              "currentEl": 0,
              "isTurnedOn": true
            },
            "network": "UHF"
          }
        ],
        "sensors": [
          {
            "base": {
              "name": "主雷达",
              "type": "Search Radar",
              "slewMode": "cSLEW_AZ_EL",
              "minAzSlew": 0,
              "maxAzSlew": 360,
              "minElSlew": -90,
              "maxElSlew": 90,
              "currentAz": 45,
              "currentEl": 30,
              "isTurnedOn": true
            },
            "mode": "Search",
            "laser_code": 1234
          }
        ],
        "weapons": [
          {
            "base": {
              "name": "空空导弹",
              "type": "AAM",
              "slewMode": "cSLEW_AZ",
              "minAzSlew": 0,
              "maxAzSlew": 180,
              "minElSlew": -10,
              "maxElSlew": 80,
              "currentAz": 0,
              "currentEl": 0,
              "isTurnedOn": false
            },
            "quantity": 4
          }
        ],
        "tracks": [
          {
            "sensorName": "主雷达",
            "targetName": "敌机001",
            "targetType": "Fighter"
          }
        ],
        "targetLoad": {
          "targetName": "目标-001",
          "distance": 15000,
          "bearing": 45,
          "elevationDifference": 1000,
          "azimuth": 45,
          "pitch": 5
        }
      }
    ],
    "evironment": {
      "windSpeed": 5.0,
      "windDirection": 180,
      "cloudLowerAlt": 2000,
      "cloudUpperAlt": 4000,
      "rainUpperAlt": 3000,
      "rainRate": 2.5,
      "temperature": 25.0
    }
  },
  "rawData": "AA550129000000B80A98010A88010A0C0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D120A0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D180020002A0C0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D180020002A0C0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D180020002A0C0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D180020002A0C0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D180020002A0C0A0B466967687465722D3030311207466967687465721A08E58F8BE5869B220C7B7D7B7D7B7D7B7D7B7D7B7D180020002A0C0A0B......",
  "size": 188,
  "protocolID": 1
}
```

**本节来源**
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto#L1-L102)
- [test-platform-status.js](file://src/testScipt/test-platform-status.js)
- [PLATFORM_STATUS_README.md](file://PLATFORM_STATUS_README.md)

#### UavFlyStatusStruct.proto - 无人机飞行状态结构
定义了无人机飞行状态信息的完整数据结构。

**UavFlyStatusInfo消息**
```protobuf
message UavFlyStatusInfo {
    required int32 uavID = 1;                                    //无人机ID
    optional PublicStruct.GeoCoordinate coord = 2;               //位置
    optional UavAttitudeDisplay attitudeInfo = 3;                //姿态信息
    optional UavTemperature cylinderTemperatureInfo = 4;         //缸温
    optional UavEngineDisplay engineDisplay = 5;                 //发动机信息
    optional DataChainDisplay dataChainInfo = 6;                 //链路信息
    optional UavFlyStatus flyStatus = 7;                         //飞行参数
    optional FlyWarningInfo flyWarningInfo = 8;                  //预警信息
    optional OtherInfoExtra otherInfoExtra = 9;                  //其他信息
}
```

**嵌套消息结构**
- UavAttitudeDisplay: 包含地速、航向角、俯仰角、横滚角等姿态信息
- UavTemperature: 包含缸温、油温和排气温度
- UavEngineDisplay: 包含油门、转速、燃油消耗和油压
- DataChainDisplay: 包含信号强度、丢包率、延迟和连接状态
- UavFlyStatus: 包含飞行模式、电池电量、剩余燃油、飞行时间和距离目标距离
- FlyWarningInfo: 包含低电量、低燃油、信号丢失、发动机故障和GPS丢失等警告
- OtherInfoExtra: 包含安全边界启用状态、当前执行状态、卫星导航启用状态、任务进度和当前航点

**本节来源**
- [UavFlyStatusStruct.proto](file://src/protobuf/UavFlyStatusStruct.proto#L1-L76)

#### UavFlyMonitorStruct.proto - 无人机飞行监控结构
定义了飞行控制命令和回复的协议。

**CommandType枚举**
```protobuf
enum CommandType {
    Cmd_self_check            = 0;         //自检
    Cmd_start_fly             = 1;         //起飞
    Cmd_start_engine          = 2;         //启动
    Cmd_recycled              = 3;         //回收
    Cmd_programming_control   = 4;         //程控
    Cmd_manual_control        = 5;         //手控
    Cmd_climb                 = 6;         //爬升
    Cmd_flat                  = 7;         //平飞
    Cmd_hovering_left         = 8;         //左盘旋
    Cmd_direct                = 9;         //直飞
    Cmd_hovering_right        = 10;        //右盘旋
    Cmd_light_open            = 11;        //开灯
    Cmd_light_off             = 12;        //关灯
    Cmd_main_backups          = 13;        //主备切换
    Cmd_stop                  = 14;        //停止
    Cmd_umbrella_open         = 15;        //开伞
    Cmd_umbrella_throw        = 16;        //抛伞
    Cmd_sensor_open           = 17;        //载荷开
    Cmd_sensor_close          = 18;        //载荷关
    Cmd_cabin_door_open       = 19;        //舱门开
    Cmd_cabin_door_close      = 20;        //舱门关
    Cmd_sensor_take_back      = 21;        //载荷收
    Cmd_sensor_put            = 22;        //载荷放
}
```

**控制命令消息**
- UavFlyControlRequest: 飞行控制请求，包含无人机ID和控制命令类型
- UavAttitudeControl: 姿态控制，包含无人机ID、航向和高度
- UavEngineControl: 发动机控制，包含无人机ID、油门、气道和转速

**控制回复消息**
- UavFlyControlReply: 飞行控制回复，包含无人机ID、命令类型和执行结果

**本节来源**
- [UavFlyMonitorStruct.proto](file://src/protobuf/UavFlyMonitorStruct.proto#L1-L72)

#### UavNavMonitorStruct.proto - 无人机导航监控结构
定义了导航相关命令和信息的协议。

**RouteType枚举**
```protobuf
enum RouteType {
    RouteType_Cruise           = 0;   //巡航航线
    RouteType_Recovery         = 1;   //回收航线
    RouteType_SecurityBoundary = 2;   //安全边界
    RouteType_PinPointNav      = 3;   //定点导航
    RouteType_RangePoint       = 4;   //靶场点
}
```

**导航命令消息**
- UavRouteUpload: 航线上传，包含无人机ID、航线类型、航点数量和航点列表
- UavSecurityBoundaryControl: 安全边界控制，包含无人机ID和启用/禁止状态
- UavFixedPointNavigation: 定点导航，包含无人机ID、类型和位置参数
- UavRangePointSelect: 靶场点选择，包含无人机ID和选择参数
- UavNavModeRequest: 导航模式请求
- UavPositioningModeRequest: 定位模式请求
- UavRecoveryrouteCmd: 回收航线命令

**导航信息消息**
- UavNavReplyInfo: 导航信息回复
- UavRouteUploadReply: 航线上传回复

**本节来源**
- [UavNavMonitorStruct.proto](file://src/protobuf/UavNavMonitorStruct.proto#L1-L158)

#### UaviationSimulationStruct.proto - 无人机仿真结构
定义了仿真环境下的飞行状态和初始化数据。

**WeatherType和ElectromagnetismType枚举**
```protobuf
enum WeatherType {
    Weather_Sunny = 0;    //晴天
    Waether_Rain  = 1;    //雨天
    Weather_Snow  = 2;    //雪天
    Weather_Foggy = 3;    //雾
}

enum ElectromagnetismType {
    Electromagnetism_Low = 0;
    Electromagnetism_Mid = 1;
    Electromagnetism_High = 2;
}
```

**仿真飞行状态消息**
- UavFlyStatusInfo: 仿真环境下的飞行状态信息
- SceneInitData: 场景初始化数据，包含场景ID、时间、天气、电磁环境、战斗位置、无人机数据和侦察区域等

**本节来源**
- [UaviationSimulationStruct.proto](file://src/protobuf/UaviationSimulationStruct.proto#L1-L211)

### Protobuf解析服务分析

#### protobuf-parser.service.ts - Protobuf解析服务
该服务负责加载.proto文件并提供数据包解析功能。

**服务初始化**
```typescript
export class ProtobufParserService {
    private root: protobuf.Root | null = null;
    private packageTypes: Map<number, string> = new Map();

    constructor() {
        this.initializePackageTypes();
    }
}
```

**包类型初始化**
```typescript
private initializePackageTypes() {
    this.packageTypes.set(0x00, 'PackType_Invalid');
    this.packageTypes.set(0x01, 'PackType_Flystatus');
    this.packageTypes.set(0x02, 'PackType_HeartbeatInternal');
    // ... 其他包类型
    this.packageTypes.set(0x29, 'PackageType_PlatformStatus'); // 新增平台状态信息
    this.packageTypes.set(0x2A, 'PackageType_PlatformCommand'); // 新增平台控制命令
    this.packageTypes.set(0x2B, 'PackageType_PlatformDeleteCommand'); // 新增平台删除命令
    this.packageTypes.set(0x2C, 'PackageType_PlatformHeartbeat'); // 新增平台心跳
}
```

**加载协议定义**
```typescript
public async loadProtobufDefinitions(): Promise<void> {
    const pathList = [
        join(app.getAppPath(), 'main', 'src', 'protobuf'), // 生产环境打包后
        join(app.getAppPath(), 'src', 'protobuf'),        // 开发环境
        join(process.cwd(), 'src', 'protobuf'),           // 当前工作目录
        join(__dirname, '..', '..', 'protobuf'),          // 相对于当前文件
    ];

    // 尝试在多个路径中查找protobuf目录
    for (const p of pathList) {
        if (fs.existsSync(p)) {
            protobufPath = p;
            found = true;
            break;
        }
    }

    // 自动扫描protobuf目录中的所有.proto文件
    const files = fs.readdirSync(protobufPath).filter(file => file.endsWith('.proto'));
    
    // 按依赖关系排序加载，先加载基础的PublicStruct.proto
    const sortedFiles: string[] = [];
    
    // 优先加载公共结构，因为其他文件都依赖它
    if (files.includes('PublicStruct.proto')) {
        sortedFiles.push('PublicStruct.proto');
    }
    
    // 然后加载其他文件
    files.forEach((file: string) => {
        if (file !== 'PublicStruct.proto') {
            sortedFiles.push(file);
        }
    });

    const availableFiles: string[] = [];
    for (const file of sortedFiles) {
        const filePath = join(protobufPath, file);
        if (fs.existsSync(filePath)) {
            availableFiles.push(filePath);
        }
    }

    this.root = await protobuf.load(availableFiles);
}
```

**数据包解析流程**
```typescript
public parsePacket(data: Buffer, source: string, timestamp: number): ParsedPacket | null {
    // 1. 验证包头 (0xAA, 0x55)
    if (data[0] !== 0xAA || data[1] !== 0x55) {
        return null;
    }

    // 2. 提取协议ID、包类型和数据长度
    const protocolID = data[2];
    const packageType = data[3];
    const size = data.readUInt32LE(4);

    // 3. 提取Protobuf数据
    const messageData = data.subarray(8, 8 + actualSize);

    // 4. 根据包类型选择解析器
    switch (packageType) {
        case 0x01:
            parsedData = this.parseFlyStatus(messageData);
            break;
        case 0x02:
            parsedData = this.parseHeartbeatInternal(messageData);
            break;
        case 0x29:
            parsedData = this.parsePlatformStatus(messageData);
            break;
        case 0x2A:
            parsedData = this.parsePlatformCmd(messageData);
            break;
        case 0x2B:
            parsedData = this.parsePlatformDeleteCmd(messageData);
            break;
        case 0x2C:
            parsedData = this.parsePlatformHeartbeat(messageData);
            break;
        // ... 其他包类型
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
}
```

**解析器方法示例**
```typescript
private parsePlatformStatus(data: Buffer): any {
    try {
      console.log('[Parser] 尝试解析平台状态数据...');

      if (!this.root) {
        throw new Error('Protobuf root 未初始化');
      }

      // 尝试查找消息类型 - 根据PlatformStatus.proto，主要消息类型是Platforms
      let PlatformsType: protobuf.Type;
      try {
        PlatformsType = this.root.lookupType('PlatformStatus.Platforms');
        console.log('[Parser] ✅ 找到 PlatformStatus.Platforms 类型');
      } catch (lookupError: unknown) {
        console.log('[Parser] 尝试其他可能的类型名...');
        // 尝试不同的命名空间和类型名
        try {
          PlatformsType = this.root.lookupType('Platforms');
          console.log('[Parser] ✅ 找到 Platforms 类型');
        } catch (e) {
          try {
            PlatformsType = this.root.lookupType('PlatformStatus.Platform');
            console.log('[Parser] ✅ 找到 PlatformStatus.Platform 类型（单个平台）');
          } catch (e2) {
            console.log('[Parser] 可用的类型:', Object.keys(this.root.nested || {}));
            if (this.root.nested && this.root.nested['PlatformStatus']) {
              const platformNested = this.root.nested['PlatformStatus'] as protobuf.Namespace;
              console.log('[Parser] PlatformStatus命名空间中的类型:', Object.keys(platformNested.nested || {}));
            }
            const errorMessage = lookupError instanceof Error ? lookupError.message : String(lookupError);
            throw new Error(`无法找到 PlatformStatus 相关类型: ${errorMessage}`);
          }
        }
      }

      console.log('[Parser] 🔍 开始解码平台状态数据，数据长度:', data.length);
      console.log('[Parser] 🔍 数据前32字节:', data.subarray(0, Math.min(32, data.length)).toString('hex'));
      
      const decoded = PlatformsType.decode(data);
      console.log('[Parser] ✅ 平台状态解码成功:', decoded);

      // 如果解码成功，尝试转换为普通对象以便更好地显示
      const decodedObject = PlatformsType.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true
      });
      
      console.log('[Parser] 📊 平台状态详细信息:', JSON.stringify(decodedObject, null, 2));

      return decodedObject;
    } catch (error) {
      console.error('[Parser] ❌ 解析平台状态失败:', error);
      return {
        error: '解析失败',
        errorMessage: error instanceof Error ? error.message : String(error),
        raw: data.toString('hex'),
        dataLength: data.length
      };
    }
}
```

**本节来源**
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts#L0-L457)

## 依赖分析
系统中的依赖关系清晰，Protobuf解析服务依赖于所有.proto协议文件，而各个协议文件之间通过import语句建立依赖关系。

```
graph TD
ProtobufParser[ProtobufParserService] --> PublicStruct
ProtobufParser --> PlatformStatus
ProtobufParser --> PlatformCmd
ProtobufParser --> UavFlyStatus
ProtobufParser --> UavFlyMonitor
ProtobufParser --> UavNavMonitor
ProtobufParser --> UaviationSimulation
PlatformCmd --> PublicStruct
UavFlyStatus --> PublicStruct
UavFlyMonitor --> PublicStruct
UavNavMonitor --> PublicStruct
UaviationSimulation --> PublicStruct
```

**图示来源**
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto)
- [UavFlyStatusStruct.proto](file://src/protobuf/UavFlyStatusStruct.proto)
- [UavFlyMonitorStruct.proto](file://src/protobuf/UavFlyMonitorStruct.proto)
- [UavNavMonitorStruct.proto](file://src/protobuf/UavNavMonitorStruct.proto)
- [UaviationSimulationStruct.proto](file://src/protobuf/UaviationSimulationStruct.proto)

**本节来源**
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [PublicStruct.proto](file://src/protobuf/PublicStruct.proto)

## 性能考虑
Protobuf协议提供了高效的序列化和反序列化性能，相比JSON等文本格式，具有以下优势：

1. **体积小**: 二进制编码比文本格式更紧凑，减少网络传输带宽
2. **速度快**: 解析速度比JSON快数倍，适合高频数据传输场景
3. **类型安全**: 编译时检查类型，减少运行时错误
4. **向后兼容**: 字段编号机制支持协议的演进和扩展

在实现中，通过缓存Protobuf类型查找结果和预编译解析器来进一步优化性能。新增的PlatformCmd和PlatformStatus协议遵循相同的性能优化原则。

## 故障排除指南

### 常见问题及解决方案

**问题1: 无法加载Protobuf定义文件**
- **症状**: 控制台显示"未找到protobuf定义目录"
- **原因**: protobuf目录路径配置错误或文件缺失
- **解决方案**: 检查以下路径是否存在：
  - build/main/src/protobuf
  - src/protobuf
  - 当前工作目录/src/protobuf
  - 相对于服务文件的../../protobuf
- **新增**: 现在支持多种环境路径，包括生产环境打包后的路径

**问题2: 数据包解析失败**
- **症状**: 控制台显示"数据包包头错误"
- **原因**: 数据包格式不符合0xAA 0x55开头的约定
- **解决方案**: 验证发送端的数据包格式是否正确

**问题3: 未知的包类型**
- **症状**: 控制台显示"未知的包类型"
- **原因**: packageTypes映射中缺少相应的包类型
- **解决方案**: 在initializePackageTypes方法中添加新的包类型映射，如0x29对应PackType_PlatformStatus，0x2A对应PackType_PlatformCommand

**问题4: Protobuf解码失败**
- **症状**: 控制台显示"解析失败"
- **原因**: 消息类型名称错误或.proto文件未正确加载
- **解决方案**: 检查lookupType中的命名空间和消息名称是否正确，对于PlatformStatus和PlatformCmd，需要检查PlatformStatus命名空间下的类型

**问题5: PlatformCmd或PlatformStatus解析失败**
- **症状**: 控制台显示"无法找到 PlatformStatus 相关类型"或"无法找到 PlatformCmd 相关类型"
- **原因**: 消息类型查找失败，可能是命名空间不匹配
- **解决方案**: 
  1. 确认.proto文件已正确加载
  2. 检查消息类型名称，支持多种查找方式：
     - PlatformStatus.Platforms
     - Platforms
     - PlatformStatus.Platform
     - PlatformStatus.PlatformCmd
     - PlatformCmd
  3. 查看可用类型列表进行调试

**本节来源**
- [protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [debug-protobuf.js](file://debug-protobuf.js)
- [test-platform-cmd.js](file://src/testScipt/test-platform-cmd.js)
- [test-platform-status.js](file://src/testScipt/test-platform-status.js)

## 结论
afs-opEnd项目的Protobuf协议体系设计合理，通过模块化的.proto文件组织和清晰的命名空间管理，实现了高效的数据交换。Protobuf解析服务提供了健壮的错误处理和灵活的扩展能力，支持系统的持续演进。新增的PlatformCmd和PlatformStatus协议扩展了系统的控制和状态报告功能。建议在后续开发中保持协议的向后兼容性，通过添加新字段而非修改现有字段的方式来扩展协议功能。