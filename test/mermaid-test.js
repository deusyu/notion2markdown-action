/**
 * 测试mermaid代码块转换
 */

// 从实际API获取的数据结构
const realMermaidBlock = {
  type: "code",
  code: {
    language: "mermaid",
    rich_text: [
      {
        type: "text",
        text: {
          content: "graph LR\n  X -->|高亮| Readwise --> Notion\n  Voicenote --> Notion\n  Notion -->|Prompt| AI\n  AI --> Notion\n  Notion -->|成熟| PureWriting\n",
          link: null
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: "default"
        },
        plain_text: "graph LR\n  X -->|高亮| Readwise --> Notion\n  Voicenote --> Notion\n  Notion -->|Prompt| AI\n  AI --> Notion\n  Notion -->|成熟| PureWriting\n",
        href: null
      }
    ]
  }
};

// 当前的codeBlock函数
function codeBlock(block) {
  const { code } = block;
  if (!code) return "";
  
  // 安全地获取代码内容，处理 rich_text 可能为 undefined 的情况
  const codeContent = code.rich_text && Array.isArray(code.rich_text) 
    ? code.rich_text.map((t) => t.plain_text).join("\n")
    : "";
  
  const language = code.language || "";
  
  return `\`\`\`${language}\n${codeContent}\n\`\`\``;
}

// 测试函数
function testMermaidConversion() {
  console.log('🧪 测试mermaid代码块转换...\n');
  
  console.log('📊 输入数据:');
  console.log(JSON.stringify(realMermaidBlock, null, 2));
  
  console.log('\n🔄 开始转换...');
  const result = codeBlock(realMermaidBlock);
  
  console.log('\n📝 转换结果:');
  console.log(result);
  
  console.log('\n📏 结果分析:');
  console.log(`- 结果长度: ${result.length}`);
  console.log(`- 是否包含mermaid: ${result.includes('mermaid')}`);
  console.log(`- 是否包含内容: ${result.length > 20}`);
  console.log(`- 是否为空: ${result.trim() === '' || result === '```mermaid\n\n```'}`);
  
  if (result.trim() === '' || result === '```mermaid\n\n```') {
    console.log('❌ 发现问题：转换结果为空！');
    
    // 调试信息
    const { code } = realMermaidBlock;
    console.log('\n🔍 调试信息:');
    console.log(`- code存在: ${!!code}`);
    console.log(`- rich_text存在: ${!!code.rich_text}`);
    console.log(`- rich_text是数组: ${Array.isArray(code.rich_text)}`);
    console.log(`- rich_text长度: ${code.rich_text?.length || 0}`);
    
    if (code.rich_text && code.rich_text[0]) {
      console.log(`- 第一个元素的plain_text: "${code.rich_text[0].plain_text}"`);
      console.log(`- 第一个元素的text.content: "${code.rich_text[0].text?.content}"`);
    }
  } else {
    console.log('✅ 转换成功！');
  }
}

// 运行测试
testMermaidConversion(); 