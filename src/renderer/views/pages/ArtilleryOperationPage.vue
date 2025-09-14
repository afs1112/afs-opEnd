<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- 顶部连接区域 -->
    <div class="bg-white rounded-lg shadow-md p-4">
      <div class="flex items-center gap-4">
        <span class="text-lg font-semibold text-gray-800">操作模式-火炮</span>
        <el-select v-model="selectedGroup" placeholder="选择组" style="width: 120px;">
          <el-option label="组1" value="group1" />
          <el-option label="组2" value="group2" />
          <el-option label="组3" value="group3" />
        </el-select>
        <el-select v-model="selectedInstance" placeholder="选择实例" style="width: 120px;">
          <el-option label="火炮1" value="artillery1" />
          <el-option label="火炮2" value="artillery2" />
          <el-option label="火炮3" value="artillery3" />
        </el-select>
        <el-input v-model="operatorName" placeholder="操作人" style="width: 120px;" />
        <el-button type="primary" @click="connectToSimulation" :disabled="connectionStatus.isConnected">
          {{ connectionStatus.isConnected ? '已连接' : '连接' }}
        </el-button>
        <div class="ml-auto">
          <span class="text-sm" :class="connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'">
            {{ connectionStatus.isConnected ? '● 已连接到仿真端' : '○ 未连接' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 中间操作区域 -->
    <div class="flex gap-4 flex-1">
      <!-- 左侧操作面板 -->
      <div class="w-1/2 flex flex-col gap-4">
        <!-- 装填弹药操作 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">装填-穿甲弹</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-xl font-bold text-blue-600">{{ ammunitionCount }}</div>
                <div class="text-sm text-gray-500">弹药数量</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold" :class="artilleryStatus.isLoaded ? 'text-green-600' : 'text-orange-600'">
                  {{ artilleryStatus.isLoaded ? '已装填' : '未装填' }}
                </div>
                <div class="text-sm text-gray-500">装填状态</div>
              </div>
            </div>
            <el-button 
              type="primary" 
              @click="loadAmmunition" 
              class="w-full" 
              size="large"
              :disabled="!connectionStatus.isConnected || artilleryStatus.isLoaded"
            >
              装填弹药
            </el-button>
          </div>
        </div>

        <!-- 发射操作 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">发射 (发射后自动发射防空报文给无人机)</h3>
          <div class="space-y-4">
            <!-- 武器和目标输入框 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">武器名称</label>
                <el-input 
                  v-model="weaponName" 
                  placeholder="输入武器名称"
                  size="small"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">目标名称</label>
                <el-input 
                  v-model="targetName" 
                  placeholder="输入目标名称"
                  size="small"
                />
              </div>
            </div>
            
            <div class="text-center p-4 bg-gray-50 rounded">
              <div class="text-sm text-gray-600 mb-2">目标: 无人机编号 {{ targetDroneId }}</div>
              <div class="text-sm text-gray-600">状态: {{ fireStatus }}</div>
            </div>
            <el-button 
              type="danger" 
              @click="fireAtDrone" 
              class="w-full" 
              size="large"
              :disabled="!connectionStatus.isConnected || !artilleryStatus.isLoaded || !weaponName || !targetName"
            >
              发射
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧状态面板 -->
      <div class="w-1/2 bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">状态面板</h3>
        <div class="space-y-4">
          <div class="p-4 bg-gray-50 rounded">
            <div class="text-sm font-semibold text-gray-700 mb-2">环境状态</div>
            <div class="text-sm text-gray-600 space-y-1">
              <div>温度: {{ environment.temperature }}°C</div>
              <div>湿度: {{ environment.humidity }}%</div>
              <div>风速: {{ environment.windSpeed }}m/s</div>
              <div>能见度: {{ environment.visibility }}km</div>
            </div>
          </div>
          
          <div class="p-4 bg-gray-50 rounded">
            <div class="text-sm font-semibold text-gray-700 mb-2">目标状态</div>
            <div class="text-sm text-gray-600 space-y-1">
              <div>目标类型: {{ targetInfo.type }}</div>
              <div>距离: {{ targetInfo.distance }}m</div>
              <div>方位: {{ targetInfo.bearing }}°</div>
              <div>高度: {{ targetInfo.altitude }}m</div>
            </div>
          </div>
          
          <div class="p-4 bg-gray-50 rounded">
            <div class="text-sm font-semibold text-gray-700 mb-2">火炮状态</div>
            <div class="text-sm text-gray-600 space-y-1">
              <div>炮管温度: {{ artilleryStatus.temperature }}°C</div>
              <div>射击准备: {{ artilleryStatus.isReady ? '就绪' : '未就绪' }}</div>
              <div>系统状态: {{ artilleryStatus.systemStatus }}</div>
            </div>
          </div>
          
          <div class="p-4 bg-gray-50 rounded">
            <div class="text-sm font-semibold text-gray-700 mb-2">无人机打击协同状态</div>
            <div class="text-sm text-gray-600 space-y-1">
              <div>协同模式: {{ coordinationStatus.mode }}</div>
              <div>数据链状态: {{ coordinationStatus.dataLink }}</div>
              <div>目标共享: {{ coordinationStatus.targetSharing }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部文档浏览区域 -->
    <div class="bg-white rounded-lg shadow-md p-6" style="height: 200px;">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">任务文档</h3>
        <el-button @click="openDocument" size="small">
          打开文档
        </el-button>
      </div>
      <div class="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div class="text-center text-gray-500">
          <div class="text-4xl mb-2">📄</div>
          <div class="text-lg">展示文档内容 (支持doc, docx格式)</div>
          <div class="text-sm">点击"打开文档"浏览任务相关文件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

// 连接状态接口
interface ConnectionStatus {
  isConnected: boolean;
  simulationEndpoint: string;
}

// 火炮状态接口
interface ArtilleryStatus {
  isReady: boolean;
  isLoaded: boolean;
  temperature: number;
  systemStatus: string;
}

// 目标信息接口
interface TargetInfo {
  type: string;
  distance: number;
  bearing: number;
  altitude: number;
}

// 环境状态接口
interface Environment {
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

// 协同状态接口
interface CoordinationStatus {
  mode: string;
  dataLink: string;
  targetSharing: string;
}

// 响应式数据
const selectedGroup = ref('group1');
const selectedInstance = ref('artillery1');
const operatorName = ref('');
const ammunitionCount = ref(12);
const targetDroneId = ref('UAV-001');
const fireStatus = ref('待发射');
const weaponName = ref('155毫米榆弹炮'); // 武器名称，默认值
const targetName = ref('无人机-001'); // 目标名称，默认值

const connectionStatus = reactive<ConnectionStatus>({
  isConnected: false,
  simulationEndpoint: ''
});

const artilleryStatus = reactive<ArtilleryStatus>({
  isReady: false,
  isLoaded: false,
  temperature: 32,
  systemStatus: '正常'
});

const targetInfo = reactive<TargetInfo>({
  type: '无人机',
  distance: 3200,
  bearing: 45,
  altitude: 1200
});

const environment = reactive<Environment>({
  temperature: 25,
  humidity: 65,
  windSpeed: 3.2,
  visibility: 12
});

const coordinationStatus = reactive<CoordinationStatus>({
  mode: '自主协同',
  dataLink: '正常',
  targetSharing: '已共享'
});

// 连接到仿真端
const connectToSimulation = () => {
  if (!selectedGroup.value || !selectedInstance.value) {
    ElMessage.warning('请选择组和实例');
    return;
  }
  
  ElMessage.success(`正在连接到 ${selectedGroup.value} - ${selectedInstance.value}`);
  connectionStatus.isConnected = true;
  connectionStatus.simulationEndpoint = `${selectedGroup.value}/${selectedInstance.value}`;
  artilleryStatus.isReady = true;
  
  // TODO: 实际的连接逻辑
};

// 装填弹药
const loadAmmunition = () => {
  if (ammunitionCount.value <= 0) {
    ElMessage.error('弹药不足');
    return;
  }
  
  ElMessage.success('穿甲弹装填完成');
  artilleryStatus.isLoaded = true;
  ammunitionCount.value--;
  
  // TODO: 实际的装填逻辑
};

// 发射火炮
const fireAtDrone = async () => {
  try {
    // 检查必要参数
    if (!weaponName.value.trim()) {
      ElMessage.warning('请输入武器名称');
      return;
    }
    
    if (!targetName.value.trim()) {
      ElMessage.warning('请输入目标名称');
      return;
    }

    ElMessage.success(`向目标 ${targetName.value} 发射 ${weaponName.value}`);
    artilleryStatus.isLoaded = false;
    fireStatus.value = '发射中...';
    
    // 构造 PlatformCmd 数据
    const platformCmdData = {
      commandID: Date.now(), // 使用时间戳作为命令ID
      platformName: selectedInstance.value || 'artillery1', // 平台名称
      command: 8, // Arty_Fire = 8 (根据更新后的 PlatformCmd.proto)
      fireParam: {
        weaponName: weaponName.value.trim(),
        targetName: targetName.value.trim(),
        quantity: 1
      }
    };

    console.log('发送 PlatformCmd 数据:', platformCmdData);
    
    // 发送 PlatformCmd 组播消息
    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(platformCmdData);
    
    if (result.success) {
      ElMessage.success('🚀 火炮控制命令发送成功');
      fireStatus.value = '已发射';
      
      // 模拟发射后自动发送防空报文
      setTimeout(() => {
        ElMessage.info('已自动发送防空报文给无人机');
        fireStatus.value = '防空报文已发送';
      }, 1000);
      
      // 重置状态
      setTimeout(() => {
        fireStatus.value = '待发射';
        // 模拟目标变化
        targetDroneId.value = `UAV-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
        // 清空输入框，准备下次操作
        // weaponName.value = '';
        // targetName.value = '';
      }, 3000);
      
    } else {
      ElMessage.error(`发送失败: ${result.error}`);
      fireStatus.value = '发送失败';
      artilleryStatus.isLoaded = true; // 恢复装填状态
    }
    
  } catch (error) {
    console.error('发射操作失败:', error);
    ElMessage.error('发射操作失败');
    fireStatus.value = '操作失败';
    artilleryStatus.isLoaded = true; // 恢复装填状态
  }
  
  // TODO: 实际的发射逻辑和防空报文发送
};

// 打开文档
const openDocument = () => {
  ElMessage.info('打开任务文档功能待实现');
  // TODO: 实现打开Word文档的功能
};
</script>

<style scoped>
.el-form-item {
  margin-bottom: 12px;
}
</style>