<template>
  <div class="evaluation-page">
    <!-- 融合后的页面标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">作战测评席位</h2>
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
        <!-- 数据来源指示器 -->
        <div class="data-source-indicator">
          <div v-if="hasRealData" class="source-badge real-data">
            <div class="indicator-dot"></div>
            <span>实时数据</span>
          </div>
          <div v-else-if="allGroups.length === 0" class="source-badge no-data">
            <div class="indicator-dot"></div>
            <span>无数据</span>
          </div>
          <div v-else class="source-badge mock-data">
            <div class="indicator-dot"></div>
            <span>模拟数据</span>
          </div>
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

      <!-- 所有分组平铺显示，一行最多3个组 -->
      <div v-else class="groups-grid">
        <div v-for="group in allGroups" :key="group.name" class="group-column">
          <!-- 组成员区域 -->
          <div class="group-members-section">
            <h3 class="section-title">{{ group.name }}成员</h3>
            <div class="members-grid">
              <!-- 红方成员 -->
              <div class="red-members">
                <h4 class="member-type-title">红方成员</h4>
                <div class="member-cards">
                  <div
                    v-for="member in group.redMembers"
                    :key="member.name"
                    class="member-card red-member"
                  >
                    <div class="member-info">
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
              </div>
            </div>
          </div>

          <!-- 任务目标状态 -->
          <div class="group-target-status">
            <h3 class="section-title">{{ group.name }}任务目标状态</h3>
            <div class="target-status-display">
              <div v-if="group.currentTarget" class="current-target-info">
                <div class="target-detail">
                  <span class="target-name">{{
                    group.currentTarget.name
                  }}</span>
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
                      <span class="status-text">已扫到</span>
                    </div>
                    <div v-else class="target-status inactive">
                      <el-icon class="status-icon"><WarningFilled /></el-icon>
                      <span class="status-text">未扫到</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="group.currentTarget.coordinates"
                  class="target-coordinates"
                >
                  经纬高：{{ group.currentTarget.coordinates.longitude }}°,
                  {{ group.currentTarget.coordinates.latitude }}°,
                  {{ group.currentTarget.coordinates.altitude }}m
                </div>
              </div>
              <div v-else class="no-target">暂无任务目标</div>
            </div>
          </div>

          <!-- 关键事件展示区 -->
          <div class="group-events-section">
            <h3 class="section-title">{{ group.name }}关键事件推送</h3>
            <div class="events-timeline">
              <div
                v-for="event in group.events"
                :key="event.id"
                class="event-item"
                :class="event.typeClass"
              >
                <div class="event-header">
                  <span class="event-time">{{ event.exerciseTime }}</span>
                  <span class="event-type">{{ event.typeDisplay }}</span>
                </div>
                <div class="event-content">
                  <div class="event-description">{{ event.description }}</div>
                  <div v-if="event.details" class="event-details">
                    <span v-if="event.details.targetName"
                      >目标：{{ event.details.targetName }}</span
                    >
                    <span v-if="event.details.weaponName"
                      >武器：{{ event.details.weaponName }}</span
                    >
                    <span v-if="event.details.artilleryName"
                      >火炮：{{ event.details.artilleryName }}</span
                    >
                  </div>
                </div>
                <div class="event-platforms">
                  <span class="source-platform">{{
                    event.sourcePlatform
                  }}</span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  <span class="target-platform">{{
                    event.targetPlatform
                  }}</span>
                </div>
              </div>

              <div v-if="group.events.length === 0" class="no-events">
                暂无关键事件
              </div>
            </div>
          </div>

          <!-- 专家评分区域 -->
          <div class="expert-scoring-section">
            <h3 class="section-title">{{ group.name }}专家评价</h3>
            <div class="scoring-panel">
              <div class="scoring-criteria">
                <div class="criteria-item">
                  <label>协同效率：</label>
                  <el-rate
                    v-model="group.scores.coordination"
                    :max="5"
                    allow-half
                    show-score
                    score-template="{value} 分"
                  />
                </div>
                <div class="criteria-item">
                  <label>目标识别：</label>
                  <el-rate
                    v-model="group.scores.targetIdentification"
                    :max="5"
                    allow-half
                    show-score
                    score-template="{value} 分"
                  />
                </div>
                <div class="criteria-item">
                  <label>指令执行：</label>
                  <el-rate
                    v-model="group.scores.commandExecution"
                    :max="5"
                    allow-half
                    show-score
                    score-template="{value} 分"
                  />
                </div>
                <div class="criteria-item">
                  <label>整体表现：</label>
                  <el-rate
                    v-model="group.scores.overall"
                    :max="5"
                    allow-half
                    show-score
                    score-template="{value} 分"
                  />
                </div>
              </div>

              <div class="scoring-comments">
                <label>评价备注：</label>
                <el-input
                  v-model="group.comments"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入对该小组的评价和建议..."
                  maxlength="500"
                  show-word-limit
                />
              </div>

              <div class="scoring-actions">
                <el-button
                  type="primary"
                  @click="saveGroupEvaluation(group.name)"
                  :disabled="!hasValidScores(group.scores)"
                >
                  保存评价
                </el-button>
                <el-button @click="resetGroupScores(group.name)">
                  重置评分
                </el-button>
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
            <span class="stat-label">平均协同效率：</span>
            <span class="stat-value">{{
              calculateAverageScore("coordination")
            }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总体事件数：</span>
            <span class="stat-value">{{ totalEvents }}</span>
          </div>
        </div>

        <div class="summary-actions">
          <el-button type="success" @click="exportEvaluationReport">
            导出评价报告
          </el-button>
          <el-button @click="clearAllEvaluations">清空所有评价</el-button>
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
} from "@element-plus/icons-vue";

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

