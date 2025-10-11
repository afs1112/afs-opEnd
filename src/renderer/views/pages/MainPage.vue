<template>
  <div class="main-container h-full">
    <!-- 开始页 -->
    <StartPage
      v-if="currentPage === 'start'"
      @seat-selected="handleSeatSelected"
    />

    <!-- 无人机席位页面 -->
    <div v-else-if="currentPage === 'uav'" class="page-wrapper no-header">
      <div class="page-content">
        <UavOperationPage @back-to-start="backToStart" />
      </div>
    </div>

    <!-- 火炮席位页面 -->
    <div v-else-if="currentPage === 'artillery'" class="page-wrapper no-header">
      <div class="page-content">
        <ArtilleryOperationPage @back-to-start="backToStart" />
      </div>
    </div>

    <!-- 考评席位页面 -->
    <div
      v-else-if="currentPage === 'evaluation'"
      class="page-wrapper no-header"
    >
      <div class="page-content">
        <EvaluationPage @back-to-start="backToStart" />
      </div>
    </div>

    <!-- 调试席位页面（原有的标签页面） -->
    <div v-else-if="currentPage === 'debug'" class="page-wrapper">
      <div class="page-header">
        <el-button
          type="primary"
          size="small"
          @click="backToStart"
          class="back-button"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回席位选择
        </el-button>
        <h2 class="page-title">调试席位</h2>
      </div>
      <div class="page-content debug-content">
        <el-tabs
          v-model="activeTab"
          class="flex-1 flex flex-col"
          tab-position="top"
        >
          <el-tab-pane label="设置与测试" name="multicast" class="h-full">
            <MulticastPage />
          </el-tab-pane>
          <el-tab-pane label="无人机操作" name="uav">
            <UavOperationPage />
          </el-tab-pane>
          <el-tab-pane label="火炮操作" name="artillery">
            <ArtilleryOperationPage />
          </el-tab-pane>
          <el-tab-pane label="命令测试" name="command">
            <CommandTestPage />
          </el-tab-pane>
          <el-tab-pane label="作战测评" name="evaluation">
            <EvaluationPage />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import StartPage from "./StartPage.vue";
import MulticastPage from "./MulticastPage.vue";
import UavOperationPage from "./UavOperationPage.vue";
import ArtilleryOperationPage from "./ArtilleryOperationPage.vue";
import CommandTestPage from "./CommandTestPage.vue";
import EvaluationPage from "./EvaluationPage.vue";

// 当前页面状态
const currentPage = ref("start");
const activeTab = ref("multicast");

// 处理席位选择
const handleSeatSelected = (seatType: string) => {
  console.log(`[MainPage] 选择席位: ${seatType}`);
  currentPage.value = seatType;

  // 如果是调试席位，重置到第一个标签页
  if (seatType === "debug") {
    activeTab.value = "multicast";
  }
};

// 返回开始页
const backToStart = () => {
  console.log("[MainPage] 返回席位选择页面");
  currentPage.value = "start";
};
</script>

<style scoped>
.main-container {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 页面包装器 */
.page-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e1e8ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  z-index: 10;
  flex-shrink: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.back-button:hover {
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

/* 页面内容 */
.page-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 调试页面特殊样式 */
.debug-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.debug-content .el-tabs {
  height: 100%;
}

.debug-content .el-tabs__content {
  height: calc(100% - 40px);
  overflow: hidden;
}

.debug-content .el-tab-pane {
  height: 100%;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 10px 16px;
  }

  .page-title {
    font-size: 16px;
  }

  .back-button {
    font-size: 12px;
    padding: 5px 10px;
  }
}
</style>
