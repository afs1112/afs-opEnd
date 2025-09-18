<template>
  <div class="flex flex-col h-full p-4">
    <!-- 配置区域 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 class="text-xl font-semibold mb-4">组播配置</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <el-form-item label="组播地址">
          <el-input v-model="config.address" placeholder="239.255.43.21" :disabled="isListening" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="config.port" :min="1024" :max="65535" placeholder="10086" :disabled="isListening"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="接口地址">
          <el-input v-model="config.interfaceAddress" placeholder="0.0.0.0" :disabled="isListening" />
        </el-form-item>
      </div>
      <div class="flex gap-2 mt-4">
        <el-button type="primary" @click="startListening" :loading="starting" :disabled="isListening">
          开始监听
        </el-button>
        <el-button type="danger" @click="stopListening" :loading="stopping" :disabled="!isListening">
          停止监听
        </el-button>
        <el-button @click="clearPackets">清空数据</el-button>
      </div>
    </div>

    <!-- 状态显示 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 class="text-xl font-semibold mb-4">监听状态</h2>
      <div class="grid grid-cols-1 md:grid-cols-8 gap-4">
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
          <div class="text-2xl font-bold text-cyan-600">{{ platformCmdCount }}</div>
          <div class="text-sm text-gray-500">平台命令</div>
        </div>
      </div>
    </div>

    <!-- 数据包列表 -->
    <div class="bg-white rounded-lg shadow-md p-6 flex-1 overflow-hidden">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">接收到的数据包</h2>
        <div class="flex gap-2">
          <el-dropdown @command="handleBatchCopyCommand">
            <el-button size="small" type="primary" plain>
              批量复制 <el-icon>
                <ArrowDown />
              </el-icon>
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



      <!-- 平台状态包汇聚显示 -->
      <div v-if="platformStatusPackets.length > 0" class="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <div class="text-orange-700 font-semibold">📊 平台状态汇聚</div>
            <el-tag size="small" type="warning">{{ platformStatusPackets.length }} 个</el-tag>
            <el-tag size="small" type="success" v-if="platformStatusPackets.length > 0">
              最新: {{ formatTime(platformStatusPackets[platformStatusPackets.length - 1].timestamp) }}
            </el-tag>
          </div>
          <div class="flex gap-2">
            <el-button size="small" @click="copyPlatformStatusSummary">复制状态摘要</el-button>
            <el-button size="small" @click="clearPlatformStatus">清空状态</el-button>
            <el-button size="small" @click="showPlatformStatus = !showPlatformStatus">
              {{ showPlatformStatus ? '隐藏详情' : '显示详情' }}
            </el-button>
          </div>
        </div>

        <!-- 平台状态统计信息 -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3 text-sm">
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-orange-600">{{ platformStatusPackets.length }}</div>
            <div class="text-gray-500">状态包数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-green-600">{{ getUniquePlatformCount() }}</div>
            <div class="text-gray-500">平台数量</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-purple-600">{{ getPlatformStatusDuration() }}</div>
            <div class="text-gray-500">持续时间</div>
          </div>
        </div>

        <!-- 平台状态详细列表 (可折叠) -->
        <div v-if="showPlatformStatus" class="max-h-40 overflow-y-auto">
          <div class="text-xs text-gray-600 mb-2">最近的平台状态 (最多显示10个):</div>
          <div class="space-y-1">
            <div v-for="(status, index) in platformStatusPackets.slice(-10).reverse()" :key="index"
              class="bg-white rounded p-2 text-xs flex justify-between items-center">
              <div class="flex gap-4">
                <span>{{ formatTime(status.timestamp) }}</span>
                <span>{{ extractSourceIP(status.source) }}</span>
                <span v-if="status.parsedPacket">
                  平台数: {{ status.parsedPacket.parsedData?.platform?.length || 0 }}
                </span>
              </div>
              <div class="flex gap-1">
                <el-button size="small" type="success" plain
                  @click="showPacketDetail(status, platformStatusPackets.indexOf(status))">
                  详情
                </el-button>
                <el-button size="small" type="text"
                  @click="copyToClipboard(JSON.stringify(status.parsedPacket?.parsedData || {}, null, 2), '平台状态数据')">
                  <el-icon>
                    <DocumentCopy />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 平台命令包汇聚显示 -->
      <div v-if="platformCmdPackets.length > 0" class="bg-cyan-50 rounded-lg p-4 mb-4 border border-cyan-200">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <div class="text-cyan-700 font-semibold">🎮 平台命令汇聚</div>
            <el-tag size="small" type="info">{{ platformCmdPackets.length }} 个</el-tag>
            <el-tag size="small" type="success" v-if="platformCmdPackets.length > 0">
              最新: {{ formatTime(platformCmdPackets[platformCmdPackets.length - 1].timestamp) }}
            </el-tag>
          </div>
          <div class="flex gap-2">
            <el-button size="small" @click="copyPlatformCmdSummary">复制命令摘要</el-button>
            <el-button size="small" @click="clearPlatformCmd">清空命令</el-button>
            <el-button size="small" @click="showPlatformCmd = !showPlatformCmd">
              {{ showPlatformCmd ? '隐藏详情' : '显示详情' }}
            </el-button>
          </div>
        </div>

        <!-- 平台命令统计信息 -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3 text-sm">
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-cyan-600">{{ platformCmdPackets.length }}</div>
            <div class="text-gray-500">命令包数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-green-600">{{ getUniqueCommandCount() }}</div>
            <div class="text-gray-500">命令类型</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-purple-600">{{ getPlatformCmdDuration() }}</div>
            <div class="text-gray-500">持续时间</div>
          </div>
        </div>

        <!-- 平台命令详细列表 (可折叠) -->
        <div v-if="showPlatformCmd" class="max-h-40 overflow-y-auto">
          <div class="text-xs text-gray-600 mb-2">最近的平台命令 (最多显示10个):</div>
          <div class="space-y-1">
            <div v-for="(cmd, index) in platformCmdPackets.slice(-10).reverse()" :key="index"
              class="bg-white rounded p-2 text-xs flex justify-between items-center">
              <div class="flex gap-4">
                <span>{{ formatTime(cmd.timestamp) }}</span>
                <span>{{ extractSourceIP(cmd.source) }}</span>
                <span v-if="cmd.parsedPacket">
                  平台: {{ cmd.parsedPacket.parsedData?.platformName || 'N/A' }}
                </span>
                <span v-if="cmd.parsedPacket">
                  命令: {{ getCommandName(cmd.parsedPacket.parsedData?.command) }}
                </span>
              </div>
              <div class="flex gap-1">
                <el-button size="small" type="success" plain
                  @click="showPacketDetail(cmd, platformCmdPackets.indexOf(cmd))">
                  详情
                </el-button>
                <el-button size="small" type="text"
                  @click="copyToClipboard(JSON.stringify(cmd.parsedPacket?.parsedData || {}, null, 2), '平台命令数据')">
                  <el-icon>
                    <DocumentCopy />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导航数据汇聚显示 -->
      <div v-if="navDataPackets.length > 0" class="bg-indigo-50 rounded-lg p-4 mb-4 border border-indigo-200">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <div class="text-indigo-700 font-semibold">🛩️ 导航数据汇聚</div>
            <el-tag size="small" type="primary">{{ navDataPackets.length }} 个</el-tag>
            <el-tag size="small" type="success" v-if="navDataPackets.length > 0">
              最新: {{ formatTime(navDataPackets[navDataPackets.length - 1].timestamp) }}
            </el-tag>
          </div>
          <div class="flex gap-2">
            <el-button size="small" @click="copyNavDataSummary">复制导航摘要</el-button>
            <el-button size="small" @click="clearNavData">清空导航数据</el-button>
            <el-button size="small" @click="showNavData = !showNavData">
              {{ showNavData ? '隐藏详情' : '显示详情' }}
            </el-button>
          </div>
        </div>

        <!-- 导航数据统计信息 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-indigo-600">{{ navDataPackets.length }}</div>
            <div class="text-gray-500">导航包数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-green-600">{{ getUavStatusCount() }}</div>
            <div class="text-gray-500">状态包数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-blue-600">{{ getRouteUploadCount() }}</div>
            <div class="text-gray-500">航线包数</div>
          </div>
          <div class="bg-white rounded p-2 text-center">
            <div class="text-lg font-bold text-purple-600">{{ getNavDataDuration() }}</div>
            <div class="text-gray-500">持续时间</div>
          </div>
        </div>

        <!-- 导航数据详细列表 (可折叠) -->
        <div v-if="showNavData" class="max-h-60 overflow-y-auto">
          <div class="text-xs text-gray-600 mb-2">最近的导航数据 (最多显示20个):</div>
          <div class="space-y-1">
            <div v-for="(navData, index) in navDataPackets.slice(-20).reverse()" :key="index"
              class="bg-white rounded p-2 text-xs flex justify-between items-center">
              <div class="flex gap-4">
                <span>{{ formatTime(navData.timestamp) }}</span>
                <span>{{ extractSourceIP(navData.source) }}</span>
                <span v-if="navData.parsedPacket">
                  <el-tag size="small" :type="getNavDataTypeTag(navData.parsedPacket.packageType)">
                    {{ getNavDataTypeName(navData.parsedPacket.packageType) }}
                  </el-tag>
                </span>
                <span v-if="navData.parsedPacket && navData.parsedPacket.packageType === 0x1">
                  UavID: {{ navData.parsedPacket.parsedData?.uavID || 'N/A' }}
                </span>
                <span v-if="navData.parsedPacket && navData.parsedPacket.packageType === 0x20">
                  UavID: {{ navData.parsedPacket.parsedData?.uavID || 'N/A' }},
                  航点: {{ navData.parsedPacket.parsedData?.wayPointSize || 0 }}个
                </span>
              </div>
              <div class="flex gap-1">
                <el-button size="small" type="success" plain
                  @click="showPacketDetail(navData, navDataPackets.indexOf(navData))">
                  详情
                </el-button>
                <el-button size="small" type="text"
                  @click="copyToClipboard(JSON.stringify(navData.parsedPacket?.parsedData || {}, null, 2), '导航数据')">
                  <el-icon>
                    <DocumentCopy />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 数据包详情弹窗 -->
  <el-dialog v-model="detailDialogVisible" :title="`数据包详情 #${selectedPacketIndex + 1}`" width="80%"
    :close-on-click-modal="false" destroy-on-close>
    <div v-if="selectedPacket" class="space-y-4">
      <!-- 基本信息 -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">📋 基本信息</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">接收时间</div>
            <div class="font-mono">{{ formatTime(selectedPacket.timestamp) }}</div>
          </div>
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">源地址</div>
            <div class="font-mono">{{ extractSourceIP(selectedPacket.source) }}</div>
          </div>
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">源端口</div>
            <div class="font-mono">{{ extractSourcePort(selectedPacket.source) }}</div>
          </div>
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">数据大小</div>
            <div class="font-mono">{{ selectedPacket.size }} 字节</div>
          </div>
        </div>
      </div>

      <!-- 解析信息 -->
      <div v-if="selectedPacket.parsedPacket" class="bg-green-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 text-green-800">✅ 解析信息</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">包类型</div>
            <div class="font-mono">{{ selectedPacket.parsedPacket.packageTypeName }}</div>
          </div>
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">类型码</div>
            <div class="font-mono">0x{{ selectedPacket.parsedPacket.packageType.toString(16).padStart(2, '0') }}</div>
          </div>
          <div class="bg-white rounded p-3">
            <div class="text-gray-500 text-xs">协议ID</div>
            <div class="font-mono">0x{{ selectedPacket.parsedPacket.protocolID.toString(16).padStart(2, '0') }}</div>
          </div>
        </div>

        <!-- 解析数据 -->
        <div class="bg-white rounded-lg p-4">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-gray-700">🔍 解析数据</h4>
            <el-button size="small" type="primary"
              @click="copyToClipboard(JSON.stringify(selectedPacket.parsedPacket.parsedData, null, 2), '解析数据')">
              复制解析数据
            </el-button>
          </div>
          <pre class="bg-gray-100 rounded p-3 text-xs overflow-auto max-h-60 font-mono">{{
            JSON.stringify(selectedPacket.parsedPacket.parsedData, null, 2) }}</pre>
        </div>
      </div>

      <!-- 未解析提示 -->
      <div v-else class="bg-yellow-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 text-yellow-800">⚠️ 未解析</h3>
        <div class="bg-white rounded p-3 text-sm">
          <div class="text-yellow-700">
            <strong>可能原因:</strong> 包格式不匹配、protobuf定义未加载或数据损坏
          </div>
        </div>
      </div>

      <!-- 原始数据 -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 text-blue-800">📦 原始数据</h3>

        <!-- 十六进制数据 -->
        <div class="bg-white rounded-lg p-4 mb-4">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-gray-700">🔢 十六进制格式</h4>
            <el-button size="small" type="primary" @click="copyToClipboard(toHex(selectedPacket.data), '十六进制数据')">
              复制十六进制
            </el-button>
          </div>
          <pre class="bg-gray-100 rounded p-3 text-xs overflow-auto max-h-40 font-mono break-all">{{
            toHex(selectedPacket.data) }}</pre>
        </div>

        <!-- Base64数据 -->
        <div class="bg-white rounded-lg p-4">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-gray-700">📝 Base64格式</h4>
            <el-button size="small" type="primary"
              @click="copyToClipboard(getBase64Data(selectedPacket.data), 'Base64数据')">
              复制Base64
            </el-button>
          </div>
          <pre class="bg-gray-100 rounded p-3 text-xs overflow-auto max-h-40 font-mono break-all">{{
            getBase64Data(selectedPacket.data) }}</pre>
        </div>
      </div>

      <!-- 完整信息 -->
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-semibold text-purple-800">📄 完整信息</h3>
          <el-button size="small" type="primary" @click="copyFullPacketInfo()">
            复制完整信息
          </el-button>
        </div>
        <div class="bg-white rounded p-3 text-xs">
          <div class="text-gray-600">包含基本信息、解析数据、原始数据的完整JSON格式</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <div class="flex gap-2">
          <el-button size="small" :disabled="selectedPacketIndex <= 0" @click="showPreviousPacket">
            ← 上一个
          </el-button>
          <el-button size="small" :disabled="selectedPacketIndex >= displayPackets.length - 1" @click="showNextPacket">
            下一个 →
          </el-button>
        </div>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
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
const packets = ref<MulticastPacket[]>([]);
const platformStatusPackets = ref<MulticastPacket[]>([]);
const platformCmdPackets = ref<MulticastPacket[]>([]);
const navDataPackets = ref<MulticastPacket[]>([]);
const showPlatformStatus = ref(false);
const showPlatformCmd = ref(false);
const showNavData = ref(false);