// 更新所有分组数据（平铺展示）
const updateAllGroupsData = () => {
  if (!platforms.value || platforms.value.length === 0) {
    console.log("[EvaluationPage] 无平台数据，跳过小组更新");
    allGroups.value = [];
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
            statusText: "失联",
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

  console.log(
    "[EvaluationPage] 所有分组数据更新完成，总分组数:",
    allGroups.value.length
  );
};

// 获取目标状态文本
const getTargetStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    active: "正常",
    inactive: "失联",
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

  const total = allGroups.value.reduce(
    (sum, group) => sum + group.scores[criteria],
    0
  );
  return (total / allGroups.value.length).toFixed(1);
};

// 检查评分是否有效
const hasValidScores = (scores: GroupScores): boolean => {
  return Object.values(scores).some((score) => score > 0);
};

// 保存小组评价
const saveGroupEvaluation = (groupName: string) => {
  const group = allGroups.value.find((g) => g.name === groupName);
  if (!group) return;

  ElMessage.success(`已保存 ${groupName} 的评价`);

  console.log("保存小组评价:", {
    group: groupName,
    scores: group.scores,
    comments: group.comments,
    timestamp: new Date().toISOString(),
  });
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

  ElMessage.info(`已重置 ${groupName} 的评分`);
};

// 导出评价报告
const exportEvaluationReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    exerciseTime: exerciseTime.value,
    groups: allGroups.value.map((group) => ({
      name: group.name,
      memberCount: group.redMembers.length + group.blueTargets.length,
      eventCount: group.events.length,
      scores: group.scores,
      comments: group.comments,
    })),
    summary: {
      totalGroups: allGroups.value.length,
      totalEvents: totalEvents.value,
      averageScores: {
        coordination: calculateAverageScore("coordination"),
        targetIdentification: calculateAverageScore("targetIdentification"),
        commandExecution: calculateAverageScore("commandExecution"),
        overall: calculateAverageScore("overall"),
      },
    },
  };

  // 创建并下载文件
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evaluation_report_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success("评价报告已导出");
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
    });

    ElMessage.success("已清空所有评价数据");
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
  height: 100vh;
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
}

.header-left {
  flex: 0 0 auto;
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

/* 数据来源指示器 */
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

/* 分组网格布局 - 一行最多3个组 */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  max-width: 100%;
}

/* 确保每行最多3个组 */
@media (min-width: 1200px) {
  .groups-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .groups-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }
}

.group-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #e1e8ed;
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

.target-coordinates {
  font-size: 12px;
  color: #656d76;
  font-family: monospace;
}

.no-target {
  color: #656d76;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

/* 关键事件展示区 */
.group-events-section {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
  min-height: 200px;
}

.events-timeline {
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.event-item {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  border-left: 4px solid #0969da;
  background: #f6f8fa;
}

.event-command {
  border-left-color: #7c3aed;
}

.event-strike_coordinate {
  border-left-color: #dc2626;
}

.event-fire_coordinate {
  border-left-color: #ea580c;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.event-time {
  font-size: 11px;
  color: #656d76;
  font-family: monospace;
}

.event-type {
  font-size: 11px;
  font-weight: 600;
  color: #0969da;
  background: #dbeafe;
  padding: 2px 6px;
  border-radius: 4px;
}

.event-content {
  margin-bottom: 6px;
}

.event-description {
  font-size: 13px;
  color: #24292f;
  margin-bottom: 4px;
}

.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #656d76;
}

.event-details span {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
}

.event-platforms {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #0969da;
}

.arrow-icon {
  font-size: 12px;
  color: #656d76;
}

.source-platform,
.target-platform {
  font-weight: 500;
}

.no-events {
  color: #656d76;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
}

/* 专家评分区域 */
.expert-scoring-section {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.scoring-panel {
  padding: 16px;
}

.scoring-criteria {
  margin-bottom: 16px;
}

.criteria-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.criteria-item label {
  min-width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: #24292f;
}

.scoring-comments {
  margin-bottom: 16px;
}

.scoring-comments label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #24292f;
}

.scoring-actions {
  display: flex;
  gap: 8px;
}

/* 全局评价汇总 */
.global-summary {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
