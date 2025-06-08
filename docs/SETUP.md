# 安装与配置指南

## 📋 系统要求

- Node.js 16+ 
- GitHub仓库（用于运行Actions）
- Notion账户和集成应用

## 🔧 安装步骤

### 1. 创建Notion集成

1. 访问 [Notion Developers](https://www.notion.so/my-integrations)
2. 点击 "New integration"
3. 填写集成名称（如：My Blog Sync）
4. 选择工作区
5. 点击 "Submit" 创建
6. 复制 "Internal Integration Token"（这就是你的 `notion_secret`）

### 2. 配置Notion数据库

1. 创建或打开你的博客数据库
2. 确保数据库包含以下字段：
   - **标题**（Title）- 页面标题
   - **状态**（Status）- 用于筛选已发布文章，默认字段名 `pstatus`
   - **类型**（Type）- 区分page和post类型，默认字段名 `ptype`
   - 其他自定义字段...

3. 分享数据库给你的集成：
   - 点击数据库右上角的 "Share"
   - 搜索你的集成名称
   - 点击 "Invite"

### 3. 获取数据库ID

从数据库页面URL中提取：
```
https://www.notion.so/workspace/DATABASE_ID?v=...
```
`DATABASE_ID` 就是你需要的数据库ID。

### 4. 配置图床（可选）

#### AWS S3 / Cloudflare R2

```json
{
  "current": "aws-s3",
  "uploader": "aws-s3", 
  "aws-s3": {
    "accessKeyID": "your_access_key_id",
    "secretAccessKey": "your_secret_access_key",
    "bucketName": "your_bucket_name",
    "uploadPath": "{year}/{month}/{fileName}.{extName}",
    "endpoint": "your_endpoint_url",
    "urlPrefix": "your_cdn_url",
    "acl": "public-read"
  }
}
```

#### SMMS图床

```json
{
  "current": "smms",
  "uploader": "smms",
  "smms": {
    "token": "your_smms_token"
  }
}
```

### 5. 配置GitHub Action

1. 在你的博客仓库中创建 `.github/workflows/notion-sync.yml`：

```yaml
name: Notion2Blog
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时同步一次

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Sync from Notion
        uses: deusyu/notion2markdown-action@main
        with:
          notion_secret: ${{ secrets.NOTION_SECRET }}
          database_id: ${{ secrets.NOTION_DATABASE_ID }}
          pic_migrate: true
          pic_bed_config: ${{ secrets.PICBED_CONFIG }}
          output_page_dir: 'source/'
          output_post_dir: 'source/_posts/notion/'
          
      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'docs: sync from Notion'
          file_pattern: 'source/'
```

2. 在GitHub仓库Settings → Secrets中添加：
   - `NOTION_SECRET`：你的Notion集成令牌
   - `NOTION_DATABASE_ID`：数据库ID
   - `PICBED_CONFIG`：图床配置（JSON格式）

## 🎯 高级配置

### 增量同步

利用Git提交历史实现增量同步：

```yaml
- name: Get last sync time
  id: sync_time
  run: |
    LAST_SYNC=$(git log -n 1 --grep="sync from Notion" --format="%aI")
    echo "last_sync=$LAST_SYNC" >> $GITHUB_OUTPUT
    
- name: Sync from Notion  
  uses: deusyu/notion2markdown-action@main
  with:
    # ... 其他配置
    last_sync_datetime: ${{ steps.sync_time.outputs.last_sync }}
```

### 状态字段自定义

```yaml
with:
  status_name: "publish_status"      # 自定义状态字段名
  status_published: "Published"      # 自定义已发布状态值
```

### 输出目录配置

```yaml
with:
  output_page_dir: 'content/pages/'     # Hugo页面目录
  output_post_dir: 'content/posts/'     # Hugo文章目录
  clean_unpublished_post: true          # 清理未发布文章
```

## 🔍 验证配置

运行测试确保配置正确：

1. 手动触发GitHub Action
2. 检查Action日志
3. 验证生成的Markdown文件
4. 确认图片/视频是否正确迁移

## ❗ 常见问题

### Notion API错误
- **401 Unauthorized**: 检查 `notion_secret` 是否正确
- **404 Not Found**: 确认数据库ID正确，且集成有访问权限

### 图床上传失败
- 检查图床配置格式
- 验证访问密钥权限
- 确认存储桶策略

### 文件生成问题
- 检查输出目录权限
- 确认状态字段配置
- 验证数据库结构

## 📞 获取帮助

- 查看 [常见问题](./FAQ.md)
- 提交 [GitHub Issue](https://github.com/deusyu/notion2markdown-action/issues)
- 参考 [示例配置](https://github.com/deusyu/notion2markdown-action/tree/main/examples) 