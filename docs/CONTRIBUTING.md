# 贡献指南

感谢你对 notion2markdown-action 的贡献！

## 🚀 快速开始

### 环境准备

1. **克隆仓库**
   ```bash
   git clone https://github.com/deusyu/notion2markdown-action.git
   cd notion2markdown-action
   npm install
   ```

2. **配置本地测试环境**
   ```bash
   # 复制配置模板
   cp test.config.js test.config.local.js
   
   # 编辑配置文件，填入你的真实配置
   # ⚠️ 注意：test.config.local.js 已在 .gitignore 中，不会被提交
   ```

3. **运行测试**
   ```bash
   npm run test:local        # 完整功能测试
   npm run test:video        # 视频功能测试
   npm run test:incremental  # 增量同步测试
   ```

## 🔧 开发流程

### 分支策略
- `main` - 稳定发布分支
- `feature/*` - 新功能开发
- `fix/*` - 问题修复

### 提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 添加视频支持功能
fix: 修复图片上传失败问题
docs: 更新文档
test: 增加测试用例
```

### 代码检查
```bash
npm run build     # 构建检查
npm test          # 运行测试
```

## 🧪 测试指南

### 配置测试环境

#### 安全配置要求
**⚠️ 绝对不要将真实的API密钥提交到Git仓库！**

创建 `test.config.local.js` 并填入真实配置：

```javascript
module.exports = {
  notion_secret: "secret_your_actual_secret_here",
  database_id: "your_actual_database_id_here",
  
  picBed: {
    current: "aws-s3",  // 或 "smms"
    uploader: "aws-s3",
    "aws-s3": {
      accessKeyID: "your_s3_access_key_id",
      secretAccessKey: "your_s3_secret_access_key",
      bucketName: "your_s3_bucket_name",
      endpoint: "your_s3_endpoint",
      urlPrefix: "your_s3_url_prefix"
    }
  },
  
  migrate_image: true,
  output_dir: {
    page: "test-output/pages/",
    post: "test-output/posts/",
    clean_unpublished_post: false
  }
};
```

#### GitHub Action Secrets
在GitHub仓库设置以下环境变量：
- `NOTION_SECRET`
- `NOTION_DATABASE_ID` 
- `PICBED_CONFIG` (JSON格式的图床配置)

### 测试用例

#### 视频功能测试
测试视频类型处理：
- ✅ YouTube视频链接
- ✅ Bilibili视频链接  
- ✅ QQ视频链接
- ✅ 本地视频文件 (mp4, mov, avi, wmv, flv, mkv)
- ✅ Notion内嵌视频文件迁移

#### 图片迁移测试
- Notion内嵌图片迁移到自定义图床
- 文件重命名和去重
- 错误处理和重试机制

### 测试数据准备

在Notion数据库中创建测试页面，包含：
1. 不同类型的视频内容
2. 设置状态为"已发布"
3. 添加标题和描述文字

## 📝 文档更新

### 文档结构
- `README.md` - 项目主要介绍
- `CONTRIBUTING.md` - 本文档，开发指南
- `CHANGELOG.md` - 版本更新记录
- `docs/` - 详细技术文档

### 文档标准
- 使用清晰的标题层级
- 添加emoji增强可读性
- 提供完整的代码示例
- 保持中英文版本同步

## 🐛 问题反馈

### 提交Issue
使用Issue模板提交问题：
- Bug报告
- 功能请求
- 文档改进

### Pull Request
1. Fork 项目
2. 创建功能分支
3. 完成开发和测试
4. 提交PR并描述变更

## 🔍 调试技巧

### 启用详细日志
```bash
DEBUG=* npm run test:local
```

### 常见问题
- **API连接失败**: 检查 NOTION_SECRET
- **数据库查询失败**: 检查 DATABASE_ID 和权限
- **图床上传失败**: 检查S3配置和权限

## 📦 发布流程

1. 更新 `CHANGELOG.md`
2. 创建版本标签
3. 构建并测试
4. 发布到GitHub

```bash
npm run build
npm test
git tag v0.x.x
git push origin main --tags
```

## 💡 最佳实践

- 保持代码简洁和可维护
- 添加适当的错误处理
- 编写清晰的文档
- 遵循安全编码规范
- 保持测试覆盖率

## 📞 联系方式

- GitHub Issues: 项目问题讨论
- Email: daniel@deusyu.app
- 作者: [@deusyu](https://github.com/deusyu) 