const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require('fs');

// 使用实际的配置
const config = {
  notion_secret: "secret_AKVF87PSBTckXvvTOGlxKPn51E0wdVRY6KpLZdT6PzF",
  database_id: "352e56744bf4459b814b4d8fdb311267"
};

const PAGE_ID = '2180efe9-d90d-8086-9228-ed871ed667b2'; // 包含mermaid的文章ID

// 自定义代码块转换器 - 与实际代码相同
function codeBlock(block) {
  const { code } = block;
  if (!code) return "";
  
  let codeContent = "";
  const language = code.language || "";
  
  console.log(`\n🔍 调试代码块转换:`);
  console.log(`  - 块ID: ${block.id}`);
  console.log(`  - 语言: ${language}`);
  console.log(`  - code对象:`, JSON.stringify(code, null, 2));
  
  // 尝试从多个可能的字段获取代码内容
  if (code.rich_text && Array.isArray(code.rich_text) && code.rich_text.length > 0) {
    // 方式1：从rich_text字段获取（某些情况下）
    console.log(`  - 从rich_text提取`);
    codeContent = code.rich_text.map((t) => t.plain_text || t.text?.content || "").join("\n");
  } else if (code.text && Array.isArray(code.text) && code.text.length > 0) {
    // 方式2：从text字段获取（notion-to-md转换后的格式）
    console.log(`  - 从text提取`);
    codeContent = code.text.map((t) => t.plain_text || t.text?.content || "").join("\n");
  }
  
  console.log(`  - 提取的内容长度: ${codeContent.length}`);
  if (codeContent.length > 0) {
    console.log(`  - 内容预览: ${codeContent.substring(0, 100)}...`);
  }
  
  return `\`\`\`${language}\n${codeContent}\n\`\`\``;
}

async function testWithActualConfig() {
  console.log('🚀 使用实际配置测试mermaid转换...\n');
  
  try {
    // 初始化Notion客户端
    const notion = new Client({ auth: config.notion_secret });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    
    // 注册自定义代码块转换器
    n2m.setCustomTransformer("code", codeBlock);
    
    console.log('📄 正在获取文章内容...');
    
    // 获取页面的markdown块
    const mdBlocks = await n2m.pageToMarkdown(PAGE_ID);
    
    console.log(`\n📊 转换到的markdown块数: ${mdBlocks.length}`);
    
    // 找到代码块
    const codeBlocks = mdBlocks.filter(block => block.type === 'code');
    console.log(`🔍 发现 ${codeBlocks.length} 个代码块`);
    
    codeBlocks.forEach((block, index) => {
      console.log(`\n--- Markdown块 ${index + 1} ---`);
      console.log(JSON.stringify(block, null, 2));
    });
    
    // 转换为markdown字符串
    const markdownString = n2m.toMarkdownString(mdBlocks);
    
    console.log('\n📄 最终markdown结果:');
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
    const outputFile = 'test-result-with-config.md';
    fs.writeFileSync(outputFile, markdownString.parent);
    console.log(`\n💾 结果已保存到: ${outputFile}`);
    
    console.log('\n🎉 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.code === 'unauthorized') {
      console.error('请检查NOTION_SECRET是否正确');
    }
    console.error('完整错误:', error);
  }
}

// 运行测试
testWithActualConfig(); 