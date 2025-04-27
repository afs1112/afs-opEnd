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
