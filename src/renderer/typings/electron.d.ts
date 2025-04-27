// src/electron.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      db: {
        query<T = any>(sql: string, params?: any[]): Promise<T[]>;
        execute(
          sql: string,
          params?: any[]
        ): Promise<{
          success: boolean;
          lastId?: number;
          changes?: number;
          error?: string;
        }>;
        reset: () => Promise<void>;
      };
      showSaveDialog: (options: {
        title?: string;
        defaultFileName?: string;
        filters?: { name: string; extensions: string[] }[];
      }) => Promise<string | undefined>;

      exportToFile: (
        filePath: string,
        data: any
      ) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
      exportDatabase: () => Promise<{
        success: boolean;
        path?: string;
        error?: string;
        size?: number;
      }>;
      exportSqlQuery: () => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
      importFromJson: () => Promise<{
        success: boolean;
        error?: string;
      }>;
      importDatabaseFile: () => Promise<{
        success: boolean;
        error?: string;
      }>;
      importFromSqlFile: () => Promise<{
        success: boolean;
        error?: string;
      }>;
    };
  }
}
