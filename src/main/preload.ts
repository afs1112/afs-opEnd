import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  db: {
    query: (sql, params) => ipcRenderer.invoke("database:query", sql, params),
    execute: (sql, params) =>
      ipcRenderer.invoke("database:execute", sql, params),
    reset: () => ipcRenderer.invoke("database:reset"),
  },
  showSaveDialog: async (options: any) => {
    return await ipcRenderer.invoke("show-save-dialog", options);
  },

  exportToFile: async (filePath: string, data: any) => {
    return await ipcRenderer.invoke("export-file", {
      filePath,
      data: ensureSerializable(data),
    });
  },
  exportDatabase: async () => {
    return await ipcRenderer.invoke("export-database");
  },
  exportSqlQuery: async () => {
    return await ipcRenderer.invoke("export-sql-query");
  },
  importFromJson: () => ipcRenderer.invoke("import:json"),
  importDatabaseFile: () => ipcRenderer.invoke("import:database"),
  importFromSqlFile: () => ipcRenderer.invoke("import:sql"),

  // 组播相关
  multicast: {
    start: () => ipcRenderer.invoke("multicast:start"),
    stop: () => ipcRenderer.invoke("multicast:stop"),
    getStatus: () => ipcRenderer.invoke("multicast:getStatus"),
    getConfig: () => ipcRenderer.invoke("multicast:getConfig"),
    updateConfig: (address: string, port: number, interfaceAddr: string) => 
      ipcRenderer.invoke("multicast:updateConfig", address, port, interfaceAddr),
    sendPlatformCmd: (data: any) => ipcRenderer.invoke("multicast:sendPlatformCmd", data),
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
