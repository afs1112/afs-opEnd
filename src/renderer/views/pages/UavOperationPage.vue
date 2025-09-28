<template>
  <div class="uav-operation-page h-full p-4">
    <!-- 顶部控制区域 -->
    <div class="top-section mb-4">
      <div class="top-content">
        <!-- 操作按钮区域 -->
        <div class="control-area">
          <div class="control-row">
            <!-- 左侧标题区域 -->
            <div class="title-section">
              <div class="seat-title">
                无人机席位
                <span v-if="isConnected" class="connected-info"
                  >：已连接 {{ selectedUav }}</span
                >
              </div>
            </div>

            <!-- 中间演习时间 -->
            <div class="exercise-time" v-if="isConnected">
              演习时间：{{ environmentParams.exerciseTime }}
            </div>

            <!-- 右侧控制区域 -->
            <div class="controls-section">
              <el-select
                v-model="selectedGroup"
                placeholder="选择分组"
                class="control-select short"
                @change="handleSelectGroup"
                clearable
              >
                <el-option
                  v-for="group in groupOptions"
                  :key="group.value"
                  :label="group.label"
                  :value="group.value"
                />
              </el-select>
              <el-select
                v-model="selectedUav"
                placeholder="选择无人机"
                class="control-select large"
                @change="handleSelectUav"
                :disabled="!selectedGroup"
                clearable
              >
                <el-option
                  v-for="uav in uavOptions"
                  :key="uav.value"
                  :label="uav.label"
                  :value="uav.value"
                />
              </el-select>
              <el-button
                class="control-btn"
                @click="handleConnectPlatform"
                :type="isConnected ? 'warning' : 'primary'"
              >
                {{ isConnected ? "断开" : "连接平台" }}
              </el-button>
              <!-- 功能分隔符 -->
              <div class="function-separator" v-if="isConnected"></div>
              <el-button class="control-btn" @click="openDocument"
                >演练方案</el-button
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content flex gap-4 flex-1">
      <!-- 左侧控制面板 -->
      <div class="left-panel">
        <!-- 任务控制 -->
        <div class="task-control">
          <div class="task-header">任务控制</div>

          <!-- 航线规划 -->
          <div class="control-group">
            <div class="button-row">
              <el-button
                class="route-planning-btn"
                @click="handleRoutePlanning"
              >
                航线规划
              </el-button>
              <el-button
                class="trajectory-sync-btn"
                :type="isSyncingTrajectory ? 'danger' : 'warning'"
                @click="toggleTrajectorySync"
                :disabled="!isConnected"
              >
                {{ isSyncingTrajectory ? "停止同步" : "同步轨迹" }}
              </el-button>
            </div>
          </div>
          <div class="control-separator"></div>
          <!-- 光电吊舱控制 -->
          <div class="control-group">
            <div class="control-item">
              <span class="control-label">光电吊舱控制</span>
              <div class="control-switch">
                <span class="switch-label">关</span>
                <el-switch
                  v-model="optoElectronicPodEnabled"
                  class="mx-2"
                  @change="onOptoElectronicToggle"
                />
                <span class="switch-label">开</span>
              </div>
            </div>

            <div class="control-item">
              <span class="control-label">激光吊舱控制</span>
              <div class="control-switch">
                <span class="switch-label">关</span>
                <el-switch
                  v-model="laserPodEnabled"
                  class="mx-2"
                  @change="onLaserToggle"
                />
                <span class="switch-label">开</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="action-buttons">
            <!-- 激光编码输入 -->
            <div class="input-group mb-2">
              <div class="input-wrapper">
                <el-input
                  v-model="laserCode"
                  placeholder="请输入激光编码"
                  :disabled="!isLaserCodeEditing"
                  class="laser-input"
                  @keyup.enter="handleInputLaserCode"
                  @input="handleLaserCodeInput"
                />
                <el-button
                  class="confirm-btn"
                  @click="handleInputLaserCode"
                  :type="isLaserCodeEditing ? 'primary' : 'default'"
                >
                  {{ isLaserCodeEditing ? "确定" : "编辑" }}
                </el-button>
              </div>
            </div>

            <!-- 激光倒计时输入 -->
            <div class="input-group mb-2">
              <div class="input-wrapper">
                <el-input
                  v-model="laserCountdown"
                  placeholder="请输入倒计时(秒)"
                  :disabled="!isCountdownEditing"
                  class="laser-input"
                  @keyup.enter="handleSetLaserCountdown"
                  @input="handleCountdownInput"
                />
                <el-button
                  class="confirm-btn"
                  @click="handleSetLaserCountdown"
                  :type="isCountdownEditing ? 'primary' : 'default'"
                >
                  {{ isCountdownEditing ? "确定" : "编辑" }}
                </el-button>
              </div>
            </div>

            <div class="button-row mb-2">
              <el-button
                class="action-btn"
                @click="handleIrradiate"
                :type="isIrradiating ? 'danger' : 'primary'"
              >
                <span v-if="isIrradiating"
                  >照射 ({{ irradiationCountdown }})</span
                >
                <span v-else>照射</span>
              </el-button>
              <el-button class="action-btn" @click="handleStop">停止</el-button>
            </div>

            <!-- 转向按钮 -->
            <div class="button-row mb-2">
              <el-button class="action-btn full-width-btn" @click="handleTurn"
                >转向</el-button
              >
            </div>

            <!-- 照射控制与目标控制分隔符 -->
            <div class="control-separator"></div>

            <!-- 目标选择 -->
            <div class="input-group mb-2">
              <div class="target-select-wrapper">
                <span class="target-label">选择目标：</span>
                <el-select
                  v-model="selectedTarget"
                  :placeholder="
                    isConnected ? '选择要锁定的目标' : '请先连接平台'
                  "
                  class="target-select"
                  :disabled="!isConnected || targetOptions.length === 0"
                  clearable
                >
                  <el-option
                    v-for="target in targetOptions"
                    :key="target.value"
                    :label="target.label"
                    :value="target.value"
                  >
                    <template #default>
                      <div class="target-option">
                        <span class="target-name">{{ target.label }}</span>
                        <span v-if="target.targetType" class="target-type">{{
                          target.targetType
                        }}</span>
                      </div>
                    </template>
                  </el-option>
                </el-select>
              </div>
              <!-- 目标状态提示 -->
              <div v-if="isConnected" class="target-status-hint">
                <span
                  v-if="targetOptions.length === 0"
                  class="text-gray-500 text-xs"
                >
                  当前平台未跟踪到目标
                </span>
                <span v-else class="text-green-600 text-xs">
                  可选目标: {{ targetOptions.length }} 个
                </span>
              </div>
            </div>

            <!-- 锁定目标按钮 -->
            <div class="button-row">
              <el-button
                class="action-btn full-width-btn"
                @click="handleLockTarget"
                :disabled="
                  !isConnected || !selectedTarget || targetOptions.length === 0
                "
              >
                锁定目标
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧状态显示区域 -->
      <div class="right-panel flex flex-col gap-4">
        <!-- 气候环境 -->
        <div class="status-card environment-status">
          <div class="status-content">
            <div class="status-title">气候环境</div>
            <div class="status-info">
              温度{{ environmentParams.temperature }}，气压{{
                environmentParams.pressure
              }}<br />
              风力{{ environmentParams.windSpeed }}，降水{{
                environmentParams.humidity
              }}<br />
              云层{{ environmentParams.cloudCover }}
            </div>
          </div>
        </div>

        <!-- 平台状态 -->
        <div class="status-card platform-status">
          <div class="status-content">
            <div class="status-title">平台状态</div>
            <div class="status-info">
              位置：{{ platformStatus.position.longitude }}
              {{ platformStatus.position.latitude }}
              {{ platformStatus.position.altitude }}<br />
              姿态：俯仰{{ platformStatus.attitude.pitch }} 横滚{{
                platformStatus.attitude.roll
              }}
              偏航{{ platformStatus.attitude.yaw }}
            </div>
          </div>
        </div>

        <!-- 载荷状态 -->
        <div class="status-card payload-status">
          <div class="status-content">
            <div class="status-title">载荷状态</div>
            <div class="status-info">
              光电载荷：开关{{
                payloadStatus.optoElectronic.isTurnedOn ? "开启" : "关闭"
              }}，俯仰{{ payloadStatus.optoElectronic.currentEl }}°，方位{{
                payloadStatus.optoElectronic.currentAz
              }}°<br />
              激光载荷：开关{{
                payloadStatus.laser.isTurnedOn ? "开启" : "关闭"
              }}，俯仰{{ payloadStatus.laser.currentEl }}°，方位{{
                payloadStatus.laser.currentAz
              }}°
            </div>
          </div>
        </div>

        <!-- 目标状态 -->
        <div class="status-card target-status">
          <div class="status-content">
            <div class="status-title">目标状态</div>
            <div class="status-info">
              名称：{{ targetStatus.name }}<br />
              位置：{{ targetStatus.position.longitude }}
              {{ targetStatus.position.latitude }}<br />
              高度：{{ targetStatus.position.altitude }}<br />
              是否摧毁：{{ targetStatus.destroyed ? "是" : "否" }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部协同报文区域 -->
    <div class="bottom-panel mt-4">
      <div class="report-header">
        <el-button
          class="report-send-btn"
          @click="handleSendCooperationCommand"
          :disabled="!isConnected || !selectedTarget"
        >
          发送打击协同指令{{
            selectedTarget
              ? `（目标: ${
                  targetOptions.find((t) => t.value === selectedTarget)
                    ?.label || selectedTarget
                }）`
              : "（请先选择目标）"
          }}
        </el-button>
        <span class="report-title">报文面板</span>
      </div>

      <div class="report-content">
        <div class="report-section">
          <div class="report-messages">
            <div
              v-for="(msg, index) in cooperationMessages"
              :key="index"
              class="message-item"
            >
              {{ msg.time }} {{ msg.message }}
            </div>
            <div v-if="cooperationMessages.length === 0" class="message-item">
              暂无协同报文
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档查看对话框 -->
    <el-dialog
      v-model="documentDialogVisible"
      title="文档查看"
      width="80%"
      :before-close="handleCloseDocument"
    >
      <div class="document-content">
        <div v-if="documentLoading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载文档...</span>
        </div>
        <div v-else-if="documentError" class="error-container">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ documentError }}</span>
        </div>
        <div v-else-if="documentContent" class="document-text">
          <pre>{{ documentContent }}</pre>
        </div>
        <div v-else class="empty-container">
          <span>请选择要打开的文档</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="selectDocument" type="primary">选择文档</el-button>
          <el-button @click="handleCloseDocument">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 传感器转向参数对话框 -->
    <el-dialog
      v-model="sensorParamDialogVisible"
      title="传感器转向控制"
      width="400px"
    >
      <el-form :model="sensorParamForm" label-width="100px">
        <el-form-item label="方位角">
          <el-input-number
            v-model="sensorParamForm.azSlew"
            :min="-180"
            :max="180"
            :step="0.1"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="俯仰角">
          <el-input-number
            v-model="sensorParamForm.elSlew"
            :min="-90"
            :max="90"
            :step="0.1"
            class="w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sensorParamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendSensorParamCommand"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Loading, WarningFilled } from "@element-plus/icons-vue";

