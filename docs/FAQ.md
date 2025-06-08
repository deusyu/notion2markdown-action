# 常见问题

## 🔧 配置相关

### Q: 如何获取Notion数据库ID？
A: 从数据库页面URL中提取：
```
https://www.notion.so/workspace/DATABASE_ID?v=view_id
```
其中 `DATABASE_ID` 就是你需要的32位字符串。

### Q: Notion集成无法访问数据库？
A: 确保：
1. 数据库已分享给集成应用
2. 集成有读取权限
3. 数据库ID正确

### Q: 如何自定义状态字段？
A: 设置对应参数：
```yaml
status_name: "your_status_field"        # 状态字段名
status_published: "your_published_value" # 已发布状态值
```

## 🖼️ 图床相关

### Q: 支持哪些图床？
A: 基于PicGO-Core，支持：
- AWS S3 / Cloudflare R2
- 阿里云OSS
- 腾讯云COS  
- SMMS
- 其他PicGO插件支持的图床

### Q: 图片上传失败怎么办？
A: 检查：
1. 图床配置格式是否正确
2. 访问密钥权限
3. 存储桶公开策略
4. 网络连接

### Q: 如何配置Cloudflare R2？
A: 使用AWS S3兼容配置：
```json
{
  "current": "aws-s3",
  "uploader": "aws-s3",
  "aws-s3": {
    "accessKeyID": "your_r2_access_key",
    "secretAccessKey": "your_r2_secret_key", 
    "bucketName": "your_bucket_name",
    "endpoint": "https://your_account_id.r2.cloudflarestorage.com",
    "urlPrefix": "https://your_custom_domain.com"
  }
}
```

## 🎬 视频相关

### Q: 支持哪些视频格式？
A: 
- **在线视频**: YouTube、Bilibili、QQ视频（自动生成embed代码）
- **本地视频**: mp4、mov、avi、wmv、flv、mkv（自动上传到图床）

### Q: 视频无法播放？
A: 检查：
1. 视频文件是否完整
2. 浏览器是否支持该格式
3. CDN访问权限

### Q: YouTube视频无法嵌入？
A: 可能原因：
1. 视频设置为私有
2. 地区限制
3. 嵌入被禁用

## 📁 文件相关

### Q: 生成的文件在哪里？
A: 根据配置的输出目录：
- Page类型：`output_page_dir` (默认 `source/`)
- Post类型：`output_post_dir` (默认 `source/_posts/notion/`)

### Q: 如何处理重复文件？
A: 系统会：
1. 根据文件内容MD5去重
2. 保留原文件名结构
3. 只更新已修改的文件

### Q: 文件名包含特殊字符？
A: 系统会自动处理：
- 替换不安全字符
- 保持文件名可读性
- 避免系统冲突

## ⚡ 性能相关

### Q: 同步速度慢怎么办？
A: 优化建议：
1. 启用增量同步
2. 减少并发上传数量
3. 选择就近的图床服务
4. 启用图片压缩

### Q: 如何实现增量同步？
A: 使用Git提交时间：
```yaml
- name: Get last sync time
  run: |
    LAST_SYNC=$(git log -n 1 --grep="NotionSync" --format="%aI")
    echo "last_sync=$LAST_SYNC" >> $GITHUB_OUTPUT
```

## 🐛 错误排查

### Q: Action运行失败？
A: 检查步骤：
1. 查看Action日志
2. 验证环境变量
3. 检查权限设置
4. 测试API连接

### Q: 图片链接失效？
A: 可能原因：
1. Notion原始链接有时效性
2. 图床服务异常
3. CDN配置问题

建议启用图片迁移功能。

### Q: 内容格式错误？
A: 检查：
1. Notion页面结构
2. 数据库字段配置
3. Markdown转换规则

## 🔄 集成相关

### Q: 支持哪些博客系统？
A: 完美支持：
- Hexo
- Hugo
- Jekyll
- VuePress
- 其他支持Markdown的静态生成器

### Q: 如何配置Hexo？
A: 设置输出目录：
```yaml
output_page_dir: 'source/'
output_post_dir: 'source/_posts/'
```

### Q: 如何配置Hugo？
A: 设置输出目录：
```yaml
output_page_dir: 'content/pages/'
output_post_dir: 'content/posts/'
```

## 📝 内容相关

### Q: 支持哪些Notion块类型？
A: 支持常见块类型：
- 文本、标题、列表
- 图片、视频、文件
- 代码块、引用
- 表格、分割线
- 嵌入内容

### Q: 数学公式支持？
A: 支持LaTeX格式的数学公式，会转换为适当的Markdown格式。

### Q: 代码高亮支持？
A: 支持多种编程语言的代码高亮，保持Notion中的语言设置。

## 🔐 安全相关

### Q: 如何保护API密钥？
A: 安全建议：
1. 使用GitHub Secrets存储
2. 不要在代码中硬编码
3. 定期轮换密钥
4. 限制访问权限

### Q: 图床文件安全性？
A: 建议：
1. 设置适当的访问策略
2. 使用CDN加速
3. 定期备份重要文件

## 💡 最佳实践

### Q: 推荐的同步频率？
A: 根据更新频率：
- 个人博客：每6-12小时
- 团队博客：每1-3小时
- 测试环境：手动触发

### Q: 如何组织Notion内容？
A: 建议结构：
1. 使用状态字段控制发布
2. 分类使用标签或类型字段
3. 保持清晰的文件夹结构
4. 统一命名规范

## 📞 获取更多帮助

- 📋 [安装指南](./SETUP.md)
- 🤝 [贡献指南](./CONTRIBUTING.md) 
- 📝 [更新日志](../CHANGELOG.md)
- 🐛 [提交Issue](https://github.com/deusyu/notion2markdown-action/issues)
- 💬 [讨论区](https://github.com/deusyu/notion2markdown-action/discussions) 