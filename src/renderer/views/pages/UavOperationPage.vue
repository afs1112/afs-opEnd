<template>
  <div class="flex h-full p-4 gap-4">
    <!-- 左侧控制面板 -->
    <div class="w-1/3 flex flex-col gap-4">
      <!-- UavId 管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">UavId 管理</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">当前ID:</span>
            <span class="text-lg font-bold text-blue-600">{{ currentUavId || '未设置' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">导航状态:</span>
            <span class="text-sm font-medium" :class="navStatus.isRunning ? 'text-green-600' : 'text-gray-500'">
              {{ navStatus.isRunning ? `运行中 (PID: ${navStatus.pid})` : '未运行' }}
            </span>
          </div>
          <div class="flex gap-2">
            <el-button size="small" @click="generateNewUavId" class="flex-1">
              生成新ID
            </el-button>
            <el-button size="small" @click="showUavIdHistory" class="flex-1">
              历史记录
            </el-button>
          </div>
          <div class="text-xs text-gray-500 text-center">
            启动导航软件时会自动生成并配置ID
          </div>
        </div>
      </div>

      <!-- 无人机状态 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">无人机状态</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold" :class="uavStatus.isConnected ? 'text-green-600' : 'text-red-600'">
              {{ uavStatus.isConnected ? '已连接' : '未连接' }}
            </div>
            <div class="text-sm text-gray-500">连接状态</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ uavStatus.battery }}%</div>
            <div class="text-sm text-gray-500">电池电量</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ uavStatus.altitude }}m</div>
            <div class="text-sm text-gray-500">飞行高度</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ uavStatus.speed }}m/s</div>
            <div class="text-sm text-gray-500">飞行速度</div>
          </div>
        </div>
      </div>

      <!-- 飞行控制 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">飞行控制</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <el-button type="success" @click="takeOff" :disabled="!uavStatus.isConnected || uavStatus.isFlying">
              起飞
            </el-button>
            <el-button type="warning" @click="land" :disabled="!uavStatus.isFlying">
              降落
            </el-button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <el-button type="info" @click="hover" :disabled="!uavStatus.isFlying">
              悬停
            </el-button>
            <el-button type="danger" @click="emergencyStop">
              紧急停止
            </el-button>
          </div>
        </div>
      </div>

      <!-- 飞行参数设置 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">飞行参数</h3>
        <div class="space-y-4">
          <el-form-item label="目标高度 (m)">
            <el-input-number 
              v-model="flightParams.targetAltitude" 
              :min="0" 
              :max="1000"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="飞行速度 (m/s)">
            <el-input-number 
              v-model="flightParams.speed" 
              :min="0.1" 
              :max="20"
              :step="0.1"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="航向角 (°)">
            <el-input-number 
              v-model="flightParams.heading" 
              :min="0" 
              :max="360"
              style="width: 100%"
            />
          </el-form-item>
          <el-button type="primary" @click="setFlightParams" class="w-full">
            设置参数
          </el-button>
        </div>
      </div>

      <!-- 任务控制 -->
      <div class="bg-white rounded-lg shadow-md p-6 flex-1">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">任务控制</h3>
        <div class="space-y-2">
          <el-button type="primary" @click="startMission" class="w-full" :disabled="!uavStatus.isConnected">
            开始任务
          </el-button>
          <el-button type="warning" @click="pauseMission" class="w-full">
            暂停任务
          </el-button>
          <el-button type="info" @click="resumeMission" class="w-full">
            恢复任务
          </el-button>
          <el-button type="danger" @click="abortMission" class="w-full">
            终止任务
          </el-button>
          <el-button @click="returnToHome" class="w-full">
            返航
          </el-button>
          <el-button type="success" @click="openNavigation" class="w-full" :disabled="navStatus.isRunning">
            {{ navStatus.isRunning ? '导航软件运行中' : '打开导航软件' }}
          </el-button>
          <el-button type="danger" @click="stopNavigation" class="w-full" :disabled="!navStatus.isRunning">
            停止导航软件
          </el-button>
        </div>
      </div>
    </div>

    <!-- 右侧显示区域 -->
    <div class="flex-1 flex flex-col gap-4">
      <!-- 实时数据显示 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">实时飞行数据</h3>
        <div class="grid grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-700">位置信息</div>
            <div class="mt-2 space-y-1">
              <div class="text-sm">经度: {{ uavStatus.position.longitude }}°</div>
              <div class="text-sm">纬度: {{ uavStatus.position.latitude }}°</div>
              <div class="text-sm">高度: {{ uavStatus.position.altitude }}m</div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-700">姿态信息</div>
            <div class="mt-2 space-y-1">
              <div class="text-sm">俯仰角: {{ uavStatus.attitude.pitch }}°</div>
              <div class="text-sm">横滚角: {{ uavStatus.attitude.roll }}°</div>
              <div class="text-sm">偏航角: {{ uavStatus.attitude.yaw }}°</div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-700">速度信息</div>
            <div class="mt-2 space-y-1">
              <div class="text-sm">前向速度: {{ uavStatus.velocity.x }}m/s</div>
              <div class="text-sm">右向速度: {{ uavStatus.velocity.y }}m/s</div>
              <div class="text-sm">下向速度: {{ uavStatus.velocity.z }}m/s</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 地图显示区域 -->
      <div class="bg-white rounded-lg shadow-md p-6 flex-1">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">飞行路径</h3>
        <div class="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div class="text-center text-gray-500">
            <div class="text-6xl mb-4">🗺️</div>
            <div class="text-lg">地图显示区域</div>
            <div class="text-sm">(待实现)</div>
          </div>
        </div>
      </div>

      <!-- 日志区域 -->
      <div class="bg-white rounded-lg shadow-md p-6" style="height: 200px;">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">操作日志</h3>
        <div class="h-32 overflow-y-auto bg-gray-50 rounded p-3 text-sm">
          <div v-for="(log, index) in operationLogs" :key="index" class="mb-1">
            <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
            <span class="ml-2" :class="getLogColor(log.type)">{{ log.message }}</span>
          </div>
          <div v-if="operationLogs.length === 0" class="text-gray-400 text-center py-4">
            暂无操作记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface UavStatus {
  isConnected: boolean;
  isFlying: boolean;
  battery: number;
  altitude: number;
  speed: number;
  position: {
    longitude: number;
    latitude: number;
    altitude: number;
  };
  attitude: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
}

