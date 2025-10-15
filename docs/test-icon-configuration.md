# 应用程序图标配置测试指南

## 🚀 快速测试步骤

### 1. 开发环境测试

```bash
# 重新编译并启动开发服务器
npm run dev
```

**检查项**：
- ✅ 应用程序窗口标题栏是否显示图标
- ✅ 控制台是否输出图标路径日志：`[Window] 使用图标: /path/to/images/icon.png`
- ✅ Windows：任务栏是否显示图标
- ✅ macOS：Dock 是否显示图标

### 2. 生产环境打包测试

#### Windows 打包

```bash
# 构建 Windows 安装包
npm run build:win
```

**检查项**：
- ✅ 查看 `dist` 文件夹中的安装程序是否有图标
- ✅ 运行安装程序，检查安装界面是否显示图标
- ✅ 安装后，桌面快捷方式是否显示图标
- ✅ 运行应用程序，窗口和任务栏是否显示图标

#### macOS 打包

```bash
# 构建 macOS 应用
npm run build:mac
```

**检查项**：
- ✅ 查看 `dist` 文件夹中的 `.app` 文件是否有图标
- ✅ 将应用拖到应用程序文件夹，检查图标
- ✅ 运行应用程序，Dock 是否显示图标

#### Linux 打包

```bash
# 构建 Linux 应用
npm run build:linux
```

**检查项**：
- ✅ 查看生成的包是否包含图标
- ✅ 安装后应用程序菜单是否显示图标

## 🔍 问题排查

### 问题1：开发环境图标不显示

**可能原因**：
- 图标文件路径不正确
- 图标文件不存在

**解决方案**：
```bash
# 检查图标文件是否存在
ls -la images/

# 应该看到：
# icon.ico (9.2KB)
# icon.png (18.1KB)
```

**检查控制台日志**：
```
[Window] 使用图标: /path/to/project/images/icon.png
```

如果路径不正确，检查 `main.ts` 中的图标路径配置。

### 问题2：打包后图标不显示

**可能原因**：
- `images` 文件夹未被复制到构建目录

**解决方案**：
```bash
# 检查构建后的文件
ls -la dist/win-unpacked/images/
# 或
ls -la dist/mac/无人机引导仿真系统.app/Contents/Resources/images/
```

确保 `electron-builder.json` 中包含正确的文件复制配置：
```json
{
  "from": "images",
  "to": "images",
  "filter": ["**/*"]
}
```

### 问题3：Windows 图标模糊或尺寸不对

**可能原因**：
- ICO 文件缺少某些尺寸的图标

**解决方案**：
使用工具（如 IcoFX）检查 `icon.ico` 是否包含多种尺寸：
- 16x16
- 32x32
- 48x48
- 256x256

### 问题4：macOS 图标显示为默认图标

**可能原因**：
- PNG 图标尺寸太小
- macOS 图标缓存未更新

**解决方案**：
```bash
# 检查 PNG 图标尺寸
file images/icon.png

# 清理 macOS 图标缓存
sudo rm -rf /Library/Caches/com.apple.iconservices.store
killall Dock
```

## 📊 图标质量检查

### 检查图标尺寸

```bash
# 检查 PNG 图标
file images/icon.png
# 期望输出：PNG image data, 512 x 512 或更高

# 检查 ICO 图标
file images/icon.ico
# 期望输出：MS Windows icon resource - ...
```

### 检查图标透明度

PNG 图标应该包含透明通道（alpha channel），以便在不同背景下正确显示。

可以使用图片查看器或 Photoshop 检查图标的透明度。

## 🎯 预期结果

### 开发环境 (npm run dev)

```
✅ 控制台输出：
[Window] 使用图标: /Users/xinnix/code/afs/opEnd/images/icon.png

✅ 窗口显示：
- 标题栏左侧显示图标
- 任务栏/Dock 显示图标
```

### 生产环境 (打包后)

**Windows**：
```
✅ 安装程序：
- 安装界面显示图标
- 进度条窗口显示图标

✅ 安装后：
- 桌面快捷方式显示图标
- 开始菜单显示图标
- 应用程序窗口显示图标
- 任务栏显示图标
```

**macOS**：
```
✅ .app 文件：
- Finder 中显示图标
- 应用程序文件夹显示图标

✅ 运行时：
- Dock 显示图标
- Command+Tab 显示图标
```

## 📝 测试记录模板

```markdown
### 测试日期：2025-10-13

#### 开发环境测试
- [ ] 窗口图标显示：✅/❌
- [ ] 控制台日志正常：✅/❌
- [ ] 任务栏图标显示：✅/❌

#### Windows 打包测试
- [ ] 安装程序图标：✅/❌
- [ ] 桌面快捷方式图标：✅/❌
- [ ] 运行时窗口图标：✅/❌
- [ ] 任务栏图标：✅/❌

#### macOS 打包测试
- [ ] .app 文件图标：✅/❌
- [ ] Dock 图标：✅/❌
- [ ] 窗口图标：✅/❌

#### 问题记录
- 问题描述：
- 解决方案：
```

## 🔄 下一步

测试完成后，如果一切正常，可以：

1. ✅ 提交代码变更
2. ✅ 更新版本说明
3. ✅ 发布新版本

如果遇到问题，参考上面的"问题排查"部分进行调试。

---

**测试准备**：✅ 已完成  
**待测试**：开发环境 + 生产打包
