<template>
  <div class="start-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="system-title">军事仿真操作系统</h1>
      <p class="system-subtitle">请选择您的操作席位</p>
    </div>

    <!-- 席位选择区域 -->
    <div class="seats-container">
      <div class="seats-grid">
        <!-- 无人机席位 -->
        <div class="seat-card uav-seat" @click="selectSeat('uav')">
          <div class="seat-icon">
            <div class="icon-bg uav-bg">
              <i class="seat-symbol">✈</i>
            </div>
          </div>
          <div class="seat-info">
            <h3 class="seat-title">无人机席位</h3>
            <p class="seat-description">
              无人机操作控制、传感器管理、<br />
              航线规划、目标跟踪
            </p>
          </div>
          <div class="seat-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <!-- 火炮席位 -->
        <div class="seat-card artillery-seat" @click="selectSeat('artillery')">
          <div class="seat-icon">
            <div class="icon-bg artillery-bg">
              <i class="seat-symbol">🔥</i>
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
              <i class="seat-symbol">📊</i>
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

        <!-- 调试席位 -->
        <div class="seat-card debug-seat" @click="selectSeat('debug')">
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
          <span class="info-value">v2.0.0</span>
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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ArrowRight } from "@element-plus/icons-vue";

// 定义事件发射
const emit = defineEmits<{
  seatSelected: [seatType: string];
}>();

// 当前时间
const currentTime = ref("");

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
  console.log("[StartPage] 开始页已卸载");
});
</script>

<style scoped>
.start-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.start-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
      circle at 20% 50%,
      rgba(120, 119, 198, 0.3) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 40% 80%,
      rgba(120, 119, 198, 0.2) 0%,
      transparent 50%
    );
  pointer-events: none;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 60px;
  z-index: 1;
}

.system-title {
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.system-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 席位选择区域 */
.seats-container {
  z-index: 1;
  margin-bottom: 40px;
}

.seats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 800px;
}

/* 席位卡片 */
.seat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 32px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  min-height: 120px;
}

.seat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  pointer-events: none;
}

.seat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.98);
}

.seat-card:active {
  transform: translateY(-4px) scale(1.01);
}

/* 席位图标 */
.seat-icon {
  flex-shrink: 0;
}

.icon-bg {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
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
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
}

.uav-bg {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.artillery-bg {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.evaluation-bg {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.debug-bg {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
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
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.seat-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* 箭头 */
.seat-arrow {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 24px;
  transition: all 0.3s ease;
}

.seat-card:hover .seat-arrow {
  color: #475569;
  transform: translateX(4px);
}

/* 特定席位的悬停效果 */
.uav-seat:hover {
  border-left: 4px solid #4facfe;
}

.artillery-seat:hover {
  border-left: 4px solid #f5576c;
}

.evaluation-seat:hover {
  border-left: 4px solid #4ecdc4;
}

.debug-seat:hover {
  border-left: 4px solid #fcb69f;
}

/* 系统信息 */
.system-info {
  z-index: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: white;
  font-weight: 600;
  font-family: "Courier New", monospace;
}

.status-ready {
  color: #4ade80 !important;
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-title {
    font-size: 36px;
  }

  .system-subtitle {
    font-size: 18px;
  }

  .seats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: 400px;
  }

  .seat-card {
    padding: 24px 20px;
    min-height: 100px;
  }

  .icon-bg {
    width: 60px;
    height: 60px;
  }

  .seat-symbol {
    font-size: 24px;
  }

  .seat-title {
    font-size: 20px;
  }

  .seat-description {
    font-size: 13px;
  }

  .info-grid {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .start-page {
    padding: 16px;
  }

  .system-title {
    font-size: 28px;
  }

  .seat-card {
    padding: 20px 16px;
    gap: 16px;
  }

  .icon-bg {
    width: 50px;
    height: 50px;
  }

  .seat-symbol {
    font-size: 20px;
  }

  .seat-title {
    font-size: 18px;
  }
}
</style>
