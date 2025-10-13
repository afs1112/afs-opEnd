import { app, BrowserWindow, dialog, ipcMain, session, Menu } from "electron";
import { join } from "path";
import fs from "fs";
import * as dotenv from "dotenv";
import { spawn } from "child_process";

import {
  multicastService,
  MulticastPacket,
} from "./services/multicast.service";
import {
  multicastSenderService,
  PlatformCmdData,
} from "./services/multicast-sender.service";
import { DocumentService } from "./services/document.service";
import { DocumentStateService } from "./services/document-state.service";

import { navConfigService } from "./services/nav-config.service";
import { uavIdService } from "./services/uav-id.service";
import { navProcessService } from "./services/nav-process.service";

// 数据清理函数，移除不可序列化的内容
function cleanDataForSerialization(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "function") {
    return "[Function]";
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Buffer) {
    return {
      type: "Buffer",
      data: Array.from(obj),
      length: obj.length,
    };
  }

  if (obj instanceof Error) {
    return {
      type: "Error",
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
  }

  // 检查循环引用
  const seen = new WeakSet();

  function cleanRecursive(item: any): any {
    if (item === null || item === undefined) {
      return item;
    }

    if (typeof item === "function") {
      return "[Function]";
    }

    if (typeof item === "symbol") {
      return item.toString();
    }

    if (typeof item === "bigint") {
      return item.toString();
    }

    if (item instanceof Date) {
      return item.toISOString();
    }

    if (item instanceof Buffer) {
      return {
        type: "Buffer",
        data: Array.from(item.slice(0, 100)), // 限制Buffer大小
        length: item.length,
        truncated: item.length > 100,
      };
    }

    if (typeof item === "object") {
      if (seen.has(item)) {
        return "[Circular Reference]";
      }

      seen.add(item);

      if (Array.isArray(item)) {
        return item.map(cleanRecursive);
      }

      const cleaned: any = {};
      for (const [key, value] of Object.entries(item)) {
        // 跳过一些可能有问题的属性
        if (
          key.startsWith("_") ||
          key === "constructor" ||
          key === "prototype"
        ) {
          continue;
        }

        try {
          cleaned[key] = cleanRecursive(value);
        } catch (error) {
          cleaned[key] = `[Serialization Error: ${
            error instanceof Error ? error.message : String(error)
          }]`;
        }
      }

      return cleaned;
    }

    return item;
  }

  return cleanRecursive(obj);
}

// 加载环境配置
const envPath = join(app.getAppPath(), "config.env");
dotenv.config({ path: envPath });

app.whenReady().then(async () => {
  try {
    createWindow();

    // 初始化UavId服务并在系统启动时自动生成UavId
    try {
      console.log("[System] 初始化UavId服务...");

      const initResult = uavIdService.initializeOnStartup();

      if (initResult.success) {
        console.log(
          `[System] ✅ UavId服务初始化成功，UavId: ${initResult.uavId}`
        );
      } else {
        console.error(`[System] ❌ UavId服务初始化失败: ${initResult.error}`);
      }
    } catch (error) {
      console.error("[System] UavId服务初始化失败:", error);
    }

    // 启动组播监听服务
    try {
      await multicastService.start();
    } catch (error) {
      console.error("组播服务启动失败:", error);
    }

    // 初始化组播发送服务
    try {
      await multicastSenderService.initialize();
      console.log("✅ 组播发送服务初始化成功");
    } catch (error) {
      console.error("❌ 组播发送服务初始化失败:", error);
    }

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["script-src 'self'"],
        },
      });
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    app.quit();
  }
});