interface FlightParams {
  targetAltitude: number;
  speed: number;
  heading: number;
}

interface OperationLog {
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const uavStatus = reactive<UavStatus>({
  isConnected: false,
  isFlying: false,
  battery: 85,
  altitude: 0,
  speed: 0,
  position: {
    longitude: 116.397428,
    latitude: 39.90923,
    altitude: 0
  },
  attitude: {
    pitch: 0,
    roll: 0,
    yaw: 0
  },
  velocity: {
    x: 0,
    y: 0,
    z: 0
  }
});

const flightParams = reactive<FlightParams>({
  targetAltitude: 50,
  speed: 5.0,
  heading: 0
});

const operationLogs = ref<OperationLog[]>([]);
const currentUavId = ref<string>('');

// 导航软件状态
const navStatus = ref({
  isRunning: false,
  pid: null as number | null,
  startTime: null as number | null,
  uptime: null as number | null
});

// 添加操作日志
const addLog = (type: OperationLog['type'], message: string) => {
  operationLogs.value.unshift({
    timestamp: Date.now(),
    type,
    message
  });
  // 保持最多50条记录
  if (operationLogs.value.length > 50) {
    operationLogs.value.pop();
  }
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

// 获取日志颜色类
const getLogColor = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-600';
    case 'warning': return 'text-orange-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-700';
  }
};

// 飞行控制函数
const takeOff = () => {
  addLog('info', '执行起飞指令');
  ElMessage.success('起飞指令已发送');
  // TODO: 实际的起飞逻辑
};

const land = () => {
  addLog('info', '执行降落指令');
  ElMessage.success('降落指令已发送');
  // TODO: 实际的降落逻辑
};

const hover = () => {
  addLog('info', '执行悬停指令');
  ElMessage.success('悬停指令已发送');
  // TODO: 实际的悬停逻辑
};

const emergencyStop = () => {
  addLog('error', '执行紧急停止');
  ElMessage.error('紧急停止指令已发送');
  // TODO: 实际的紧急停止逻辑
};

const setFlightParams = () => {
  addLog('success', `设置飞行参数 - 高度:${flightParams.targetAltitude}m, 速度:${flightParams.speed}m/s, 航向:${flightParams.heading}°`);
  ElMessage.success('飞行参数已设置');
  // TODO: 实际的参数设置逻辑
};

// 任务控制函数
const startMission = () => {
  addLog('info', '开始执行任务');
  ElMessage.success('任务已开始');
  // TODO: 实际的任务开始逻辑
};

const pauseMission = () => {
  addLog('warning', '暂停任务');
  ElMessage.warning('任务已暂停');
  // TODO: 实际的任务暂停逻辑
};

const resumeMission = () => {
  addLog('info', '恢复任务');
  ElMessage.success('任务已恢复');
  // TODO: 实际的任务恢复逻辑
};

const abortMission = () => {
  addLog('error', '终止任务');
  ElMessage.error('任务已终止');
  // TODO: 实际的任务终止逻辑
};

const returnToHome = () => {
  addLog('info', '执行返航指令');
  ElMessage.success('返航指令已发送');
  // TODO: 实际的返航逻辑
};

