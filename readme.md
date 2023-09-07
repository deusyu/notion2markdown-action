# GitHub Actions - notion2markdown-action

[[English]](./readme_en.md) [[简体中文]](./readme.md) [[详细介绍]](https://blog.cuger.cn/p/634642fd/?highlight=action)

## 介绍

`notion2markdown-action` 是一个 GitHub Actions workflow，用于将 Notion 数据库中的页面转换为 Markdown 文档。这些 Markdown 文档可以用于构建静态博客，如 Hexo 和 Hugo。此工作流还内置了 `picgo-core`，用于将图片上传到图床。

## 输入参数

### `notion_secret` (必需)

- 描述：Notion 应用令牌。建议将此令牌存储在 GitHub Actions Secrets 中以确保安全。
- 示例：`your-secret-token`

### `database_id` (必需)

- 描述：Notion 数据库的 ID。您可以从数据库页面链接中提取此 ID。
- 示例：如果数据库页面链接是 `https://www.notion.so/you-name/0f3d856498ca4db3b457c5b4eeaxxxxx`，那么 `database_id` 应为 `0f3d856498ca4db3b457c5b4eeaxxxxx`。


### `pic_migrate` (可选)

- 描述：是否迁移图片到图床。如果不迁移图片，默认导出的图片链接是 Notion 的自带链接，有访问时效。支持迁移图片到多种图床，使用 PicGO-Core。
- 默认值：`"false"`

### `pic_bed_config` (必需)

- 描述：PicGO-Core 中的 picBed 配置文件，支持多类型图床。
- 示例：详见[示例配置](https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E6%89%8B%E5%8A%A8%E7%94%9F%E6%88%90)。
- 默认值：`"{}"`

### `pic_compress` (可选)

- 描述：是否开启图片压缩，`true` 为开启，默认不开启。
- 默认值：`"false"`


### `status_name` (可选)

- 描述：Notion 数据库中用于表示页面状态的字段名称，默认为 `pstatus`，您可以自定义。
- 默认值：`pstatus`

### `status_published` (可选)

- 描述：表示页面已发布状态的字段值，默认为 `"已发布"`。
- 默认值：`"已发布"`

### `output_page_dir` (可选)

- 描述：用于存储类型为 "page" 的页面生成的 Markdown 文件的输出文件夹。
- 默认值：`"source/"`

### `output_post_dir` (可选)

- 描述：用于存储类型为 "post" 的页面生成的 Markdown 文件的输出文件夹。
- 默认值：`"source/_posts/notion"`

### `clean_unpublished_post` (可选)

- 描述：是否清除未发布的 post 类型页面。
- 默认值：`"false"`

### `metas_keeped` (可选)

- 描述：转换后的 Markdown 文件中需要保留的字段。这些字段的值将同步到 Notion 中。
- 默认值：`"abbrlink"`

### `metas_excluded` (可选)

- 描述：在将 Notion 页面转换为 Markdown 时，需要删除的页面属性名称，多个属性名称用逗号分隔。
- 默认值：`"ptype,pstatus"`

### `last_sync_datetime` (可选)

- 描述：上次同步 Notion 数据库的时间，用于增量同步。建议使用 Git 中最新一次 Notion 同步的提交时间格式，例如 `2023-09-04T17:21:33+00:00`。
- 默认值：空字符串

### `timezone` (可选)

- 描述：设置的时区。
- 默认值：`"Asia/Shanghai"`

## 输出参数

### `updated_count`

- 描述：已更新的页面数量。


## 使用示例

### 基础
```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '*/30 1-17/1 * * *'

jobs:
  notion2markdown:
    runs-on: ubuntu-latest
    name: Convert Notion to Markdown
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Convert Notion to Markdown
        id: notion2markdown
        uses: Doradx/notion2markdown-action@v1
        with:
          notion_secret: ${{ secrets.NOTION_SECRET }}
          database_id: "0f3d856498ca4db3b457c5b4eeaxxxxx"

      - name: Display updated count
        run: echo "Updated Count: ${{ steps.notion2markdown.outputs.updated_count }}"
```

### Notion2Hexo

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
        uses: Doradx/notion2markdown-action@v1
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

### Notion2Hugo
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
        uses: Doradx/notion2markdown-action@v1
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


## 相关项目
- [notion-blog-actions](https://github.com/mohuishou/notion-blog-actions) - fork于该项目
- [notion-to-md](https://github.com/souvikinator/notion-to-md) - 核心模块, Notion转Markdown
- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js): 核心模块, Notion API
- [PicGo-Core](https://github.com/PicGo/PicGo-Core): 核心模块, 图床

## 开源协议
采用[MIT协议](./LICENSE)

## Author
Dorad, ddxid@outlook.com

