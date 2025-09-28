<template>
  <div class="artillery-operation-page h-full p-4">
    <!-- 顶部控制区域 -->
    <div class="top-section mb-4">
      <div class="top-content">
        <!-- 操作按钮区域 -->
        <div class="control-area">
          <div class="control-row">
            <!-- 左侧标题区域 -->
            <div class="title-section">
              <div class="seat-title">
                火炮席位
                <span v-if="isConnected" class="connected-info"
                  >：已连接 {{ selectedInstance }}</span
                >
              </div>
            </div>

            <!-- 中间演习时间 -->
            <div class="exercise-time" v-if="isConnected">
              演习时间：{{ environment.exerciseTime }}
            </div>

            <!-- 右侧控制区域 -->
            <div class="controls-section">
              <el-select
                v-model="selectedGroup"
                placeholder="选择分组"
                class="control-select short"
                @change="onGroupChange"
                :disabled="isConnected"
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
                v-model="selectedInstance"
                placeholder="选择火炮"
                class="control-select large"
                :disabled="
                  !selectedGroup || artilleryOptions.length === 0 || isConnected
                "
                clearable
              >
                <el-option
                  v-for="artillery in artilleryOptions"
                  :key="artillery.value"
                  :label="artillery.label"
                  :value="artillery.value"
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

          <!-- 目标装订 -->
          <div class="control-group mb-4">
            <!-- 目标信息显示 -->
            <div class="target-info-display mb-3">
              <div class="target-info-item">
                <span class="info-label">目标名称：</span>
                <span class="info-value">{{ currentTarget.name }}</span>
              </div>
              <div class="target-info-item">
                <span class="info-label">目标坐标：</span>
                <span class="info-value">{{ currentTarget.coordinates }}</span>
              </div>
            </div>

            <el-button class="target-setting-btn" @click="handleTargetSetting">
              目标装订
            </el-button>
          </div>

          <!-- 弹药装载 -->
          <div class="control-group mb-4">
            <div class="control-item">
              <span class="control-label">弹药类型</span>
              <el-select
                v-model="selectedAmmunitionType"
                placeholder="选择弹药类型"
                class="ammunition-select"
                :disabled="isConnected && artilleryStatus.isLoaded"
              >
                <el-option
                  v-for="ammo in ammunitionTypes"
                  :key="ammo.value"
                  :label="ammo.label"
                  :value="ammo.value"
                />
              </el-select>
            </div>

            <div class="control-item">
              <span class="control-label">剩余数量</span>
              <div class="control-info">{{ currentAmmunitionCount }}发</div>
            </div>

            <div class="control-item">
              <span class="control-label">装填状态</span>
              <div
                class="control-info"
                :class="
                  artilleryStatus.isLoaded
                    ? 'text-green-600'
                    : 'text-orange-600'
                "
              >
                {{
                  artilleryStatus.isLoaded
                    ? `已装填: ${loadedAmmunitionType}`
                    : "未装填"
                }}
              </div>
            </div>

            <el-button
              class="target-setting-btn"
              @click="loadAmmunition"
              :disabled="!selectedAmmunitionType || artilleryStatus.isLoaded"
            >
              装填弹药
            </el-button>
          </div>

          <!-- 操作按钮组 -->
          <div class="action-buttons">
            <!-- 发射次数输入 -->
            <div class="input-group mb-2" v-if="artilleryStatus.isLoaded">
              <div class="input-wrapper">
                <el-input-number
                  v-model="fireCount"
                  :min="1"
                  :max="currentLoadedAmmunitionCount"
                  :precision="0"
                  :disabled="!isFireCountEditing"
                  class="fire-count-input"
                  controls-position="right"
                />
                <el-button
                  class="confirm-btn"
                  @click="handleSetFireCount"
                  :type="isFireCountEditing ? 'primary' : 'default'"
                >
                  {{ isFireCountEditing ? "确定" : "编辑" }}
                </el-button>
              </div>
            </div>

            <div class="button-row mb-2">
              <el-button
                class="target-setting-btn"
                @click="fireAtDrone"
                :type="isFiring ? 'danger' : 'primary'"
                :disabled="
                  !isConnected ||
                  !artilleryStatus.isLoaded ||
                  !selectedStrikeCount ||
                  selectedStrikeCount < 1
                "
              >
                <span v-if="isFiring">开火中...</span>
                <span v-else>开火</span>
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
              温度{{ environment.temperature }}°C，气压{{ environment.pressure
              }}<br />
              风速{{ environment.windSpeed }}m/s，湿度{{
                environment.humidity
              }}%<br />
              能见度{{ environment.visibility }}km
            </div>
          </div>
        </div>

        <!-- 平台状态 -->
        <div class="status-card platform-status">
          <div class="status-content">
            <div class="status-title">平台状态</div>
            <div class="status-info">
              射击准备：{{ artilleryStatus.isReady ? "就绪" : "未就绪" }}<br />
              炮管温度：{{ artilleryStatus.temperature }}°C<br />
              系统状态：{{ artilleryStatus.systemStatus }}
            </div>
          </div>
        </div>

        <!-- 对目标状态 -->
        <div class="status-card target-status">
          <div class="status-content">
            <div class="status-title">对目标状态</div>
            <div class="status-info">
              目标类型：{{ targetInfo.type }}<br />
              距离：{{ targetInfo.distance }}m<br />
              方位：{{ targetInfo.bearing }}°
            </div>
          </div>
        </div>

        <!-- 炮弹状态 -->
        <div class="status-card shell-status">
          <div class="status-content">
            <div class="status-title">炮弹状态</div>
            <div class="status-info">
              弹药数量：{{ ammunitionCount }}发<br />
              装填状态：{{ artilleryStatus.isLoaded ? "已装填" : "未装填"
              }}<br />
              发射状态：{{ fireStatus }}
            </div>
          </div>
        </div>

        <!-- 目标状态 -->
        <div class="status-card coordination-status">
          <div class="status-content">
            <div class="status-title">目标状态</div>
            <div class="status-info">
              目标ID：{{ targetDroneId }}<br />
              目标高度：{{ targetInfo.altitude }}m<br />
              协同状态：{{ coordinationStatus.mode }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部协同报文区域 -->
    <div class="bottom-panel mt-4">
      <div class="report-header">
        <el-button class="report-send-btn" @click="handleSendCooperationCommand"
          >发送协同指令</el-button
        >
        <span class="report-title">协同报文区域</span>
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
import { ElMessage } from "element-plus";
import { Loading, WarningFilled } from "@element-plus/icons-vue";

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

// 当前目标信息接口
interface CurrentTarget {
  name: string;
  coordinates: string;
}

// 弹药类型接口
interface AmmunitionType {
  label: string;
  value: string;
  count: number;
}

// 环境状态接口
interface Environment {
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: string;
  exerciseTime: string;
}

// 协同状态接口
interface CoordinationStatus {
  mode: string;
  dataLink: string;
  targetSharing: string;
}

// 平台信息接口
interface Platform {
  base: {
    name: string;
    type: string;
    side: string;
    group: string;
    broken: boolean;
    location: {
      longitude: number;
      latitude: number;
      altitude: number;
    };
    roll: number;
    pitch: number;
    yaw: number;
    speed: number;
  };
  updateTime: number;
  // 其他字段...
}

// 分组选项接口
interface GroupOption {
  label: string;
  value: string;
}

// 火炮选项接口
interface ArtilleryOption {
  label: string;
  value: string;
  platform: Platform;
}

// 响应式数据
const selectedGroup = ref("");
const selectedInstance = ref("");
const operatorName = ref("");
const ammunitionCount = ref(12);
const targetDroneId = ref("UAV-001");
const fireStatus = ref("待发射");
const weaponName = ref("155毫米榴弹炮"); // 武器名称，默认值
const targetName = ref("无人机-001"); // 目标名称，默认值

// 当前目标信息
const currentTarget = reactive<CurrentTarget>({
  name: "敌方无人机-001",
  coordinates: "E115°30'12\" N39°45'36\"",
});

// 弹药类型选择
const selectedAmmunitionType = ref("");
const loadedAmmunitionType = ref(""); // 当前装填的弹药类型
const ammunitionTypes = ref<AmmunitionType[]>([
  { label: "155mm高爆弹", value: "HE_155", count: 20 },
  { label: "155mm穿甲弹", value: "AP_155", count: 15 },
  { label: "155mm烟雾弹", value: "SMOKE_155", count: 8 },
  { label: "155mm照明弹", value: "ILLUM_155", count: 12 },
  { label: "120mm迫击炮弹", value: "MORTAR_120", count: 25 },
]);

// 计算当前选中弹药的数量
const currentAmmunitionCount = computed(() => {
  if (!selectedAmmunitionType.value) return 0;
  const selectedAmmo = ammunitionTypes.value.find(
    (ammo) => ammo.value === selectedAmmunitionType.value
  );
  return selectedAmmo ? selectedAmmo.count : 0;
});

// 计算当前已装填弹药的数量（用于限制打击数量）
const currentLoadedAmmunitionCount = computed(() => {
  if (!artilleryStatus.isLoaded || !loadedAmmunitionType.value) return 0;
  const loadedAmmo = ammunitionTypes.value.find(
    (ammo) => ammo.label === loadedAmmunitionType.value
  );
  return loadedAmmo ? loadedAmmo.count + 1 : 1; // +1因为装填的那一发已经从库存中减去
});

// 打击数量选择（数字输入）
const selectedStrikeCount = ref<number>(1);

// 发射次数相关
const fireCount = ref<number>(1);
const isFireCountEditing = ref(false);

// 文档查看相关
const documentDialogVisible = ref(false);
const documentContent = ref("");
const documentLoading = ref(false);
const documentError = ref("");

// 新增缺失的变量
const isConnected = ref(false);
const isWeaponNameEditing = ref(true);
const isTargetNameEditing = ref(true);
const isFiring = ref(false);

// 平台数据
const platforms = ref<Platform[]>([]);
const lastUpdateTime = ref<number>(0);

// 已连接的平台信息
const connectedPlatform = ref<Platform | null>(null);
const connectedPlatformName = ref<string>("");

const connectionStatus = reactive<ConnectionStatus>({
  isConnected: false,
  simulationEndpoint: "",
});

const artilleryStatus = reactive<ArtilleryStatus>({
  isReady: false,
  isLoaded: false,
  temperature: 32,
  systemStatus: "正常",
});

const targetInfo = reactive<TargetInfo>({
  type: "无人机",
  distance: 3200,
  bearing: 45,
  altitude: 1200,
});

const environment = reactive<Environment>({
  temperature: 25,
  humidity: 65,
  windSpeed: 3.2,
  visibility: 12,
  pressure: "1013hPa",
  exerciseTime: "14:30:25",
});

const coordinationStatus = reactive<CoordinationStatus>({
  mode: "自主协同",
  dataLink: "正常",
  targetSharing: "已共享",
});

// 协同报文数据
const cooperationMessages = ref([
  { time: "23:43:11", message: "无人机发出协同打击报文", type: "uav" },
  { time: "23:48:22", message: "火炮发出已打击报文", type: "artillery" },
]);

// 计算属性：可用的分组选项（从平台数据中获取）
const groupOptions = computed<GroupOption[]>(() => {
  const groups = new Set<string>();

  // 从真实平台数据中获取分组（支持多种火炮类型）
  platforms.value.forEach((platform) => {
    if (
      platform.base?.group &&
      (platform.base?.type === "ROCKET_LAUNCHER" ||
        platform.base?.type === "Artillery" ||
        platform.base?.type === "CANNON")
    ) {
      groups.add(platform.base.group);
    }
  });

  // 如果没有真实数据，使用默认分组
  if (groups.size === 0) {
    const fakeGroups = ["第一火炮营", "第二火炮营", "第三火炮营"];
    fakeGroups.forEach((group) => groups.add(group));
  }

  return Array.from(groups).map((group) => ({
    label: group,
    value: group,
  }));
});

// 计算属性：当前分组下的火炮选项
const artilleryOptions = computed<ArtilleryOption[]>(() => {
  if (!selectedGroup.value) {
    return [];
  }

  // 从真实平台数据中获取火炮（支持多种类型）
  const realArtillery = platforms.value
    .filter(
      (platform) =>
        platform.base?.group === selectedGroup.value &&
        (platform.base?.type === "ROCKET_LAUNCHER" ||
          platform.base?.type === "Artillery" ||
          platform.base?.type === "CANNON") &&
        !platform.base?.broken
    )
    .map((platform) => ({
      label: platform.base.name || "未命名火炮",
      value: platform.base.name || "",
      platform: platform,
    }));

  // 如果有真实数据，直接返回
  if (realArtillery.length > 0) {
    return realArtillery;
  }

  // 如果没有真实数据，使用默认火炮数据
  const fakeArtillery: ArtilleryOption[] = [];
  if (selectedGroup.value === "第一火炮营") {
    fakeArtillery.push(
      {
        label: "155mm榆弹炮-01",
        value: "155mm榆弹炮-01",
        platform: {} as Platform,
      },
      {
        label: "155mm榆弹炮-02",
        value: "155mm榆弹炮-02",
        platform: {} as Platform,
      },
      {
        label: "120mm迫击炮-01",
        value: "120mm迫击炮-01",
        platform: {} as Platform,
      }
    );
  } else if (selectedGroup.value === "第二火炮营") {
    fakeArtillery.push(
      {
        label: "203mm榆弹炮-01",
        value: "203mm榆弹炮-01",
        platform: {} as Platform,
      },
      {
        label: "203mm榆弹炮-02",
        value: "203mm榆弹炮-02",
        platform: {} as Platform,
      }
    );
  } else if (selectedGroup.value === "第三火炮营") {
    fakeArtillery.push(
      { label: "火箭炮-01", value: "火箭炮-01", platform: {} as Platform },
      { label: "火箭炮-02", value: "火箭炮-02", platform: {} as Platform },
      { label: "火箭炮-03", value: "火箭炮-03", platform: {} as Platform }
    );
  }

  return fakeArtillery;
});

// 监听分组变化，重置火炮选择
const onGroupChange = (value: string) => {
  selectedInstance.value = "";

  if (value) {
    // 选择了分组
    if (artilleryOptions.value.length === 1) {
      // 如果只有一个火炮，自动选择
      selectedInstance.value = artilleryOptions.value[0].value;
    }

    console.log(`[ArtilleryPage] 选择分组: ${value}`);
  } else {
    // 清空分组
    console.log(`[ArtilleryPage] 已清空分组选择`);
  }
};

// 连接到仿真端
const connectToSimulation = () => {
  if (!selectedGroup.value || !selectedInstance.value) {
    ElMessage.warning("请选择组和实例");
    return;
  }

  ElMessage.success(
    `正在连接到 ${selectedGroup.value} - ${selectedInstance.value}`
  );
  connectionStatus.isConnected = true;
  connectionStatus.simulationEndpoint = `${selectedGroup.value}/${selectedInstance.value}`;
  artilleryStatus.isReady = true;

  // TODO: 实际的连接逻辑
};

// 处理连接平台
const handleConnectPlatform = () => {
  if (isConnected.value) {
    // 断开连接
    isConnected.value = false;
    connectionStatus.isConnected = false;
    connectedPlatform.value = null;
    connectedPlatformName.value = "";
    ElMessage.warning("平台连接已断开");
    return;
  }

  if (!selectedGroup.value || !selectedInstance.value) {
    ElMessage.warning("请先选择分组和火炮");
    return;
  }

  // 查找已选择的平台
  const targetPlatform = platforms.value.find(
    (platform) =>
      platform.base?.name === selectedInstance.value &&
      platform.base?.group === selectedGroup.value &&
      platform.base?.type === "ROCKET_LAUNCHER"
  );

  if (targetPlatform) {
    // 连接到真实平台
    isConnected.value = true;
    connectionStatus.isConnected = true;
    connectedPlatform.value = targetPlatform;
    connectedPlatformName.value = selectedInstance.value;
    artilleryStatus.isReady = true;
    console.log(`[ArtilleryPage] 连接到真实平台: ${selectedInstance.value}`);
    ElMessage.success(`平台连接成功: ${selectedInstance.value}`);
  } else {
    // 未找到真实平台，但仍然允许连接（使用默认数据）
    isConnected.value = true;
    connectionStatus.isConnected = true;
    connectedPlatform.value = null; // 没有真实平台数据
    connectedPlatformName.value = selectedInstance.value;
    artilleryStatus.isReady = true;
    console.log(`[ArtilleryPage] 连接到模拟平台: ${selectedInstance.value}`);
    ElMessage.success(`平台连接成功（模拟模式）: ${selectedInstance.value}`);
  }
};

// 目标装订
const handleTargetSetting = () => {
  // 模拟更新目标信息
  const targetNames = [
    "敌方无人机-001",
    "敌方装甲车-002",
    "敌方雷达站-003",
    "敌方指挥所-004",
  ];
  const coordinates = [
    "E115°30'12\" N39°45'36\"",
    "E115°32'45\" N39°43'21\"",
    "E115°35'18\" N39°41'55\"",
    "E115°28'33\" N39°47'12\"",
  ];

  const randomIndex = Math.floor(Math.random() * targetNames.length);
  currentTarget.name = targetNames[randomIndex];
  currentTarget.coordinates = coordinates[randomIndex];

  ElMessage.success(`目标装订完成：${currentTarget.name}`);
};

// 处理武器名称输入
const handleInputWeaponName = () => {
  if (isWeaponNameEditing.value) {
    if (!weaponName.value.trim()) {
      ElMessage.warning("请输入武器名称");
      return;
    }
    isWeaponNameEditing.value = false;
    ElMessage.success(`武器名称已设置: ${weaponName.value}`);
  } else {
    isWeaponNameEditing.value = true;
  }
};

// 处理目标名称输入
const handleInputTargetName = () => {
  if (isTargetNameEditing.value) {
    if (!targetName.value.trim()) {
      ElMessage.warning("请输入目标名称");
      return;
    }
    isTargetNameEditing.value = false;
    ElMessage.success(`目标名称已设置: ${targetName.value}`);
  } else {
    isTargetNameEditing.value = true;
  }
};

// 处理发射次数输入
const handleSetFireCount = () => {
  if (isFireCountEditing.value) {
    // 确定模式
    if (!fireCount.value || fireCount.value < 1) {
      ElMessage.warning("请输入正确的发射次数");
      return;
    }
    if (fireCount.value > currentLoadedAmmunitionCount.value) {
      ElMessage.warning(
        `发射次数不能超过${currentLoadedAmmunitionCount.value}发`
      );
      return;
    }
    selectedStrikeCount.value = fireCount.value;
    isFireCountEditing.value = false;
    ElMessage.success(`发射次数已设置: ${fireCount.value}次`);
  } else {
    // 编辑模式
    isFireCountEditing.value = true;
  }
};

// 发送协同指令
const handleSendCooperationCommand = () => {
  ElMessage.success("协同指令已发送");

  // 添加新的协同报文
  cooperationMessages.value.unshift({
    time: new Date().toLocaleTimeString(),
    message: "火炮发出协同打击报文",
    type: "artillery",
  });
};

// 装填弹药
const loadAmmunition = () => {
  if (!selectedAmmunitionType.value) {
    ElMessage.warning("请先选择弹药类型");
    return;
  }

  const selectedAmmo = ammunitionTypes.value.find(
    (ammo) => ammo.value === selectedAmmunitionType.value
  );
  if (!selectedAmmo || selectedAmmo.count <= 0) {
    ElMessage.error("该弹药库存不足");
    return;
  }

  ElMessage.success(`${selectedAmmo.label}装填完成`);
  artilleryStatus.isLoaded = true;

  // 记录已装填的弹药类型
  loadedAmmunitionType.value = selectedAmmo.label;

  // 减少对应弹药数量
  selectedAmmo.count--;

  // 更新武器名称为当前装填的弹药
  weaponName.value = selectedAmmo.label;

  // 重置发射次数为1
  selectedStrikeCount.value = 1;
  fireCount.value = 1;
  isFireCountEditing.value = false;

  // TODO: 实际的装填逻辑
};

// 发射火炮
const fireAtDrone = async () => {
  try {
    // 检查必要参数
    if (!selectedStrikeCount.value || selectedStrikeCount.value < 1) {
      ElMessage.warning("请设置正确的打击数量");
      return;
    }

    if (selectedStrikeCount.value > currentLoadedAmmunitionCount.value) {
      ElMessage.warning("打击数量不能超过已装填弹药数量");
      return;
    }

    ElMessage.success(
      `向目标 ${currentTarget.name} 进行${selectedStrikeCount.value}次打击，使用 ${loadedAmmunitionType.value}`
    );
    artilleryStatus.isLoaded = false;
    fireStatus.value = "开火中...";

    // 构造 PlatformCmd 数据
    const platformCmdData = {
      commandID: Date.now(), // 使用时间戳作为命令ID
      platformName: selectedInstance.value || "artillery1", // 平台名称
      command: 8, // Arty_Fire = 8 (根据更新后的 PlatformCmd.proto)
      fireParam: {
        weaponName: loadedAmmunitionType.value,
        targetName: currentTarget.name,
        quantity: selectedStrikeCount.value, // 使用选中的打击数量
      },
    };

    console.log("发送 PlatformCmd 数据:", platformCmdData);

    // 发送 PlatformCmd 组播消息
    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      platformCmdData
    );

    if (result.success) {
      ElMessage.success("🚀 火炮控制命令发送成功");
      fireStatus.value = "已发射";

      // 发射后清空装填状态，需要重新装填
      artilleryStatus.isLoaded = false;
      loadedAmmunitionType.value = ""; // 清空已装填弹药类型

      // 模拟发射后自动发送防空报文
      setTimeout(() => {
        ElMessage.info("已自动发送防空报文给无人机");
        fireStatus.value = "防空报文已发送";
      }, 1000);

      // 重置状态
      setTimeout(() => {
        fireStatus.value = "待发射";
        // 模拟目标变化
        targetDroneId.value = `UAV-${String(
          Math.floor(Math.random() * 999) + 1
        ).padStart(3, "0")}`;
        // 清空输入框，准备下次操作
        // weaponName.value = '';
        // targetName.value = '';
      }, 3000);
    } else {
      ElMessage.error(`发送失败: ${result.error}`);
      fireStatus.value = "发送失败";
      // 发射失败时不清空装填状态
    }
  } catch (error) {
    console.error("发射操作失败:", error);
    ElMessage.error("发射操作失败");
    fireStatus.value = "操作失败";
    // 操作失败时不清空装填状态
  }

  // TODO: 实际的发射逻辑和防空报文发送
};

