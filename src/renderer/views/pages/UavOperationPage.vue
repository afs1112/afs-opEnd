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
              <div class="title-with-back">
                <el-button
                  class="back-button"
                  size="default"
                  @click="handleBackToStart"
                >
                  <el-icon><ArrowLeft /></el-icon>
                  返回
                </el-button>
                <div class="seat-title">无人机席位</div>
              </div>
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
          <div class="button-row">
            <div class="control-group">
              <el-button
                class="route-planning-btn"
                @click="handleRoutePlanning"
              >
                航线规划
              </el-button>
              <el-button
                class="set-speed-btn"
                type="success"
                @click="showSetSpeedDialog"
                :disabled="!isConnected"
              >
                速度设置
              </el-button>
              <!-- 同步轨迹按钮已移除，现在连接时自动开启同步轨迹 -->
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

            <!-- 照射持续时间输入 -->
            <div class="input-group mb-2">
              <div class="input-wrapper">
                <el-input
                  v-model="irradiationDuration"
                  placeholder="请输入照射持续时间(秒)"
                  :disabled="!isDurationEditing"
                  class="laser-input"
                  @keyup.enter="handleSetIrradiationDuration"
                  @input="handleDurationInput"
                />
                <el-button
                  class="confirm-btn"
                  @click="handleSetIrradiationDuration"
                  :type="isDurationEditing ? 'primary' : 'default'"
                >
                  {{ isDurationEditing ? "确定" : "编辑" }}
                </el-button>
              </div>
            </div>

            <!-- 激光倒计时输入 -->
            <div class="input-group mb-2">
              <div class="input-wrapper">
                <el-input
                  v-model="laserCountdown"
                  placeholder="请输入照射倒计时(秒)"
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
                :disabled="!laserPodEnabled"
              >
                <span v-if="isIrradiating"
                  >照射 ({{ irradiationCountdown }})</span
                >
                <span v-else>照射</span>
              </el-button>
              <el-button
                class="action-btn"
                @click="handleStop"
                :type="isLasingActive ? 'danger' : 'default'"
                :disabled="!laserPodEnabled"
              >
                <span v-if="isLasingActive && lasingDurationCountdown > 0"
                  >停止 ({{ lasingDurationCountdown }})</span
                >
                <span v-else>停止</span>
              </el-button>
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
              {{ platformStatus.position.altitude }}
              <br />
              速度：{{ platformStatus.speed }}
              <br />
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
                    <div class="target-name-section">
                      <!-- 锁定目标标记（作为前缀） -->
                      <div
                        v-if="lockedTarget === target.name"
                        class="locked-prefix"
                      >
                        <el-icon class="locked-prefix-icon"><Lock /></el-icon>
                      </div>
                      <span class="target-name">{{ target.name }}</span>
                    </div>
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
        <div v-if="isConnected" class="mission-target-banner">
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
            <!-- 发报文区域 -->
            <div class="sent-messages-section">
              <div class="section-header">
                <el-icon class="section-icon"><ArrowRight /></el-icon>
                <span class="section-title"
                  >发报文 ({{ sentMessages.length }})</span
                >
              </div>
              <div class="messages-container">
                <div
                  v-for="msg in sentMessages"
                  :key="msg.id"
                  class="message-item message-sent"
                  :class="{
                    'message-success': msg.status === 'success',
                    'message-failed': msg.status === 'failed',
                    'message-pending': msg.status === 'pending',
                  }"
                >
                  <div class="message-content">
                    <div class="message-header-compact">
                      <span class="target-platform"
                        >→ {{ msg.targetPlatform }}</span
                      >
                      <span class="exercise-time">{{ msg.exerciseTime }}</span>
                    </div>
                    <div class="message-text">{{ msg.content }}</div>
                    <div
                      v-if="msg.details.targetName || msg.details.coordinates"
                      class="message-tags"
                    >
                      <el-tag
                        v-if="msg.details.targetName"
                        size="small"
                        type="info"
                      >
                        {{ msg.details.targetName }}
                      </el-tag>
                      <el-tag
                        v-if="msg.details.coordinates"
                        size="small"
                        type="success"
                      >
                        {{ msg.details.coordinates.longitude.toFixed(2) }}°,
                        {{ msg.details.coordinates.latitude.toFixed(2) }}°
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-if="sentMessages.length === 0" class="empty-message">
                  暂无发送报文
                </div>
              </div>
            </div>

            <!-- 收报文区域 -->
            <div class="received-messages-section">
              <div class="section-header">
                <el-icon class="section-icon"><ArrowLeft /></el-icon>
                <span class="section-title"
                  >收报文 ({{ receivedMessages.length }})</span
                >
              </div>
              <div class="messages-container">
                <div
                  v-for="msg in receivedMessages"
                  :key="msg.id"
                  class="message-item message-received"
                  :class="{
                    'message-success': msg.status === 'success',
                    'message-failed': msg.status === 'failed',
                    'message-pending': msg.status === 'pending',
                  }"
                >
                  <div class="message-content">
                    <div class="message-header-compact">
                      <span class="source-platform"
                        >← {{ msg.sourcePlatform }}</span
                      >
                      <span class="exercise-time">{{ msg.exerciseTime }}</span>
                    </div>
                    <div class="message-text">{{ msg.content }}</div>
                    <div
                      v-if="msg.details.targetName || msg.details.coordinates"
                      class="message-tags"
                    >
                      <el-tag
                        v-if="msg.details.targetName"
                        size="small"
                        type="info"
                      >
                        {{ msg.details.targetName }}
                      </el-tag>
                      <el-tag
                        v-if="msg.details.coordinates"
                        size="small"
                        type="success"
                      >
                        {{ msg.details.coordinates.longitude.toFixed(2) }}°,
                        {{ msg.details.coordinates.latitude.toFixed(2) }}°
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-if="receivedMessages.length === 0" class="empty-message">
                  暂无接收报文
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
      :title="
        currentDocumentInfo
          ? `${DocumentService.getDocumentIcon(currentDocumentInfo.type)} ${
              currentDocumentInfo.fileName
            } - ${DocumentService.getDocumentTypeDisplayName(
              currentDocumentInfo.type
            )}`
          : '文档查看'
      "
      width="80%"
      :before-close="handleCloseDocument"
    >
      <!-- 文档信息栏 -->
      <div v-if="currentDocumentInfo" class="document-info-bar">
        <div class="info-left">
          <el-tag
            :type="currentDocumentInfo.isFromCache ? 'warning' : 'success'"
            size="small"
          >
            {{ currentDocumentInfo.isFromCache ? "缓存文档" : "新加载" }}
          </el-tag>
          <span class="file-path">{{ currentDocumentInfo.filePath }}</span>
        </div>
        <div class="info-right">
          <el-button
            @click="selectOtherDocument"
            type="primary"
            size="small"
            icon="Folder"
          >
            选择其他文档
          </el-button>
        </div>
      </div>

      <div class="document-content">
        <div v-if="documentLoading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载文档...</span>
        </div>
        <div v-else-if="documentError" class="error-container">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ documentError }}</span>
          <el-button @click="selectDocument" type="primary" size="small">
            重新选择文档
          </el-button>
        </div>
        <div v-else-if="documentContent" class="document-text">
          <!-- 根据内容类型选择不同的显示方式 -->
          <div
            v-if="isDocumentHtml"
            v-html="documentContent"
            class="html-content"
          ></div>
          <pre v-else class="text-content">{{ documentContent }}</pre>
        </div>
        <div v-else class="empty-container">
          <div class="empty-content">
            <el-icon class="empty-icon"><Document /></el-icon>
            <span class="empty-text">请选择要打开的文档</span>
            <el-button @click="selectDocument" type="primary">
              选择文档
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            @click="selectDocument"
            type="primary"
            v-if="!currentDocumentInfo"
          >
            选择文档
          </el-button>
          <el-button @click="handleCloseDocument">
            {{ currentDocumentInfo ? "隐藏" : "关闭" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 份真平台断线提示对话框 -->
    <el-dialog
      v-model="simulationDisconnectedDialogVisible"
      title="仟真平台连接异常"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="simulation-disconnect-content">
        <div class="warning-icon">
          <el-icon size="48" color="#E6A23C"><WarningFilled /></el-icon>
        </div>
        <div class="warning-message">
          <h3>仟真平台可能已断线</h3>
          <p>系统已超过30秒未收到演习时间数据更新，请检查：</p>
          <ul>
            <li>仟真系统是否正常运行</li>
            <li>网络连接是否正常</li>
            <li>组播设置是否正确</li>
          </ul>
          <p class="continue-hint">
            您可以选择手动断开连接，或继续等待数据恢复。
          </p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <!-- <el-button @click="handleContinueWaitingSimulation" type="info">
            继续等待
          </el-button> -->
          <el-button @click="handleForceDisconnectSimulation" type="warning">
            手动断开
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设置速度对话框 -->
    <el-dialog
      v-model="setSpeedDialogVisible"
      title="无人机速度设置"
      width="400px"
    >
      <el-form :model="setSpeedForm" label-width="100px">
        <el-form-item label="平台名称">
          <el-input :value="connectedPlatformName" disabled />
        </el-form-item>
        <el-form-item label="目标速度">
          <el-input-number
            v-model="setSpeedForm.speed"
            :min="1"
            :max="100"
            :step="1"
            class="w-full"
          />
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
  Document,
  Folder,
  Lock,
} from "@element-plus/icons-vue";
import {
  platformHeartbeatService,
  platformImageService,
  DocumentService,
} from "../../services";

// 定义emit事件
const emit = defineEmits<{
  backToStart: [];
}>();

// 返回席位选择
const handleBackToStart = () => {
  console.log("[UavPage] 返回席位选择");
  emit("backToStart");
};

// 基础数据
const optoElectronicPodEnabled = ref(false); // 光电吊舱控制开关
const laserPodEnabled = ref(false); // 激光吊舱控制开关

// 激光编码相关
const laserCode = ref("");
const isLaserCodeEditing = ref(true);

// 照射持续时间相关
const irradiationDuration = ref("");
const isDurationEditing = ref(true);

// 激光倒计时相关
const laserCountdown = ref("");
const isCountdownEditing = ref(true);

// 照射倒计时相关
const isIrradiating = ref(false);
const irradiationCountdown = ref(0);

// 基于演习时间的照射倒计时
const irradiationStartExerciseTime = ref<number | null>(null); // 倒计时开始时的演习时间（秒）
const irradiationTargetDuration = ref<number>(0); // 目标倒计时时长（秒）

// 照射时长倒计时相关（用于停止按钮）
const isLasingActive = ref(false); // 是否正在激光照射中
const lasingDurationCountdown = ref(0); // 照射时长倒计时

// 基于演习时间的照射时长倒计时
const lasingStartExerciseTime = ref<number | null>(null); // 照射开始时的演习时间（秒）
const lasingTargetDuration = ref<number>(0); // 目标照射时长（秒）

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
const lockedTarget = ref(""); // 当前被锁定的目标名称

// 激光传感器周期性锁定相关
const laserLockTimer = ref<NodeJS.Timeout | null>(null);
const isLaserLockActive = ref(false);

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

// 仿真平台断线检测相关变量
const lastExerciseTimeUpdate = ref<number>(0); // 最后一次演习时间更新的时间戳
const simulationTimeout = 10000; // 10秒超时判定为仿真平台断线
const simulationDisconnectedDialogVisible = ref(false); // 仿真平台断线对话框是否可见
const simulationCheckTimer = ref<NodeJS.Timeout | null>(null); // 仿真平台检测定时器

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
  speed: "100m/s",
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

// 分离发送和接收的报文 - 按项目规范实现UI优化
const sentMessages = computed(() =>
  cooperationMessages.value.filter((msg) => msg.type === "sent")
);

const receivedMessages = computed(() =>
  cooperationMessages.value.filter((msg) => msg.type === "received")
);

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
const currentDocumentInfo = ref<any>(null); // 存储当前文档信息
const hasOpenedDocuments = ref(false); // 是否有已打开的文档
const isDocumentHtml = ref(false); // 文档内容是否为HTML格式

// 设置速度相关
const setSpeedDialogVisible = ref(false);
const setSpeedForm = reactive({
  speed: 15, // 默认速度 15 m/s
});

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
    const newAltitude = `${platform.base.location.altitude.toFixed(1)}m`;
    const newSpeed = `${platform.base.speed.toFixed(1)} m/s`;

    // 只在数据变化时才更新，避免不必要的重渲染
    if (
      platformStatus.position.longitude !== newLongitude ||
      platformStatus.position.latitude !== newLatitude ||
      platformStatus.position.altitude !== newAltitude
    ) {
      platformStatus.position.longitude = newLongitude;
      platformStatus.position.latitude = newLatitude;
      platformStatus.position.altitude = newAltitude;
      platformStatus.speed = newSpeed;
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

        // 更新照射持续时间（从desigDuring获取）
        if (sensor.desigDuring !== undefined) {
          const durationValue = sensor.desigDuring.toString();
          // 只有在当前没有持续时间或持续时间不同时才更新
          if (irradiationDuration.value !== durationValue) {
            irradiationDuration.value = durationValue;
            // 根据项目规范，自动填入后设置为不可编辑状态
            isDurationEditing.value = false;
            console.log(`[UavPage] 照射持续时间已更新: ${durationValue}秒`);
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

          // 记录演习时间更新的时间戳，用于仿真平台断线检测
          lastExerciseTimeUpdate.value = Date.now();

          // 检查基于演习时间的倒计时
          checkExerciseTimeBasedCountdowns();

          // 如果之前显示了断线对话框，现在数据恢复了，自动关闭对话框
          if (simulationDisconnectedDialogVisible.value) {
            simulationDisconnectedDialogVisible.value = false;
            addLog("success", "仿真平台数据恢复，连接恢复正常");
            ElMessage.success("仿真平台数据恢复，连接恢复正常");
            console.log("[UavPage] 仿真平台数据恢复，自动关闭断线提示对话框");
          }

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

// 检测仿真平台连接状态
const checkSimulationConnection = () => {
  // 只在已连接状态下才进行检测
  if (!isConnected.value || lastExerciseTimeUpdate.value === 0) {
    return;
  }

  const now = Date.now();
  const timeSinceLastUpdate = now - lastExerciseTimeUpdate.value;

  // 如果超过超时时间且对话框未显示，则显示断线提示
  if (
    timeSinceLastUpdate > simulationTimeout &&
    !simulationDisconnectedDialogVisible.value
  ) {
    console.warn(
      `[UavPage] 仿真平台可能已断线，距离上次数据更新已过 ${Math.round(
        timeSinceLastUpdate / 1000
      )} 秒`
    );
    simulationDisconnectedDialogVisible.value = true;
    addLog("warning", "仿真平台可能已断线，请检查网络连接或重新启动仿真系统");
  }
};

// 手动断开仿真平台连接
const handleForceDisconnectSimulation = async () => {
  try {
    console.log("[UavPage] 用户手动断开仿真平台连接");

    // 关闭对话框
    simulationDisconnectedDialogVisible.value = false;

    // 执行断开操作
    await handleConnectPlatform();

    addLog("info", "用户手动断开了仿真平台连接");
    ElMessage.info("已断开仿真平台连接");
  } catch (error: any) {
    console.error("[UavPage] 手动断开仿真平台连接失败:", error);
    addLog("error", `断开仿真平台连接失败: ${error.message}`);
    ElMessage.error(`断开失败: ${error.message}`);
  }
};

// 继续等待仿真平台数据
const handleContinueWaitingSimulation = () => {
  console.log("[UavPage] 用户选择继续等待仿真平台数据");
  simulationDisconnectedDialogVisible.value = false;
  addLog("info", "继续等待仿真平台数据更新...");
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
// 解析演习时间为秒数
const parseExerciseTime = (timeStr: string): number => {
  // 格式: "T + 123秒" 或 "T + 2分30秒"
  const secondsMatch = timeStr.match(/T \+ (\d+)秒/);
  if (secondsMatch) {
    return parseInt(secondsMatch[1]);
  }

  const minutesMatch = timeStr.match(/T \+ (\d+)分(\d+)秒/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1]) * 60 + parseInt(minutesMatch[2]);
  }

  return 0;
};

// 获取当前演习时间（秒）
const getCurrentExerciseTimeInSeconds = (): number => {
  return parseExerciseTime(environmentParams.exerciseTime);
};

// 检查基于演习时间的倒计时
const checkExerciseTimeBasedCountdowns = () => {
  const currentExerciseTime = getCurrentExerciseTimeInSeconds();

  // 检查照射倒计时
  if (isIrradiating.value && irradiationStartExerciseTime.value !== null) {
    const elapsed = currentExerciseTime - irradiationStartExerciseTime.value;
    const remaining = Math.max(0, irradiationTargetDuration.value - elapsed);

    irradiationCountdown.value = remaining;

    if (remaining <= 0) {
      // 照射倒计时结束
      isIrradiating.value = false;
      irradiationStartExerciseTime.value = null;
      irradiationTargetDuration.value = 0;

      // 发送激光照射命令并启动照射时长倒计时
      sendLaserCommandAndStartDuration();
    }
  }

  // 检查照射时长倒计时
  if (isLasingActive.value && lasingStartExerciseTime.value !== null) {
    const elapsed = currentExerciseTime - lasingStartExerciseTime.value;
    const remaining = Math.max(0, lasingTargetDuration.value - elapsed);

    lasingDurationCountdown.value = remaining;

    if (remaining <= 0) {
      // 照射时长倒计时结束
      isLasingActive.value = false;
      lasingStartExerciseTime.value = null;
      lasingTargetDuration.value = 0;

      addLog("info", `照射时长倒计时结束（演习时间），自动发送停止照射命令`);
      ElMessage.info(`照射时长已结束，自动停止照射`);

      // 发送停止照射命令
      sendLaserCommand("Uav_LazerPod_Cease");
    }
  }
};

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
// toggleTrajectorySync 函数已移除，现在通过连接/断开自动控制同步轨迹

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

    // 停止轨迹同步
    stopTrajectorySync();

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

    // 重置仿真平台检测状态
    lastExerciseTimeUpdate.value = 0;
    simulationDisconnectedDialogVisible.value = false;

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
    // 连接到真实平台前，先清空所有目标相关状态
    // 清空发现目标列表
    detectedTargets.value = [];
    activeTargetNames.value.clear();

    // 清空目标选择和状态
    selectedTarget.value = "";
    selectedTargetFromList.value = "";
    lockedTarget.value = "";
    targetStatus.name = "目标-001";
    targetStatus.destroyed = false;

    // 清除任务目标
    missionTarget.value = null;

    // 清空协同报文状态
    cooperationMessages.value = [];
    cooperationTarget.value = "";

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

    // 连接成功后自动开启轨迹同步
    await startTrajectorySync();

    // 初始化仿真平台检测状态
    lastExerciseTimeUpdate.value = Date.now(); // 设置初始时间
    simulationDisconnectedDialogVisible.value = false; // 确保对话框关闭

    addLog(
      "success",
      `已连接到真实平台: ${selectedGroup.value} - ${selectedUav.value}`
    );
    ElMessage.success(`平台连接成功: ${selectedUav.value}`);
  } else {
    // 未找到真实平台，但仍然允许连接（使用默认数据）
    // 连接前先清空所有目标相关状态
    // 清空发现目标列表
    detectedTargets.value = [];
    activeTargetNames.value.clear();

    // 清空目标选择和状态
    selectedTarget.value = "";
    selectedTargetFromList.value = "";
    lockedTarget.value = "";
    targetStatus.name = "目标-001";
    targetStatus.destroyed = false;

    // 清除任务目标
    missionTarget.value = null;

    // 清空协同报文状态
    cooperationMessages.value = [];
    cooperationTarget.value = "";

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

    // 模拟模式下也自动开启轨迹同步
    await startTrajectorySync();

    // 初始化仿真平台检测状态（模拟模式下也需要检测）
    lastExerciseTimeUpdate.value = Date.now(); // 设置初始时间
    simulationDisconnectedDialogVisible.value = false; // 确保对话框关闭

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

// 设置速度相关方法
const showSetSpeedDialog = () => {
  if (!isConnected.value) {
    ElMessage.warning("请先连接平台");
    return;
  }

  setSpeedForm.speed = 15; // 默认速度
  setSpeedDialogVisible.value = true;
};

const sendSetSpeedCommand = async () => {
  try {
    if (!isConnected.value || !connectedPlatformName.value) {
      ElMessage.warning("请先连接平台");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Set_Speed"];
    if (commandEnum === undefined) {
      throw new Error("未定义的速度设置命令");
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      setSpeedParam: {
        speed: Number(setSpeedForm.speed),
      },
    };

    addLog(
      "info",
      `发送速度设置命令: 平台 ${connectedPlatformName.value} 设置速度为 ${setSpeedForm.speed} m/s`
    );

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      addLog("success", `速度设置命令发送成功`);
      ElMessage.success("速度设置命令发送成功");
      setSpeedDialogVisible.value = false;
    } else {
      addLog("error", `速度设置命令发送失败: ${result.error}`);
      ElMessage.error(`命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送速度设置命令失败: ${error.message}`;
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

const handleSetIrradiationDuration = () => {
  if (isDurationEditing.value) {
    // 确定模式
    if (!irradiationDuration.value.trim()) {
      ElMessage.warning("请输入照射持续时间");
      return;
    }
    isDurationEditing.value = false;
    addLog("success", `照射持续时间已设置: ${irradiationDuration.value}秒`);
    ElMessage.success(`照射持续时间已设置: ${irradiationDuration.value}秒`);
  } else {
    // 编辑模式
    isDurationEditing.value = true;
    addLog("info", "开始编辑照射持续时间");
  }
};

const handleSetLaserCountdown = () => {
  if (isCountdownEditing.value) {
    // 确定模式
    if (!laserCountdown.value.trim()) {
      ElMessage.warning("请输入照射倒计时时间");
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
  // 检查激光载荷开关状态
  if (!laserPodEnabled.value) {
    ElMessage.warning("请先打开激光载荷开关");
    return;
  }

  if (isIrradiating.value) {
    // 当前正在照射倒计时，取消照射
    isIrradiating.value = false;
    irradiationStartExerciseTime.value = null;
    irradiationTargetDuration.value = 0;
    irradiationCountdown.value = 0;
    addLog("warning", "照射已取消");
    ElMessage.warning("照射已取消");
    return;
  }

  // 检查是否设置了照射倒计时
  const countdownTime = laserCountdown.value
    ? parseInt(laserCountdown.value)
    : 0;

  if (countdownTime <= 0) {
    // 没有设置倒计时或倒计时为0，直接发送照射命令
    sendLaserCommandAndStartDuration();
    return;
  }

  // 有倒计时，启动基于演习时间的倒计时流程
  const currentExerciseTime = getCurrentExerciseTimeInSeconds();
  isIrradiating.value = true;
  irradiationStartExerciseTime.value = currentExerciseTime;
  irradiationTargetDuration.value = countdownTime;
  irradiationCountdown.value = countdownTime;

  addLog("info", `开始照射倒计时: ${countdownTime}秒（基于演习时间）`);
  ElMessage.info(`照射倒计时开始: ${countdownTime}秒`);

  console.log(
    `[UavPage] 照射倒计时开始 - 当前演习时间: ${currentExerciseTime}秒, 目标时长: ${countdownTime}秒`
  );
};

// 发送激光照射命令并启动照射时长倒计时
const sendLaserCommandAndStartDuration = () => {
  // 发送激光照射命令
  sendLaserCommand("Uav_LazerPod_Lasing");

  // 设置激光照射活跃状态
  isLasingActive.value = true;

  // 检查是否设置了照射持续时间
  const durationTime = irradiationDuration.value
    ? parseInt(irradiationDuration.value)
    : 0;

  if (durationTime > 0) {
    // 启动基于演习时间的照射时长倒计时
    const currentExerciseTime = getCurrentExerciseTimeInSeconds();
    lasingStartExerciseTime.value = currentExerciseTime;
    lasingTargetDuration.value = durationTime;
    lasingDurationCountdown.value = durationTime;

    addLog("info", `照射时长倒计时开始: ${durationTime}秒（基于演习时间）`);
    console.log(
      `[UavPage] 照射时长倒计时开始 - 当前演习时间: ${currentExerciseTime}秒, 目标时长: ${durationTime}秒`
    );
  }
};

const handleStop = () => {
  // 检查激光载荷开关状态
  if (!laserPodEnabled.value) {
    ElMessage.warning("请先打开激光载荷开关");
    return;
  }

  // 清除照射时长倒计时（如果存在）
  if (lasingStartExerciseTime.value !== null) {
    lasingStartExerciseTime.value = null;
    lasingTargetDuration.value = 0;
    lasingDurationCountdown.value = 0;
    addLog("info", "照射时长倒计时已取消（演习时间）");
  }

  // 重置激光照射活跃状态
  isLasingActive.value = false;

  // 发送真实的激光停止照射命令
  sendLaserCommand("Uav_LazerPod_Cease");
};

const handleTurn = async () => {
  if (!isConnected.value) {
    ElMessage.warning("请先连接平台");
    return;
  }

  // 使用转向功能前，先停止激光传感器的周期性锁定
  if (isLaserLockActive.value) {
    stopLaserLockCommand();
  }

  // 直接使用当前输入的参数发送转向命令
  await sendSensorParamCommand();

  // 使用转向功能后，取消被锁定的目标标记
  if (lockedTarget.value) {
    const previousLockedTarget = lockedTarget.value;
    lockedTarget.value = "";
    addLog("info", `转向操作已取消目标锁定：${previousLockedTarget}`);
  }
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

  // 发送光电传感器的锁定命令（只发送一次）
  await sendOptoElectronicLockCommand(targetLabel);

  // 启动激光传感器的周期性锁定命令（每1秒发送一次）
  startLaserLockCommand(targetLabel);

  // 设置锁定目标状态
  lockedTarget.value = selectedTarget.value;

  // 同步目标列表选择
  selectedTargetFromList.value = selectedTarget.value;
  targetStatus.destroyed = false;
};

// 发送光电传感器锁定命令（只发送一次）
const sendOptoElectronicLockCommand = async (targetName: string) => {
  try {
    const optoElectronicSensorName = getOptoElectronicSensorName();

    if (!optoElectronicSensorName) {
      addLog("warning", "未找到光电传感器，跳过光电锁定命令");
      return;
    }

    const commandEnum = PlatformCommandEnum["Uav_Lock_Target"];
    if (commandEnum === undefined) {
      throw new Error(`未知锁定命令: Uav_Lock_Target`);
    }

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

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      addLog("success", `光电传感器锁定命令发送成功`);
    } else {
      addLog("error", `光电传感器锁定命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMsg = `发送光电传感器锁定命令失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 启动激光传感器周期性锁定命令（每1秒发送一次）
const startLaserLockCommand = async (targetName: string) => {
  try {
    const laserSensorName = getLaserSensorName();

    if (!laserSensorName) {
      addLog("warning", "未找到激光传感器，跳过激光锁定命令");
      return;
    }

    // 停止之前的定时器（如果有）
    stopLaserLockCommand();

    // 设置激光锁定状态
    isLaserLockActive.value = true;

    // 立即发送一次激光锁定命令
    await sendSingleLaserLockCommand(targetName, laserSensorName);

    // 启动定时器，每1秒发送一次
    laserLockTimer.value = setInterval(async () => {
      if (isLaserLockActive.value) {
        await sendSingleLaserLockCommand(targetName, laserSensorName);
      }
    }, 1000);

    addLog("info", `激光传感器周期性锁定命令已启动，每1秒发送一次`);
  } catch (error: any) {
    const errorMsg = `启动激光传感器周期性锁定失败: ${error.message}`;
    addLog("error", errorMsg);
    ElMessage.error(errorMsg);
  }
};

// 发送单次激光传感器锁定命令
const sendSingleLaserLockCommand = async (
  targetName: string,
  laserSensorName: string
) => {
  try {
    const commandEnum = PlatformCommandEnum["Uav_Lock_Target"];
    if (commandEnum === undefined) {
      throw new Error(`未知锁定命令: Uav_Lock_Target`);
    }

    const commandData = {
      commandID: Date.now(),
      platformName: connectedPlatformName.value,
      command: commandEnum,
      lockParam: {
        targetName: targetName,
        sensorName: laserSensorName,
      },
    };

    console.log("发送激光传感器锁定命令数据:", commandData);

    const result = await (window as any).electronAPI.multicast.sendPlatformCmd(
      commandData
    );

    if (result.success) {
      console.log(`[激光锁定] 激光传感器锁定命令发送成功`);
    } else {
      addLog("error", `激光传感器锁定命令发送失败: ${result.error}`);
    }
  } catch (error: any) {
    addLog("error", `发送激光传感器锁定命令失败: ${error.message}`);
  }
};

// 停止激光传感器周期性锁定命令
const stopLaserLockCommand = () => {
  if (laserLockTimer.value) {
    clearInterval(laserLockTimer.value);
    laserLockTimer.value = null;
  }
  isLaserLockActive.value = false;
  addLog("info", "激光传感器周期性锁定命令已停止");
};

// 发送锁定目标命令（原有函数，保留用于兼容性）
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

const handleDurationInput = (value: string) => {
  irradiationDuration.value = onlyNumbers(value);
};

const handleCountdownInput = (value: string) => {
  laserCountdown.value = onlyNumbers(value);
};

// 文档相关函数
// 打开文档
const openDocument = async () => {
  try {
    documentLoading.value = true;
    documentError.value = "";

    // 检查是否有已打开的文档
    const hasOpened = await DocumentService.hasOpenedDocuments();

    if (hasOpened) {
      // 如果有最近文档，直接显示
      const recentDoc = await DocumentService.showRecentDocument();
      if (recentDoc) {
        currentDocumentInfo.value = recentDoc;
        const formattedContent = DocumentService.formatDocumentContent(
          recentDoc.content,
          recentDoc.type
        );
        documentContent.value = formattedContent.content;
        isDocumentHtml.value = formattedContent.isHtml;
        documentDialogVisible.value = true;

        const typeName = DocumentService.getDocumentTypeDisplayName(
          recentDoc.type
        );
        const icon = DocumentService.getDocumentIcon(recentDoc.type);

        ElMessage.success({
          message: `${icon} 文档已打开：${recentDoc.fileName} (${typeName}${
            recentDoc.isFromCache ? " - 来自缓存" : ""
          })`,
          duration: 3000,
        });

        documentLoading.value = false;
        return;
      }
    }

    // 没有最近文档，打开选择器
    documentDialogVisible.value = true;
    await selectDocument();
  } catch (error) {
    console.error("打开文档失败:", error);
    documentError.value = "打开文档失败：" + (error as Error).message;
    ElMessage.error(documentError.value);
  } finally {
    documentLoading.value = false;
  }
};

// 选择文档
const selectDocument = async () => {
  try {
    documentLoading.value = true;

    const documentInfo = await DocumentService.selectAndOpenDocument();

    if (documentInfo) {
      currentDocumentInfo.value = documentInfo;
      const formattedContent = DocumentService.formatDocumentContent(
        documentInfo.content,
        documentInfo.type
      );
      documentContent.value = formattedContent.content;
      isDocumentHtml.value = formattedContent.isHtml;

      const typeName = DocumentService.getDocumentTypeDisplayName(
        documentInfo.type
      );
      const icon = DocumentService.getDocumentIcon(documentInfo.type);

      ElMessage.success({
        message: `${icon} 文档加载成功：${documentInfo.fileName} (${typeName})`,
        duration: 3000,
      });

      // 更新文档状态
      hasOpenedDocuments.value = true;
    }
  } catch (error) {
    console.error("选择文档失败:", error);
    documentError.value = "选择文档失败：" + (error as Error).message;
    ElMessage.error(documentError.value);
  } finally {
    documentLoading.value = false;
  }
};

// 强制选择其他文档（忽略缓存）
const selectOtherDocument = async () => {
  try {
    documentLoading.value = true;

    const documentInfo = await DocumentService.forceSelectNewDocument();

    if (documentInfo) {
      currentDocumentInfo.value = documentInfo;
      const formattedContent = DocumentService.formatDocumentContent(
        documentInfo.content,
        documentInfo.type
      );
      documentContent.value = formattedContent.content;
      isDocumentHtml.value = formattedContent.isHtml;

      const typeName = DocumentService.getDocumentTypeDisplayName(
        documentInfo.type
      );
      const icon = DocumentService.getDocumentIcon(documentInfo.type);

      ElMessage.success({
        message: `${icon} 新文档加载成功：${documentInfo.fileName} (${typeName})`,
        duration: 3000,
      });

      // 更新文档状态
      hasOpenedDocuments.value = true;
    }
  } catch (error) {
    console.error("选择其他文档失败:", error);
    documentError.value = "选择其他文档失败：" + (error as Error).message;
    ElMessage.error(documentError.value);
  } finally {
    documentLoading.value = false;
  }
};

// 关闭文档对话框（实际上是隐藏）
const handleCloseDocument = async () => {
  try {
    // 隐藏文档而不是真正关闭
    await DocumentService.hideCurrentDocument();

    documentDialogVisible.value = false;

    if (currentDocumentInfo.value) {
      const icon = DocumentService.getDocumentIcon(
        currentDocumentInfo.value.type
      );
      ElMessage.info({
        message: `${icon} 文档已隐藏，下次打开将直接显示`,
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("隐藏文档失败:", error);
    // 如果隐藏失败，仍然关闭对话框
    documentDialogVisible.value = false;
  }
};
onMounted(async () => {
  // 检查是否有已打开的文档
  try {
    hasOpenedDocuments.value = await DocumentService.hasOpenedDocuments();
    console.log(
      `[UavPage] 文档状态：${
        hasOpenedDocuments.value ? "有已打开的文档" : "无已打开的文档"
      }`
    );
  } catch (error) {
    console.error("[UavPage] 检查文档状态失败:", error);
  }

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

  // 监听航线数据转换相关事件
  // 1. 监听平台数据请求（当收到航线数据时，系统需要知道当前选择的平台）
  (window as any).electronAPI.ipcRenderer.on(
    "route:requestSelectedPlatformData",
    () => {
      console.log(
        "[UavPage] 收到平台数据请求，当前连接平台:",
        connectedPlatformName.value
      );

      // 获取当前连接平台的完整数据
      const platformData = {
        name: connectedPlatformName.value || "",
        speed: connectedPlatform.value?.base?.speed || 10, // 默认速度10m/s
      };

      console.log("[UavPage] 响应平台数据:", platformData);

      // 响应当前选择的平台数据
      (window as any).electronAPI.ipcRenderer.send(
        "route:selectedPlatformDataResponse",
        platformData
      );
    }
  );

  // 2. 监听航线转换成功事件
  (window as any).electronAPI.ipcRenderer.on(
    "route:converted",
    (_, data: any) => {
      addLog(
        "success",
        `航线已转换成功: UAV-${data.uavId}, ${data.waypointCount}个航点`
      );
      ElMessage.success(
        `航线转换成功！UAV-${data.uavId} 包含${data.waypointCount}个航点`
      );
      console.log("[UavPage] 航线转换成功:", data);
    }
  );

  // 3. 监听航线转换失败事件
  (window as any).electronAPI.ipcRenderer.on(
    "route:convertError",
    (_, data: any) => {
      addLog("error", `航线转换失败: ${data.error}`);
      ElMessage.error(`航线转换失败: ${data.error}`);
      console.error("[UavPage] 航线转换失败:", data);
    }
  );

  // 4. 监听UavId不匹配事件
  (window as any).electronAPI.ipcRenderer.on(
    "route:uavIdMismatch",
    (_, data: any) => {
      addLog(
        "warning",
        `航线UavId不匹配: 系统${data.systemUavId}, 航线${data.routeUavId}`
      );
      ElMessage.warning(
        `航线UavId不匹配！系统UavId: ${data.systemUavId}, 航线UavId: ${data.routeUavId}`
      );
      console.warn("[UavPage] 航线UavId不匹配:", data);
    }
  );

  // 5. 监听未选择平台事件
  (window as any).electronAPI.ipcRenderer.on(
    "route:noPlatformSelected",
    (_, data: any) => {
      addLog(
        "warning",
        `收到航线数据但未连接平台，请先连接平台 (UavId: ${data.uavId})`
      );
      ElMessage.warning(
        "收到航线数据，但当前未连接无人机平台，请先选择并连接平台后再发送航线数据"
      );
      console.warn("[UavPage] 收到航线数据但未选择平台:", data);
    }
  );

  // 模拟数据更新
  setInterval(() => {
    // 每秒检查心跳超时
    checkHeartbeatTimeouts();

    // 每秒检查仿真平台连接状态
    checkSimulationConnection();

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

  // 已改为基于演习时间的倒计时，无需清理系统定时器

  // 清理轨迹同步定时器
  if (syncTimer.value) {
    clearInterval(syncTimer.value);
    syncTimer.value = null;
  }

  // 清理仿真平台检测定时器
  if (simulationCheckTimer.value) {
    clearInterval(simulationCheckTimer.value);
    simulationCheckTimer.value = null;
  }

  // 清理激光锁定定时器
  if (laserLockTimer.value) {
    clearInterval(laserLockTimer.value);
    laserLockTimer.value = null;
  }

  // 重置基于演习时间的倒计时状态
  isIrradiating.value = false;
  irradiationStartExerciseTime.value = null;
  irradiationTargetDuration.value = 0;
  irradiationCountdown.value = 0;

  isLasingActive.value = false;
  lasingStartExerciseTime.value = null;
  lasingTargetDuration.value = 0;
  lasingDurationCountdown.value = 0;
});
</script>

<style scoped>
/* ==================== 设计令牌 (Design Tokens) ==================== */
.uav-operation-page {
  /* 主色调 */
  --color-primary: #409eff;
  --color-success: #67c23a;
  --color-warning: #e6a23c;
  --color-danger: #f56c6c;
  --color-info: #909399;

  /* 文本颜色 */
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --text-placeholder: #c0c4cc;

  /* 边框颜色 */
  --border-base: #dcdfe6;
  --border-light: #e4e7ed;
  --border-lighter: #ebeef5;

  /* 背景颜色 */
  --bg-white: #ffffff;
  --bg-base: #f5f7fa;
  --bg-light: #fafafa;

  /* 间距系统 (8px基础) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-base: 6px;
  --radius-md: 8px;

  /* 阴影 */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-base: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* 字体大小 */
  --font-xs: 11px;
  --font-sm: 12px;
  --font-base: 14px;
  --font-md: 14px;
  --font-lg: 16px;
  --font-xl: 18px;

  /* 过渡 */
  --transition-base: all 0.2s ease;

  /* 应用基础样式 */
  background: linear-gradient(135deg, #f5f7fa 0%, #e8edf3 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ==================== 卡片统一样式 ==================== */
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

/* 连接控制卡片（全宽）*/
.connection-card {
  flex: 1;
  width: 100%;
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--border-base);
  transition: var(--transition-base);
}

.connection-card:hover {
  box-shadow: var(--shadow-lg);
}

/* 演练方案区域（在连接栏内） */
.exercise-section {
  display: flex;
  align-items: center;
}

/* 演练方案按钮 */
.exercise-btn {
  height: 40px;
  padding: 0 var(--spacing-xl);
  font-size: var(--font-base);
  font-weight: 600;
  border-radius: var(--radius-base);
  white-space: nowrap;
  transition: var(--transition-base);
}

/* 功能区域分隔符 */
.function-separator {
  width: 1px;
  height: 32px;
  background: var(--border-light);
  margin: 0 var(--spacing-md);
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: var(--spacing-lg);
}

/* 左侧标题区域 */
.title-section {
  flex: 0 0 auto;
  padding-right: var(--spacing-lg);
  border-right: 2px solid var(--border-light);
}

/* 标题与返回按钮容器 */
.title-with-back {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* 返回按钮样式 */
.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-sm);
  padding: 6px var(--spacing-md);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-base);
  background: var(--bg-white);
  color: var(--text-primary);
  transition: var(--transition-base);
  cursor: pointer;
}

.back-button:hover {
  background: var(--bg-base);
  border-color: var(--color-primary);
  transform: translateX(-2px);
  box-shadow: var(--shadow-sm);
}

/* 席位标题 */
.seat-title {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

/* 中间时间区域 */
.time-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.exercise-time,
.astronomical-time {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.astronomical-time {
  font-size: var(--font-base);
  color: var(--text-regular);
}

/* 右侧控制区域 */
.controls-section {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* 控制按钮样式 */
.control-btn {
  height: 40px;
  border: 1px solid var(--border-base);
  background: var(--bg-white);
  border-radius: var(--radius-base);
  padding: 0 var(--spacing-xl);
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
}

.control-btn:hover {
  background: var(--bg-base);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
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

/* ==================== 布局结构 ==================== */
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
  gap: var(--spacing-md);
}

/* ==================== 任务目标提醒栏 ==================== */
.mission-target-banner {
  background: var(--bg-base);
  border: 1px solid var(--border-light);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  position: relative;
  transition: var(--transition-base);
}

.mission-target-banner:hover {
  box-shadow: var(--shadow-sm);
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.banner-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.target-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  position: relative;
}

.target-header {
  display: flex;
  align-items: center;
}

.banner-title {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-regular);
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

/* ==================== 报文面板样式 ==================== */
.report-panel {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--border-base);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 600px;
  transition: var(--transition-base);
}

.report-panel:hover {
  box-shadow: var(--shadow-lg);
}

.report-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
}

.cooperation-controls {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.cooperation-target-select {
  flex: 1;
  min-width: 150px;
}

.report-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.report-send-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
}

.report-send-btn:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.report-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  gap: var(--spacing-md);
}

/* 协同目标选项 */
.cooperation-target-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: var(--spacing-sm);
}

.cooperation-target-name {
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.cooperation-target-type {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  background: var(--bg-base);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.cooperation-target-status {
  font-size: var(--font-xs);
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
  gap: var(--spacing-xs);
  color: var(--color-warning);
  font-size: var(--font-xs);
  font-weight: 500;
}

.inactive-icon {
  font-size: var(--font-sm);
  color: var(--color-warning);
}

.inactive-text {
  font-size: var(--font-xs);
  font-weight: 500;
}

/* 发报文区域和收报文区域样式 */
.sent-messages-section,
.received-messages-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
  min-height: 150px;
  max-height: 290px; /* 限制最大高度，两个区域共600px遵循项目规范 */
  overflow: hidden; /* 确保内容不会溢出 */
}

/* 区域标题样式 */
.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 6px 6px 0 0;
}

.section-icon {
  font-size: 14px;
  color: #409eff;
}

.sent-messages-section .section-icon {
  color: #409eff;
}

.received-messages-section .section-icon {
  color: #67c23a;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

/* 消息容器样式 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  padding-right: 4px; /* 为滚动条留出空间 */
  padding-bottom: 8px; /* 底部留出8px空间 */
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0; /* 允许flex子项正常收缩 */
}

/* 自定义滚动条样式 - 遵循项目规范 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.2s;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 精简后的报文消息样式 */
.message-item {
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
  min-height: 60px; /* 确保消息条目有最小高度，防止被挤压 */
  flex-shrink: 0; /* 防止flex布局下被压缩 */
}

.message-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 发送消息样式 */
.message-sent {
  border-left: 3px solid #409eff;
  background: linear-gradient(135deg, #f0f7ff, #ffffff);
  border-color: #d1e7fd;
}

.message-sent:hover {
  background: linear-gradient(135deg, #e3f2fd, #f0f7ff);
  border-color: #90caf9;
}

/* 接收消息样式 */
.message-received {
  border-left: 3px solid #67c23a;
  background: linear-gradient(135deg, #f6ffed, #ffffff);
  border-color: #d9f7be;
}

.message-received:hover {
  background: linear-gradient(135deg, #f0f9e8, #f6ffed);
  border-color: #b7eb8f;
}

/* 精简的消息内容 */
.message-content {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  min-height: 56px; /* 确保内容区域有最小高度 */
}

.message-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11px;
}

.target-platform,
.source-platform {
  font-weight: 600;
  color: #303133;
}

.exercise-time {
  font-weight: 600;
  color: #e6a23c;
  font-family: "Courier New", monospace;
  font-size: 10px;
}

.message-text {
  font-size: 12px;
  color: #303133;
  line-height: 1.3;
  margin-bottom: 4px;
}

.message-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.message-tags .el-tag {
  font-size: 10px;
  padding: 1px 4px;
  height: 18px;
  line-height: 16px;
}

/* 空消息样式 */
.empty-message {
  text-align: center;
  color: #c0c4cc;
  font-style: italic;
  padding: 16px;
  font-size: 12px;
  border: 1px dashed #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
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

/* 设置速度按钮 */
.set-speed-btn {
  flex: 1;
  height: 45px;
  border: 2px solid #28a745;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.set-speed-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
}

.set-speed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 同步轨迹按钮样式已移除，现在通过连接/断开自动控制 */

/* ==================== 任务控制区域 ==================== */
.task-control {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--border-base);
  flex: 1;
  transition: var(--transition-base);
}

.task-control:hover {
  box-shadow: var(--shadow-lg);
}

.task-header {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-lighter);
}

/* 控制组 */
.control-group {
  padding-bottom: var(--spacing-sm);
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.control-label {
  font-size: var(--font-base);
  color: var(--text-regular);
  font-weight: 500;
}

.control-switch {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.switch-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.button-row {
  display: flex;
  gap: var(--spacing-sm);
}

.input-group {
  margin-bottom: var(--spacing-sm);
}

.input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.laser-input {
  flex: 1;
}

.confirm-btn {
  width: 60px;
  height: 32px;
  font-size: var(--font-sm);
  padding: 0;
  transition: var(--transition-base);
}

.control-separator {
  height: 1px;
  background-color: var(--border-light);
  margin: var(--spacing-md) 0;
  border-radius: 1px;
}

.button-separator {
  height: 1px;
  background-color: var(--border-light);
  margin: var(--spacing-md) 0;
  border-radius: 1px;
}

.action-btn {
  flex: 1;
  height: 36px;
  border: 1px solid var(--border-base);
  background: var(--bg-white);
  border-radius: var(--radius-base);
  font-size: var(--font-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
}

.action-btn:hover {
  background: var(--bg-base);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 全宽大按钮 */
.full-width-btn {
  width: 100%;
  height: 40px;
  font-size: var(--font-base);
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

/* ==================== 状态卡片 ==================== */
.status-card {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--border-base);
  min-height: 120px;
  transition: var(--transition-base);
}

.status-card:hover {
  box-shadow: var(--shadow-lg);
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
  margin-bottom: var(--spacing-sm);
}

.status-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
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

/* ==================== Element Plus 组件样式覆盖 ==================== */
:deep(.el-switch) {
  --el-switch-on-color: var(--color-primary);
  --el-switch-off-color: var(--border-base);
}

:deep(.el-button) {
  border: 1px solid var(--border-base);
  background: var(--bg-white);
  color: var(--text-primary);
  transition: var(--transition-base);
}

:deep(.el-button:hover) {
  background: var(--bg-base);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

:deep(.el-select) {
  --el-select-border-color-hover: var(--color-primary);
  --el-select-input-color: var(--text-primary);
  --el-select-input-font-size: var(--font-base);
}

:deep(.el-select .el-input__wrapper) {
  border: 1px solid var(--border-base);
  border-radius: var(--radius-base);
  background: var(--bg-white);
  transition: var(--transition-base);
}

:deep(.el-select .el-input__wrapper:hover) {
  background: var(--bg-base);
  border-color: var(--color-primary);
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

:deep(.el-select.is-disabled .el-input__wrapper) {
  background-color: var(--bg-base);
  border-color: var(--border-light);
  color: var(--text-placeholder);
  cursor: not-allowed;
}

:deep(.el-button.is-disabled) {
  background-color: var(--bg-base);
  border-color: var(--border-light);
  color: var(--text-placeholder);
  cursor: not-allowed;
}

/* ==================== 文档对话框样式 ==================== */
.document-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.document-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-base);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-sm);
}

.info-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.file-path {
  color: var(--text-secondary);
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: var(--font-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.info-right {
  flex-shrink: 0;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  color: var(--text-secondary);
  font-size: var(--font-base);
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--border-base);
}

.empty-text {
  font-size: var(--font-lg);
  color: var(--text-secondary);
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: 40px;
  color: var(--color-danger);
  font-size: var(--font-base);
  text-align: center;
}

.document-text {
  padding: var(--spacing-lg);
  background: var(--bg-base);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
}

.document-text .html-content {
  font-family: inherit;
  line-height: inherit;
  margin: 0;
}

.document-text .text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: var(--font-base);
  line-height: 1.6;
  margin: 0;
  color: var(--text-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
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
  gap: 8px;
}

.target-name-section {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.target-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
  flex: 1;
}

/* 锁定目标前缀样式 */
.locked-prefix {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #409eff;
  border-radius: 50%;
  flex-shrink: 0;
}

.locked-prefix-icon {
  font-size: 10px;
  color: #ffffff;
}

.target-status-indicator {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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

/* 仿真平台断线提示对话框样式 */
.simulation-disconnect-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px 0;
}

.warning-icon {
  flex-shrink: 0;
}

.warning-message {
  flex: 1;
}

.warning-message h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #e6a23c;
}

.warning-message p {
  margin: 12px 0;
  line-height: 1.6;
  color: #666;
}

.warning-message ul {
  margin: 12px 0;
  padding-left: 20px;
  color: #666;
}

.warning-message li {
  margin: 8px 0;
  line-height: 1.5;
}

.continue-hint {
  font-weight: 500;
  color: #409eff;
  background: #f0f9ff;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}
</style>
