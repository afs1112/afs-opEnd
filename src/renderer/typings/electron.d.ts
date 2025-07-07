// src/electron.d.ts
export {};

export interface MulticastPacket {
  timestamp: number;
  source: string;
  data: Buffer;
  dataString: string;
  size: number;
}

export interface MulticastStatus {
  isListening: boolean;
  address: string;
  port: number;
}

declare global {
  interface Window {
    electronAPI: {
      database: {
        query: (sql: string, params?: any[]) => Promise<any[]>;
        execute: (sql: string, params?: any[]) => Promise<{ success: boolean; lastId?: number; changes?: number; error?: string }>;
        reset: () => Promise<{ success: boolean; error?: string }>;
      };
      export: {
        showSaveDialog: (options: any) => Promise<string | undefined>;
        exportFile: (filePath: string, data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
        exportDatabase: () => Promise<{ success: boolean; path?: string; size?: number; error?: string }>;
        exportSqlQuery: () => Promise<{ success: boolean; path?: string; error?: string }>;
      };
      import: {
        showOpenDialog: (options: any) => Promise<string[] | undefined>;
        importFromJsonFile: () => Promise<{ success: boolean; error?: string }>;
        importDatabaseFile: () => Promise<{ success: boolean; error?: string }>;
        importFromSqlFile: () => Promise<{ success: boolean; error?: string }>;
      };
      multicast: {
        start: () => Promise<{ success: boolean; error?: string }>;
        stop: () => Promise<{ success: boolean; error?: string }>;
        getStatus: () => Promise<MulticastStatus>;
        getConfig: () => Promise<{ address: string; port: number; interfaceAddress: string }>;
        updateConfig: (address: string, port: number, interfaceAddr: string) => Promise<{ success: boolean; error?: string }>;
        onPacket: (callback: (packet: MulticastPacket) => void) => void;
        onError: (callback: (error: string) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}
