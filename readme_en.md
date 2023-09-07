# Notion2Markdown Action

[[English]](./readme_en.md) [[简体中文]](./readme.md) [[详细介绍]](https://blog.cuger.cn/p/634642fd/?highlight=action)

This GitHub Action converts pages from a Notion database into Markdown documents. It can be used for static blog generators like Hexo and Hugo. The action also includes PicGo-Core for uploading images to a picBed.

## Inputs

### `notion_secret` (required)

Notion app token. It is recommended to store this token in GitHub Action Secrets.

### `database_id` (required)

The ID of the Notion database to convert. You can find this ID in the URL of your database page.

Example:
- If your database page URL is `https://www.notion.so/your-name/0f3d856498ca4db3b457c5b4eeaxxxxx`, then `database_id` is `0f3d856498ca4db3b457c5b4eeaxxxxx`.

### `status_name` (optional)

The name of the status field in the Notion database. Default is "pstatus."

### `status_published` (optional)

The field value that represents a published article in the Notion database. Default is "已发布."

### `output_page_dir` (optional)

The output folder for page-type pages. Default is "source/."

### `output_post_dir` (optional)

The output folder for post-type pages. Default is "source/_posts/notion."

### `clean_unpublished_post` (optional)

Whether to clean unpublished posts. Default is "false."

### `metas_keeped` (optional)

The metadata fields to keep in the converted markdown file. These fields will be synchronized with Notion. Multiple keys can be separated by commas.

Default is "abbrlink."

### `metas_excluded` (optional)

The attribute names to exclude when generating the page YAML in Markdown. Multiple attributes can be separated by commas.

Default is "ptype,pstatus."

### `last_sync_datetime` (optional)

The timestamp of the last Notion database sync. Used for incremental syncing. It should be in a format that can be parsed by moment.js.

Example: `2023-09-04T17:21:33+00:00`

Recommended to use the timestamp of the latest Notion sync commit in Git.

### `pic_migrate` (optional)

Whether to migrate images to a picBed. If not enabled, the default image links from Notion will be used.

Default is "false."

### `pic_bed_config` (optional)

Configuration for picBed using PicGo-Core. Supports multiple picBed types.

Example:
```json
{
  "current": "smms",
  "uploader": "smms",
  "smms": {
    "token": ""
  },
  "aliyun": {
    "accessKeyId": "",
    "accessKeySecret": "",
    "bucket": "",
    "area": "",
    "path": "",
    "customUrl": "",
    "options": ""
  },
  "tcyun": {
    "secretId": "",
    "secretKey": "",
    "bucket": "",
    "appId": "",
    "area": "",
    "path": "",
    "customUrl": "",
    "version": "v5"
  }
}
```

For more details, see [PicGo-Core Config](https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E6%89%8B%E5%8A%A8%E7%94%9F%E6%88%90).

Default is an empty object `{}`.

### `pic_compress` (optional)

Whether to enable image compression. Set to "true" to enable, default is "false."

### `timezone` (optional)

Set the timezone. Default is "Asia/Shanghai."

## Outputs

### `updated_count`

The number of updated pages.

## Example Usage

### Basic
```yaml
on:
  push:
    branches:
      - main

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

## License

This action is licensed under the MIT License. See the [LICENSE](https://github.com/Doradx/notion2markdown-action/blob/main/LICENSE) file for details.
