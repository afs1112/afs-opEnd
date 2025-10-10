import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  export: {
    showSaveDialog: async (options: any) => {
      return await ipcRenderer.invoke("show-save-dialog", options);
    },
    exportFile: async (filePath: string, data: any) => {
      return await ipcRenderer.invoke("export-file", {
        filePath,
        data: ensureSerializable(data),
      });
    },
  },

  // 组播相关
  multicast: {
    start: () => ipcRenderer.invoke("multicast:start"),
    stop: () => ipcRenderer.invoke("multicast:stop"),
    getStatus: () => ipcRenderer.invoke("multicast:getStatus"),
    getConfig: () => ipcRenderer.invoke("multicast:getConfig"),
    updateConfig: (address: string, port: number, interfaceAddr: string) =>
      ipcRenderer.invoke(
        "multicast:updateConfig",
        address,
        port,
        interfaceAddr
      ),
    sendPlatformCmd: (data: any) =>
      ipcRenderer.invoke("multicast:sendPlatformCmd", data),
    syncTrajectory: (data: { platformName: string; uavId: number }) =>
      ipcRenderer.invoke("multicast:syncTrajectory", data),
    syncTrajectoryWithPlatformData: (data: {
      platformName: string;
      uavId: number;
      platformData: any;
    }) => ipcRenderer.invoke("multicast:syncTrajectoryWithPlatformData", data),

    // 平台心跳相关
    startPlatformHeartbeat: (data: {
      platformName: string;
      intervalMs?: number;
    }) => ipcRenderer.invoke("multicast:startPlatformHeartbeat", data),
    stopPlatformHeartbeat: (data?: { platformName?: string }) =>
      ipcRenderer.invoke("multicast:stopPlatformHeartbeat", data),
    getHeartbeatStatus: () =>
      ipcRenderer.invoke("multicast:getHeartbeatStatus"),

    onPacket: (callback: (packet: any) => void) => {
      ipcRenderer.on("multicast:packet", (_, packet) => callback(packet));
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on("multicast:error", (_, error) => callback(error));
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },

  // 导航软件相关
  nav: {
    openNavigation: () => ipcRenderer.invoke("nav:openNavigation"),
    getConfig: () => ipcRenderer.invoke("nav:getConfig"),
    updateConfig: (config: any) =>
      ipcRenderer.invoke("nav:updateConfig", config),
    resetConfig: () => ipcRenderer.invoke("nav:resetConfig"),
    validateConfig: () => ipcRenderer.invoke("nav:validateConfig"),
    getNavPath: () => ipcRenderer.invoke("nav:getNavPath"),
    getStatus: () => ipcRenderer.invoke("nav:getStatus"),
    stopNavigation: () => ipcRenderer.invoke("nav:stopNavigation"),
  },

  // UavId相关
  uav: {
    generateId: () => ipcRenderer.invoke("uav:generateId"),
    getCurrentId: () => ipcRenderer.invoke("uav:getCurrentId"),
    getSystemUavId: () => ipcRenderer.invoke("uav:getSystemUavId"), // 新增：获取系统启动时的UavId
    setCurrentId: (uavId: string, description?: string) =>
      ipcRenderer.invoke("uav:setCurrentId", uavId, description),
    getHistory: () => ipcRenderer.invoke("uav:getHistory"),
    prepareForNavigation: () => ipcRenderer.invoke("uav:prepareForNavigation"),
    enableAutoGenerate: () => ipcRenderer.invoke("uav:enableAutoGenerate"),
    disableAutoGenerate: () => ipcRenderer.invoke("uav:disableAutoGenerate"),
  },

  // 图片相关
  images: {
    getPlatformImagePath: (platformType: string) =>
      ipcRenderer.invoke("images:getPlatformImagePath", platformType),
    getPlatformImageData: (platformType: string) =>
      ipcRenderer.invoke("images:getPlatformImageData", platformType),
  },

  // 文档相关
  document: {
    readDocument: (filePath: string) =>
      ipcRenderer.invoke("document:readDocument", filePath),
  },

  // 对话框相关
  dialog: {
    showOpenDialog: (options: any) =>
      ipcRenderer.invoke("dialog:showOpenDialog", options),
  },

  // 暴露ipcRenderer用于监听事件
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.on(channel, listener);
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
});

function ensureSerializable(data: any): any {
  try {
    JSON.parse(JSON.stringify(data));
    return data;
  } catch (e) {
    console.error("Non-serializable data:", data);
    throw new Error("Data contains non-serializable values");
  }
}
