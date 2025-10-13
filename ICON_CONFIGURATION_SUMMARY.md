# 应用程序图标配置总结

## 📋 配置概述

已成功为"无人机引导仿真系统"配置应用程序图标。

## 🎨 图标文件

图标文件位于项目根目录的 `images` 文件夹中：

- **icon.ico** (9.2KB) - Windows 平台图标
- **icon.png** (18.1KB) - macOS 和 Linux 平台图标

## 🔧 配置修改

### 1. electron-builder.json

已更新 Electron Builder 配置，添加了图标设置：

```json
{
  "appId": "com.electron.app",
  "productName": "无人机引导仿真系统",
  "icon": "images/icon.png",
  
  "nsis": {
    "shortcutName": "无人机引导仿真系统",
    "installerIcon": "images/icon.ico",
    "uninstallerIcon": "images/icon.ico"
  },
  
  "win": {
    "target": "nsis",
    "icon": "images/icon.ico"
  },
  
  "mac": {
    "icon": "images/icon.png",
    "category": "public.app-category.developer-tools"
  },
  
  "linux": {
    "target": ["snap"],
    "icon": "images/icon.png"
  }
}
```

**修改内容**：
- ✅ 添加全局 `icon` 配置
- ✅ 添加 `productName` 为 "无人机引导仿真系统"
- ✅ Windows：设置安装程序图标和卸载程序图标
- ✅ macOS：设置应用图标
- ✅ Linux：设置应用图标
- ✅ 确保 `images` 文件夹被复制到构建目录

### 2. src/main/main.ts

在 `createWindow()` 函数中添加了图标路径设置：

```typescript
function createWindow() {
  // 设置窗口图标路径
  let iconPath: string;
  if (app.isPackaged) {
    // 生产环境：图标在应用根目录的 images 文件夹中
    iconPath = join(
      process.resourcesPath, 
      "..", 
      "images", 
      process.platform === "win32" ? "icon.ico" : "icon.png"
    );
  } else {
    // 开发环境：图标在项目根目录的 images 文件夹中
    iconPath = join(
      __dirname, 
      "..", 
      "..", 
      "images", 
      process.platform === "win32" ? "icon.ico" : "icon.png"
    );
  }

  console.log(`[Window] 使用图标: ${iconPath}`);

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    icon: iconPath, // 设置窗口图标
    // ... 其他配置
  });
}
```

**功能特性**：
- ✅ 自动根据平台选择正确的图标格式（Windows 使用 .ico，其他平台使用 .png）
- ✅ 区分开发环境和生产环境的图标路径
- ✅ 添加日志输出，方便调试

## 📦 文件复制配置

在 `electron-builder.json` 的 `files` 配置中，确保图标文件被正确复制：

```json
{
  "from": "images",
  "to": "images",
  "filter": ["**/*"]
}
```

这样在打包时，`images` 文件夹及其中的所有文件都会被复制到应用程序包中。

## 🚀 使用方法

### 开发环境

运行开发服务器时，窗口图标会自动显示：

```bash
npm run dev
```

在控制台中可以看到图标路径日志：
```
[Window] 使用图标: /path/to/project/images/icon.png
```

### 生产环境打包

打包应用程序时，图标会被自动应用到：

**Windows**：
```bash
npm run build:win
```
- 窗口图标：icon.ico
- 安装程序图标：icon.ico
- 卸载程序图标：icon.ico
- 快捷方式图标：icon.ico

**macOS**：
```bash
npm run build:mac
```
- 应用图标：icon.png（会自动转换为 .icns 格式）
- Dock 图标：icon.png

**Linux**：
```bash
npm run build:linux
```
- 应用图标：icon.png

## 🎯 图标显示位置

配置完成后，图标会显示在以下位置：

### Windows
- ✅ 应用程序窗口标题栏
- ✅ 任务栏
- ✅ Alt+Tab 切换窗口
- ✅ 桌面快捷方式
- ✅ 开始菜单
- ✅ 安装程序
- ✅ 卸载程序

### macOS
- ✅ 应用程序窗口标题栏
- ✅ Dock
- ✅ 应用程序文件夹
- ✅ Command+Tab 切换窗口
- ✅ Launchpad

### Linux
- ✅ 应用程序窗口
- ✅ 应用程序菜单
- ✅ 任务栏

## 🔍 图标要求

### Windows (.ico)
- **格式**：ICO
- **推荐尺寸**：
  - 16x16
  - 32x32
  - 48x48
  - 64x64
  - 128x128
  - 256x256
- **当前文件**：9.2KB（已满足要求）

### macOS (.png 或 .icns)
- **格式**：PNG（会自动转换为 ICNS）
- **推荐尺寸**：
  - 512x512 或更高
  - 1024x1024（Retina 显示屏）
- **当前文件**：18.1KB（需检查实际尺寸）

### Linux (.png)
- **格式**：PNG
- **推荐尺寸**：
  - 256x256 或更高
  - 512x512（高分辨率显示）

## ⚠️ 注意事项

1. **图标透明度**：
   - PNG 图标应包含透明通道（alpha channel）
   - ICO 图标可以包含多个尺寸的图标资源

2. **图标路径**：
   - 图标文件必须放在项目根目录的 `images` 文件夹中
   - 不要修改文件名（icon.ico 和 icon.png）

3. **缓存清理**：
   - 如果更换图标后没有生效，可能需要清理系统图标缓存
   - Windows：重启资源管理器
   - macOS：清理图标缓存 `sudo find /private/var/folders/ -name com.apple.dock.iconcache -exec rm {} \;`

## 🧪 测试检查清单

- [ ] 开发环境窗口显示正确图标
- [ ] Windows 打包后的安装程序显示图标
- [ ] Windows 安装后的快捷方式显示图标
- [ ] Windows 运行时窗口和任务栏显示图标
- [ ] macOS 打包后的 .app 显示图标
- [ ] macOS Dock 显示图标
- [ ] Linux 应用程序菜单显示图标

## 📝 相关文件

- [images/icon.ico](file:///Users/xinnix/code/afs/opEnd/images/icon.ico) - Windows 图标
- [images/icon.png](file:///Users/xinnix/code/afs/opEnd/images/icon.png) - macOS/Linux 图标
- [electron-builder.json](file:///Users/xinnix/code/afs/opEnd/electron-builder.json) - 构建配置
- [src/main/main.ts](file:///Users/xinnix/code/afs/opEnd/src/main/main.ts) - 主进程代码

---

**配置日期**：2025-10-13  
**状态**：✅ 配置完成，待测试验证
