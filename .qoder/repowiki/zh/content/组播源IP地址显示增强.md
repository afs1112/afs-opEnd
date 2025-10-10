# 组播源IP地址显示增强

<cite>
**本文档引用的文件**  
- [MULTICAST_SOURCE_IP_ENHANCEMENT.md](file://MULTICAST_SOURCE_IP_ENHANCEMENT.md)
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue)
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts)
- [src/main/services/protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [src/protobuf/PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [src/protobuf/PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [src/protobuf/PublicStruct.proto](file://src/protobuf/PublicStruct.proto)
</cite>

## 目录
1. [功能概述](#功能概述)
2. [项目结构与核心文件](#项目结构与核心文件)
3. [核心功能实现分析](#核心功能实现分析)
4. [数据流与处理逻辑](#数据流与处理逻辑)
5. [组件与服务依赖关系](#组件与服务依赖关系)
6. [界面展示优化](#界面展示优化)
7. [技术细节与代码实现](#技术细节与代码实现)
8. [使用方式与调试建议](#使用方式与调试建议)
9. [兼容性与扩展性](#兼容性与扩展性)

## 功能概述
本文档详细记录了在组播数据包接收界面中增强源IP地址显示功能的技术实现。该功能旨在提升系统调试与网络监控的便利性，通过将原始的“来源”字段拆分为“源IP”和“端口”两个独立字段，使用户能够更清晰地识别数据包来源，便于故障排查和网络拓扑分析。

该功能主要涉及前端界面优化、IP解析函数实现、后端数据结构生成以及Protobuf解析流程的协同工作。整体实现保持向后兼容，并支持IPv4与IPv6地址格式。

## 项目结构与核心文件
项目采用Electron + Vue3 + TypeScript的前后端一体化架构，组播功能主要集中在`src/main/services`（后端服务）和`src/renderer/views/pages`（前端页面）目录下。

``mermaid
graph TB
subgraph "前端 (Renderer)"
MulticastPage["MulticastPage.vue<br>组播页面组件"]
end
subgraph "后端 (Main)"
MulticastService["multicast.service.ts<br>UDP组播接收"]
ProtobufParser["protobuf-parser.service.ts<br>Protobuf数据解析"]
end
subgraph "协议定义"
PlatformStatusProto["PlatformStatus.proto"]
PlatformCmdProto["PlatformCmd.proto"]
PublicStructProto["PublicStruct.proto"]
end
MulticastPage --> |调用| MulticastService
MulticastService --> |使用| ProtobufParser
ProtobufParser --> |依赖| PlatformStatusProto
ProtobufParser --> |依赖| PlatformCmdProto
ProtobufParser --> |依赖| PublicStructProto
```

**图示来源**  
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue)
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts)
- [src/main/services/protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [src/protobuf/PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [src/protobuf/PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)
- [src/protobuf/PublicStruct.proto](file://src/protobuf/PublicStruct.proto)

## 核心功能实现分析
本功能的核心目标是在组播数据包展示界面中清晰地分离并显示源IP地址和端口号。实现路径分为前端解析与后端数据生成两个层面。

### 前端解析逻辑
前端通过正则表达式从后端传来的`source`字段中提取IP和端口信息。

``mermaid
flowchart TD
A["接收到的source字段<br>格式: IP:端口"] --> B["调用extractSourceIP()"]
B --> C["正则匹配 /^(.+):(\\d+)$/"]
C --> D{"匹配成功?"}
D --> |是| E["返回捕获组1 (IP)"]
D --> |否| F["返回原始字符串"]
E --> G["在界面显示"]
```

**图示来源**  
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue#L150-L165)

### 后端数据生成
后端在接收到UDP数据包时，通过`dgram`模块的`rinfo`对象获取发送方的地址和端口，并将其组合为`IP:端口`格式的字符串。

``mermaid
sequenceDiagram
participant 网络 as 网络
participant Socket as dgram.Socket
participant Service as MulticastService
participant Vue as MulticastPage.vue
网络->>Socket : UDP数据包
Socket->>Service : message事件
Service->>Service : rinfo.address + ' : ' + rinfo.port
Service->>Service : 构造MulticastPacket
Service->>Vue : emit('packet', packet)
Vue->>Vue : 调用extractSourceIP/Port
Vue->>Vue : 界面展示分离的IP和端口
```

**图示来源**  
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts#L65-L75)
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue#L150-L165)

## 数据流与处理逻辑
完整的数据流从UDP数据包的接收到最终在前端界面展示，涉及多个组件的协同工作。

``mermaid
flowchart LR
A[UDP组播数据包] --> B[multicast.service.ts]
B --> C{包头校验<br>0xAA55}
C --> |有效| D[protobuf-parser.service.ts]
D --> E[解析Protobuf数据]
E --> F[生成ParsedPacket]
F --> G[构造MulticastPacket<br>包含source字段]
G --> H[MulticastPage.vue]
H --> I[调用extractSourceIP/Port]
I --> J[界面展示源IP和端口]
C --> |无效| K[标记为未解析]
K --> J
```

**图示来源**  
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts#L77-L120)
- [src/main/services/protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts#L150-L250)
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue#L150-L165)

## 组件与服务依赖关系
系统中的关键组件通过Electron的`window.electronAPI`进行通信，形成清晰的依赖链。

``mermaid
classDiagram
class MulticastPage {
+isListening : boolean
+packets : MulticastPacket[]
+startListening()
+stopListening()
+extractSourceIP(source)
+extractSourcePort(source)
}
class MulticastService {
+socket : dgram.Socket
+start()
+stop()
+onPacket()
+onError()
}
class ProtobufParserService {
+root : protobuf.Root
+parsePacket(data, source, timestamp)
+parsePlatformStatus()
+parsePlatformCmd()
}
MulticastPage -->|调用| window.electronAPI.multicast
window.electronAPI.multicast --> MulticastService
MulticastService -->|使用| ProtobufParserService
ProtobufParserService -->|解析| PlatformStatus
ProtobufParserService -->|解析| PlatformCmd
class PlatformStatus {
<<message>>
repeated Platform platform
}
class PlatformCmd {
<<message>>
required string platformName
required PlatformCommand command
}
```

**图示来源**  
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue)
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts)
- [src/main/services/protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts)
- [src/protobuf/PlatformStatus.proto](file://src/protobuf/PlatformStatus.proto)
- [src/protobuf/PlatformCmd.proto](file://src/protobuf/PlatformCmd.proto)

## 界面展示优化
前端界面在多个位置增强了源IP和端口的显示，提升了信息的可读性。

### 数据包头部区域
在每个数据包的头部，新增了“源IP”和“端口”两个独立字段，与“时间”、“大小”并列显示。

```html
<div class="flex gap-4 text-sm text-gray-600">
  <span>时间: {{ formatTime(packet.timestamp) }}</span>
  <span>源IP: {{ extractSourceIP(packet.source) }}</span>
  <span>端口: {{ extractSourcePort(packet.source) }}</span>
  <span>大小: {{ packet.size }} 字节</span>
</div>
```

### 解析成功区域
在解析成功的数据详情区域，采用3列网格布局，新增了“源IP”和“端口”字段，与“包类型”、“协议ID”等信息并列。

```html
<div class="grid grid-cols-3 gap-2 text-xs">
  <div><strong>包类型:</strong> {{ packet.parsedPacket.packageTypeName }}</div>
  <div><strong>类型码:</strong> 0x{{ packet.parsedPacket.packageType.toString(16).padStart(2, '0') }}</div>
  <div><strong>协议ID:</strong> 0x{{ packet.parsedPacket.protocolID.toString(16).padStart(2, '0') }}</div>
  <div><strong>数据大小:</strong> {{ packet.parsedPacket.size }} 字节</div>
  <div><strong>源IP:</strong> {{ extractSourceIP(packet.source) }}</div>
  <div><strong>端口:</strong> {{ extractSourcePort(packet.source) }}</div>
</div>
```

**图示来源**  
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue#L100-L115)

## 技术细节与代码实现
### IP与端口解析函数
前端实现两个纯函数，使用正则表达式`/^(.+):(\d+)$/`进行解析。

```typescript
const extractSourceIP = (source: string): string => {
  const match = source.match(/^(.+):(\d+)$/);
  return match ? match[1] : source;
};

const extractSourcePort = (source: string): string => {
  const match = source.match(/^(.+):(\d+)$/);
  return match ? match[2] : '';
};
```
- **正则说明**: `(.+)` 捕获IP地址（支持IPv4/IPv6），`(\d+)` 捕获端口号。
- **容错机制**: 若解析失败，`extractSourceIP`返回原始字符串，`extractSourcePort`返回空字符串。

### 后端数据包构造
后端在`multicast.service.ts`中接收数据包时，将`rinfo`对象的`address`和`port`组合成`source`字段。

```typescript
this.socket.on('message', (msg, rinfo) => {
  const timestamp = Date.now();
  const source = `${rinfo.address}:${rinfo.port}`;
  // ... 构造packet对象
});
```

### Protobuf解析与协议ID
`protobuf-parser.service.ts`在解析数据包时，从包头提取`protocolID`和`packageType`，并将其包含在`ParsedPacket`对象中。

```typescript
const protocolID = data[2];
const packageType = data[3];
// ...
return {
  protocolID,
  packageType,
  packageTypeName,
  // ...
};
```

**图示来源**  
- [src/renderer/views/pages/MulticastPage.vue](file://src/renderer/views/pages/MulticastPage.vue#L150-L165)
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts#L70)
- [src/main/services/protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts#L170-L180)

## 使用方式与调试建议
### 使用方式
1. 启动应用: `npm run dev`
2. 进入“组播监听页面”
3. 配置组播地址、端口等参数
4. 点击“开始监听”
5. 接收数据包后，可在数据包头部和解析区域查看分离的“源IP”和“端口”信息。

### 调试建议
- **日志查看**: 后端服务在控制台输出详细的调试信息，包括接收到的数据包头、解析结果等。
- **网络抓包**: 可使用Wireshark等工具验证组播数据包的来源。
- **错误处理**: 若IP解析失败，前端会显示原始`source`字符串，便于排查格式问题。

**图示来源**  
- [MULTICAST_SOURCE_IP_ENHANCEMENT.md](file://MULTICAST_SOURCE_IP_ENHANCEMENT.md#L60-L80)
- [src/main/services/multicast.service.ts](file://src/main/services/multicast.service.ts#L80-L90)

## 兼容性与扩展性
### 兼容性
- **向后兼容**: 若`source`字段格式不符合`IP:端口`，解析函数会降级处理，保证界面不崩溃。
- **地址格式**: 正则表达式设计为通用模式，同时支持IPv4（如`192.168.1.100`）和IPv6（如`[fe80::1]`）地址。
- **功能独立**: 本功能仅影响展示层，不影响底层的Protobuf解析和数据处理逻辑。

### 扩展性
- **字段扩展**: 可在`ParsedPacket`接口中轻松添加更多元数据字段。
- **协议支持**: `protobuf-parser.service.ts`的设计支持动态加载`.proto`文件，便于扩展新的数据包类型。
- **界面定制**: 前端组件结构清晰，可方便地调整网格布局或添加新的信息展示区域。

**图示来源**  
- [MULTICAST_SOURCE_IP_ENHANCEMENT.md](file://MULTICAST_SOURCE_IP_ENHANCEMENT.md#L110-L120)
- [src/main/services/protobuf-parser.service.ts](file://src/main/services/protobuf-parser.service.ts#L100-L120)