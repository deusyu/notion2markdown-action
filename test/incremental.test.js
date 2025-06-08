/**
 * 增量测试脚本 - 测试特定页面的视频迁移功能
 * 运行命令: node test/incremental.test.js [page_id]
 */

const { init } = require('../src/notion');
const { migrateNotionImageFromURL } = require('../src/migrateNotionImage');
const { video } = require('../src/customTransformer');
const { PicGo } = require('picgo');
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");

// 加载配置
let config;
try {
  config = require('../test.config.local.js');
} catch (err) {
  config = require('../test.config.js');
}

// 测试单个页面
async function testSinglePage(pageId) {
  console.log(`🔍 测试页面: ${pageId}\n`);
  
  try {
    // 初始化
    const notion = new Client({ auth: config.notion_secret });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    
    // 获取页面信息
    console.log('📄 获取页面信息...');
    const page = await notion.pages.retrieve({ page_id: pageId });
    console.log(`页面标题: ${page.properties.title?.title?.[0]?.plain_text || '无标题'}`);
    
    // 获取页面内容
    console.log('📝 获取页面内容...');
    const blocks = await n2m.pageToMarkdown(pageId);
    
    // 分析页面中的媒体内容
    console.log('\n=== 📊 媒体内容分析 ===');
    let videoBlocks = [];
    let imageBlocks = [];
    
    function analyzeBlocks(blocks) {
      blocks.forEach(block => {
        if (block.type === 'video') {
          videoBlocks.push(block);
        } else if (block.type === 'image') {
          imageBlocks.push(block);
        }
        
        // 递归分析子块
        if (block.children && block.children.length > 0) {
          analyzeBlocks(block.children);
        }
      });
    }
    
    analyzeBlocks(blocks);
    
    console.log(`📹 视频块数量: ${videoBlocks.length}`);
    console.log(`🖼️  图片块数量: ${imageBlocks.length}`);
    
    if (videoBlocks.length === 0) {
      console.log('⚠️  此页面没有视频内容，无法测试视频迁移功能');
      return;
    }
    
    // 测试视频处理
    console.log('\n=== 🧪 视频处理测试 ===');
    
    for (let i = 0; i < videoBlocks.length; i++) {
      const block = videoBlocks[i];
      console.log(`\n📹 测试视频 ${i + 1}:`);
      
      try {
        // 测试视频转换
        const videoHTML = await video(block);
        console.log(`✅ 视频转换成功`);
        console.log(`HTML长度: ${videoHTML ? videoHTML.length : 0} 字符`);
        
        // 检查是否包含视频URL
        if (videoHTML && videoHTML.includes('iframe')) {
          const srcMatch = videoHTML.match(/src="([^"]+)"/);
          if (srcMatch) {
            console.log(`视频源: ${srcMatch[1]}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ 视频转换失败: ${error.message}`);
      }
    }
    
    // 测试图片/视频迁移
    if (config.migrate_image) {
      console.log('\n=== 🚀 迁移功能测试 ===');
      
      // 初始化PicGo
      const picgo = new PicGo();
      picgo.setConfig({ picBed: config.picBed });
      
      // 转换为Markdown
      const markdown = n2m.toMarkdownString(blocks).parent;
      
      // 查找所有媒体URL
      const mediaItems = markdown.match(/!\[.*\]\(([^)]+\.(?:jpg|jpeg|png|gif|bmp|svg|webp|mp4|mov|avi|wmv|flv|mkv).*?)\)/g);
      
      if (mediaItems && mediaItems.length > 0) {
        console.log(`发现 ${mediaItems.length} 个媒体文件:`);
        
        for (let i = 0; i < Math.min(mediaItems.length, 3); i++) { // 只测试前3个
          const item = mediaItems[i];
          const urlMatch = item.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          
          if (urlMatch) {
            const [, title, url] = urlMatch;
            console.log(`\n🔗 测试迁移 ${i + 1}: ${title || '无标题'}`);
            console.log(`原始URL: ${url.substring(0, 80)}...`);
            
            try {
              const newUrl = await migrateNotionImageFromURL(picgo, url);
              if (newUrl && newUrl !== url) {
                console.log(`✅ 迁移成功`);
                console.log(`新URL: ${newUrl}`);
              } else {
                console.log(`ℹ️  无需迁移或迁移失败`);
              }
            } catch (error) {
              console.error(`❌ 迁移出错: ${error.message}`);
            }
          }
        }
      } else {
        console.log('📝 此页面的Markdown中没有找到媒体文件');
      }
    }
    
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    throw error;
  }
}

// 测试视频转换功能
async function testVideoTransformer() {
  console.log('\n=== 🎬 视频转换器测试 ===');
  
  const testCases = [
    {
      name: "YouTube视频",
      block: {
        video: {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          caption: [{ plain_text: "测试YouTube视频" }]
        }
      }
    },
    {
      name: "Bilibili视频", 
      block: {
        video: {
          url: "https://www.bilibili.com/video/BV1xx411c7mu",
          caption: [{ plain_text: "测试Bilibili视频" }]
        }
      }
    },
    {
      name: "普通MP4文件",
      block: {
        video: {
          url: "https://example.com/test.mp4",
          caption: [{ plain_text: "测试MP4文件" }]
        }
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📺 测试: ${testCase.name}`);
    try {
      const result = await video(testCase.block);
      if (result) {
        console.log(`✅ 转换成功`);
        console.log(`包含iframe: ${result.includes('iframe') ? '是' : '否'}`);
        console.log(`包含标题: ${result.includes(testCase.block.video.caption[0].plain_text) ? '是' : '否'}`);
      } else {
        console.log(`❌ 转换失败`);
      }
    } catch (error) {
      console.error(`❌ 转换出错: ${error.message}`);
    }
  }
}

// 主函数
async function runIncrementalTest() {
  console.log('🧪 开始增量测试...\n');
  
  // 获取命令行参数
  const pageId = process.argv[2];
  
  if (!pageId) {
    console.log('📋 没有指定页面ID，将进行视频转换器测试');
    await testVideoTransformer();
    return;
  }
  
  // 验证配置
  if (!config.notion_secret || config.notion_secret.includes('替换为')) {
    console.error('❌ 请先配置 notion_secret');
    process.exit(1);
  }
  
  // 测试特定页面
  await testSinglePage(pageId);
  
  console.log('\n✅ 增量测试完成!');
}

// 运行测试
if (require.main === module) {
  runIncrementalTest().catch(console.error);
}

module.exports = { testSinglePage, testVideoTransformer }; 