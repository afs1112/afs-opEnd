import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

export interface NavConfig {
  navigation: {
    enabled: boolean;
    relativePath: string;
    description: string;
    fallbackPaths: string[];
    platform: {
      [key: string]: {
        executable: string;
        relativePath: string;
      };
    };
    startupOptions: {
      detached: boolean;
      stdio: string;
      windowsHide: boolean;
      setWorkingDirectory: boolean;
      inheritEnv: boolean;
    };
    timeout: number;
    retryAttempts: number;
  };
  logging: {
    enabled: boolean;
    level: string;
  };
  version: string;
  lastModified: string;
}

class NavConfigService {
  private config: NavConfig | null = null;
  private configPath: string;

  constructor() {
    // 配置文件路径：优先使用应用程序目录，其次使用用户数据目录
    this.configPath = this.getConfigPath();
  }

  private getConfigPath(): string {
    // 获取可执行文件所在目录
    let executableDir: string;
    
    if (app.isPackaged) {
      // 生产环境：获取可执行文件所在目录
      executableDir = require('path').dirname(process.execPath);
      
      if (process.platform === 'darwin') {
        // macOS: 可执行文件在 .app/Contents/MacOS/ 下，我们需要到 .app 的父目录
        const appBundle = require('path').dirname(require('path').dirname(executableDir));
        executableDir = require('path').dirname(appBundle);
      }
    } else {
      // 开发环境：使用项目根目录
      executableDir = app.getAppPath();
    }

    // 配置文件始终放在可执行文件同级目录
    const configPath = join(executableDir, 'nav-config.json');
    
    console.log(`[NavConfig] 配置文件路径: ${configPath}`);
    console.log(`[NavConfig] 可执行文件目录: ${executableDir}`);
    console.log(`[NavConfig] 是否打包: ${app.isPackaged}`);
    console.log(`[NavConfig] 平台: ${process.platform}`);
    
    return configPath;
  }

  /**
   * 加载配置文件
   */
  public loadConfig(): NavConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        
        if (this.config?.logging?.enabled) {
          console.log(`[NavConfig] 配置文件已加载: ${this.configPath}`);
        }
      } else {
        // 如果配置文件不存在，创建默认配置
        this.config = this.getDefaultConfig();
        this.saveConfig();
        
        console.log(`[NavConfig] 创建默认配置文件: ${this.configPath}`);
      }
      
      return this.config!;
    } catch (error) {
      console.error('[NavConfig] 加载配置文件失败:', error);
      
      // 返回默认配置
      this.config = this.getDefaultConfig();
      return this.config!;
    }
  }

  /**
   * 保存配置文件
   */
  public saveConfig(): boolean {
    try {
      if (!this.config) {
        this.config = this.getDefaultConfig();
      }

      // 更新最后修改时间
      this.config.lastModified = new Date().toISOString().split('T')[0];

      const configData = JSON.stringify(this.config, null, 2);
      
      // 确保目录存在
      const configDir = require('path').dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, configData, 'utf8');
      
      if (this.config.logging?.enabled) {
        console.log(`[NavConfig] 配置文件已保存: ${this.configPath}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('[NavConfig] 保存配置文件失败:', error);
      
      // 如果是权限问题，提供更详细的错误信息
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        console.error('[NavConfig] 权限不足，无法写入配置文件到:', this.configPath);
        console.error('[NavConfig] 请确保应用程序有写入权限或以管理员身份运行');
      }
      
      return false;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): NavConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<NavConfig>): boolean {
    try {
      this.config = { ...this.getConfig(), ...newConfig };
      return this.saveConfig();
    } catch (error) {
      console.error('[NavConfig] 更新配置失败:', error);
      return false;
    }
  }

  /**
   * 获取导航软件路径
   */
  public getNavPath(): string | null {
    const config = this.getConfig();
    
    if (!config.navigation.enabled) {
      return null;
    }

    // 获取应用程序目录
    let appDir: string;
    
    if (app.isPackaged) {
      const execDir = require('path').dirname(process.execPath);
      
      if (process.platform === 'darwin') {
        const appBundle = require('path').dirname(require('path').dirname(execDir));
        appDir = require('path').dirname(appBundle);
      } else {
        appDir = execDir;
      }
    } else {
      appDir = app.getAppPath();
    }

    // 获取平台特定配置
    const platformConfig = config.navigation.platform[process.platform];
    const relativePath = platformConfig?.relativePath || config.navigation.relativePath;

    // 尝试主路径
    const mainPath = join(appDir, relativePath);
    if (fs.existsSync(mainPath)) {
      return mainPath;
    }

    // 尝试备用路径
    for (const fallbackPath of config.navigation.fallbackPaths) {
      const fullPath = join(appDir, fallbackPath);
      if (fs.existsSync(fullPath)) {
        if (config.logging?.enabled) {
          console.log(`[NavConfig] 使用备用路径: ${fullPath}`);
        }
        return fullPath;
      }
    }

    return null;
  }

  /**
   * 获取导航软件工作目录
   */
  public getNavWorkingDirectory(): string | null {
    const navPath = this.getNavPath();
    if (!navPath) {
      return null;
    }
    
    // 返回导航软件所在的目录
    return require('path').dirname(navPath);
  }

  /**
   * 获取启动选项
   */
  public getStartupOptions() {
    const config = this.getConfig();
    return config.navigation.startupOptions;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): NavConfig {
    return {
      navigation: {
        enabled: true,
        relativePath: "Nav/Nav.exe",
        description: "导航软件配置",
        fallbackPaths: [
          "Nav/Nav.exe",
          "Navigation/Nav.exe",
          "../Nav/Nav.exe",
          "./external/Nav/Nav.exe"
        ],
        platform: {
          win32: {
            executable: "Nav.exe",
            relativePath: "Nav/Nav.exe"
          },
          darwin: {
            executable: "Nav.exe",
            relativePath: "Nav/Nav.exe"
          },
          linux: {
            executable: "Nav",
            relativePath: "Nav/Nav"
          }
        },
        startupOptions: {
          detached: true,
          stdio: "ignore",
          windowsHide: false,
          setWorkingDirectory: true,
          inheritEnv: true
        },
        timeout: 5000,
        retryAttempts: 3
      },
      logging: {
        enabled: true,
        level: "info"
      },
      version: "1.0.0",
      lastModified: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * 重置为默认配置
   */
  public resetToDefault(): boolean {
    this.config = this.getDefaultConfig();
    return this.saveConfig();
  }

  /**
   * 验证配置文件
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const config = this.getConfig();
    const errors: string[] = [];

    if (!config.navigation) {
      errors.push('缺少 navigation 配置');
    }

    if (!config.navigation?.relativePath) {
      errors.push('缺少 relativePath 配置');
    }

    if (!Array.isArray(config.navigation?.fallbackPaths)) {
      errors.push('fallbackPaths 必须是数组');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const navConfigService = new NavConfigService();