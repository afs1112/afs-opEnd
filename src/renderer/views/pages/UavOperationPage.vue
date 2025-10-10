<template>
  <div class="uav-operation-page h-full p-4">
    <!-- 顶部控制区域 -->
    <div class="top-section mb-4">
      <div class="top-content">
        <!-- 连接控制卡片 -->
        <div class="connection-card">
          <!-- 未连接时的布局 -->
          <div v-if="!isConnected" class="control-row">
            <!-- 左侧标题区域 -->
            <div class="title-section">
              <div class="seat-title">无人机席位</div>
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
                <!-- 组别信息 -->
                <!-- <div class="group-info">
                  <span class="group-label">{{ selectedGroup }}</span>
                </div> -->

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

            <!-- 传感器转向参数 -->
            <div class="sensor-param-group mb-2">
              <div class="param-row mb-2">
                <div class="param-item">
                  <span class="param-label">方位角：</span>
                  <el-input-number
                    v-model="sensorParamForm.azSlew"
                    :min="sensorLimits.minAzSlew"
                    :max="sensorLimits.maxAzSlew"
                    :step="1"
                    :precision="2"
                    class="param-input"
                    size="small"
                    :disabled="!isConnected"
                  />
                  <span class="param-unit">°</span>
                </div>
              </div>
              <div class="param-row mb-2">
                <div class="param-item">
                  <span class="param-label">俯仰角：</span>
                  <el-input-number
                    v-model="sensorParamForm.elSlew"
                    :min="sensorLimits.minElSlew"
                    :max="sensorLimits.maxElSlew"
                    :step="1"
                    :precision="2"
                    class="param-input"
                    size="small"
                    :disabled="!isConnected"
                  />
                  <span class="param-unit">°</span>
                </div>
              </div>
            </div>

            <!-- 转向按钮 -->
            <div class="button-row mb-2">
              <el-button class="action-btn full-width-btn" @click="handleTurn"
                >转向</el-button
              >
            </div>

            <!-- 转向控制与目标控制分隔符 -->
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
                  下拉选择: {{ targetOptions.length }} 个
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
            <div class="status-info">
              温度{{ environmentParams.temperature }}，气压{{
                environmentParams.pressure
              }}<br />
              风力{{ environmentParams.windSpeed }}，降水{{
                environmentParams.humidity
              }}<br />
              云层{{ environmentParams.cloudCover }}
            </div>
            <div
              class="status-info no-data"
              v-if="!hasEnvironmentData() && isConnected"
            >
              暂无环境数据
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
            <div class="status-info">
              位置：{{ platformStatus.position.longitude }}
              {{ platformStatus.position.latitude }}
              {{ platformStatus.position.altitude }}<br />
              姿态：俯仰{{ platformStatus.attitude.pitch }} 横滚{{
                platformStatus.attitude.roll
              }}
              偏航{{ platformStatus.attitude.yaw }}
            </div>
            <div
              class="status-info no-data"
              v-if="!hasPlatformData() && isConnected"
            >
              暂无平台数据
            </div>
          </div>
        </div>

        <!-- 载荷状态 -->
        <div class="status-card payload-status">
          <div class="status-content">
            <div class="status-header">
              <div class="status-title">载荷状态</div>
              <div
                class="data-source-indicator"
                :class="getPayloadDataSourceClass()"
              >
                <span class="indicator-dot"></span>
                <span class="indicator-text">{{
                  getPayloadDataSourceText()
                }}</span>
              </div>
            </div>
            <div class="status-info" v-if="hasPayloadData()">
              光电载荷：开关{{
                payloadStatus.optoElectronic.isTurnedOn ? "开启" : "关闭"
              }}，俯仰{{
                payloadStatus.optoElectronic.currentEl.toFixed(2)
              }}°，方位{{
                payloadStatus.optoElectronic.currentAz.toFixed(2)
              }}°<br />
              激光载荷：开关{{
                payloadStatus.laser.isTurnedOn ? "开启" : "关闭"
              }}，俯仰{{ payloadStatus.laser.currentEl.toFixed(2) }}°，方位{{
                payloadStatus.laser.currentAz.toFixed(2)
              }}°
            </div>
            <div class="status-info no-data" v-else>暂无载荷数据</div>
          </div>
        </div>

        <!-- 目标状态 -->
        <div class="status-card target-status">
          <div class="status-content">
            <div class="status-header">
              <div class="status-title">
                发现目标
                <span
                  v-if="isConnected && detectedTargets.length > 0"
                  class="target-count"
                >
                  ({{ detectedTargets.length }}个)
                </span>
              </div>
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

            <!-- 已连接且有探测目标时显示目标列表 -->
            <div
              v-if="isConnected && detectedTargets.length > 0"
              class="targets-list"
            >
              <div
                v-for="(target, index) in detectedTargets"
                :key="target.name"
                class="target-item"
                :class="{
                  'selected-target': selectedTargetFromList === target.name,
                }"
                @click="selectTargetFromList(target.name)"
              >
                <div class="target-content">
                  <div class="target-main-info">
                    <span class="target-name">{{ target.name }}</span>
                    <div class="target-status-indicator">
                      <div
                        class="destroyed-status"
                        v-if="target.destroyed || target.status === 'destroyed'"
                      >
                        <el-icon class="destroyed-icon"
                          ><CircleClose
                        /></el-icon>
                        <span class="destroyed-text">已摧毁</span>
                      </div>
                      <div
                        class="active-status"
                        v-else-if="target.status === 'active'"
                      >
                        <el-icon class="active-icon"><SuccessFilled /></el-icon>
                        <span class="active-text">扫描中</span>
                      </div>
                      <div class="inactive-status" v-else>
                        <el-icon class="inactive-icon"
                          ><WarningFilled
                        /></el-icon>
                        <span class="inactive-text">未扫到</span>
                      </div>
                    </div>
                  </div>
                  <div class="target-secondary-info">
                    <span class="target-type">{{ target.type }}</span>
                  </div>
                  <div class="target-position">
                    {{ target.position.longitude }}
                    {{ target.position.latitude }}
                    {{ target.position.altitude }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 未连接时显示模拟数据 -->
            <div v-else-if="!isConnected" class="status-info">
              名称：{{ targetStatus.name }}<br />
              位置：{{ targetStatus.position.longitude }}
              {{ targetStatus.position.latitude }}<br />
              高度：{{ targetStatus.position.altitude }}<br />
              <div class="active-status">
                是否摧毁：{{ targetStatus.destroyed ? "是" : "否" }}
              </div>
            </div>

            <!-- 已连接但无目标数据 -->
            <div v-else class="status-info no-data">当前平台未探测到目标</div>
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
            <div class="cooperation-controls">
              <!-- 协同目标选择 -->
              <el-select
                v-model="cooperationTarget"
                placeholder="选择协同目标"
                class="cooperation-target-select"
                :disabled="!isConnected || detectedTargets.length === 0"
                size="small"
                clearable
              >
                <el-option
                  v-for="target in detectedTargets.filter(
                    (t) => !t.destroyed && t.status !== 'destroyed'
                  )"
                  :key="target.name"
                  :label="target.name"
                  :value="target.name"
                >
                  <template #default>
                    <div class="cooperation-target-option">
                      <span class="cooperation-target-name">{{
                        target.name
                      }}</span>
                      <span class="cooperation-target-type">{{
                        target.type
                      }}</span>
                      <span
                        class="cooperation-target-status"
                        :class="`status-${target.status}`"
                      >
                        {{ target.status === "active" ? "扫描中" : "失联" }}
                      </span>
                    </div>
                  </template>
                </el-option>
              </el-select>

              <el-button
                class="report-send-btn"
                @click="handleSendCooperationCommand"
                :disabled="!isConnected || !cooperationTarget"
                size="small"
                type="primary"
              >
                发送协同指令
              </el-button>
            </div>
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
                      v-if="
                        msg.details.targetName ||
                        msg.details.artilleryName ||
                        msg.details.weaponName
                      "
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
                        v-if="msg.details.artilleryName"
                        size="small"
                        type="warning"
                      >
                        火炮：{{ msg.details.artilleryName }}
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
import { ElMessage, ElMessageBox } from "element-plus";
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
const selectedTarget = ref(""); // 用于下拉框的目标选择
const selectedTargetFromList = ref(""); // 用于目标列表的目标选择

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

