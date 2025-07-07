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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div class="text-sm text-gray-500">数据包数量</div>
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
          <el-button size="small" @click="exportPackets">导出数据</el-button>
        </div>
      </div>
      
      <div 
        ref="packetContainer"
        class="border rounded-lg p-4 h-full overflow-y-auto bg-gray-50"
        style="max-height: 400px;"
      >
        <div v-if="packets.length === 0" class="text-center text-gray-500 py-8">
          暂无数据包
        </div>
        <div 
          v-for="(packet, index) in packets" 
          :key="index"
          class="bg-white rounded-lg p-4 mb-3 shadow-sm border"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex gap-4 text-sm text-gray-600">
              <span>时间: {{ formatTime(packet.timestamp) }}</span>
              <span>来源: {{ packet.source }}</span>
              <span>大小: {{ packet.size }} 字节</span>
            </div>
            <el-tag size="small" type="info">#{{ index + 1 }}</el-tag>
          </div>
          <div class="bg-gray-100 rounded p-3 font-mono text-sm overflow-x-auto">
            <div v-if="packet.parsedPacket" class="mb-2">
              <div class="text-blue-600 font-semibold">解析结果:</div>
              <div class="text-sm">
                <div><strong>包类型:</strong> {{ packet.parsedPacket.packageTypeName }} (0x{{ packet.parsedPacket.packageType.toString(16) }})</div>
                <div><strong>解析数据:</strong></div>
                <pre class="mt-1 text-xs">{{ JSON.stringify(packet.parsedPacket.parsedData, null, 2) }}</pre>
              </div>
            </div>
            <div class="mt-2">
              <div class="text-gray-600 font-semibold">原始数据:</div>
              <pre>{{ toHex(packet.data) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';

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
const packetContainer = ref<HTMLElement>();

const status = reactive<MulticastStatus>({
  isListening: false,
  address: '',
  port: 0
});

const config = reactive({
  address: '',
  port: 8888,
  interfaceAddress: '0.0.0.0'
});

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 原始数据转十六进制
function toHex(buffer: Buffer | Uint8Array | number[]): string {
  if (!buffer) return '';
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

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
      const result = await window.electronAPI.export.exportFile(filePath, {
        config: config,
        status: status,
        packets: packets.value,
        exportTime: new Date().toISOString()
      });

      if (result.success) {
        ElMessage.success('数据导出成功');
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
  packets.value.push(packet);
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