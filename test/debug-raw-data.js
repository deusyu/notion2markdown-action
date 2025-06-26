const { Client } = require("@notionhq/client");
const fs = require('fs');

// 从环境变量或配置获取参数
const NOTION_SECRET = process.env.NOTION_SECRET || 'secret_AKVF87PSBTckXvvTOGlxKPn51E0wdVRY6KpLZdT6PzF';
const PAGE_ID = '2180efe9-d90d-8086-9228-ed871ed667b2'; // 包含mermaid的文章ID

async function debugRawNotionData() {
  console.log('🔍 开始深度调试Notion原始数据...\n');
  
  try {
    // 初始化Notion客户端
    const notion = new Client({ auth: NOTION_SECRET });
    
    console.log('📄 正在获取页面块数据...');
    
    // 获取页面的所有块
    const response = await notion.blocks.children.list({
      block_id: PAGE_ID,
    });
    
    console.log(`\n📊 共找到 ${response.results.length} 个块\n`);
    
    // 查找代码块
    const codeBlocks = response.results.filter(block => block.type === 'code');
    
    if (codeBlocks.length === 0) {
      console.log('❌ 没有找到代码块');
      return;
    }
    
    console.log(`✅ 发现 ${codeBlocks.length} 个代码块:\n`);
    
    codeBlocks.forEach((block, index) => {
      console.log(`--- 代码块 ${index + 1} ---`);
      console.log(`ID: ${block.id}`);
      console.log(`类型: ${block.type}`);
      console.log(`语言: ${block.code?.language || '未知'}`);
      
      // 检查所有可能的文本字段
      const codeObj = block.code;
      console.log(`\n代码对象结构:`);
      console.log(JSON.stringify(codeObj, null, 2));
      
      // 尝试提取文本内容
      let content = '';
      if (codeObj?.rich_text) {
        console.log(`\nrich_text字段存在: ${Array.isArray(codeObj.rich_text)}`);
        if (Array.isArray(codeObj.rich_text)) {
          console.log(`rich_text数组长度: ${codeObj.rich_text.length}`);
          content = codeObj.rich_text.map(t => t.plain_text || t.text?.content || '').join('\n');
          console.log(`从rich_text提取的内容: "${content}"`);
        }
      }
      
      if (codeObj?.text) {
        console.log(`\ntext字段存在: ${Array.isArray(codeObj.text)}`);
        if (Array.isArray(codeObj.text)) {
          console.log(`text数组长度: ${codeObj.text.length}`);
          const textContent = codeObj.text.map(t => t.plain_text || t.text?.content || '').join('\n');
          console.log(`从text提取的内容: "${textContent}"`);
          if (!content) content = textContent;
        }
      }
      
      // 检查其他可能的字段
      const otherFields = Object.keys(codeObj).filter(key => 
        !['language', 'rich_text', 'text'].includes(key)
      );
      if (otherFields.length > 0) {
        console.log(`\n其他字段: ${otherFields.join(', ')}`);
        otherFields.forEach(field => {
          console.log(`${field}:`, JSON.stringify(codeObj[field], null, 2));
        });
      }
      
      console.log(`\n最终提取的内容长度: ${content.length}`);
      if (content.length > 0) {
        console.log(`内容预览: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
    // 保存原始数据到文件
    const outputFile = 'debug-raw-notion-data.json';
    fs.writeFileSync(outputFile, JSON.stringify({
      pageId: PAGE_ID,
      totalBlocks: response.results.length,
      codeBlocks: codeBlocks,
      allBlocks: response.results
    }, null, 2));
    
    console.log(`💾 原始数据已保存到: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    if (error.code === 'unauthorized') {
      console.error('请检查NOTION_SECRET是否正确');
    }
  }
}

// 运行调试
debugRawNotionData(); 