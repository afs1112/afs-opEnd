<template>
  <div class="flex flex-col h-full p-4">
    <!-- 配置区域 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 class="text-xl font-semibold mb-4">组播配置</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <el-form-item label="组播地址">
          <el-input 
            v-model="config.address" 
            placeholder="239.255.43.21"
            :disabled="isListening"
          />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number 
            v-model="config.port" 
            :min="1024" 
            :max="65535"
            placeholder="10086"
            :disabled="isListening"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="接口地址">
          <el-input 
            v-model="config.interfaceAddress" 
            placeholder="0.0.0.0"
            :disabled="isListening"
          />
        </el-form-item>
      </div>
      <div class="flex gap-2 mt-4">
        <el-button 
          type="primary" 
          @click="startListening"
          :loading="starting"
          :disabled="isListening"
        >
          开始监听
        </el-button>
        <el-button 
          type="danger" 
          @click="stopListening"
          :loading="stopping"
          :disabled="!isListening"
        >
          停止监听
        </el-button>
        <el-button @click="clearPackets">清空数据</el-button>
      </div>
    </div>

    <!-- 状态显示 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 class="text-xl font-semibold mb-4">监听状态</h2>
      <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold" :class="isListening ? 'text-green-600' : 'text-red-600'">
            {{ isListening ? '监听中' : '已停止' }}
          </div>
          <div class="text-sm text-gray-500">状态</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ status.address }}</div>
          <div class="text-sm text-gray-500">组播地址</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ status.port }}</div>
          <div class="text-sm text-gray-500">端口</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ packets.length }}</div>
          <div class="text-sm text-gray-500">总数据包</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ parsedPacketsCount }}</div>
          <div class="text-sm text-gray-500">已解析</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ platformStatusCount }}</div>
          <div class="text-sm text-gray-500">平台状态</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-600">{{ heartbeatPackets.length }}</div>
          <div class="text-sm text-gray-500">心跳包</div>
        </div>
      </div>
    </div>

    <!-- 数据包列表 -->
    <div class="bg-white rounded-lg shadow-md p-6 flex-1 overflow-hidden">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">接收到的数据包</h2>
        <div class="flex gap-2">
          <el-switch 
            v-model="autoScroll" 
            active-text="自动滚动"
            inactive-text="手动滚动"
          />
          <el-switch 
            v-model="showHeartbeats" 
            active-text="显示心跳"
            inactive-text="隐藏心跳"
          />
          <el-dropdown @command="handleBatchCopyCommand">
            <el-button size="small" type="primary" plain>
              批量复制 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="all-parsed">复制所有解析数据</el-dropdown-item>
                <el-dropdown-item command="all-hex">复制所有十六进制</el-dropdown-item>
                <el-dropdown-item command="all-full">复制所有完整信息</el-dropdown-item>
                <el-dropdown-item command="summary">复制数据包摘要</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" @click="exportPackets">导出数据</el-button>
        </div>
      </div>
      
      <!-- 心跳包汇聚显示 -->
      <div v-if="heartbeatPackets.length > 0" class="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <div class="text-blue-700 font-semibold">💓 心跳包汇聚</div>
            <el-tag size="small" type="info">{{ heartbeatPackets.length }} 个</el-tag>
            <el-tag size="small" type="success" v-if="heartbeatPackets.length > 0">
              最新: {{ formatTime(heartbeatPackets[heartbeatPackets.length - 1].timestamp) }}
            </el-tag>
          </div>
          <div class="flex gap-2">
            <el-button size="small" @click="copyHeartbeatSummary">复制心跳摘要</el-button>
            <el-button size="small" @click="clearHeartbeats">清空心跳</el-button>
            <el-button size="small" @click="showHeartbeats = !showHeartbeats">
              {{ showHeartbeats ? '隐藏详情' : '显示详情' }}
            </el-button>
          </div>
        </div>
        
        <!-- 心跳统计信息 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-blue-600">{{ heartbeatPackets.length }}</div>
            <div class="text-gray-500">总心跳数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-green-600">{{ getHeartbeatRate() }}</div>
            <div class="text-gray-500">频率/分钟</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-purple-600">{{ getUniqueHeartbeatSources().length }}</div>
            <div class="text-gray-500">来源数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-orange-600">{{ getHeartbeatDuration() }}</div>
            <div class="text-gray-500">持续时间</div>
          </div>
        </div>

        <!-- 心跳详细列表 (可折叠) -->
        <div v-if="showHeartbeats" class="max-h-40 overflow-y-auto">
          <div class="text-xs text-gray-600 mb-2">最近的心跳包 (最多显示20个):</div>
          <div class="space-y-1">
            <div 
              v-for="(heartbeat, index) in heartbeatPackets.slice(-20)" 
              :key="index"
              class="bg-white rounded p-2 text-xs flex justify-between items-center"
            >
              <div class="flex gap-4">
                <span>{{ formatTime(heartbeat.timestamp) }}</span>
                <span>{{ extractSourceIP(heartbeat.source) }}</span>
                <span v-if="heartbeat.parsedPacket">
                  软件ID: {{ heartbeat.parsedPacket.parsedData?.softwareID || 'N/A' }}
                </span>
                <span v-if="heartbeat.parsedPacket">
                  状态: {{ heartbeat.parsedPacket.parsedData?.state || 'N/A' }}
                </span>
              </div>
              <el-button 
                size="small" 
                type="text" 
                @click="copyToClipboard(JSON.stringify(heartbeat.parsedPacket?.parsedData || {}, null, 2), '心跳数据')"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref="packetContainer"
        class="border rounded-lg p-4 h-full overflow-y-auto bg-gray-50"
        style="max-height: 400px;"
      >
        <div v-if="displayPackets.length === 0" class="text-center text-gray-500 py-8">
          暂无数据包
        </div>
        <div 
          v-for="(packet, index) in displayPackets" 
          :key="index"
          class="bg-white rounded-lg p-4 mb-3 shadow-sm border"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex gap-4 text-sm text-gray-600">
              <span>时间: {{ formatTime(packet.timestamp) }}</span>
              <span>源IP: {{ extractSourceIP(packet.source) }}</span>
              <span>端口: {{ extractSourcePort(packet.source) }}</span>
              <span>大小: {{ packet.size }} 字节</span>
            </div>
            <div class="flex gap-2 items-center">
              <el-dropdown @command="(command) => handleCopyCommand(command, packet, index)">
                <el-button size="small" type="primary" plain>
                  复制 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="raw">复制原始数据</el-dropdown-item>
                    <el-dropdown-item command="hex">复制十六进制</el-dropdown-item>
                    <el-dropdown-item v-if="packet.parsedPacket" command="parsed">复制解析数据</el-dropdown-item>
                    <el-dropdown-item command="full">复制完整信息</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-tag size="small" type="info">#{{ index + 1 }}</el-tag>
            </div>
          </div>
          <div class="bg-gray-100 rounded p-3 font-mono text-sm overflow-x-auto">
            <div v-if="packet.parsedPacket" class="mb-4">
              <div class="text-green-600 font-semibold mb-2">✅ 解析成功:</div>
              <div class="bg-white rounded p-2 mb-2">
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <div><strong>包类型:</strong> {{ packet.parsedPacket.packageTypeName }}</div>
                  <div><strong>类型码:</strong> 0x{{ packet.parsedPacket.packageType.toString(16).padStart(2, '0') }}</div>
                  <div><strong>协议ID:</strong> 0x{{ packet.parsedPacket.protocolID.toString(16).padStart(2, '0') }}</div>
                  <div><strong>数据大小:</strong> {{ packet.parsedPacket.size }} 字节</div>
                  <div><strong>源IP:</strong> {{ extractSourceIP(packet.source) }}</div>
                  <div><strong>端口:</strong> {{ extractSourcePort(packet.source) }}</div>
                </div>
              </div>
              
              <!-- 平台状态特殊显示 -->
              <div v-if="packet.parsedPacket.packageType === 0x29 && packet.parsedPacket.parsedData" class="bg-blue-50 rounded p-2 mb-2">
                <div class="text-blue-700 font-semibold text-xs mb-1">🚁 平台状态信息:</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>平台ID:</strong> {{ packet.parsedPacket.parsedData.PlatformId }}</div>
                  <div><strong>平台类型:</strong> {{ getPlatformTypeName(packet.parsedPacket.parsedData.type) }}</div>
                  <div v-if="packet.parsedPacket.parsedData.coord">
                    <strong>经度:</strong> {{ packet.parsedPacket.parsedData.coord.longitude?.toFixed(6) }}°
                  </div>
                  <div v-if="packet.parsedPacket.parsedData.coord">
                    <strong>纬度:</strong> {{ packet.parsedPacket.parsedData.coord.latitude?.toFixed(6) }}°
                  </div>
                  <div v-if="packet.parsedPacket.parsedData.coord" class="col-span-2">
                    <strong>高度:</strong> {{ packet.parsedPacket.parsedData.coord.altitude?.toFixed(1) }}m
                  </div>
                </div>
              </div>
              
              <div class="text-xs">
                <div class="flex justify-between items-center mb-1">
                  <div class="text-gray-600 font-semibold">完整解析数据:</div>
                  <el-button 
                    size="small" 
                    type="text" 
                    @click="copyToClipboard(JSON.stringify(packet.parsedPacket.parsedData, null, 2), '解析数据')"
                  >
                    <el-icon><DocumentCopy /></el-icon>
                  </el-button>
                </div>
                <pre class="bg-white rounded p-2 text-xs overflow-x-auto">{{ JSON.stringify(packet.parsedPacket.parsedData, null, 2) }}</pre>
              </div>
            </div>
            
            <div v-else class="mb-4">
              <div class="text-red-600 font-semibold mb-2">❌ 未解析 (显示原始数据):</div>
              <div class="bg-yellow-50 rounded p-2 text-xs">
                <div><strong>可能原因:</strong> 包格式不匹配、protobuf定义未加载或数据损坏</div>
              </div>
            </div>
            
            <div class="mt-2">
              <div class="flex justify-between items-center mb-1">
                <div class="text-gray-600 font-semibold">原始十六进制数据:</div>
                <el-button 
                  size="small" 
                  type="text" 
                  @click="copyToClipboard(toHex(packet.data), '十六进制数据')"
                >
                  <el-icon><DocumentCopy /></el-icon>
                </el-button>
              </div>
              <div class="bg-white rounded p-2">
                <pre class="text-xs break-all">{{ toHex(packet.data) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown, DocumentCopy } from '@element-plus/icons-vue';

interface MulticastPacket {
  timestamp: number;
  source: string;
  data: Buffer;
  dataString: string;
  size: number;
  parsedPacket?: {
    timestamp: number;
    source: string;
    packageType: number;
    packageTypeName: string;
    parsedData: any;
    rawData: Buffer;
    size: number;
    protocolID: number;
  };
}

interface MulticastStatus {
  isListening: boolean;
  address: string;
  port: number;
}

const isListening = ref(false);
const starting = ref(false);
const stopping = ref(false);
const autoScroll = ref(true);
const packets = ref<MulticastPacket[]>([]);
const heartbeatPackets = ref<MulticastPacket[]>([]);
const showHeartbeats = ref(false);
const packetContainer = ref<HTMLElement>();

const status = reactive<MulticastStatus>({
  isListening: false,
  address: '',
  port: 0
});

const config = reactive({
  address: '239.255.43.21',
  port: 10086,
  interfaceAddress: '0.0.0.0'
});

// 计算属性
const parsedPacketsCount = computed(() => {
  return packets.value.filter(p => p.parsedPacket).length;
});

const platformStatusCount = computed(() => {
  return packets.value.filter(p => p.parsedPacket?.packageType === 0x29).length;
});

// 显示的数据包列表（排除心跳包）
const displayPackets = computed(() => {
  return packets.value.filter(p => p.parsedPacket?.packageType !== 0x02);
});

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 从源信息中提取IP地址
const extractSourceIP = (source: string): string => {
  const match = source.match(/^(.+):(\d+)$/);
  return match ? match[1] : source;
};

// 从源信息中提取端口号
const extractSourcePort = (source: string): string => {
  const match = source.match(/^(.+):(\d+)$/);
  return match ? match[2] : '';
};

// 原始数据转十六进制
function toHex(buffer: Buffer | Uint8Array | number[]): string {
  if (!buffer) return '';
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

// 获取平台类型名称
const getPlatformTypeName = (type: number): string => {
  const types: Record<number, string> = {
    0: '无人机',
    2: '火炮',
    3: '炮弹',
    4: '目标'
  };
  return types[type] || `未知类型(${type})`;
};

// 复制到剪贴板
const copyToClipboard = async (text: string, description: string = '数据') => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${description}已复制到剪贴板`);
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败，请手动选择文本复制');
  }
};

// 处理复制命令
const handleCopyCommand = (command: string, packet: MulticastPacket, index: number) => {
  switch (command) {
    case 'raw':
      // 复制原始二进制数据（Base64编码）
      const base64Data = btoa(String.fromCharCode(...Array.from(packet.data)));
      copyToClipboard(base64Data, '原始数据(Base64)');
      break;
      
    case 'hex':
      // 复制十六进制数据
      copyToClipboard(toHex(packet.data), '十六进制数据');
      break;
      
    case 'parsed':
      // 复制解析后的数据
      if (packet.parsedPacket) {
        copyToClipboard(JSON.stringify(packet.parsedPacket.parsedData, null, 2), '解析数据');
      }
      break;
      
    case 'full':
      // 复制完整的数据包信息
      const fullInfo = {
        序号: index + 1,
        时间: formatTime(packet.timestamp),
        源地址: packet.source,
        数据大小: packet.size,
        原始数据_十六进制: toHex(packet.data),
        原始数据_Base64: btoa(String.fromCharCode(...Array.from(packet.data))),
        解析信息: packet.parsedPacket ? {
          包类型: packet.parsedPacket.packageTypeName,
          类型码: `0x${packet.parsedPacket.packageType.toString(16).padStart(2, '0')}`,
          协议ID: `0x${packet.parsedPacket.protocolID.toString(16).padStart(2, '0')}`,
          解析数据: packet.parsedPacket.parsedData
        } : '未解析'
      };
      copyToClipboard(JSON.stringify(fullInfo, null, 2), '完整数据包信息');
      break;
  }
};

// 处理批量复制命令
const handleBatchCopyCommand = (command: string) => {
  if (packets.value.length === 0) {
    ElMessage.warning('没有数据可复制');
    return;
  }

  switch (command) {
    case 'all-parsed':
      // 复制所有解析数据
      const parsedData = packets.value
        .filter(p => p.parsedPacket)
        .map((p, index) => ({
          序号: index + 1,
          时间: formatTime(p.timestamp),
          包类型: p.parsedPacket!.packageTypeName,
          数据: p.parsedPacket!.parsedData
        }));
      copyToClipboard(JSON.stringify(parsedData, null, 2), `${parsedData.length}个解析数据包`);
      break;
      
    case 'all-hex':
      // 复制所有十六进制数据
      const hexData = packets.value.map((p, index) => ({
        序号: index + 1,
        时间: formatTime(p.timestamp),
        源地址: p.source,
        十六进制: toHex(p.data)
      }));
      copyToClipboard(JSON.stringify(hexData, null, 2), `${hexData.length}个数据包的十六进制数据`);
      break;
      
    case 'all-full':
      // 复制所有完整信息
      const allFullData = packets.value.map((p, index) => ({
        序号: index + 1,
        时间: formatTime(p.timestamp),
        源地址: p.source,
        数据大小: p.size,
        十六进制: toHex(p.data),
        解析信息: p.parsedPacket ? {
          包类型: p.parsedPacket.packageTypeName,
          类型码: `0x${p.parsedPacket.packageType.toString(16).padStart(2, '0')}`,
          协议ID: `0x${p.parsedPacket.protocolID.toString(16).padStart(2, '0')}`,
          解析数据: p.parsedPacket.parsedData
        } : '未解析'
      }));
      copyToClipboard(JSON.stringify(allFullData, null, 2), `${allFullData.length}个完整数据包信息`);
      break;
      
    case 'summary':
      // 复制数据包摘要
      const summary = {
        统计时间: new Date().toLocaleString('zh-CN'),
        总数据包数: packets.value.length,
        已解析数据包数: parsedPacketsCount.value,
        平台状态数据包数: platformStatusCount.value,
        配置信息: {
          组播地址: config.address,
          端口: config.port,
          接口地址: config.interfaceAddress
        },
        包类型统计: getPacketTypeStatistics(),
        最新数据包: packets.value.length > 0 ? {
          时间: formatTime(packets.value[packets.value.length - 1].timestamp),
          源地址: packets.value[packets.value.length - 1].source,
          大小: packets.value[packets.value.length - 1].size
        } : null
      };
      copyToClipboard(JSON.stringify(summary, null, 2), '数据包摘要');
      break;
  }
};

// 获取包类型统计
const getPacketTypeStatistics = () => {
  const stats: Record<string, number> = {};
  packets.value.forEach(p => {
    if (p.parsedPacket) {
      const typeName = p.parsedPacket.packageTypeName;
      stats[typeName] = (stats[typeName] || 0) + 1;
    } else {
      stats['未解析'] = (stats['未解析'] || 0) + 1;
    }
  });
  return stats;
};

// 心跳包相关方法
const getHeartbeatRate = () => {
  if (heartbeatPackets.value.length < 2) return '0';
  
  const firstTime = heartbeatPackets.value[0].timestamp;
  const lastTime = heartbeatPackets.value[heartbeatPackets.value.length - 1].timestamp;
  const durationMinutes = (lastTime - firstTime) / (1000 * 60);
  
  if (durationMinutes === 0) return '0';
  
  const rate = heartbeatPackets.value.length / durationMinutes;
  return rate.toFixed(1);
};

const getUniqueHeartbeatSources = () => {
  const sources = new Set(heartbeatPackets.value.map(p => extractSourceIP(p.source)));
  return Array.from(sources);
};

const getHeartbeatDuration = () => {
  if (heartbeatPackets.value.length < 2) return '0秒';
  
  const firstTime = heartbeatPackets.value[0].timestamp;
  const lastTime = heartbeatPackets.value[heartbeatPackets.value.length - 1].timestamp;
  const durationSeconds = Math.floor((lastTime - firstTime) / 1000);
  
  if (durationSeconds < 60) return `${durationSeconds}秒`;
  if (durationSeconds < 3600) return `${Math.floor(durationSeconds / 60)}分${durationSeconds % 60}秒`;
  
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  return `${hours}时${minutes}分`;
};

const copyHeartbeatSummary = () => {
  const summary = {
    心跳包统计: {
      总数: heartbeatPackets.value.length,
      频率: `${getHeartbeatRate()}/分钟`,
      来源数: getUniqueHeartbeatSources().length,
      持续时间: getHeartbeatDuration(),
      来源列表: getUniqueHeartbeatSources()
    },
    最近心跳: heartbeatPackets.value.slice(-10).map(p => ({
      时间: formatTime(p.timestamp),
      源地址: p.source,
      软件ID: p.parsedPacket?.parsedData?.softwareID,
      状态: p.parsedPacket?.parsedData?.state
    })),
    统计时间: new Date().toLocaleString('zh-CN')
  };
  
  copyToClipboard(JSON.stringify(summary, null, 2), '心跳包摘要');
};

const clearHeartbeats = () => {
  heartbeatPackets.value = [];
  ElMessage.success('心跳包已清空');
};

// 开始监听
const startListening = async () => {
  starting.value = true;
  try {
    const result = await window.electronAPI.multicast.updateConfig(
      config.address,
      config.port,
      config.interfaceAddress
    );
    
    if (result.success) {
      const startResult = await window.electronAPI.multicast.start();
      if (startResult.success) {
        ElMessage.success('组播监听已启动');
        await updateStatus();
      } else {
        ElMessage.error(`启动失败: ${startResult.error}`);
      }
    } else {
      ElMessage.error(`配置更新失败: ${result.error}`);
    }
  } catch (error) {
    ElMessage.error(`启动监听失败: ${error}`);
  } finally {
    starting.value = false;
  }
};

// 停止监听
const stopListening = async () => {
  stopping.value = true;
  try {
    const result = await window.electronAPI.multicast.stop();
    if (result.success) {
      ElMessage.success('组播监听已停止');
      await updateStatus();
    } else {
      ElMessage.error(`停止失败: ${result.error}`);
    }
  } catch (error) {
    ElMessage.error(`停止监听失败: ${error}`);
  } finally {
    stopping.value = false;
  }
};

// 加载配置
const loadConfig = async () => {
  try {
    const envConfig = await window.electronAPI.multicast.getConfig();
    Object.assign(config, envConfig);
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 更新状态
const updateStatus = async () => {
  try {
    const currentStatus = await window.electronAPI.multicast.getStatus();
    Object.assign(status, currentStatus);
    isListening.value = currentStatus.isListening;
  } catch (error) {
    console.error('获取状态失败:', error);
  }
};

// 清空数据包
const clearPackets = () => {
  packets.value = [];
  heartbeatPackets.value = [];
};

// 导出数据包
const exportPackets = async () => {
  if (packets.value.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }

  try {
    const filePath = await window.electronAPI.export.showSaveDialog({
      title: '导出组播数据',
      defaultFileName: `multicast_packets_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      // 清理数据，确保可序列化
      const exportData = {
        config: {
          address: config.address,
          port: config.port,
          interfaceAddress: config.interfaceAddress
        },
        status: {
          isListening: status.isListening,
          address: status.address,
          port: status.port
        },
        packets: packets.value.map(packet => ({
          timestamp: packet.timestamp,
          source: packet.source,
          dataString: packet.dataString,
          size: packet.size,
          // 不包含 Buffer 对象
        })),
        exportTime: new Date().toISOString(),
        totalPackets: packets.value.length
      };

      const result = await window.electronAPI.export.exportFile(filePath, exportData);

      if (result.success) {
        const message = `数据导出成功！路径: ${result.path}`;
        const details = result.recordCount ? ` (${result.recordCount} 条记录, ${Math.round(result.size / 1024)}KB)` : '';
        ElMessage.success(message + details);
      } else {
        ElMessage.error(`导出失败: ${result.error}`);
      }
    }
  } catch (error) {
    ElMessage.error(`导出失败: ${error}`);
  }
};

