# 🔒 安全配置说明

## ⚠️ 重要安全提醒

**绝对不要将真实的API密钥提交到Git仓库！**

## 配置文件说明

### 模板文件（可以提交）
- `test.config.js` - SMMS图床配置模板
- `test.config.aws-s3.js` - AWS S3/Cloudflare R2配置模板

### 本地配置文件（不要提交）
- `test.config.local.js` - 包含真实配置，已在.gitignore中

## 使用方法

### 1. 复制模板文件
```bash
# 使用SMMS图床
cp test.config.js test.config.local.js

# 或使用AWS S3/Cloudflare R2
cp test.config.aws-s3.js test.config.local.js
```

### 2. 填入真实配置
编辑 `test.config.local.js`，替换所有 "替换为你的..." 字符串为真实值：

```javascript
// Notion配置
notion_secret: "secret_your_actual_secret_here",
database_id: "your_actual_database_id_here",

// S3配置
accessKeyID: "your_actual_access_key",
secretAccessKey: "your_actual_secret_key",
bucketName: "your_actual_bucket_name",
endpoint: "your_actual_endpoint",
urlPrefix: "your_actual_url_prefix",
```

### 3. 测试配置
```bash
# 验证配置
npm run test:config

# 测试视频功能
npm run test:video

# 完整测试
npm run test:local
```

## GitHub Action配置

在GitHub仓库的Secrets中设置以下环境变量：

```
NOTION_TOKEN=your_notion_secret
NOTION_DATABASE_ID=your_database_id
S3_ACCESS_KEY_ID=your_s3_access_key
S3_SECRET_ACCESS_KEY=your_s3_secret_key
S3_BUCKET_NAME=your_bucket_name
S3_ENDPOINT=your_endpoint
S3_URL_PREFIX=your_url_prefix
```

## 安全检查清单

在提交代码前，确保：

- [ ] 没有硬编码的API密钥
- [ ] `test.config.local.js` 已在.gitignore中
- [ ] 测试脚本中没有真实的凭据
- [ ] 所有模板文件使用占位符文本
- [ ] GitHub Action使用环境变量而非硬编码值 