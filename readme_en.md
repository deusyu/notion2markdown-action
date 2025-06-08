# notion2markdown-action

![GitHub release](https://img.shields.io/github/v/release/deusyu/notion2markdown-action)
![GitHub license](https://img.shields.io/github/license/deusyu/notion2markdown-action)
![GitHub stars](https://img.shields.io/github/stars/deusyu/notion2markdown-action)

[[English]](./readme_en.md) [[简体中文]](./readme.md)

> GitHub Actions to convert Notion database pages to Markdown files for static blog generators like Hexo and Hugo

## ✨ Features

- 📝 **Notion to Markdown**: Complete support for Notion database page conversion
- 🖼️ **Image Hosting Integration**: Built-in PicGo-Core with multi-platform support
- 🎬 **Video Support**: YouTube, Bilibili, QQ videos and local video files
- 📦 **Blog Compatibility**: Perfect integration with Hexo, Hugo and other static generators
- ⚡ **Incremental Sync**: Smart incremental synchronization to avoid duplicate processing
- 🔄 **Automated Deployment**: Full automation with GitHub Actions

## 🚀 Quick Start

### 1. Create Notion App
1. Visit [Notion Developers](https://www.notion.so/my-integrations)
2. Create a new integration and get the `notion_secret`
3. Add the integration to your database page

### 2. Get Database ID
Extract the ID from your database URL: `https://www.notion.so/you-name/DATABASE_ID`

### 3. Setup GitHub Actions
```yaml
name: Notion2Blog
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'  # Sync every 6 hours

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

## 📚 Configuration

### Input Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `notion_secret` | ✅ | - | Notion app token |
| `database_id` | ✅ | - | Notion database ID |
| `pic_migrate` | ❌ | `false` | Whether to migrate images to image hosting |
| `pic_bed_config` | ❌ | `{}` | PicGO-Core image hosting configuration |
| `pic_compress` | ❌ | `false` | Whether to compress images |
| `status_name` | ❌ | `pstatus` | Status field name |
| `status_published` | ❌ | `已发布` | Published status value |
| `output_page_dir` | ❌ | `source/` | Output directory for page type |
| `output_post_dir` | ❌ | `source/_posts/notion` | Output directory for post type |
| `clean_unpublished_post` | ❌ | `false` | Whether to clean unpublished posts |
| `metas_keeped` | ❌ | `abbrlink` | Metadata fields to keep |
| `metas_excluded` | ❌ | `ptype,pstatus` | Metadata fields to exclude |
| `last_sync_datetime` | ❌ | - | Incremental sync timestamp |
| `timezone` | ❌ | - | Timezone setting |

### Output Parameters

| Parameter | Description |
|-----------|-------------|
| `updated_count` | Number of updated pages |

## 🎬 Video Support

Supports automatic processing of the following video types:

- **Online Videos**: YouTube, Bilibili, QQ videos
- **Local Videos**: mp4, mov, avi, wmv, flv, mkv
- **Auto Upload**: Local video files can be automatically uploaded to object storage

## 📖 Usage Examples

<details>
<summary>Hexo Blog Example</summary>

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
<summary>Hugo Blog Example</summary>

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

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

## 🔗 Related Projects

- [notion-to-md](https://github.com/souvikinator/notion-to-md) - Core module for Notion to Markdown conversion
- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js) - Core module for Notion API
- [PicGo-Core](https://github.com/PicGo/PicGo-Core) - Core module for image hosting
- [notion-blog-actions](https://github.com/mohuishou/notion-blog-actions) - Project inspiration

## 📄 License

This action is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## 👥 Author & Acknowledgments

**deusyu** - *Project maintenance and feature enhancement*
- Email: daniel@deusyu.app  
- GitHub: [@deusyu](https://github.com/deusyu)

**Acknowledgments**
- **Dorad** - *Original project author* - [notion2markdown-action](https://github.com/Doradx/notion2markdown-action)
- All developers contributing to the open source community
