# 导航软件工作目录问题修复

## 问题描述

当通过无人机页面启动导航软件时，Nav 软件无法加载自己目录下的配置文件。这是因为启动时没有正确设置工作目录（`cwd`），导致 Nav 软件在错误的目录下查找配置文件。

## 问题原因

### 原始启动代码问题
```javascript
// 问题代码：没有设置工作目录
const child = spawn(navExePath, [], {
  detached: true,
  stdio: 'ignore',
  windowsHide: false
});
```

### 问题分析
1. **默认工作目录**: 当不设置 `cwd` 时，子进程继承父进程的工作目录
2. **父进程目录**: 主应用程序的工作目录通常是应用程序根目录
3. **配置文件位置**: Nav 软件的配置文件在 `Nav/` 目录下
4. **查找失败**: Nav 软件在错误的目录下查找配置文件，导致加载失败

## 解决方案

### 1. 修改启动逻辑
```javascript
// 修复后的代码：正确设置工作目录
const navWorkingDir = navConfigService.getNavWorkingDirectory();

const spawnOptions = {
  detached: startupOptions.detached,
  stdio: startupOptions.stdio,
  windowsHide: startupOptions.windowsHide,
  cwd: navWorkingDir,  // 关键修复：设置工作目录
  env: { ...process.env }  // 继承环境变量
};

const child = spawn(navExePath, [], spawnOptions);
```

### 2. 添加工作目录获取方法
```javascript
// 在 nav-config.service.ts 中添加
public getNavWorkingDirectory(): string | null {
  const navPath = this.getNavPath();
  if (!navPath) {
    return null;
  }
  
  // 返回导航软件所在的目录
  return require('path').dirname(navPath);
}
```

### 3. 更新配置选项
```json
{
  "navigation": {
    "startupOptions": {
      "detached": true,
      "stdio": "ignore",
      "windowsHide": false,
      "setWorkingDirectory": true,  // 新增：是否设置工作目录
      "inheritEnv": true           // 新增：是否继承环境变量
    }
  }
}
```

## 测试验证

### 测试脚本
创建了 `testScipt/test-nav-cwd-simple.js` 来验证修复效果：

```bash
node testScipt/test-nav-cwd-simple.js
```

### 测试结果
```
1️⃣ 测试：不设置工作目录
当前目录: /Users/user/project
❌ 未找到配置文件

2️⃣ 测试：设置工作目录为Nav目录  
当前目录: /Users/user/project/Nav
✅ 找到配置文件
```

## 技术细节

### 工作目录的重要性
1. **相对路径解析**: 程序查找配置文件时使用相对路径
2. **当前目录**: `./config.ini` 会在当前工作目录查找
3. **子进程继承**: 子进程默认继承父进程的工作目录

### spawn 选项说明
- `cwd`: 设置子进程的工作目录
- `env`: 设置环境变量
- `detached`: 是否分离进程
- `stdio`: 标准输入输出处理方式

## 部署注意事项

### 目录结构要求
```
应用程序目录/
├── 主程序.exe
└── Nav/
    ├── Nav.exe
    ├── config.ini
    ├── settings.json
    └── [其他配置文件]
```

### 配置文件检查
确保 Nav 目录包含所有必要的配置文件：
- 主配置文件
- 用户设置
- 日志配置
- 网络配置等

## 故障排除

### 常见问题
1. **配置文件不存在**: 检查 Nav 目录下是否有配置文件
2. **权限问题**: 确保配置文件可读
3. **路径错误**: 验证工作目录设置是否正确

### 调试方法
1. **查看日志**: 检查控制台输出的工作目录信息
2. **文件检查**: 验证配置文件是否存在
3. **路径测试**: 使用测试脚本验证路径解析

## 最佳实践

### 1. 启动前检查
```javascript
// 检查工作目录和配置文件
const workingDir = navConfigService.getNavWorkingDirectory();
const configExists = fs.existsSync(path.join(workingDir, 'config.ini'));

if (!configExists) {
  console.warn('配置文件不存在，Nav软件可能无法正常工作');
}
```

### 2. 日志记录
```javascript
console.log(`[Nav] 导航软件路径: ${navExePath}`);
console.log(`[Nav] 工作目录: ${workingDir}`);
console.log(`[Nav] 配置文件检查: ${configExists ? '存在' : '不存在'}`);
```

### 3. 错误处理
```javascript
child.on('error', (error) => {
  console.error(`[Nav] 启动错误: ${error.message}`);
});

child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`[Nav] 异常退出，退出码: ${code}`);
  }
});
```

## 更新日志

### v1.1.0 (2025-01-08)
- ✅ 修复工作目录设置问题
- ✅ 添加环境变量继承
- ✅ 增强启动日志记录
- ✅ 添加配置文件检查

---

**状态**: ✅ 已修复  
**影响**: 导航软件现在能正确加载配置文件  
**测试**: 通过工作目录测试验证