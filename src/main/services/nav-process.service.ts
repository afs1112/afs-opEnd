import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';

interface NavProcess {
  pid: number;
  process: ChildProcess;
  startTime: number;
  workingDir?: string;
}

class NavProcessService {
  private navProcess: NavProcess | null = null;
  private readonly processName = 'Nav.exe';

  /**
   * 检查导航软件是否正在运行
   */
  public isNavRunning(): boolean {
    if (!this.navProcess) {
      return false;
    }

    // 检查进程是否仍然存在
    try {
      // 发送信号0来检查进程是否存在，不会实际杀死进程
      process.kill(this.navProcess.pid, 0);
      return true;
    } catch (error) {
      // 如果抛出异常，说明进程不存在
      this.navProcess = null;
      return false;
    }
  }

  /**
   * 获取当前导航进程信息
   */
  public getNavProcess(): NavProcess | null {
    if (this.isNavRunning()) {
      return this.navProcess;
    }
    return null;
  }

  /**
   * 启动导航软件
   */
  public startNavigation(
    navExePath: string, 
    workingDir?: string, 
    options: any = {}
  ): { success: boolean; pid?: number; error?: string; isNewProcess: boolean } {
    try {
      // 检查是否已经在运行
      if (this.isNavRunning()) {
        console.log(`[NavProcess] 导航软件已在运行，PID: ${this.navProcess!.pid}`);
        
        // 尝试将窗口置于前台
        const restored = this.restoreNavWindow();
        
        return {
          success: true,
          pid: this.navProcess!.pid,
          isNewProcess: false
        };
      }

      // 启动新进程
      console.log(`[NavProcess] 启动新的导航软件进程...`);
      
      const spawnOptions: any = {
        detached: options.detached || true,
        stdio: options.stdio || 'ignore',
        windowsHide: options.windowsHide || false
      };

      if (workingDir) {
        spawnOptions.cwd = workingDir;
      }

      if (options.inheritEnv) {
        spawnOptions.env = { ...process.env };
      }

      const child = spawn(navExePath, [], spawnOptions);

      // 监听启动错误
      child.on('error', (error) => {
        console.error(`[NavProcess] 启动错误: ${error.message}`);
        this.navProcess = null;
      });

      // 监听进程退出
      child.on('exit', (code, signal) => {
        console.log(`[NavProcess] 进程退出，PID: ${child.pid}, 退出码: ${code}, 信号: ${signal}`);
        this.navProcess = null;
      });

      // 如果配置为分离模式，分离子进程
      if (spawnOptions.detached) {
        child.unref();
      }

      // 保存进程信息
      this.navProcess = {
        pid: child.pid!,
        process: child,
        startTime: Date.now(),
        workingDir
      };

      console.log(`[NavProcess] 导航软件已启动，PID: ${child.pid}`);
      
      return {
        success: true,
        pid: child.pid!,
        isNewProcess: true
      };

    } catch (error: any) {
      console.error(`[NavProcess] 启动导航软件失败:`, error);
      return {
        success: false,
        error: error.message,
        isNewProcess: false
      };
    }
  }

  /**
   * 尝试将导航软件窗口恢复到前台
   */
  private restoreNavWindow(): boolean {
    try {
      if (process.platform === 'win32') {
        // Windows 平台：使用 Windows API 查找并恢复窗口
        return this.restoreWindowsNavWindow();
      } else if (process.platform === 'darwin') {
        // macOS 平台：使用 AppleScript 或其他方法
        return this.restoreMacNavWindow();
      } else {
        // Linux 平台：使用 wmctrl 或其他工具
        return this.restoreLinuxNavWindow();
      }
    } catch (error) {
      console.error(`[NavProcess] 恢复窗口失败:`, error);
      return false;
    }
  }

  /**
   * Windows 平台恢复窗口
   */
  private restoreWindowsNavWindow(): boolean {
    try {
      const { exec } = require('child_process');
      
      // 使用 PowerShell 查找并恢复导航软件窗口
      const script = `
        Add-Type -TypeDefinition '
          using System;
          using System.Diagnostics;
          using System.Runtime.InteropServices;
          public class Win32 {
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")]
            public static extern bool IsIconic(IntPtr hWnd);
          }
        ';
        
        $processes = Get-Process -Name "Nav" -ErrorAction SilentlyContinue;
        if ($processes) {
          foreach ($proc in $processes) {
            if ($proc.MainWindowHandle -ne [IntPtr]::Zero) {
              $hwnd = $proc.MainWindowHandle;
              if ([Win32]::IsIconic($hwnd)) {
                [Win32]::ShowWindow($hwnd, 9); # SW_RESTORE
              }
              [Win32]::SetForegroundWindow($hwnd);
              Write-Output "Window restored for PID: $($proc.Id)";
              exit 0;
            }
          }
        }
        exit 1;
      `;

      exec(`powershell -Command "${script}"`, (error, stdout, stderr) => {
        if (error) {
          console.log(`[NavProcess] PowerShell 恢复窗口失败: ${error.message}`);
        } else {
          console.log(`[NavProcess] 窗口恢复结果: ${stdout}`);
        }
      });

      return true;
    } catch (error) {
      console.error(`[NavProcess] Windows 窗口恢复失败:`, error);
      return false;
    }
  }

  /**
   * macOS 平台恢复窗口
   */
  private restoreMacNavWindow(): boolean {
    try {
      const { exec } = require('child_process');
      
      // 使用 AppleScript 恢复窗口
      const script = `
        tell application "System Events"
          set navProcesses to (every process whose name contains "Nav")
          repeat with navProcess in navProcesses
            if visible of navProcess is false then
              set visible of navProcess to true
            end if
            set frontmost of navProcess to true
          end repeat
        end tell
      `;

      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) {
          console.log(`[NavProcess] AppleScript 恢复窗口失败: ${error.message}`);
        } else {
          console.log(`[NavProcess] macOS 窗口恢复成功`);
        }
      });

      return true;
    } catch (error) {
      console.error(`[NavProcess] macOS 窗口恢复失败:`, error);
      return false;
    }
  }

  /**
   * Linux 平台恢复窗口
   */
  private restoreLinuxNavWindow(): boolean {
    try {
      const { exec } = require('child_process');
      
      // 使用 wmctrl 恢复窗口
      exec('wmctrl -a Nav', (error, stdout, stderr) => {
        if (error) {
          console.log(`[NavProcess] wmctrl 恢复窗口失败: ${error.message}`);
        } else {
          console.log(`[NavProcess] Linux 窗口恢复成功`);
        }
      });

      return true;
    } catch (error) {
      console.error(`[NavProcess] Linux 窗口恢复失败:`, error);
      return false;
    }
  }

  /**
   * 停止导航软件
   */
  public stopNavigation(): { success: boolean; error?: string } {
    try {
      if (!this.navProcess) {
        return { success: true }; // 已经没有进程在运行
      }

      console.log(`[NavProcess] 正在停止导航软件，PID: ${this.navProcess.pid}`);

      // 尝试优雅地终止进程
      this.navProcess.process.kill('SIGTERM');

      // 等待一段时间后强制终止
      setTimeout(() => {
        if (this.navProcess && this.isNavRunning()) {
          console.log(`[NavProcess] 强制终止进程，PID: ${this.navProcess.pid}`);
          this.navProcess.process.kill('SIGKILL');
        }
      }, 5000);

      this.navProcess = null;
      return { success: true };

    } catch (error: any) {
      console.error(`[NavProcess] 停止导航软件失败:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取导航软件运行状态
   */
  public getStatus(): {
    isRunning: boolean;
    pid?: number;
    startTime?: number;
    uptime?: number;
  } {
    if (this.isNavRunning() && this.navProcess) {
      return {
        isRunning: true,
        pid: this.navProcess.pid,
        startTime: this.navProcess.startTime,
        uptime: Date.now() - this.navProcess.startTime
      };
    }

    return { isRunning: false };
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    if (this.navProcess) {
      try {
        this.navProcess.process.removeAllListeners();
      } catch (error) {
        console.error(`[NavProcess] 清理资源失败:`, error);
      }
      this.navProcess = null;
    }
  }
}

export const navProcessService = new NavProcessService();