// 同组平台信息
const sameGroupPlatforms = ref<any[]>([]);

// 任务目标信息
const missionTarget = ref<any>(null);

// 心跳数据管理
const platformHeartbeats = ref<
  Map<string, { lastHeartbeat: number; isOnline: boolean }>
>(new Map());
const heartbeatTimeout = 5000; // 10秒超时判定为离线

// 平台图片数据管理
const platformImages = ref<Map<string, string>>(new Map());

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
        !platform.base?.broken &&
        platform.base?.side === "red"
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
  exerciseTime: "T + 0",
  astronomicalTime: "00:00:00",
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

// 目标状态数据 - 改为所有发现过目标的持久化列表
const detectedTargets = ref<any[]>([]); // 所有发现过的目标历史记录
const activeTargetNames = ref<Set<string>>(new Set()); // 当前活跃扫描到的目标名称集合

// 保留原有的目标状态结构用于兼容性
const targetStatus = reactive({
  name: "目标-001",
  position: {
    longitude: "116.400000°",
    latitude: "39.910000°",
    altitude: "0m",
  },
  destroyed: false,
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
    artilleryName?: string; // 火炮名称
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
const cooperationTarget = ref(""); // 协同打击目标选择

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
const sensorParamForm = reactive({
  azSlew: 0,
  elSlew: 0,
});

// 传感器转向限制参数
const sensorLimits = reactive({
  minAzSlew: -180,
  maxAzSlew: 180,
  minElSlew: -90,
  maxElSlew: 90,
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

// 从目标列表选择目标
const selectTargetFromList = (targetName: string) => {
  selectedTargetFromList.value = targetName;
  // 同步到下拉框选择
  selectedTarget.value = targetName;
  console.log(`[UavPage] 从列表选择目标: ${targetName}`);
};

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

    // 异步加载目标图片
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
      `[UavPage] 找到任务目标: ${missionTarget.value.name}, 状态: ${targetStatus}`,
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
        console.log(`[UavPage] 任务目标 ${targetName} 已被摧毁`);
        missionTarget.value.status = "destroyed";
        addLog("warning", `任务目标 ${targetName} 已被摧毁`);
      } else {
        // 目标仍然存在但不在同组中，可能被重新分组或失联
        missionTarget.value.status = "inactive";
      }
      return;
    }

    missionTarget.value = null;
    console.log(`[UavPage] 未找到组 ${selectedGroup.value} 中的蓝方目标`);
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
  return hasRealPlatformData.value && platforms.value.length > 0;
};

const getEnvironmentDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (hasRealPlatformData.value && platforms.value.length > 0) {
    return "connected";
  } else {
    return "no-data";
  }
};

const getEnvironmentDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (hasRealPlatformData.value && platforms.value.length > 0) {
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

// 载荷数据源判断
const hasPayloadData = () => {
  // 未连接时使用模拟数据
  if (!isConnected.value) {
    return true;
  }
  // 已连接时检查是否有真实载荷数据
  return (
    connectedPlatform.value &&
    connectedPlatform.value.sensors &&
    Array.isArray(connectedPlatform.value.sensors) &&
    connectedPlatform.value.sensors.length > 0
  );
};

const getPayloadDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (
    connectedPlatform.value &&
    connectedPlatform.value.sensors &&
    Array.isArray(connectedPlatform.value.sensors) &&
    connectedPlatform.value.sensors.length > 0
  ) {
    return "connected";
  } else {
    return "no-data";
  }
};

const getPayloadDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (
    connectedPlatform.value &&
    connectedPlatform.value.sensors &&
    Array.isArray(connectedPlatform.value.sensors) &&
    connectedPlatform.value.sensors.length > 0
  ) {
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
  // 已连接时检查是否有真实目标数据 - 改为检查探测到的目标列表
  return detectedTargets.value.length > 0;
};

const getTargetDataSourceClass = () => {
  if (!isConnected.value) {
    return "simulated";
  } else if (detectedTargets.value.length > 0) {
    return "connected";
  } else {
    return "no-data";
  }
};

const getTargetDataSourceText = () => {
  if (!isConnected.value) {
    return "模拟数据";
  } else if (detectedTargets.value.length > 0) {
    return "实时数据";
  } else {
    return "无数据";
  }
};

// 更新平台状态显示
const updatePlatformStatusDisplay = (platform: any) => {
  if (!platform?.base) return;

  console.log(`[UavPage] 开始更新平台状态显示:`, platform.base.name);

  // 更新平台位置和姿态信息
  if (platform.base.location) {
    const newLongitude = `${platform.base.location.longitude.toFixed(6)}°`;
    const newLatitude = `${platform.base.location.latitude.toFixed(6)}°`;
    const newAltitude = `${platform.base.location.altitude}m`;

    // 只在数据变化时才更新，避免不必要的重渲染
    if (
      platformStatus.position.longitude !== newLongitude ||
      platformStatus.position.latitude !== newLatitude ||
      platformStatus.position.altitude !== newAltitude
    ) {
      platformStatus.position.longitude = newLongitude;
      platformStatus.position.latitude = newLatitude;
      platformStatus.position.altitude = newAltitude;
      console.log(`[UavPage] 位置更新:`, platformStatus.position);
    }
  }

  // 更新姿态信息
  if (platform.base.pitch !== undefined) {
    const newPitch = `${platform.base.pitch.toFixed(1)}°`;
    if (platformStatus.attitude.pitch !== newPitch) {
      platformStatus.attitude.pitch = newPitch;
    }
  }
  if (platform.base.roll !== undefined) {
    const newRoll = `${platform.base.roll.toFixed(1)}°`;
    if (platformStatus.attitude.roll !== newRoll) {
      platformStatus.attitude.roll = newRoll;
    }
  }
  if (platform.base.yaw !== undefined) {
    const newYaw = `${platform.base.yaw.toFixed(1)}°`;
    if (platformStatus.attitude.yaw !== newYaw) {
      platformStatus.attitude.yaw = newYaw;
    }
  }

  // 更新载荷状态（从传感器信息获取）
  if (platform.sensors && Array.isArray(platform.sensors)) {
    console.log(`[UavPage] 处理 ${platform.sensors.length} 个传感器的状态`);

    platform.sensors.forEach((sensor: any, index: number) => {
      console.log(`[UavPage] 传感器 ${index + 1}:`, {
        name: sensor.base?.name,
        type: sensor.base?.type,
        isTurnedOn: sensor.base?.isTurnedOn,
        currentEl: sensor.base?.currentEl,
        currentAz: sensor.base?.currentAz,
      });

      // 处理光电传感器
      if (
        sensor.base?.type?.toLowerCase().includes("eoir") ||
        sensor.base?.name?.toLowerCase().includes("光电")
      ) {
        const sensorIsOn = sensor.base.isTurnedOn || false;
        const sensorEl = sensor.base.currentEl || 0.0;
        const sensorAz = sensor.base.currentAz || 0.0;

        // 同步载荷状态显示
        payloadStatus.optoElectronic.isTurnedOn = sensorIsOn;
        payloadStatus.optoElectronic.currentEl = sensorEl;
        payloadStatus.optoElectronic.currentAz = sensorAz;
        // 兼容原有字段
        payloadStatus.optoElectronic.status = sensorIsOn ? "正常" : "待机";
        payloadStatus.optoElectronic.power = sensorIsOn ? "开" : "关";

        // 同步光电载荷开关状态到界面组件
        if (optoElectronicPodEnabled.value !== sensorIsOn) {
          optoElectronicPodEnabled.value = sensorIsOn;
          console.log(`[UavPage] 光电载荷开关状态已同步: ${sensorIsOn}`);
        }
      }

      // 处理激光传感器
      if (
        sensor.base?.type?.toLowerCase().includes("laser") ||
        sensor.base?.name?.toLowerCase().includes("激光")
      ) {
        const sensorIsOn = sensor.base.isTurnedOn || false;
        const sensorEl = sensor.base.currentEl || 0.0;
        const sensorAz = sensor.base.currentAz || 0.0;

        // 同步载荷状态显示
        payloadStatus.laser.isTurnedOn = sensorIsOn;
        payloadStatus.laser.currentEl = sensorEl;
        payloadStatus.laser.currentAz = sensorAz;
        // 兼容原有字段
        payloadStatus.laser.status = sensorIsOn ? "正常" : "待机";
        payloadStatus.laser.power = sensorIsOn ? "开" : "关";

        // 同步激光载荷开关状态到界面组件
        if (laserPodEnabled.value !== sensorIsOn) {
          laserPodEnabled.value = sensorIsOn;
          console.log(`[UavPage] 激光载荷开关状态已同步: ${sensorIsOn}`);
        }

        // 更新激光编码（遵循项目规范）
        if (sensor.laserCode) {
          const laserCodeValue = sensor.laserCode.toString();
          // 只有在当前没有激光编码或编码不同时才更新
          if (laserCode.value !== laserCodeValue) {
            laserCode.value = laserCodeValue;
            // 根据项目规范，自动填入后设置为不可编辑状态
            isLaserCodeEditing.value = false;
            console.log(`[UavPage] 激光编码已更新: ${laserCodeValue}`);
          }
        }
      }
    });
  }

  console.log(`[UavPage] 平台状态显示更新完成`, {
    位置: platformStatus.position,
    姿态: platformStatus.attitude,
    光电载荷: payloadStatus.optoElectronic.isTurnedOn,
    激光载荷: payloadStatus.laser.isTurnedOn,
  });
};

