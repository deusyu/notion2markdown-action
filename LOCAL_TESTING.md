# 本地测试指南

本文档指导你如何在本地环境中测试 notion2markdown-action，特别是新的视频功能。

## 🚀 快速开始

### 1. API连接测试（推荐先做）

首先测试你的Notion API连接是否正常：

```bash
# 编辑测试脚本，填入你的配置
nano test-api.sh

# 或使用你喜欢的编辑器
code test-api.sh  # VSCode
vim test-api.sh   # Vim

# 运行API测试
./test-api.sh
```

这个脚本会：
- 测试数据库连接
- 检查状态字段配置
- 查询已发布页面
- 检查页面中的视频/图片内容

### 2. 配置本地环境

#### AWS S3 配置（匹配你的GitHub Action）

复制AWS S3配置模板：
```bash
cp test.config.aws-s3.js test.config.local.js
```

编辑 `test.config.local.js`，填入你的真实配置：

```javascript
module.exports = {
  // Notion 配置
  notion_secret: "your_notion_secret_here",
  database_id: "your_database_id_here",
  
  // AWS S3 配置
  picBed: {
    current: "aws-s3",
    uploader: "aws-s3",
    "aws-s3": {
      accessKeyID: "your_s3_access_key_id",
      secretAccessKey: "your_s3_secret_access_key",
      bucketName: "your_s3_bucket_name",
      uploadPath: "{fileName}.{extName}",
      endpoint: "your_s3_endpoint",
      urlPrefix: "your_s3_url_prefix",
      acl: "public-read",
      allowDomains: ["*.amazonaws.com"]
    },
    plugins: {
      "picgo-plugin-s3": true
    }
  },
  
  // 其他配置
  migrate_image: true,
  pic_compress: false,
  output_dir: {
    page: "source/",
    post: "source/_posts/notion/",
    clean_unpublished_post: false // 测试时设为false
  },
  timezone: "Asia/Shanghai"
};
```

#### 或使用SMMS配置（简单测试）

如果你想使用原有的SMMS配置进行测试：
```bash
cp test.config.js test.config.local.js
```

然后填入你的SMMS Token和Notion配置。

### 3. 运行测试

#### 基础视频功能测试
```bash
npm run test:video-only
```
测试视频URL识别和转换功能（不需要真实的图床配置）。

#### 完整本地测试
```bash
npm run test:local
```
完整测试包括图片/视频迁移功能（需要正确的图床配置）。

#### 单页面增量测试
```bash
npm run test:incremental
```
只测试单个页面的处理（适合调试特定页面）。

## 📋 测试类型

### 1. 视频功能测试

测试会检查以下视频类型的处理：
- ✅ YouTube视频链接
- ✅ Bilibili视频链接  
- ✅ QQ视频链接
- ✅ 普通视频文件（mp4, mov, avi等）
- ✅ Notion内嵌视频文件迁移

### 2. 图片迁移测试

如果配置了图床，还会测试：
- Notion内嵌图片迁移到自定义图床
- 文件重命名和去重
- 错误处理和重试机制

### 3. 状态筛选测试

测试只处理已发布状态的页面：
- 检查状态字段匹配
- 过滤未发布内容
- 增量同步功能

## 🔍 测试结果解读

### 成功标志

#### 视频转换成功：
```
✅ 视频转换成功
HTML长度: 285 字符
视频源: https://www.youtube.com/embed/dQw4w9WgXcQ
```

#### 视频迁移成功：
```
✅ 迁移成功
新URL: https://your-cdn.com/12345678-1234-1234-1234-123456789abc.mp4
```

#### 完整测试结果：
```
=== 📈 同步结果 ===
查询到页面: 5 个
处理成功: 5 个
删除文件: 0 个

=== 📊 输出分析 ===
📄 生成文章: 5 个
📹 视频总数: 3 个
✅ 已迁移: https://your-cdn.com/video1.mp4
```

### 常见问题

#### ❌ 配置错误
```
❌ 缺少必要配置: notion_secret, database_id
请在 test.config.local.js 中填入真实的配置值
```

**解决方案**：检查配置文件是否正确填写

#### ❌ 网络连接问题
```
❌ 测试失败: getaddrinfo ENOTFOUND api.notion.com
```

**解决方案**：检查网络连接和Notion API访问

