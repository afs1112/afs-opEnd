<template>
  <div class="start-page">
    <!-- 左侧背景区域 -->
    <div class="left-section">
      <div class="background-image"></div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="right-section">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="system-title">无人机引导仿真系统</h1>
        <p class="system-subtitle">请选择您的操作席位</p>
      </div>

      <!-- 席位选择区域 -->
      <div class="seats-container">
        <div class="seats-grid">
          <!-- 无人机席位 -->
          <div class="seat-card uav-seat" @click="selectSeat('uav')">
            <div class="seat-icon">
              <div class="icon-bg uav-bg">
                <img
                  src="../../assets/UAV.svg"
                  alt="无人机"
                  class="seat-icon-svg"
                />
              </div>
            </div>
            <div class="seat-info">
              <h3 class="seat-title">无人机席位</h3>
              <p class="seat-description">
                无人机操作控制、传感器管理、航线规划、目标跟踪
              </p>
            </div>
            <div class="seat-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- 火炮席位 -->
          <div
            class="seat-card artillery-seat"
            @click="selectSeat('artillery')"
          >
            <div class="seat-icon">
              <div class="icon-bg artillery-bg">
                <img
                  src="../../assets/ROCKET.svg"
                  alt="火炮"
                  class="seat-icon-svg"
                />
              </div>
            </div>
            <div class="seat-info">
              <h3 class="seat-title">火炮席位</h3>
              <p class="seat-description">
                火炮操作控制、目标设定、<br />
                弹药管理、打击协同
              </p>
            </div>
            <div class="seat-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- 考评席位 -->
          <div
            class="seat-card evaluation-seat"
            @click="selectSeat('evaluation')"
          >
            <div class="seat-icon">
              <div class="icon-bg evaluation-bg">
                <img
                  src="../../assets/RATE.svg"
                  alt="考评"
                  class="seat-icon-svg"
                />
              </div>
            </div>
            <div class="seat-info">
              <h3 class="seat-title">考评席位</h3>
              <p class="seat-description">
                作战效果评估、专家评分、<br />
                演习数据分析、报告生成
              </p>
            </div>
            <div class="seat-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- 调试席位（隐藏，通过双击版本号开启）-->
          <div
            v-if="debugModeEnabled"
            class="seat-card debug-seat"
            @click="selectSeat('debug')"
          >
            <div class="seat-icon">
              <div class="icon-bg debug-bg">
                <i class="seat-symbol">🔧</i>
              </div>
            </div>
            <div class="seat-info">
              <h3 class="seat-title">调试席位</h3>
              <p class="seat-description">
                系统调试、数据测试、<br />
                组播配置、协议解析
              </p>
            </div>
            <div class="seat-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="system-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">系统版本：</span>
            <span
              class="info-value version-clickable"
              @click="enableDebugMode"
              :title="debugModeEnabled ? '调试模式已启用' : ''"
              >v2.0.0</span
            >
          </div>
          <div class="info-item">
            <span class="info-label">当前时间：</span>
            <span class="info-value">{{ currentTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">系统状态：</span>
            <span class="info-value status-ready">就绪</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ArrowRight } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 定义事件发射
const emit = defineEmits<{
  seatSelected: [seatType: string];
}>();

// 当前时间
const currentTime = ref("");

// 调试模式状态
const debugModeEnabled = ref(false);
let debugClickCount = 0;
let debugClickTimer: NodeJS.Timeout | null = null;

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 定时器
let timeInterval: NodeJS.Timeout | null = null;

// 启用调试模式
const enableDebugMode = () => {
  debugClickCount++;

  if (debugClickTimer) {
    clearTimeout(debugClickTimer);
  }

  debugClickTimer = setTimeout(() => {
    debugClickCount = 0;
  }, 500);

  if (debugClickCount === 2 && !debugModeEnabled.value) {
    debugModeEnabled.value = true;
    ElMessage.success({
      message: "调试模式已启用",
      duration: 2000,
    });
    console.log("[StartPage] 调试模式已启用");
    debugClickCount = 0;
  }
};

// 选择席位
const selectSeat = (seatType: string) => {
  console.log(`[StartPage] 选择席位: ${seatType}`);
  emit("seatSelected", seatType);
};

// 生命周期
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  console.log("[StartPage] 开始页已加载");
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
  if (debugClickTimer) {
    clearTimeout(debugClickTimer);
    debugClickTimer = null;
  }
  console.log("[StartPage] 开始页已卸载");
});
</script>

<style scoped>
.start-page {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
      135deg,
      rgba(176, 218, 232, 0.15) 0%,
      rgba(135, 206, 235, 0.2) 50%,
      rgba(173, 216, 230, 0.15) 100%
    ),
    #e8f4f8;
}

/* 左侧背景区域 */
.left-section {
  width: 60%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(240, 248, 255, 0.95) 0%,
    rgba(224, 242, 254, 0.9) 100%
  );
}