// 更新火炮平台状态显示
const updateArtilleryStatusDisplay = (platform: any) => {
  if (!platform?.base) return;

  // 更新平台位置信息
  if (platform.base.location) {
    // 更新目标信息（距离和方位计算需要对比坐标）
    targetInfo.distance = Math.floor(Math.random() * 1000) + 2000; // 模拟距离
    targetInfo.bearing = Math.floor(Math.random() * 360); // 模拟方位
    targetInfo.altitude = platform.base.location.altitude + 200; // 模拟高度差
  }

  // 更新火炮系统状态
  artilleryStatus.isReady = !platform.base?.broken;
  artilleryStatus.systemStatus = platform.base?.broken ? "故障" : "正常";

  // 模拟炮管温度变化
  if (artilleryStatus.isLoaded) {
    artilleryStatus.temperature = 35 + Math.random() * 10; // 装填后温度上升
  } else {
    artilleryStatus.temperature = 25 + Math.random() * 5; // 正常温度
  }

  // 更新武器状态（从武器信息获取）
  if (platform.weapons && Array.isArray(platform.weapons)) {
    platform.weapons.forEach((weapon: any) => {
      if (weapon.quantity !== undefined) {
        ammunitionCount.value = weapon.quantity;
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

        // 如果已连接，更新已连接平台的状态
        if (isConnected.value && connectedPlatformName.value) {
          const updatedPlatform = parsedData.platform.find(
            (p: any) =>
              p.base?.name === connectedPlatformName.value &&
              (p.base?.type === "ROCKET_LAUNCHER" ||
                p.base?.type === "Artillery" ||
                p.base?.type === "CANNON")
          );

          if (updatedPlatform) {
            connectedPlatform.value = updatedPlatform;
            // 更新火炮状态显示
            updateArtilleryStatusDisplay(updatedPlatform);
            console.log(
              `[ArtilleryPage] 更新已连接平台状态: ${connectedPlatformName.value}`
            );
          }
        }

        console.log("[ArtilleryPage] 收到平台状态数据:", {
          平台数量: parsedData.platform.length,
          火炮数量: parsedData.platform.filter(
            (p: any) =>
              p.base?.type === "ROCKET_LAUNCHER" ||
              p.base?.type === "Artillery" ||
              p.base?.type === "CANNON"
          ).length,
          已连接平台: connectedPlatformName.value || "未连接",
        });
      }
    }
  } catch (error) {
    console.error("[ArtilleryPage] 处理平台状态数据失败:", error);
  }
};

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

// 生命周期钩子
onMounted(() => {
  // 监听平台状态数据
  if (window.electronAPI?.multicast?.onPacket) {
    window.electronAPI.multicast.onPacket(handlePlatformStatus);
    console.log("[ArtilleryPage] 已开始监听平台状态数据");
  } else {
    console.warn("[ArtilleryPage] multicast API 不可用");
  }
});

onUnmounted(() => {
  // 清理监听器
  if (window.electronAPI?.multicast?.removeAllListeners) {
    window.electronAPI.multicast.removeAllListeners("packet");
    console.log("[ArtilleryPage] 已停止监听平台状态数据");
  }
});
</script>

<style scoped>
.artillery-operation-page {
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

.control-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

/* 弹药选择框 */
.ammunition-select {
  width: 180px;
}

/* 打击次数选择 */
.strike-count-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.strike-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.strike-select {
  flex: 1;
  min-width: 120px;
}

/* 数字输入框 */
.strike-input-number {
  flex: 1;
  min-width: 120px;
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

/* 目标装订按钮 */
.target-setting-btn {
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
  margin-bottom: 16px;
}

.target-setting-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

/* 目标信息显示 */
.target-info-display {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
}

.target-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.target-info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-weight: 600;
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
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
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

.control-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  margin-top: 16px;
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

.weapon-input {
  flex: 1;
}

/* 发射次数输入框 */
.fire-count-input {
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

.action-btn.full-width {
  width: 100%;
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
  height: 140px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.report-messages {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-item {
  font-size: 13px;
  color: #666;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

/* 颜色类 */
.text-green-600 {
  color: #16a085;
}

.text-orange-600 {
  color: #f39c12;
}

.text-red-600 {
  color: #e74c3c;
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
