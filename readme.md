# notion2markdown-action

![GitHub release](https://img.shields.io/github/v/release/deusyu/notion2markdown-action)
![GitHub license](https://img.shields.io/github/license/deusyu/notion2markdown-action)
![GitHub stars](https://img.shields.io/github/stars/deusyu/notion2markdown-action)

[[English]](./readme_en.md) [[简体中文]](./readme.md)

> 将 Notion 数据库转换为 Markdown 文档的 GitHub Actions，支持 Hexo、Hugo 等静态博客构建

## ✨ 特性

- 📝 **Notion转Markdown**: 完整支持Notion数据库页面转换
- 🖼️ **图床集成**: 内置PicGO-Core，支持多种图床上传
- 🎬 **视频支持**: 支持YouTube、Bilibili、QQ视频及本地视频文件
- 📦 **博客兼容**: 完美支持Hexo、Hugo等静态博客系统
- ⚡ **增量同步**: 智能增量同步，避免重复处理
- 🔄 **自动化部署**: 配合GitHub Actions实现全自动化发布

## 🚀 快速开始

### 1. 创建Notion应用
1. 访问 [Notion Developers](https://www.notion.so/my-integrations)
2. 创建新的集成应用，获取 `notion_secret`
3. 将应用添加到你的数据库页面

### 2. 获取数据库ID
从数据库URL中提取ID：`https://www.notion.so/you-name/DATABASE_ID`

### 3. 配置GitHub Actions
```yaml
name: Notion2Blog
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时同步一次

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: deusyu/notion2markdown-action@main
        with:
          notion_secret: ${{ secrets.NOTION_SECRET }}
          database_id: ${{ secrets.NOTION_DATABASE_ID }}
          pic_migrate: true
          pic_bed_config: ${{ secrets.PICBED_CONFIG }}
```

## 📚 配置参数

### 输入参数

| 参数 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `notion_secret` | ✅ | - | Notion应用令牌 |
| `database_id` | ✅ | - | Notion数据库ID |
| `pic_migrate` | ❌ | `false` | 是否迁移图片到图床 |
| `pic_bed_config` | ❌ | `{}` | PicGO-Core图床配置 |
| `pic_compress` | ❌ | `false` | 是否压缩图片 |
| `status_name` | ❌ | `pstatus` | 状态字段名 |
| `status_published` | ❌ | `已发布` | 已发布状态值 |
| `output_page_dir` | ❌ | `source/` | Page类型输出目录 |
| `output_post_dir` | ❌ | `source/_posts/notion` | Post类型输出目录 |
| `clean_unpublished_post` | ❌ | `false` | 是否清除未发布文章 |
| `metas_keeped` | ❌ | `abbrlink` | 保留的元数据字段 |
| `metas_excluded` | ❌ | `ptype,pstatus` | 排除的元数据字段 |
| `last_sync_datetime` | ❌ | - | 增量同步时间 |
| `timezone` | ❌ | - | 时区设置 |

### 输出参数

| 参数 | 说明 |
|------|------|
| `updated_count` | 更新的页面数量 |

## 🎬 视频支持

支持以下视频类型的自动处理：

- **在线视频**: YouTube、Bilibili、QQ视频
- **本地视频**: mp4、mov、avi、wmv、flv、mkv
- **自动上传**: 本地视频文件可自动上传到对象存储

## 📖 使用示例

<details>
<summary>Hexo博客示例</summary>

```yaml
name: Notion2Hexo
on:
  workflow_dispatch:
  schedule:
   - cron: '*/30 1-17/1 * * *'
permissions:
  contents: write
jobs:
  notionSyncTask:
    name: Notion2hexo on ubuntu-latest
    runs-on: ubuntu-latest
    steps:
      - name: Checkout blog and theme
        uses: actions/checkout@v3
        with:
          submodules: 'recursive'
          fetch-depth: 0
      - name: Check the NOTION_SYNC_DATETIME
        id: GetNotionSyncDatetime
        run: |
          NOTION_SYNC_DATETIME=$(git log -n 1 --grep="NotionSync" --format="%aI")
          echo "NOTION_SYNC_DATETIME=$NOTION_SYNC_DATETIME" >> "$GITHUB_OUTPUT"
          echo -e "Latest notion sync datetime:\n$NOTION_SYNC_DATETIME"
      - name: Convert notion to markdown
        id: NotionSync
        uses: deusyu/notion2markdown-action@main
        with:
          notion_secret: ${{ secrets.NOTION_SECRET }}
          database_id: ${{ secrets.NOTION_DATABASE_ID }}
          pic_migrate: true
          pic_bed_config: ${{ secrets.PICBED_CONFIG }}
          pic_compress: true
          output_page_dir: 'source'
          output_post_dir: 'source/_posts/notion'
          clean_unpublished_post: true
          metas_keeped: abbrlink
          metas_excluded: pstatus,ptype
          last_sync_datetime: ${{ steps.GetNotionSyncDatetime.outputs.NOTION_SYNC_DATETIME }}
      - name: Hexo deploy
        if: steps.NotionSync.outputs.updated_count != '0'
        run: |
          git pull
          npm install && npm run deploy
      - name: Commit & Push
        if: steps.NotionSync.outputs.updated_count != '0'
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          file_pattern: 'source/'
          commit_message: Automatic NotionSync.
```
</details>

<details>
<summary>Hugo博客示例</summary>

```yaml
name: Notion2Hugo
on:
  workflow_dispatch:
  schedule:
    - cron: '*/30 1-17/1 * * *'
permissions:
  contents: write
  pages: write
  id-token: write
jobs:
  notionSyncTask:
    name: Notion2Hugo on ubuntu-latest
    runs-on: ubuntu-latest
    outputs:
      HAS_CHANGES: ${{ steps.NotionSync.outputs.updated_count !='0' }}
    steps:
      - name: Checkout blog and theme
        uses: actions/checkout@v3
        with:
          submodules: 'recursive'
          fetch-depth: 0
      - name: Check the NOTION_SYNC_DATETIME
        id: GetNotionSyncDatetime
        run: |
          NOTION_SYNC_DATETIME=$(git log -n 1 --grep="NotionSync" --format="%aI")
          echo "NOTION_SYNC_DATETIME=$NOTION_SYNC_DATETIME" >> "$GITHUB_OUTPUT"
          echo -e "Latest notion sync datetime:\n$NOTION_SYNC_DATETIME"
      - name: Convert notion to markdown
        id: NotionSync
        uses: deusyu/notion2markdown-action@main
        with:
          notion_secret: ${{ secrets.NOTION_SECRET }}
          database_id: ${{ secrets.NOTION_DATABASE_ID }}
          pic_migrate: true
          pic_bed_config: ${{ secrets.PICBED_CONFIG }}
          pic_compress: true
          output_page_dir: 'content/pages'
          output_post_dir: 'content/posts'
          clean_unpublished_post: true
          metas_keeped: slug
          metas_excluded: pstatus, ptype
          last_sync_datetime: ${{ steps.GetNotionSyncDatetime.outputs.NOTION_SYNC_DATETIME }}
      - name: Commit & Push
        if: steps.NotionSync.outputs.updated_count != '0'
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          file_pattern: 'content/'
          commit_message: Automatic NotionSync.

  # Build job
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.114.0
    needs: notionSyncTask
    if: needs.notionSyncTask.outputs.HAS_CHANGES
    steps:
      - name: Install Hugo CLI
        run: |
          wget -O ${{ runner.temp }}/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i ${{ runner.temp }}/hugo.deb
      - name: Install Dart Sass
        run: sudo snap install dart-sass
      - name: Checkout
        uses: actions/checkout@v3
        with:
          submodules: recursive
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v3
      - name: Install Node.js dependencies
        run: "[[ -f package-lock.json || -f npm-shrinkwrap.json ]] && npm ci || true"
      - name: Build with Hugo
        env:
          HUGO_ENVIRONMENT: production
          HUGO_ENV: production
        run: |
          hugo \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/"
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./public

  # Deployment job
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```
</details>

## 📚 文档

- 📋 [安装配置指南](./docs/SETUP.md) - 详细的安装和配置步骤
- ❓ [常见问题](./docs/FAQ.md) - 疑难问题解答
- 🤝 [贡献指南](./docs/CONTRIBUTING.md) - 开发环境配置和测试指南

## 📝 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细更新记录。

## 🔗 相关项目

- [notion-to-md](https://github.com/souvikinator/notion-to-md) - 核心模块, Notion转Markdown
- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js) - 核心模块, Notion API
- [PicGo-Core](https://github.com/PicGo/PicGo-Core) - 核心模块, 图床上传
- [notion-blog-actions](https://github.com/mohuishou/notion-blog-actions) - 项目灵感来源

## 📄 开源协议

采用[MIT协议](./LICENSE)

## 👥 作者与致谢

**deusyu** - *项目维护与功能扩展*
- Email: daniel@deusyu.app
- GitHub: [@deusyu](https://github.com/deusyu)

**致谢**
- **Dorad** - *原始项目作者* - [notion2markdown-action](https://github.com/Doradx/notion2markdown-action)
- **mohuishou** - *重要功能贡献者*
- 所有为开源社区贡献的开发者们