// 基础数据
const optoElectronicPodEnabled = ref(false); // 光电吊舱控制开关
const laserPodEnabled = ref(false); // 激光吊舱控制开关

// 激光编码相关
const laserCode = ref("");
const isLaserCodeEditing = ref(true);

// 激光倒计时相关
const laserCountdown = ref("");
const isCountdownEditing = ref(true);

// 照射倒计时相关
const isIrradiating = ref(false);
const irradiationCountdown = ref(0);
const irradiationTimer = ref<NodeJS.Timeout | null>(null);

// 选择分组和无人机相关
const selectedGroup = ref("");
const selectedUav = ref("");
const isConnected = ref(false); // 连接状态

// 轨迹同步相关
const isSyncingTrajectory = ref<boolean>(false);
const syncTimer = ref<NodeJS.Timeout | null>(null);
const hasRealPlatformData = ref<boolean>(false);

// 目标选择相关
const selectedTarget = ref("");

// 动态目标选项（从当前连接平台的tracks中获取）
const targetOptions = computed(() => {
  if (
    !connectedPlatform.value?.tracks ||
    !Array.isArray(connectedPlatform.value.tracks)
  ) {
    return [];
  }

  // 从当前连接的无人机平台的tracks中获取目标选项
  return connectedPlatform.value.tracks.map((track: any) => ({
    label: track.targetName || "未知目标",
    value: track.targetName || "",
    sensorName: track.sensorName || "",
    targetType: track.targetType || "",
  }));
});
// 平台数据
const platforms = ref<any[]>([]);
const lastUpdateTime = ref<number>(0);

// 已连接的平台信息
const connectedPlatform = ref<any>(null);
const connectedPlatformName = ref<string>("");

// 动态分组选项（从平台数据中获取）
// 动态分组选项（从平台数据中获取）
const groupOptions = computed(() => {
  const groups = new Set<string>();

  // 从真实平台数据中获取分组
  platforms.value.forEach((platform) => {
    if (platform.base?.group && platform.base?.type === "UAV01") {
      groups.add(platform.base.group);
    }
  });

  // 根据项目规范，必须从platforms报文动态解析，不使用静态数据
  return Array.from(groups).map((group) => ({
    label: group,
    value: group,
  }));
});
// 动态无人机选项（基于选择的分组）
const uavOptions = computed(() => {
  if (!selectedGroup.value) {
    return [];
  }

  // 从真实平台数据中获取无人机
  const realUavs = platforms.value
    .filter(
      (platform) =>
        platform.base?.group === selectedGroup.value &&
        platform.base?.type === "UAV01" &&
        !platform.base?.broken
    )
    .map((platform) => ({
      label: platform.base.name || "未命名无人机",
      value: platform.base.name || "",
      platform: platform,
    }));

  // 根据项目规范，只返回从真实平台数据解析的结果
  return realUavs;
});

// 环境参数数据
const environmentParams = reactive({
  temperature: "25°C",
  pressure: "1013hPa",
  windSpeed: "3m/s",
  humidity: "60%",
  cloudCover: "20%",
  exerciseTime: "14:30:25",
});

// 平台状态数据
const platformStatus = reactive({
  position: {
    longitude: "116.397428°",
    latitude: "39.90923°",
    altitude: "150m",
  },
  attitude: {
    pitch: "5°",
    roll: "2°",
    yaw: "180°",
  },
});

// 载荷状态数据
const payloadStatus = reactive({
  optoElectronic: {
    isTurnedOn: false,
    currentEl: 0.0, // 俯仰角
    currentAz: 0.0, // 方位角
    // 保留原有字段兼容性
    status: "正常",
    power: "开",
    type: "HD摄像头",
  },
  laser: {
    isTurnedOn: false,
    currentEl: 0.0, // 俯仰角
    currentAz: 0.0, // 方位角
    // 保留原有字段兼容性
    status: "待机",
    power: "关",
    type: "测距激光",
  },
});

