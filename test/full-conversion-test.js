/**
 * 完整转换流程测试
 * 模拟真实的notion2markdown转换过程
 */

const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");

// 加载配置
let config;
try {
  config = require('../test.config.local.js');
} catch (err) {
  config = require('../test.config.js');
}

// 测试页面ID（包含mermaid的文章）
const targetPageId = "2180efe9-d90d-8086-9228-ed871ed667b2";

// 自定义的codeBlock函数（修复版）
function codeBlock(block) {
  console.log('🔧 自定义codeBlock函数被调用!');
  console.log('输入块:', JSON.stringify(block, null, 2));
  
  const { code } = block;
  if (!code) {
    console.log('❌ 没有code属性');
    return "";
  }
  
  let codeContent = "";
  const language = code.language || "";
  
  // 尝试从多个可能的字段获取代码内容
  if (code.rich_text && Array.isArray(code.rich_text) && code.rich_text.length > 0) {
    // 方式1：从rich_text字段获取（某些情况下）
    codeContent = code.rich_text.map((t) => t.plain_text || t.text?.content || "").join("\n");
    console.log('📍 从 rich_text 字段获取内容');
  } else if (code.text && Array.isArray(code.text) && code.text.length > 0) {
    // 方式2：从text字段获取（notion-to-md转换后的格式）
    codeContent = code.text.map((t) => t.plain_text || t.text?.content || "").join("\n");
    console.log('📍 从 text 字段获取内容');
  } else {
    console.log('❌ 无法找到内容字段');
    console.log('可用字段:', Object.keys(code));
  }
  
  const result = `\`\`\`${language}\n${codeContent}\n\`\`\``;
  console.log('🎯 codeBlock转换结果:', result);
  console.log('🎯 结果长度:', result.length);
  console.log('🎯 内容长度:', codeContent.length);
  
  return result;
}

async function testFullConversion() {
  console.log('🚀 开始完整转换流程测试...\n');
  
  try {
    // 初始化Notion客户端
    const notion = new Client({ auth: config.notion_secret });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    
    // 设置自定义转换器
    console.log('⚙️ 设置自定义codeBlock转换器...');
    n2m.setCustomTransformer("code", codeBlock);
    
    console.log('📄 获取页面markdown...');
    const mdblocks = await n2m.pageToMarkdown(targetPageId);
    
    console.log(`📦 获得 ${mdblocks.length} 个markdown块`);
    
    // 查找代码块
    const codeBlocks = mdblocks.filter(block => block.type === 'code');
    console.log(`💻 代码块数量: ${codeBlocks.length}`);
    
    // 显示所有代码块
    codeBlocks.forEach((block, index) => {
      console.log(`\n--- 代码块 ${index + 1} ---`);
      console.log('类型:', block.type);
      console.log('父内容:', block.parent);
      console.log('子内容:', block.children || '无');
    });
    
    console.log('\n🔄 转换为最终markdown...');
    const markdownString = n2m.toMarkdownString(mdblocks);
    
    console.log('\n📝 最终markdown结果:');
    console.log('='.repeat(50));
    console.log(markdownString.parent);
    console.log('='.repeat(50));
    
    // 检查最终结果中的mermaid
    const hasMermaid = markdownString.parent.includes('```mermaid');
    const hasContent = markdownString.parent.includes('graph LR');
    
    console.log('\n🔍 最终分析:');
    console.log(`- 包含mermaid标记: ${hasMermaid}`);
    console.log(`- 包含mermaid内容: ${hasContent}`);
    console.log(`- 最终markdown长度: ${markdownString.parent.length}`);
    
    if (!hasMermaid || !hasContent) {
      console.log('❌ 发现问题：最终markdown中mermaid内容丢失！');
    } else {
      console.log('✅ 转换成功！mermaid内容保留完整');
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testFullConversion(); 