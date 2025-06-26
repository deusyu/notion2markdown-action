const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require('fs');

// 从环境变量或配置获取参数
const NOTION_SECRET = process.env.NOTION_SECRET || 'secret_AKVF87PSBTckXvvTOGlxKPn51E0wdVRY6KpLZdT6PzF';
const PAGE_ID = '2180efe9-d90d-8086-9228-ed871ed667b2'; // 包含mermaid的文章ID

// 自定义代码块转换器
function customCodeBlock(block) {
  const { code } = block;
  if (!code) return "";
  
  let codeContent = "";
  const language = code.language || "";
  
  // 尝试从多个可能的字段获取代码内容
  if (code.rich_text && Array.isArray(code.rich_text) && code.rich_text.length > 0) {
    codeContent = code.rich_text.map((t) => t.plain_text || t.text?.content || "").join("\n");
  } else if (code.text && Array.isArray(code.text) && code.text.length > 0) {
    codeContent = code.text.map((t) => t.plain_text || t.text?.content || "").join("\n");
  }
  
  console.log(`🔍 代码块分析:`);
  console.log(`  - 语言: ${language}`);
  console.log(`  - rich_text字段: ${code.rich_text ? '存在' : '不存在'}`);
  console.log(`  - text字段: ${code.text ? '存在' : '不存在'}`);
  console.log(`  - 内容长度: ${codeContent.length}`);
  if (language === 'mermaid') {
    console.log(`  - Mermaid内容预览: ${codeContent.substring(0, 100)}...`);
  }
  
  return `\`\`\`${language}\n${codeContent}\n\`\`\``;
}

async function testMermaidConversion() {
  console.log('🚀 开始Mermaid转换最终测试...\n');
  
  try {
    // 初始化Notion客户端
    const notion = new Client({ auth: NOTION_SECRET });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    
    // 注册自定义代码块转换器
    n2m.setCustomTransformer("code", customCodeBlock);
    
    console.log('📄 正在获取文章内容...');
    
    // 获取页面的markdown块
    const mdBlocks = await n2m.pageToMarkdown(PAGE_ID);
    
    // 转换为markdown字符串
    const markdownString = n2m.toMarkdownString(mdBlocks);
    
    console.log('\n📊 转换结果分析:');
    console.log(`- 总字符数: ${markdownString.parent.length}`);
    
    // 检查mermaid代码块
    const mermaidMatches = markdownString.parent.match(/```mermaid\n([\s\S]*?)\n```/g);
    if (mermaidMatches) {
      console.log(`✅ 发现 ${mermaidMatches.length} 个mermaid代码块:`);
      mermaidMatches.forEach((match, index) => {
        const content = match.replace(/```mermaid\n/, '').replace(/\n```$/, '');
        console.log(`  ${index + 1}. 长度: ${content.length} 字符`);
        if (content.length > 0) {
          console.log(`     内容: ${content.substring(0, 50)}...`);
        } else {
          console.log(`     ⚠️  内容为空!`);
        }
      });
    } else {
      console.log('❌ 未发现mermaid代码块');
    }
    
    // 保存到文件
    const outputFile = 'test-result-mermaid-final.md';
    fs.writeFileSync(outputFile, markdownString.parent);
    console.log(`\n💾 结果已保存到: ${outputFile}`);
    
    console.log('\n🎉 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.code === 'unauthorized') {
      console.error('请检查NOTION_SECRET是否正确');
    }
  }
}

// 运行测试
testMermaidConversion(); 