// 详情弹窗相关
const detailDialogVisible = ref(false);
const selectedPacket = ref<MulticastPacket | null>(null);
const selectedPacketIndex = ref(0);

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
  return platformStatusPackets.value.length;
});

const platformCmdCount = computed(() => {
  return platformCmdPackets.value.length;
});

// 显示的数据包列表（排除汇聚显示的包类型）
const displayPackets = computed(() => {
  const excludedTypes = [0x1, 0x20, 0x29, 0x2A]; // 导航状态、航线上传、平台状态、平台命令
  return packets.value.filter(p => !excludedTypes.includes(p.parsedPacket?.packageType));
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

// 获取平台控制命令名称
const getPlatformCommandName = (command: number): string => {
  const commands: Record<number, string> = {
    0: '无效命令',
    1: '传感器开启',
    2: '传感器关闭',
    3: '传感器转向',
    4: '激光照射',
    5: '停止照射',
    6: '航线规划',
    7: '目标装订',
    8: '火炮发射',
    9: '设置速度'  // 新增的速度设置命令
  };
  return commands[command] || `未知命令(${command})`;
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

// 显示数据包详情
const showPacketDetail = (packet: MulticastPacket, index: number) => {
  selectedPacket.value = packet;
  // 对于汇聚区域的数据包，我们需要在所有数据包中找到正确的索引
  const allPacketsIndex = packets.value.findIndex(p =>
    p.timestamp === packet.timestamp &&
    p.source === packet.source &&
    p.size === packet.size
  );
  selectedPacketIndex.value = allPacketsIndex >= 0 ? allPacketsIndex : index;
  detailDialogVisible.value = true;
};

// 显示上一个数据包
const showPreviousPacket = () => {
  if (selectedPacketIndex.value > 0) {
    selectedPacketIndex.value--;
    selectedPacket.value = displayPackets.value[selectedPacketIndex.value];
  }
};

// 显示下一个数据包
const showNextPacket = () => {
  if (selectedPacketIndex.value < displayPackets.value.length - 1) {
    selectedPacketIndex.value++;
    selectedPacket.value = displayPackets.value[selectedPacketIndex.value];
  }
};

// 获取Base64数据
const getBase64Data = (buffer: Buffer | Uint8Array | number[]): string => {
  if (!buffer) return '';
  return btoa(String.fromCharCode(...Array.from(buffer)));
};

// 复制完整数据包信息
const copyFullPacketInfo = () => {
  if (!selectedPacket.value) return;

  const fullInfo = {
    序号: selectedPacketIndex.value + 1,
    基本信息: {
      接收时间: formatTime(selectedPacket.value.timestamp),
      源地址: selectedPacket.value.source,
      源IP: extractSourceIP(selectedPacket.value.source),
      源端口: extractSourcePort(selectedPacket.value.source),
      数据大小: selectedPacket.value.size
    },
    解析信息: selectedPacket.value.parsedPacket ? {
      包类型: selectedPacket.value.parsedPacket.packageTypeName,
      类型码: `0x${selectedPacket.value.parsedPacket.packageType.toString(16).padStart(2, '0')}`,
      协议ID: `0x${selectedPacket.value.parsedPacket.protocolID.toString(16).padStart(2, '0')}`,
      解析数据: selectedPacket.value.parsedPacket.parsedData
    } : '未解析',
    原始数据: {
      十六进制: toHex(selectedPacket.value.data),
      Base64: getBase64Data(selectedPacket.value.data)
    },
    导出时间: new Date().toLocaleString('zh-CN')
  };

  copyToClipboard(JSON.stringify(fullInfo, null, 2), '完整数据包信息');
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
      // 复制所有解析数据（从新到旧排序）
      const parsedData = packets.value
        .filter(p => p.parsedPacket)
        .reverse()
        .map((p, index) => ({
          序号: index + 1,
          时间: formatTime(p.timestamp),
          包类型: p.parsedPacket!.packageTypeName,
          数据: p.parsedPacket!.parsedData
        }));
      copyToClipboard(JSON.stringify(parsedData, null, 2), `${parsedData.length}个解析数据包`);
      break;

    case 'all-hex':
      // 复制所有十六进制数据（从新到旧排序）
      const hexData = packets.value.slice().reverse().map((p, index) => ({
        序号: index + 1,
        时间: formatTime(p.timestamp),
        源地址: p.source,
        十六进制: toHex(p.data)
      }));
      copyToClipboard(JSON.stringify(hexData, null, 2), `${hexData.length}个数据包的十六进制数据`);
      break;

    case 'all-full':
      // 复制所有完整信息（从新到旧排序）
      const allFullData = packets.value.slice().reverse().map((p, index) => ({
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



// 平台状态相关方法
const getUniquePlatformCount = () => {
  const platforms = new Set();
  platformStatusPackets.value.forEach(p => {
    const platformData = p.parsedPacket?.parsedData?.platform;
    if (platformData && Array.isArray(platformData)) {
      platformData.forEach(platform => {
        if (platform.base?.name) {
          platforms.add(platform.base.name);
        }
      });
    }
  });
  return platforms.size;
};

const getPlatformStatusDuration = () => {
  if (platformStatusPackets.value.length < 2) return '0秒';
  const first = platformStatusPackets.value[0].timestamp;
  const last = platformStatusPackets.value[platformStatusPackets.value.length - 1].timestamp;
  const duration = Math.floor((last - first) / 1000);
  return duration > 60 ? `${Math.floor(duration / 60)}分${duration % 60}秒` : `${duration}秒`;
};

const copyPlatformStatusSummary = () => {
  const summary = {
    平台状态统计: {
      总数: platformStatusPackets.value.length,
      平台数量: getUniquePlatformCount(),
      持续时间: getPlatformStatusDuration(),
      来源列表: [...new Set(platformStatusPackets.value.map(p => extractSourceIP(p.source)))]
    },
    最近状态: platformStatusPackets.value.slice(-5).reverse().map(p => ({
      时间: formatTime(p.timestamp),
      源地址: p.source,
      平台数: p.parsedPacket?.parsedData?.platform?.length || 0
    }))
  };

  copyToClipboard(JSON.stringify(summary, null, 2), '平台状态摘要');
};

const clearPlatformStatus = () => {
  platformStatusPackets.value = [];
  ElMessage.success('平台状态已清空');
};

// 平台命令相关方法
const getUniqueCommandCount = () => {
  const commands = new Set();
  platformCmdPackets.value.forEach(p => {
    const command = p.parsedPacket?.parsedData?.command;
    if (command !== undefined) {
      commands.add(command);
    }
  });
  return commands.size;
};

const getPlatformCmdDuration = () => {
  if (platformCmdPackets.value.length < 2) return '0秒';
  const first = platformCmdPackets.value[0].timestamp;
  const last = platformCmdPackets.value[platformCmdPackets.value.length - 1].timestamp;
  const duration = Math.floor((last - first) / 1000);
  return duration > 60 ? `${Math.floor(duration / 60)}分${duration % 60}秒` : `${duration}秒`;
};

const getCommandName = (command: number) => {
  const commandNames: { [key: number]: string } = {
    0: '无效命令',
    1: '传感器开',
    2: '传感器关',
    3: '传感器转向',
    4: '激光照射',
    5: '停止照射',
    6: '航线规划',
    7: '目标装订',
    8: '火炮发射',
    9: '设置速度'
  };
  return commandNames[command] || `未知命令(${command})`;
};

const copyPlatformCmdSummary = () => {
  const summary = {
    平台命令统计: {
      总数: platformCmdPackets.value.length,
      命令类型数: getUniqueCommandCount(),
      持续时间: getPlatformCmdDuration(),
      来源列表: [...new Set(platformCmdPackets.value.map(p => extractSourceIP(p.source)))]
    },
    最近命令: platformCmdPackets.value.slice(-5).reverse().map(p => ({
      时间: formatTime(p.timestamp),
      源地址: p.source,
      平台: p.parsedPacket?.parsedData?.platformName || 'N/A',
      命令: getCommandName(p.parsedPacket?.parsedData?.command)
    }))
  };

  copyToClipboard(JSON.stringify(summary, null, 2), '平台命令摘要');
};

const clearPlatformCmd = () => {
  platformCmdPackets.value = [];
  ElMessage.success('平台命令已清空');
};

// 导航数据相关方法
const getUavStatusCount = () => {
  return navDataPackets.value.filter(p => p.parsedPacket?.packageType === 0x1).length;
};

const getRouteUploadCount = () => {
  return navDataPackets.value.filter(p => p.parsedPacket?.packageType === 0x20).length;
};

const getNavDataDuration = () => {
  if (navDataPackets.value.length < 2) return '0秒';
  const first = navDataPackets.value[0].timestamp;
  const last = navDataPackets.value[navDataPackets.value.length - 1].timestamp;
  const duration = Math.floor((last - first) / 1000);
  return duration > 60 ? `${Math.floor(duration / 60)}分${duration % 60}秒` : `${duration}秒`;
};

const getNavDataTypeName = (packageType: number) => {
  const typeNames: { [key: number]: string } = {
    0x1: '状态信息',
    0x20: '航线上传'
  };
  return typeNames[packageType] || `未知(0x${packageType.toString(16)})`;
};

const getNavDataTypeTag = (packageType: number) => {
  const tagTypes: { [key: number]: string } = {
    0x1: 'success',
    0x20: 'primary'
  };
  return tagTypes[packageType] || 'info';
};

const copyNavDataSummary = () => {
  const summary = {
    导航数据统计: {
      总数: navDataPackets.value.length,
      状态包数: getUavStatusCount(),
      航线包数: getRouteUploadCount(),
      持续时间: getNavDataDuration(),
      来源列表: [...new Set(navDataPackets.value.map(p => extractSourceIP(p.source)))]
    },
    最近数据: navDataPackets.value.slice(-10).reverse().map(p => ({
      时间: formatTime(p.timestamp),
      源地址: p.source,
      类型: getNavDataTypeName(p.parsedPacket?.packageType || 0),
      UavID: p.parsedPacket?.parsedData?.uavID,
      数据: p.parsedPacket?.parsedData
    })),
    统计时间: new Date().toLocaleString('zh-CN')
  };

  copyToClipboard(JSON.stringify(summary, null, 2), '导航数据摘要');
};

const clearNavData = () => {
  navDataPackets.value = [];
  ElMessage.success('导航数据已清空');
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
  platformStatusPackets.value = [];
  platformCmdPackets.value = [];
  navDataPackets.value = [];
  ElMessage.success('数据已清空');
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
        packets: packets.value.slice().reverse().map(packet => ({
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



// 监听数据包
const handlePacket = (packet: MulticastPacket) => {
  const packageType = packet.parsedPacket?.packageType;

  // 根据包类型进行归拢处理
  if (packageType === 0x02) {
    // 心跳包 (PackType_HeartbeatInternal) - 跳过处理，不解析不展示
    return;
  } else if (packageType === 0x1) {
    // 无人机状态信息 (UavFlyStatusInfo) - 系统向导航软件同步
    navDataPackets.value.push(packet);

    // 保留最近的50条导航数据
    if (navDataPackets.value.length > 50) {
      navDataPackets.value = navDataPackets.value.slice(-50);
    }
  } else if (packageType === 0x20) {
    // 航线上传信息 (UavRouteUpload) - 导航软件发送回系统
    navDataPackets.value.push(packet);

    // 保留最近的50条导航数据
    if (navDataPackets.value.length > 50) {
      navDataPackets.value = navDataPackets.value.slice(-50);
    }
  } else if (packageType === 0x29) {
    // 平台状态包 (PackageType_PlatformStatus)
    platformStatusPackets.value.push(packet);

    // 只保留最近的10条平台状态
    if (platformStatusPackets.value.length > 10) {
      platformStatusPackets.value = platformStatusPackets.value.slice(-10);
    }
  } else if (packageType === 0x2A) {
    // 平台命令包 (PackageType_PlatformCommand)
    platformCmdPackets.value.push(packet);

    // 只保留最近的10条平台命令
    if (platformCmdPackets.value.length > 10) {
      platformCmdPackets.value = platformCmdPackets.value.slice(-10);
    }
  } else {
    // 其他类型的包正常显示
    packets.value.push(packet);
  }
};

// 监听错误
const handleError = (error: string) => {
  ElMessage.error(`组播错误: ${error}`);
};



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