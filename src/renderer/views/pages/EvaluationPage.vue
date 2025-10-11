<template>
  <div class="evaluation-page">
    <!-- 融合后的页面标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-with-back">
          <el-button
            class="back-button"
            size="small"
            @click="handleBackToStart"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回席位选择
          </el-button>
          <h2 class="page-title">作战测评席位</h2>
        </div>
      </div>
      <div class="header-center">
        <div class="overview-stats">
          <div class="stat-item">
            <span class="stat-label">参演分组：</span>
            <span class="stat-value">{{ allGroups.length }}个</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">演习时间：</span>
            <span class="stat-value">{{ exerciseTime }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">天文时间：</span>
            <span class="stat-value">{{ astronomicalTime }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总平台数：</span>
            <span class="stat-value">{{ platforms.length }}个</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <!-- 数据来源指示器和新演习按钮 -->
        <div class="header-controls">
          <div class="data-source-indicator">
            <div v-if="hasRealData" class="source-badge real-data">
              <div class="indicator-dot"></div>
              <span>实时数据</span>
            </div>
            <div
              v-else-if="allGroups.length === 0"
              class="source-badge no-data"
            >
              <div class="indicator-dot"></div>
              <span>无数据</span>
            </div>
            <div v-else class="source-badge cached-data">
              <div class="indicator-dot"></div>
              <span>缓存数据</span>
            </div>
          </div>
          <el-button
            type="danger"
            size="small"
            @click="startNewExercise"
            :disabled="allGroups.length === 0"
          >
            新演习
          </el-button>
        </div>
      </div>
    </div>

    <!-- 所有分组平铺展示区域 -->
    <div class="all-groups-container">
      <!-- 无数据时的提示 -->
      <div v-if="allGroups.length === 0" class="no-groups-hint">
        <div class="hint-content">
          <el-icon class="hint-icon"><InfoFilled /></el-icon>
          <span class="hint-text">暂无分组数据，请等待演习开始</span>
        </div>
      </div>

      <!-- 所有分组行列式布局 -->
      <div v-else class="groups-table">
        <div v-for="group in allGroups" :key="group.name" class="group-row">
          <!-- 第一列：基本情况（成员和目标） -->
          <div class="group-basic-info">
            <h3 class="group-title">{{ group.name }}</h3>

            <!-- 成员信息 -->
            <div class="members-section">
              <h4 class="section-subtitle">红方成员</h4>
              <div class="member-list">
                <div
                  v-for="member in group.redMembers"
                  :key="member.name"
                  class="member-item"
                >
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-type">{{
                    getDisplayType(member.type)
                  }}</span>
                  <span class="member-status" :class="member.statusClass">
                    {{ member.statusText }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 目标信息 -->
            <div class="target-section">
              <h4 class="section-subtitle">任务目标</h4>
              <div v-if="group.currentTarget" class="target-info">
                <div class="target-name">{{ group.currentTarget.name }}</div>
                <div class="target-type">
                  {{ getDisplayType(group.currentTarget.type) }}
                </div>
                <div class="target-status-indicator">
                  <div
                    v-if="group.currentTarget.status === 'destroyed'"
                    class="target-status destroyed"
                  >
                    <el-icon class="status-icon"><CircleClose /></el-icon>
                    <span class="status-text">已摧毁</span>
                  </div>
                  <div
                    v-else-if="group.currentTarget.status === 'active'"
                    class="target-status active"
                  >
                    <el-icon class="status-icon"><SuccessFilled /></el-icon>
                    <span class="status-text">已被发现</span>
                  </div>
                  <div v-else class="target-status inactive">
                    <el-icon class="status-icon"><WarningFilled /></el-icon>
                    <span class="status-text">未被发现</span>
                  </div>
                </div>
                <div
                  v-if="group.currentTarget.coordinates"
                  class="target-coordinates"
                >
                  {{ group.currentTarget.coordinates.longitude.toFixed(6) }}°,
                  {{ group.currentTarget.coordinates.latitude.toFixed(6) }}°,
                  {{ group.currentTarget.coordinates.altitude }}m
                </div>
              </div>
              <div v-else class="no-target">暂无任务目标</div>
            </div>
          </div>

          <!-- 第二列：关键事件 -->
          <div class="group-events">
            <h4 class="section-subtitle">
              关键事件 ({{ group.events.length }})
            </h4>

            <!-- 关键数据统计区域 -->
            <div class="key-metrics-section">
              <!-- <div class="metrics-title">核心数据</div> -->
              <div class="metrics-grid">
                <!-- 照射时间统计 -->
                <div class="metric-group">
                  <div class="metric-group-title">照射时间统计</div>
                  <div class="metric-items">
                    <div class="metric-item">
                      <span class="metric-label">开始照射：</span>
                      <span class="metric-value">
                        {{ group.keyMetrics.laserIrradiationStart || "未记录" }}
                      </span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">停止照射：</span>
                      <span class="metric-value">
                        {{ group.keyMetrics.laserIrradiationEnd || "未记录" }}
                      </span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">照射时长：</span>
                      <span
                        class="metric-value"
                        :class="{
                          'metric-excellent':
                            (group.keyMetrics.totalIrradiationDuration || 0) >
                            30,
                          'metric-good':
                            (group.keyMetrics.totalIrradiationDuration || 0) >
                              15 &&
                            (group.keyMetrics.totalIrradiationDuration || 0) <=
                              30,
                          'metric-poor':
                            (group.keyMetrics.totalIrradiationDuration || 0) <=
                              15 &&
                            (group.keyMetrics.totalIrradiationDuration || 0) >
                              0,
                        }"
                      >
                        {{
                          formatDuration(
                            group.keyMetrics.totalIrradiationDuration
                          )
                        }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 摧毁效果统计 -->
                <div class="metric-group">
                  <div class="metric-group-title">摧毁效果统计</div>
                  <div class="metric-items">
                    <div class="metric-item">
                      <span class="metric-label">目标摧毁：</span>
                      <span class="metric-value">
                        {{ group.keyMetrics.targetDestroyedTime || "未摧毁" }}
                      </span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">照射期间摧毁：</span>
                      <span
                        class="metric-value"
                        :class="{
                          'metric-excellent':
                            group.keyMetrics.isDestroyedDuringIrradiation,
                          'metric-poor':
                            !group.keyMetrics.isDestroyedDuringIrradiation,
                        }"
                      >
                        {{
                          group.keyMetrics.isDestroyedDuringIrradiation
                            ? "是"
                            : "否"
                        }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 距离统计 -->
                <div class="metric-group">
                  <div class="metric-group-title">距离统计</div>
                  <div class="metric-items">
                    <div class="metric-item">
                      <span class="metric-label">开始照射距离：</span>
                      <span
                        class="metric-value"
                        :class="{
                          'metric-excellent':
                            (group.keyMetrics.distanceAtIrradiationStart || 0) <
                            1000,
                          'metric-good':
                            (group.keyMetrics.distanceAtIrradiationStart ||
                              0) >= 1000 &&
                            (group.keyMetrics.distanceAtIrradiationStart || 0) <
                              2000,
                          'metric-poor':
                            (group.keyMetrics.distanceAtIrradiationStart ||
                              0) >= 2000,
                        }"
                      >
                        {{
                          formatDistance(
                            group.keyMetrics.distanceAtIrradiationStart
                          )
                        }}
                      </span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">摧毁时距离：</span>
                      <span
                        class="metric-value"
                        :class="{
                          'metric-excellent':
                            (group.keyMetrics.distanceAtDestruction || 0) <
                            1000,
                          'metric-good':
                            (group.keyMetrics.distanceAtDestruction || 0) >=
                              1000 &&
                            (group.keyMetrics.distanceAtDestruction || 0) <
                              2000,
                          'metric-poor':
                            (group.keyMetrics.distanceAtDestruction || 0) >=
                            2000,
                        }"
                      >
                        {{
                          formatDistance(group.keyMetrics.distanceAtDestruction)
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="events-list">
              <div
                v-for="event in group.events.slice(0, 8)"
                :key="event.id"
                class="event-item"
                :class="event.typeClass"
              >
                <div class="event-time">{{ event.exerciseTime }}</div>
                <div class="event-type">{{ event.typeDisplay }}</div>
                <div class="event-description">{{ event.description }}</div>
                <div class="event-platforms">
                  {{ event.sourcePlatform }} → {{ event.targetPlatform }}
                </div>
              </div>
              <div v-if="group.events.length === 0" class="no-events">
                暂无关键事件
              </div>
              <div v-if="group.events.length > 8" class="more-events">
                还有 {{ group.events.length - 8 }} 个事件...
              </div>
            </div>
          </div>

          <!-- 第三列：专家评价 -->
          <div class="group-evaluation">
            <h4 class="section-subtitle">专家评价</h4>

            <div class="evaluation-panel">
              <div class="scores-grid">
                <div class="score-item">
                  <span class="score-label">协同效率</span>
                  <el-rate
                    v-model="group.scores.coordination"
                    :max="5"
                    allow-half
                    size="small"
                    :disabled="group.isSaved"
                  />
                  <span class="score-value">{{
                    group.scores.coordination || 0
                  }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">目标识别</span>
                  <el-rate
                    v-model="group.scores.targetIdentification"
                    :max="5"
                    allow-half
                    size="small"
                    :disabled="group.isSaved"
                  />
                  <span class="score-value">{{
                    group.scores.targetIdentification || 0
                  }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">指令执行</span>
                  <el-rate
                    v-model="group.scores.commandExecution"
                    :max="5"
                    allow-half
                    size="small"
                    :disabled="group.isSaved"
                  />
                  <span class="score-value">{{
                    group.scores.commandExecution || 0
                  }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">整体表现</span>
                  <el-rate
                    v-model="group.scores.overall"
                    :max="5"
                    allow-half
                    size="small"
                    :disabled="group.isSaved"
                  />
                  <span class="score-value">{{
                    group.scores.overall || 0
                  }}</span>
                </div>
              </div>

              <div class="evaluation-comments">
                <el-input
                  v-model="group.comments"
                  type="textarea"
                  :rows="6"
                  placeholder="评价备注..."
                  maxlength="200"
                  show-word-limit
                  :disabled="group.isSaved"
                />
              </div>

              <div class="evaluation-actions">
                <!-- 保存状态指示 -->
                <div v-if="group.isSaved" class="saved-indicator">
                  <el-icon class="saved-icon"><SuccessFilled /></el-icon>
                  <span class="saved-text">已保存</span>
                  <span v-if="group.savedAt" class="saved-time">
                    {{
                      new Date(group.savedAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                  </span>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="saveGroupEvaluation(group.name)"
                    :disabled="!hasValidScores(group.scores) || group.isSaved"
                  >
                    {{ group.isSaved ? "已保存" : "保存评价" }}
                  </el-button>
                  <el-button size="small" @click="resetGroupScores(group.name)">
                    重置
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局评价汇总 -->
    <div class="global-summary">
      <h3 class="section-title">演习总体评价</h3>
      <div class="summary-content">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">参与小组：</span>
            <span class="stat-value">{{ allGroups.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已保存评价：</span>
            <span class="stat-value" :class="{ 'all-saved': allGroupsSaved }"
              >{{ savedGroupsCount }}/{{ allGroups.length }}</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label">总体事件数：</span>
            <span class="stat-value">{{ totalEvents }}</span>
          </div>
        </div>

        <!-- 评价维度平均分统计 -->
        <div class="average-scores-section">
          <h4 class="scores-title">各维度平均评分</h4>
          <div class="scores-stats">
            <div class="score-stat-item">
              <span class="score-stat-label">协同效率：</span>
              <div class="score-stat-value">
                <span
                  class="score-number"
                  :class="
                    getScoreColorClass(calculateAverageScore('coordination'))
                  "
                  >{{ calculateAverageScore("coordination") }}</span
                >
                <span class="score-unit">/5.0</span>
              </div>
            </div>
            <div class="score-stat-item">
              <span class="score-stat-label">目标识别：</span>
              <div class="score-stat-value">
                <span
                  class="score-number"
                  :class="
                    getScoreColorClass(
                      calculateAverageScore('targetIdentification')
                    )
                  "
                  >{{ calculateAverageScore("targetIdentification") }}</span
                >
                <span class="score-unit">/5.0</span>
              </div>
            </div>
            <div class="score-stat-item">
              <span class="score-stat-label">指令执行：</span>
              <div class="score-stat-value">
                <span
                  class="score-number"
                  :class="
                    getScoreColorClass(
                      calculateAverageScore('commandExecution')
                    )
                  "
                  >{{ calculateAverageScore("commandExecution") }}</span
                >
                <span class="score-unit">/5.0</span>
              </div>
            </div>
            <div class="score-stat-item">
              <span class="score-stat-label">整体表现：</span>
              <div class="score-stat-value">
                <span
                  class="score-number"
                  :class="getScoreColorClass(calculateAverageScore('overall'))"
                  >{{ calculateAverageScore("overall") }}</span
                >
                <span class="score-unit">/5.0</span>
              </div>
            </div>
          </div>
        </div>

        <div class="summary-actions">
          <el-button
            type="success"
            @click="exportEvaluationReport"
            :disabled="!allGroupsSaved"
            :class="{ 'export-ready': allGroupsSaved }"
          >
            {{
              allGroupsSaved
                ? "导出Excel报告"
                : `待保存完成(${savedGroupsCount}/${allGroups.length})`
            }}
          </el-button>
          <el-button @click="clearAllEvaluations">清空评价</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowRight,
  InfoFilled,
  CircleClose,
  SuccessFilled,
  WarningFilled,
  ArrowLeft,
} from "@element-plus/icons-vue";

// 定义emit事件
const emit = defineEmits<{
  backToStart: [];
}>();

// 返回席位选择
const handleBackToStart = () => {
  console.log("[EvaluationPage] 返回席位选择");
  emit("backToStart");
};

// 类型定义
interface GroupMember {
  name: string;
  type: string;
  side: string;
  statusText: string;
  statusClass: string;
  status?: string; // 添加 status 字段
  coordinates?: {
    longitude: number;
    latitude: number;
    altitude: number;
  };
}

// 关键数据统计接口
interface KeyMetrics {
  laserIrradiationStart?: string; // 照射开始时间
  laserIrradiationEnd?: string; // 照射停止时间
  targetDestroyedTime?: string; // 目标摧毁时间
  isDestroyedDuringIrradiation: boolean; // 目标是否在照射期间摧毁
  distanceAtIrradiationStart?: number; // 开始照射时距离目标距离(米)
  distanceAtDestruction?: number; // 摧毁时距离目标距离(米)
  totalIrradiationDuration?: number; // 总照射时长(秒)
  laserHitRate?: number; // 激光命中率(%)
  targetStatus?: string; // 目标状态追踪
}

interface GroupEvent {
  id: string;
  timestamp: number;
  exerciseTime: string;
  type: "command" | "cooperation";
  typeDisplay: string;
  typeClass: string;
  description: string;
  sourcePlatform: string;
  targetPlatform: string;
  details?: {
    targetName?: string;
    weaponName?: string;
    artilleryName?: string;
    commandId?: number;
    sensorName?: string; // 添加传感器名称字段
  };
}

interface GroupScores {
  coordination: number;
  targetIdentification: number;
  commandExecution: number;
  overall: number;
}

interface GroupData {
  name: string;
  redMembers: GroupMember[];
  blueTargets: GroupMember[];
  currentTarget: GroupMember | null;
  events: GroupEvent[];
  scores: GroupScores;
  comments: string;
  isSaved: boolean; // 新增：标记是否已保存
  savedAt?: string; // 新增：保存时间戳
  keyMetrics: KeyMetrics; // 新增：关键数据统计
}

// 响应式数据
const platforms = ref<any[]>([]);
const allGroups = ref<GroupData[]>([]); // 存储所有分组用于平铺展示
const hasRealData = ref(false); // 数据来源标识
const exerciseTime = ref("T + 0秒");
const astronomicalTime = ref(
  new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
);

// 计算属性
const totalEvents = computed(() => {
  return allGroups.value.reduce(
    (total, group) => total + group.events.length,
    0
  );
});

// 新增：检查是否所有组别都已保存且有有效评分
const allGroupsSaved = computed(() => {
  if (allGroups.value.length === 0) return false;
  return allGroups.value.every(
    (group) => group.isSaved && hasValidScores(group.scores)
  );
});

// 新增：统计已保存且有效的组别数量
const savedGroupsCount = computed(() => {
  return allGroups.value.filter(
    (group) => group.isSaved && hasValidScores(group.scores)
  ).length;
});

// 格式化持续时间
function formatDuration(duration?: number): string {
  if (!duration || duration <= 0) return "无数据";

  if (duration < 60) {
    return `${duration.toFixed(1)}秒`;
  } else {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}分${seconds.toFixed(1)}秒`;
  }
}

// 格式化距离
function formatDistance(distance?: number): string {
  if (!distance || distance <= 0) return "无数据";

  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  } else {
    return `${distance.toFixed(0)}m`;
  }
}

// Haversine距离计算公式（计算两个经纬度坐标之间的距离）
const calculateDistance = (
  coord1: { longitude: number; latitude: number },
  coord2: { longitude: number; latitude: number }
): number => {
  const R = 6371000; // 地球半径，单位：米

  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 距离，单位：米
};

// 获取平台类型显示名称
const getDisplayType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    UAV01: "无人机",
    Artillery: "火炮",
    ROCKET_LAUNCHER: "火箭炮",
    CANNON: "加农炮",
    TANK: "坦克",
    RADAR: "雷达",
    COMMAND: "指挥所",
  };
  return typeMap[type] || type;
};

// 获取平台状态
const getPlatformStatus = (
  platform: any
): { statusText: string; statusClass: string } => {
  if (platform.base?.broken) {
    return { statusText: "已摧毁", statusClass: "status-destroyed" };
  }
  return { statusText: "正常", statusClass: "status-active" };
};

// 检测任务目标状态的专用函数（参考无人机页面的处理方式）
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

// 更新所有分组数据（平铺展示）- 支持数据持久化
const updateAllGroupsData = () => {
  if (!platforms.value || platforms.value.length === 0) {
    console.log("[EvaluationPage] 无平台数据，保持现有分组数据");
    // 不清空现有数据，保持组别信息持久化
    return;
  }

  console.log(
    "[EvaluationPage] 更新所有分组数据，平台总数:",
    platforms.value.length
  );

  // 按分组分类所有平台，只处理有明确group字段的平台
  const groupsMap = new Map<string, any[]>();

  platforms.value.forEach((platform) => {
    // 只处理有group字段的平台，忽略未分组的平台
    const groupName = platform.base?.group;
    if (groupName) {
      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, []);
      }
      groupsMap.get(groupName)!.push(platform);
    } else {
      console.log(
        `[EvaluationPage] 跳过未分组平台: ${platform.base?.name || "未知平台"}`
      );
    }
  });

  console.log(
    `[EvaluationPage] 找到 ${groupsMap.size} 个有效分组:`,
    Array.from(groupsMap.keys())
  );

  // 转换为分组数据结构
  allGroups.value = Array.from(groupsMap.entries()).map(
    ([groupName, groupPlatforms]) => {
      // 查找现有的小组数据或创建新的
      let existingGroup = allGroups.value.find((g) => g.name === groupName);
      if (!existingGroup) {
        existingGroup = {
          name: groupName,
          redMembers: [],
          blueTargets: [],
          currentTarget: null,
          events: [],
          scores: {
            coordination: 0,
            targetIdentification: 0,
            commandExecution: 0,
            overall: 0,
          },
          comments: "",
          isSaved: false, // 新增：初始状态为未保存
          keyMetrics: {
            // 新增：初始化关键数据
            isDestroyedDuringIrradiation: false,
          },
        };
      }

      // 分离红方和蓝方
      const redMembers: GroupMember[] = [];
      const blueTargets: GroupMember[] = [];
      let currentTarget: GroupMember | null = null;

      groupPlatforms.forEach((platform) => {
        const status = getPlatformStatus(platform);
        const member: GroupMember = {
          name: platform.base?.name || "未命名平台",
          type: platform.base?.type || "未知类型",
          side: platform.base?.side || "unknown",
          statusText: status.statusText,
          statusClass: status.statusClass,
        };

        if (platform.base?.location) {
          member.coordinates = {
            longitude: parseFloat(platform.base.location.longitude.toFixed(6)),
            latitude: parseFloat(platform.base.location.latitude.toFixed(6)),
            altitude: platform.base.location.altitude || 0,
          };
        }

        if (platform.base?.side === "red") {
          redMembers.push(member);
        } else if (platform.base?.side === "blue") {
          blueTargets.push(member);
          // 蓝方作为当前任务目标，检测目标状态
          if (!currentTarget) {
            // 使用专用函数检测目标状态
            const targetStatus = checkMissionTargetStatus(platform.base.name);
            currentTarget = {
              ...member,
              status: targetStatus,
              statusText: getTargetStatusText(targetStatus),
              statusClass: getTargetStatusClass(targetStatus),
            };
          }
        }
      });

      console.log(
        `[EvaluationPage] ${groupName}: 红方${redMembers.length}个，蓝方${blueTargets.length}个`
      );

      // 如果当前目标存在但在当前平台数据中找不到，需要检查其摧毁状态
      if (existingGroup.currentTarget && !currentTarget) {
        const targetName = existingGroup.currentTarget.name;
        // 检查目标是否在所有平台中都找不到
        const targetStillExists = platforms.value.some(
          (platform: any) => platform.base?.name === targetName
        );

        if (!targetStillExists) {
          // 目标不存在于任何平台中，判定为已摧毁，保持显示但更新状态
          console.log(`[EvaluationPage] 任务目标 ${targetName} 已被摧毁`);
          currentTarget = {
            ...existingGroup.currentTarget,
            status: "destroyed",
            statusText: "已摧毁",
            statusClass: "status-destroyed",
          };
        } else {
          // 目标仍然存在但不在同组中，可能被重新分组或失联
          currentTarget = {
            ...existingGroup.currentTarget,
            status: "inactive",
            statusText: "未被发现",
            statusClass: "status-inactive",
          };
        }
      }

      return {
        ...existingGroup,
        redMembers,
        blueTargets,
        currentTarget,
      };
    }
  );

  // 在所有分组更新完成后，检测目标摧毁事件
  allGroups.value.forEach((group) => {
    if (group.currentTarget) {
      updateTargetDestructionMetrics(group, group.currentTarget);
    }
  });

  console.log(
    "[EvaluationPage] 所有分组数据更新完成，总分组数:",
    allGroups.value.length
  );
};

// 获取目标状态文本
const getTargetStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    active: "已被发现",
    inactive: "未被发现",
    destroyed: "已摧毁",
  };
  return statusMap[status] || "未知";
};

// 获取目标状态样式类
const getTargetStatusClass = (status: string): string => {
  const classMap: { [key: string]: string } = {
    active: "status-active",
    inactive: "status-inactive",
    destroyed: "status-destroyed",
  };
  return classMap[status] || "status-inactive";
};

// 更新关键数据指标
const updateKeyMetrics = (
  groupName: string,
  command: number | string,
  parsedData: any,
  exerciseTime: string
) => {
  const group = allGroups.value.find((g) => g.name === groupName);
  if (!group) return;

  const platformName = parsedData.platformName;
  const commandType =
    typeof command === "number" ? command : getCommandNumberFromString(command);

  console.log(
    `[EvaluationPage] 更新关键数据指标: ${groupName}, 命令: ${commandType}, 平台: ${platformName}`
  );

  try {
    // 处理激光照射开始命令 (Uav_LazerPod_Lasing = 4)
    if (commandType === 4) {
      group.keyMetrics.laserIrradiationStart = exerciseTime;

      // 计算开始照射时与目标的距离
      const sourcePlatform = platforms.value.find(
        (p) => p.base?.name === platformName
      );

      let targetCoordinates = null;
      let targetName = "未知目标";

      // 优先使用当前目标坐标
      if (group.currentTarget?.coordinates) {
        targetCoordinates = group.currentTarget.coordinates;
        targetName = group.currentTarget.name;
      } else {
        // 如果没有当前目标，尝试从同组的蓝方目标中找到第一个目标
        const blueTarget = platforms.value.find(
          (p) => p.base?.group === group.name && p.base?.side === "blue"
        );
        if (blueTarget?.base?.location) {
          targetCoordinates = blueTarget.base.location;
          targetName = blueTarget.base.name || "蓝方目标";
        }
      }

      if (sourcePlatform?.base?.location && targetCoordinates) {
        const distance = calculateDistance(
          sourcePlatform.base.location,
          targetCoordinates
        );
        group.keyMetrics.distanceAtIrradiationStart = distance;
        console.log(
          `[EvaluationPage] 计算开始照射距离: ${distance.toFixed(
            0
          )}m，发射平台: ${platformName}，目标: ${targetName}`
        );
      } else {
        if (!sourcePlatform?.base?.location) {
          console.warn(
            `[EvaluationPage] 无法找到发射平台 ${platformName} 的位置信息`
          );
        }
        if (!targetCoordinates) {
          console.warn(
            `[EvaluationPage] 无法获取目标坐标信息，组: ${groupName}`
          );
        }
      }

      console.log(`[EvaluationPage] 记录激光照射开始时间: ${exerciseTime}`);
    }

    // 处理激光照射停止命令 (Uav_LazerPod_Cease = 5)
    else if (commandType === 5) {
      group.keyMetrics.laserIrradiationEnd = exerciseTime;

      // 计算总照射时长
      if (group.keyMetrics.laserIrradiationStart) {
        const startTime = parseExerciseTime(
          group.keyMetrics.laserIrradiationStart
        );
        const endTime = parseExerciseTime(exerciseTime);
        group.keyMetrics.totalIrradiationDuration = endTime - startTime;
        console.log(
          `[EvaluationPage] 计算总照射时长: ${group.keyMetrics.totalIrradiationDuration}秒`
        );
      }

      console.log(`[EvaluationPage] 记录激光照射停止时间: ${exerciseTime}`);
    }

    // 处理锁定目标命令 (Uav_Lock_Target = 10)
    else if (commandType === 10 && parsedData.lockParam) {
      const targetName = parsedData.lockParam.targetName;
      if (targetName && group.currentTarget?.name === targetName) {
        // 更新目标锁定状态，这有助于确认照射效果
        console.log(`[EvaluationPage] 目标 ${targetName} 被锁定`);
      }
    }
  } catch (error) {
    console.error("[EvaluationPage] 更新关键数据指标失败:", error);
  }
};

// 解析演习时间为秒数
const parseExerciseTime = (timeStr: string): number => {
  // 格式: "T + 123秒" 或 "T + 2分30秒"
  const match =
    timeStr.match(/T \+ (\d+)秒/) || timeStr.match(/T \+ (\d+)分(\d+)秒/);
  if (match) {
    if (match[2]) {
      // 有分钟格式
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    } else {
      // 只有秒数格式
      return parseInt(match[1]);
    }
  }
  return 0;
};

// 更新目标摧毁指标
const updateTargetDestructionMetrics = (
  group: GroupData,
  currentTarget: GroupMember
) => {
  if (!currentTarget) return;

  const previousStatus = group.keyMetrics.targetStatus || currentTarget.status;
  const currentStatus = currentTarget.status;

  // 检测目标状态从非摧毁变为摧毁
  if (previousStatus !== "destroyed" && currentStatus === "destroyed") {
    const currentTime = exerciseTime.value;
    group.keyMetrics.targetDestroyedTime = currentTime;

    console.log(
      `[EvaluationPage] 检测到目标 ${currentTarget.name} 被摧毁时间: ${currentTime}`
    );

    // 检查是否在照射期间摧毁
    if (
      group.keyMetrics.laserIrradiationStart &&
      !group.keyMetrics.laserIrradiationEnd
    ) {
      // 照射开始了但还没有停止，说明在照射期间摧毁
      group.keyMetrics.isDestroyedDuringIrradiation = true;
      console.log(`[EvaluationPage] 目标在照射期间被摧毁`);
    } else if (
      group.keyMetrics.laserIrradiationStart &&
      group.keyMetrics.laserIrradiationEnd
    ) {
      // 检查摧毁时间是否在照射时间范围内
      const irradiationStartTime = parseExerciseTime(
        group.keyMetrics.laserIrradiationStart
      );
      const irradiationEndTime = parseExerciseTime(
        group.keyMetrics.laserIrradiationEnd
      );
      const destructionTime = parseExerciseTime(currentTime);

      if (
        destructionTime >= irradiationStartTime &&
        destructionTime <= irradiationEndTime
      ) {
        group.keyMetrics.isDestroyedDuringIrradiation = true;
        console.log(`[EvaluationPage] 目标在照射时间范围内被摧毁`);
      }
    }

    // 计算摧毁时距离目标的距离
    if (currentTarget.coordinates) {
      // 找到同组中的无人机平台
      const uavPlatform = platforms.value.find(
        (p) =>
          p.base?.group === group.name &&
          p.base?.type === "UAV01" &&
          p.base?.side === "red"
      );

      if (uavPlatform?.base?.location) {
        const distance = calculateDistance(
          uavPlatform.base.location,
          currentTarget.coordinates
        );
        group.keyMetrics.distanceAtDestruction = distance;
        console.log(`[EvaluationPage] 计算摧毁时距离: ${distance.toFixed(0)}m`);
      }
    }
  }

  // 更新目标状态记录
  group.keyMetrics.targetStatus = currentStatus;
};

// 从字符串命令获取对应的数字命令
const getCommandNumberFromString = (command: string): number => {
  const stringToNumberMap: { [key: string]: number } = {
    Command_inValid: 0,
    Uav_Sensor_On: 1,
    Uav_Sensor_Off: 2,
    Uav_Sensor_Turn: 3,
    Uav_LazerPod_Lasing: 4,
    Uav_LazerPod_Cease: 5,
    Uav_Nav: 6,
    Arty_Target_Set: 7,
    Arty_Fire: 8,
    Uav_Set_Speed: 9,
    Uav_Lock_Target: 10,
    Uav_Strike_Coordinate: 11,
    Arty_Fire_Coordinate: 12,
  };
  return stringToNumberMap[command] || 0;
};

// 处理平台命令事件
const handlePlatformCommand = (parsedData: any) => {
  try {
    console.log("[EvaluationPage] 收到平台命令:", parsedData);

    const commandID = parsedData.commandID;
    const platformName = parsedData.platformName;
    const command = parsedData.command;

    // 获取当前演习时间
    const currentExerciseTime = exerciseTime.value;

    // 找到发送命令的平台所在的分组
    const sourcePlatform = platforms.value.find(
      (p) => p.base?.name === platformName
    );
    const sourceGroup = sourcePlatform?.base?.group;

    if (!sourceGroup) {
      console.log(`[EvaluationPage] 跳过未分组平台的命令: ${platformName}`);
      return;
    }

    // 获取命令类型和描述
    const { commandType, description, details } = parseCommandInfo(
      command,
      parsedData
    );

    // 处理关键数据收集（激光照射和目标锁定相关）
    updateKeyMetrics(sourceGroup, command, parsedData, currentExerciseTime);

    // 过滤激光传感器的重复锁定命令（命令类型 10 = Uav_Lock_Target）
    const commandValue =
      typeof command === "number"
        ? command
        : getCommandNumberFromString(command);
    if (commandValue === 10 && parsedData.lockParam) {
      const sensorName = parsedData.lockParam.sensorName;
      const targetName = parsedData.lockParam.targetName;

      // 判断是否为激光传感器（通过名称判断）
      const isLaserSensor =
        sensorName &&
        (sensorName.toLowerCase().includes("laser") ||
          sensorName.toLowerCase().includes("激光"));

      if (isLaserSensor) {
        // 检查是否已经存在相同的激光锁定事件（相同目标、相同传感器）
        const targetGroup = allGroups.value.find((g) => g.name === sourceGroup);
        if (targetGroup) {
          const existingLaserLockEvent = targetGroup.events.find(
            (event) =>
              event.type === "command" &&
              event.typeDisplay === "锁定目标" &&
              event.details.sensorName === sensorName &&
              event.details.targetName === targetName
          );

          if (existingLaserLockEvent) {
            console.log(
              `[EvaluationPage] 过滤激光传感器重复锁定命令: 目标=${targetName}, 传感器=${sensorName}`
            );
            return; // 跳过重复的激光锁定命令
          } else {
            console.log(
              `[EvaluationPage] 记录首次激光传感器锁定命令: 目标=${targetName}, 传感器=${sensorName}`
            );
          }
        }
      }
    }

    // 创建事件对象
    const event: GroupEvent = {
      id: `cmd_${commandID}_${Date.now()}`,
      timestamp: Date.now(),
      exerciseTime: currentExerciseTime,
      type: "command",
      typeDisplay: commandType,
      typeClass: `event-${commandType.toLowerCase().replace(/\s+/g, "_")}`,
      description: description,
      sourcePlatform: platformName || "未知平台",
      targetPlatform: details.targetPlatform || "系统",
      details: details,
    };

    // 将事件添加到对应分组
    const targetGroup = allGroups.value.find((g) => g.name === sourceGroup);
    if (targetGroup) {
      targetGroup.events.push(event);
      // 按演习时间排序（最新的在前）
      targetGroup.events.sort((a, b) => b.timestamp - a.timestamp);
      // 限制事件数量，保持最近的50条
      if (targetGroup.events.length > 50) {
        targetGroup.events = targetGroup.events.slice(0, 50);
      }

      console.log(`[EvaluationPage] 添加命令事件到分组 ${sourceGroup}:`, event);
    }
  } catch (error) {
    console.error("[EvaluationPage] 处理平台命令失败:", error);
  }
};

// 解析命令信息
const parseCommandInfo = (command: number | string, parsedData: any) => {
  // 首先添加调试信息，检查命令类型
  console.log(
    `[EvaluationPage] 解析命令信息 - 命令值: ${command}, 类型: ${typeof command}`
  );

  // 根据 PlatformCmd.proto 中的 PlatformCommand 枚举定义数字命令映射
  const numericCommandMap: { [key: number]: { type: string; name: string } } = {
    0: { type: "invalid", name: "错误命令" },
    1: { type: "sensor", name: "传感器开机" },
    2: { type: "sensor", name: "传感器关机" },
    3: { type: "movement", name: "传感器转向" },
    4: { type: "laser", name: "激光吊舱照射" },
    5: { type: "laser", name: "激光吊舱停止照射" },
    6: { type: "navigation", name: "无人机航线规划" },
    7: { type: "targeting", name: "目标装订" },
    8: { type: "fire", name: "火炮发射" },
    9: { type: "speed", name: "设定无人机速度" },
    10: { type: "targeting", name: "锁定目标" },
    11: { type: "cooperation", name: "打击协同" },
    12: { type: "cooperation", name: "发射协同" },
  };

  // 根据 PlatformCmd.proto 中的 PlatformCommand 枚举定义字符串命令映射
  const stringCommandMap: { [key: string]: { type: string; name: string } } = {
    Command_inValid: { type: "invalid", name: "错误命令" },
    Uav_Sensor_On: { type: "sensor", name: "传感器开机" },
    Uav_Sensor_Off: { type: "sensor", name: "传感器关机" },
    Uav_Sensor_Turn: { type: "movement", name: "传感器转向" },
    Uav_LazerPod_Lasing: { type: "laser", name: "激光吊舱照射" },
    Uav_LazerPod_Cease: { type: "laser", name: "激光吊舱停止照射" },
    Uav_Nav: { type: "navigation", name: "无人机航线规划" },
    Arty_Target_Set: { type: "targeting", name: "目标装订" },
    Arty_Fire: { type: "fire", name: "火炮发射" },
    Uav_Set_Speed: { type: "speed", name: "设定无人机速度" },
    Uav_Lock_Target: { type: "targeting", name: "锁定目标" },
    Uav_Strike_Coordinate: { type: "cooperation", name: "打击协同" },
    Arty_Fire_Coordinate: { type: "cooperation", name: "发射协同" },
  };

  let cmdInfo: { type: string; name: string };

  // 根据命令类型选择对应的映射表
  if (typeof command === "number") {
    cmdInfo = numericCommandMap[command] || {
      type: "unknown",
      name: "未知命令",
    };
    console.log(
      `[EvaluationPage] 使用数字命令映射: ${command} -> ${cmdInfo.name}`
    );
  } else if (typeof command === "string") {
    cmdInfo = stringCommandMap[command] || {
      type: "unknown",
      name: "未知命令",
    };
    console.log(
      `[EvaluationPage] 使用字符串命令映射: ${command} -> ${cmdInfo.name}`
    );
  } else {
    cmdInfo = { type: "unknown", name: "未知命令" };
    console.warn(
      `[EvaluationPage] 未支持的命令类型: ${typeof command}, 值: ${command}`
    );
  }

  // 添加调试信息
  if (cmdInfo.type === "unknown") {
    console.warn(
      `[EvaluationPage] 未识别的命令: ${command}（类型: ${typeof command}），请检查协议定义`
    );
  }

  let description = `发送${cmdInfo.name}命令`;
  const details: any = {
    commandId: command,
    commandName: cmdInfo.name,
  };

  // 根据不同命令类型添加详细信息
  if (parsedData.sensorParam) {
    const sensor = parsedData.sensorParam;
    details.sensorName = sensor.sensorName;
    if (sensor.azSlew !== undefined && sensor.elSlew !== undefined) {
      description += `（传感器: ${
        sensor.sensorName
      }, 方位角: ${sensor.azSlew.toFixed(2)}°, 俯仰角: ${sensor.elSlew.toFixed(
        2
      )}°）`;
    } else {
      description += `（传感器: ${sensor.sensorName}）`;
    }
  }

  // 处理锁定目标参数
  if (parsedData.lockParam) {
    const lock = parsedData.lockParam;
    details.targetName = lock.targetName;
    details.sensorName = lock.sensorName;
    description += `（目标: ${lock.targetName || "未知"}, 传感器: ${
      lock.sensorName || "未知"
    }）`;
  }

  // 处理速度设定参数
  if (parsedData.setSpeedParam) {
    const speed = parsedData.setSpeedParam;
    details.speed = speed.speed;
    description += `（速度: ${speed.speed} m/s）`;
  }

  // 处理目标装订参数
  if (parsedData.targetSetParam) {
    const targetSet = parsedData.targetSetParam;
    details.targetName = targetSet.targetName;
    description += `（目标: ${targetSet.targetName || "未知"}）`;
  }

  // 处理发射参数
  if (parsedData.fireParam) {
    const fire = parsedData.fireParam;
    details.weaponName = fire.weaponName;
    details.targetName = fire.targetName;
    details.quantity = fire.quantity;
    description += `（武器: ${fire.weaponName || "未知"}, 目标: ${
      fire.targetName || "未知"
    }, 发射次数: ${fire.quantity || 1}）`;
  }

  if (parsedData.strikeCoordinateParam) {
    const strike = parsedData.strikeCoordinateParam;
    details.targetName = strike.targetName;
    details.artilleryName = strike.artyName;
    description += `（目标: ${strike.targetName || "未知"}, 火炮: ${
      strike.artyName || "未知"
    }）`;
  }

  if (parsedData.fireCoordinateParam) {
    const fire = parsedData.fireCoordinateParam;
    details.targetName = fire.targetName;
    details.weaponName = fire.weaponName;
    details.uavName = fire.uavName;
    details.targetPlatform = fire.uavName;
    description += `（目标: ${fire.targetName || "未知"}, 武器: ${
      fire.weaponName || "未知"
    }, 无人机: ${fire.uavName || "未知"}）`;
  }

  // 处理导航参数
  if (parsedData.navParam && parsedData.navParam.route) {
    const nav = parsedData.navParam;
    details.waypointCount = nav.route.length;
    description += `（航迹点数: ${nav.route.length}）`;
  }

  return {
    commandType: cmdInfo.name,
    description,
    details,
  };
};

// 处理平台数据更新
const handlePlatformUpdate = (packet: any) => {
  try {
    console.log("[EvaluationPage] 收到数据包:", {
      类型: packet.type,
      parsedPacket: packet.parsedPacket,
      packageType: packet.parsedPacket?.packageType,
    });

    // 修正：监听平台状态数据包 (0x29)
    if (packet.parsedPacket?.packageType === 0x29) {
      const parsedData = packet.parsedPacket.parsedData;
      console.log("[EvaluationPage] 收到平台状态数据:", parsedData);

      if (parsedData?.platform && Array.isArray(parsedData.platform)) {
        // 更新平台数据
        platforms.value = parsedData.platform;
        console.log(
          `[EvaluationPage] 更新平台数据，共${parsedData.platform.length}个平台`
        );

        // 更新演习时间（从平台数据的updateTime字段获取）
        if (
          parsedData.platform.length > 0 &&
          parsedData.platform[0]?.updateTime !== undefined
        ) {
          exerciseTime.value = formatExerciseTime(
            parsedData.platform[0].updateTime
          );
        }

        // 更新所有分组数据
        updateAllGroupsData();

        // 标记有真实数据
        hasRealData.value = true;

        console.log(
          "[EvaluationPage] 平台状态处理完成，hasRealData:",
          hasRealData.value
        );
      } else {
        console.warn("[EvaluationPage] 平台数据格式错误或为空:", parsedData);
      }
    } else if (packet.parsedPacket?.packageType === 0x2a) {
      // 平台命令数据包 - 处理各种命令事件
      handlePlatformCommand(packet.parsedPacket.parsedData);
    } else {
      console.log(
        "[EvaluationPage] 跳过非平台数据包，packageType:",
        packet.parsedPacket?.packageType
      );
    }
  } catch (error) {
    console.error("[EvaluationPage] 处理平台数据失败:", error);
  }
};

// 格式化演习时间
const formatExerciseTime = (updateTime: number): string => {
  return `T + ${Math.round(updateTime)}秒`;
};

// 计算平均分数
const calculateAverageScore = (criteria: keyof GroupScores): string => {
  if (allGroups.value.length === 0) return "0.0";

  const validGroups = allGroups.value.filter(
    (group) => group.isSaved && hasValidScores(group.scores)
  );
  if (validGroups.length === 0) return "0.0";

  const total = validGroups.reduce(
    (sum, group) => sum + group.scores[criteria],
    0
  );
  return (total / validGroups.length).toFixed(1);
};

// 获取评分颜色等级
const getScoreColorClass = (score: string): string => {
  const numScore = parseFloat(score);
  if (numScore >= 4.5) return "score-excellent";
  if (numScore >= 4.0) return "score-good";
  if (numScore >= 3.0) return "score-average";
  if (numScore > 0) return "score-poor";
  return "score-none";
};

// 检查评分是否有效
const hasValidScores = (scores: GroupScores): boolean => {
  return Object.values(scores).some((score) => score > 0);
};

// 保存小组评价
const saveGroupEvaluation = (groupName: string) => {
  const group = allGroups.value.find((g) => g.name === groupName);
  if (!group) return;

  // 检查是否已经保存
  if (group.isSaved) {
    ElMessage.warning(`${groupName} 的评价已经保存，无法修改`);
    return;
  }

  // 检查评分有效性
  if (!hasValidScores(group.scores)) {
    ElMessage.error("请先完成评分后再保存");
    return;
  }

  // 保存评价
  group.isSaved = true;
  group.savedAt = new Date().toISOString();

  ElMessage.success({
    message: `已保存 ${groupName} 的评价（${savedGroupsCount.value}/${allGroups.value.length}）`,
    duration: 3000,
  });

  console.log("保存小组评价:", {
    group: groupName,
    scores: group.scores,
    comments: group.comments,
    savedAt: group.savedAt,
    timestamp: new Date().toISOString(),
  });

  // 如果所有组别都已保存，显示提示
  if (allGroupsSaved.value) {
    ElMessage.success({
      message: "所有分组评价已完成，现在可以导出报告",
      duration: 5000,
      showClose: true,
    });
  }
};

// 重置小组评分
const resetGroupScores = (groupName: string) => {
  const group = allGroups.value.find((g) => g.name === groupName);
  if (!group) return;

  group.scores = {
    coordination: 0,
    targetIdentification: 0,
    commandExecution: 0,
    overall: 0,
  };
  group.comments = "";

  // 重置保存状态，允许重新编辑
  group.isSaved = false;
  group.savedAt = undefined;

  ElMessage.info(`已重置 ${groupName} 的评分`);
};

// 导出评价报告
const exportEvaluationReport = () => {
  // 检查是否所有组别都已保存且有有效评分
  const unsavedGroups = allGroups.value.filter(
    (group) => !group.isSaved || !hasValidScores(group.scores)
  );
  if (unsavedGroups.length > 0) {
    const unsavedNames = unsavedGroups.map((g) => g.name).join("、");
    ElMessage.error({
      message: `请先保存以下分组的有效评价后再导出：${unsavedNames}（已保存: ${savedGroupsCount.value}/${allGroups.value.length}）`,
      duration: 4000,
      showClose: true,
    });
    return;
  }

  // 准备Excel数据
  const excelData = prepareExcelData();

  // 生成CSV格式内容（可以被Excel直接打开）
  const csvContent = generateCSVContent(excelData);

  // 创建并下载文件
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evaluation_report_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success({
    message: `评价报告已导出为Excel表格，包含${allGroups.value.length}个分组的详细评价数据`,
    duration: 4000,
    showClose: true,
  });
};

// 准备Excel数据
const prepareExcelData = () => {
  return allGroups.value.map((group) => {
    // 组装成员信息
    const redMemberNames = group.redMembers.map((m) => m.name).join("、");
    const redMemberTypes = group.redMembers
      .map((m) => getDisplayType(m.type))
      .join("、");
    const redMemberStatus = group.redMembers
      .map((m) => m.statusText)
      .join("、");

    // 任务目标信息
    const targetInfo = group.currentTarget
      ? {
          name: group.currentTarget.name,
          type: getDisplayType(group.currentTarget.type),
          status: group.currentTarget.statusText,
          coordinates: group.currentTarget.coordinates
            ? `${group.currentTarget.coordinates.longitude.toFixed(
                6
              )}, ${group.currentTarget.coordinates.latitude.toFixed(6)}, ${
                group.currentTarget.coordinates.altitude
              }m`
            : "无坐标",
        }
      : {
          name: "无目标",
          type: "",
          status: "",
          coordinates: "",
        };

    return {
      groupName: group.name,
      redMemberNames,
      redMemberTypes,
      redMemberStatus,
      targetName: targetInfo.name,
      targetType: targetInfo.type,
      targetStatus: targetInfo.status,
      targetCoordinates: targetInfo.coordinates,
      coordinationScore: group.scores.coordination || 0,
      targetIdentificationScore: group.scores.targetIdentification || 0,
      commandExecutionScore: group.scores.commandExecution || 0,
      overallScore: group.scores.overall || 0,
      comments: group.comments || "",
      eventCount: group.events.length,
      memberCount: group.redMembers.length,
    };
  });
};

// 生成CSV内容
const generateCSVContent = (data) => {
  // CSV标题行
  const headers = [
    "分组名称",
    "红方成员",
    "成员类型",
    "成员状态",
    "任务目标",
    "目标类型",
    "目标状态",
    "目标坐标",
    "协同效率评分",
    "目标识别评分",
    "指令执行评分",
    "整体表现评分",
    "评价备注",
    "关键事件数",
    "成员总数",
  ];

  // 构建CSV内容
  let csvContent = "\uFEFF"; // BOM for UTF-8
  csvContent += headers.join(",") + "\n";

  data.forEach((row) => {
    const csvRow = [
      escapeCSVField(row.groupName),
      escapeCSVField(row.redMemberNames),
      escapeCSVField(row.redMemberTypes),
      escapeCSVField(row.redMemberStatus),
      escapeCSVField(row.targetName),
      escapeCSVField(row.targetType),
      escapeCSVField(row.targetStatus),
      escapeCSVField(row.targetCoordinates),
      row.coordinationScore,
      row.targetIdentificationScore,
      row.commandExecutionScore,
      row.overallScore,
      escapeCSVField(row.comments),
      row.eventCount,
      row.memberCount,
    ];
    csvContent += csvRow.join(",") + "\n";
  });

  // 添加汇总信息
  csvContent += "\n汇总信息\n";
  csvContent += `演习时间,${exerciseTime.value}\n`;
  csvContent += `天文时间,${astronomicalTime.value}\n`;
  csvContent += `参与分组数,${allGroups.value.length}\n`;
  csvContent += `总平台数,${platforms.value.length}\n`;
  csvContent += `总事件数,${totalEvents.value}\n`;
  csvContent += `平均协同效率,${calculateAverageScore("coordination")}\n`;
  csvContent += `平均目标识别,${calculateAverageScore(
    "targetIdentification"
  )}\n`;
  csvContent += `平均指令执行,${calculateAverageScore("commandExecution")}\n`;
  csvContent += `平均整体表现,${calculateAverageScore("overall")}\n`;

  return csvContent;
};

// CSV字段转义
const escapeCSVField = (field) => {
  if (field === null || field === undefined) {
    return "";
  }
  const str = String(field);
  // 如果包含逗号、引号或换行符，需要用引号包围并转义内部引号
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

// 清空所有评价
const clearAllEvaluations = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有评价数据吗？此操作不可恢复。",
      "确认清空",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    allGroups.value.forEach((group) => {
      group.scores = {
        coordination: 0,
        targetIdentification: 0,
        commandExecution: 0,
        overall: 0,
      };
      group.comments = "";
      group.events = [];
      // 重置保存状态
      group.isSaved = false;
      group.savedAt = undefined;
    });

    ElMessage.success("已清空所有评价数据");
  } catch {
    ElMessage.info("已取消操作");
  }
};

// 开始新演习 - 清除所有状态
const startNewExercise = async () => {
  try {
    await ElMessageBox.confirm(
      "开始新演习将清除所有组别信息和评价数据，此操作不可恢复。确定要继续吗？",
      "确认开始新演习",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        message:
          '<div style="color: #f56c6c; font-weight: 600;">⚠️ 警告：此操作将：</div><ul style="margin: 8px 0; text-align: left;"><li>清除所有分组信息</li><li>清除所有评价数据</li><li>重置演习时间</li><li>清除所有事件记录</li></ul><div>请确保已导出重要数据！</div>',
      }
    );

    // 清除所有分组数据
    allGroups.value = [];

    // 清除平台数据
    platforms.value = [];

    // 重置状态
    hasRealData.value = false;
    exerciseTime.value = "T + 0秒";

    ElMessage.success({
      message: "已开始新演习，所有数据已清除",
      duration: 3000,
      showClose: true,
    });

    console.log("[EvaluationPage] 新演习已开始，所有状态已重置");
  } catch {
    ElMessage.info("已取消操作");
  }
};

// 天文时间更新定时器
let timeUpdateInterval: NodeJS.Timeout | null = null;

// 生命周期钩子
onMounted(() => {
  // 监听平台数据
  if (window.electronAPI?.multicast?.onPacket) {
    window.electronAPI.multicast.onPacket(handlePlatformUpdate);
    console.log("[EvaluationPage] 已开始监听平台状态数据");
  } else {
    console.warn("[EvaluationPage] multicast API 不可用");
  }

  // 启动天文时间更新
  timeUpdateInterval = setInterval(() => {
    astronomicalTime.value = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, 1000);

  console.log("[EvaluationPage] 测评页面已加载");
});

onUnmounted(() => {
  // 清理监听器
  if (window.electronAPI?.multicast?.removeAllListeners) {
    window.electronAPI.multicast.removeAllListeners("packet");
    console.log("[EvaluationPage] 已停止监听平台状态数据");
  }

  // 清理定时器
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }

  console.log("[EvaluationPage] 测评页面已卸载");
});
</script>

<style scoped>
.evaluation-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 60px;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.header-left {
  flex: 0 0 auto;
}

/* 标题与返回按钮容器 */
.title-with-back {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 返回按钮样式 */
.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  background: white;
  color: #24292f;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.back-button:hover {
  background: #f6f8fa;
  border-color: #0969da;
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.3);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 20px;
}

.header-right {
  flex: 0 0 auto;
}

.page-title {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.overview-stats {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.stat-label {
  font-size: 13px;
  color: #656d76;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #0969da;
}

/* 数据来源指示器和控制按钮 */
.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.data-source-indicator {
  display: flex;
  align-items: center;
}

.source-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.source-badge.real-data {
  background: #f0f9ff;
  border-color: #10b981;
  color: #065f46;
}

.source-badge.real-data .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.source-badge.cached-data {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #4b5563;
}

.source-badge.cached-data .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
}

.source-badge.mock-data {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #92400e;
}

.source-badge.mock-data .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

.source-badge.no-data {
  background: #f9fafb;
  border-color: #6b7280;
  color: #374151;
}

.source-badge.no-data .indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6b7280;
}

/* 所有分组容器 */
.all-groups-container {
  margin-bottom: 20px;
  flex: 1; /* 允许容器扩展 */
}

.no-groups-hint {
  background: white;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #656d76;
}

.hint-icon {
  font-size: 32px;
  color: #d1d5db;
}

.hint-text {
  font-size: 16px;
}

/* 分组表格布局 */
.groups-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #e1e8ed;
  min-height: 320px;
}

/* 分组标题 */
.group-title {
  margin: 0 0 12px 0;
  padding: 8px 12px;
  background: #34495e;
  color: white;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

/* 第一列：基本情况 */
.group-basic-info {
  border-right: 1px solid #e1e8ed;
  padding-right: 12px;
}

.section-subtitle {
  margin: 8px 0 2px 0;
  font-size: 13px;
  font-weight: 600;
  color: #656d76;
  border-bottom: 1px solid #e1e8ed;
  padding-bottom: 4px;
}

.members-section {
  margin-bottom: 16px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 4px;
  font-size: 12px;
}

.member-name {
  font-weight: 600;
  color: #24292f;
}

.member-type {
  color: #656d76;
  font-size: 11px;
}

.target-section {
  margin-bottom: 8px;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 4px;
}

.target-name {
  font-weight: 600;
  font-size: 13px;
  color: #24292f;
}

.target-type {
  font-size: 11px;
  color: #656d76;
}

.target-coordinates {
  font-size: 10px;
  color: #0969da;
  font-family: monospace;
}

/* 第二列：关键事件 */
.group-events {
  border-right: 1px solid #e1e8ed;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.events-list {
  flex: 1;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.events-list::-webkit-scrollbar {
  width: 4px;
}

.events-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.events-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.events-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.events-list .event-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 3px solid #0969da;
  background: #f6f8fa;
  font-size: 11px;
}

.event-command {
  border-left-color: #7c3aed !important;
}

.event-strike_coordinate {
  border-left-color: #dc2626 !important;
}

.event-fire_coordinate {
  border-left-color: #ea580c !important;
}

.event-time {
  font-family: monospace;
  color: #656d76;
  font-size: 10px;
}

.event-type {
  font-weight: 600;
  color: #0969da;
  font-size: 10px;
  margin-bottom: 2px;
}

.event-description {
  color: #24292f;
  font-size: 11px;
  margin-bottom: 2px;
}

.event-platforms {
  color: #656d76;
  font-size: 10px;
}

.more-events {
  text-align: center;
  color: #656d76;
  font-style: italic;
  font-size: 11px;
  padding: 8px;
}

/* 关键数据展示区域 */
.key-metrics-section {
  margin-bottom: 12px;
  /* padding: 8px; */
  /* background: #f8f9fa; */
  /* border: 1px solid #e1e8ed; */
  /* border-radius: 4px; */
  /* flex-shrink: 0; */
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.metric-group {
  background: white;
  border-radius: 3px;
  border: 1px solid #d0d7de;
  overflow: hidden;
}

.metric-group-title {
  background: #34495e;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 6px;
  text-align: center;
}

.metric-items {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  line-height: 1.3;
}

.metric-label {
  color: #656d76;
  font-weight: 500;
  flex: 0 0 auto;
}

.metric-value {
  color: #24292f;
  font-weight: 600;
  font-family: monospace;
  text-align: right;
  flex: 1;
  margin-left: 8px;
  font-size: 9px;
}

/* 指标颜色等级 */
.metric-value.metric-excellent {
  color: #137333;
  background: #e8f5e8;
  padding: 1px 3px;
  border-radius: 2px;
}

.metric-value.metric-good {
  color: #0969da;
  background: #eff6ff;
  padding: 1px 3px;
  border-radius: 2px;
}

.metric-value.metric-average {
  color: #bf8700;
  background: #fff8c5;
  padding: 1px 3px;
  border-radius: 2px;
}

.metric-value.metric-poor {
  color: #d1242f;
  background: #fef0f0;
  padding: 1px 3px;
  border-radius: 2px;
}

.metric-value.metric-none {
  color: #656d76;
  font-style: italic;
}

/* 第三列：专家评价 */
.group-evaluation {
  padding-left: 12px;
}

.evaluation-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scores-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-item {
  display: grid;
  grid-template-columns: 60px 1fr 30px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.score-label {
  font-weight: 500;
  color: #24292f;
}

.score-value {
  font-weight: 600;
  color: #0969da;
  text-align: center;
}

.evaluation-comments {
  flex: 1;
}

.evaluation-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.saved-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #e8f5e8;
  border: 1px solid #52c41a;
  border-radius: 4px;
  font-size: 11px;
}

.saved-icon {
  color: #52c41a;
  font-size: 12px;
}

.saved-text {
  color: #52c41a;
  font-weight: 600;
}

.saved-time {
  color: #666;
  font-size: 10px;
  margin-left: auto;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .group-row {
    grid-template-columns: 1fr;
    gap: 12px;
    min-height: auto;
  }

  .group-basic-info,
  .group-events {
    border-right: none;
    border-bottom: 1px solid #e1e8ed;
    padding-right: 0;
    padding-bottom: 12px;
  }

  .group-evaluation {
    padding-left: 0;
    padding-top: 12px;
  }

  .events-list {
    max-height: 200px;
  }

  .key-metrics-section {
    margin-bottom: 8px;
    padding: 6px;
  }

  .metrics-grid {
    gap: 4px;
  }

  .metric-item {
    font-size: 8px;
  }

  .metric-label {
    font-size: 8px;
  }

  .metric-value {
    font-size: 7px;
  }
}

.section-title {
  margin: 0 0 12px 0;
  padding: 8px 12px;
  background: #34495e;
  color: white;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

/* 组成员区域 */
.group-members-section {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.members-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.member-type-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #656d76;
}

.member-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-card {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
}

.red-member {
  background: #fff5f5;
  border-color: #feb2b2;
}

.blue-target {
  background: #eff6ff;
  border-color: #93c5fd;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-weight: 600;
  font-size: 13px;
  color: #24292f;
}

.member-type {
  font-size: 11px;
  color: #656d76;
}

.target-coordinates {
  font-size: 11px;
  color: #0969da;
  font-family: monospace;
}

.member-status {
  font-size: 11px;
  font-weight: 500;
}

.status-active {
  color: #137333;
}

.status-inactive {
  color: #faad14;
}

.status-destroyed {
  color: #d1242f;
  animation: targetDestroyedPulse 2s infinite;
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

/* 任务目标状态 */
.group-target-status {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.target-status-display {
  padding: 12px;
}

.current-target-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.target-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.target-name {
  font-weight: 600;
  color: #24292f;
  flex: 1;
}

.target-status-indicator {
  display: flex;
  align-items: center;
}

.target-status {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 500;
}

.target-status.active {
  background: #e8f5e8;
  color: #52c41a;
}

.target-status.active .status-icon {
  color: #52c41a;
  font-size: 9px;
}

.target-status.inactive {
  background: #fff7e6;
  color: #faad14;
}

.target-status.inactive .status-icon {
  color: #faad14;
  font-size: 9px;
}

.target-status.destroyed {
  background: #fef0f0;
  color: #f56c6c;
  animation: targetDestroyedPulse 2s infinite;
}

.target-status.destroyed .status-icon {
  color: #f56c6c;
  font-size: 9px;
}

.no-target {
  color: #656d76;
  font-style: italic;
  text-align: center;
  padding: 12px;
  font-size: 12px;
}

.no-events {
  color: #656d76;
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: 12px;
}

/* 关键事件展示区 */
.group-events-section {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
  min-height: 200px;
  flex-shrink: 0; /* 防止被过度压缩 */
}

/* 全局评价汇总 */
.global-summary {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0; /* 防止被压缩，确保始终可见 */
  margin-top: auto; /* 推到页面底部 */
}

.summary-content {
  padding: 16px;
}

.summary-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* 评价维度平均分统计区域 */
.average-scores-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.scores-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.scores-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.score-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  transition: all 0.2s ease;
}

.score-stat-item:hover {
  border-color: #0969da;
  box-shadow: 0 1px 3px rgba(9, 105, 218, 0.1);
}

.score-stat-label {
  font-size: 13px;
  font-weight: 500;
  color: #656d76;
}

.score-stat-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-number {
  font-size: 16px;
  font-weight: 700;
  color: #0969da;
}

/* 评分颜色等级 */
.score-number.score-excellent {
  color: #137333; /* 优秀 4.5-5.0 绿色 */
}

.score-number.score-good {
  color: #0969da; /* 良好 4.0-4.4 蓝色 */
}

.score-number.score-average {
  color: #bf8700; /* 中等 3.0-3.9 黄色 */
}

.score-number.score-poor {
  color: #d1242f; /* 待改进 0.1-2.9 红色 */
}

.score-number.score-none {
  color: #656d76; /* 无评分 0.0 灰色 */
}

.score-unit {
  font-size: 12px;
  color: #656d76;
  font-weight: 500;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #656d76;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #0969da;
}

.stat-value.all-saved {
  color: #52c41a;
  font-weight: 700;
}

.export-ready {
  animation: exportReady 2s ease-in-out;
}

@keyframes exportReady {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.summary-actions {
  display: flex;
  gap: 8px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
  }

  .header-controls {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .scores-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .score-stat-item {
    padding: 6px 8px;
  }

  .score-number {
    font-size: 14px;
  }

  .header-left,
  .header-center,
  .header-right {
    width: 100%;
    margin: 0;
  }

  .header-center {
    justify-content: flex-start;
  }

  .overview-stats {
    gap: 12px;
    justify-content: flex-start;
  }

  .stat-item {
    font-size: 12px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-value {
    font-size: 13px;
  }
}

@media (max-width: 1024px) {
  .overview-stats {
    gap: 16px;
  }

  .stat-item {
    font-size: 12px;
  }
}
</style>
