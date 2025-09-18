# Windows变量冲突修复

## 问题描述
TypeScript编译器报告了重复声明的`windows`变量错误：
```
[tsc] main.ts(326,11): error TS2451: Cannot redeclare block-scoped variable 'windows'.
[tsc] main.ts(406,11): error TS2451: Cannot redeclare block-scoped variable 'windows'.
```

## 根本原因
在`handleRouteUpload`函数中，多次使用`const windows = BrowserWindow.getAllWindows()`声明了同名变量，导致块作用域冲突。

## 修复方案
将`BrowserWindow.getAllWindows()`的调用移到函数开始处，使用`allWindows`作为变量名，避免重复声明：

### 修复前
```typescript
async function handleRouteUpload(parsedPacket: any) {
  try {
    // ... 其他代码 ...
    
    // 第一次声明
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      // ...
    });
    
    // 第二次声明 - 导致冲突
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
      // ...
    }
    
    // 第三次声明 - 导致冲突
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      // ...
    });
    
  } catch (error) {
    // 第四次声明 - 导致冲突且作用域问题
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      // ...
    });
  }
}
```

### 修复后
```typescript
async function handleRouteUpload(parsedPacket: any) {
  // 在函数开始处声明一次，整个函数都可以使用
  const allWindows = BrowserWindow.getAllWindows();
  
  try {
    // ... 其他代码 ...
    
    // 使用统一的变量名
    allWindows.forEach(window => {
      // ...
    });
    
    if (allWindows.length === 0) {
      // ...
    }
    
    allWindows.forEach(window => {
      // ...
    });
    
  } catch (error) {
    // catch块中也可以访问allWindows
    allWindows.forEach(window => {
      // ...
    });
  }
}
```

## 修复内容
1. 将`const allWindows = BrowserWindow.getAllWindows()`移到函数开始处
2. 将所有`windows`引用改为`allWindows`
3. 确保try和catch块都能访问到同一个变量

## 验证结果
- ✅ TypeScript编译错误已解决
- ✅ 功能逻辑保持不变
- ✅ 代码更加清晰和一致

## 相关文件
- `src/main/main.ts` - 主要修复文件

## 注意事项
其他地方的`const windows = BrowserWindow.getAllWindows()`声明（如事件监听器中的）没有冲突，因为它们在不同的函数作用域中。