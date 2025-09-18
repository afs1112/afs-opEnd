<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- 顶部选择区域 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">平台选择</h3>
      <div class="grid grid-cols-5 gap-4">
        <!-- 平台选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">平台</label>
          <el-select v-model="selectedPlatform" placeholder="选择平台" @change="onPlatformChange" class="w-full">
            <el-option v-for="platform in platforms" :key="platform.name" :label="platform.name"
              :value="platform.name" />
          </el-select>
        </div>

        <!-- 通信组件选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">通信组件</label>
          <el-select v-model="selectedComm" placeholder="选择通信组件" class="w-full" :disabled="!selectedPlatform">
            <el-option v-for="comm in currentComms" :key="comm.name" :label="comm.name" :value="comm.name" />
          </el-select>
        </div>

        <!-- 传感器选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">传感器</label>
          <el-select v-model="selectedSensor" placeholder="选择传感器" class="w-full" :disabled="!selectedPlatform">
            <el-option v-for="sensor in currentSensors" :key="sensor.name" :label="sensor.name" :value="sensor.name" />
          </el-select>
        </div>

        <!-- 武器选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">武器</label>
          <el-select v-model="selectedWeapon" placeholder="选择武器" class="w-full" :disabled="!selectedPlatform">
            <el-option v-for="weapon in currentWeapons" :key="weapon.name" :label="weapon.name" :value="weapon.name" />
          </el-select>
        </div>

        <!-- 目标选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">目标</label>
          <el-select v-model="selectedTarget" placeholder="选择目标" class="w-full" :disabled="!selectedPlatform">
            <el-option v-for="track in currentTracks" :key="track.targetName" :label="track.targetName"
              :value="track.targetName" />
          </el-select>
        </div>

      </div>

      <!-- UavId设置区域 -->
      <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">
              UavId设置 
              <span class="text-xs text-gray-500">(系统: {{ systemUavId || '未设置' }})</span>
            </label>
            <div class="flex gap-2">
              <el-input 
                v-model="currentUavId" 
                placeholder="输入4位数ID" 
                style="width: 120px"
                maxlength="4"
                @input="validateUavId"
              />
              <el-button size="small" @click="generateNewUavId" title="生成新ID">
                🎲
              </el-button>
              <el-button size="small" @click="syncUavId" title="同步到系统"
                :disabled="!currentUavId || currentUavId.length !== 4">
                🔄
              </el-button>
              <el-button size="small" @click="loadSystemUavId" title="从系统加载">
                📥
              </el-button>
            </div>
          </div>
          <div class="text-xs" :class="uavIdSyncStatus.color">
            {{ uavIdSyncStatus.message }}
          </div>
        </div>
      </div>

      <!-- 当前选择信息显示 -->
      <div class="mt-4 p-3 bg-gray-50 rounded-lg">
        <div class="text-sm text-gray-600">
          <span class="font-medium">当前选择：</span>
          平台: {{ selectedPlatform || '未选择' }} |
          通信: {{ selectedComm || '未选择' }} |
          传感器: {{ selectedSensor || '未选择' }} |
          武器: {{ selectedWeapon || '未选择' }} |
          目标: {{ selectedTarget || '未选择' }} |
          UavId: {{ currentUavId || '未设置' }}
        </div>
      </div>
    </div>

    <!-- 命令控制区域 -->
    <div class="bg-white rounded-lg shadow-md p-6 flex-1">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">平台命令控制</h3>

      <div class="grid grid-cols-3 gap-6">
        <!-- 传感器控制命令 -->
        <div class="border rounded-lg p-4">
          <h4 class="font-medium text-gray-700 mb-3">传感器控制</h4>
          <div class="space-y-2">
            <div class="text-xs text-gray-500 mb-2">
              当前传感器: {{ selectedSensor || '未选择' }}
              <span v-if="selectedSensor" class="ml-2 px-2 py-1 rounded text-xs"
                :class="isLaserSensor ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'">
                {{ getCurrentSensorType() }}
              </span>
            </div>
            <el-button type="primary" @click="sendSensorCommand('Uav_Sensor_On')"
              :disabled="!selectedPlatform || !selectedSensor" class="w-full">
              传感器开启
            </el-button>
            <el-button type="warning" @click="sendSensorCommand('Uav_Sensor_Off')"
              :disabled="!selectedPlatform || !selectedSensor" class="w-full">
              传感器关闭
            </el-button>
            <el-button type="info" @click="showSensorParamDialog('Uav_Sensor_Turn')"
              :disabled="!selectedPlatform || !selectedSensor" class="w-full">
              传感器转向
            </el-button>
          </div>
        </div>

        <!-- 激光功能命令 -->
        <div class="border rounded-lg p-4">
          <h4 class="font-medium text-gray-700 mb-3">激光功能</h4>
          <div class="space-y-2">
            <div class="text-xs text-gray-500 mb-2">
              {{ isLaserSensor ? '激光传感器已选择' : '需要选择激光传感器' }}
            </div>
            <el-button type="success" @click="sendLaserCommand('Uav_LazerPod_Lasing')"
              :disabled="!selectedPlatform || !selectedSensor || !isLaserSensor" class="w-full">
              激光照射
            </el-button>
            <el-button type="danger" @click="sendLaserCommand('Uav_LazerPod_Cease')"
              :disabled="!selectedPlatform || !selectedSensor || !isLaserSensor" class="w-full">
              停止照射
            </el-button>
          </div>
        </div>

        <!-- 导航命令 -->
        <div class="border rounded-lg p-4">
          <h4 class="font-medium text-gray-700 mb-3">导航控制</h4>
          <div class="space-y-2">
            <el-button type="primary" @click="showNavParamDialog()" :disabled="!selectedPlatform" class="w-full">
              航线规划
            </el-button>
            <el-button type="success" @click="showSetSpeedDialog()" :disabled="!selectedPlatform" class="w-full">
              设置速度
            </el-button>
            <el-button type="info" @click="openNavigation" class="w-full">
              打开导航软件
            </el-button>
            <el-button :type="isSyncingTrajectory ? 'danger' : 'warning'" @click="toggleTrajectorySync"
              :disabled="!selectedPlatform" class="w-full">
              {{ isSyncingTrajectory ? '停止同步' : '同步轨迹' }}
            </el-button>
          </div>
        </div>

        <!-- 火炮命令 -->
        <div class="border rounded-lg p-4">
          <h4 class="font-medium text-gray-700 mb-3">火炮控制</h4>
          <div class="space-y-2">
            <el-button type="success" @click="showTargetSetDialog()" :disabled="!selectedPlatform || !selectedTarget"
              class="w-full">
              目标装订
            </el-button>
            <el-button type="danger" @click="showFireParamDialog()"
              :disabled="!selectedPlatform || !selectedWeapon || !selectedTarget" class="w-full">
              火炮发射
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 命令历史和状态 -->
    <div class="bg-white rounded-lg shadow-md p-6" style="height: 200px;">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">命令历史</h3>
      <div class="h-32 overflow-y-auto bg-gray-50 rounded p-3 text-sm">
        <div v-for="(log, index) in commandLogs" :key="index" class="mb-1">
          <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
          <span class="ml-2" :class="getLogColor(log.type)">{{ log.message }}</span>
        </div>
        <div v-if="commandLogs.length === 0" class="text-gray-400 text-center py-4">
          暂无命令记录
        </div>
      </div>
    </div>

    <!-- 传感器参数对话框 -->
    <el-dialog v-model="sensorParamDialogVisible" title="传感器控制参数" width="400px">
      <el-form :model="sensorParamForm" label-width="100px">
        <el-form-item label="传感器名称">
          <el-input v-model="sensorParamForm.sensorName" :value="selectedSensor" disabled />
        </el-form-item>
        <el-form-item label="传感器类型">
          <el-input :value="getCurrentSensorType()" disabled />
        </el-form-item>
        <el-form-item label="方位角">
          <el-input-number v-model="sensorParamForm.azSlew" :min="-180" :max="180" :step="0.1" class="w-full" />
        </el-form-item>
        <el-form-item label="俯仰角">
          <el-input-number v-model="sensorParamForm.elSlew" :min="-90" :max="90" :step="0.1" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sensorParamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendSensorParamCommand">确定</el-button>
      </template>
    </el-dialog>

    <!-- 火力参数对话框 -->
    <el-dialog v-model="fireParamDialogVisible" title="火力控制参数" width="400px">
      <el-form :model="fireParamForm" label-width="100px">
        <el-form-item label="武器名称">
          <el-input v-model="fireParamForm.weaponName" :value="selectedWeapon" disabled />
        </el-form-item>
        <el-form-item label="目标名称">
          <el-input v-model="fireParamForm.targetName" :value="selectedTarget" disabled />
        </el-form-item>
        <el-form-item label="发射次数">
          <el-input-number v-model="fireParamForm.quantity" :min="1" :max="100" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fireParamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendFireCommand">确定</el-button>
      </template>
    </el-dialog>

    <!-- 目标装订对话框 -->
    <el-dialog v-model="targetSetDialogVisible" title="目标装订参数" width="400px">
      <el-form :model="targetSetForm" label-width="100px">
        <el-form-item label="目标名称">
          <el-input v-model="targetSetForm.targetName" :value="selectedTarget" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="targetSetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendTargetSetCommand">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导航参数对话框 -->
    <el-dialog v-model="navParamDialogVisible" title="航线规划参数" width="600px">
      <div class="mb-4">
        <el-button type="primary" @click="addWaypoint">添加航点</el-button>
        <el-button type="warning" @click="clearWaypoints">清空航点</el-button>
      </div>
      <el-table :data="navParamForm.route" style="width: 100%">
        <el-table-column prop="labelName" label="航点名称" width="120">
          <template #default="{ row, $index }">
            <el-input v-model="row.labelName" placeholder="航点名称" />
          </template>
        </el-table-column>
        <el-table-column prop="longitude" label="经度" width="120">
          <template #default="{ row, $index }">
            <el-input v-model="row.longitude" placeholder="116.397428" />
          </template>
        </el-table-column>
        <el-table-column prop="latitude" label="纬度" width="120">
          <template #default="{ row, $index }">
            <el-input v-model="row.latitude" placeholder="39.90923" />
          </template>
        </el-table-column>
        <el-table-column prop="altitude" label="高度(m)" width="100">
          <template #default="{ row, $index }">
            <el-input v-model="row.altitude" placeholder="100" />
          </template>
        </el-table-column>
        <el-table-column prop="speed" label="速度(m/s)" width="100">
          <template #default="{ row, $index }">
            <el-input v-model="row.speed" placeholder="10" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row, $index }">
            <el-button type="danger" size="small" @click="removeWaypoint($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="navParamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendNavCommand">确定</el-button>
      </template>
    </el-dialog>

    <!-- 速度设置对话框 -->
    <el-dialog v-model="setSpeedDialogVisible" title="无人机速度设置" width="400px">
      <el-form :model="setSpeedForm" label-width="100px">
        <el-form-item label="平台名称">
          <el-input :value="selectedPlatform" disabled />
        </el-form-item>
        <el-form-item label="目标速度">
          <el-input-number v-model="setSpeedForm.speed" :min="1" :max="100" :step="1" class="w-full" />
          <div class="text-xs text-gray-500 mt-1">单位: m/s，范围: 1-100</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setSpeedDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendSetSpeedCommand">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