.background-image {
  width: 100%;
  height: 100%;
  background: url("../../assets/images/bg6.png") center center no-repeat;
  background-position: center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧内容区域 */
.right-section {
  width: 40%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 60px;
  background: linear-gradient(
    135deg,
    rgba(240, 248, 255, 0.95) 0%,
    rgba(224, 242, 254, 0.9) 100%
  );
  position: relative;
  overflow-y: auto;
  z-index: 1;
}

.right-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at top right,
    rgba(135, 206, 235, 0.1) 0%,
    transparent 60%
  );
  pointer-events: none;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 50px;
  z-index: 1;
  position: relative;
}

.system-title {
  font-size: 46px;
  font-weight: 800;
  color: #0c4a6e;
  margin: 0 0 20px 0;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  position: relative;
}

.system-title::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
  border-radius: 2px;
}

.system-subtitle {
  font-size: 18px;
  color: #0369a1;
  margin: 0;
  font-weight: 500;
  letter-spacing: 1px;
}

/* 席位选择区域 */
.seats-container {
  z-index: 1;
  margin-bottom: 40px;
  width: 100%;
}

.seats-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

/* 席位卡片 */
.seat-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(1.5);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid rgba(135, 206, 235, 0.3);
  box-shadow: 0 4px 16px rgba(3, 105, 161, 0.12),
    0 2px 8px rgba(3, 105, 161, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.seat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: transparent;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.seat-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.seat-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 24px rgba(3, 105, 161, 0.2),
    0 4px 12px rgba(3, 105, 161, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(14, 165, 233, 0.4);
}

.seat-card:hover::after {
  opacity: 1;
}

.seat-card:active {
  transform: translateY(-4px) scale(1.01);
  transition: all 0.1s ease;
}

/* 席位图标 */
.seat-icon {
  flex-shrink: 0;
}

.icon-bg {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(3, 105, 161, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.seat-icon-svg {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  z-index: 1;
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.seat-card:hover .seat-icon-svg {
  transform: scale(1.1) rotate(5deg);
}

.icon-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

.seat-card:hover .icon-bg {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.uav-bg {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
}

.artillery-bg {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
}

.evaluation-bg {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
}

.debug-bg {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

.seat-symbol {
  font-size: 32px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
  position: relative;
}

/* 席位信息 */
.seat-info {
  flex: 1;
}

.seat-title {
  font-size: 20px;
  font-weight: 700;
  color: #0c4a6e;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.seat-card:hover .seat-title {
  color: #075985;
}

.seat-description {
  font-size: 13px;
  color: #0369a1;
  margin: 0;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.seat-card:hover .seat-description {
  color: #0c4a6e;
}

/* 箭头 */
.seat-arrow {
  flex-shrink: 0;
  color: #7dd3fc;
  font-size: 22px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.seat-card:hover .seat-arrow {
  color: #0ea5e9;
  transform: translateX(6px) scale(1.15);
}

/* 特定席位的悬停效果 */
.uav-seat:hover::before {
  background: linear-gradient(180deg, #0ea5e9 0%, #06b6d4 100%);
}

.artillery-seat:hover::before {
  background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%);
}

.evaluation-seat:hover::before {
  background: linear-gradient(180deg, #14b8a6 0%, #0d9488 100%);
}

.debug-seat:hover::before {
  background: linear-gradient(180deg, #f59e0b 0%, #f97316 100%);
}

/* 系统信息 */
.system-info {
  z-index: 1;
  background: rgba(240, 249, 255, 0.85);
  backdrop-filter: blur(15px) saturate(1.3);
  border-radius: 12px;
  padding: 20px 32px;
  border: 2px solid rgba(135, 206, 235, 0.3);
  box-shadow: 0 3px 12px rgba(3, 105, 161, 0.12),
    0 2px 6px rgba(3, 105, 161, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  width: 100%;
  max-width: 500px;
}

.info-grid {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #0369a1;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #0c4a6e;
  font-weight: 700;
  font-family: "Courier New", monospace;
}

.version-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.version-clickable:hover {
  color: #0ea5e9;
}

.status-ready {
  color: #14b8a6 !important;
  font-weight: 800;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .start-page {
    flex-direction: column;
  }

  .left-section {
    width: 100%;
    height: 40vh;
  }

  .right-section {
    width: 100%;
    height: auto;
    min-height: 60vh;
    padding: 40px 30px;
  }
}

@media (max-width: 768px) {
  .system-title {
    font-size: 32px;
  }

  .system-subtitle {
    font-size: 16px;
  }

  .left-section {
    height: 30vh;
  }

  .right-section {
    padding: 30px 20px;
  }

  .seats-grid {
    gap: 16px;
  }

  .seat-card {
    padding: 20px;
  }

  .icon-bg {
    width: 60px;
    height: 60px;
  }

  .seat-icon-svg {
    width: 35px;
    height: 35px;
  }

  .seat-title {
    font-size: 18px;
  }

  .seat-description {
    font-size: 12px;
  }

  .info-grid {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .system-title {
    font-size: 26px;
  }

  .system-subtitle {
    font-size: 14px;
  }

  .right-section {
    padding: 20px 16px;
  }

  .seat-card {
    padding: 16px;
    gap: 16px;
  }

  .icon-bg {
    width: 50px;
    height: 50px;
  }

  .seat-icon-svg {
    width: 30px;
    height: 30px;
  }

  .seat-symbol {
    font-size: 20px;
  }

  .seat-title {
    font-size: 16px;
  }
}
</style>
