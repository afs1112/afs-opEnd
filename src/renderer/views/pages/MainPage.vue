<template>
  <div class="h-full flex flex-col">
    <el-tabs v-model="activeTab" class="flex-1 flex flex-col" tab-position="top">
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
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MulticastPage from "./MulticastPage.vue";
import UavOperationPage from "./UavOperationPage.vue";
import ArtilleryOperationPage from "./ArtilleryOperationPage.vue";
import CommandTestPage from "./CommandTestPage.vue";

const activeTab = ref('multicast');
</script>

