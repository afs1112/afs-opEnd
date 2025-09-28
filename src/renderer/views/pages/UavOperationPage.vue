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
            <el-button class="route-planning-btn" @click="handleRoutePlanning">
              航线规划
            </el-button>
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
                  placeholder="选择要锁定的目标"
                  class="target-select"
                  clearable
                >
                  <el-option
                    v-for="target in targetOptions"
                    :key="target.value"
                    :label="target.label"
                    :value="target.value"
                  />
                </el-select>
              </div>
            </div>

            <!-- 锁定目标按钮 -->
            <div class="button-row">
              <el-button
                class="action-btn full-width-btn"
                @click="handleLockTarget"
                :disabled="!selectedTarget"
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
              风力参数{{ environmentParams.windSpeed }}，降水参数{{
                environmentParams.humidity
              }}<br />
              云层参数{{ environmentParams.cloudCover }}
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
              光电：{{ payloadStatus.optoElectronic.status }}、{{
                payloadStatus.optoElectronic.power
              }}、{{ payloadStatus.optoElectronic.type }}<br />
              激光：{{ payloadStatus.laser.status }}、{{
                payloadStatus.laser.power
              }}、{{ payloadStatus.laser.type }}
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
              是否摧毁：{{ targetStatus.destroyed ? "是" : "否" }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部协同报文区域 -->
    <div class="bottom-panel mt-4">
      <div class="report-header">
        <el-button class="report-send-btn" @click="handleSendCooperationCommand"
          >发送打击协同指令</el-button
        >
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

// 目标选择相关
const selectedTarget = ref("");
const targetOptions = ref([
  { label: "敌方坦克-001", value: "tank_001" },
  { label: "敌方装甲车-002", value: "apc_002" },
  { label: "敌方雷达站-003", value: "radar_003" },
  { label: "敌方指挥所-004", value: "hq_004" },
  { label: "敌方防空阵地-005", value: "sam_005" },
  { label: "敌方补给车-006", value: "supply_006" },
]);
const groupOptions = ref([
  { label: "分组1", value: "group1" },
  { label: "分组2", value: "group2" },
  { label: "训练分组", value: "train_group" },
]);
const uavOptions = ref([
  { label: "无人机-001", value: "uav001" },
  { label: "无人机-002", value: "uav002" },
  { label: "无人机-003", value: "uav003" },
]);

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
    status: "正常",
    power: "开",
    type: "HD摄像头",
  },
  laser: {
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

// 按钮点击事件处理函数
const handleSelectGroup = (value: string) => {
  selectedGroup.value = value;
  selectedUav.value = ""; // 重置无人机选择
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
};

const handleSelectUav = (value: string) => {
  selectedUav.value = value;
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
};

const handleConnectPlatform = () => {
  if (isConnected.value) {
    // 断开连接
    isConnected.value = false;
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

  isConnected.value = true;
  addLog(
    "success",
    `已连接到平台: ${selectedGroup.value} - ${selectedUav.value}`
  );
  ElMessage.success("平台连接成功");
};

const handleOpenSolution = () => {
  addLog("info", "点击打开方案按钮");
  ElMessage.info("打开方案功能开发中...");
};

const handleRoutePlanning = () => {
  addLog("info", "点击航线规划按钮");
  ElMessage.info("航线规划功能开发中...");
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
  if (!laserCountdown.value || parseInt(laserCountdown.value) <= 0) {
    ElMessage.warning("请先设置激光倒计时");
    return;
  }

  const countdownTime = parseInt(laserCountdown.value);
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

      addLog("success", "照射命令已发送");
      ElMessage.success("照射命令已发送！");

      // TODO: 这里可以添加实际的照射命令发送逻辑
    }
  }, 1000);
};

const handleStop = () => {
  addLog("warning", "点击停止按钮");
  ElMessage.warning("停止功能开发中...");
};

const handleTurn = () => {
  addLog("info", "点击转向按钮");
  ElMessage.info("转向功能开发中...");
};

const handleLockTarget = () => {
  if (!selectedTarget.value) {
    ElMessage.warning("请先选择要锁定的目标");
    return;
  }

  const targetLabel =
    targetOptions.value.find((t) => t.value === selectedTarget.value)?.label ||
    selectedTarget.value;
  addLog("success", `已锁定目标：${targetLabel}`);
  ElMessage.success(`已锁定目标：${targetLabel}`);

  // 更新目标状态
  targetStatus.name = targetLabel;
};

const handleSendCooperationCommand = () => {
  addLog("success", "发送打击协同指令");
  ElMessage.success("协同指令已发送");

  // 添加新的协同报文
  cooperationMessages.value.unshift({
    time: new Date().toLocaleTimeString(),
    message: "无人机发出协同打击报文",
    type: "uav",
  });
};

// 监听开关变化
const onOptoElectronicToggle = () => {
  const status = optoElectronicPodEnabled.value ? "开启" : "关闭";
  addLog("info", `光电吊舱控制已${status}`);
  payloadStatus.optoElectronic.power = optoElectronicPodEnabled.value
    ? "开"
    : "关";
  payloadStatus.optoElectronic.status = optoElectronicPodEnabled.value
    ? "正常"
    : "待机";
};

const onLaserToggle = () => {
  const status = laserPodEnabled.value ? "开启" : "关闭";
  addLog("info", `激光吊舱控制已${status}`);
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

  // 模拟数据更新
  setInterval(() => {
    // 更新环境参数
    environmentParams.exerciseTime = new Date().toLocaleTimeString();

    // 模拟平台姿态变化
    platformStatus.attitude.yaw =
      (parseInt(platformStatus.attitude.yaw) + Math.random() * 2 - 1).toFixed(
        0
      ) + "°";
  }, 1000);
});

onUnmounted(() => {
  addLog("info", "无人机操作页面已卸载");

  // 清理照射倒计时定时器
  if (irradiationTimer.value) {
    clearInterval(irradiationTimer.value);
    irradiationTimer.value = null;
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
  width: 100%;
  height: 45px;
  border: 2px solid #d0d0d0;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.route-planning-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
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
  height: 120px;
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
</style>
