const notion = require("../src/notion");

// 使用你的实际配置
const config = {
  notion_secret: "secret_AKVF87PSBTckXvvTOGlxKPn51E0wdVRY6KpLZdT6PzF",
  database_id: "352e56744bf4459b814b4d8fdb311267",
  migrate_image: false, // 先不测试图床，只关注mermaid
  picBed: {},
  pic_compress: false,
  status: {
    name: "status", // 尝试不同的字段名
    published: "已发布",
    unpublish: "草稿"
  },
  output_dir: {
    page: "test-output/pages/",
    post: "test-output/posts/",
    clean_unpublished_post: false
  },
  metas_keeped: [],
  metas_excluded: [],
  timezone: "Asia/Shanghai",
  last_sync_datetime: null
};

async function finalTest() {
  console.log('🎯 最终测试：使用真实配置测试mermaid转换\n');
  
  try {
    // 初始化notion模块
    notion.init(config);
    
    console.log('🚀 开始同步...');
    
    // 执行同步
    const result = await notion.sync();
    
    console.log('\n📊 同步结果:');
    console.log(`- 查询到页面数: ${result.queried}`);
    console.log(`- 处理成功数: ${result.handled}`);
    console.log(`- 删除文件数: ${result.deleted}`);
    
    // 检查生成的文件
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = config.output_dir.post;
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      console.log(`\n📁 生成文件 (${files.length}个):`);
      
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(outputDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          console.log(`\n--- ${file} ---`);
          console.log(`文件大小: ${content.length} 字符`);
          
          // 检查mermaid代码块
          const mermaidMatches = content.match(/```mermaid\n([\s\S]*?)\n```/g);
          if (mermaidMatches) {
            console.log(`✅ 发现 ${mermaidMatches.length} 个mermaid代码块:`);
            mermaidMatches.forEach((match, index) => {
              const mermaidContent = match.replace(/```mermaid\n/, '').replace(/\n```$/, '');
              console.log(`  ${index + 1}. 长度: ${mermaidContent.length} 字符`);
              if (mermaidContent.length > 0) {
                console.log(`     内容: ${mermaidContent.substring(0, 100)}...`);
              } else {
                console.log(`     ⚠️  内容为空!`);
              }
            });
          } else {
            console.log('❌ 未发现mermaid代码块');
          }
        }
      });
    } else {
      console.log('❌ 输出目录不存在');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    // 如果是状态字段问题，提供建议
    if (error.message.includes('property') || error.message.includes('status')) {
      console.log('\n💡 可能的解决方案:');
      console.log('1. 检查Notion数据库中的状态字段名（可能是pstatus、Status、state等）');
      console.log('2. 检查状态值（可能是Published、已发布、发布等）');
    }
  }
}

finalTest(); 