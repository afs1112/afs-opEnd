## 📡 组播数据包源IP地址显示功能增强

### 🎯 修改目标
在组播数据包接收展示界面中增加源IP地址的清晰显示，提升调试和监控的便利性。

### ✅ 已完成的修改

#### 1. 数据包列表头部信息优化
**文件**: `/src/renderer/views/pages/MulticastPage.vue`

**修改前**:
```html
<span>时间: {{ formatTime(packet.timestamp) }}</span>
<span>来源: {{ packet.source }}</span>
<span>大小: {{ packet.size }} 字节</span>
```

**修改后**:
```html
<span>时间: {{ formatTime(packet.timestamp) }}</span>
<span>源IP: {{ extractSourceIP(packet.source) }}</span>
<span>端口: {{ extractSourcePort(packet.source) }}</span>
<span>大小: {{ packet.size }} 字节</span>
```

#### 2. 新增IP地址解析函数
添加了两个辅助函数来解析源地址信息：

```typescript
// 从源信息中提取IP地址
const extractSourceIP = (source: string): string => {
  const match = source.match(/^(.+):(\\d+)$/);
  return match ? match[1] : source;
};

// 从源信息中提取端口号
const extractSourcePort = (source: string): string => {
  const match = source.match(/^(.+):(\\d+)$/);
  return match ? match[2] : '';
};
```

#### 3. 解析成功数据区域增强
**修改前**: 2列网格布局
```html
<div class="grid grid-cols-2 gap-2 text-xs">
  <div><strong>包类型:</strong> ...</div>
  <div><strong>类型码:</strong> ...</div>
  <div><strong>协议ID:</strong> ...</div>
  <div><strong>数据大小:</strong> ...</div>
</div>
```

**修改后**: 3列网格布局，增加IP和端口信息
```html
<div class="grid grid-cols-3 gap-2 text-xs">
  <div><strong>包类型:</strong> ...</div>
  <div><strong>类型码:</strong> ...</div>
  <div><strong>协议ID:</strong> ...</div>
  <div><strong>数据大小:</strong> ...</div>
  <div><strong>源IP:</strong> {{ extractSourceIP(packet.source) }}</div>
  <div><strong>端口:</strong> {{ extractSourcePort(packet.source) }}</div>
</div>
```

#### 4. TypeScript接口更新
更新了前端的MulticastPacket接口，增加了protocolID字段支持：

```typescript
interface MulticastPacket {
  // ... 其他字段
  parsedPacket?: {
    // ... 其他字段
    protocolID: number;  // 新增
  };
}
```

### 🔧 技术实现细节

#### 数据流程
1. **后端数据收集**: multicast.service.ts 中通过 `rinfo.address:rinfo.port` 格式收集源信息
2. **前端数据解析**: Vue组件中使用正则表达式解析IP和端口
3. **界面展示**: 分别在数据包头部和解析成功区域显示源IP信息

#### 正则表达式解析
```typescript
const match = source.match(/^(.+):(\\d+)$/);
```
- 匹配格式: `IP地址:端口号`
- 支持IPv4和IPv6地址格式
- 容错处理: 解析失败时返回原始字符串或空字符串

### 🎨 界面效果

#### 数据包头部显示效果:
```
时间: 2025/9/3 14:50:56  源IP: 192.168.1.100  端口: 12345  大小: 88 字节
```

#### 解析成功区域显示效果:
```
✅ 解析成功:
┌─────────────────┬─────────────────┬─────────────────┐
│ 包类型: 平台状态  │ 类型码: 0x29    │ 协议ID: 0x01    │
│ 数据大小: 80字节  │ 源IP: 192.168.1.100 │ 端口: 12345 │
└─────────────────┴─────────────────┴─────────────────┘
```

### 🚀 使用方式
1. 启动应用: `npm run dev`
2. 进入组播监听页面
3. 开始监听组播数据
4. 查看接收到的数据包，现在可以清晰看到：
   - 源IP地址（单独显示）
   - 源端口号（单独显示）
   - 在解析成功的数据中也会显示这些信息

### 📊 优势
- **调试便利**: 快速识别数据包来源
- **网络监控**: 便于分析组播网络拓扑
- **故障排查**: 快速定位问题节点
- **可视化提升**: 信息分类清晰，便于阅读

### 🔄 兼容性
- 向后兼容原有数据格式
- 正则解析失败时自动降级为原始显示
- 不影响现有的protobuf解析功能
- 支持IPv4和IPv6地址格式