// 自动滚动到底部
const scrollToBottom = async () => {
  if (autoScroll.value && packetContainer.value) {
    await nextTick();
    packetContainer.value.scrollTop = packetContainer.value.scrollHeight;
  }
};

// 监听数据包
const handlePacket = (packet: MulticastPacket) => {
  // 检查是否为心跳包 (PackType_HeartbeatInternal = 0x02)
  if (packet.parsedPacket?.packageType === 0x02) {
    heartbeatPackets.value.push(packet);
    
    // 限制心跳包数量，避免内存占用过多
    if (heartbeatPackets.value.length > 1000) {
      heartbeatPackets.value = heartbeatPackets.value.slice(-500); // 保留最新的500个
    }
  } else {
    // 非心跳包正常显示
    packets.value.push(packet);
  }
  
  scrollToBottom();
};

// 监听错误
const handleError = (error: string) => {
  ElMessage.error(`组播错误: ${error}`);
};

// 监听数据包变化，自动滚动
watch(packets, () => {
  scrollToBottom();
}, { deep: true });

onMounted(async () => {
  // 设置事件监听
  window.electronAPI.multicast.onPacket(handlePacket);
  window.electronAPI.multicast.onError(handleError);
  
  // 获取初始配置
  await loadConfig();
  
  // 获取初始状态
  await updateStatus();
});

onUnmounted(() => {
  // 清理事件监听
  window.electronAPI.multicast.removeAllListeners('multicast:packet');
  window.electronAPI.multicast.removeAllListeners('multicast:error');
});
</script>

<style scoped>
.el-form-item {
  margin-bottom: 0;
}
</style> 