// 目标状态数据
const targetStatus = reactive({
  name: "目标-001",
  position: {
    longitude: "116.400000°",
    latitude: "39.910000°",
    altitude: "0m",
  },
  destroyed: false,
});

// 协同报文数据
const cooperationMessages = ref([
  {
    time: "23:43:11",
    message: "无人机发出协同打击报文",
    type: "uav",
  },
  {
    time: "23:48:22",
    message: "火炮发出已打击报文",
    type: "artillery",
  },
]);

// 操作日志
const operationLogs = ref<
  {
    timestamp: number;
    type: "info" | "success" | "warning" | "error";
    message: string;
  }[]
>([
  {
    timestamp: Date.now() - 300000,
    type: "info" as const,
    message: "系统初始化完成",
  },
  {
    timestamp: Date.now() - 180000,
    type: "success" as const,
    message: "无人机连接成功",
  },
]);

// 文档查看相关
const documentDialogVisible = ref(false);
const documentContent = ref("");
const documentLoading = ref(false);
const documentError = ref("");

// 传感器转向相关
const sensorParamDialogVisible = ref(false);
const sensorParamForm = reactive({
  azSlew: 0,
  elSlew: 0,
});

// 函数定义
const addLog = (
  type: "info" | "success" | "warning" | "error",
  message: string
) => {
  operationLogs.value.unshift({
    timestamp: Date.now(),
    type,
    message,
  });
  // 保持最多50条记录
  if (operationLogs.value.length > 50) {
    operationLogs.value.pop();
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const getLogColor = (type: string) => {
  switch (type) {
    case "success":
      return "text-green-600";
    case "warning":
      return "text-orange-600";
    case "error":
      return "text-red-600";
    default:
      return "text-gray-700";
  }
};

// 平台命令枚举映射（根据新的proto定义）
const PlatformCommandEnum: { [key: string]: number } = {
  Command_inValid: 0,
  Uav_Sensor_On: 1, // 传感器开
  Uav_Sensor_Off: 2, // 传感器关
  Uav_Sensor_Turn: 3, // 传感器转向
  Uav_LazerPod_Lasing: 4, // 激光吊舱照射
  Uav_LazerPod_Cease: 5, // 激光吊舱停止照射
  Uav_Nav: 6, // 无人机航线规划
  Arty_Target_Set: 7, // 目标装订
  Arty_Fire: 8, // 火炮发射
  Uav_Set_Speed: 9, // 设定无人机速度
  Uav_Lock_Target: 10, // 锁定目标
  Uav_Strike_Coordinate: 11, // 打击协同
  Arty_Fire_Coordinate: 12, // 发射协同
};

// 获取光电传感器名称
const getOptoElectronicSensorName = () => {
  if (!connectedPlatform.value?.sensors) {
    return null;
  }

  // 查找光电传感器
  const sensor = connectedPlatform.value.sensors.find(
    (sensor: any) =>
      sensor.base?.type?.toLowerCase().includes("eoir") ||
      sensor.base?.name?.toLowerCase().includes("光电")
  );

  return sensor?.base?.name || null;
};

// 获取激光传感器名称
const getLaserSensorName = () => {
  if (!connectedPlatform.value?.sensors) {
    return null;
  }

  // 查找激光传感器
  const sensor = connectedPlatform.value.sensors.find(
    (sensor: any) =>
      sensor.base?.type?.toLowerCase().includes("laser") ||
      sensor.base?.name?.toLowerCase().includes("激光")
  );

  return sensor?.base?.name || null;
};

// 从平台数据中获取目标位置信息
const getTargetLocationInfo = (targetName: string) => {
  if (!platforms.value || !Array.isArray(platforms.value)) {
    return null;
  }

  // 在所有平台中查找与目标名称一致的平台
  const targetPlatform = platforms.value.find(
    (platform: any) => platform.base?.name === targetName
  );

  if (targetPlatform?.base?.location) {
    const location = targetPlatform.base.location;
    return {
      longitude: `${location.longitude.toFixed(6)}°`,
      latitude: `${location.latitude.toFixed(6)}°`,
      altitude: `${location.altitude}m`,
    };
  }

  return null;
};

// 获取同组火炮名称
const getSameGroupArtilleryName = () => {
  if (!connectedPlatform.value?.base?.group || !platforms.value) {
    return null;
  }

  const currentGroup = connectedPlatform.value.base.group;

  // 根据火炮类型识别规范，查找同组的火炮平台
  const artilleryPlatform = platforms.value.find(
    (platform: any) =>
      platform.base?.group === currentGroup &&
      (platform.base?.type === "Artillery" ||
        platform.base?.type === "ROCKET_LAUNCHER" ||
        platform.base?.type === "CANNON")
  );

  return artilleryPlatform?.base?.name || null;
};

// 传感器命令发送（不带参数）
const sendSensorCommand = async (command: string, sensorName: string) => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    if (!sensorName) {
      ElMessage.warning("未找到对应的传感器");
      return;
    }

    const commandEnum = PlatformCommandEnum[command];
    if (commandEnum === undefined) {
      throw new Error(`未知传感器命令: ${command}`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      sensorParam: {
        sensorName: sensorName,
        azSlew: 0, // 开关命令不需要角度参数
        elSlew: 0,
      },
    };

    addLog("info", `发送传感器命令: ${command} 到传感器 ${sensorName}`);
    console.log("发送传感器命令数据:", commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      addLog("success", `传感器命令 ${command} 发送成功`);
      ElMessage.success(`传感器命令发送成功: ${command}`);
    } else {
      addLog("error", `传感器命令 ${command} 发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送传感器命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 激光命令发送
const sendLaserCommand = async (command: string) => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    const laserSensorName = getLaserSensorName();
    if (!laserSensorName) {
      ElMessage.warning("未找到激光传感器");
      return;
    }

    const commandEnum = PlatformCommandEnum[command];
    if (commandEnum === undefined) {
      throw new Error(`未知激光命令: ${command}`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      sensorParam: {
        sensorName: laserSensorName,
        azSlew: 0,
        elSlew: 0,
      },
    };

    addLog("info", `发送激光命令: ${command} 到传感器 ${laserSensorName}`);
    console.log("发送激光命令数据:", commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      addLog("success", `激光命令 ${command} 发送成功`);
      ElMessage.success(`激光命令发送成功: ${command}`);
    } else {
      addLog("error", `激光命令 ${command} 发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送激光命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 更新平台状态显示
const updatePlatformStatusDisplay = (platform: any) => {
  if (!platform?.base) return;

  // 更新平台位置和姿态信息
  if (platform.base.location) {
    platformStatus.position.longitude = `${platform.base.location.longitude.toFixed(
      6
    )}°`;
    platformStatus.position.latitude = `${platform.base.location.latitude.toFixed(
      6
    )}°`;
    platformStatus.position.altitude = `${platform.base.location.altitude}m`;
  }

  if (platform.base.pitch !== undefined) {
    platformStatus.attitude.pitch = `${platform.base.pitch.toFixed(1)}°`;
  }
  if (platform.base.roll !== undefined) {
    platformStatus.attitude.roll = `${platform.base.roll.toFixed(1)}°`;
  }
  if (platform.base.yaw !== undefined) {
    platformStatus.attitude.yaw = `${platform.base.yaw.toFixed(1)}°`;
  }

  // 更新载荷状态（从传感器信息获取）
  if (platform.sensors && Array.isArray(platform.sensors)) {
    platform.sensors.forEach((sensor: any) => {
      if (
        sensor.base?.type?.toLowerCase().includes("eoir") ||
        sensor.base?.name?.toLowerCase().includes("光电")
      ) {
        const sensorIsOn = sensor.base.isTurnedOn || false;

        // 同步载荷状态显示
        payloadStatus.optoElectronic.isTurnedOn = sensorIsOn;
        payloadStatus.optoElectronic.currentEl = sensor.base.currentEl || 0.0;
        payloadStatus.optoElectronic.currentAz = sensor.base.currentAz || 0.0;
        // 兼容原有字段
        payloadStatus.optoElectronic.status = sensorIsOn ? "正常" : "待机";
        payloadStatus.optoElectronic.power = sensorIsOn ? "开" : "关";

        // 同步光电载荷开关状态
        optoElectronicPodEnabled.value = sensorIsOn;
      }

      if (
        sensor.base?.type?.toLowerCase().includes("laser") ||
        sensor.base?.name?.toLowerCase().includes("激光")
      ) {
        console.log("sensor", sensor);
        const sensorIsOn = sensor.base.isTurnedOn || false;

        // 同步载荷状态显示
        payloadStatus.laser.isTurnedOn = sensorIsOn;
        payloadStatus.laser.currentEl = sensor.base.currentEl || 0.0;
        payloadStatus.laser.currentAz = sensor.base.currentAz || 0.0;
        // 兼容原有字段
        payloadStatus.laser.status = sensorIsOn ? "正常" : "待机";
        payloadStatus.laser.power = sensorIsOn ? "开" : "关";

        // 同步激光载荷开关状态
        laserPodEnabled.value = sensorIsOn;

        // 更新激光编码（遵循项目规范）
        if (sensor.laserCode) {
          const laserCodeValue = sensor.laserCode.toString();
          // 只有在当前没有激光编码或编码不同时才更新
          if (laserCode.value !== laserCodeValue) {
            laserCode.value = laserCodeValue;
            // 根据项目规范，自动填入后设置为不可编辑状态
            isLaserCodeEditing.value = false;
          }
        }
      }
    });
  }
};

// 处理平台状态数据包
const handlePlatformStatus = (packet: any) => {
  try {
    if (packet.parsedPacket?.packageType === 0x29) {
      const parsedData = packet.parsedPacket.parsedData;

      if (parsedData?.platform && Array.isArray(parsedData.platform)) {
        // 更新平台数据
        platforms.value = parsedData.platform;
        lastUpdateTime.value = Date.now();
        hasRealPlatformData.value = true; // 标记已接收到真实平台数据

        // 更新环境参数（从 evironment 字段获取）
        if (parsedData.evironment) {
          const env = parsedData.evironment;
          console.log("[UavPage] 收到原始环境数据:", env);

          // 从平台数据中更新环境参数
          if (env.temperature !== undefined) {
            // 温度单位从开尔文(K)转换为摄氏度(°C)
            const celsiusTemp = env.temperature - 273.15;
            environmentParams.temperature = celsiusTemp.toFixed(1) + "°C";
          }

          if (env.windSpeed !== undefined) {
            // 风速处理，考虑风向
            let windDisplay = env.windSpeed.toFixed(1) + "m/s";

            if (env.windDirection !== undefined) {
              // 将风向角度转换为方位词
              const windDir = env.windDirection;
              let direction = "";
              if (windDir >= 337.5 || windDir < 22.5) direction = "北";
              else if (windDir >= 22.5 && windDir < 67.5) direction = "东北";
              else if (windDir >= 67.5 && windDir < 112.5) direction = "东";
              else if (windDir >= 112.5 && windDir < 157.5) direction = "东南";
              else if (windDir >= 157.5 && windDir < 202.5) direction = "南";
              else if (windDir >= 202.5 && windDir < 247.5) direction = "西南";
              else if (windDir >= 247.5 && windDir < 292.5) direction = "西";
              else if (windDir >= 292.5 && windDir < 337.5) direction = "西北";
              windDisplay += " " + direction;
            }

            environmentParams.windSpeed = windDisplay;
          }

          // 云层覆盖率计算优化
          if (
            env.cloudLowerAlt !== undefined &&
            env.cloudUpperAlt !== undefined
          ) {
            let cloudCover = 0;
            if (
              env.cloudLowerAlt >= 0 &&
              env.cloudUpperAlt > env.cloudLowerAlt
            ) {
              // 基于云层厚度计算覆盖率，考虑实际气象规律
              const cloudThickness = env.cloudUpperAlt - env.cloudLowerAlt;
              // 云层厚度越大，覆盖率越高，但有上限
              cloudCover = Math.min(100, (cloudThickness / 5000) * 100);
            }
            environmentParams.cloudCover = cloudCover.toFixed(0) + "%";
          }

          // 降水参数优化显示（单位从 m/s 转换为 mm/h）
          if (env.rainRate !== undefined) {
            // 将降水率从 m/s 转换为 mm/h
            // 1 m/s = 1000 mm/s = 1000 * 3600 mm/h = 3,600,000 mm/h
            const rainRateMMPerHour = env.rainRate * 3600000;

            if (rainRateMMPerHour <= 0) {
              environmentParams.humidity = "无降水";
            } else if (rainRateMMPerHour < 2.5) {
              environmentParams.humidity =
                "小雨 " + rainRateMMPerHour.toFixed(1) + "mm/h";
            } else if (rainRateMMPerHour < 8) {
              environmentParams.humidity =
                "中雨 " + rainRateMMPerHour.toFixed(1) + "mm/h";
            } else if (rainRateMMPerHour < 16) {
              environmentParams.humidity =
                "大雨 " + rainRateMMPerHour.toFixed(1) + "mm/h";
            } else {
              environmentParams.humidity =
                "暴雨 " + rainRateMMPerHour.toFixed(1) + "mm/h";
            }
          }

          // 气压计算优化（基于海拔和温度的更精确计算）
          if (
            parsedData.platform.length > 0 &&
            parsedData.platform[0].base?.location?.altitude
          ) {
            const altitude = parsedData.platform[0].base.location.altitude;
            const tempK = env.temperature || 288.15; // 使用实际温度或标准温度
            const tempC = tempK - 273.15;

            // 考虑温度的气压计算（更精确的公式）
            const pressure =
              1013.25 *
              Math.pow(
                1 - (0.0065 * altitude) / tempK,
                (9.80665 * 0.0289644) / (8.31447 * 0.0065)
              );
            environmentParams.pressure = pressure.toFixed(0) + "hPa";
          }

          console.log("[UavPage] 处理后的环境参数:", {
            原始温度K: env.temperature,
            转换温度: environmentParams.temperature,
            风速风向: environmentParams.windSpeed,
            云层覆盖: environmentParams.cloudCover,
            降水状态: environmentParams.humidity,
            气压: environmentParams.pressure,
          });
        }

        // 如果已连接，更新已连接平台的状态
        if (isConnected.value && connectedPlatformName.value) {
          const updatedPlatform = parsedData.platform.find(
            (p: any) =>
              p.base?.name === connectedPlatformName.value &&
              p.base?.type === "UAV01"
          );

          if (updatedPlatform) {
            connectedPlatform.value = updatedPlatform;
            // 更新平台状态显示
            updatePlatformStatusDisplay(updatedPlatform);
            console.log(
              `[UavPage] 更新已连接平台状态: ${connectedPlatformName.value}`
            );
          }
        }

        // 提取无人机平台和分组信息
        const uavPlatforms = parsedData.platform.filter(
          (p: any) => p.base?.type === "UAV01"
        );
        const uavGroups = new Set();
        uavPlatforms.forEach((p: any) => {
          if (p.base?.group) {
            uavGroups.add(p.base.group);
          }
        });

        console.log("[UavPage] 收到平台状态数据:", {
          总平台数量: parsedData.platform.length,
          无人机数量: uavPlatforms.length,
          无人机分组: Array.from(uavGroups),
          已连接平台: connectedPlatformName.value || "未连接",
          环境参数: parsedData.evironment ? "已更新" : "未包含",
        });

        addLog(
          "success",
          `更新平台数据: 发现${uavPlatforms.length}个无人机平台${
            parsedData.evironment ? "，环境参数已更新" : ""
          }`
        );
      }
    }
  } catch (error) {
    console.error("[UavPage] 处理平台状态数据失败:", error);
    addLog(
      "error",
      `处理平台数据失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

// 按钮点击事件处理函数
const handleSelectGroup = (value: string) => {
  selectedGroup.value = value;
  selectedUav.value = ""; // 重置无人机选择

  if (value) {
    addLog(
      "info",
      `选择分组: ${
        groupOptions.value.find((g) => g.value === value)?.label || value
      }`
    );
    ElMessage.info(
      `已选择分组: ${
        groupOptions.value.find((g) => g.value === value)?.label || value
      }`
    );
  } else {
    addLog("info", "已清空分组选择");
    ElMessage.info("已清空分组选择");
  }
};

const handleSelectUav = (value: string) => {
  selectedUav.value = value;

  if (value) {
    addLog(
      "info",
      `选择无人机: ${
        uavOptions.value.find((u) => u.value === value)?.label || value
      }`
    );
    ElMessage.info(
      `已选择无人机: ${
        uavOptions.value.find((u) => u.value === value)?.label || value
      }`
    );
  } else {
    addLog("info", "已清空无人机选择");
    ElMessage.info("已清空无人机选择");
  }
};

// 轨迹同步相关函数
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
    if (!selectedUav.value) {
      ElMessage.warning("请先选择平台");
      return;
    }

    if (!hasRealPlatformData.value) {
      ElMessage.warning("请等待接收到真实的平台状态数据后再启动轨迹同步");
      addLog("warning", "尚未接收到真实平台数据，无法启动轨迹同步");
      return;
    }

    // 获取UavId
    let uavId = 0;
    try {
      const uavIdResult = await (window as any).electronAPI.uav.getCurrentId();
      if (uavIdResult.success && uavIdResult.uavId) {
        uavId = parseInt(uavIdResult.uavId);
      } else {
        ElMessage.warning("请先设置UavId");
        return;
      }
    } catch (error) {
      ElMessage.warning("无法获取UavId，请先设置");
      return;
    }

    isSyncingTrajectory.value = true;
    addLog(
      "info",
      `开始持续同步平台 ${selectedUav.value} 的轨迹数据，UavId: ${uavId}`
    );
    ElMessage.success(`轨迹同步已启动，UavId: ${uavId}`);

    // 立即发送一次
    await sendTrajectoryData();

    // 设置定时器，每2秒发送一次
    syncTimer.value = setInterval(async () => {
      await sendTrajectoryData();
    }, 2000);
  } catch (error: any) {
    const errorMsg = `启动轨迹同步时发生错误: ${error.message}`;
    addLog("error", errorMsg);
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
  addLog("info", `停止轨迹同步`);
  ElMessage.info("轨迹同步已停止");
};

// 发送轨迹数据
const sendTrajectoryData = async () => {
  try {
    if (!selectedUav.value) {
      return;
    }

    // 获取当前选择的平台数据
    const platform = platforms.value.find(
      (p) => p.base?.name === selectedUav.value
    );
    if (!platform) {
      console.log("[轨迹同步] 未找到平台数据，跳过本次发送");
      return;
    }

    // 检查平台是否有真实的基础数据（包含位置信息）
    if (!platform.base || !platform.base.location) {
      console.log("[轨迹同步] 平台缺少位置数据，跳过本次发送");
      return;
    }

    // 获取UavId
    const uavIdResult = await (window as any).electronAPI.uav.getCurrentId();
    if (!uavIdResult.success || !uavIdResult.uavId) {
      return;
    }
    const uavId = parseInt(uavIdResult.uavId);

    // 将响应式对象转换为普通对象，避免IPC序列化问题
    const platformDataPlain = JSON.parse(JSON.stringify(platform));

    // 发送轨迹同步数据，传递平台数据用于提取位置和姿态信息
    const result = await (
      window as any
    ).electronAPI.multicast.syncTrajectoryWithPlatformData({
      platformName: selectedUav.value,
      uavId: uavId,
      platformData: platformDataPlain,
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

const handleConnectPlatform = () => {
  if (isConnected.value) {
    // 断开连接
    isConnected.value = false;
    connectedPlatform.value = null;
    connectedPlatformName.value = "";

    // 重置载荷开关状态
    optoElectronicPodEnabled.value = false;
    laserPodEnabled.value = false;

    addLog(
      "warning",
      `已断开连接: ${selectedGroup.value} - ${selectedUav.value}`
    );
    ElMessage.warning("平台连接已断开");
    return;
  }

  if (!selectedGroup.value || !selectedUav.value) {
    ElMessage.warning("请先选择分组和无人机");
    return;
  }

  // 查找已选择的平台
  const targetPlatform = platforms.value.find(
    (platform) =>
      platform.base?.name === selectedUav.value &&
      platform.base?.group === selectedGroup.value &&
      platform.base?.type === "UAV01"
  );

  if (targetPlatform) {
    // 连接到真实平台
    isConnected.value = true;
    connectedPlatform.value = targetPlatform;
    connectedPlatformName.value = selectedUav.value;

    // 同步载荷状态和开关状态
    updatePlatformStatusDisplay(targetPlatform);

    addLog(
      "success",
      `已连接到真实平台: ${selectedGroup.value} - ${selectedUav.value}`
    );
    ElMessage.success(`平台连接成功: ${selectedUav.value}`);
  } else {
    // 未找到真实平台，但仍然允许连接（使用默认数据）
    isConnected.value = true;
    connectedPlatform.value = null; // 没有真实平台数据
    connectedPlatformName.value = selectedUav.value;

    // 重置载荷开关状态为默认值（关闭）
    optoElectronicPodEnabled.value = false;
    laserPodEnabled.value = false;

    addLog(
      "warning",
      `连接到模拟平台: ${selectedGroup.value} - ${selectedUav.value}`
    );
    ElMessage.success(`平台连接成功（模拟模式）: ${selectedUav.value}`);
  }
};

const handleOpenSolution = () => {
  addLog("info", "点击打开方案按钮");
  ElMessage.info("打开方案功能开发中...");
};

const handleRoutePlanning = async () => {
  try {
    addLog("info", "正在准备启动导航软件...");
    const result = await (window as any).electronAPI.nav.openNavigation();

    if (result.success) {
      if (result.uavId) {
        addLog("success", `导航软件启动成功，使用UavId: ${result.uavId}`);
        ElMessage.success(`导航软件已启动，UavId: ${result.uavId}`);
      } else {
        addLog("success", "导航软件启动成功");
        ElMessage.success("导航软件已启动");
      }
    } else {
      addLog("error", `导航软件启动失败: ${result.error}`);
      ElMessage.error(`启动失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `启动导航软件时发生错误: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

const handleInputLaserCode = () => {
  if (isLaserCodeEditing.value) {
    // 确定模式
    if (!laserCode.value.trim()) {
      ElMessage.warning("请输入激光编码");
      return;
    }
    isLaserCodeEditing.value = false;
    addLog("success", `激光编码已设置: ${laserCode.value}`);
    ElMessage.success(`激光编码已设置: ${laserCode.value}`);
  } else {
    // 编辑模式
    isLaserCodeEditing.value = true;
    addLog("info", "开始编辑激光编码");
  }
};

const handleSetLaserCountdown = () => {
  if (isCountdownEditing.value) {
    // 确定模式
    if (!laserCountdown.value.trim()) {
      ElMessage.warning("请输入倒计时时间");
      return;
    }
    isCountdownEditing.value = false;
    addLog("success", `激光倒计时已设置: ${laserCountdown.value}秒`);
    ElMessage.success(`激光倒计时已设置: ${laserCountdown.value}秒`);
  } else {
    // 编辑模式
    isCountdownEditing.value = true;
    addLog("info", "开始编辑激光倒计时");
  }
};

const handleIrradiate = () => {
  if (isIrradiating.value) {
    // 当前正在照射，取消照射
    if (irradiationTimer.value) {
      clearInterval(irradiationTimer.value);
      irradiationTimer.value = null;
    }
    isIrradiating.value = false;
    irradiationCountdown.value = 0;
    addLog("warning", "照射已取消");
    ElMessage.warning("照射已取消");
    return;
  }

  // 检查是否设置了倒计时
  const countdownTime = laserCountdown.value
    ? parseInt(laserCountdown.value)
    : 0;

  if (countdownTime <= 0) {
    // 没有设置倒计时或倒计时为0，直接发送照射命令
    sendLaserCommand("Uav_LazerPod_Lasing");
    return;
  }

  // 有倒计时，启动倒计时流程
  isIrradiating.value = true;
  irradiationCountdown.value = countdownTime;

  addLog("info", `开始照射倒计时: ${countdownTime}秒`);
  ElMessage.info(`照射倒计时开始: ${countdownTime}秒`);

  // 开始倒计时
  irradiationTimer.value = setInterval(() => {
    irradiationCountdown.value--;

    if (irradiationCountdown.value <= 0) {
      // 倒计时结束，发送照射命令
      if (irradiationTimer.value) {
        clearInterval(irradiationTimer.value);
        irradiationTimer.value = null;
      }
      isIrradiating.value = false;

      // 发送真实的激光照射命令
      sendLaserCommand("Uav_LazerPod_Lasing");
    }
  }, 1000);
};

const handleStop = () => {
  // 发送真实的激光停止照射命令
  sendLaserCommand("Uav_LazerPod_Cease");
};

const handleTurn = () => {
  if (!isConnected.value) {
    ElMessage.warning("请先连接平台");
    return;
  }

  // 打开传感器转向参数对话框
  showSensorParamDialog();
};

// 显示传感器转向参数对话框
const showSensorParamDialog = () => {
  sensorParamForm.azSlew = 0;
  sensorParamForm.elSlew = 0;
  sensorParamDialogVisible.value = true;
};

// 发送传感器转向命令（同时发送光电和激光载荷转向）
const sendSensorParamCommand = async () => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    const optoElectronicSensorName = getOptoElectronicSensorName();
    const laserSensorName = getLaserSensorName();

    if (!optoElectronicSensorName && !laserSensorName) {
      ElMessage.warning("未找到任何传感器");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Sensor_Turn"];
    if (commandEnum === undefined) {
      throw new Error(`未知传感器命令: Uav_Sensor_Turn`);
    }

    let successCount = 0;
    let totalCommands = 0;

    // 发送光电载荷转向命令
    if (optoElectronicSensorName) {
      totalCommands++;
      const commandData = {
        commandID: Date.now(),
        platformName: connectedPlatformName.value,
        command: commandEnum,
        sensorParam: {
          sensorName: optoElectronicSensorName,
          azSlew: Number(sensorParamForm.azSlew),
          elSlew: Number(sensorParamForm.elSlew),
        },
      };

      addLog(
        "info",
        `发送光电载荷转向命令: 传感器 ${optoElectronicSensorName}, 方位角: ${sensorParamForm.azSlew}°, 俯仰角: ${sensorParamForm.elSlew}°`
      );
      console.log("发送光电载荷转向命令数据:", commandData);

      const result = await (
        window as any
      ).electronAPI.multicast.sendPlatformCmd(commandData);

      if (result.success) {
        addLog("success", `光电载荷转向命令发送成功`);
        successCount++;
      } else {
        addLog("error", `光电载荷转向命令发送失败: ${result.error}`);
      }
    }

    // 发送激光载荷转向命令
    if (laserSensorName) {
      totalCommands++;
      // 1秒延迟以避免命令ID冲突并确保时间间隔
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const commandData = {
        commandID: Date.now(),
        platformName: connectedPlatformName.value,
        command: commandEnum,
        sensorParam: {
          sensorName: laserSensorName,
          azSlew: Number(sensorParamForm.azSlew),
          elSlew: Number(sensorParamForm.elSlew),
        },
      };

      addLog(
        "info",
        `发送激光载荷转向命令: 传感器 ${laserSensorName}, 方位角: ${sensorParamForm.azSlew}°, 俯仰角: ${sensorParamForm.elSlew}°`
      );
      console.log("发送激光载荷转向命令数据:", commandData);

      const result = await (
        window as any
      ).electronAPI.multicast.sendPlatformCmd(commandData);

      if (result.success) {
        addLog("success", `激光载荷转向命令发送成功`);
        successCount++;
      } else {
        addLog("error", `激光载荷转向命令发送失败: ${result.error}`);
      }
    }

    // 根据发送结果显示消息
    if (successCount === totalCommands) {
      ElMessage.success(
        `传感器转向命令全部发送成功（${successCount}/${totalCommands}）`
      );
      sensorParamDialogVisible.value = false;
    } else if (successCount > 0) {
      ElMessage.warning(`部分命令发送成功（${successCount}/${totalCommands}）`);
    } else {
      ElMessage.error("所有转向命令发送失败");
    }
  } catch (error: any) {
    const errorMsg = `发送传感器转向命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

const handleLockTarget = async () => {
  if (!selectedTarget.value) {
    ElMessage.warning("请先选择要锁定的目标");
    return;
  }

  if (!isConnected.value || !connectedPlatformName.value) {
    ElMessage.warning("请先连接平台");
    return;
  }

  // 从目标选项中查找对应的目标信息
  const targetInfo = targetOptions.value.find(
    (t) => t.value === selectedTarget.value
  );
  const targetLabel = targetInfo?.label || selectedTarget.value;

  // 发送光电和激光传感器的锁定命令
  await sendLockTargetCommand(targetLabel);
};

// 发送锁定目标命令（同时发送光电和激光传感器锁定）
const sendLockTargetCommand = async (targetName: string) => {
  try {
    const optoElectronicSensorName = getOptoElectronicSensorName();
    const laserSensorName = getLaserSensorName();

    if (!optoElectronicSensorName && !laserSensorName) {
      ElMessage.warning("未找到任何传感器");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Lock_Target"];
    if (commandEnum === undefined) {
      throw new Error(`未知锁定目标命令: Uav_Lock_Target`);
    }

    let successCount = 0;
    let totalCommands = 0;

    // 发送光电传感器锁定命令
    if (optoElectronicSensorName) {
      totalCommands++;
      const commandData = {
        commandID: Date.now(),
        platformName: connectedPlatformName.value,
        command: commandEnum,
        lockParam: {
          targetName: targetName,
          sensorName: optoElectronicSensorName,
        },
      };

      addLog(
        "info",
        `发送光电传感器锁定命令: 传感器 ${optoElectronicSensorName} 锁定目标 ${targetName}`
      );
      console.log("发送光电传感器锁定命令数据:", commandData);

      const result = await (
        window as any
      ).electronAPI.multicast.sendPlatformCmd(commandData);

      if (result.success) {
        addLog("success", `光电传感器锁定命令发送成功`);
        successCount++;
      } else {
        addLog("error", `光电传感器锁定命令发送失败: ${result.error}`);
      }
    }

    // 发送激光传感器锁定命令
    if (laserSensorName) {
      totalCommands++;
      // 1秒延迟以避免命令ID冲突并确保时间间隔
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const commandData = {
        commandID: Date.now(),
        platformName: connectedPlatformName.value,
        command: commandEnum,
        lockParam: {
          targetName: targetName,
          sensorName: laserSensorName,
        },
      };

      addLog(
        "info",
        `发送激光传感器锁定命令: 传感器 ${laserSensorName} 锁定目标 ${targetName}`
      );
      console.log("发送激光传感器锁定命令数据:", commandData);

      const result = await (
        window as any
      ).electronAPI.multicast.sendPlatformCmd(commandData);

      if (result.success) {
        addLog("success", `激光传感器锁定命令发送成功`);
        successCount++;
      } else {
        addLog("error", `激光传感器锁定命令发送失败: ${result.error}`);
      }
    }

    // 根据发送结果显示消息和更新状态
    if (successCount === totalCommands) {
      ElMessage.success(
        `目标锁定命令全部发送成功（${successCount}/${totalCommands}）`
      );
      addLog("success", `已锁定目标：${targetName}`);

      // 更新目标状态（显示目标名称、类型和位置信息）
      targetStatus.name = targetName;

      // 获取目标位置信息
      const locationInfo = getTargetLocationInfo(targetName);
      if (locationInfo) {
        targetStatus.position.longitude = locationInfo.longitude;
        targetStatus.position.latitude = locationInfo.latitude;
        targetStatus.position.altitude = locationInfo.altitude;
        addLog(
          "info",
          `目标位置：${locationInfo.longitude} ${locationInfo.latitude} ${locationInfo.altitude}`
        );
      } else {
        // 未找到目标位置信息，使用默认值
        targetStatus.position.longitude = "未知";
        targetStatus.position.latitude = "未知";
        targetStatus.position.altitude = "未知";
        addLog("warning", `未能获取目标 ${targetName} 的位置信息`);
      }

      const targetInfo = targetOptions.value.find(
        (t) => t.value === selectedTarget.value
      );
      if (targetInfo?.targetType) {
        addLog(
          "info",
          `目标类型：${targetInfo.targetType}，传感器：${targetInfo.sensorName}`
        );
      }
    } else if (successCount > 0) {
      ElMessage.warning(
        `部分锁定命令发送成功（${successCount}/${totalCommands}）`
      );
    } else {
      ElMessage.error("所有锁定命令发送失败");
    }
  } catch (error: any) {
    const errorMsg = `发送锁定目标命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

const handleSendCooperationCommand = async () => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    if (!selectedTarget.value) {
      ElMessage.warning("请先选择要协同打击的目标");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Strike_Coordinate"];
    if (commandEnum === undefined) {
      throw new Error("未知打击协同命令");
    }

    // 获取目标信息
    const targetInfo = targetOptions.value.find(
      (t) => t.value === selectedTarget.value
    );
    const targetName = targetInfo?.label || selectedTarget.value;

    // 获取目标位置信息
    const locationInfo = getTargetLocationInfo(targetName);

    // 获取同组火炮名称
    const artilleryName = getSameGroupArtilleryName();
    if (!artilleryName) {
      ElMessage.warning("未找到同组火炮平台，无法发送协同指令");
      return;
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      strikeCoordinateParam: {
        artyName: artilleryName,
        targetName: targetName,
        coordinate: locationInfo
          ? {
              longitude: parseFloat(locationInfo.longitude.replace("°", "")),
              latitude: parseFloat(locationInfo.latitude.replace("°", "")),
              altitude: parseFloat(locationInfo.altitude.replace("m", "")),
            }
          : undefined,
      },
    };

    addLog(
      "info",
      `发送打击协同命令到平台 ${connectedPlatformName.value}，目标: ${targetName}，协同火炮: ${artilleryName}`
    );
    console.log("发送打击协同命令数据:", commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      addLog(
        "success",
        `打击协同命令发送成功，目标: ${targetName}，协同火炮: ${artilleryName}`
      );
      ElMessage.success(
        `打击协同指令已发送（目标: ${targetName}，火炮: ${artilleryName}）`
      );

      // 添加新的协同报文
      cooperationMessages.value.unshift({
        time: new Date().toLocaleTimeString(),
        message: `无人机发出协同打击报文（目标: ${targetName}，火炮: ${artilleryName}）`,
        type: "uav",
      });
    } else {
      addLog("error", `打击协同命令发送失败: ${result.error}`);
      ElMessage.error(`协同指令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送打击协同命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 监听开关变化
const onOptoElectronicToggle = async () => {
  const sensorName = getOptoElectronicSensorName();
  if (!sensorName) {
    ElMessage.warning("未找到光电传感器，无法控制");
    // 恢复开关状态
    optoElectronicPodEnabled.value = !optoElectronicPodEnabled.value;
    return;
  }

  const command = optoElectronicPodEnabled.value
    ? "Uav_Sensor_On"
    : "Uav_Sensor_Off";
  const status = optoElectronicPodEnabled.value ? "开启" : "关闭";

  addLog("info", `光电吊舱控制已${status}`);

  // 发送传感器命令
  await sendSensorCommand(command, sensorName);

  // 更新本地状态显示
  payloadStatus.optoElectronic.power = optoElectronicPodEnabled.value
    ? "开"
    : "关";
  payloadStatus.optoElectronic.status = optoElectronicPodEnabled.value
    ? "正常"
    : "待机";
};

const onLaserToggle = async () => {
  const sensorName = getLaserSensorName();
  if (!sensorName) {
    ElMessage.warning("未找到激光传感器，无法控制");
    // 恢复开关状态
    laserPodEnabled.value = !laserPodEnabled.value;
    return;
  }

  const command = laserPodEnabled.value ? "Uav_Sensor_On" : "Uav_Sensor_Off";
  const status = laserPodEnabled.value ? "开启" : "关闭";

  addLog("info", `激光吊舱控制已${status}`);

  // 发送传感器命令
  await sendSensorCommand(command, sensorName);

  // 更新本地状态显示
  payloadStatus.laser.power = laserPodEnabled.value ? "开" : "关";
  payloadStatus.laser.status = laserPodEnabled.value ? "正常" : "待机";
};

// 输入数字限制函数
const onlyNumbers = (value: string) => {
  return value.replace(/[^0-9]/g, "");
};

const handleLaserCodeInput = (value: string) => {
  laserCode.value = onlyNumbers(value);
};

const handleCountdownInput = (value: string) => {
  laserCountdown.value = onlyNumbers(value);
};

// 文档相关函数
// 打开文档
const openDocument = () => {
  documentDialogVisible.value = true;
  documentContent.value = "";
  documentError.value = "";
};

// 选择文档
const selectDocument = async () => {
  try {
    // 使用 Electron 的文件选择对话框
    const result = await (window as any).electronAPI.dialog.showOpenDialog({
      title: "选择文档",
      filters: [
        { name: "Word 文档", extensions: ["doc", "docx"] },
        { name: "所有文件", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      await loadDocument(filePath);
    }
  } catch (error) {
    console.error("选择文档失败:", error);
    ElMessage.error("选择文档失败");
  }
};

// 加载文档内容
const loadDocument = async (filePath: string) => {
  documentLoading.value = true;
  documentError.value = "";
  documentContent.value = "";

  try {
    // 调用主进程的文档解析方法
    const content = await (window as any).electronAPI.document.readDocument(
      filePath
    );

    if (content.success) {
      documentContent.value = content.data;
      ElMessage.success("文档加载成功");
    } else {
      documentError.value = content.error || "文档加载失败";
      ElMessage.error(documentError.value);
    }
  } catch (error) {
    documentError.value = "文档加载失败：" + (error as Error).message;
    ElMessage.error(documentError.value);
  } finally {
    documentLoading.value = false;
  }
};

// 关闭文档对话框
const handleCloseDocument = () => {
  documentDialogVisible.value = false;
  documentContent.value = "";
  documentError.value = "";
};
onMounted(() => {
  addLog("success", "无人机操作页面加载完成");

  // 监听平台状态数据
  if (window.electronAPI?.multicast?.onPacket) {
    window.electronAPI.multicast.onPacket(handlePlatformStatus);
    console.log("[UavPage] 已开始监听平台状态数据");
  } else {
    console.warn("[UavPage] multicast API 不可用");
  }

  // 监听导航软件启动事件，自动更新UavId显示
  (window as any).electronAPI.ipcRenderer.on(
    "nav:uavIdUpdated",
    (_, data: any) => {
      console.log("[UavPage] 导航软件启动，UavId已更新:", data.uavId);
      addLog("info", `导航软件启动，UavId已更新: ${data.uavId}`);
      ElMessage.info(`导航软件已启动，UavId已更新为: ${data.uavId}`);
    }
  );

  // 模拟数据更新
  setInterval(() => {
    // 只更新演习时间，环境参数从真实平台数据获取
    environmentParams.exerciseTime = new Date().toLocaleTimeString();

    // 模拟平台姿态变化（仅在未连接真实平台时）
    if (!hasRealPlatformData.value || !connectedPlatform.value) {
      platformStatus.attitude.yaw =
        (parseInt(platformStatus.attitude.yaw) + Math.random() * 2 - 1).toFixed(
          0
        ) + "°";
    }
  }, 1000);
});

onUnmounted(() => {
  addLog("info", "无人机操作页面已卸载");

  // 清理监听器
  if (window.electronAPI?.multicast?.removeAllListeners) {
    window.electronAPI.multicast.removeAllListeners("packet");
    console.log("[UavPage] 已停止监听平台状态数据");
  }

  // 清理照射倒计时定时器
  if (irradiationTimer.value) {
    clearInterval(irradiationTimer.value);
    irradiationTimer.value = null;
  }

  // 清理轨迹同步定时器
  if (syncTimer.value) {
    clearInterval(syncTimer.value);
    syncTimer.value = null;
  }
});
</script>

<style scoped>
.uav-operation-page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 顶部控制区域 */
.top-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.control-area {
  flex: 1;
  position: relative;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 左侧标题区域 */
.title-section {
  flex: 0 0 auto;
}

/* 中间演习时间 */
.exercise-time {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

/* 右侧控制区域 */
.controls-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 席位标题 */
.seat-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.connected-info {
  color: #28a745;
  font-weight: 500;
  margin-left: 4px;
}

/* 控制按钮样式 */
.control-btn {
  height: 40px;
  border: 2px solid #d0d0d0;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

/* 下拉框样式 */
.control-select {
  height: 40px;
  min-width: 150px;
}

.control-select.short {
  min-width: 120px;
  max-width: 120px;
}

.control-select.large {
  flex: 1;
  max-width: 300px;
  min-width: 200px;
}

/* 功能分隔符 */
.function-separator {
  width: 1px;
  height: 30px;
  background-color: #d0d0d0;
  margin: 0 8px;
}

/* 主要内容区域 */
.main-content {
  min-height: 500px;
}

/* 左侧控制面板 */
.left-panel {
  width: 450px;
  display: flex;
  flex-direction: column;
}

/* 航线规划按钮（在任务控制内） */
.route-planning-btn {
  flex: 1;
  height: 45px;
  border: 2px solid #d0d0d0;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
}

.route-planning-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

/* 同步轨迹按钮 */
.trajectory-sync-btn {
  flex: 1;
  height: 45px;
  border: 2px solid #d0d0d0;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.trajectory-sync-btn:hover {
  opacity: 0.8;
}

/* 任务控制区域 */
.task-control {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  flex: 1;
}

.task-header {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

/* 控制组 */
.control-group {
  padding-bottom: 8px;
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.control-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.control-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.button-row {
  display: flex;
  gap: 8px;
}

.input-group {
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.laser-input {
  flex: 1;
}

.confirm-btn {
  width: 60px;
  height: 32px;
  font-size: 13px;
  padding: 0;
}

.control-separator {
  height: 1px;
  background-color: #ddd;
  margin: 12px 0;
  border-radius: 1px;
}

.button-separator {
  height: 1px;
  background-color: #e0e0e0;
  margin: 12px 0;
  border-radius: 1px;
}

.action-btn {
  flex: 1;
  height: 36px;
  border: 2px solid #d0d0d0;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

/* 全宽大按钮 */
.full-width-btn {
  width: 100%;
  height: 40px;
  font-size: 15px;
  font-weight: 600;
}

/* 目标选择 */
.target-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.target-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.target-select {
  flex: 1;
  min-width: 150px;
}

/* 右侧状态面板 */
.right-panel {
  flex: 1;
}

/* 状态卡片 */
.status-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  min-height: 120px;
}

.status-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.status-info {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 底部协同报文区域 */
.bottom-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  height: 200px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.report-send-btn {
  height: 36px;
  padding: 0 16px;
  border: 2px solid #d0d0d0;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.report-send-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-left: auto;
}

.report-content {
  flex: 1;
}

.report-section {
  height: 100%;
}

.report-label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.report-messages {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  height: 120px;
  overflow-y: auto;
}

.message-item {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
  padding: 4px 0;
}

.message-item:last-child {
  margin-bottom: 0;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-switch) {
  --el-switch-on-color: #007bff;
  --el-switch-off-color: #dcdfe6;
}

:deep(.el-button) {
  border: 2px solid #d0d0d0;
  background: #f8f9fa;
  color: #333;
}

:deep(.el-button:hover) {
  background: #e9ecef;
  border-color: #007bff;
}

:deep(.el-select) {
  --el-select-border-color-hover: #007bff;
  --el-select-input-color: #333;
  --el-select-input-font-size: 14px;
}

:deep(.el-select .el-input__wrapper) {
  border: 2px solid #d0d0d0;
  border-radius: 6px;
  background: #f8f9fa;
  transition: all 0.2s;
}

:deep(.el-select .el-input__wrapper:hover) {
  background: #e9ecef;
  border-color: #007bff;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

:deep(.el-select.is-disabled .el-input__wrapper) {
  background-color: #f5f5f5;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

:deep(.el-button.is-disabled) {
  background-color: #f5f5f5;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1080px) {
  .main-content {
    flex-direction: column;
  }

  .control-row {
    flex-wrap: wrap;
  }

  .control-btn.large {
    max-width: none;
  }
}

/* 文档对话框样式 */
.document-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #666;
  font-size: 14px;
}

.error-container {
  color: #e74c3c;
}

.document-text {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.document-text pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 目标选项样式 */
.target-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.target-name {
  font-weight: 500;
  color: #303133;
}

.target-type {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.target-status-hint {
  margin-top: 4px;
  text-align: center;
}
</style>