#### ⚠️ 没有视频内容
```
⚠️ 此页面没有视频内容，无法测试视频迁移功能
```

**解决方案**：选择包含视频的页面进行测试

## 📝 测试数据准备

### 创建测试页面

在你的Notion数据库中创建一个测试页面，包含：

1. **不同类型的视频**：
   - YouTube视频链接
   - Bilibili视频链接
   - 直接上传的MP4文件
   - 其他格式视频文件

2. **设置状态**：
   - 将页面状态设为"已发布"
   - 确保页面在你的数据库中

3. **添加标题和描述**：
   - 给视频添加说明文字
   - 测试caption功能

### 测试用例示例

```markdown
# 视频测试页面

## YouTube视频
[插入YouTube视频]

## Bilibili视频  
[插入Bilibili视频]

## 上传的MP4文件
[插入直接上传的视频文件]

## 其他格式
[插入MOV、AVI等格式的视频]
```

## 🔧 高级测试

### 环境变量配置

你也可以通过环境变量配置：

```bash
export NOTION_SECRET="secret_xxxxxxxxxx"
export NOTION_DATABASE_ID="xxxxxxxxxxxxxxxx"
export SMMS_TOKEN="xxxxxxxxxxxxxxxx"

# 然后运行测试
node test/local.test.js
```

### 调试模式

启用详细日志：

```bash
# 设置调试环境变量
export DEBUG="notion2markdown:*"
node test/local.test.js
```

### 性能测试

测试大量视频的处理性能：

```bash
# 测试特定时间范围的页面
export LAST_SYNC_DATETIME="2024-01-01T00:00:00Z"
node test/local.test.js
```

## 📦 发布前检查清单

- [ ] 所有测试用例通过
- [ ] 视频转换功能正常
- [ ] 视频迁移功能正常
- [ ] 错误处理机制有效
- [ ] 配置文件模板更新
- [ ] 文档更新完整
- [ ] 代码格式化
- [ ] 构建测试通过

```bash
# 最终检查
npm run build
npm test
```

## 🚀 部署到GitHub Action

测试完成后，你可以：

1. 提交代码更改
2. 创建新的release tag
3. 更新GitHub Action配置
4. 在实际项目中测试

```bash
git add .
git commit -m "feat: 新增视频迁移功能"
git tag v0.8.0
git push origin main --tags
```

## 📋 配置说明

### 图床配置对比

| 配置项 | GitHub Action | 本地测试 |
|--------|---------------|----------|
| 图床类型 | AWS S3 | aws-s3 |
| 图片迁移 | pic_migrate: true | migrate_image: true |
| 输出目录 | output_post_dir | output_dir.post |
| 状态字段 | status筛选 | status配置 |

### 环境变量

支持从环境变量读取配置：
```bash
export NOTION_TOKEN="your_token"
export NOTION_DATABASE_ID="your_db_id"
export S3_ACCESS_KEY_ID="your_key"
export S3_SECRET_ACCESS_KEY="your_secret"
# ... 其他S3配置

npm run test:local
```

## 🔧 故障排除

### 常见问题

1. **API连接失败**
   ```
   ❌ 错误: Unauthorized
   ```
   检查NOTION_SECRET是否正确。

2. **数据库查询失败**
   ```
   ❌ 查询错误: object not found
   ```
   检查DATABASE_ID是否正确，或者检查Notion页面权限。

3. **状态筛选无结果**
   ```
   ⚠️ 没有找到已发布的页面
   ```
   检查状态字段名和状态值是否匹配。

4. **图床上传失败**
   ```
   图片上传失败
   ```
   检查图床配置，特别是S3的访问密钥和权限。

### 调试技巧

1. **查看详细日志**
   ```bash
   DEBUG=* npm run test:local
   ```

2. **测试单个功能**
   ```bash
   # 只测试视频功能
   npm run test:video-only
   
   # 只测试一个页面
   npm run test:incremental
   ```

3. **检查配置**
   ```bash
   # 运行API测试脚本
   ./test-api.sh
   ```

## 🚀 下一步

测试通过后，你可以：
1. 将配置同步到GitHub Action
2. 在实际环境中运行完整同步
3. 设置定时任务进行增量同步

## 📋 支持

如果遇到问题，请检查：
1. 是否有最新的依赖包
2. Notion API版本是否兼容
3. 图床服务是否正常工作 