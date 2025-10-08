import { ElMessage } from "element-plus";

class CommonService {
  exportJson = async (data, title = "users") => {
    try {
      const exportData = {
        [title]: JSON.parse(JSON.stringify(data)),
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };
      const filePath = await window.electronAPI.export.showSaveDialog({
        title: `Export ${title} data`,
        defaultFileName: `${title}_export_${new Date()
          .toISOString()
          .slice(0, 10)}.json`,
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      });

      if (!filePath) return;

      const result = await window.electronAPI.export.exportFile(
        filePath,
        exportData
      );

      if (result.success) {
        ElMessage.success({
          message: `Successfully exported to ${result.path}`,
          duration: 5000,
          showClose: true,
        });
      } else {
        ElMessage.error(`Export failed: ${result.error}`);
      }
    } catch (error) {
      ElMessage.error(`Export error: ${error.message}`);
    }
  };
}

class PlatformHeartbeatService {
  /**
   * 启动平台心跳发送
   * @param platformName 平台名称
   * @param intervalMs 心跳间隔（毫秒），默认3000ms（3秒）
   */
  async startHeartbeat(
    platformName: string,
    intervalMs: number = 3000
  ): Promise<boolean> {
    try {
      const result = await window.electronAPI.multicast.startPlatformHeartbeat({
        platformName,
        intervalMs,
      });

      if (result.success) {
        console.log(`[HeartbeatService] ✅ 启动平台心跳成功: ${platformName}`);
        return true;
      } else {
        console.error(
          `[HeartbeatService] ❌ 启动平台心跳失败: ${result.error}`
        );
        ElMessage.error(`启动平台心跳失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`[HeartbeatService] ❌ 启动平台心跳异常:`, error);
      ElMessage.error(
        `启动平台心跳异常: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  /**
   * 停止平台心跳发送
   */
  async stopHeartbeat(): Promise<boolean> {
    try {
      const result = await window.electronAPI.multicast.stopPlatformHeartbeat();

      if (result.success) {
        console.log(`[HeartbeatService] ✅ 停止平台心跳成功`);
        return true;
      } else {
        console.error(
          `[HeartbeatService] ❌ 停止平台心跳失败: ${result.error}`
        );
        return false;
      }
    } catch (error) {
      console.error(`[HeartbeatService] ❌ 停止平台心跳异常:`, error);
      return false;
    }
  }

  /**
   * 获取心跳状态
   */
  async getHeartbeatStatus(): Promise<{
    isRunning: boolean;
    platformName: string | null;
  } | null> {
    try {
      const result = await window.electronAPI.multicast.getHeartbeatStatus();

      if (result.success) {
        return result.data;
      } else {
        console.error(
          `[HeartbeatService] ❌ 获取心跳状态失败: ${result.error}`
        );
        return null;
      }
    } catch (error) {
      console.error(`[HeartbeatService] ❌ 获取心跳状态异常:`, error);
      return null;
    }
  }
}

class PlatformImageService {
  private imageCache: Map<string, string> = new Map();

  /**
   * 获取平台图片的Base64数据
   * @param platformType 平台类型（如UAV01、Artillery等）
   */
  async getPlatformImageData(platformType: string): Promise<string | null> {
    try {
      // 先检查缓存
      if (this.imageCache.has(platformType)) {
        console.log(`[ImageService] 💼 从缓存中获取图片: ${platformType}`);
        return this.imageCache.get(platformType) || null;
      }

      console.log(`[ImageService] 🔍 加载平台图片: ${platformType}`);
      const result = await window.electronAPI.images.getPlatformImageData(
        platformType
      );

      if (result.success && result.exists && result.data) {
        // 缓存图片数据
        this.imageCache.set(platformType, result.data);
        console.log(`[ImageService] ✅ 成功加载平台图片: ${platformType}`);
        return result.data;
      } else {
        console.log(`[ImageService] ❌ 平台图片不存在: ${platformType}`);
        return null;
      }
    } catch (error) {
      console.error(`[ImageService] 加载平台图片失败: ${platformType}`, error);
      return null;
    }
  }

  /**
   * 获取平台图片的文件路径
   * @param platformType 平台类型
   */
  async getPlatformImagePath(platformType: string): Promise<string | null> {
    try {
      const result = await window.electronAPI.images.getPlatformImagePath(
        platformType
      );

      if (result.success && result.exists && result.path) {
        console.log(
          `[ImageService] ✅ 找到平台图片路径: ${platformType} -> ${result.path}`
        );
        return result.path;
      } else {
        console.log(`[ImageService] ❌ 平台图片路径不存在: ${platformType}`);
        return null;
      }
    } catch (error) {
      console.error(
        `[ImageService] 获取平台图片路径失败: ${platformType}`,
        error
      );
      return null;
    }
  }

  /**
   * 清理图片缓存
   */
  clearCache(): void {
    this.imageCache.clear();
    console.log(`[ImageService] 🧹 图片缓存已清理`);
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.imageCache.size;
  }

  /**
   * 预加载常用平台图片
   */
  async preloadCommonPlatformImages(): Promise<void> {
    const commonPlatformTypes = [
      "UAV01",
      "Artillery",
      "ROCKET_LAUNCHER",
      "CANNON",
      "RADAR",
      "SHIP",
    ];

    console.log(`[ImageService] 🚀 开始预加载常用平台图片...`);

    const promises = commonPlatformTypes.map((type) =>
      this.getPlatformImageData(type)
    );
    await Promise.allSettled(promises);

    console.log(
      `[ImageService] ✅ 预加载完成，缓存中共有 ${this.getCacheSize()} 个图片`
    );
  }
}

export const commonService = new CommonService();
export const platformHeartbeatService = new PlatformHeartbeatService();
export const platformImageService = new PlatformImageService();
