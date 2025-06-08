/**
 * 简化的视频功能测试
 * 只测试视频转换功能，不涉及复杂依赖
 */

const { video, getUrlFromFileOrExternalBlock } = require('../src/customTransformer');

console.log('🎬 开始视频功能测试...\n');

// 测试 getUrlFromFileOrExternalBlock 函数
async function testUrlExtraction() {
  console.log('=== 🔗 URL提取功能测试 ===');
  
  const testCases = [
    {
      name: "视频类型块",
      block: {
        type: 'video',
        video: { url: 'https://example.com/test.mp4' }
      },
      expected: 'https://example.com/test.mp4'
    },
    {
      name: "外部类型块", 
      block: {
        type: 'external',
        external: { url: 'https://example.com/external.mp4' }
      },
      expected: 'https://example.com/external.mp4'
    },
    {
      name: "文件类型块",
      block: {
        type: 'file',
        file: { url: 'https://example.com/file.mp4' }
      },
      expected: 'https://example.com/file.mp4'
    },
    {
      name: "直接URL对象",
      block: { url: 'https://example.com/direct.mp4' },
      expected: 'https://example.com/direct.mp4'
    },
    {
      name: "无效块",
      block: null,
      expected: false
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    try {
      const result = getUrlFromFileOrExternalBlock(testCase.block, 'video');
      const success = result === testCase.expected;
      
      console.log(`${success ? '✅' : '❌'} ${testCase.name}: ${success ? '通过' : '失败'}`);
      if (!success) {
        console.log(`   期望: ${testCase.expected}, 实际: ${result}`);
      }
      
      if (success) passed++;
    } catch (error) {
      console.log(`❌ ${testCase.name}: 出错 - ${error.message}`);
    }
  }
  
  console.log(`\n📊 URL提取测试结果: ${passed}/${total} 通过\n`);
  return passed === total;
}

// 测试视频转换功能
async function testVideoTransformation() {
  console.log('=== 🎥 视频转换功能测试 ===');
  
  const testCases = [
    {
      name: "YouTube视频",
      block: {
        video: {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          caption: [{ plain_text: "YouTube测试视频" }]
        }
      },
      expectations: {
        hasIframe: true,
        hasEmbed: true,
        hasCaption: true,
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    },
    {
      name: "YouTube短链接",
      block: {
        video: {
          url: "https://youtu.be/dQw4w9WgXcQ",
          caption: []
        }
      },
      expectations: {
        hasIframe: true,
        hasEmbed: true,
        hasCaption: false,
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    },
    {
      name: "Bilibili视频",
      block: {
        video: {
          url: "https://www.bilibili.com/video/BV1xx411c7mu",
          caption: [{ plain_text: "B站测试视频" }]
        }
      },
      expectations: {
        hasIframe: true,
        hasEmbed: false,
        hasCaption: true,
        containsText: "player.bilibili.com"
      }
    },
    {
      name: "QQ视频",
      block: {
        video: {
          url: "https://v.qq.com/x/page/abc123456.html",
          caption: []
        }
      },
      expectations: {
        hasIframe: true,
        hasEmbed: false,
        hasCaption: false,
        containsText: "v.qq.com"
      }
    },
    {
      name: "普通MP4文件",
      block: {
        video: {
          url: "https://example.com/video.mp4",
          caption: [{ plain_text: "普通视频文件" }]
        }
      },
      expectations: {
        hasIframe: true,
        hasEmbed: false,
        hasCaption: true,
        originalUrl: true
      }
    },
    {
      name: "无效视频块",
      block: {
        video: null
      },
      expectations: {
        shouldFail: true
      }
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`\n📺 测试: ${testCase.name}`);
    
    try {
      const result = await video(testCase.block);
      const expectations = testCase.expectations;
      
      if (expectations.shouldFail) {
        const success = result === false;
        console.log(`${success ? '✅' : '❌'} 预期失败: ${success ? '通过' : '失败'}`);
        if (success) passed++;
        continue;
      }
      
      if (!result) {
        console.log(`❌ 转换失败: 返回空结果`);
        continue;
      }
      
      let allPassed = true;
      const checks = [];
      
      // 检查是否包含iframe
      if (expectations.hasIframe !== undefined) {
        const hasIframe = result.includes('<iframe');
        checks.push(`iframe: ${hasIframe ? '✅' : '❌'}`);
        if (hasIframe !== expectations.hasIframe) allPassed = false;
      }
      
      // 检查是否包含embed URL
      if (expectations.hasEmbed !== undefined) {
        const hasEmbed = result.includes('/embed/');
        checks.push(`embed: ${hasEmbed ? '✅' : '❌'}`);
        if (hasEmbed !== expectations.hasEmbed) allPassed = false;
      }
      
      // 检查是否包含标题
      if (expectations.hasCaption !== undefined) {
        const hasCaption = testCase.block.video.caption && 
                          testCase.block.video.caption.length > 0 &&
                          result.includes(testCase.block.video.caption[0].plain_text);
        checks.push(`caption: ${hasCaption ? '✅' : '❌'}`);
        if (hasCaption !== expectations.hasCaption) allPassed = false;
      }
      
      // 检查特定embed URL
      if (expectations.embedUrl) {
        const hasCorrectEmbed = result.includes(expectations.embedUrl);
        checks.push(`正确embed: ${hasCorrectEmbed ? '✅' : '❌'}`);
        if (!hasCorrectEmbed) allPassed = false;
      }
      
      // 检查是否包含特定文本
      if (expectations.containsText) {
        const hasText = result.includes(expectations.containsText);
        checks.push(`包含'${expectations.containsText}': ${hasText ? '✅' : '❌'}`);
        if (!hasText) allPassed = false;
      }
      
      // 检查是否保持原始URL
      if (expectations.originalUrl) {
        const hasOriginalUrl = result.includes(testCase.block.video.url);
        checks.push(`原始URL: ${hasOriginalUrl ? '✅' : '❌'}`);
        if (!hasOriginalUrl) allPassed = false;
      }
      
      console.log(`${allPassed ? '✅' : '❌'} 总体结果: ${allPassed ? '通过' : '失败'}`);
      console.log(`   检查项: ${checks.join(', ')}`);
      console.log(`   HTML长度: ${result.length} 字符`);
      
      if (allPassed) passed++;
      
    } catch (error) {
      console.log(`❌ 转换出错: ${error.message}`);
    }
  }
  
  console.log(`\n📊 视频转换测试结果: ${passed}/${total} 通过\n`);
  return passed === total;
}

// 主测试函数
async function runVideoTests() {
  console.log('🚀 开始视频功能完整测试...\n');
  
  try {
    // 测试URL提取功能
    const urlTestsPassed = await testUrlExtraction();
    
    // 测试视频转换功能  
    const videoTestsPassed = await testVideoTransformation();
    
    // 总结
    console.log('=== 📈 测试总结 ===');
    console.log(`URL提取功能: ${urlTestsPassed ? '✅ 通过' : '❌ 失败'}`);
    console.log(`视频转换功能: ${videoTestsPassed ? '✅ 通过' : '❌ 失败'}`);
    
    if (urlTestsPassed && videoTestsPassed) {
      console.log('\n🎉 所有测试通过！视频功能正常工作。');
      return true;
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关功能。');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runVideoTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行出错:', error);
      process.exit(1);
    });
}

module.exports = { runVideoTests }; 