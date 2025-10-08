<template>
  <div class="artillery-operation-page h-full p-4">
    <!-- 顶部控制区域 -->
    <div class="top-section mb-4">
      <div class="top-content">
        <!-- 连接控制卡片 -->
        <div class="connection-card">
          <!-- 未连接时的布局 -->
          <div v-if="!isConnected" class="control-row">
            <!-- 左侧标题区域 -->
            <div class="title-section">
              <div class="seat-title">火炮席位</div>
            </div>

            <!-- 中间控制区域 -->
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
                v-model="selectedInstance"
                placeholder="选择火炮"
                class="control-select large"
                @change="handleSelectArtillery"
                :disabled="!selectedGroup"
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
                type="primary"
              >
                连接平台
              </el-button>
              <div class="function-separator"></div>
              <el-button
                class="exercise-btn"
                @click="openDocument"
                type="success"
              >
                打开演练方案
              </el-button>
            </div>
          </div>

          <!-- 已连接时的布局 -->
          <div v-if="isConnected" class="connected-layout">
            <!-- 第一部分：组别和组内平台 -->
            <div class="layout-section group-platforms-section">
              <div class="platforms-container">
                <!-- 平台列表 -->
                <div class="platforms-list">
                  <div
                    v-for="platform in sameGroupPlatforms"
                    :key="platform.name"
                    class="platform-item"
                    :class="{
                      'current-platform':
                        platform.name === connectedPlatformName,
                      online: platform.isOnline && !platform.isCurrentPlatform,
                      offline:
                        !platform.isOnline && !platform.isCurrentPlatform,
                      'connected-platform': platform.isCurrentPlatform,
                    }"
                  >
                    <!-- 平台图标/头像 -->
                    <div class="platform-avatar">
                      <!-- 如果有图片数据，使用实际图片 -->
                      <img
                        v-if="platform.imageData"
                        :src="platform.imageData"
                        :alt="platform.displayType"
                        class="avatar-image"
                        @error="onImageError(platform)"
                      />
                      <!-- 如果没有图片，显示默认图标 -->
                      <div
                        v-else
                        class="avatar-icon"
                        :class="getPlatformIconClass(platform.type)"
                      >
                        {{ getPlatformIcon(platform.type) }}
                      </div>
                    </div>

                    <div class="platform-info">
                      <span class="platform-name">{{ platform.name }}</span>
                      <span class="platform-type">{{ selectedGroup }}</span>
                      <span class="platform-status-text">{{
                        platform.statusText
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 第二部分：演习时间和天文时间 -->
            <div class="layout-section time-section">
              <div class="time-content">
                <div class="exercise-time">
                  演习时间：{{ environmentParams.exerciseTime }}
                </div>
                <div class="astronomical-time">
                  天文时间：{{ environmentParams.astronomicalTime }}
                </div>
              </div>
            </div>

            <!-- 第三部分：操作按钮 -->
            <div class="layout-section controls-section">
              <el-button
                class="control-btn"
                @click="handleConnectPlatform"
                type="warning"
              >
                断开
              </el-button>

              <!-- 功能区域分隔符 -->
              <div class="function-separator"></div>

              <!-- 演练方案按钮 -->
              <el-button
                class="exercise-btn"
                @click="openDocument"
                type="success"
              >
                打开演练方案
              </el-button>
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
            <!-- 协同命令目标信息显示 -->
            <div
              class="coordination-target-display mb-3"
              v-if="receivedCoordinationTarget.name"
            >
              <div class="coordination-header">
                <span class="coordination-title">协同目标信息</span>
                <el-tag size="small" type="success">来自无人机协同</el-tag>
              </div>
              <div class="target-info-item">
                <span class="info-label">目标名称：</span>
                <span class="info-value">{{
                  receivedCoordinationTarget.name
                }}</span>
              </div>
              <div class="target-info-item">
                <span class="info-label">目标坐标：</span>
                <span class="info-value">{{
                  receivedCoordinationTarget.coordinates
                }}</span>
              </div>
              <div class="target-info-item">
                <span class="info-label">协同平台：</span>
                <span class="info-value">{{
                  receivedCoordinationTarget.sourcePlatform
                }}</span>
              </div>
              <div class="coordination-actions">
                <el-button
                  size="small"
                  type="primary"
                  @click="adoptCoordinationTarget"
                >
                  采用协同目标
                </el-button>
                <el-button
                  size="small"
                  type="default"
                  @click="clearCoordinationTarget"
                >
                  清除
                </el-button>
              </div>
            </div>

            <!-- 目标信息显示 -->
            <div class="target-info-display mb-3">
              <div v-if="currentTarget.name" class="target-info-item">
                <span class="info-label">目标名称：</span>
                <span class="info-value">{{ currentTarget.name }}</span>
              </div>
              <div v-if="currentTarget.coordinates" class="target-info-item">
                <span class="info-label">目标坐标：</span>
                <span class="info-value">{{ currentTarget.coordinates }}</span>
              </div>
              <div
                v-if="!currentTarget.name"
                class="target-info-item no-target"
              >
                <span class="info-label">目标信息：</span>
                <span class="info-value">暂无目标信息</span>
              </div>
            </div>

            <el-button
              class="target-setting-btn"
              @click="handleTargetSetting"
              :disabled="!currentTarget.name"
            >
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

            <!-- 装填数量输入 -->
            <div
              class="control-item"
              v-if="selectedAmmunitionType && !artilleryStatus.isLoaded"
            >
              <span class="control-label">装填数量</span>
              <div class="input-wrapper">
                <el-input-number
                  v-model="loadCount"
                  :min="1"
                  :max="currentAmmunitionCount"
                  :precision="0"
                  :disabled="!isLoadCountEditing"
                  class="load-count-input"
                  controls-position="right"
                />
                <el-button
                  class="confirm-btn"
                  @click="handleSetLoadCount"
                  :type="isLoadCountEditing ? 'primary' : 'default'"
                  size="small"
                >
                  {{ isLoadCountEditing ? "确定" : "编辑" }}
                </el-button>
              </div>
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
                    ? `已装填: ${actualLoadedCount}发 ${loadedAmmunitionDisplayName}`
                    : "未装填"
                }}
              </div>
            </div>

            <el-button
              class="target-setting-btn"
              @click="loadAmmunition"
              :disabled="
                !selectedAmmunitionType ||
                artilleryStatus.isLoaded ||
                !loadCount ||
                loadCount < 1
              "
            >
              装填弹药
            </el-button>
          </div>

          <!-- 操作按钮组 -->
          <div class="action-buttons">
            <div class="button-row mb-2">
              <el-button
                class="target-setting-btn"
                @click="fireAtDrone"
                :type="isFiring ? 'danger' : 'primary'"
                :disabled="
                  !isConnected ||
                  !artilleryStatus.isLoaded ||
                  !loadedAmmunitionType ||
                  !currentTarget.name ||
                  actualLoadedCount < 1
                "
              >
                <span v-if="isFiring">开火中...</span>
                <span v-else>开火 ({{ actualLoadedCount }}发)</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间状态显示区域 -->
      <div class="middle-panel flex flex-col gap-4">
        <!-- 气候环境 -->
        <div class="status-card environment-status">
          <div class="status-content">
            <div class="status-header">
              <div class="status-title">气候环境</div>
              <div
                class="data-source-indicator"
                :class="getEnvironmentDataSourceClass()"
              >
                <span class="indicator-dot"></span>
                <span class="indicator-text">{{
                  getEnvironmentDataSourceText()
                }}</span>
              </div>
            </div>

            <div
              class="status-info no-data"
              v-if="!hasEnvironmentData() && isConnected"
            >
              暂无环境数据
            </div>
            <div class="status-info" v-else>
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
            <div class="status-header">
              <div class="status-title">平台状态</div>
              <div
                class="data-source-indicator"
                :class="getPlatformDataSourceClass()"
              >
                <span class="indicator-dot"></span>
                <span class="indicator-text">{{
                  getPlatformDataSourceText()
                }}</span>
              </div>
            </div>

            <div
              class="status-info no-data"
              v-if="!hasPlatformData() && isConnected"
            >
              暂无平台数据
            </div>
            <div class="status-info" v-if="connectedPlatform">
              位置：{{
                formatCoordinate(connectedPlatform.base?.location?.longitude)
              }}
              {{ formatCoordinate(connectedPlatform.base?.location?.latitude)
              }}<br />
              高度：{{ connectedPlatform.base?.location?.altitude || 0 }}m<br />
              姿态：俨仰{{ formatAngle(connectedPlatform.base?.pitch) }} 横滚{{
                formatAngle(connectedPlatform.base?.roll)
              }}
              偏航{{ formatAngle(connectedPlatform.base?.yaw) }}
            </div>
          </div>
        </div>

        <!-- 目标状态 -->
        <div class="status-card coordination-status">
          <div class="status-content">
            <div class="status-header">
              <div class="status-title">目标状态</div>
              <div
                class="data-source-indicator"
                :class="getTargetDataSourceClass()"
              >
                <span class="indicator-dot"></span>
                <span class="indicator-text">{{
                  getTargetDataSourceText()
                }}</span>
              </div>
            </div>
            <div class="status-info" v-if="connectedPlatform?.targetLoad">
              目标名称：{{ connectedPlatform.targetLoad.targetName || "未设置"
              }}<br />
              距离：{{
                formatValue(connectedPlatform.targetLoad.distance, "m", 0)
              }}<br />
              方位：{{
                formatValue(connectedPlatform.targetLoad.bearing, "°")
              }}
              高差：{{
                formatValue(
                  connectedPlatform.targetLoad.elevationDifference,
                  "m",
                  1,
                  "+"
                )
              }}
              方位角：{{
                formatValue(connectedPlatform.targetLoad.azimuth, "°", 2)
              }}
              高低角：{{
                formatValue(connectedPlatform.targetLoad.pitch, "°", 2)
              }}
            </div>
            <div class="status-info no-data" v-if="!hasTargetData()">
              暂无目标数据
            </div>
          </div>
        </div>

        <!-- 炮弹状态 -->
        <div class="status-card shell-status">
          <div class="status-content">
            <div class="status-header">
              <div class="status-title">炮弹状态</div>
              <div
                class="data-source-indicator"
                :class="getShellDataSourceClass()"
              >
                <span class="indicator-dot"></span>
                <span class="indicator-text">{{
                  getShellDataSourceText()
                }}</span>
              </div>
            </div>
            <div class="status-info" v-if="getLatestShell()">
              炮弹名称：{{ getLatestShell().base.name }}<br />
              位置：{{
                formatCoordinate(getLatestShell().base?.location?.longitude)
              }}
              {{ formatCoordinate(getLatestShell().base?.location?.latitude) }}
              高度：{{
                getLatestShell().base?.location?.altitude.toFixed(2) || 0
              }}m<br />
              姿态：俯仰{{ formatAngle(getLatestShell().base?.pitch) }} 横滚{{
                formatAngle(getLatestShell().base?.roll)
              }}
              偏航{{ formatAngle(getLatestShell().base?.yaw) }} 速度：{{
                getLatestShell().base?.speed.toFixed(2) || 0.0
              }}m/s
            </div>
            <div
              class="status-info no-data"
              v-if="!getLatestShell() && isConnected"
            >
              暂无炮弹数据
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧协同报文区域 -->
      <div class="right-panel">
        <!-- 任务目标提醒栏 -->
        <div v-if="isConnected" class="mission-target-banner mb-4">
          <div class="banner-content">
            <div class="banner-icon">
              <el-icon size="16"><LocationFilled /></el-icon>
            </div>
            <div class="target-main-content" v-if="missionTarget">
              <!-- 状态标签绝对定位在右上角 -->
              <div class="target-status-indicator">
                <div
                  v-if="missionTarget.status === 'destroyed'"
                  class="target-status destroyed"
                >
                  <el-icon class="status-icon"><CircleClose /></el-icon>
                  <span class="status-text">已摧毁</span>
                </div>
                <div
                  v-else-if="missionTarget.status === 'active'"
                  class="target-status active"
                >
                  <el-icon class="status-icon"><SuccessFilled /></el-icon>
                  <span class="status-text">正常</span>
                </div>
                <div v-else class="target-status inactive">
                  <el-icon class="status-icon"><WarningFilled /></el-icon>
                  <span class="status-text">未扫到</span>
                </div>
              </div>

              <div class="target-header">
                <span class="banner-title">当前任务目标：</span>
              </div>
              <div class="target-details">
                <div class="target-avatar-name-section">
                  <!-- 目标图片或默认图标 -->
                  <div class="target-avatar">
                    <img
                      v-if="missionTarget.imageData"
                      :src="missionTarget.imageData"
                      :alt="missionTarget.platformType"
                      class="target-avatar-image"
                      @error="onTargetImageError(missionTarget)"
                    />
                    <el-icon
                      v-else
                      class="target-avatar-icon"
                      :class="getPlatformIconClass(missionTarget.platformType)"
                    >
                      {{ getPlatformIcon(missionTarget.platformType) }}
                    </el-icon>
                  </div>

                  <div class="target-name-type">
                    <span class="target-name">{{ missionTarget.name }}</span>
                    <span class="target-type">{{
                      missionTarget.platformType
                    }}</span>
                  </div>
                </div>
                <div class="target-coordinates">
                  <span class="coordinate-label">经纬高：</span>
                  <span class="coordinate-value">
                    {{ missionTarget.coordinates.longitude }}°,
                    {{ missionTarget.coordinates.latitude }}°,
                    {{ missionTarget.coordinates.altitude }}m
                  </span>
                </div>
              </div>
            </div>
            <div class="target-main-content" v-else>
              <span class="banner-title">当前任务目标：</span>
              <span class="target-info no-target">暂无任务目标</span>
            </div>
          </div>
        </div>

        <div class="report-panel">
          <div class="report-header">
            <span class="report-title">协同报文区域</span>
            <el-button
              class="report-send-btn"
              @click="handleSendCooperationCommand"
              size="small"
            >
              发送协同指令
            </el-button>
          </div>

          <div class="report-content">
            <div class="report-section">
              <div class="report-messages">
                <div
                  v-for="msg in cooperationMessages"
                  :key="msg.id"
                  class="message-item"
                  :class="{
                    'message-sent': msg.type === 'sent',
                    'message-received': msg.type === 'received',
                    'message-success': msg.status === 'success',
                    'message-failed': msg.status === 'failed',
                    'message-pending': msg.status === 'pending',
                  }"
                >
                  <div class="message-header">
                    <div class="message-direction">
                      <el-icon
                        v-if="msg.type === 'sent'"
                        class="direction-icon sent-icon"
                      >
                        <ArrowRight />
                      </el-icon>
                      <el-icon v-else class="direction-icon received-icon">
                        <ArrowLeft />
                      </el-icon>
                      <span class="direction-text">
                        {{ msg.type === "sent" ? "发出" : "收到" }}
                      </span>
                    </div>
                    <div class="message-time">
                      <span class="exercise-time">{{ msg.exerciseTime }}</span>
                      <span class="clock-time">{{
                        formatMessageTime(msg.timestamp)
                      }}</span>
                    </div>
                  </div>

                  <div class="message-body">
                    <div class="message-platform-info">
                      <span v-if="msg.type === 'sent'" class="platform-info">
                        发给：<strong>{{ msg.targetPlatform }}</strong>
                      </span>
                      <span v-else class="platform-info">
                        来自：<strong>{{ msg.sourcePlatform }}</strong>
                      </span>
                    </div>

                    <div class="message-content">{{ msg.content }}</div>

                    <div
                      v-if="msg.details.targetName || msg.details.weaponName"
                      class="message-details"
                    >
                      <el-tag
                        v-if="msg.details.targetName"
                        size="small"
                        type="info"
                      >
                        目标：{{ msg.details.targetName }}
                      </el-tag>
                      <el-tag
                        v-if="msg.details.weaponName"
                        size="small"
                        type="warning"
                      >
                        武器：{{ msg.details.weaponName }}
                      </el-tag>
                      <el-tag
                        v-if="msg.details.coordinates"
                        size="small"
                        type="success"
                      >
                        坐标：{{
                          msg.details.coordinates.longitude.toFixed(4)
                        }}°, {{ msg.details.coordinates.latitude.toFixed(4) }}°
                      </el-tag>
                    </div>
                  </div>
                </div>

                <div
                  v-if="cooperationMessages.length === 0"
                  class="message-item message-empty"
                >
                  暂无协同报文
                </div>
              </div>
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
import {
  Loading,
  WarningFilled,
  LocationFilled,
  CircleClose,
  SuccessFilled,
  ArrowRight,
  ArrowLeft,
} from "@element-plus/icons-vue";
import { platformHeartbeatService, platformImageService } from "../../services";

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
  weaponData?: any; // 可选，用于存放原始武器数据
}

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

