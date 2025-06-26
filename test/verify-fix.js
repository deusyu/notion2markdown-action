/**
 * 验证mermaid修复是否生效
 */

const { init, sync } = require('../src/notion');

// 使用本地配置
let config;
try {
  config = require('../test.config.local.js');
} catch (err) {
  config = require('../test.config.js');
}

async function verifyFix() {
  console.log('🔧 验证mermaid修复...\n');
  
  try {
    // 设置清理标志为false，避免删除文件
    config.output_dir.clean_unpublished_post = false;
    
    console.log('⚙️ 初始化转换工具...');
    init(config);
    
    console.log('🔄 开始转换...');
    const result = await sync();
    
    console.log('\n📊 转换结果:');
    console.log(`- 查询页面: ${result.queried}`);
    console.log(`- 处理页面: ${result.handled}`);
    console.log(`- 删除页面: ${result.deleted}`);
    
    if (result.handled > 0) {
      console.log('\n✅ 转换完成！请检查输出文件中的mermaid内容。');
      console.log(`📁 输出目录: ${config.output_dir.post}`);
    } else {
      console.log('\n⚠️  没有页面被处理，可能是增量同步或状态过滤的结果。');
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行验证
verifyFix(); 