// 组播服务IPC处理
ipcMain.handle("multicast:start", async () => {
  try {
    await multicastService.start();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("multicast:stop", async () => {
  try {
    await multicastService.stop();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("multicast:getStatus", () => {
  return multicastService.getStatus();
});

ipcMain.handle("multicast:getConfig", () => {
  return {
    address: process.env.MULTICAST_ADDRESS || "239.255.43.21",
    port: parseInt(process.env.MULTICAST_PORT || "10086"),
    interfaceAddress: process.env.INTERFACE_ADDRESS || "0.0.0.0",
  };
});

ipcMain.handle(
  "multicast:updateConfig",
  (_, address: string, port: number, interfaceAddr: string) => {
    try {
      multicastService.updateConfig(address, port, interfaceAddr);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
);

// 图片服务IPC处理
ipcMain.handle(
  "images:getPlatformImagePath",
  async (_, platformType: string) => {
    try {
      // 支持多种图片格式
      const supportedFormats = ["jpg", "jpeg", "png"];
      let imagePath: string | null = null;
      let foundFormat: string | null = null;

      // 遍历支持的格式，找到存在的图片文件
      for (const format of supportedFormats) {
        const imageName = `${platformType}.${format}`;
        let testPath: string;

        if (app.isPackaged) {
          // 打包后，图片在应用根目录的images文件夹中
          testPath = join(process.resourcesPath, "..", "images", imageName);
        } else {
          // 开发环境，图片在src/images文件夹中
          testPath = join(__dirname, "..", "..", "src", "images", imageName);
        }

        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          foundFormat = format;
          break;
        }
      }

      console.log(
        `[Images] 查找图片: ${platformType} -> ${imagePath || "未找到"}`
      );

      if (imagePath && foundFormat) {
        console.log(
          `[Images] ✅ 找到图片: ${imagePath} (格式: ${foundFormat})`
        );
        return {
          success: true,
          path: imagePath,
          exists: true,
          format: foundFormat,
        };
      } else {
        console.log(
          `[Images] ❌ 图片不存在，已尝试格式: ${supportedFormats.join(", ")}`
        );
        return { success: true, path: null, exists: false };
      }
    } catch (error: any) {
      console.error("[Images] 获取平台图片路径失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 获取图片的base64数据
ipcMain.handle(
  "images:getPlatformImageData",
  async (_, platformType: string) => {
    try {
      // 支持多种图片格式
      const supportedFormats = ["jpg", "jpeg", "png"];
      let imagePath: string | null = null;
      let foundFormat: string | null = null;

      // 遍历支持的格式，找到存在的图片文件
      for (const format of supportedFormats) {
        const imageName = `${platformType}.${format}`;
        let testPath: string;

        if (app.isPackaged) {
          // 打包后，图片在应用根目录的images文件夹中
          testPath = join(process.resourcesPath, "..", "images", imageName);
        } else {
          // 开发环境，图片在src/images文件夹中
          testPath = join(__dirname, "..", "..", "src", "images", imageName);
        }

        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          foundFormat = format;
          break;
        }
      }

      console.log(
        `[Images] 读取图片数据: ${platformType} -> ${imagePath || "未找到"}`
      );

      if (imagePath && foundFormat) {
        const imageData = fs.readFileSync(imagePath);
        const base64Data = imageData.toString("base64");

        // 根据实际文件格式设置正确的MIME类型
        let mimeType: string;
        switch (foundFormat.toLowerCase()) {
          case "png":
            mimeType = "image/png";
            break;
          case "jpg":
          case "jpeg":
            mimeType = "image/jpeg";
            break;
          default:
            mimeType = "image/jpeg"; // 默认使用jpeg
        }

        console.log(
          `[Images] ✅ 成功读取图片数据: ${imagePath}, 格式: ${foundFormat}, 大小: ${imageData.length} bytes`
        );
        return {
          success: true,
          data: `data:${mimeType};base64,${base64Data}`,
          exists: true,
          format: foundFormat,
          mimeType: mimeType,
        };
      } else {
        console.log(
          `[Images] ❌ 图片不存在，已尝试格式: ${supportedFormats.join(", ")}`
        );
        return { success: true, data: null, exists: false };
      }
    } catch (error: any) {
      console.error("[Images] 读取平台图片数据失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 文档服务IPC处理
ipcMain.handle("document:readDocument", async (_, filePath: string) => {
  try {
    const result = await DocumentService.readDocument(filePath);

    // 如果成功读取，保存文档状态
    if (result.success && result.data) {
      const fileName = filePath.split(/[\\\/]/).pop() || "未知文档";
      DocumentStateService.saveDocumentState(
        filePath,
        fileName,
        result.data,
        result.type || "unknown"
      );
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取最近文档
ipcMain.handle("document:getRecentDocument", async () => {
  try {
    const recentDoc = DocumentStateService.showRecentDocument();
    if (recentDoc) {
      return {
        success: true,
        data: recentDoc.content,
        type: recentDoc.type,
        fileName: recentDoc.fileName,
        filePath: recentDoc.filePath,
      };
    } else {
      return {
        success: false,
        error: "没有最近打开的文档",
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 隐藏当前文档
ipcMain.handle("document:hideDocument", async () => {
  try {
    DocumentStateService.hideCurrentDocument();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取文档统计信息
ipcMain.handle("document:getStats", async () => {
  try {
    const stats = DocumentStateService.getDocumentStats();
    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 检查是否有已打开的文档
ipcMain.handle("document:hasOpenedDocuments", async () => {
  try {
    const hasDocuments = DocumentStateService.hasOpenedDocuments();
    return { success: true, data: hasDocuments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 对话框IPC处理
ipcMain.handle("dialog:showOpenDialog", async (_, options: any) => {
  try {
    return await dialog.showOpenDialog(options);
  } catch (error: any) {
    return { canceled: true, error: error.message };
  }
});

// 组播发送服务IPC处理
ipcMain.handle(
  "multicast:sendPlatformCmd",
  async (_, data: PlatformCmdData) => {
    try {
      // 检查服务是否已初始化，如果没有则尝试重新初始化
      if (!multicastSenderService.isInitialized()) {
        console.log("[Main] MulticastSender未初始化，尝试重新初始化...");
        try {
          await multicastSenderService.initialize();
          console.log("[Main] ✅ MulticastSender重新初始化成功");
        } catch (initError) {
          console.error("[Main] ❌ MulticastSender重新初始化失败:", initError);
          return {
            success: false,
            error: `初始化失败: ${
              initError instanceof Error ? initError.message : String(initError)
            }`,
          };
        }
      }

      await multicastSenderService.sendPlatformCmd(data);
      return { success: true };
    } catch (error: any) {
      console.error("发送PlatformCmd失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 同步轨迹数据
ipcMain.handle(
  "multicast:syncTrajectory",
  async (_, data: { platformName: string; uavId: number }) => {
    try {
      // 检查服务是否已初始化
      if (!multicastSenderService.isInitialized()) {
        console.log("[Main] MulticastSender未初始化，尝试重新初始化...");
        try {
          await multicastSenderService.initialize();
          console.log("[Main] ✅ MulticastSender重新初始化成功");
        } catch (initError) {
          console.error("[Main] ❌ MulticastSender重新初始化失败:", initError);
          return {
            success: false,
            error: `初始化失败: ${
              initError instanceof Error ? initError.message : String(initError)
            }`,
          };
        }
      }

      await multicastSenderService.syncTrajectory(data);
      return { success: true };
    } catch (error: any) {
      console.error("同步轨迹失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 使用平台数据同步轨迹
ipcMain.handle(
  "multicast:syncTrajectoryWithPlatformData",
  async (
    _,
    data: { platformName: string; uavId: number; platformData: any }
  ) => {
    try {
      // 检查服务是否已初始化
      if (!multicastSenderService.isInitialized()) {
        console.log("[Main] MulticastSender未初始化，尝试重新初始化...");
        try {
          await multicastSenderService.initialize();
          console.log("[Main] ✅ MulticastSender重新初始化成功");
        } catch (initError) {
          console.error("[Main] ❌ MulticastSender重新初始化失败:", initError);
          return {
            success: false,
            error: `初始化失败: ${
              initError instanceof Error ? initError.message : String(initError)
            }`,
          };
        }
      }

      await multicastSenderService.syncTrajectoryWithPlatformData(data);
      return { success: true };
    } catch (error: any) {
      console.error("同步轨迹失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 启动平台心跳
ipcMain.handle(
  "multicast:startPlatformHeartbeat",
  async (_, data: { platformName: string; intervalMs?: number }) => {
    try {
      // 检查服务是否已初始化
      if (!multicastSenderService.isInitialized()) {
        console.log("[Main] MulticastSender未初始化，尝试重新初始化...");
        try {
          await multicastSenderService.initialize();
          console.log("[Main] ✅ MulticastSender重新初始化成功");
        } catch (initError) {
          console.error("[Main] ❌ MulticastSender重新初始化失败:", initError);
          return {
            success: false,
            error: `初始化失败: ${
              initError instanceof Error ? initError.message : String(initError)
            }`,
          };
        }
      }

      multicastSenderService.startPlatformHeartbeat(
        data.platformName,
        data.intervalMs || 3000
      );
      console.log(`[Main] ✅ 启动平台心跳: ${data.platformName}`);
      return { success: true };
    } catch (error: any) {
      console.error("[Main] 启动平台心跳失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 停止平台心跳
ipcMain.handle(
  "multicast:stopPlatformHeartbeat",
  async (event, data?: { platformName?: string }) => {
    try {
      const platformName = data?.platformName;
      multicastSenderService.stopPlatformHeartbeat(platformName);
      console.log(`[Main] ✅ 停止平台心跳: ${platformName || "全部"}`);
      return { success: true };
    } catch (error: any) {
      console.error("[Main] 停止平台心跳失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 获取心跳状态
ipcMain.handle("multicast:getHeartbeatStatus", async () => {
  try {
    const status = multicastSenderService.getHeartbeatStatus();
    return { success: true, data: status };
  } catch (error: any) {
    console.error("[Main] 获取心跳状态失败:", error);
    return { success: false, error: error.message };
  }
});

// 监听组播数据包并转发给渲染进程
multicastService.on("packet", (packet: MulticastPacket) => {
  // 检查是否为航线上传数据包 (0x20)
  if (packet.parsedPacket && packet.parsedPacket.packageType === 0x20) {
    console.log("[Main] 🛩️ 接收到航线上传数据包，开始转换...");
    handleRouteUpload(packet.parsedPacket);
  }

  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    window.webContents.send("multicast:packet", packet);
  });
});

multicastService.on("error", (error) => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    window.webContents.send("multicast:error", error.message);
  });
});

// 处理航线上传数据包，转换为PlatformCmd格式
async function handleRouteUpload(parsedPacket: any) {
  // 获取所有窗口，避免重复声明
  const allWindows = BrowserWindow.getAllWindows();

  try {
    const routeData = parsedPacket.parsedData;
    console.log(
      "[RouteConverter] 航线数据:",
      JSON.stringify(routeData, null, 2)
    );

    if (
      !routeData ||
      !routeData.wayPointList ||
      routeData.wayPointList.length === 0
    ) {
      console.log("[RouteConverter] ⚠️ 航线数据为空，跳过转换");
      return;
    }

    // 获取系统当前的UavId
    const currentUavIdResult = uavIdService.getCurrentUavId();
    const currentUavId = parseInt(currentUavIdResult);
    const routeUavId = routeData.uavID;

    console.log("[RouteConverter] UavId验证:", {
      系统UavId: currentUavId,
      航线UavId: routeUavId,
      匹配: currentUavId === routeUavId,
    });

    // 只有UavId匹配时才进行转换
    if (currentUavId !== routeUavId) {
      console.log("[RouteConverter] ⚠️ UavId不匹配，跳过航线转换");
      console.log(
        `[RouteConverter] 系统UavId: ${currentUavId}, 航线UavId: ${routeUavId}`
      );

      // 通知渲染进程UavId不匹配
      allWindows.forEach((window) => {
        window.webContents.send("route:uavIdMismatch", {
          systemUavId: currentUavId,
          routeUavId: routeUavId,
        });
      });
      return;
    }

    // 请求渲染进程提供当前选择的平台名称
    if (allWindows.length === 0) {
      console.log("[RouteConverter] ⚠️ 没有活动窗口，无法获取选择的平台");
      return;
    }

    // 向渲染进程请求当前选择的平台数据
    const selectedPlatformData = await new Promise<{
      name: string;
      speed?: number;
    }>((resolve) => {
      const window = allWindows[0];

      // 设置超时
      const timeout = setTimeout(() => {
        resolve({ name: "" });
      }, 5000);

      // 监听响应
      const responseHandler = (
        event: any,
        platformData: { name: string; speed?: number }
      ) => {
        clearTimeout(timeout);
        ipcMain.removeListener(
          "route:selectedPlatformDataResponse",
          responseHandler
        );
        resolve(platformData);
      };

      ipcMain.once("route:selectedPlatformDataResponse", responseHandler);

      // 请求平台数据
      window.webContents.send("route:requestSelectedPlatformData");
    });

    if (!selectedPlatformData.name) {
      console.log("[RouteConverter] ⚠️ 未选择平台，跳过航线转换");

      // 通知渲染进程需要选择平台
      allWindows.forEach((window) => {
        window.webContents.send("route:noPlatformSelected", {
          uavId: routeUavId,
        });
      });
      return;
    }

    console.log(
      "[RouteConverter] 使用选择的平台:",
      selectedPlatformData.name,
      "速度:",
      selectedPlatformData.speed
    );

    // 将UavNavMonitor.WayPoint转换为PublicStruct.WayPoint格式
    const platformSpeed = selectedPlatformData.speed || 10; // 使用平台速度，如果没有则使用默认值10
    console.log("[RouteConverter] 使用平台速度:", platformSpeed, "m/s");

    const convertedRoute = routeData.wayPointList.map(
      (waypoint: any, index: number) => {
        const coord = waypoint.coord || {};
        return {
          longitude: coord.longitude || 0,
          latitude: coord.latitude || 0,
          altitude: coord.altitude || 0,
          labelName: `航点${index + 1}`, // 使用顺序号填充label
          speed: platformSpeed, // 使用当前选择平台的速度
        };
      }
    );

    console.log(
      "[RouteConverter] 转换后的航点:",
      JSON.stringify(convertedRoute, null, 2)
    );

    // 构造PlatformCmd数据
    const platformCmdData = {
      commandID: Date.now(),
      platformName: selectedPlatformData.name, // 使用命令测试面板选择的平台名称
      command: 6, // Uav_Nav
      navParam: {
        route: convertedRoute,
      },
    };

    console.log(
      "[RouteConverter] 准备发送PlatformCmd:",
      JSON.stringify(platformCmdData, null, 2)
    );

    // 检查发送服务是否已初始化
    if (!multicastSenderService.isInitialized()) {
      console.log("[RouteConverter] MulticastSender未初始化，尝试初始化...");
      await multicastSenderService.initialize();
    }

    // 发送转换后的航线命令
    await multicastSenderService.sendPlatformCmd(platformCmdData);

    console.log("[RouteConverter] ✅ 航线转换并发送成功");

    // 通知渲染进程显示转换成功消息
    allWindows.forEach((window) => {
      window.webContents.send("route:converted", {
        uavId: routeData.uavID,
        waypointCount: convertedRoute.length,
        routeType: routeData.routeType,
      });
    });
  } catch (error) {
    console.error("[RouteConverter] ❌ 航线转换失败:", error);

    // 通知渲染进程转换失败
    allWindows.forEach((window) => {
      window.webContents.send("route:convertError", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      devTools: true,
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 窗口创建后立即最大化
  mainWindow.maximize();

  // 创建菜单
  const template = [
    {
      label: "开发",
      submenu: [
        {
          label: "打开开发者工具",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => {
            mainWindow.webContents.openDevTools();
          },
        },
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: "强制重新加载",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 检查是否为开发模式：同时检查环境变量和命令行参数
  const isDevelopment =
    process.env.NODE_ENV === "development" && process.argv.length > 2;

  if (isDevelopment) {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);

    // 在开发模式下自动打开开发者工具
    mainWindow.webContents.once("dom-ready", () => {
      mainWindow.webContents.openDevTools();
    });
  } else {
    mainWindow.loadFile(join(app.getAppPath(), "renderer", "index.html"));
  }
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    // 获取默认保存路径，优先使用用户文档目录，其次使用下载目录
    let defaultDir: string;
    try {
      defaultDir = app.getPath("documents");
    } catch (error) {
      console.warn("无法获取文档目录，使用下载目录:", error);
      try {
        defaultDir = app.getPath("downloads");
      } catch (error2) {
        console.warn("无法获取下载目录，使用用户数据目录:", error2);
        defaultDir = app.getPath("userData");
      }
    }

    const defaultPath =
      options.defaultPath ||
      join(defaultDir, options.defaultFileName || "export.json");

    console.log(`[Export] 默认保存路径: ${defaultPath}`);

    const result = await dialog.showSaveDialog({
      title: options.title || "Save File",
      defaultPath,
      filters: options.filters || [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["createDirectory"],
    });

    console.log(`[Export] 用户选择的路径: ${result.filePath}`);
    console.log(`[Export] 对话框是否取消: ${result.canceled}`);

    return result.filePath;
  } catch (error: any) {
    console.error("[Export] 显示保存对话框失败:", error);
    return null;
  }
});

ipcMain.handle("export-file", async (event, { filePath, data }) => {
  try {
    console.log(`[Export] 开始导出文件: ${filePath}`);

    if (!filePath) {
      return { success: false, error: "文件路径为空" };
    }

    // 确保目录存在
    const dir = require("path").dirname(filePath);
    if (!fs.existsSync(dir)) {
      console.log(`[Export] 创建目录: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    // 序列化数据 - 使用更安全的序列化方法
    let serializableData;
    try {
      // 首先尝试直接序列化
      serializableData = JSON.parse(JSON.stringify(data));
    } catch (serializeError: any) {
      console.error("[Export] 直接序列化失败，尝试清理数据:", serializeError);

      // 如果直接序列化失败，尝试清理数据
      try {
        serializableData = cleanDataForSerialization(data);
        // 验证清理后的数据是否可序列化
        JSON.stringify(serializableData);
      } catch (cleanError: any) {
        console.error("[Export] 数据清理后仍无法序列化:", cleanError);
        return {
          success: false,
          error: `数据包含不可序列化的内容: ${cleanError.message}`,
        };
      }
    }

    // 写入文件
    const jsonContent = JSON.stringify(serializableData, null, 2);
    await fs.promises.writeFile(filePath, jsonContent, "utf8");

    // 验证文件是否写入成功
    const stats = await fs.promises.stat(filePath);
    console.log(
      `[Export] 文件导出成功: ${filePath}, 大小: ${stats.size} bytes`
    );

    return {
      success: true,
      path: filePath,
      size: stats.size,
      recordCount: Array.isArray(serializableData)
        ? serializableData.length
        : serializableData &&
          typeof serializableData === "object" &&
          serializableData.length !== undefined
        ? serializableData.length
        : 1,
    };
  } catch (err: any) {
    console.error("[Export] 导出文件失败:", err);
    return {
      success: false,
      error: err.message,
      code: err.code,
      path: filePath,
    };
  }
});

// 导航配置相关IPC处理
ipcMain.handle("nav:getConfig", () => {
  try {
    return { success: true, config: navConfigService.getConfig() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("nav:updateConfig", (_, newConfig) => {
  try {
    const success = navConfigService.updateConfig(newConfig);
    return { success, message: success ? "配置已更新" : "配置更新失败" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("nav:resetConfig", () => {
  try {
    const success = navConfigService.resetToDefault();
    return {
      success,
      message: success ? "配置已重置为默认值" : "配置重置失败",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("nav:validateConfig", () => {
  try {
    const validation = navConfigService.validateConfig();
    return { success: true, validation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("nav:getNavPath", () => {
  try {
    const navPath = navConfigService.getNavPath();
    return {
      success: true,
      path: navPath,
      exists: navPath ? fs.existsSync(navPath) : false,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// UavId相关IPC处理
ipcMain.handle("uav:generateId", () => {
  try {
    const uavId = uavIdService.generateAndSetNewUavId();
    return { success: true, uavId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("uav:getCurrentId", () => {
  try {
    const uavId = uavIdService.getCurrentUavId();
    return { success: true, uavId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取系统启动时的UavId
ipcMain.handle("uav:getSystemUavId", () => {
  try {
    const uavId = uavIdService.getCurrentUavId();
    return { success: true, uavId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("uav:setCurrentId", (_, uavId: string, description?: string) => {
  try {
    const success = uavIdService.setCurrentUavId(uavId, description);
    return { success, message: success ? "UavId已设置" : "设置UavId失败" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("uav:getHistory", () => {
  try {
    const history = uavIdService.getHistory();
    return { success: true, history };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("uav:enableAutoGenerate", () => {
  try {
    const success = uavIdService.enableAutoGenerate();
    return {
      success,
      message: success ? "自动生成已启用" : "启用自动生成失败",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("uav:disableAutoGenerate", () => {
  try {
    const success = uavIdService.disableAutoGenerate();
    return {
      success,
      message: success ? "自动生成已禁用" : "禁用自动生成失败",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("uav:prepareForNavigation", () => {
  try {
    const result = uavIdService.prepareForNavigation();

    // 如果成功生成了新的 UavId，通知所有渲染进程
    if (result.success && result.uavId) {
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        window.webContents.send("nav:uavIdUpdated", {
          uavId: result.uavId,
          timestamp: Date.now(),
        });
      });
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 启动导航软件
ipcMain.handle("nav:openNavigation", async () => {
  try {
    console.log(`[Nav] 准备启动导航软件...`);

    // 1. 首先检查导航软件是否已经在运行
    const isAlreadyRunning = navProcessService.isNavRunning();
    console.log(
      `[Nav] 导航软件运行状态: ${isAlreadyRunning ? "已运行" : "未运行"}`
    );

    // 2. 使用配置服务获取导航软件路径
    const navExePath = navConfigService.getNavPath();

    if (!navExePath) {
      return {
        success: false,
        error: "导航软件未配置或已禁用",
      };
    }

    // 获取导航软件工作目录（Nav.exe 所在的目录）
    const navWorkingDir = navConfigService.getNavWorkingDirectory();

    console.log(`[Nav] 导航软件路径: ${navExePath}`);
    console.log(`[Nav] 工作目录: ${navWorkingDir}`);

    // 检查文件是否存在
    if (!fs.existsSync(navExePath)) {
      return {
        success: false,
        error: `导航软件不存在: ${navExePath}`,
      };
    }

    // 3. 只有在导航软件未运行时才准备UavId
    let prepareResult: {
      success: boolean;
      uavId?: string;
      error?: string;
    } | null = null;

    if (!isAlreadyRunning) {
      console.log(`[Nav] 导航软件未运行，准备UavId...`);
      prepareResult = uavIdService.prepareForNavigation();

      if (!prepareResult.success) {
        return {
          success: false,
          error: `准备UavId失败: ${prepareResult.error}`,
        };
      }

      console.log(`[Nav] UavId准备完成: ${prepareResult.uavId}`);
    } else {
      console.log(`[Nav] 导航软件已运行，使用现有UavId`);
    }

    // 4. 获取启动选项并启动/恢复导航软件
    const startupOptions = navConfigService.getStartupOptions();

    const startResult = navProcessService.startNavigation(
      navExePath,
      navWorkingDir || undefined,
      startupOptions
    );

    if (!startResult.success) {
      return {
        success: false,
        error: startResult.error || "启动导航软件失败",
      };
    }

    // 5. 获取当前UavId（不管是新生成的还是现有的）
    const currentUavId = uavIdService.getCurrentUavId();

    console.log(`[Nav] 导航软件处理完成，PID: ${startResult.pid}`);
    console.log(`[Nav] 工作目录: ${navWorkingDir || "默认"}`);
    console.log(`[Nav] 使用UavId: ${currentUavId}`);
    console.log(`[Nav] 是否为新进程: ${startResult.isNewProcess}`);

    // 6. 只有在启动新进程时才通知UavId更新
    if (startResult.isNewProcess && prepareResult) {
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        window.webContents.send("nav:uavIdUpdated", {
          uavId: currentUavId,
          timestamp: Date.now(),
          isNewProcess: true,
        });
      });
    }

    return {
      success: true,
      message: startResult.isNewProcess
        ? "导航软件已启动"
        : "导航软件已恢复到前台",
      uavId: currentUavId,
      pid: startResult.pid,
      isNewProcess: startResult.isNewProcess,
    };
  } catch (error: any) {
    console.error("启动导航软件失败:", error);
    return {
      success: false,
      error: `启动失败: ${error.message}`,
    };
  }
});

// 获取导航软件状态
ipcMain.handle("nav:getStatus", () => {
  try {
    const status = navProcessService.getStatus();
    return { success: true, status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 停止导航软件
ipcMain.handle("nav:stopNavigation", () => {
  try {
    const result = navProcessService.stopNavigation();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
