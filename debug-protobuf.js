const protobuf = require('protobufjs');
const path = require('path');

async function debugProtobuf() {
  try {
    console.log('加载protobuf定义...');
    
    const root = await protobuf.load([
      path.join(__dirname, 'src/protobuf/PublicStruct.proto'),
      path.join(__dirname, 'src/protobuf/PlatFormStatus.proto')
    ]);
    
    console.log('✅ Protobuf定义加载成功');
    console.log('可用的类型:', Object.keys(root.nested || {}));
    
    // 从实际接收到的数据中提取protobuf部分
    const fullPacket = 'aa5501292200000008e90710041a1b0947688f1ec6195d4011a772f334b7f3434019ec75870b56e35840';
    const protobufHex = fullPacket.substring(16); // 跳过前8字节的头部
    const protobufData = Buffer.from(protobufHex, 'hex');
    
    console.log('原始数据包:', fullPacket);
    console.log('Protobuf数据:', protobufHex);
    console.log('Protobuf数据长度:', protobufData.length);
    
    // 尝试解析
    try {
      const PlatformStatusInfo = root.lookupType('PlatformStatus.PlatformStatusInfo');
      console.log('✅ 找到PlatformStatusInfo类型');
      
      const decoded = PlatformStatusInfo.decode(protobufData);
      console.log('✅ 解码成功:', JSON.stringify(decoded, null, 2));
      
    } catch (error) {
      console.error('❌ 解码失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugProtobuf();