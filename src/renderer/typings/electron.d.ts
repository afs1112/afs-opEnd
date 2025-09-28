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

export interface UavIdRecord {
  id: string;
  generatedAt: string;
  usedAt?: string;
  description?: string;
}

declare global {
  interface Window {
    electronAPI: {
      export: {
        showSaveDialog: (options: any) => Promise<string | undefined>;
        exportFile: (
          filePath: string,
          data: any
        ) => Promise<{ success: boolean; path?: string; error?: string }>;
      };

      multicast: {
        start: () => Promise<{ success: boolean; error?: string }>;
        stop: () => Promise<{ success: boolean; error?: string }>;
        getStatus: () => Promise<MulticastStatus>;
        getConfig: () => Promise<{
          address: string;
          port: number;
          interfaceAddress: string;
        }>;
        updateConfig: (
          address: string,
          port: number,
          interfaceAddr: string
        ) => Promise<{ success: boolean; error?: string }>;
        onPacket: (callback: (packet: MulticastPacket) => void) => void;
        onError: (callback: (error: string) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
      nav: {
        openNavigation: () => Promise<{
          success: boolean;
          error?: string;
          message?: string;
          uavId?: string;
        }>;
        getConfig: () => Promise<{
          success: boolean;
          config?: any;
          error?: string;
        }>;
        updateConfig: (
          config: any
        ) => Promise<{ success: boolean; message?: string; error?: string }>;
        resetConfig: () => Promise<{
          success: boolean;
          message?: string;
          error?: string;
        }>;
        validateConfig: () => Promise<{
          success: boolean;
          validation?: { valid: boolean; errors: string[] };
          error?: string;
        }>;
        getNavPath: () => Promise<{
          success: boolean;
          path?: string;
          exists?: boolean;
          error?: string;
        }>;
      };
      uav: {
        generateId: () => Promise<{
          success: boolean;
          uavId?: string;
          error?: string;
        }>;
        getCurrentId: () => Promise<{
          success: boolean;
          uavId?: string;
          error?: string;
        }>;
        setCurrentId: (
          uavId: string,
          description?: string
        ) => Promise<{ success: boolean; message?: string; error?: string }>;
        getHistory: () => Promise<{
          success: boolean;
          history?: UavIdRecord[];
          error?: string;
        }>;
        prepareForNavigation: () => Promise<{
          success: boolean;
          uavId?: string;
          error?: string;
        }>;
      };
    };
  }
}
