/**
 * 本地测试脚本 - 测试视频迁移功能
 * 运行命令: node test/local.test.js
 */

const { init, sync } = require('../src/notion');
const path = require('path');
const fs = require('fs');

// 尝试加载本地配置
let config;
try {
  config = require('../test.config.local.js');
  console.log('✅ 已加载本地配置文件');
} catch (err) {
  try {
    config = require('../test.config.js');
    console.log('⚠️  使用示例配置文件，请复制为 test.config.local.js 并填入真实配置');
  } catch (err2) {
    console.error('❌ 找不到配置文件，请先创建 test.config.local.js');
    process.exit(1);
  }
}

// 验证必要的配置
function validateConfig() {
  const required = ['notion_secret', 'database_id'];
  const missing = required.filter(key => !config[key] || config[key].includes('替换为'));
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要配置:', missing.join(', '));
    console.error('请在 test.config.local.js 中填入真实的配置值');
    process.exit(1);
  }
  
  if (config.migrate_image && (!config.picBed || !config.picBed.current)) {
    console.error('❌ 启用了图片迁移但未配置图床信息');
    process.exit(1);
  }
  
  console.log('✅ 配置验证通过');
}

// 创建测试输出目录
function createTestDirs() {
  const dirs = [config.output_dir.page, config.output_dir.post];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建目录: ${dir}`);
    }
  });
}

// 清理测试输出
function cleanTestOutput() {
  const dirs = [config.output_dir.page, config.output_dir.post];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🗑️  清理目录: ${dir}`);
    }
  });
}

// 分析输出结果
function analyzeOutput() {
  console.log('\n=== 📊 输出分析 ===');
  
  const postDir = config.output_dir.post;
  const pageDir = config.output_dir.page;
  
  // 统计文件
  let postCount = 0;
  let pageCount = 0;
  let videoCount = 0;
  let imageCount = 0;
  
  if (fs.existsSync(postDir)) {
    const postFiles = fs.readdirSync(postDir).filter(f => f.endsWith('.md'));
    postCount = postFiles.length;
    
    // 分析媒体文件
    postFiles.forEach(file => {
      const content = fs.readFileSync(path.join(postDir, file), 'utf8');
      const videos = content.match(/!\[.*?\]\([^)]*\.(mp4|mov|avi|wmv|flv|mkv)[^)]*\)/gi) || [];
      const images = content.match(/!\[.*?\]\([^)]*\.(jpg|jpeg|png|gif|bmp|svg|webp)[^)]*\)/gi) || [];
      videoCount += videos.length;
      imageCount += images.length;
      
      if (videos.length > 0) {
        console.log(`📹 ${file}: 发现 ${videos.length} 个视频`);
        videos.forEach(video => {
          const url = video.match(/\(([^)]+)\)/)?.[1];
          if (url) {
            const isNotion = url.includes('notion-static.com');
            const isMigrated = !isNotion && !url.startsWith('http://') && !url.startsWith('https://');
            console.log(`   ${isNotion ? '❌ 未迁移' : isMigrated ? '✅ 已迁移' : '🔗 外部链接'}: ${url.substring(0, 60)}...`);
          }
        });
      }
    });
  }
  
  if (fs.existsSync(pageDir)) {
    const getAllFiles = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files = files.concat(getAllFiles(fullPath));
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      });
      return files;
    };
    
    pageCount = getAllFiles(pageDir).length;
  }
  
  console.log(`📄 生成文章: ${postCount} 个`);
  console.log(`📑 生成页面: ${pageCount} 个`);
  console.log(`🖼️  图片总数: ${imageCount} 个`);
  console.log(`📹 视频总数: ${videoCount} 个`);
}

// 主测试函数
async function runLocalTest() {
  console.log('🚀 开始本地测试...\n');
  
  try {
    // 1. 验证配置
    validateConfig();
    
    // 2. 清理旧输出
    cleanTestOutput();
    
    // 3. 创建输出目录
    createTestDirs();
    
    // 4. 初始化
    console.log('⚙️  初始化...');
    init(config);
    
    // 5. 执行同步
    console.log('🔄 开始同步...');
    const result = await sync();
    
    // 6. 显示结果
    console.log('\n=== 📈 同步结果 ===');
    console.log(`查询到页面: ${result.queried} 个`);
    console.log(`处理成功: ${result.handled} 个`);
    console.log(`删除文件: ${result.deleted} 个`);
    
    // 7. 分析输出
    analyzeOutput();
    
    console.log('\n✅ 本地测试完成!');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runLocalTest();
}

module.exports = { runLocalTest }; 