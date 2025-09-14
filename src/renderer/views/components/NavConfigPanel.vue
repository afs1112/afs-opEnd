<template>
  <div class="nav-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>🧭 导航软件配置</span>
          <el-button type="primary" size="small" @click="loadConfig">
            刷新配置
          </el-button>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-loading-directive />
        <p>加载配置中...</p>
      </div>

      <div v-else class="config-content">
        <!-- 基本配置 -->
        <el-form :model="config" label-width="120px" size="small">
          <el-form-item label="启用导航">
            <el-switch 
              v-model="config.navigation.enabled"
              @change="onConfigChange"
            />
          </el-form-item>

          <el-form-item label="相对路径">
            <el-input 
              v-model="config.navigation.relativePath"
              placeholder="例: Nav/Nav.exe"
              @change="onConfigChange"
            />
          </el-form-item>

          <el-form-item label="描述">
            <el-input 
              v-model="config.navigation.description"
              @change="onConfigChange"
            />
          </el-form-item>
        </el-form>

        <!-- 路径状态 -->
        <div class="path-status">
          <h4>📂 路径状态</h4>
          <div class="status-item">
            <span class="label">当前路径:</span>
            <span :class="pathStatus.exists ? 'path-exists' : 'path-missing'">
              {{ pathStatus.path || '未配置' }}
            </span>
            <el-tag :type="pathStatus.exists ? 'success' : 'danger'" size="small">
              {{ pathStatus.exists ? '存在' : '不存在' }}
            </el-tag>
          </div>
          <el-button type="info" size="small" @click="checkPath">
            检查路径
          </el-button>
        </div>

        <!-- 平台配置 -->
        <div class="platform-config">
          <h4>🖥️ 平台配置</h4>
          <el-tabs v-model="activePlatform" type="card" size="small">
            <el-tab-pane 
              v-for="(platformConfig, platform) in config.navigation.platform"
              :key="platform"
              :label="getPlatformLabel(platform)"
              :name="platform"
            >
              <el-form :model="platformConfig" label-width="100px" size="small">
                <el-form-item label="可执行文件">
                  <el-input 
                    v-model="platformConfig.executable"
                    @change="onConfigChange"
                  />
                </el-form-item>
                <el-form-item label="相对路径">
                  <el-input 
                    v-model="platformConfig.relativePath"
                    @change="onConfigChange"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 备用路径 -->
        <div class="fallback-paths">
          <h4>🔄 备用路径</h4>
          <div 
            v-for="(path, index) in config.navigation.fallbackPaths"
            :key="index"
            class="fallback-item"
          >
            <el-input 
              v-model="config.navigation.fallbackPaths[index]"
              size="small"
              @change="onConfigChange"
            />
            <el-button 
              type="danger" 
              size="small" 
              @click="removeFallbackPath(index)"
            >
              删除
            </el-button>
          </div>
          <el-button type="success" size="small" @click="addFallbackPath">
            添加备用路径
          </el-button>
        </div>

        <!-- 启动选项 -->
        <div class="startup-options">
          <h4>⚙️ 启动选项</h4>
          <el-form :model="config.navigation.startupOptions" label-width="120px" size="small">
            <el-form-item label="分离进程">
              <el-switch 
                v-model="config.navigation.startupOptions.detached"
                @change="onConfigChange"
              />
            </el-form-item>
            <el-form-item label="标准输入输出">
              <el-select 
                v-model="config.navigation.startupOptions.stdio"
                @change="onConfigChange"
              >
                <el-option label="ignore" value="ignore" />
                <el-option label="pipe" value="pipe" />
                <el-option label="inherit" value="inherit" />
              </el-select>
            </el-form-item>
            <el-form-item label="Windows隐藏">
              <el-switch 
                v-model="config.navigation.startupOptions.windowsHide"
                @change="onConfigChange"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <el-button type="primary" @click="saveConfig" :loading="saving">
            保存配置
          </el-button>
          <el-button type="warning" @click="resetConfig">
            重置为默认
          </el-button>
          <el-button type="success" @click="testNavigation">
            测试导航
          </el-button>
          <el-button type="info" @click="validateConfig">
            验证配置
          </el-button>
        </div>

        <!-- 配置信息 -->
        <div class="config-info">
          <h4>ℹ️ 配置信息</h4>
          <div class="info-item">
            <span class="label">版本:</span>
            <span>{{ config.version }}</span>
          </div>
          <div class="info-item">
            <span class="label">最后修改:</span>
            <span>{{ config.lastModified }}</span>
          </div>
          <div class="info-item">
            <span class="label">日志启用:</span>
            <el-tag :type="config.logging.enabled ? 'success' : 'info'" size="small">
              {{ config.logging.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const activePlatform = ref('win32');

const config = reactive({
  navigation: {
    enabled: true,
    relativePath: '',
    description: '',
    fallbackPaths: [],
    platform: {},
    startupOptions: {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    }
  },
  logging: {
    enabled: true,
    level: 'info'
  },
  version: '1.0.0',
  lastModified: ''
});

const pathStatus = reactive({
  path: '',
  exists: false
});

// 平台标签映射
const getPlatformLabel = (platform: string) => {
  const labels = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
  };
  return labels[platform] || platform;
};

// 加载配置
const loadConfig = async () => {
  loading.value = true;
  try {
    const result = await (window as any).electronAPI.nav.getConfig();
    if (result.success) {
      Object.assign(config, result.config);
      ElMessage.success('配置加载成功');
      await checkPath();
    } else {
      ElMessage.error(`加载配置失败: ${result.error}`);
    }
  } catch (error: any) {
    ElMessage.error(`加载配置时发生错误: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 保存配置
const saveConfig = async () => {
  saving.value = true;
  try {
    const result = await (window as any).electronAPI.nav.updateConfig(config);
    if (result.success) {
      ElMessage.success(result.message || '配置保存成功');
    } else {
      ElMessage.error(`保存配置失败: ${result.error}`);
    }
  } catch (error: any) {
    ElMessage.error(`保存配置时发生错误: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

// 重置配置
const resetConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置为默认配置吗？这将覆盖当前所有设置。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const result = await (window as any).electronAPI.nav.resetConfig();
    if (result.success) {
      ElMessage.success(result.message || '配置已重置');
      await loadConfig();
    } else {
      ElMessage.error(`重置配置失败: ${result.error}`);
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`重置配置时发生错误: ${error.message}`);
    }
  }
};

// 验证配置
const validateConfig = async () => {
  try {
    const result = await (window as any).electronAPI.nav.validateConfig();
    if (result.success) {
      const validation = result.validation;
      if (validation.valid) {
        ElMessage.success('配置验证通过');
      } else {
        ElMessage.warning(`配置验证失败: ${validation.errors.join(', ')}`);
      }
    } else {
      ElMessage.error(`验证配置失败: ${result.error}`);
    }
  } catch (error: any) {
    ElMessage.error(`验证配置时发生错误: ${error.message}`);
  }
};

// 检查路径
const checkPath = async () => {
  try {
    const result = await (window as any).electronAPI.nav.getNavPath();
    if (result.success) {
      pathStatus.path = result.path || '';
      pathStatus.exists = result.exists || false;
    } else {
      pathStatus.path = '';
      pathStatus.exists = false;
    }
  } catch (error: any) {
    ElMessage.error(`检查路径时发生错误: ${error.message}`);
  }
};

// 测试导航
const testNavigation = async () => {
  try {
    const result = await (window as any).electronAPI.nav.openNavigation();
    if (result.success) {
      ElMessage.success(result.message || '导航软件启动成功');
    } else {
      ElMessage.error(`启动导航软件失败: ${result.error}`);
    }
  } catch (error: any) {
    ElMessage.error(`测试导航时发生错误: ${error.message}`);
  }
};

// 添加备用路径
const addFallbackPath = () => {
  config.navigation.fallbackPaths.push('');
  onConfigChange();
};

// 删除备用路径
const removeFallbackPath = (index: number) => {
  config.navigation.fallbackPaths.splice(index, 1);
  onConfigChange();
};

// 配置变更处理
const onConfigChange = () => {
  // 可以在这里添加实时验证逻辑
};

// 组件挂载时加载配置
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.nav-config-panel {
  padding: 20px;
}

.config-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.config-content {
  space-y: 20px;
}

.config-content > div {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.config-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.path-status .status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.path-status .label {
  font-weight: 500;
  min-width: 80px;
}

.path-exists {
  color: #67c23a;
}

.path-missing {
  color: #f56c6c;
}

.fallback-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.fallback-item .el-input {
  flex: 1;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.config-info .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.config-info .label {
  font-weight: 500;
}

.el-tabs {
  margin-top: 10px;
}
</style>