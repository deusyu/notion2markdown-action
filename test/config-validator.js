#!/usr/bin/env node

/**
 * 简化的配置测试脚本
 * 仅测试配置文件是否正确，不进行实际的处理
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始配置验证...\n');

// 1. 检查配置文件
const configPath = path.join(__dirname, 'test.config.local.js');
if (!fs.existsSync(configPath)) {
    console.log('❌ 配置文件不存在: test.config.local.js');
    console.log('💡 请先复制配置文件: cp test.config.aws-s3.js test.config.local.js');
    process.exit(1);
}

// 2. 加载配置
let config;
try {
    delete require.cache[require.resolve('./test.config.local.js')];
    config = require('./test.config.local.js');
    console.log('✅ 配置文件加载成功');
} catch (error) {
    console.log('❌ 配置文件加载失败:', error.message);
    process.exit(1);
}

// 3. 验证必要配置
console.log('\n📋 配置验证:');

// Notion配置
if (config.notion_secret && config.notion_secret.startsWith('secret_')) {
    console.log('✅ Notion Secret: 已配置');
} else {
    console.log('❌ Notion Secret: 未配置或格式错误');
}

if (config.database_id && config.database_id.length === 32) {
    console.log('✅ Database ID: 已配置');
} else {
    console.log('❌ Database ID: 未配置或格式错误');
}

// 图床配置
if (config.picBed && config.picBed.current) {
    console.log(`✅ 图床类型: ${config.picBed.current}`);
    
    if (config.picBed.current === 'aws-s3' && config.picBed['aws-s3']) {
        const s3Config = config.picBed['aws-s3'];
        console.log(`   - Access Key: ${s3Config.accessKeyID ? '已配置' : '未配置'}`);
        console.log(`   - Secret Key: ${s3Config.secretAccessKey ? '已配置' : '未配置'}`);
        console.log(`   - Bucket: ${s3Config.bucketName || '未配置'}`);
        console.log(`   - Endpoint: ${s3Config.endpoint || '未配置'}`);
    }
} else {
    console.log('❌ 图床配置: 未配置');
}

// 状态配置
if (config.status) {
    console.log(`✅ 状态字段: ${config.status.name}`);
    console.log(`   - 已发布: ${config.status.published}`);
    console.log(`   - 未发布: ${config.status.unpublish}`);
} else {
    console.log('❌ 状态配置: 未配置');
}

// 4. 简单的API测试
console.log('\n🌐 API连接测试:');

// 使用fetch进行简单的API测试
async function testAPI() {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${config.database_id}`, {
            headers: {
                'Authorization': `Bearer ${config.notion_secret}`,
                'Notion-Version': '2022-06-28'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Notion API连接成功');
            console.log(`   - 数据库标题: ${data.title?.[0]?.plain_text || '无标题'}`);
            console.log(`   - 属性数量: ${Object.keys(data.properties || {}).length}`);
            
            // 检查状态字段
            const statusField = data.properties?.[config.status.name];
            if (statusField) {
                console.log(`✅ 状态字段'${config.status.name}'存在`);
                if (statusField.type === 'select') {
                    const options = statusField.select.options.map(opt => opt.name);
                    console.log(`   - 可选值: ${options.join(', ')}`);
                }
            } else {
                console.log(`❌ 状态字段'${config.status.name}'不存在`);
            }
        } else {
            console.log(`❌ Notion API连接失败: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log(`❌ API测试失败: ${error.message}`);
    }
}

// 5. 运行API测试
testAPI().then(() => {
    console.log('\n🎉 配置验证完成!');
    console.log('\n📝 下一步:');
    console.log('   如果所有配置都正确，你可以:');
    console.log('   1. 运行基础视频测试: npm run test:video');
    console.log('   2. 手动测试单个功能');
    console.log('   3. 直接使用GitHub Action');
}).catch(error => {
    console.log(`\n❌ 测试过程出错: ${error.message}`);
}); 