console.log('🛩️ 航点转换使用平台速度功能验证');
console.log('=================================');

console.log('\n🎯 修改目标:');
console.log('- 航点转换时不再使用固定的默认速度10');
console.log('- 获取当前选择平台的速度数据');
console.log('- 将平台速度设置为各航点的速度');

console.log('\n🔧 修改内容:');

console.log('\n1. IPC通信修改:');
console.log('   修改前:');
console.log('   ```javascript');
console.log('   // 请求平台名称');
console.log('   window.webContents.send("route:requestSelectedPlatform");');
console.log('   // 响应平台名称');
console.log('   resolve(platformName);');
console.log('   ```');
console.log('   ');
console.log('   修改后:');
console.log('   ```javascript');
console.log('   // 请求平台数据');
console.log('   window.webContents.send("route:requestSelectedPlatformData");');
console.log('   // 响应平台数据');
console.log('   resolve({name: platformName, speed: platformSpeed});');
console.log('   ```');

console.log('\n2. 航点转换逻辑修改:');
console.log('   修改前:');
console.log('   ```javascript');
console.log('   return {');
console.log('     longitude: coord.longitude || 0,');
console.log('     latitude: coord.latitude || 0,');
console.log('     altitude: coord.altitude || 0,');
console.log('     labelName: `航点${index + 1}`,');
console.log('     speed: 10 // 固定默认速度');
console.log('   };');
console.log('   ```');
console.log('   ');
console.log('   修改后:');
console.log('   ```javascript');
console.log('   const platformSpeed = selectedPlatformData.speed || 10;');
console.log('   return {');
console.log('     longitude: coord.longitude || 0,');
console.log('     latitude: coord.latitude || 0,');
console.log('     altitude: coord.altitude || 0,');
console.log('     labelName: `航点${index + 1}`,');
console.log('     speed: platformSpeed // 使用平台速度');
console.log('   };');
console.log('   ```');

console.log('\n3. 前端响应逻辑:');
console.log('   ```javascript');
console.log('   // 获取当前选择平台的完整数据');
console.log('   const currentPlatform = platforms.value.find(p => p.name === selectedPlatform.value);');
console.log('   const platformData = {');
console.log('     name: selectedPlatform.value || "",');
console.log('     speed: currentPlatform?.base?.speed || undefined');
console.log('   };');
console.log('   ```');

console.log('\n📊 数据流程:');

console.log('\n   🔄 完整流程:');
console.log('   1. 导航软件发送航线数据 (UavRouteUpload)');
console.log('   2. 系统接收并验证UavId匹配');
console.log('   3. 请求当前选择的平台数据 (包含速度)');
console.log('   4. CommandTestPage响应平台数据');
console.log('   5. 使用平台速度转换航点');
console.log('   6. 发送PlatformCmd给平台');

console.log('\n   📡 平台数据结构:');
console.log('   ```javascript');
console.log('   {');
console.log('     name: "UAV-001",           // 平台名称');
console.log('     speed: 25                  // 平台当前速度 (m/s)');
console.log('   }');
console.log('   ```');

console.log('\n   🗺️ 转换后的航点:');
console.log('   ```javascript');
console.log('   [');
console.log('     {');
console.log('       longitude: 116.3974,');
console.log('       latitude: 39.9093,');
console.log('       altitude: 100,');
console.log('       labelName: "航点1",');
console.log('       speed: 25              // 使用平台速度而不是10');
console.log('     },');
console.log('     // ... 更多航点');
console.log('   ]');
console.log('   ```');

console.log('\n🧪 测试场景:');

console.log('\n   📊 场景1: 平台有速度数据');
console.log('   前提条件:');
console.log('   - 已选择平台 (如: UAV-001)');
console.log('   - 平台状态数据中包含速度信息 (如: 25 m/s)');
console.log('   测试步骤:');
console.log('   1. 发送航线数据包');
console.log('   2. 观察转换后的航点速度');
console.log('   预期结果: 所有航点速度为25 m/s');

console.log('\n   🔄 场景2: 平台无速度数据');
console.log('   前提条件:');
console.log('   - 已选择平台但速度数据为空或undefined');
console.log('   测试步骤:');
console.log('   1. 发送航线数据包');
console.log('   2. 观察转换后的航点速度');
console.log('   预期结果: 所有航点速度为默认值10 m/s');

console.log('\n   ❌ 场景3: 未选择平台');
console.log('   前提条件:');
console.log('   - 未选择任何平台');
console.log('   测试步骤:');
console.log('   1. 发送航线数据包');
console.log('   2. 观察系统响应');
console.log('   预期结果: 跳过转换，提示需要选择平台');

console.log('\n   🔍 场景4: 多个航点验证');
console.log('   前提条件:');
console.log('   - 选择速度为30 m/s的平台');
console.log('   - 发送包含5个航点的航线');
console.log('   测试步骤:');
console.log('   1. 发送多航点航线数据');
console.log('   2. 检查每个航点的速度设置');
console.log('   预期结果: 所有5个航点速度都为30 m/s');

console.log('\n📋 验证方法:');

console.log('\n   💻 控制台日志检查:');
console.log('   查找以下日志:');
console.log('   - "[RouteConverter] 使用选择的平台: UAV-001 速度: 25"');
console.log('   - "[RouteConverter] 使用平台速度: 25 m/s"');
console.log('   - "[CommandTestPage] 响应平台数据: {name: ..., speed: ...}"');

console.log('\n   📦 数据包内容验证:');
console.log('   1. 使用组播监听工具');
console.log('   2. 捕获转换后的PlatformCmd数据包');
console.log('   3. 检查navParam.route中每个航点的speed字段');
console.log('   4. 确认速度值与平台速度一致');

console.log('\n   🎛️ 界面操作验证:');
console.log('   1. 在CommandTestPage选择不同平台');
console.log('   2. 观察平台状态数据中的速度信息');
console.log('   3. 发送航线数据测试转换');
console.log('   4. 验证转换结果使用正确的速度');

console.log('\n✅ 成功标准:');
console.log('- 航点转换时正确获取平台速度数据');
console.log('- 所有航点使用平台速度而不是固定值10');
console.log('- 平台无速度数据时使用默认值10');
console.log('- 未选择平台时正确处理错误情况');
console.log('- IPC通信正常，数据传递准确');
console.log('- 控制台日志清晰显示使用的速度值');

console.log('\n🎯 功能优势:');
console.log('- 航点速度与平台实际速度保持一致');
console.log('- 提高航线规划的准确性');
console.log('- 减少手动设置速度的工作量');
console.log('- 支持动态速度调整');

console.log('\n🚀 开始测试平台速度航点转换功能！');