// UavId 相关函数
const loadCurrentUavId = async () => {
  try {
    const result = await (window as any).electronAPI.uav.getCurrentId();
    if (result.success) {
      currentUavId.value = result.uavId;
    }
  } catch (error) {
    console.error('加载当前UavId失败:', error);
  }
};

const generateNewUavId = async () => {
  try {
    const result = await (window as any).electronAPI.uav.generateId();
    if (result.success) {
      currentUavId.value = result.uavId;
      addLog('success', `生成新的UavId: ${result.uavId}`);
      ElMessage.success(`新UavId已生成: ${result.uavId}`);
      
      // 设置为当前ID
      await (window as any).electronAPI.uav.setCurrentId(result.uavId, '手动生成');
    } else {
      addLog('error', `生成UavId失败: ${result.error}`);
      ElMessage.error(`生成失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `生成UavId时发生错误: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

const showUavIdHistory = async () => {
  try {
    const result = await (window as any).electronAPI.uav.getHistory();
    if (result.success) {
      const history = result.history || [];
      if (history.length === 0) {
        ElMessage.info('暂无历史记录');
        return;
      }
      
      const historyText = history
        .slice(0, 10) // 只显示最近10条
        .map((record: any) => {
          const date = new Date(record.generatedAt).toLocaleString();
          const used = record.usedAt ? ' (已使用)' : '';
          return `${record.id} - ${date}${used}`;
        })
        .join('\n');
      
      ElMessageBox.alert(historyText, 'UavId 历史记录', {
        confirmButtonText: '确定'
      });
    } else {
      ElMessage.error(`获取历史记录失败: ${result.error}`);
    }
  } catch (error: any) {
    ElMessage.error(`获取历史记录时发生错误: ${error.message}`);
  }
};

const openNavigation = async () => {
  try {
    addLog('info', '正在检查导航软件状态...');
    const result = await (window as any).electronAPI.nav.openNavigation();
    
    if (result.success) {
      if (result.uavId) {
        currentUavId.value = result.uavId;
        
        if (result.isNewProcess) {
          addLog('success', `导航软件启动成功，PID: ${result.pid}，使用UavId: ${result.uavId}`);
          ElMessage.success(`导航软件已启动，UavId: ${result.uavId}`);
        } else {
          addLog('info', `导航软件已在运行，PID: ${result.pid}，已恢复到前台，UavId: ${result.uavId}`);
          ElMessage.info(`导航软件已恢复到前台，UavId: ${result.uavId}`);
        }
      } else {
        addLog('success', result.message || '导航软件处理成功');
        ElMessage.success(result.message || '导航软件已就绪');
      }
    } else {
      addLog('error', `导航软件启动失败: ${result.error}`);
      ElMessage.error(`启动失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `启动导航软件时发生错误: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 获取导航软件状态
const loadNavStatus = async () => {
  try {
    const result = await (window as any).electronAPI.nav.getStatus();
    if (result.success) {
      navStatus.value = result.status;
    }
  } catch (error) {
    console.error('获取导航状态失败:', error);
  }
};

// 停止导航软件
const stopNavigation = async () => {
  try {
    addLog('info', '正在停止导航软件...');
    const result = await (window as any).electronAPI.nav.stopNavigation();
    
    if (result.success) {
      addLog('success', '导航软件已停止');
      ElMessage.success('导航软件已停止');
      await loadNavStatus(); // 更新状态
    } else {
      addLog('error', `停止导航软件失败: ${result.error}`);
      ElMessage.error(`停止失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `停止导航软件时发生错误: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 监听导航软件启动事件，自动更新UavId显示
const handleNavUavIdUpdated = (data: any) => {
  console.log('[UavOperationPage] 导航软件启动，UavId已更新:', data.uavId);
  currentUavId.value = data.uavId;
  addLog('info', `导航软件启动，UavId已更新: ${data.uavId}`);
  ElMessage.info(`导航软件已启动，UavId已更新为: ${data.uavId}`);
  
  // 更新导航状态
  loadNavStatus();
};

// 组件挂载时加载当前UavId并设置事件监听
onMounted(() => {
  loadCurrentUavId();
  loadNavStatus();
  
  // 监听导航启动事件
  (window as any).electronAPI.ipcRenderer.on('nav:uavIdUpdated', (_, data: any) => {
    handleNavUavIdUpdated(data);
  });
  
  // 定期更新导航状态
  const statusInterval = setInterval(loadNavStatus, 5000);
  
  // 保存定时器引用以便清理
  (window as any).__navStatusInterval = statusInterval;
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if ((window as any).__navStatusInterval) {
    clearInterval((window as any).__navStatusInterval);
  }
});
</script>

<style scoped>
.el-form-item {
  margin-bottom: 12px;
}
</style>