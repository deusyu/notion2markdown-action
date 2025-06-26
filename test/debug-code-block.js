const { NotionToMarkdown } = require("notion-to-md");

// 模拟不同的代码块数据结构
const testCases = [
  {
    name: "标准rich_text格式（正常情况）",
    block: {
      type: "code",
      id: "test1",
      code: {
        language: "mermaid",
        rich_text: [
          {
            plain_text: "graph LR\n  X -->|高亮| Readwise --> Notion\n  Voicenote --> Notion\n  Notion -->|Prompt| AI\n  AI --> Notion\n  Notion -->|成熟| PureWriting"
          }
        ]
      }
    }
  },
  {
    name: "text格式（备用情况）",
    block: {
      type: "code", 
      id: "test2",
      code: {
        language: "mermaid",
        text: [
          {
            plain_text: "graph LR\n  X -->|高亮| Readwise --> Notion\n  Voicenote --> Notion\n  Notion -->|Prompt| AI\n  AI --> Notion\n  Notion -->|成熟| PureWriting"
          }
        ]
      }
    }
  },
  {
    name: "rich_text为空数组",
    block: {
      type: "code",
      id: "test3", 
      code: {
        language: "mermaid",
        rich_text: []
      }
    }
  },
  {
    name: "rich_text字段缺失",
    block: {
      type: "code",
      id: "test4",
      code: {
        language: "mermaid"
      }
    }
  },
  {
    name: "完全空的code对象",
    block: {
      type: "code",
      id: "test5",
      code: {}
    }
  }
];

// 引入我们的自定义转换器
function codeBlock(block) {
  const { code } = block;
  if (!code) return "";
  
  let codeContent = "";
  const language = code.language || "";
  
  console.log(`DEBUG: codeBlock - 语言=${language}, code对象:`, JSON.stringify(code, null, 2));
  
  // 尝试从多个可能的字段获取代码内容
  if (code.rich_text && Array.isArray(code.rich_text) && code.rich_text.length > 0) {
    // 方式1：从rich_text字段获取（标准情况）
    codeContent = code.rich_text.map((t) => t.plain_text || "").join("\n");
    console.log(`DEBUG: 从rich_text获取内容: "${codeContent}"`);
  } else if (code.text && Array.isArray(code.text) && code.text.length > 0) {
    // 方式2：从text字段获取（备用情况）
    codeContent = code.text.map((t) => t.plain_text || t.text?.content || "").join("\n");
    console.log(`DEBUG: 从text获取内容: "${codeContent}"`);
  } else {
    // 方式3：检查其他可能的字段
    console.log(`DEBUG: rich_text和text都为空，检查其他字段`);
    
    // 尝试直接从code对象的其他属性获取
    const allKeys = Object.keys(code);
    console.log(`DEBUG: code对象的所有键: ${allKeys.join(', ')}`);
    
    // 如果rich_text字段存在但为空数组，创建默认的空内容，避免内置逻辑报错
    if (!code.rich_text || !Array.isArray(code.rich_text)) {
      console.log(`DEBUG: rich_text字段缺失或格式错误，创建默认值`);
      // 直接返回空代码块，避免内置逻辑处理时出错
      return `\`\`\`${language}\n\n\`\`\``;
    }
  }
  
  console.log(`DEBUG: 最终内容长度=${codeContent.length}`);
  
  // 始终返回有效的代码块格式
  return `\`\`\`${language}\n${codeContent}\n\`\`\``;
}

async function testCodeBlockTransformer() {
  console.log('🧪 测试代码块转换器\n');
  
  // 创建NotionToMarkdown实例（不需要真实的客户端）
  const n2m = new NotionToMarkdown({ notionClient: {} });
  
  // 注册自定义转换器
  n2m.setCustomTransformer("code", codeBlock);
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`--- 测试 ${i + 1}: ${testCase.name} ---`);
    
    try {
      const result = await n2m.blockToMarkdown(testCase.block);
      console.log(`✅ 结果: ${result}`);
      
      // 检查mermaid内容
      if (testCase.block.code.language === 'mermaid') {
        const mermaidMatch = result.match(/```mermaid\n([\s\S]*?)\n```/);
        if (mermaidMatch) {
          const content = mermaidMatch[1];
          console.log(`📊 Mermaid内容长度: ${content.length} 字符`);
          if (content.length > 0) {
            console.log(`📝 内容预览: ${content.substring(0, 50)}...`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎉 测试完成!');
}

testCodeBlockTransformer(); 