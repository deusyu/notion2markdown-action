# notion2markdown-action
[[English]](./readme_en.md) [[简体中文]](./readme.md)

将 notion database 中的文章转换为 markdown 文件，提供给 hexo、hugo 等静态博客使用

## Features
- 使用 notion 导出接口，支持图片、表格、callout 等格式
- 支持迁移图片到置顶文件夹
- 内置PicGO-Core, 支持采用picBed进行图床上传，支持的图床有：SMMS/QINIU/UPYUN/TCYUN/GITHUB/ALIYUN/IMGUR. 详见：[picBed](https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#picbed)

> 本项目受[`notion-blog-action`](https://github.com/mohuishou/notion-blog-actions)项目启发，fork 后深度修改而得，在此感谢[Mo Huishou](https://github.com/mohuishou)。

# 概览

方案主要分为三部分：

- `Notion database`：创建写作, 进行稿件管理
- `notion2markdown-action`：GitHub Actions 将 notion 转为 Markdown，并将图片上传图床
- `GitHub Actions`: 编译部署 Hexo, 推送到 COS

# 实现原理

1. 采用 Notion API，从 Notion 中同步 Dataset 中的 Pages，并转换为 Markdown，将其中的图片上传到图床中；
2. Hexo 部署。
3. 以上均通过 Github Action 实现。

# 食用方法

直接在GitHub Actions中的workflow使用本插件即可。极简代码段如下：

```yaml
- name: Convert notion to markdown
  uses: Doradx/notion2markdown-action@v1
  with:
    notion_secret: ${{ secrets.NOTION_TOKEN }}
    database_id: ${{ secrets.NOTION_DATABASE_ID }}
```
> 该极简代码未开启图片上传，所得的Markdown中的图片链接为Notion的临时链接，有效期一小时。

使用该`Action`即可将`Notion`页面转为Markdown文件。
如需图床，或更多配置，请查看以下参数配置说明。

## 参数

参数信息在[action.yml](https://github.com/Doradx/notion2markdown-action/blob/main/action.yml)配置文件中已经写明，故搬运。

各项参数的具体解释，以及用法如下。

### 基础参数

| 名称 | 必要 | 默认值 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| notion_secret | 是 | 无 | Notion Secret, 建议最好放到 Action Secret 中。获取方法见：https://www.notion.so/help/create-integrations-with-the-notion-api | ${{ secrets.NOTION_SECRET }} |
| database_id | 是 | 无 | Notion数据库ID，假设你的数据库页面链接是https://www.notion.so/username/0f3d856498ca4db3b457c5b4eeaxxxx?v=xxxx，那么0f3d856498ca4db3b457c5b4eeaxxxx就是你的数据库ID | ${{ secrets.NOTION_DATABASE_ID }} |
| status_name | 否 | status | Notion数据库中，用于区分页面状态的字段名, 支持自定义 | status |
| status_published | 否 | 已发布 | Notion数据库中，文章已发布状态的字段值 | 已发布 |
| page_output_dir | 否 | source/ | 将Notion页面type字段为page的页面，保存到GitHub中的page_output_dir路径下 | source/ |
| post_output_dir | 否 | source/_posts/notion | 将Notion页面type字段为page的页面，保存到GitHub中的post_output_dir路径下 | source/_posts/notion |
| clean_unpublished_post | 否 | false | 是否开启文章删除功能，也就是Notion中状态从[已发布]改为其它的文章，是否在GitHub中移除？建议开启，但要确保post_output_dir下仅有Notion同步的文章！！！否则可能删除原已存在的文章 | true |
| metas_keeped | 否 | abbrlink | 在文章同步时，Markdown元数据中需要保留，并同步到Notion页面属性的字段，多个值请用逗号隔开，例如：abbrlink,date | abbrlink,date |
| metas_excluded | 否 | ptype, pstatus | 在文章同步时，需要从Markdown中移除的Notion页面属性 | ptype, pstatus |
| last_sync_datetime | 否 | 无 | 上次同步Notion数据库的时间, 用于增量同步, 务必采用moment.js能够解析的格式。建议采用git中最新一次Notion同步的commit时间, 例如: git log -n 1 --grep="NotionSync" --format="%aI" | 2023-09-04T17:21:33+00:00 |
| timezone | 否 | Asia/Shanghai | 时区。Notion页面属性中，ISO时间转为本地时间，本地时区。 | Asia/Shanghai |

基础参数中，需要保密的参数有`notion_secret`和`database_id`，建议保存在`GitHub Actions Secret`中，设置方法见[Using secrets in GitHub Actions - GitHub 文档](https://docs.github.com/zh/actions/security-guides/using-secrets-in-github-actions)

其它项根据描述进行配置即可。

### 图床参数

| 名称 | 必要 | 默认值 | 描述 | 示例 |
| --- | --- | --- | --- | --- |
| migrate_image | 否 | false | 是否迁移图片到图床。注意: 如果不迁移图片默认导出图片链接是 notion 的自带链接, 访问时效仅一小时。 | true |
| pic_bed_config | 否 | {} | 当开启图床时，PicGo-Core中picBed部分的配置, 支持多类型图床。详见: https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E6%89%8B%E5%8A%A8%E7%94%9F%E6%88%90 | 详见后文 |
| pic_compress | 否 | false | 图片上传图床前，是否进行图片压缩 | true |

图床参数中，`pic_bed_config`和`pic_base_url`的配置较为关键。

- `pic_bed_config`是JSON格式的文本，保存PicGo-Core中picBed部分的配置，用于PicGo的初始化。建议保存在`GitHub Actions Secret`中，设置方法见[Using secrets in GitHub Actions - GitHub 文档](https://docs.github.com/zh/actions/security-guides/using-secrets-in-github-actions)

以腾讯云、阿里云和GitHub为图床，`pic_bed_config`的配置案例如下：

```yaml
{
    "uploader": "tcyun", // 代表当前的默认上传图床为,
    "tcyun":
    {
        "secretId": "",
        "secretKey": "",
        "bucket": "", // 存储桶名，v4 和 v5 版本不一样
        "appId": "",
        "area": "", // 存储区域，例如 ap-beijing-1
        "path": "", // 自定义存储路径，比如 img/
        "customUrl": "", // 自定义域名，注意要加 http://或者 https://
        "version": "v5" | "v4" // COS 版本，v4 或者 v5
    }
}
```

```yaml
{
    "uploader": "aliyun", // 代表当前的默认上传图床,
    "aliyun":
    {
        "accessKeyId": "",
        "accessKeySecret": "",
        "bucket": "", // 存储空间名
        "area": "", // 存储区域代号
        "path": "", // 自定义存储路径
        "customUrl": "", // 自定义域名，注意要加 http://或者 https://
        "options": "" // 针对图片的一些后缀处理参数 PicGo 2.2.0+ PicGo-Core 1.4.0+
    }
}
```

```yaml
{
    "uploader": "github", // 代表当前的默认上传图床,
    "github":
    {
        "repo": "", // 仓库名，格式是 username/reponame
        "token": "", // github token
        "path": "", // 自定义存储路径，比如 img/
        "customUrl": "", // 自定义域名，注意要加 http://或者 https://
        "branch": "" // 分支名，默认是 main
    }
}
```

## 输出

`Actions`执行结束，会给一个输出，报告更新的页面数量。

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| updated_count | 文本 | 更新的页面数量 |

使用时，可以调用`steps.{step_id}.outputs.updated_count`，以获取页面更新数量，包含添加、更新和删除的页面数总和。

## [最新教程见博客](https://blog.cuger.cn/p/634642fd/) 


# [渲染效果](https://blog.cuger.cn/p/634642fd/#%E6%B8%B2%E6%9F%93%E6%95%88%E6%9E%9C)
渲染效果详见[博客](https://blog.cuger.cn/p/634642fd/#%E6%B8%B2%E6%9F%93%E6%95%88%E6%9E%9C)
