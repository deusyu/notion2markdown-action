/**
 * 简单测试 - 只转换特定页面，避免同步逻辑
 */

const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require('fs');
const path = require('path');

// 加载配置
let config;
try {
  config = require('../test.config.local.js');
} catch (err) {
  config = require('../test.config.js');
}

// 自定义codeBlock函数（从src/notion.js复制）
function codeBlock(block) {
  const { code } = block;
  if (!code) return "";
  
  let codeContent = "";
  const language = code.language || "";
  
  // 尝试从多个可能的字段获取代码内容
  if (code.rich_text && Array.isArray(code.rich_text) && code.rich_text.length > 0) {
    // 方式1：从rich_text字段获取（某些情况下）
    codeContent = code.rich_text.map((t) => t.plain_text || t.text?.content || "").join("\n");
  } else if (code.text && Array.isArray(code.text) && code.text.length > 0) {
    // 方式2：从text字段获取（notion-to-md转换后的格式）
    codeContent = code.text.map((t) => t.plain_text || t.text?.content || "").join("\n");
  }
  
  console.log(`DEBUG: codeBlock - 语言=${language}, 内容长度=${codeContent.length}`);
  
  return `\`\`\`${language}\n${codeContent}\n\`\`\``;
}

async function testSinglePage() {
  console.log('🧪 测试单页面转换（包含mermaid）...\n');
  
  try {
    const pageId = "2180efe9-d90d-8086-9228-ed871ed667b2";
    
    // 初始化客户端
    const notion = new Client({ auth: config.notion_secret });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    
    // 设置自定义转换器
    n2m.setCustomTransformer("code", codeBlock);
    console.log('✅ 设置自定义代码块转换器');
    
    // 获取页面信息
    console.log('📄 获取页面信息...');
    const page = await notion.pages.retrieve({ page_id: pageId });
    const title = page.properties.title?.title?.[0]?.plain_text || '无标题';
    console.log(`页面标题: ${title}`);
    
    // 转换为markdown
    console.log('🔄 转换为markdown...');
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const markdownString = n2m.toMarkdownString(mdblocks);
    
    // 检查结果
    const hasMermaid = markdownString.parent.includes('```mermaid');
    const hasContent = markdownString.parent.includes('graph LR');
    
    console.log('\n📊 转换结果:');
    console.log(`- 包含mermaid标记: ${hasMermaid}`);
    console.log(`- 包含mermaid内容: ${hasContent}`);
    console.log(`- markdown总长度: ${markdownString.parent.length}`);
    
    // 保存到文件
    const outputFile = 'test-output.md';
    fs.writeFileSync(outputFile, markdownString.parent);
    console.log(`\n💾 已保存到: ${outputFile}`);
    
    if (hasMermaid && hasContent) {
      console.log('\n🎉 成功！mermaid代码块转换正常！');
      
      // 显示mermaid部分
      const mermaidMatch = markdownString.parent.match(/```mermaid[\s\S]*?```/);
      if (mermaidMatch) {
        console.log('\n🎯 mermaid内容:');
        console.log('━'.repeat(40));
        console.log(mermaidMatch[0]);
        console.log('━'.repeat(40));
      }
    } else {
      console.log('\n❌ 失败：mermaid内容未正确转换');
    }
    
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    if (error.code === 'object_not_found') {
      console.error('可能原因：页面不存在或没有访问权限');
    }
  }
}

// 运行测试
testSinglePage(); 