interface Platform {
  name: string;
  type: string;
  side: string;
  group: string;
  base:Object;
  comms: Array<{ name: string; type: string; }>;
  sensors: Array<{ name: string; type: string; }>;
  weapons: Array<{ name: string; type: string; quantity: number; }>;
  tracks: Array<{ sensorName: string; targetName: string; targetType: string; }>;
}

interface CommandLog {
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// 响应式数据
const platforms = ref<Platform[]>([]);
const selectedPlatform = ref<string>('');
const selectedComm = ref<string>('');
const selectedSensor = ref<string>('');
const selectedWeapon = ref<string>('');
const selectedTarget = ref<string>('');
const currentUavId = ref<string>('');
const systemUavId = ref<string>('');
const commandLogs = ref<CommandLog[]>([]);

// 轨迹同步状态
const isSyncingTrajectory = ref<boolean>(false);
const syncTimer = ref<NodeJS.Timeout | null>(null);
const hasRealPlatformData = ref<boolean>(false);

// UavId同步状态
const uavIdSyncStatus = reactive({
  message: '输入4位数字自动同步',
  color: 'text-gray-500'
});

// 对话框状态
const sensorParamDialogVisible = ref(false);
const fireParamDialogVisible = ref(false);
const targetSetDialogVisible = ref(false);
const navParamDialogVisible = ref(false);
const setSpeedDialogVisible = ref(false);

// 表单数据
const sensorParamForm = reactive({
  sensorName: '',
  azSlew: 0,
  elSlew: 0
});

const fireParamForm = reactive({
  weaponName: '',
  targetName: '',
  quantity: 1
});

const targetSetForm = reactive({
  targetName: ''
});

const navParamForm = reactive({
  route: [] as Array<{
    longitude: string;
    latitude: string;
    altitude: string;
    labelName: string;
    speed: string;
  }>
});

const setSpeedForm = reactive({
  speed: 10
});

// 当前命令
const currentCommand = ref<string>('');

// 计算属性
const currentComms = computed(() => {
  const platform = platforms.value.find(p => p.name === selectedPlatform.value);
  return platform?.comms || [];
});

const currentSensors = computed(() => {
  const platform = platforms.value.find(p => p.name === selectedPlatform.value);
  return platform?.sensors || [];
});

const currentWeapons = computed(() => {
  const platform = platforms.value.find(p => p.name === selectedPlatform.value);
  return platform?.weapons || [];
});

const currentTracks = computed(() => {
  // 忽略前提限制，展示所有 side=blue 的 platform 作为目标
  return platforms.value
    .filter(p => p.side?.toLowerCase() === 'blue')
    .map(p => ({
      sensorName: 'All',
      targetName: p.name,
      targetType: p.type
    }));
});

// 判断当前选择的传感器是否为激光传感器
const isLaserSensor = computed(() => {
  const platform = platforms.value.find(p => p.name === selectedPlatform.value);
  const sensor = platform?.sensors.find(s => s.name === selectedSensor.value);
  return sensor?.type?.toLowerCase().includes('laser') || sensor?.name?.toLowerCase().includes('laser') || false;
});

// 获取当前传感器类型
const getCurrentSensorType = () => {
  const platform = platforms.value.find(p => p.name === selectedPlatform.value);
  const sensor = platform?.sensors.find(s => s.name === selectedSensor.value);
  return sensor?.type || '未知';
};

// 方法
const onPlatformChange = () => {
  // 清空其他选择
  selectedComm.value = '';
  selectedSensor.value = '';
  selectedWeapon.value = '';
  selectedTarget.value = '';

  addLog('info', `选择平台: ${selectedPlatform.value}`);
};

const addLog = (type: CommandLog['type'], message: string) => {
  commandLogs.value.unshift({
    timestamp: Date.now(),
    type,
    message
  });

  // 保持最多50条记录
  if (commandLogs.value.length > 50) {
    commandLogs.value.pop();
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const getLogColor = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-600';
    case 'warning': return 'text-orange-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-700';
  }
};

// 平台命令枚举映射（根据新的proto定义）
const PlatformCommandEnum: { [key: string]: number } = {
  'Command_inValid': 0,
  'Uav_Sensor_On': 1,      // 传感器开
  'Uav_Sensor_Off': 2,     // 传感器关
  'Uav_Sensor_Turn': 3,    // 传感器转向
  'Uav_LazerPod_Lasing': 4, // 激光吊舱照射
  'Uav_LazerPod_Cease': 5,  // 激光吊舱停止照射
  'Uav_Nav': 6,            // 无人机航线规划
  'Arty_Target_Set': 7,    // 目标装订
  'Arty_Fire': 8,          // 火炮发射
  'Uav_Set_Speed': 9       // 设定无人机速度
};

// 命令发送方法
const sendCommand = async (command: string) => {
  try {
    const commandEnum = PlatformCommandEnum[command];
    if (commandEnum === undefined) {
      throw new Error(`未知命令: ${command}`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: selectedPlatform.value,
      command: commandEnum  // 使用枚举值而不是字符串
    };

    addLog('info', `发送命令: ${command} (${commandEnum}) 到平台 ${selectedPlatform.value}`);
    console.log('发送命令数据:', commandData);

    // 发送组播命令
    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `命令 ${command} 发送成功`);
      ElMessage.success(`命令发送成功: ${command}`);
    } else {
      addLog('error', `命令 ${command} 发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 传感器命令发送（不带参数）
const sendSensorCommand = async (command: string) => {
  try {
    const commandEnum = PlatformCommandEnum[command];
    if (commandEnum === undefined) {
      throw new Error(`未知传感器命令: ${command}`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: selectedPlatform.value,
      command: commandEnum,
      sensorParam: {
        sensorName: selectedSensor.value,
        azSlew: 0,  // 开关命令不需要角度参数
        elSlew: 0
      }
    };

    addLog('info', `发送传感器命令: ${command} 到传感器 ${selectedSensor.value}`);
    console.log('发送传感器命令数据:', commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `传感器命令 ${command} 发送成功`);
      ElMessage.success(`传感器命令发送成功: ${command}`);
    } else {
      addLog('error', `传感器命令 ${command} 发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送传感器命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 激光命令发送
const sendLaserCommand = async (command: string) => {
  try {
    const commandEnum = PlatformCommandEnum[command];
    if (commandEnum === undefined) {
      throw new Error(`未知激光命令: ${command}`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: selectedPlatform.value,
      command: commandEnum,
      sensorParam: {
        sensorName: selectedSensor.value,
        azSlew: 0,
        elSlew: 0
      }
    };

    addLog('info', `发送激光命令: ${command} 到传感器 ${selectedSensor.value}`);
    console.log('发送激光命令数据:', commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `激光命令 ${command} 发送成功`);
      ElMessage.success(`激光命令发送成功: ${command}`);
    } else {
      addLog('error', `激光命令 ${command} 发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送激光命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 传感器参数对话框
const showSensorParamDialog = (command: string) => {
  currentCommand.value = command;
  sensorParamForm.sensorName = selectedSensor.value;
  sensorParamForm.azSlew = 0;
  sensorParamForm.elSlew = 0;
  sensorParamDialogVisible.value = true;
};

const sendSensorParamCommand = async () => {
  try {
    const commandEnum = PlatformCommandEnum[currentCommand.value];
    if (commandEnum === undefined) {
      throw new Error(`未知传感器命令: ${currentCommand.value}`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: String(selectedPlatform.value),
      command: Number(commandEnum),  // 使用枚举值
      sensorParam: {
        sensorName: String(sensorParamForm.sensorName),  // 使用sensorName而不是weaponName
        azSlew: Number(sensorParamForm.azSlew),
        elSlew: Number(sensorParamForm.elSlew)
      }
    };

    addLog('info', `发送传感器转向命令: ${currentCommand.value}, 传感器: ${sensorParamForm.sensorName}, 方位角: ${sensorParamForm.azSlew}°, 俯仰角: ${sensorParamForm.elSlew}°`);
    console.log('发送传感器转向命令数据:', commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `传感器转向命令发送成功`);
      ElMessage.success('传感器转向命令发送成功');
      sensorParamDialogVisible.value = false;
    } else {
      addLog('error', `传感器转向命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送传感器转向命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 火力参数对话框
const showFireParamDialog = () => {
  fireParamForm.weaponName = selectedWeapon.value;
  fireParamForm.targetName = selectedTarget.value;
  fireParamForm.quantity = 1;
  fireParamDialogVisible.value = true;
};

const sendFireCommand = async () => {
  try {
    const commandEnum = PlatformCommandEnum['Arty_Fire'];

    const commandData = {
      commandID: Date.now(),
      platformName: String(selectedPlatform.value),
      command: Number(commandEnum),  // 使用枚举值
      fireParam: {
        weaponName: String(fireParamForm.weaponName),
        targetName: String(fireParamForm.targetName),
        quantity: Number(fireParamForm.quantity)
      }
    };

    addLog('info', `发送火力命令: 武器 ${fireParamForm.weaponName} 攻击目标 ${fireParamForm.targetName}, 发射 ${fireParamForm.quantity} 次`);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `火力命令发送成功`);
      ElMessage.success('火力命令发送成功');
      fireParamDialogVisible.value = false;
    } else {
      addLog('error', `火力命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送火力命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 目标装订对话框
const showTargetSetDialog = () => {
  targetSetForm.targetName = selectedTarget.value;
  targetSetDialogVisible.value = true;
};

const sendTargetSetCommand = async () => {
  try {
    const commandEnum = PlatformCommandEnum['Arty_Target_Set'];

    const commandData = {
      commandID: Date.now(),
      platformName: String(selectedPlatform.value),
      command: Number(commandEnum),  // 使用枚举值
      targetSetParam: {
        targetName: String(targetSetForm.targetName)
      }
    };

    addLog('info', `发送目标装订命令: 目标 ${targetSetForm.targetName}`);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `目标装订命令发送成功`);
      ElMessage.success('目标装订命令发送成功');
      targetSetDialogVisible.value = false;
    } else {
      addLog('error', `目标装订命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送目标装订命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 导航参数对话框
const showNavParamDialog = () => {
  navParamForm.route = [];
  navParamDialogVisible.value = true;
};

const addWaypoint = () => {
  navParamForm.route.push({
    longitude: '116.397428',
    latitude: '39.90923',
    altitude: '100',
    labelName: `航点${navParamForm.route.length + 1}`,
    speed: '10'
  });
};

const removeWaypoint = (index: number) => {
  navParamForm.route.splice(index, 1);
};

const clearWaypoints = () => {
  navParamForm.route = [];
};

const sendNavCommand = async () => {
  try {
    if (navParamForm.route.length === 0) {
      ElMessage.warning('请至少添加一个航点');
      return;
    }

    const commandEnum = PlatformCommandEnum['Uav_Nav'];

    // 深度克隆航点数据，避免传递响应式对象
    const routeData = navParamForm.route.map(waypoint => ({
      longitude: Number(waypoint.longitude),
      latitude: Number(waypoint.latitude),
      altitude: Number(waypoint.altitude),
      labelName: String(waypoint.labelName),
      speed: Number(waypoint.speed)
    }));

    const commandData = {
      commandID: Date.now(),
      platformName: selectedPlatform.value,
      command: commandEnum,  // 使用枚举值
      navParam: {
        route: routeData
      }
    };

    addLog('info', `发送导航命令: ${navParamForm.route.length} 个航点`);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `导航命令发送成功`);
      ElMessage.success('导航命令发送成功');
      navParamDialogVisible.value = false;
    } else {
      addLog('error', `导航命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送导航命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 速度设置对话框
const showSetSpeedDialog = () => {
  setSpeedForm.speed = 10; // 默认速度
  setSpeedDialogVisible.value = true;
};

const sendSetSpeedCommand = async () => {
  try {
    const commandEnum = PlatformCommandEnum['Uav_Set_Speed'];

    const commandData = {
      commandID: Date.now(),
      platformName: String(selectedPlatform.value),
      command: Number(commandEnum),
      setSpeedParam: {
        speed: Number(setSpeedForm.speed)
      }
    };

    addLog('info', `发送速度设置命令: 平台 ${selectedPlatform.value} 设置速度为 ${setSpeedForm.speed} m/s`);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(commandData);

    if (result.success) {
      addLog('success', `速度设置命令发送成功`);
      ElMessage.success('速度设置命令发送成功');
      setSpeedDialogVisible.value = false;
    } else {
      addLog('error', `速度设置命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送速度设置命令失败: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
  }
};

// UavId相关方法
const validateUavId = (value: string) => {
  // 只允许数字输入
  const numericValue = value.replace(/\D/g, '');
  if (numericValue.length <= 4) {
    currentUavId.value = numericValue;
    
    // 更新同步状态显示
    updateSyncStatus();
    
    // 双向绑定：当输入4位数字时自动同步到系统UavId (异步执行，不阻塞输入)
    if (numericValue.length === 4) {
      autoSyncToSystem(numericValue);
    }
  }
};

// 自动同步到系统 (异步执行，不阻塞UI)
const autoSyncToSystem = async (uavId: string) => {
  try {
    await (window as any).electronAPI.uav.setCurrentId(uavId, '测试页面手动设置');
    systemUavId.value = uavId;
    console.log(`[UavId双向绑定] 已同步到系统: ${uavId}`);
    addLog('info', `UavId已自动同步: ${uavId}`);
    updateSyncStatus();
  } catch (error) {
    console.error('[UavId双向绑定] 同步失败:', error);
    updateSyncStatus();
  }
};

const generateNewUavId = async () => {
  try {
    const result = await (window as any).electronAPI.uav.generateId();
    if (result.success) {
      currentUavId.value = result.uavId;
      systemUavId.value = result.uavId;
      addLog('success', `生成新的UavId: ${result.uavId}`);
      ElMessage.success(`新UavId已生成: ${result.uavId}`);

      // 设置为当前ID
      await (window as any).electronAPI.uav.setCurrentId(result.uavId, '手动生成');
      updateSyncStatus();
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

const loadCurrentUavId = async () => {
  try {
    const result = await (window as any).electronAPI.uav.getCurrentId();
    if (result.success && result.uavId) {
      currentUavId.value = result.uavId;
      systemUavId.value = result.uavId;
      updateSyncStatus();
    }
  } catch (error) {
    console.error('加载当前UavId失败:', error);
  }
};

// 手动同步UavId到系统
const syncUavId = async () => {
  if (!currentUavId.value || currentUavId.value.length !== 4) {
    ElMessage.warning('请输入4位数字的UavId');
    return;
  }

  try {
    await (window as any).electronAPI.uav.setCurrentId(currentUavId.value, '测试页面手动设置');
    systemUavId.value = currentUavId.value;
    updateSyncStatus();
    addLog('success', `UavId已手动同步: ${currentUavId.value}`);
    ElMessage.success(`UavId已同步到系统: ${currentUavId.value}`);
  } catch (error: any) {
    addLog('error', `UavId同步失败: ${error.message}`);
    ElMessage.error(`同步失败: ${error.message}`);
  }
};

// 从系统加载UavId
const loadSystemUavId = async () => {
  try {
    const result = await (window as any).electronAPI.uav.getCurrentId();
    if (result.success && result.uavId) {
      currentUavId.value = result.uavId;
      systemUavId.value = result.uavId;
      updateSyncStatus();
      addLog('info', `从系统加载UavId: ${result.uavId}`);
      ElMessage.success(`已从系统加载UavId: ${result.uavId}`);
    } else {
      ElMessage.warning('系统中没有设置UavId');
    }
  } catch (error: any) {
    addLog('error', `加载系统UavId失败: ${error.message}`);
    ElMessage.error(`加载失败: ${error.message}`);
  }
};

// 更新同步状态显示
const updateSyncStatus = () => {
  if (!currentUavId.value) {
    uavIdSyncStatus.message = '输入4位数字自动同步';
    uavIdSyncStatus.color = 'text-gray-500';
  } else if (currentUavId.value.length !== 4) {
    uavIdSyncStatus.message = '需要4位数字';
    uavIdSyncStatus.color = 'text-orange-500';
  } else if (currentUavId.value === systemUavId.value) {
    uavIdSyncStatus.message = '✓ 已同步';
    uavIdSyncStatus.color = 'text-green-500';
  } else {
    uavIdSyncStatus.message = '⚠ 未同步到系统';
    uavIdSyncStatus.color = 'text-red-500';
  }
};

// 打开导航软件
const openNavigation = async () => {
  try {
    addLog('info', '正在准备启动导航软件...');
    const result = await (window as any).electronAPI.nav.openNavigation();

    if (result.success) {
      if (result.uavId) {
        addLog('success', `导航软件启动成功，使用UavId: ${result.uavId}`);
        ElMessage.success(`导航软件已启动，UavId: ${result.uavId}`);
      } else {
        addLog('success', '导航软件启动成功');
        ElMessage.success('导航软件已启动');
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

// 切换轨迹同步状态
const toggleTrajectorySync = () => {
  if (isSyncingTrajectory.value) {
    stopTrajectorySync();
  } else {
    startTrajectorySync();
  }
};

// 开始轨迹同步
const startTrajectorySync = async () => {
  try {
    if (!selectedPlatform.value) {
      ElMessage.warning('请先选择平台');
      return;
    }

    if (!hasRealPlatformData.value) {
      ElMessage.warning('请等待接收到真实的平台状态数据后再启动轨迹同步');
      addLog('warning', '尚未接收到真实平台数据，无法启动轨迹同步');
      return;
    }

    // 验证UavId
    let uavId = 0;
    if (currentUavId.value) {
      uavId = parseInt(currentUavId.value);
    } else {
      // 如果没有编辑的UavId，尝试从系统获取
      const uavIdResult = await (window as any).electronAPI.uav.getCurrentId();
      if (uavIdResult.success && uavIdResult.uavId) {
        uavId = parseInt(uavIdResult.uavId);
        currentUavId.value = uavIdResult.uavId;
      } else {
        ElMessage.warning('请先设置UavId或点击生成按钮');
        return;
      }
    }

    isSyncingTrajectory.value = true;
    addLog('info', `开始持续同步平台 ${selectedPlatform.value} 的轨迹数据，UavId: ${uavId}`);
    ElMessage.success(`轨迹同步已启动，UavId: ${uavId}`);

    // 立即发送一次
    await sendTrajectoryData();

    // 设置定时器，每2秒发送一次
    syncTimer.value = setInterval(async () => {
      await sendTrajectoryData();
    }, 2000);

  } catch (error: any) {
    const errorMsg = `启动轨迹同步时发生错误: ${error.message}`;
    addLog('error', errorMsg);
    ElMessage.error(errorMsg);
    isSyncingTrajectory.value = false;
  }
};

// 停止轨迹同步
const stopTrajectorySync = () => {
  if (syncTimer.value) {
    clearInterval(syncTimer.value);
    syncTimer.value = null;
  }

  isSyncingTrajectory.value = false;
  addLog('info', `停止轨迹同步`);
  ElMessage.info('轨迹同步已停止');
};

// 发送轨迹数据
const sendTrajectoryData = async () => {
  try {
    if (!selectedPlatform.value || !currentUavId.value) {
      return;
    }

    // 获取当前选择的平台数据
    const platform = platforms.value.find(p => p.name === selectedPlatform.value);
    if (!platform) {
      console.log('[轨迹同步] 未找到平台数据，跳过本次发送');
      return;
    }

    // 检查平台是否有真实的基础数据（包含位置信息）
    if (!platform.base || !platform.base.location) {
      console.log('[轨迹同步] 平台缺少位置数据，跳过本次发送');
      return;
    }

    const uavId = parseInt(currentUavId.value);

    // 将响应式对象转换为普通对象，避免IPC序列化问题
    const platformDataPlain = JSON.parse(JSON.stringify(platform));

    // 发送轨迹同步数据，传递平台数据用于提取位置和姿态信息
    const result = await (window as any).electronAPI.multicast.syncTrajectoryWithPlatformData({
      platformName: selectedPlatform.value,
      uavId: uavId,
      platformData: platformDataPlain
    });

    if (result.success) {
      console.log(`[轨迹同步] 发送成功，UavId: ${uavId}`);
    } else {
      console.error(`[轨迹同步] 发送失败: ${result.error}`);
    }
  } catch (error: any) {
    console.error(`[轨迹同步] 发送数据时发生错误: ${error.message}`);
  }
};

// 处理接收到的平台状态数据
const handlePlatformStatus = (packet: any) => {
  try {
    console.log('[CommandTestPage] 收到组播数据包:', packet);

    // 检查是否有解析后的protobuf数据
    if (packet.parsedPacket) {
      console.log('[CommandTestPage] 数据包类型:', `0x${packet.parsedPacket.packageType.toString(16)} (${packet.parsedPacket.packageTypeName})`);
    } else {
      console.log('[CommandTestPage] 数据包未解析或解析失败');
    }

    if (packet.parsedPacket && packet.parsedPacket.packageType === 0x29) {
      const parsedData = packet.parsedPacket.parsedData;
      console.log('解析到平台状态数据:', parsedData);

      if (parsedData && parsedData.platform && Array.isArray(parsedData.platform)) {
        // 更新平台列表
        const newPlatforms: Platform[] = parsedData.platform.map((platformData: any) => {
          const base = platformData.base || {};
          const comms = (platformData.comms || []).map((comm: any) => ({
            name: comm.base?.name || 'Unknown',
            type: comm.base?.type || 'Unknown'
          }));
          const sensors = (platformData.sensors || []).map((sensor: any) => ({
            name: sensor.base?.name || 'Unknown',
            type: sensor.base?.type || 'Unknown'
          }));
          const weapons = (platformData.weapons || []).map((weapon: any) => ({
            name: weapon.base?.name || 'Unknown',
            type: weapon.base?.type || 'Unknown',
            quantity: weapon.quantity || 0
          }));
          const tracks = (platformData.tracks || []).map((track: any) => ({
            sensorName: track.sensorName || 'Unknown',
            targetName: track.targetName || 'Unknown',
            targetType: track.targetType || 'Unknown'
          }));

          return {
            name: base.name || 'Unknown',
            type: base.type || 'Unknown',
            side: base.side || 'Unknown',
            group: base.group || 'Unknown',
            base:base,
            comms,
            sensors,
            weapons,
            tracks
          };
        });

        platforms.value = newPlatforms;
        hasRealPlatformData.value = true; // 标记已接收到真实平台数据
        addLog('success', `更新平台数据: ${newPlatforms.length} 个平台`);

        console.log('[CommandTestPage] 平台列表已更新:', platforms.value);
        console.log('[CommandTestPage] 当前平台选项:', newPlatforms.map(p => p.name));
      }
    } else {
      console.log('[CommandTestPage] 非平台状态数据包，跳过处理');
    }
  } catch (error) {
    console.error('[CommandTestPage] 解析平台状态数据失败:', error);
    addLog('error', `解析平台数据失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 初始化空的平台数据，等待真实数据
const initMockData = () => {
  platforms.value = [];
  hasRealPlatformData.value = false;
  addLog('info', '等待接收平台状态数据...');
};

// 组件挂载
onMounted(() => {
  initMockData();
  loadCurrentUavId();

  // 监听组播数据
  console.log('[CommandTestPage] 设置组播数据监听');
  (window as any).electronAPI.multicast.onPacket(handlePlatformStatus);

  // 监听航线转换消息
  (window as any).electronAPI.ipcRenderer.on('route:converted', (_, data: any) => {
    addLog('success', `航线已转换: UAV-${data.uavId}, ${data.waypointCount}个航点`);
    ElMessage.success(`航线转换成功！UAV-${data.uavId} 包含${data.waypointCount}个航点`);
    console.log('[CommandTestPage] 航线转换成功:', data);
  });

  (window as any).electronAPI.ipcRenderer.on('route:convertError', (_, data: any) => {
    addLog('error', `航线转换失败: ${data.error}`);
    ElMessage.error(`航线转换失败: ${data.error}`);
    console.error('[CommandTestPage] 航线转换失败:', data);
  });

  // 监听UavId不匹配消息
  (window as any).electronAPI.ipcRenderer.on('route:uavIdMismatch', (_, data: any) => {
    addLog('warning', `航线UavId不匹配: 系统${data.systemUavId} vs 航线${data.routeUavId}`);
    ElMessage.warning(`航线UavId不匹配！系统UavId: ${data.systemUavId}, 航线UavId: ${data.routeUavId}`);
    console.log('[CommandTestPage] UavId不匹配:', data);
  });

  // 监听未选择平台消息
  (window as any).electronAPI.ipcRenderer.on('route:noPlatformSelected', (_, data: any) => {
    addLog('warning', `接收到航线数据但未选择平台，UavId: ${data.uavId}`);
    ElMessage.warning(`请先选择平台后再接收航线数据！UavId: ${data.uavId}`);
    console.log('[CommandTestPage] 未选择平台:', data);
  });

  // 监听平台名称请求（保持向后兼容）
  (window as any).electronAPI.ipcRenderer.on('route:requestSelectedPlatform', () => {
    console.log('[CommandTestPage] 收到平台名称请求，当前选择:', selectedPlatform.value);
    
    // 响应当前选择的平台名称
    (window as any).electronAPI.ipcRenderer.send('route:selectedPlatformResponse', selectedPlatform.value);
  });

  // 监听导航软件启动事件，自动更新UavId显示
  (window as any).electronAPI.ipcRenderer.on('nav:uavIdUpdated', (_, data: any) => {
    console.log('[CommandTestPage] 导航软件启动，UavId已更新:', data.uavId);
    currentUavId.value = data.uavId;
    systemUavId.value = data.uavId;
    updateSyncStatus();
    addLog('info', `导航软件启动，UavId已更新: ${data.uavId}`);
    ElMessage.info(`导航软件已启动，UavId已更新为: ${data.uavId}`);
  });

  // 监听平台数据请求
  (window as any).electronAPI.ipcRenderer.on('route:requestSelectedPlatformData', () => {
    console.log('[CommandTestPage] 收到平台数据请求，当前选择:', selectedPlatform.value);
    
    // 获取当前选择平台的完整数据
    const currentPlatform = platforms.value.find(p => p.name === selectedPlatform.value);
    const platformData = {
      name: selectedPlatform.value || '',
      speed: currentPlatform?.base?.speed || undefined
    };
    
    console.log('[CommandTestPage] 响应平台数据:', platformData);
    
    // 响应当前选择的平台数据
    (window as any).electronAPI.ipcRenderer.send('route:selectedPlatformDataResponse', platformData);
  });

  addLog('info', '命令测试页面已加载，开始监听组播数据');
  console.log('[CommandTestPage] 页面已挂载，初始平台数据:', platforms.value.map(p => p.name));
});

// 组件卸载
onUnmounted(() => {
  // 清理轨迹同步定时器
  if (syncTimer.value) {
    clearInterval(syncTimer.value);
    syncTimer.value = null;
  }

  (window as any).electronAPI.multicast.removeAllListeners('multicast:packet');
});
</script>

<style scoped>
.el-form-item {
  margin-bottom: 12px;
}

.el-table {
  font-size: 12px;
}

.el-input-number {
  width: 100%;
}
</style>