// 环境状态接口（无人机页面格式）
interface EnvironmentParams {
  temperature: string;
  pressure: string;
  windSpeed: string;
  humidity: string;
  cloudCover: string;
  exerciseTime: string;
  astronomicalTime: string;
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
  weapons?: Array<{
    base?: {
      name?: string;
      type?: string;
    };
    quantity?: number;
  }>;
  updateTime: number;
  // 添加TargetLoad字段（来自protobuf定义）
  targetLoad?: {
    targetName?: string; // 目标名称
    distance?: number; // 距离
    bearing?: number; // 方位
    elevationDifference?: number; // 高差
    azimuth?: number; // 方位角
    pitch?: number; // 高低角
  };
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
const ammunitionCount = ref(12);
const fireStatus = ref("待发射");
const weaponName = ref("155毫米榴弹炮"); // 武器名称，默认值
const targetName = ref("无人机-001"); // 目标名称，默认值

// 当前目标信息
const currentTarget = reactive<CurrentTarget>({
  name: "",
  coordinates: "",
});

// 接收到的协同目标信息
interface CoordinationTarget {
  name: string;
  coordinates: string;
  sourcePlatform: string;
  longitude?: number;
  latitude?: number;
  altitude?: number;
}

const receivedCoordinationTarget = reactive<CoordinationTarget>({
  name: "",
  coordinates: "",
  sourcePlatform: "",
});

// 存储同组无人机的名称
const coordinatedUavName = ref("");

// 弹药类型选择
const selectedAmmunitionType = ref("");
const loadedAmmunitionType = ref(""); // 当前装填的弹药类型（原始武器名称）
const loadedAmmunitionDisplayName = ref(""); // 当前装填的弹药显示名称

// 动态弹药类型（从已连接火炮的weapons数组获取）
const ammunitionTypes = computed<AmmunitionType[]>(() => {
  // 如果已连接火炮且有武器数据，从真实数据获取
  if (
    isConnected.value &&
    connectedPlatform.value?.weapons &&
    Array.isArray(connectedPlatform.value.weapons)
  ) {
    return connectedPlatform.value.weapons.map((weapon: any) => {
      // 根据武器类型生成弹药标签
      let label = "未知弹药";
      let value = "UNKNOWN";
      let count = weapon.quantity || 0;

      if (weapon.base?.type) {
        const weaponType = weapon.base.type;
        const weaponName = weapon.base?.name || weaponType;

        // 根据武器类型判断弹药类型
        if (weaponType.includes("155") || weaponType.includes("榴弹炮")) {
          label = `${weaponName} - 155mm高爆弹`;
          value = `${weapon.base?.name}`;
        } else if (
          weaponType.includes("120") ||
          weaponType.includes("迫击炮")
        ) {
          label = `${weaponName} - 120mm迫击炮弹`;
          value = `${weapon.base?.name}`;
        } else if (
          weaponType.includes("ROCKET") ||
          weaponType.includes("火箭")
        ) {
          label = `${weaponName} - 火箭弹`;
          value = `${weapon.base?.name}`;
        } else if (
          weaponType.includes("CANNON") ||
          weaponType.includes("加农炮")
        ) {
          label = `${weaponName} - 加农炮弹`;
          value = `${weapon.base?.name}`;
        } else {
          // 通用处理
          label = `${weaponName} - 标准弹药`;
          value = `${weapon.base?.name}`;
        }
      }

      return {
        label,
        value,
        count,
        weaponData: weapon, // 保存原始武器数据以备后用
      };
    });
  }

  // 如果未连接或没有武器数据，返回默认弹药类型
  return [
    { label: "155mm高爆弹", value: "HE_155", count: 20 },
    { label: "155mm穿甲弹", value: "AP_155", count: 15 },
    { label: "155mm烟雾弹", value: "SMOKE_155", count: 8 },
    { label: "155mm照明弹", value: "ILLUM_155", count: 12 },
    { label: "120mm迫击炮弹", value: "MORTAR_120", count: 25 },
  ];
});

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

// 装填数量相关
const loadCount = ref<number>(1);
const isLoadCountEditing = ref(false);
const actualLoadedCount = ref<number>(0); // 实际装填的数量

// 文档查看相关
const documentDialogVisible = ref(false);
const documentContent = ref("");
const documentLoading = ref(false);
const documentError = ref("");

// 新增缺失的变量
const isConnected = ref(false);
const isFiring = ref(false);

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

// 平台数据
const platforms = ref<Platform[]>([]);
const lastUpdateTime = ref<number>(0);

// 已连接的平台信息
const connectedPlatform = ref<Platform | null>(null);
const connectedPlatformName = ref<string>("");

// 任务目标信息
const missionTarget = ref<any>(null);

// 同组平台信息
const sameGroupPlatforms = ref<any[]>([]);

// 心跳数据管理
const platformHeartbeats = ref<
  Map<string, { lastHeartbeat: number; isOnline: boolean }>
>(new Map());
const heartbeatTimeout = 10000; // 10秒超时判定为离线

// 平台图片数据管理
const platformImages = ref<Map<string, string>>(new Map());

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

// 环境参数数据（完全复制无人机页面）
const environmentParams = reactive<EnvironmentParams>({
  temperature: "25°C",
  pressure: "1013hPa",
  windSpeed: "3m/s",
  humidity: "60%",
  cloudCover: "20%",
  exerciseTime: "T + 0",
  astronomicalTime: "00:00:00",
});

// 格式化时间显示
const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 添加协同报文的通用方法
const addCooperationMessage = (
  message: Omit<CooperationMessage, "id" | "timestamp" | "exerciseTime">
): void => {
  const timestamp = Date.now();
  const newMessage: CooperationMessage = {
    id: `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    exerciseTime: environmentParams.exerciseTime, // 直接使用界面顶部显示的演习时间
    ...message,
  };

  cooperationMessages.value.unshift(newMessage);

  // 保持最多50条记录
  if (cooperationMessages.value.length > 50) {
    cooperationMessages.value = cooperationMessages.value.slice(0, 50);
  }
};

const coordinationStatus = reactive<CoordinationStatus>({
  mode: "自主协同",
  dataLink: "正常",
  targetSharing: "已共享",
});

// 协同报文数据结构定义
interface CooperationMessage {
  id: string; // 唯一标识
  timestamp: number; // 时间戳
  exerciseTime: string; // 演习时间（T+格式）
  type: "sent" | "received"; // 发送/接收方向
  commandType: "strike_coordinate" | "fire_coordinate" | "other"; // 命令类型
  sourcePlatform: string; // 来源平台
  targetPlatform: string; // 目标平台
  content: string; // 报文内容
  details: {
    targetName?: string; // 目标名称
    weaponName?: string; // 武器名称
    coordinates?: {
      longitude: number;
      latitude: number;
      altitude?: number;
    };
    commandId?: number; // 命令ID
  };
  status: "success" | "failed" | "pending"; // 状态
}

// 协同报文数据
const cooperationMessages = ref<CooperationMessage[]>([]);

// 计算属性：可用的分组选项（从平台数据中获取）
const groupOptions = computed<GroupOption[]>(() => {
  const groups = new Set<string>();

  // 从真实平台数据中获取分组（根据火炮类型识别规范）
  platforms.value.forEach((platform) => {
    if (
      platform.base?.group &&
      (platform.base?.type === "Artillery" ||
        platform.base?.type === "ROCKET_LAUNCHER" ||
        platform.base?.type === "CANNON")
    ) {
      groups.add(platform.base.group);
    }
  });

  // 根据项目规范，必须从platforms报文动态解析，不使用静态数据
  return Array.from(groups).map((group) => ({
    label: group,
    value: group,
  }));
});

// 动态火炮选项（基于选择的分组）
const artilleryOptions = computed<ArtilleryOption[]>(() => {
  if (!selectedGroup.value) return [];
  return platforms.value
    .filter(
      (platform) =>
        platform.base?.group === selectedGroup.value &&
        ["Artillery", "ROCKET_LAUNCHER", "CANNON"].includes(
          platform.base.type
        ) &&
        !platform.base?.broken &&
        platform.base?.side === "red"
    )
    .map((platform) => ({
      label: platform.base.name || "未命名火炮",
      value: platform.base.name || "",
      platform: platform,
    }));
});

// 获取任务目标（同组side为blue的平台）
const getMissionTarget = async () => {
  if (!selectedGroup.value || !platforms.value) {
    missionTarget.value = null;
    return;
  }

  // 查找同组中side为blue的平台作为任务目标
  const targetPlatform = platforms.value.find(
    (platform: any) =>
      platform.base?.group === selectedGroup.value &&
      platform.base?.side === "blue" &&
      platform.base?.location // 确保有位置信息
  );

  if (targetPlatform && targetPlatform.base) {
    // 检测目标是否被摧毁（根据业务规则判断）
    const targetStatus = checkMissionTargetStatus(targetPlatform.base.name);

    // 加载目标图片
    const imageData = await getPlatformImage(targetPlatform.base.type);

    missionTarget.value = {
      name: targetPlatform.base.name || "未知目标",
      coordinates: {
        longitude: targetPlatform.base.location.longitude.toFixed(6),
        latitude: targetPlatform.base.location.latitude.toFixed(6),
        altitude: targetPlatform.base.location.altitude,
      },
      platformType: targetPlatform.base.type || "未知类型",
      status: targetStatus, // 新增目标状态字段
      imageData: imageData, // 添加图片数据
    };
    console.log(
      `[ArtilleryPage] 找到任务目标: ${missionTarget.value.name}, 状态: ${targetStatus}`,
      missionTarget.value
    );
  } else {
    // 如果找不到对应的平台，但之前有任务目标，则可能被摧毁
    if (missionTarget.value && missionTarget.value.name) {
      const targetName = missionTarget.value.name;
      // 检查是否在所有平台中都找不到该目标
      const targetStillExists = platforms.value.some(
        (platform: any) => platform.base?.name === targetName
      );

      if (!targetStillExists) {
        // 目标不存在于任何平台中，判定为已摧毁
        console.log(`[ArtilleryPage] 任务目标 ${targetName} 已被摧毁`);
        missionTarget.value.status = "destroyed";
      } else {
        // 目标仍然存在但不在同组中，可能被重新分组或失联
        missionTarget.value.status = "inactive";
      }
      return;
    }

    missionTarget.value = null;
    console.log(`[ArtilleryPage] 未找到组 ${selectedGroup.value} 中的蓝方目标`);
  }
};

// 检测任务目标状态的专用函数
const checkMissionTargetStatus = (targetName: string): string => {
  if (!targetName || !platforms.value) {
    return "inactive";
  }

  // 检查目标是否在任何平台的tracks中被跟踪
  const isBeingTracked = platforms.value.some((platform: any) => {
    if (!platform.tracks || !Array.isArray(platform.tracks)) {
      return false;
    }
    return platform.tracks.some(
      (track: any) => track.targetName === targetName
    );
  });

  // 检查目标平台是否仍然存在
  const targetPlatformExists = platforms.value.some(
    (platform: any) => platform.base?.name === targetName
  );

  if (!targetPlatformExists) {
    // 目标平台不存在，判定为已摧毁
    return "destroyed";
  } else if (isBeingTracked) {
    // 目标平台存在且正在被跟踪，状态正常
    return "active";
  } else {
    // 目标平台存在但未被跟踪，可能失联
    return "inactive";
  }
};

// 数据源指示器相关函数
// 环境数据源判断
const hasEnvironmentData = () => {
  // 未连接时使用模拟数据
  if (!isConnected.value) {
    return true;
  }
  // 已连接时检查是否有真实数据
  return platforms.value.length > 0;
};

// 查找最新发射的炮弹
const getLatestShell = () => {
  if (!isConnected.value || !connectedPlatformName.value || !platforms.value) {
    return null;
  }

  // 构建炮弹名称的匹配模式：火炮名称_武器名称_发射顺序
  const artilleryName = connectedPlatformName.value;

  // 从platforms列表中查找符合命名规则的炮弹平台
  const shellPlatforms = platforms.value.filter((platform) => {
    if (!platform.base?.name) return false;

    // 检查是否以当前火炮名称开头
    if (!platform.base.name.startsWith(artilleryName + "_")) return false;

    // 检查命名格式是否符合：火炮名称_武器名称_发射顺序
    const nameParts = platform.base.name.split("_");
    if (nameParts.length < 3) return false;

    // 最后一部分应该是数字（发射顺序）
    const lastPart = nameParts[nameParts.length - 1];
    return /^\d+$/.test(lastPart);
  });

  if (shellPlatforms.length === 0) {
    return null;
  }

  // 找到发射顺序最大的炮弹（最新发射的）
  const latestShell = shellPlatforms.reduce((latest, current) => {
    const latestOrder = parseInt(latest.base.name.split("_").pop()) || 0;
    const currentOrder = parseInt(current.base.name.split("_").pop()) || 0;
    return currentOrder > latestOrder ? current : latest;
  });

  return latestShell;
};

const getEnvironmentDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (platforms.value.length > 0) {
    return "connected";
  } else {
    return "no-data";
  }
};

const getEnvironmentDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (platforms.value.length > 0) {
    return "实时数据";
  } else {
    return "无数据";
  }
};

// 平台数据源判断
const hasPlatformData = () => {
  // 未连接时使用模拟数据
  if (!isConnected.value) {
    return true;
  }
  // 已连接时检查是否有真实平台数据
  return connectedPlatform.value && connectedPlatform.value.base;
};

const getPlatformDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (connectedPlatform.value && connectedPlatform.value.base) {
    return "connected";
  } else {
    return "no-data";
  }
};

const getPlatformDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (connectedPlatform.value && connectedPlatform.value.base) {
    return "实时数据";
  } else {
    return "无数据";
  }
};

// 目标数据源判断
const hasTargetData = () => {
  // 未连接时使用模拟数据
  if (!isConnected.value) {
    return true;
  }
  // 已连接时检查是否有真实目标数据（首先检查 TargetLoad）
  return (
    connectedPlatform.value &&
    connectedPlatform.value.targetLoad &&
    connectedPlatform.value.targetLoad.targetName
  );
};

const getTargetDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (
    connectedPlatform.value &&
    connectedPlatform.value.targetLoad &&
    connectedPlatform.value.targetLoad.targetName
  ) {
    return "connected";
  } else {
    return "no-data";
  }
};

const getTargetDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (
    connectedPlatform.value &&
    connectedPlatform.value.targetLoad &&
    connectedPlatform.value.targetLoad.targetName
  ) {
    return "实时数据";
  } else {
    return "无数据";
  }
};

const getShellDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (getLatestShell()) {
    return "connected";
    return "connected";
  } else {
    return "no-data";
  }
};

const getShellDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (getLatestShell()) {
    return "实时数据";
  } else {
    return "无数据";
  }
};

// 按钮点击事件处理函数（参照无人机页面实现）
const handleSelectGroup = (value: string) => {
  selectedGroup.value = value;
  selectedInstance.value = ""; // 重置火炮选择

  if (value) {
    console.log(
      `[ArtilleryPage] 选择分组: ${
        groupOptions.value.find((g) => g.value === value)?.label || value
      }`
    );
    ElMessage.info(
      `已选择分组: ${
        groupOptions.value.find((g) => g.value === value)?.label || value
      }`
    );
  } else {
    console.log("[ArtilleryPage] 已清空分组选择");
    ElMessage.info("已清空分组选择");
  }
};

const handleSelectArtillery = (value: string) => {
  selectedInstance.value = value;

  if (value) {
    console.log(
      `[ArtilleryPage] 选择火炮: ${
        artilleryOptions.value.find((a) => a.value === value)?.label || value
      }`
    );
    ElMessage.info(
      `已选择火炮: ${
        artilleryOptions.value.find((a) => a.value === value)?.label || value
      }`
    );
  } else {
    console.log("[ArtilleryPage] 已清空火炮选择");
    ElMessage.info("已清空火炮选择");
  }
};

// 获取平台图片
const getPlatformImage = async (platformType: string): Promise<string> => {
  // 先检查缓存
  if (platformImages.value.has(platformType)) {
    return platformImages.value.get(platformType) || "";
  }

  try {
    const imageData = await platformImageService.getPlatformImageData(
      platformType
    );
    if (imageData) {
      platformImages.value.set(platformType, imageData);
      return imageData;
    }
  } catch (error) {
    console.error(`[ArtilleryPage] 获取平台图片失败: ${platformType}`, error);
  }

  // 返回默认图片或空字符串
  return "";
};

// 图片加载错误处理
const onImageError = (platform: any) => {
  console.warn(`[ArtilleryPage] 平台图片加载失败: ${platform.type}`);
  // 清除错误的缓存
  platformImages.value.delete(platform.type);
  // 可以在这里设置一个错误标记，让组件显示默认图标
  platform.imageError = true;
};

// 任务目标图片加载错误处理
const onTargetImageError = (target: any) => {
  console.warn(`[ArtilleryPage] 任务目标图片加载失败: ${target.platformType}`);
  // 清除错误的缓存
  platformImages.value.delete(target.platformType);
  // 设置错误标记，让组件显示默认图标
  target.imageError = true;
  // 清除图片数据，让模板显示默认图标
  target.imageData = null;
};

// 获取平台图标
const getPlatformIcon = (type: string): string => {
  const iconMap: { [key: string]: string } = {
    UAV01: "✈️", // 飞机
    Artillery: "⚙️", // 齿轮(代表机械设备)
    ROCKET_LAUNCHER: "🚀", // 火箭
    CANNON: "⚫", // 黑圆(代表炮弹)
    RADAR: "📡", // 卫星
    SHIP: "🚢", // 舰船
    GDS_CAR: "🚚", // 卡车
  };
  return iconMap[type] || "📦"; // 默认包裹图标
};

// 获取平台图标样式类
const getPlatformIconClass = (type: string): string => {
  const classMap: { [key: string]: string } = {
    UAV01: "uav-icon",
    Artillery: "artillery-icon",
    ROCKET_LAUNCHER: "rocket-icon",
    CANNON: "cannon-icon",
    RADAR: "radar-icon",
    SHIP: "ship-icon",
    GDS_CAR: "vehicle-icon",
  };
  return classMap[type] || "default-icon";
};

// 更新平台心跳状态
const updatePlatformHeartbeat = (platformName: string) => {
  const now = Date.now();
  platformHeartbeats.value.set(platformName, {
    lastHeartbeat: now,
    isOnline: true,
  });
  console.log(`[ArtilleryPage] 更新平台心跳: ${platformName}`);
};

// 检查平台心跳超时
const checkHeartbeatTimeouts = () => {
  const now = Date.now();
  platformHeartbeats.value.forEach((heartbeat, platformName) => {
    if (now - heartbeat.lastHeartbeat > heartbeatTimeout) {
      if (heartbeat.isOnline) {
        heartbeat.isOnline = false;
        console.log(`[ArtilleryPage] 平台心跳超时: ${platformName}`);
        // 更新同组平台信息，触发界面更新
        updateSameGroupPlatforms();
      }
    }
  });
};

// 判断平台是否在线（基于心跳数据）
const isPlatformOnlineByHeartbeat = (platformName: string): boolean => {
  const heartbeat = platformHeartbeats.value.get(platformName);
  return heartbeat ? heartbeat.isOnline : false;
};

// 更新同组平台信息
const updateSameGroupPlatforms = async () => {
  if (!isConnected.value || !selectedGroup.value || !platforms.value) {
    sameGroupPlatforms.value = [];
    return;
  }

  // 获取同组的红方平台（支持多种火炮类型）
  const groupPlatforms = platforms.value.filter(
    (platform: any) =>
      platform.base?.group === selectedGroup.value &&
      platform.base?.side === "red" &&
      (platform.base?.type === "ROCKET_LAUNCHER" ||
        platform.base?.type === "Artillery" ||
        platform.base?.type === "CANNON" ||
        platform.base?.type === "UAV01") && // 也包括同组的无人机
      platform.base?.name // 确保有名称
  );

  // 转换为展示格式
  const platformPromises = groupPlatforms.map(async (platform: any) => {
    const isCurrentPlatform =
      platform.base.name === connectedPlatformName.value;

    // 对于当前连接的平台，显示为已连接状态
    // 对于其他平台，基于心跳数据判断在线状态
    let isOnline;
    let statusText;

    if (isCurrentPlatform) {
      isOnline = true; // 当前连接平台总是在线
      statusText = "已连接";
    } else {
      isOnline = isPlatformOnlineByHeartbeat(platform.base.name);
      statusText = isOnline ? "在线" : "离线";
    }

    // 平台类型显示映射
    const getDisplayType = (type: string) => {
      const typeMap: { [key: string]: string } = {
        UAV01: "无人机",
        Artillery: "火炮",
        ROCKET_LAUNCHER: "火炮",
        CANNON: "加农炮",
        RADAR: "雷达",
        SHIP: "舰船",
      };
      return typeMap[type] || type || "未知";
    };

    // 异步加载平台图片
    const imageData = await getPlatformImage(platform.base.type);

    return {
      name: platform.base.name,
      type: platform.base.type,
      displayType: getDisplayType(platform.base.type),
      isOnline,
      isCurrentPlatform,
      statusText,
      platform: platform,
      imageData: imageData, // 添加图片数据
    };
  });

  // 等待所有平台图片加载完成
  sameGroupPlatforms.value = await Promise.all(platformPromises);

  // 按平台类型和名称排序，当前连接的平台排在前面
  sameGroupPlatforms.value.sort((a, b) => {
    if (a.isCurrentPlatform && !b.isCurrentPlatform) return -1;
    if (!a.isCurrentPlatform && b.isCurrentPlatform) return 1;
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });

  console.log(
    `[ArtilleryPage] 更新同组平台信息: ${selectedGroup.value}组，共${sameGroupPlatforms.value.length}个平台`,
    sameGroupPlatforms.value
  );
};

// 直接在连接后从平台数据初始化状态
const initializeArtilleryStatus = () => {
  if (!isConnected.value || !connectedPlatform.value) return;

  // 初始化火炮状态显示
  updateArtilleryStatusDisplay(connectedPlatform.value);

  // 获取最新的环境参数
  if (platforms.value.length > 0) {
    const latestPlatformData = platforms.value[0]; // 取第一个平台的环境数据
    console.log("[ArtilleryPage] 初始化环境参数从平台数据");
  }
};

// 处理连接平台
const handleConnectPlatform = async () => {
  if (isConnected.value) {
    // 断开连接
    isConnected.value = false;
    connectionStatus.isConnected = false;
    connectedPlatform.value = null;
    connectedPlatformName.value = "";

    // 停止平台心跳
    await platformHeartbeatService.stopHeartbeat();
    console.log("[ArtilleryPage] 平台心跳已停止");

    // 重置弹药选择和装填状态
    selectedAmmunitionType.value = "";
    loadedAmmunitionType.value = "";
    loadedAmmunitionDisplayName.value = "";
    artilleryStatus.isLoaded = false;

    // 清除任务目标
    missionTarget.value = null;

    // 清空目标装订状态
    currentTarget.name = "";
    currentTarget.coordinates = "";

    // 清空协同目标状态
    receivedCoordinationTarget.name = "";
    receivedCoordinationTarget.coordinates = "";
    receivedCoordinationTarget.sourcePlatform = "";

    // 清空协同报文状态
    cooperationMessages.value = [];

    ElMessage.warning("平台连接已断开");
    return;
  }

  if (!selectedGroup.value || !selectedInstance.value) {
    ElMessage.warning("请先选择分组和火炮");
    return;
  }

  // 查找已选择的平台（支持多种火炮类型）
  const targetPlatform = platforms.value.find(
    (platform) =>
      platform.base?.name === selectedInstance.value &&
      platform.base?.group === selectedGroup.value &&
      (platform.base?.type === "ROCKET_LAUNCHER" ||
        platform.base?.type === "Artillery" ||
        platform.base?.type === "CANNON")
  );

  if (targetPlatform) {
    // 连接到真实平台
    isConnected.value = true;
    connectionStatus.isConnected = true;
    connectedPlatform.value = targetPlatform;
    connectedPlatformName.value = selectedInstance.value;
    artilleryStatus.isReady = true;

    // 连接后立即获取平台状态
    // updateArtilleryStatusDisplay(targetPlatform);

    // 初始化状态
    initializeArtilleryStatus();

    // 重置弹药选择，让用户重新选择基于真实武器数据的弹药类型
    selectedAmmunitionType.value = "";
    loadedAmmunitionType.value = "";
    artilleryStatus.isLoaded = false;

    // 获取任务目标
    await getMissionTarget();

    // 更新同组平台信息
    await updateSameGroupPlatforms();

    // 启动平台心跳（每3秒发送一次）
    const heartbeatStarted = await platformHeartbeatService.startHeartbeat(
      selectedInstance.value,
      3000
    );
    if (heartbeatStarted) {
      console.log(`[ArtilleryPage] 平台心跳已启动: ${selectedInstance.value}`);
    } else {
      console.error(
        `[ArtilleryPage] 平台心跳启动失败: ${selectedInstance.value}`
      );
    }

    console.log(`[ArtilleryPage] 连接到真实平台: ${selectedInstance.value}`);
    ElMessage.success(`平台连接成功: ${selectedInstance.value}`);
  } else {
    // 未找到真实平台，但仍然允许连接（使用默认数据）
    isConnected.value = true;
    connectionStatus.isConnected = true;
    connectedPlatform.value = null; // 没有真实平台数据
    connectedPlatformName.value = selectedInstance.value;
    artilleryStatus.isReady = true;

    // 获取任务目标
    await getMissionTarget();

    // 即使是模拟模式，也启动心跳发送
    const heartbeatStarted = await platformHeartbeatService.startHeartbeat(
      selectedInstance.value,
      3000
    );
    if (heartbeatStarted) {
      console.log(
        `[ArtilleryPage] 模拟平台心跳已启动: ${selectedInstance.value}`
      );
    }

    console.log(`[ArtilleryPage] 连接到模拟平台: ${selectedInstance.value}`);
    ElMessage.success(`平台连接成功（模拟模式）: ${selectedInstance.value}`);
  }
};

// 格式化坐标显示
const formatCoordinate = (coord: number | undefined) => {
  if (coord === undefined) return "0.000000°";
  return coord.toFixed(6) + "°";
};

// 格式化角度显示
const formatAngle = (angle: number | undefined) => {
  if (angle === undefined) return "0°";
  return angle.toFixed(1) + "°";
};

// 格式化函数统一处理
const formatValue = (
  value: number | undefined,
  unit: string,
  precision: number = 1,
  prefix?: string
) => {
  if (value === undefined || value === null) return "未知";
  const formatted = value.toFixed(precision);
  return `${prefix && value >= 0 ? prefix : ""}${formatted}${unit}`;
};

// 采用协同目标
const adoptCoordinationTarget = () => {
  if (!receivedCoordinationTarget.name) {
    ElMessage.warning("没有可采用的协同目标");
    return;
  }

  // 将协同目标信息复制到当前目标
  currentTarget.name = receivedCoordinationTarget.name;
  currentTarget.coordinates = receivedCoordinationTarget.coordinates;

  ElMessage.success(`已采用协同目标：${receivedCoordinationTarget.name}`);

  // 清除协同目标信息
  clearCoordinationTarget();
};

// 清除协同目标
const clearCoordinationTarget = () => {
  receivedCoordinationTarget.name = "";
  receivedCoordinationTarget.coordinates = "";
  receivedCoordinationTarget.sourcePlatform = "";
  receivedCoordinationTarget.longitude = undefined;
  receivedCoordinationTarget.latitude = undefined;
  receivedCoordinationTarget.altitude = undefined;
};

// 目标装订（完全复制命令测试页面的实现）
const handleTargetSetting = async () => {
  try {
    // 基本检查
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    if (!currentTarget.name) {
      ElMessage.warning("请先设置目标名称");
      return;
    }

    // 获取目标装订命令枚举
    const commandEnum = PlatformCommandEnum["Arty_Target_Set"];
    if (commandEnum === undefined) {
      throw new Error("未知目标装订命令: Arty_Target_Set");
    }

    // 构造目标装订命令数据（完全复制命令测试页面的实现）
    const commandData = {
      commandID: Date.now(),
      platformName: String(connectedPlatformName.value), // 使用已连接的平台名称
      command: Number(commandEnum), // 使用枚举值：7 (Arty_Target_Set)
      targetSetParam: {
        targetName: String(currentTarget.name), // 使用当前目标名称
      },
    };

    console.log(`[ArtilleryPage] 发送目标装订命令: 目标 ${currentTarget.name}`);
    console.log("[ArtilleryPage] 发送 PlatformCmd 数据:", commandData);

    // 发送目标装订命令
    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      ElMessage.success(`🎯 目标装订命令发送成功：${currentTarget.name}`);
      console.log(`[ArtilleryPage] 目标装订命令发送成功`);
    } else {
      ElMessage.error(`目标装订命令发送失败: ${result.error}`);
      console.error(`[ArtilleryPage] 目标装订命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送目标装订命令失败: ${error.message}`;
    console.error("[ArtilleryPage] 目标装订操作失败:", error);
    ElMessage.error(errorMsg);
  }
};

// 处理装填数量输入
const handleSetLoadCount = () => {
  if (isLoadCountEditing.value) {
    // 确定模式
    if (!loadCount.value || loadCount.value < 1) {
      ElMessage.warning("请输入正确的装填数量");
      return;
    }
    if (loadCount.value > currentAmmunitionCount.value) {
      ElMessage.warning(`装填数量不能超过${currentAmmunitionCount.value}发`);
      return;
    }
    isLoadCountEditing.value = false;
    ElMessage.success(`装填数量已设置: ${loadCount.value}发`);
    console.log(`[ArtilleryPage] 设置装填数量: ${loadCount.value}`);
  } else {
    // 编辑模式
    isLoadCountEditing.value = true;
  }
};

// 发送协同指令
const handleSendCooperationCommand = async () => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    const commandEnum = PlatformCommandEnum["Arty_Fire_Coordinate"];
    if (commandEnum === undefined) {
      throw new Error("未知发射协同命令");
    }

    // 构造坐标信息（如果有的话）
    let targetCoordinate = undefined;

    // 从missionTarget获取目标坐标信息
    if (missionTarget.value?.coordinates) {
      targetCoordinate = {
        longitude: parseFloat(missionTarget.value.coordinates.longitude),
        latitude: parseFloat(missionTarget.value.coordinates.latitude),
        altitude: missionTarget.value.coordinates.altitude || 0,
      };
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      fireCoordinateParam: {
        uavName: String(
          coordinatedUavName.value || connectedPlatformName.value
        ), // 使用协同的无人机名称，如果没有则使用火炮名称
        targetName: String(currentTarget.name || "未指定"),
        weaponName: String(
          loadedAmmunitionType.value || selectedAmmunitionType.value || "未指定"
        ),
        ...(targetCoordinate && { coordinate: targetCoordinate }), // 只有当targetCoordinate存在时才添加
      },
    };

    console.log("发送发射协同命令数据:", commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      ElMessage.success("发射协同指令已发送");

      // 添加新的协同报文
      addCooperationMessage({
        type: "sent",
        commandType: "fire_coordinate",
        sourcePlatform: connectedPlatformName.value || "本火炮",
        targetPlatform: coordinatedUavName.value || "协同无人机",
        content: `火炮发出发射协同报文（目标：${
          currentTarget.name || "未指定"
        }）`,
        details: {
          targetName: currentTarget.name || "未指定",
          weaponName: loadedAmmunitionType.value,
          commandId: commandData.commandID,
          coordinates: targetCoordinate,
        },
        status: "success",
      });
    } else {
      ElMessage.error(`协同指令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送发射协同命令失败: ${error.message}`;
    console.error(errorMsg, error);
    ElMessage.error(errorMsg);
  }
};

// 装填弹药
const loadAmmunition = () => {
  if (!selectedAmmunitionType.value) {
    ElMessage.warning("请先选择弹药类型");
    return;
  }

  if (!loadCount.value || loadCount.value < 1) {
    ElMessage.warning("请先设置装填数量");
    return;
  }

  const selectedAmmo = ammunitionTypes.value.find(
    (ammo) => ammo.value === selectedAmmunitionType.value
  );
  if (!selectedAmmo || selectedAmmo.count < loadCount.value) {
    ElMessage.error(`该弹药库存不足，当前库存：${selectedAmmo?.count || 0}发`);
    return;
  }

  ElMessage.success(`${selectedAmmo.label} ${loadCount.value}发装填完成`);
  artilleryStatus.isLoaded = true;

  // 记录已装填的弹药类型和数量
  loadedAmmunitionType.value = selectedAmmo.value; // 使用原始武器名称
  loadedAmmunitionDisplayName.value = selectedAmmo.label; // 用于显示的合成名称
  actualLoadedCount.value = loadCount.value;

  // 更新武器名称为当前装填的弹药（显示用）
  weaponName.value = selectedAmmo.label;

  // 重置装填数量输入状态
  isLoadCountEditing.value = false;

  // 如果是从真实武器数据获取的弹药，需要更新对应的武器数量
  if (selectedAmmo.weaponData && connectedPlatform.value?.weapons) {
    // 从已连接的平台更新武器数量
    const weaponIndex = connectedPlatform.value.weapons.findIndex(
      (weapon: any) => weapon.base?.name === selectedAmmo.weaponData.base?.name
    );
    if (
      weaponIndex !== -1 &&
      connectedPlatform.value.weapons[weaponIndex].quantity !== undefined &&
      connectedPlatform.value.weapons[weaponIndex].quantity! >= loadCount.value
    ) {
      connectedPlatform.value.weapons[weaponIndex].quantity! -= loadCount.value;
      console.log(
        `[ArtilleryPage] 更新武器 ${selectedAmmo.weaponData.base?.name} 剩余数量:`,
        connectedPlatform.value.weapons[weaponIndex].quantity
      );
    }
  }

  console.log(
    `[ArtilleryPage] 装填弹药: ${selectedAmmo.label} ${loadCount.value}发`
  );
};

// 发射火炮（完全复制命令测试页面的实现）
const fireAtDrone = async () => {
  try {
    // 基本检查
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    if (!artilleryStatus.isLoaded || !loadedAmmunitionType.value) {
      ElMessage.warning("请先装填弹药");
      return;
    }

    if (!currentTarget.name) {
      ElMessage.warning("请先进行目标装订");
      return;
    }

    // 检查装填数量
    if (!actualLoadedCount.value || actualLoadedCount.value < 1) {
      ElMessage.warning("没有已装填的弹药");
      return;
    }

    // 设置发射状态
    isFiring.value = true;
    fireStatus.value = "开火中...";

    ElMessage.success(
      `向目标 ${currentTarget.name} 发射${actualLoadedCount.value}发弹药，使用 ${loadedAmmunitionDisplayName.value}`
    );

    // 构造火炮发射命令数据（完全复制命令测试页面的实现）
    const commandEnum = PlatformCommandEnum["Arty_Fire"];

    const commandData = {
      commandID: Date.now(),
      platformName: String(connectedPlatformName.value), // 使用已连接的平台名称
      command: Number(commandEnum), // 使用枚举值：8 (Arty_Fire)
      fireParam: {
        weaponName: String(loadedAmmunitionType.value), // 使用装载的武器名称
        targetName: String(currentTarget.name), // 使用已装订的目标
        quantity: Number(actualLoadedCount.value), // 使用装填的弹药数量
      },
    };

    console.log(
      `[ArtilleryPage] 发送火力命令: 武器 ${loadedAmmunitionType.value} 攻击目标 ${currentTarget.name}, 发射 ${actualLoadedCount.value} 发`
    );
    console.log("[ArtilleryPage] 发送 PlatformCmd 数据:", commandData);

    // 发送火炮发射命令
    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      ElMessage.success("🚀 火炮控制命令发送成功");
      fireStatus.value = "已发射";

      console.log(`[ArtilleryPage] 火力命令发送成功`);

      // 发送发射协同命令 (Arty_Fire_Coordinate)
      try {
        const coordinationCommandEnum =
          PlatformCommandEnum["Arty_Fire_Coordinate"];
        if (coordinationCommandEnum !== undefined) {
          // 构造坐标信息（如果有的话）
          let targetCoordinate = undefined;

          // 从missionTarget获取目标坐标信息
          if (missionTarget.value?.coordinates) {
            targetCoordinate = {
              longitude: parseFloat(missionTarget.value.coordinates.longitude),
              latitude: parseFloat(missionTarget.value.coordinates.latitude),
              altitude: missionTarget.value.coordinates.altitude || 0,
            };
          }

          const coordinationCommandData = {
            commandID: Date.now() + 1, // 确保ID唯一
            platformName: String(connectedPlatformName.value),
            command: Number(coordinationCommandEnum), // 使用枚举值：12 (Arty_Fire_Coordinate)
            fireCoordinateParam: {
              uavName: String(coordinatedUavName.value), // 使用协同的无人机名称，如果没有则使用火炮名称
              targetName: String(currentTarget.name),
              weaponName: String(loadedAmmunitionType.value),
              ...(targetCoordinate && { coordinate: targetCoordinate }), // 只有当targetCoordinate存在时才添加
            },
          };

          console.log(
            "[ArtilleryPage] 发送发射协同命令数据:",
            coordinationCommandData
          );

          const coordinationResult = await (
            window as any
          ).electronAPI.multicast.sendPlatformCmd(coordinationCommandData);

          if (coordinationResult.success) {
            ElMessage.success("📡 发射协同命令发送成功");
            console.log(`[ArtilleryPage] 发射协同命令发送成功`);

            // 添加协同报文
            addCooperationMessage({
              type: "sent",
              commandType: "fire_coordinate",
              sourcePlatform: connectedPlatformName.value || "本火炮",
              targetPlatform: coordinatedUavName.value || "协同无人机",
              content: `火炮发出发射协同报文（目标：${currentTarget.name}）`,
              details: {
                targetName: currentTarget.name,
                weaponName: loadedAmmunitionType.value,
                commandId: coordinationCommandData.commandID,
                coordinates: targetCoordinate,
              },
              status: "success",
            });
          } else {
            console.warn(
              `[ArtilleryPage] 发射协同命令发送失败: ${coordinationResult.error}`
            );
            ElMessage.warning("发射协同命令发送失败");
          }
        }
      } catch (coordinationError: any) {
        console.error(
          "[ArtilleryPage] 发送发射协同命令失败:",
          coordinationError
        );
        ElMessage.error("发送发射协同命令时发生错误");
      }

      // 发射后清空装填状态，需要重新装填
      artilleryStatus.isLoaded = false;
      loadedAmmunitionType.value = ""; // 清空已装填弹药类型
      loadedAmmunitionDisplayName.value = ""; // 清空显示名称
      actualLoadedCount.value = 0; // 清空装填数量

      // 重置装填数量
      loadCount.value = 1;
      selectedStrikeCount.value = 1;
      isLoadCountEditing.value = false;

      // 模拟发射后自动发送防空报文
      setTimeout(() => {
        ElMessage.info("已自动发送防空报文给无人机");
        fireStatus.value = "防空报文已发送";
      }, 1000);

      // 重置状态
      setTimeout(() => {
        fireStatus.value = "待发射";
        isFiring.value = false;
      }, 3000);
    } else {
      ElMessage.error(`火力命令发送失败: ${result.error}`);
      console.error(`[ArtilleryPage] 火力命令发送失败: ${result.error}`);
      fireStatus.value = "发送失败";
      isFiring.value = false;
      // 发射失败时不清空装填状态
    }
  } catch (error: any) {
    const errorMsg = `发送火力命令失败: ${error.message}`;
    console.error("[ArtilleryPage] 发射操作失败:", error);
    ElMessage.error(errorMsg);
    fireStatus.value = "操作失败";
    isFiring.value = false;
    // 操作失败时不清空装填状态
  }
};

// 更新火炮平台状态显示
const updateArtilleryStatusDisplay = (platform: any) => {
  if (!platform?.base) {
    console.warn("[ArtilleryPage] 平台数据缺失 base 字段");
    return;
  }

  console.log(`[ArtilleryPage] 开始更新火炮状态显示:`, platform.base.name);

  // 更新平台位置信息
  if (platform.base.location) {
    // 更新目标信息（距离和方位计算需要对比坐标）
    const newDistance = Math.floor(Math.random() * 1000) + 2000; // 模拟距离
    const newBearing = Math.floor(Math.random() * 360); // 模拟方位
    const newAltitude = platform.base.location.altitude + 200; // 模拟高度差

    if (
      targetInfo.distance !== newDistance ||
      targetInfo.bearing !== newBearing ||
      targetInfo.altitude !== newAltitude
    ) {
      targetInfo.distance = newDistance;
      targetInfo.bearing = newBearing;
      targetInfo.altitude = newAltitude;
      console.log(`[ArtilleryPage] 目标信息已更新:`, targetInfo);
    }
  }

  // 更新火炮系统状态
  const newIsReady = !platform.base?.broken;
  const newSystemStatus = platform.base?.broken ? "故障" : "正常";

  if (
    artilleryStatus.isReady !== newIsReady ||
    artilleryStatus.systemStatus !== newSystemStatus
  ) {
    artilleryStatus.isReady = newIsReady;
    artilleryStatus.systemStatus = newSystemStatus;
    console.log(`[ArtilleryPage] 系统状态已更新: ${newSystemStatus}`);
  }

  // 根据平台状态动态计算炮管温度
  const newTemperature = artilleryStatus.isLoaded
    ? Math.round(35 + Math.random() * 10) // 装填后温度上升
    : Math.round(25 + Math.random() * 5); // 正常温度

  if (artilleryStatus.temperature !== newTemperature) {
    artilleryStatus.temperature = newTemperature;
  }

  // 更新武器状态（从武器信息获取）
  if (platform.weapons && Array.isArray(platform.weapons)) {
    // 计算总弹药数量
    const totalAmmunition = platform.weapons.reduce(
      (total: number, weapon: any) => {
        return total + (weapon.quantity || 0);
      },
      0
    );

    // 只在数据变化时才更新
    if (ammunitionCount.value !== totalAmmunition) {
      ammunitionCount.value = totalAmmunition;
      console.log(`[ArtilleryPage] 弹药数量已更新: ${totalAmmunition}`);
    }

    console.log(`[ArtilleryPage] 武器信息处理完成:`, {
      武器数量: platform.weapons.length,
      总弹药数: totalAmmunition,
      武器列表: platform.weapons.map((w: any) => ({
        名称: w.base?.name,
        类型: w.base?.type,
        数量: w.quantity,
      })),
    });
  }

  // 更新 TargetLoad 信息（火炮特有的目标装订信息）
  if (platform.targetLoad) {
    console.log(`[ArtilleryPage] 目标装订信息:`, {
      目标名称: platform.targetLoad.targetName,
      距离: platform.targetLoad.distance,
      方位: platform.targetLoad.bearing,
      高差: platform.targetLoad.elevationDifference,
      方位角: platform.targetLoad.azimuth,
      高低角: platform.targetLoad.pitch,
    });
  }

  console.log(`[ArtilleryPage] 火炮状态显示更新完成:`, {
    平台名称: platform.base.name,
    位置: platform.base.location,
    系统状态: artilleryStatus.systemStatus,
    就绪状态: artilleryStatus.isReady,
    炮管温度: artilleryStatus.temperature,
    弹药数量: ammunitionCount.value,
  });
};

// 处理平台状态数据包
const handlePlatformStatus = async (packet: any) => {
  try {
    if (packet.parsedPacket?.packageType === 0x29) {
      // 平台状态数据包
      const parsedData = packet.parsedPacket.parsedData;

      if (parsedData?.platform && Array.isArray(parsedData.platform)) {
        // 更新平台数据
        platforms.value = parsedData.platform;
        lastUpdateTime.value = Date.now();

        // 如果已连接平台，实时更新已连接平台的状态
        if (isConnected.value && connectedPlatformName.value) {
          const updatedPlatform = parsedData.platform.find(
            (platform: any) =>
              platform.base?.name === connectedPlatformName.value
          );

          if (updatedPlatform) {
            // 更新已连接平台的引用
            connectedPlatform.value = updatedPlatform;

            // 实时更新平台状态显示
            updateArtilleryStatusDisplay(updatedPlatform);

            console.log(
              `[ArtilleryPage] 实时更新已连接平台状态: ${connectedPlatformName.value}`,
              {
                位置: updatedPlatform.base?.location,
                武器数: updatedPlatform.weapons?.length || 0,
                目标装订: updatedPlatform.targetLoad?.targetName || "无",
              }
            );
          } else {
            console.warn(
              `[ArtilleryPage] 未找到已连接平台的更新数据: ${connectedPlatformName.value}`
            );
          }
        }

        // 更新环境参数（从 evironment 字段获取）- 完全复制无人机页面逻辑
        if (parsedData.evironment) {
          const env = parsedData.evironment;
          console.log("[ArtilleryPage] 收到原始环境数据:", env);

          // 从平台数据中更新环境参数
          if (env.temperature !== undefined) {
            // 温度单位从开尔文(K)转换为摄氏度(°C)
            const celsiusTemp = env.temperature;
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

          // 更新演习时间（直接使用平台数据中的updateTime）
          if (
            parsedData.platform.length > 0 &&
            parsedData.platform[0].updateTime
          ) {
            environmentParams.exerciseTime = `T + ${parsedData.platform[0].updateTime.toFixed(
              0
            )}秒`;
          }

          console.log("[ArtilleryPage] 处理后的环境参数:", {
            原始温度K: env.temperature,
            转换温度: environmentParams.temperature,
            风速风向: environmentParams.windSpeed,
            云层覆盖: environmentParams.cloudCover,
            降水状态: environmentParams.humidity,
            气压: environmentParams.pressure,
          });
        }

        // 逐个更新平台心跳状态（与无人机页面保持一致）
        parsedData.platform.forEach((platform: any) => {
          if (platform.base?.name) {
            updatePlatformHeartbeat(platform.base.name);
          }
        });

        // 如果已连接，更新已连接平台的状态
        if (isConnected.value && connectedPlatformName.value) {
          const updatedPlatform = parsedData.platform.find(
            (p: any) => p.base?.name === connectedPlatformName.value
          );

          if (updatedPlatform) {
            // 更新平台数据，包括TargetLoad信息
            connectedPlatform.value = {
              ...updatedPlatform,
              targetLoad: updatedPlatform.targetLoad || null,
            };
            // 更新火炮状态显示
            // updateArtilleryStatusDisplay(updatedPlatform);

            // 如果有TargetLoad信息，输出日志
            if (updatedPlatform.targetLoad) {
              console.log(`[ArtilleryPage] 收到TargetLoad信息:`, {
                目标名称: updatedPlatform.targetLoad.targetName,
                距离: updatedPlatform.targetLoad.distance,
                方位: updatedPlatform.targetLoad.bearing,
                高差: updatedPlatform.targetLoad.elevationDifference,
                方位角: updatedPlatform.targetLoad.azimuth,
                高低角: updatedPlatform.targetLoad.pitch,
              });
            }

            console.log(
              `[ArtilleryPage] 更新已连接平台状态: ${connectedPlatformName.value}`
            );
          }

          // 更新任务目标信息
          await getMissionTarget();

          // 更新同组平台信息
          await updateSameGroupPlatforms();
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
    } else if (packet.parsedPacket?.packageType === 0x2a) {
      console.log("[ArtilleryPage] 收到平台命令数据:", packet.parsedPacket);
      // 平台命令数据包 - 处理打击协同命令
      const parsedData = packet.parsedPacket.parsedData;

      if (parsedData?.strikeCoordinateParam) {
        // 打击协同命令（Uav_Strike_Coordinate = 11）
        const strikeParam = parsedData.strikeCoordinateParam;
        const sourcePlatform = parsedData.platformName || "未知平台";
        console.log(
          `[ArtilleryPage] 收到打击协同命令111`,
          strikeParam,
          isConnected.value,
          connectedPlatformName.value
        );
        // 检查 artyName 是否与当前连接的火炮名称一致
        if (strikeParam.artyName && isConnected.value) {
          if (strikeParam.artyName !== connectedPlatformName.value) {
            console.log(
              `[ArtilleryPage] 协同命令目标火炮不匹配，当前连接: ${connectedPlatformName.value}，命令目标: ${strikeParam.artyName}`
            );
            // 不一致则忽略该命令
            return;
          }

          // 提取目标信息
          if (strikeParam.targetName) {
            receivedCoordinationTarget.name = strikeParam.targetName;
            receivedCoordinationTarget.sourcePlatform = sourcePlatform;

            // 保存同组无人机的名称
            coordinatedUavName.value = sourcePlatform;

            // 提取坐标信息
            if (strikeParam.coordinate) {
              const coord = strikeParam.coordinate;
              // 转换为可读格式
              const lonDeg = Math.floor(coord.longitude);
              const lonMin = Math.floor((coord.longitude - lonDeg) * 60);
              const lonSec = Math.floor(
                ((coord.longitude - lonDeg) * 60 - lonMin) * 60
              );

              const latDeg = Math.floor(coord.latitude);
              const latMin = Math.floor((coord.latitude - latDeg) * 60);
              const latSec = Math.floor(
                ((coord.latitude - latDeg) * 60 - latMin) * 60
              );

              receivedCoordinationTarget.coordinates = `E${lonDeg}°${lonMin}'${lonSec}\" N${latDeg}°${latMin}'${latSec}\"`;
              receivedCoordinationTarget.longitude = coord.longitude;
              receivedCoordinationTarget.latitude = coord.latitude;
              receivedCoordinationTarget.altitude = coord.altitude;
            }

            // 立即更新目标装订信息（根据项目规范自动应用协同目标）
            currentTarget.name = strikeParam.targetName;
            if (receivedCoordinationTarget.coordinates) {
              currentTarget.coordinates =
                receivedCoordinationTarget.coordinates;
            }

            // 更新目标名称输入框
            targetName.value = strikeParam.targetName;

            ElMessage.success(
              `收到来自 ${sourcePlatform} 的打击协同命令，目标：${strikeParam.targetName}，已自动更新目标装订`
            );

            // 添加协同报文到报文区域
            addCooperationMessage({
              type: "received",
              commandType: "strike_coordinate",
              sourcePlatform: sourcePlatform || "未知平台",
              targetPlatform: connectedPlatformName.value || "本火炮",
              content: `收到来自 ${sourcePlatform} 的打击协同命令（目标：${strikeParam.targetName}）`,
              details: {
                targetName: strikeParam.targetName,
                commandId: parsedData.commandID,
                coordinates: strikeParam.coordinate
                  ? {
                      longitude: strikeParam.coordinate.longitude,
                      latitude: strikeParam.coordinate.latitude,
                      altitude: strikeParam.coordinate.altitude,
                    }
                  : undefined,
              },
              status: "success",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("[ArtilleryPage] 处理平台数据失败:", error);
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

  // 模拟数据更新（与无人机页面保持一致）
  setInterval(() => {
    // 每秒检查心跳超时（与无人机页面保持一致）
    checkHeartbeatTimeouts();

    // 演习时间现在从平台数据获取，不再在这里更新
    // 只在没有真实平台数据时使用默认时间
    if (platforms.value.length === 0) {
      environmentParams.exerciseTime = `T + ${Date.now()}`;
    }

    // 更新天文时间（实际当前时间）
    environmentParams.astronomicalTime = new Date().toLocaleTimeString();
  }, 1000);
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

/* 任务目标提醒栏（在右侧列） */
.mission-target-banner {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  padding: 12px 16px;
  position: relative; /* 为绝对定位提供参考点 */
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.banner-icon {
  color: #007bff;
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.target-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative; /* 为状态标签提供参考点 */
}

.target-header {
  display: flex;
  align-items: center;
}

.banner-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.target-status-indicator {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 1;
}

.target-status {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid;
}

.target-status.active {
  background: #e8f5e8;
  color: #52c41a;
  border-color: rgba(82, 196, 26, 0.3);
}

.target-status.active .status-icon {
  color: #52c41a;
  font-size: 10px;
}

.target-status.inactive {
  background: #fff7e6;
  color: #faad14;
  border-color: rgba(250, 173, 20, 0.3);
}

.target-status.inactive .status-icon {
  color: #faad14;
  font-size: 10px;
}

.target-status.destroyed {
  background: #fef0f0;
  color: #f56c6c;
  border-color: rgba(245, 108, 108, 0.3);
  animation: targetDestroyedPulse 2s infinite;
}

.target-status.destroyed .status-icon {
  color: #f56c6c;
  font-size: 10px;
}

@keyframes targetDestroyedPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.target-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 目标图片和名称区域 */
.target-avatar-name-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 目标头像 */
.target-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

/* 目标图片样式 */
.target-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
  object-position: center;
  border: none;
  background: #f8f9fa;
}

.target-avatar-image:hover {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

/* 目标默认图标 */
.target-avatar-icon {
  font-size: 20px;
  font-weight: bold;
}

.target-avatar:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.2s ease;
}

.target-type {
  font-size: 11px;
  color: #666;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.target-coordinates {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coordinate-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.coordinate-value {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  font-family: "SF Mono", "Monaco", "Menlo", monospace;
}

.target-info {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.target-info.no-target {
  color: #6c757d;
  font-style: italic;
}

/* 大屏布局优化 */
.large-screen-layout {
  min-width: 1600px;
  width: 100%;
  max-width: none;
  overflow-x: auto;
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

/* 中间时间区域 */
.time-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.exercise-time,
.astronomical-time {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.astronomical-time {
  font-size: 14px;
  color: #666;
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
  min-width: 180px;
}

.control-select.short {
  min-width: 120px;
  max-width: 120px;
}

.control-select.large {
  width: 280px;
  min-width: 280px;
}

/* 功能分隔符 */
.function-separator {
  width: 1px;
  height: 30px;
  background-color: #d0d0d0;
  margin: 0 8px;
}

/* 主要内容区域 - 大屏全屏展示 */
.main-content {
  min-height: 600px;
}

/* 左侧控制面板 */
.left-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
}

/* 中间状态显示区域 */
.middle-panel {
  flex: 1;
  width: 300px;
}

/* 右侧报文面板 */
.right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 报文面板样式 - 大屏优化 */
.report-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  max-height: 700px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.report-send-btn {
  padding: 4px 12px;
  border: 1px solid #d0d0d0;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.report-send-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.report-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保能够正常收缩 */
  overflow: hidden; /* 防止内容溢出 */
}

.report-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding-right: 4px; /* 为滚动条留出空间 */
}

/* 自定义滚动条样式 */
.report-section::-webkit-scrollbar {
  width: 6px;
}

.report-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.report-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.2s;
}

.report-section::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.report-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px; /* 在底部留出一些空间 */
}

/* 优化后的报文消息样式 */
.message-item {
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.message-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 发送消息hover状态 */
.message-sent:hover {
  background: linear-gradient(135deg, #d1e7fd, #ebf5ff);
  border-color: #90caf9;
}

/* 接收消息hover状态 */
.message-received:hover {
  background: linear-gradient(135deg, #dcedc8, #e8f4e8);
  border-color: #a5d6a7;
}

/* 发送消息样式 - 增强背景颜色区分 */
.message-sent {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #e3f2fd, #f3f9ff);
  border: 1px solid #bbdefb;
}

.message-sent .message-header {
  background: linear-gradient(135deg, #409eff30, #409eff20);
}

/* 接收消息样式 - 增强背景颜色区分 */
.message-received {
  border-left: 4px solid #67c23a;
  background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
  border: 1px solid #c8e6c9;
}

.message-received .message-header {
  background: linear-gradient(135deg, #67c23a30, #67c23a20);
}

/* 状态样式 */
.message-success {
  border-color: #67c23a;
}

.message-failed {
  border-color: #f56c6c;
  background: #fef0f0;
}

.message-pending {
  border-color: #e6a23c;
}

/* 消息头部 */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
}

.message-direction {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.direction-icon {
  font-size: 14px;
}

.sent-icon {
  color: #409eff;
}

.received-icon {
  color: #67c23a;
}

.direction-text {
  color: #606266;
}

.message-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.exercise-time {
  font-weight: 600;
  color: #e6a23c;
  font-family: "Courier New", monospace;
}

.clock-time {
  color: #909399;
  font-size: 11px;
}

/* 消息主体 */
.message-body {
  padding: 12px;
}

.message-platform-info {
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.platform-info strong {
  color: #303133;
  font-weight: 600;
}

.message-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  margin-bottom: 8px;
}

.message-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.message-details .el-tag {
  font-size: 11px;
  padding: 2px 6px;
}

/* 空消息样式 */
.message-empty {
  text-align: center;
  color: #c0c4cc;
  font-style: italic;
  padding: 20px;
  border: 1px dashed #e0e0e0;
  background: #fafafa;
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

/* 协同目标显示 */
.coordination-target-display {
  background: #e8f5e8;
  border: 2px solid #28a745;
  border-radius: 6px;
  padding: 12px;
  position: relative;
}

.coordination-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.coordination-title {
  font-size: 14px;
  font-weight: 600;
  color: #155724;
}

.coordination-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
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

/* 任务控制区域 - 大屏优化 */
.task-control {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  flex: 1;
  min-height: 600px;
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
.load-count-input {
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

/* 状态卡片 - 大屏优化 */
.status-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  height: 140px;
  min-height: 140px;
}

.status-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 数据源指示器 */
.data-source-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.data-source-indicator.connected {
  background: #e8f5e8;
  color: #2d5016;
}

.data-source-indicator.connected .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52c41a;
}

.data-source-indicator.simulated {
  background: #fff7e6;
  color: #ad6800;
}

.data-source-indicator.simulated .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #faad14;
}

.data-source-indicator.no-data {
  background: #f5f5f5;
  color: #8c8c8c;
}

.data-source-indicator.no-data .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9d9d9;
}

.indicator-text {
  white-space: nowrap;
}

.status-info {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

.target-info-item.no-target {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px dashed #d9d9d9;
}

.target-info-item.no-target .info-value {
  color: #999;
}

.status-info.no-data {
  color: #999;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
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

/* =========================== 连接卡片样式 =========================== */
/* 连接控制卡片（全宽） */
.connection-card {
  flex: 1;
  width: 100%;
  /* background: white; */
  /* border-radius: 8px; */
  /* padding: 16px; */
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
  /* border: 2px solid #d0d0d0; */
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
}

/* 左侧标题区域 */
.title-section {
  flex: 0 0 auto;
}

/* 席位标题 */
.seat-title {
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

/* 演练方案按钮 */
.exercise-btn {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
}

/* 功能区域分隔符 */
.function-separator {
  width: 2px;
  height: 40px;
  background: linear-gradient(
    to bottom,
    transparent,
    #dee2e6 20%,
    #dee2e6 80%,
    transparent
  );
  margin: 0 12px;
}

/* 下拉框样式 */
.control-select {
  height: 40px;
  min-width: 120px;
}

.control-select.short {
  min-width: 100px;
}

.control-select.large {
  width: 280px;
  min-width: 280px;
}

/* =========================== 已连接布局样式 =========================== */
/* 三等分连接后布局 */
.connected-layout {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  gap: 16px;
}

.layout-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

/* 第一部分：组别平台展示区域样式 */
.group-platforms-section {
  justify-content: flex-start;
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  margin: 0;
  padding: 12px 0;
}

.platforms-container {
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 20px;
  width: 100%;
}

.platforms-list {
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex: 1;
  max-height: 80px;
}

.platform-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  min-width: 180px;
  min-height: 84px;
  position: relative;
}

.platform-item.current-platform {
  border: 2px solid #007bff;
  font-weight: 600;
}

.platform-item.current-platform .platform-name {
  color: #007bff;
  font-weight: 700;
}

.platform-item.offline {
  border-left: 4px solid #dc3545;
  background: #f8f9fa;
  opacity: 0.8;
}

.platform-item.offline .platform-name {
  color: #6c757d;
}

/* 已连接平台特殊样式 */
.platform-item.connected-platform {
  border: 2px solid #28a745;
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
}

.platform-item.connected-platform .platform-status-text {
  color: #28a745;
  font-weight: 700;
}

/* 第二部分：时间显示区域 */
.time-section {
  position: relative;
  justify-content: center;
}

.time-content {
  text-align: center;
  padding: 8px 16px;
  /* background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); */
  /* border: 1px solid #dee2e6; */
  /* border-radius: 8px; */
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
}

.exercise-time {
  font-size: 18px;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 4px;
}

.astronomical-time {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

/* 第三部分：控制按钮区域 */
.controls-section {
  justify-content: flex-end;
  gap: 12px;
}

.controls-section .control-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

/* 平台头像 */
.platform-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.avatar-icon {
  font-size: 24px;
  font-weight: bold;
}

.avatar-icon.uav-icon {
  color: #007bff;
}

.avatar-icon.artillery-icon {
  color: #dc3545;
}

.avatar-icon.rocket-icon {
  color: #fd7e14;
}

.avatar-icon.cannon-icon {
  color: #6f42c1;
}

.avatar-icon.radar-icon {
  color: #20c997;
}

.avatar-icon.ship-icon {
  color: #0dcaf0;
}

.avatar-icon.vehicle-icon {
  color: #6c757d;
}

.avatar-icon.default-icon {
  color: #adb5bd;
}

/* 平台图片样式 */
.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
  object-position: center;
  border: none;
  background: #f8f9fa;
}

.avatar-image:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.platform-avatar:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.2s ease;
}

.platform-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.platform-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.platform-type {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 0px 3px;
  border-radius: 8px;
  align-self: flex-start;
  font-weight: 500;
}

.platform-status-text {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
}

.platform-item.online .platform-status-text {
  color: #28a745;
}

.platform-item.offline .platform-status-text {
  color: #dc3545;
}

/* 已连接平台特殊样式 */
.platform-item.connected-platform {
  border: 2px solid #28a745;
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
}

.platform-item.connected-platform .platform-status-text {
  color: #28a745;
  font-weight: 700;
}

.time-content {
  text-align: center;
  padding: 8px 16px;
  /* background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); */
  /* border: 1px solid #dee2e6; */
  /* border-radius: 8px; */
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
}

.exercise-time {
  font-size: 18px;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 4px;
}

.astronomical-time {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

/* 控制按钮样式 */
.control-btn,
.exercise-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.function-separator {
  width: 1px;
  height: 24px;
  background: #dee2e6;
  margin: 0 12px;
}

.target-name-type {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.target-type {
  font-size: 11px;
  color: #666;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.target-coordinates {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coordinate-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.coordinate-value {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  font-family: "SF Mono", "Monaco", "Menlo", monospace;
}

.target-info {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.target-info.no-target {
  color: #6c757d;
  font-style: italic;
}
</style>