// 处理平台状态数据包
const handlePlatformStatus = async (packet: any) => {
  try {
    // 处理平台心跳数据包 (0x2C)
    if (packet.parsedPacket?.packageType === 0x2c) {
      const parsedData = packet.parsedPacket.parsedData;
      if (parsedData?.name) {
        updatePlatformHeartbeat(parsedData.name);
        console.log(`[UavPage] 收到平台心跳: ${parsedData.name}`);
      }
      return; // 心跳包处理完成，直接返回
    }

    // 处理平台状态数据包 (0x29)
    if (packet.parsedPacket?.packageType === 0x29) {
      const parsedData = packet.parsedPacket.parsedData;

      if (parsedData?.platform && Array.isArray(parsedData.platform)) {
        // 更新平台数据
        platforms.value = parsedData.platform;
        lastUpdateTime.value = Date.now();
        hasRealPlatformData.value = true; // 标记已接收到真实平台数据

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
            updatePlatformStatusDisplay(updatedPlatform);

            console.log(
              `[UavPage] 实时更新已连接平台状态: ${connectedPlatformName.value}`,
              {
                位置: updatedPlatform.base?.location,
                传感器数: updatedPlatform.sensors?.length || 0,
                目标数: updatedPlatform.tracks?.length || 0,
              }
            );
          } else {
            console.warn(
              `[UavPage] 未找到已连接平台的更新数据: ${connectedPlatformName.value}`
            );
          }
        }

        // 更新探测到的目标列表
        updateDetectedTargets(parsedData.platform);

        // 检测目标是否被摧毁
        checkTargetDestroyed(parsedData.platform);

        // 更新环境参数（从 evironment 字段获取）
        if (parsedData.evironment) {
          const env = parsedData.evironment;
          console.log("[UavPage] 收到原始环境数据:", env);

          // 从平台数据中更新环境参数
          if (env.temperature !== undefined) {
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

          console.log("[UavPage] 处理后的环境参数:", {
            原始温度K: env.temperature,
            转换温度: environmentParams.temperature,
            风速风向: environmentParams.windSpeed,
            云层覆盖: environmentParams.cloudCover,
            降水状态: environmentParams.humidity,
            气压: environmentParams.pressure,
          });
        }

        // 更新演习时间（使用第一个平台的updateTime）
        if (
          parsedData.platform &&
          parsedData.platform[0]?.updateTime !== undefined
        ) {
          environmentParams.exerciseTime = `T + ${parsedData.platform[0].updateTime.toFixed(
            0
          )}秒`;

          // 更新天文时间（保持当前的实时时间显示）
          environmentParams.astronomicalTime = new Date().toLocaleTimeString();
        }

        // 更新任务目标信息
        await getMissionTarget();

        // 更新同组平台信息
        updateSameGroupPlatforms();
      }
    } else if (packet.parsedPacket?.packageType === 0x2a) {
      // 平台命令数据包 - 处理发射协同命令（火炮发送给无人机的）
      const parsedData = packet.parsedPacket.parsedData;

      if (parsedData?.fireCoordinateParam) {
        // 发射协同命令（Arty_Fire_Coordinate = 12）
        const fireCoordinateParam = parsedData.fireCoordinateParam;
        const sourcePlatform = parsedData.platformName || "未知火炮";

        // 构建消息内容
        let coordinateInfo = "";
        if (fireCoordinateParam.coordinate) {
          const coord = fireCoordinateParam.coordinate;
          coordinateInfo = `，坐标: ${coord.longitude.toFixed(
            4
          )}°, ${coord.latitude.toFixed(4)}°`;
        }

        const message = `收到来自 ${sourcePlatform} 的发射协同命令（目标: ${
          fireCoordinateParam.targetName || "未知"
        }，武器: ${
          fireCoordinateParam.weaponName || "未知"
        }${coordinateInfo}）`;

        // 添加到协同报文面板
        addCooperationMessage({
          type: "received",
          commandType: "fire_coordinate",
          sourcePlatform: parsedData.platformName || "未知火炮",
          targetPlatform: connectedPlatformName.value || "本无人机",
          content: message,
          details: {
            targetName: fireCoordinateParam.targetName,
            weaponName: fireCoordinateParam.weaponName,
            commandId: parsedData.commandID,
            coordinates: fireCoordinateParam.coordinate
              ? {
                  longitude: fireCoordinateParam.coordinate.longitude,
                  latitude: fireCoordinateParam.coordinate.latitude,
                  altitude: fireCoordinateParam.coordinate.altitude,
                }
              : undefined,
          },
          status: "success",
        });

        // 添加到操作日志
        addLog("info", message);

        console.log(`[UavPage] ${message}`);
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

// 更新平台心跳状态
const updatePlatformHeartbeat = (platformName: string) => {
  const now = Date.now();
  platformHeartbeats.value.set(platformName, {
    lastHeartbeat: now,
    isOnline: true,
  });
  console.log(`[UavPage] 更新平台心跳: ${platformName}`);
};

// 检查平台心跳超时
const checkHeartbeatTimeouts = () => {
  const now = Date.now();
  platformHeartbeats.value.forEach((heartbeat, platformName) => {
    if (now - heartbeat.lastHeartbeat > heartbeatTimeout) {
      if (heartbeat.isOnline) {
        heartbeat.isOnline = false;
        console.log(`[UavPage] 平台心跳超时: ${platformName}`);
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
    console.error(`[UavPage] 获取平台图片失败: ${platformType}`, error);
  }

  // 返回默认图片或空字符串
  return "";
};

// 图片加载错误处理
const onImageError = (platform: any) => {
  console.warn(`[UavPage] 平台图片加载失败: ${platform.type}`);
  // 清除错误的缓存
  platformImages.value.delete(platform.type);
  // 可以在这里设置一个错误标记，让组件显示默认图标
  platform.imageError = true;
};

// 任务目标图片加载错误处理
const onTargetImageError = (target: any) => {
  console.warn(`[UavPage] 任务目标图片加载失败: ${target.platformType}`);
  // 清除错误的缓存
  platformImages.value.delete(target.platformType);
  // 设置错误标记，让组件显示默认图标
  target.imageError = true;
  // 清除图片数据，让模板显示默认图标
  target.imageData = null;
};

// 更新同组平台信息
const updateSameGroupPlatforms = async () => {
  if (!isConnected.value || !selectedGroup.value || !platforms.value) {
    sameGroupPlatforms.value = [];
    return;
  }

  // 获取同组的红方平台
  const groupPlatforms = platforms.value.filter(
    (platform: any) =>
      platform.base?.group === selectedGroup.value &&
      platform.base?.side === "red" &&
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
    `[UavPage] 更新同组平台信息: ${selectedGroup.value}组，共${sameGroupPlatforms.value.length}个平台`,
    sameGroupPlatforms.value
  );
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

// 更新探测到的目标列表 - 改为持久化目标管理
const updateDetectedTargets = (platforms: any[]) => {
  if (!isConnected.value || !connectedPlatformName.value) {
    return;
  }

  // 从当前连接的平台的tracks中获取当前正在扫描的目标
  const connectedPlatformData = platforms.find(
    (platform: any) => platform.base?.name === connectedPlatformName.value
  );

  const currentActiveTargets = new Set<string>();
  const currentTracksData = new Map<string, any>();

  if (
    connectedPlatformData?.tracks &&
    Array.isArray(connectedPlatformData.tracks)
  ) {
    // 记录当前活跃的目标
    connectedPlatformData.tracks.forEach((track: any) => {
      if (track.targetName) {
        currentActiveTargets.add(track.targetName);
        currentTracksData.set(track.targetName, track);
      }
    });
  }

  // 更新活跃目标名称集合
  activeTargetNames.value = currentActiveTargets;

  // 处理目标状态更新
  const updatedTargets = [...detectedTargets.value];
  const existingTargetNames = new Set(updatedTargets.map((t) => t.name));

  // 1. 添加新发现的目标
  currentActiveTargets.forEach((targetName) => {
    if (!existingTargetNames.has(targetName)) {
      const track = currentTracksData.get(targetName);
      const targetPlatform = platforms.find(
        (platform: any) => platform.base?.name === targetName
      );

      const newTarget = {
        name: targetName,
        type: track?.targetType || "未知类型",
        sensorName: track?.sensorName || "未知传感器",
        position: targetPlatform?.base?.location
          ? {
              longitude: `${targetPlatform.base.location.longitude.toFixed(
                6
              )}°`,
              latitude: `${targetPlatform.base.location.latitude.toFixed(6)}°`,
              altitude: `${targetPlatform.base.location.altitude}m`,
            }
          : {
              longitude: "未知",
              latitude: "未知",
              altitude: "未知",
            },
        status: "active", // 活跃状态
        destroyed: false,
        lastUpdate: Date.now(),
        firstDetected: Date.now(),
      };

      updatedTargets.push(newTarget);
      console.log(`[UavPage] 新发现目标: ${targetName}`);
    }
  });

  // 2. 更新现有目标的状态和信息
  updatedTargets.forEach((target) => {
    const isCurrentlyActive = currentActiveTargets.has(target.name);
    const track = currentTracksData.get(target.name);
    const targetPlatform = platforms.find(
      (platform: any) => platform.base?.name === target.name
    );

    if (isCurrentlyActive) {
      // 目标当前活跃，更新其信息
      target.status = "active";
      target.lastUpdate = Date.now();

      // 更新类型信息（如果有）
      if (track?.targetType) {
        target.type = track.targetType;
      }

      // 更新位置信息（如果目标平台还存在）
      if (targetPlatform?.base?.location) {
        target.position = {
          longitude: `${targetPlatform.base.location.longitude.toFixed(6)}°`,
          latitude: `${targetPlatform.base.location.latitude.toFixed(6)}°`,
          altitude: `${targetPlatform.base.location.altitude}m`,
        };
        target.destroyed = false; // 如果还能获取到位置，说明未被摧毁
      }
    } else {
      // 目标当前不活跃
      if (target.status === "active") {
        target.status = "inactive";
        console.log(`[UavPage] 目标失去扫描: ${target.name}`);
      }

      // 检查目标是否被摧毁（不在任何平台中存在）
      if (!targetPlatform && !target.destroyed) {
        target.destroyed = true;
        target.status = "destroyed";
        console.log(`[UavPage] 目标被摧毁: ${target.name}`);
        addLog("warning", `目标 ${target.name} 已被摧毁`);
      }
    }
  });

  // 按首次发现时间排序（最新发现的在前）
  updatedTargets.sort(
    (a, b) => (b.firstDetected || 0) - (a.firstDetected || 0)
  );

  detectedTargets.value = updatedTargets;

  console.log(
    `[UavPage] 目标状态更新: 总共${detectedTargets.value.length}个目标，活跃${currentActiveTargets.size}个`
  );
};

// 添加目标摧毁检测函数
const checkTargetDestroyed = (platforms: any[]) => {
  // 只有在已连接平台且已锁定目标时才进行检测
  if (
    !isConnected.value ||
    !connectedPlatformName.value ||
    !selectedTarget.value
  ) {
    return;
  }

  // 查找当前锁定的目标是否仍然存在于平台数据中（作为平台名称）
  const targetExists = platforms.some(
    (platform: any) => platform.base?.name === selectedTarget.value
  );

  // 如果目标不存在于任何平台中，则认为目标被摧毁
  if (
    !targetExists &&
    targetStatus.name === selectedTarget.value &&
    targetStatus.destroyed == false
  ) {
    // 更新目标状态为已摧毁
    targetStatus.destroyed = true;
    addLog("warning", `目标 ${selectedTarget.value} 已被摧毁`);
    ElMessage.warning(`目标 ${selectedTarget.value} 已被摧毁`);
  } else if (targetExists && targetStatus.name === selectedTarget.value) {
    // 如果目标仍然存在，则目标未被摧毁
    targetStatus.destroyed = false;
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

const handleConnectPlatform = async () => {
  if (isConnected.value) {
    // 断开连接
    try {
      // 停止平台心跳（传入平台名称）
      const heartbeatStopped = await platformHeartbeatService.stopHeartbeat(
        connectedPlatformName.value
      );
      if (heartbeatStopped) {
        console.log(`[UavPage] 平台心跳已停止: ${connectedPlatformName.value}`);
        addLog("info", `平台心跳已停止: ${connectedPlatformName.value}`);
      }
    } catch (error: any) {
      console.error(`[UavPage] 停止心跳失败:`, error);
      addLog("warning", `停止心跳失败: ${error.message}`);
    }

    isConnected.value = false;
    connectedPlatform.value = null;
    connectedPlatformName.value = "";
    sameGroupPlatforms.value = [];

    // 不再清理心跳数据 - 让自然超时机制来处理在线状态
    // 这样其他平台的心跳状态不会被影响，断开的平台会通过超时自动变为离线
    // platformHeartbeats.value.clear(); // 移除这行代码

    // 心跳已在上面停止，无需重复调用

    // 清空同组平台信息
    sameGroupPlatforms.value = [];

    // 重置载荷开关状态
    optoElectronicPodEnabled.value = false;
    laserPodEnabled.value = false;

    // 断开连接时不清空目标历史记录，只重置活跃状态
    activeTargetNames.value.clear();

    // 将所有目标标记为不活跃（但保持历史记录）
    detectedTargets.value.forEach((target) => {
      if (target.status === "active") {
        target.status = "inactive";
      }
    });

    // 清除任务目标
    missionTarget.value = null;

    // 清空目标状态
    selectedTarget.value = "";
    selectedTargetFromList.value = "";
    targetStatus.name = "目标-001";
    targetStatus.destroyed = false;

    // 清空协同报文状态
    cooperationMessages.value = [];
    cooperationTarget.value = "";

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

    // 连接成功后重新激活符合条件的目标
    if (targetPlatform) {
      // 更新现有目标记录中对应目标的状态
      const existingTarget = detectedTargets.value.find(
        (t) => t.name === selectedUav.value
      );
      if (existingTarget) {
        existingTarget.status = "active";
        existingTarget.lastUpdate = Date.now();
      }
    }

    // 初始化传感器限制参数
    initializeSensorLimits();

    // 获取任务目标
    await getMissionTarget();

    // 更新同组平台信息
    updateSameGroupPlatforms();

    // 启动平台心跳（每3秒发送一次）
    const heartbeatStarted = await platformHeartbeatService.startHeartbeat(
      selectedUav.value,
      3000
    );
    if (heartbeatStarted) {
      console.log(`[UavPage] 平台心跳已启动: ${selectedUav.value}`);
      addLog("info", `平台心跳已启动: ${selectedUav.value}`);
    } else {
      console.error(`[UavPage] 平台心跳启动失败: ${selectedUav.value}`);
      addLog("warning", `平台心跳启动失败: ${selectedUav.value}`);
    }

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

    // 初始化传感器限制参数
    initializeSensorLimits();

    // 获取任务目标
    await getMissionTarget();

    // 更新同组平台信息
    updateSameGroupPlatforms();

    // 即使是模拟模式，也启动心跳发送
    const heartbeatStarted = await platformHeartbeatService.startHeartbeat(
      selectedUav.value,
      3000
    );
    if (heartbeatStarted) {
      console.log(`[UavPage] 模拟平台心跳已启动: ${selectedUav.value}`);
      addLog("info", `模拟平台心跳已启动: ${selectedUav.value}`);
    }

    addLog(
      "warning",
      `连接到模拟平台: ${selectedGroup.value} - ${selectedUav.value}`
    );
    ElMessage.success(`平台连接成功（模拟模式）: ${selectedUav.value}`);
  }
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

const handleTurn = async () => {
  if (!isConnected.value) {
    ElMessage.warning("请先连接平台");
    return;
  }

  // 直接使用当前输入的参数发送转向命令
  await sendSensorParamCommand();
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
      // await new Promise((resolve) => setTimeout(resolve, 1000));

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

// 初始化传感器限制参数
const initializeSensorLimits = () => {
  // 从连接的传感器获取限制参数
  if (
    connectedPlatform.value?.sensors &&
    Array.isArray(connectedPlatform.value.sensors)
  ) {
    const optoElectronicSensor = connectedPlatform.value.sensors.find(
      (sensor: any) =>
        sensor.base?.type?.toLowerCase().includes("eoir") ||
        sensor.base?.name?.toLowerCase().includes("光电")
    );

    if (optoElectronicSensor) {
      // 从光电传感器获取转向限制参数
      sensorLimits.minAzSlew =
        optoElectronicSensor.base?.minAzSlew !== undefined
          ? Math.round(optoElectronicSensor.base.minAzSlew)
          : -180;
      sensorLimits.maxAzSlew =
        optoElectronicSensor.base?.maxAzSlew !== undefined
          ? Math.round(optoElectronicSensor.base.maxAzSlew)
          : 180;
      sensorLimits.minElSlew =
        optoElectronicSensor.base?.minElSlew !== undefined
          ? Math.round(optoElectronicSensor.base.minElSlew)
          : -90;
      sensorLimits.maxElSlew =
        optoElectronicSensor.base?.maxElSlew !== undefined
          ? Math.round(optoElectronicSensor.base.maxElSlew)
          : 90;
    } else {
      // 如果没有找到光电传感器，使用默认值
      sensorParamForm.azSlew = 0;
      sensorParamForm.elSlew = 0;
      sensorLimits.minAzSlew = -180;
      sensorLimits.maxAzSlew = 180;
      sensorLimits.minElSlew = -90;
      sensorLimits.maxElSlew = 90;
    }
  } else {
    // 如果没有连接平台或传感器数据，使用默认值
    sensorParamForm.azSlew = 0;
    sensorParamForm.elSlew = 0;
    sensorLimits.minAzSlew = -180;
    sensorLimits.maxAzSlew = 180;
    sensorLimits.minElSlew = -90;
    sensorLimits.maxElSlew = 90;
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

  // 同步目标列表选择
  selectedTargetFromList.value = selectedTarget.value;
  targetStatus.destroyed = false;
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

    if (!cooperationTarget.value) {
      ElMessage.warning("请先选择要协同打击的目标");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Strike_Coordinate"];
    if (commandEnum === undefined) {
      throw new Error("未知打击协同命令");
    }

    // 获取协同目标信息
    const targetInfo = detectedTargets.value.find(
      (t) => t.name === cooperationTarget.value
    );
    const targetName = targetInfo?.name || cooperationTarget.value;

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
        `打击协同指令已发送（目标: ${targetName}，协同火炮: ${artilleryName}）`
      );

      // 添加新的协同报文
      addCooperationMessage({
        type: "sent",
        commandType: "strike_coordinate",
        sourcePlatform: connectedPlatformName.value || "本无人机",
        targetPlatform: artilleryName || "协同火炮",
        content: `无人机发出协同打击报文（目标: ${targetName}，火炮: ${artilleryName}）`,
        details: {
          targetName: targetName,
          artilleryName: artilleryName,
          commandId: commandData.commandID,
          coordinates: commandData.strikeCoordinateParam?.coordinate
            ? {
                longitude:
                  commandData.strikeCoordinateParam.coordinate.longitude,
                latitude: commandData.strikeCoordinateParam.coordinate.latitude,
                altitude: commandData.strikeCoordinateParam.coordinate.altitude,
              }
            : undefined,
        },
        status: "success",
      });

      // 发送成功后清空选择
      cooperationTarget.value = "";
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
    // 每秒检查心跳超时
    checkHeartbeatTimeouts();

    // 演习时间现在从平台数据获取，不再在这里更新
    // 只在没有真实平台数据时使用默认时间
    if (platforms.value.length === 0) {
      environmentParams.exerciseTime = `T + ${Date.now()}`;
    }

    // 更新天文时间（实际当前时间）
    environmentParams.astronomicalTime = new Date().toLocaleTimeString();

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
  background: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.top-content {
  display: flex;
  align-items: center;
  width: 100%;
}

/* 连接控制卡片（全宽） */
.connection-card {
  flex: 1;
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
}

/* 演练方案区域（在连接栏内） */
.exercise-section {
  display: flex;
  align-items: center;
}

/* 演练方案按钮 */
.exercise-btn {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
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

/* 席位标题 */
.seat-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
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

/* 主要内容区域 */
.main-content {
  min-height: 500px;
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
  min-width: 300px;
}

/* 右侧报文面板 */
.right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.target-name-type {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
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

/* 报文面板样式 */
.report-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 600px; /* 设置最大高度防止页面过高 */
}

.report-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.cooperation-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cooperation-target-select {
  flex: 1;
  min-width: 150px;
}

.cooperation-target-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.cooperation-target-name {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.cooperation-target-type {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.cooperation-target-status {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 500;
}

.cooperation-target-status.status-active {
  background: #e8f5e8;
  color: #52c41a;
}

.cooperation-target-status.status-inactive {
  background: #fff7e6;
  color: #faad14;
}

.inactive-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #faad14;
  font-size: 11px;
  font-weight: 500;
}

.inactive-icon {
  font-size: 12px;
  color: #faad14;
}

.inactive-text {
  font-size: 11px;
  font-weight: 500;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.report-send-btn {
  padding: 4px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.report-send-btn:hover {
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

/* 发送消息样式 */
.message-sent {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #e3f2fd, #f3f9ff);
  border: 1px solid #bbdefb;
}

.message-sent .message-header {
  background: linear-gradient(135deg, #409eff30, #409eff20);
}

/* 接收消息样式 */
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

/* 传感器参数输入样式 */
.sensor-param-group {
  padding: 8px 0;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.param-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  min-width: 60px;
}

.param-input {
  flex: 1;
  min-width: 100px;
}

.param-unit {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
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

/* 状态卡片 */
.status-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d0d0d0;
  min-height: 120px;
}

.status-card.target-status {
  min-height: 200px;
  max-height: 400px;
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

.status-info.no-data {
  color: #999;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.destroyed-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  font-weight: 600;
}

.destroyed-icon {
  font-size: 20px;
  color: #f56c6c;
  animation: pulse 1.5s infinite;
}

.destroyed-text {
  font-size: 16px;
  font-weight: 700;
}

.active-status {
  margin-top: 8px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
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

/* 目标列表样式 */
.target-count {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

.targets-list {
  max-height: 280px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.target-item {
  padding: 8px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.2s;
  cursor: pointer;
  min-height: 80px;
  position: relative;
}

.target-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.target-item.selected-target {
  border-color: #007bff;
  background: #e8f4fd;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

.target-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
}

.target-main-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.target-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
  flex: 1;
  margin-right: 8px;
}

.target-status-indicator {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
}

.target-secondary-info {
  margin-top: 4px;
}

.target-type {
  font-size: 11px;
  color: #666;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  display: inline-block;
}

.target-position {
  font-size: 11px;
  color: #666;
  line-height: 1.3;
  margin-top: auto;
  font-family: "SF Mono", "Monaco", "Menlo", monospace;
}

.active-status {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #52c41a;
  font-size: 10px;
  font-weight: 500;
  background: #e8f5e8;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.active-icon {
  font-size: 10px;
  color: #52c41a;
}

.active-text {
  font-size: 10px;
  font-weight: 500;
}

.inactive-status {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #faad14;
  font-size: 10px;
  font-weight: 500;
  background: #fff7e6;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(250, 173, 20, 0.3);
}

.inactive-icon {
  font-size: 10px;
  color: #faad14;
}

.inactive-text {
  font-size: 10px;
  font-weight: 500;
}

.destroyed-status {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #f56c6c;
  font-size: 10px;
  font-weight: 500;
  background: #fef0f0;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(245, 108, 108, 0.3);
  animation: targetDestroyedPulse 2s infinite;
}

.destroyed-icon {
  font-size: 10px;
  color: #f56c6c;
}

.destroyed-text {
  font-size: 10px;
  font-weight: 500;
}

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
  /* padding: 12px 16px; */
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

.group-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 100px;
  padding-right: 16px;
  border-right: 2px solid #dee2e6;
}

.group-label {
  font-size: 16px;
  font-weight: 700;
  color: #007bff;
}

.platform-count {
  font-size: 11px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.platforms-list {
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex: 1;
  max-height: 80px;
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
  /* transition: all 0.3s ease; */
  position: relative;
  /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */
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

.platform-status-indicator {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: statusPulse 2s infinite;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.status-dot.online {
  background: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.3), 0 0 8px rgba(40, 167, 69, 0.6);
}

.status-dot.offline {
  background: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.3), 0 0 8px rgba(220, 53, 69, 0.6);
  animation: statusPulseError 2s infinite;
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
  /* font-size: 12px; */
}

@keyframes statusPulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@keyframes statusPulseError {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

/* 连接信息样式优化 */
.connected-platform-name {
  color: #28a745;
  font-weight: 700;
  background: linear-gradient(45deg, #28a745, #20c997);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
