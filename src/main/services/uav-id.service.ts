import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

export interface UavIdRecord {
  id: string;
  generatedAt: string;
  usedAt?: string;
  description?: string;
}

export interface UavIdConfig {
  currentId: string | null;
  history: UavIdRecord[];
  settings: {
    autoGenerate: boolean;
    idLength: number;
    prefix: string;
  };
}

class UavIdService {
  private config: UavIdConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = this.getConfigPath();
  }

  private getConfigPath(): string {
    // 获取可执行文件所在目录
    let executableDir: string;
    
    if (app.isPackaged) {
      executableDir = require('path').dirname(process.execPath);
      
      if (process.platform === 'darwin') {
        const appBundle = require('path').dirname(require('path').dirname(executableDir));
        executableDir = require('path').dirname(appBundle);
      }
    } else {
      executableDir = app.getAppPath();
    }

    return join(executableDir, 'uav-id-config.json');
  }

  /**
   * 生成四位随机数ID
   */
  public generateUavId(): string {
    // 生成1000-9999之间的随机数
    const id = Math.floor(Math.random() * 9000) + 1000;
    return id.toString();
  }

  /**
   * 加载配置
   */
  public loadConfig(): UavIdConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        console.log(`[UavId] 配置文件已加载: ${this.configPath}`);
      } else {
        this.config = this.getDefaultConfig();
        this.saveConfig();
        console.log(`[UavId] 创建默认配置文件: ${this.configPath}`);
      }
      
      return this.config!;
    } catch (error) {
      console.error('[UavId] 加载配置文件失败:', error);
      this.config = this.getDefaultConfig();
      return this.config!;
    }
  }

  /**
   * 保存配置
   */
  public saveConfig(): boolean {
    try {
      if (!this.config) {
        this.config = this.getDefaultConfig();
      }

      const configData = JSON.stringify(this.config, null, 2);
      
      const configDir = require('path').dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, configData, 'utf8');
      console.log(`[UavId] 配置文件已保存: ${this.configPath}`);
      
      return true;
    } catch (error) {
      console.error('[UavId] 保存配置文件失败:', error);
      return false;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): UavIdConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  /**
   * 获取当前UavId，如果没有则生成新的
   */
  public getCurrentUavId(): string {
    const config = this.getConfig();
    
    if (!config.currentId || config.settings.autoGenerate) {
      const newId = this.generateUavId();
      this.setCurrentUavId(newId);
      return newId;
    }
    
    return config.currentId;
  }

  /**
   * 设置当前UavId
   */
  public setCurrentUavId(id: string, description?: string): boolean {
    try {
      const config = this.getConfig();
      const now = new Date().toISOString();
      
      // 更新当前ID
      config.currentId = id;
      
      // 添加到历史记录
      const record: UavIdRecord = {
        id,
        generatedAt: now,
        description: description || `自动生成的UavId`
      };
      
      config.history.push(record);
      
      // 保持历史记录不超过100条
      if (config.history.length > 100) {
        config.history = config.history.slice(-100);
      }
      
      this.config = config;
      return this.saveConfig();
    } catch (error) {
      console.error('[UavId] 设置UavId失败:', error);
      return false;
    }
  }

  /**
   * 标记当前ID为已使用
   */
  public markCurrentIdAsUsed(): boolean {
    try {
      const config = this.getConfig();
      
      if (config.currentId && config.history.length > 0) {
        const lastRecord = config.history[config.history.length - 1];
        if (lastRecord.id === config.currentId) {
          lastRecord.usedAt = new Date().toISOString();
          this.config = config;
          return this.saveConfig();
        }
      }
      
      return false;
    } catch (error) {
      console.error('[UavId] 标记ID为已使用失败:', error);
      return false;
    }
  }

  /**
   * 获取ID历史记录
   */
  public getHistory(): UavIdRecord[] {
    const config = this.getConfig();
    return config.history;
  }

  /**
   * 清除历史记录
   */
  public clearHistory(): boolean {
    try {
      const config = this.getConfig();
      config.history = [];
      this.config = config;
      return this.saveConfig();
    } catch (error) {
      console.error('[UavId] 清除历史记录失败:', error);
      return false;
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): UavIdConfig {
    return {
      currentId: null,
      history: [],
      settings: {
        autoGenerate: true,
        idLength: 4,
        prefix: ""
      }
    };
  }

  /**
   * 更新Nav配置文件中的ID1
   */
  public updateNavConfigId(uavId: string): boolean {
    try {
      // 获取Nav配置文件路径
      let navConfigPath: string;
      
      if (app.isPackaged) {
        const execDir = require('path').dirname(process.execPath);
        
        if (process.platform === 'darwin') {
          const appBundle = require('path').dirname(require('path').dirname(execDir));
          const appParentDir = require('path').dirname(appBundle);
          navConfigPath = join(appParentDir, 'Nav', 'data', 'config.ini');
        } else {
          navConfigPath = join(execDir, 'Nav', 'data', 'config.ini');
        }
      } else {
        // 开发环境：使用项目根目录
        navConfigPath = join(app.getAppPath(), 'Nav', 'data', 'config.ini');
      }

      console.log(`[UavId] Nav配置文件路径: ${navConfigPath}`);

      if (!fs.existsSync(navConfigPath)) {
        console.error(`[UavId] Nav配置文件不存在: ${navConfigPath}`);
        
        // 在开发环境中，如果配置文件不存在，尝试创建一个默认的
        if (!app.isPackaged) {
          console.log(`[UavId] 尝试创建默认Nav配置文件...`);
          
          const navDir = require('path').dirname(navConfigPath);
          if (!fs.existsSync(navDir)) {
            fs.mkdirSync(navDir, { recursive: true });
          }
          
          const defaultConfig = `[Title]
name=导航监控软件-B-20220417-1
[Config]
CarID=1
[Uav_list]
num=1
ID1=${uavId}
name1=UA`;
          
          fs.writeFileSync(navConfigPath, defaultConfig, 'utf8');
          console.log(`[UavId] 默认Nav配置文件已创建: ${navConfigPath}`);
          return true;
        }
        
        return false;
      }

      // 读取配置文件
      const configContent = fs.readFileSync(navConfigPath, 'utf8');
      
      // 解析INI格式并更新ID1
      const lines = configContent.split('\n');
      let updated = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('ID1=')) {
          lines[i] = `ID1=${uavId}`;
          updated = true;
          console.log(`[UavId] 更新ID1: ${uavId}`);
          break;
        }
      }

      if (!updated) {
        console.error('[UavId] 未找到ID1配置项');
        return false;
      }

      // 写回文件
      const updatedContent = lines.join('\n');
      fs.writeFileSync(navConfigPath, updatedContent, 'utf8');
      
      console.log(`[UavId] Nav配置文件已更新: ${navConfigPath}`);
      return true;
      
    } catch (error) {
      console.error('[UavId] 更新Nav配置文件失败:', error);
      return false;
    }
  }

  /**
   * 准备启动导航软件（生成ID并更新配置）
   */
  public prepareForNavigation(): { success: boolean; uavId?: string; error?: string } {
    try {
      // 生成新的UavId
      const uavId = this.getCurrentUavId();
      console.log(`[UavId] 生成UavId: ${uavId}`);
      
      // 更新Nav配置文件
      const updateSuccess = this.updateNavConfigId(uavId);
      
      if (!updateSuccess) {
        return {
          success: false,
          error: '更新Nav配置文件失败'
        };
      }
      
      // 标记为已使用
      this.markCurrentIdAsUsed();
      
      return {
        success: true,
        uavId
      };
      
    } catch (error: any) {
      console.error('[UavId] 准备导航启动失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const uavIdService = new UavIdService();