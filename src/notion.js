/*
 * @Author: deusyu <daniel@deusyu.app>
 * @OriginalAuthor: Dorad, ddxi@qq.com
 * @Date: 2023-04-12 18:38:51 +02:00
 * @LastEditors: Dorad, ddxi@qq.com
 * @LastEditTime: 2023-09-04 10:35:40 +08:00
 * @FilePath: \src\notion.js
 * @Description: 
 * 
 * Copyright (c) 2023-2025 by deusyu (daniel@deusyu.app), All Rights Reserved.
 */
const { Client } = require("@notionhq/client");
const { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } = require("fs");
const { NotionToMarkdown } = require("notion-to-md");
const { parse } = require("twemoji");
const { getBlockChildren } = require("notion-to-md/build/utils/notion");
const YAML = require("yaml");
const path = require("path");
const { PicGo } = require("picgo");
const { migrateNotionImageFromURL } = require("./migrateNotionImage")
// const Migrater = require("./migrate");
const { format } = require("prettier");
const moment = require('moment-timezone');
const t = require('./customTransformer');
const packageJson = require("../package.json");

let config = {
  notion_secret: "",
  database_id: "",
  migrate_image: true,
  picBed: { uploader: "tcyun", current: "tcyun", tcyun: {}, aliyun: {} },
  status: {
    name: "",
    unpublish: "",
    published: "",
  },
  output_dir: {
    page: "",
    post: "",
    clean_unpublished_post: true,
  },
  timezone: "Asia/Shanghai",
  pic_compress: false,
  last_sync_datetime: 0,
  metas_keeped: [],
};

let notion = new Client({ auth: config.notion_secret });
let n2m = new NotionToMarkdown({ notionClient: notion });
let picgo = new PicGo();

function init(cfg) {
  config = cfg;
  notion = new Client({
    auth: config.notion_secret,
    config: {
      separateChildPage: true, // default: false
    }
  });

  if (!config?.pic_base_url && config.picBed?.uploader) {
    const bed = config.picBed[config.picBed?.uploader]
    if (bed?.customUrl && bed?.path) {
      config.pic_base_url = new URL(bed.path, bed.customUrl).href;
    }
  }

  let picgo_config = {
    "picBed": config.picBed,
    "pic-base-url": config?.pic_base_url || null
  }

  picgo_config["compress"] = config.pic_compress ? true : false;

  picgo.setConfig(picgo_config);
  picgo.setConfig({
    'picBed.transformer': 'base64'
  });
  picgo.setConfig({
    'settings.logLevel': ['success', 'error', 'warn']
  })

  // 🎬 设置全局变量，让video transformer能访问到picgo和config
  global.picgo = picgo;
  global.config = config;

  // passing notion client to the option
  n2m = new NotionToMarkdown({ notionClient: notion });
  
  // 添加调试信息，确认转换器注册成功
  console.error(`[MERMAID-DEBUG] 🚀 正在注册自定义转换器...`);
  
  n2m.setCustomTransformer("callout", callout(n2m));
  n2m.setCustomTransformer("bookmark", t.bookmark);
  n2m.setCustomTransformer("video", t.video);
  n2m.setCustomTransformer("embed", t.embed);
  n2m.setCustomTransformer("link_preview", t.link_preview);
  n2m.setCustomTransformer("pdf", t.pdf);
  n2m.setCustomTransformer("audio", t.audio);
  n2m.setCustomTransformer("image", t.image);
  n2m.setCustomTransformer("code", codeBlock);
  n2m.setCustomTransformer("mermaid", mermaidBlock);  // 添加mermaid专用转换器
  
  console.error(`[MERMAID-DEBUG] ✅ 代码块转换器已注册，函数名:`, codeBlock.name);
  console.error(`[MERMAID-DEBUG] ✅ Mermaid转换器已注册，函数名:`, mermaidBlock.name);
  console.error(`[MERMAID-DEBUG] 📝 已注册的转换器列表:`, Object.keys(n2m.customTransformers || {}));
}

async function sync() {
  // 获取已发布的文章
  let pages = await getPages(config.database_id);
  /**
   * 需要处理的逻辑:
   * 1. 对于已发布的文章，如果本地文件存在，且存在abbrlink，则更新notion中的abbrlink
   * 2. 对于本地存在的文章，如果notion中不是已发布状态，根据设置删除本地文件
   */
  // get all the output markdown filename list of the pages, and remove the file not exists in the pages under the output directory
  // query the filename list from the output directory
  let notionPagePropList = await Promise.all(pages.map(async (page) => {
    var properties = await getPropertiesDict(page);
    switch (properties?.ptype?.toLocaleLowerCase() || "") {
      case "page":
        if (!properties?.filename && !properties?.slug) {
          console.error(`Page ${properties.title} has no filename, the page id will be used as the filename.`);
          properties.filename = properties.id;
        }
        properties.filePath = path.join(config.output_dir.page, (properties?.filename || properties?.slug).trim(), 'index.md');
        properties.filename = "index.md";
        break;
      case "post":
      default:
        var filename = (properties?.filename || properties?.slug || properties?.title || properties.id).trim() + '.md'
        // get the filename and directory of the post, if the filename includes /, then it will be treated as a subdirectory
        properties.filePath = path.join(config.output_dir.post, filename);
        if (filename.includes("/")) filename = filename.split("/").pop();
        properties.filename = filename;
    }
    properties.output_dir = path.dirname(properties.filePath);
    return properties;
  }));
  console.debug(`${notionPagePropList.length} pages found in notion.`);
  // make the output directory if it is not exists
  if (!existsSync(config.output_dir.post)) {
    mkdirSync(config.output_dir.post, { recursive: true });
  }
  if (!existsSync(config.output_dir.page)) {
    mkdirSync(config.output_dir.page, { recursive: true });
  }
  /**
   * 1. 删除本地存在，但是Notion中不是已发布状态的文章
   * 2. 更新notion中已发布的文章的abbrlink
   *  */
  // load page properties from the markdown file
  const localPostFileList = readdirSync(config.output_dir.post);
  var deletedPostList = [];
  for (let i = 0; i < localPostFileList.length; i++) {
    const localFilename = localPostFileList[i];
    if (!localFilename.endsWith(".md")) {
      continue;
    }
    var localProp = loadPropertiesAndContentFromMarkdownFile(path.join(config.output_dir.post, localFilename));
    if (!localProp) {
      continue;
    }
    var page = pages.find((page) => {
      return page.id == localProp.id
    });
    var notionProp = notionPagePropList.find((prop)=>{
      return prop.id == localProp.id
    }) || null;
    // const filename = path.parse(localFilename).name;
    if (config.output_dir?.clean_unpublished_post && (!page || !notionProp || localFilename !== notionProp?.filename)){
      console.debug(`Page is not exists, delete the local file: ${localFilename}`);
      unlinkSync(path.join(config.output_dir.post, localFilename));
      deletedPostList.push(localFilename);
      continue;
    }
    // if the page is exists, update the abbrlink of the page if it is empty and the local file has the abbrlink
    // handle the metas_keeped, to update it
    if (config.metas_keeped && config.metas_keeped.length > 0) {
      let keysToUpdate = [];
      for (let i = 0; i < config.metas_keeped.length; i++) {
        const key = config.metas_keeped[i];
        if (localProp[key] && page.properties.hasOwnProperty(key) && !notionProp[key]) {
          page.properties[key].rich_text.push({
            "type": "text",
            "text": {
              "content": localProp[key],
              "link": null
            },
            "plain_text": localProp[key],
            "href": null
          });
          keysToUpdate.push(key);
        }
      }
      await updatePageProperties(page, keysToUpdate);
    }
  }

  /**
   * 处理需要更新的文章
   */
  if (config?.last_sync_datetime && config.last_sync_datetime !== null && config.last_sync_datetime.trim() !== '') {
    if (!moment(config?.last_sync_datetime).isValid()) {
      console.error(`The last_sync_datetime ${config.last_sync_datetime} isn't valid.`);
    }
    console.info(`Only sync the pages on or after ${config.last_sync_datetime}`);
    
    // 🔍 增加详细的调试信息
    const lastSyncMoment = moment(config.last_sync_datetime);
    console.info(`🔍 增量同步调试信息:`);
    console.info(`  - 配置的同步时间: ${config.last_sync_datetime}`);
    console.info(`  - 解析后的时间: ${lastSyncMoment.toISOString()}`);
    console.info(`  - 总页面数: ${notionPagePropList.length}`);
    
    // 过滤页面前，先统计一下
    const beforeFilter = notionPagePropList.length;
    
    notionPagePropList = notionPagePropList.filter((prop) => {
      const isPublished = prop[config.status.name] == config.status.published;
      const pageEditTime = moment(prop.last_edited_time);
      const isNewer = pageEditTime > lastSyncMoment;
      
      console.info(`  - 页面 "${prop.title}": 发布=${isPublished}, 编辑时间=${pageEditTime.toISOString()}, 需要同步=${isNewer}`);
      
      return isPublished && isNewer;
    });
    
    const afterFilter = notionPagePropList.length;
    console.info(`🎯 增量同步结果: ${beforeFilter} → ${afterFilter} 个页面需要处理`);
  } else {
    console.info(`🔄 执行全量同步 (无有效的last_sync_datetime)`);
    console.info(`  - last_sync_datetime值: "${config?.last_sync_datetime}"`);
    console.info(`  - 总页面数: ${notionPagePropList.length}`);
    
    // 全量同步：只过滤已发布的页面
    const beforeFilter = notionPagePropList.length;
    notionPagePropList = notionPagePropList.filter((prop) => prop[config.status.name] == config.status.published);
    const afterFilter = notionPagePropList.length;
    console.info(`🎯 全量同步结果: ${beforeFilter} → ${afterFilter} 个已发布页面需要处理`);
  }
  // deal with notionPagePropList
  if (notionPagePropList.length == 0) {
    console.info("No page to deal with.");
    return {
      queried: notionPagePropList.length,
      handled: 0,
      deleted: deletedPostList.length
    };
  }
  // 同步处理文章, 提高速度
  const results = await Promise.all(notionPagePropList.map(async (prop) => {
    let page = pages.find((page) => page.id == prop.id);
    console.debug(`Handle page: ${prop.id}, ${prop.title}`);
    /**
     * 只处理已发布的文章
     */
    // skip the page if it is not exists or published
    if (!page || prop[config.status.name] !== config.status.published) {
      console.info(`Page is not exists or published, skip: ${prop.id}, ${prop.title}`);
      return false;
    }
    /**
     * 对于已发布的文章，如果本地文件存在，且存在abbrlink，则更新notion中的abbrlink
     */
    // check if the local file exists
    if (!existsSync(prop.filePath)) {
      // the local file is not exists
      console.info(`File ${prop.filePath} is not exists, it's a new page.`);
    }
    // check the output directory, if the file is not exists, create it
    if (!existsSync(prop.output_dir)) {
      mkdirSync(prop.output_dir, { recursive: true });
    }
    // update the page status to published
    if (prop[config.status.name] == config.status.unpublish) {
      page.properties[config.status.name].select = { name: config.status.published };
    }
    // get the latest properties of the page
    const newPageProp = await getPropertiesDict(page);
    await page2Markdown(page, prop.filePath, newPageProp);
    console.info(`Page conversion successfully: ${prop.id}, ${prop.title}`);
    return true;
  }));
  return {
    queried: notionPagePropList.length,
    handled: results.filter((r) => r).length,
    deleted: deletedPostList.length
  };
}

/**
 * featch page from notion, and convert it to local markdown file
 * @param {*} page 
 * @param {*} filePath 
 * @param {*} properties 
 */

async function page2Markdown(page, filePath, properties) {
  // 在转换开始前输出版本信息，确保使用的是正确版本
  console.error(`[MERMAID-DEBUG] 🚀 开始转换页面: ${page.id}`);
  console.error(`[MERMAID-DEBUG] 📅 当前时间: ${new Date().toISOString()}`);
      console.error(`[MERMAID-DEBUG] 🔧 版本信息: v${packageJson.version}`);
  
  const mdblocks = await n2m.pageToMarkdown(page.id);
  console.error(`[MERMAID-DEBUG] 📊 获取到 ${mdblocks.length} 个块`);
  
  // 分析每个块的类型，特别关注代码块
  mdblocks.forEach((block, index) => {
    console.error(`[MERMAID-DEBUG] 📦 块 ${index}: 类型=${block.type || 'unknown'}`);
    
    // 如果是代码块，详细分析
    if (block.type === 'code' || (block.parent && block.parent.includes('```'))) {
      console.error(`[MERMAID-DEBUG] 🎯 发现代码块! 块${index}`);
      console.error(`[MERMAID-DEBUG] 📄 完整块数据:`, JSON.stringify(block, null, 2));
    }
    
    // 检查是否包含mermaid相关内容
    const blockStr = JSON.stringify(block);
    if (blockStr.includes('mermaid') || blockStr.includes('graph')) {
      console.error(`[MERMAID-DEBUG] 🔍 块${index}包含mermaid/graph关键词!`);
      console.error(`[MERMAID-DEBUG] 📋 块内容:`, JSON.stringify(block, null, 2));
    }
  });
  
  // 转换为markdown
  let md = n2m.toMarkdownString(mdblocks).parent;
  
  // 检查最终markdown中是否包含mermaid
  if (md.includes('mermaid')) {
    console.error(`[MERMAID-DEBUG] ✅ 最终markdown包含mermaid关键词`);
    // 输出mermaid相关部分
    const lines = md.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('mermaid') || line.includes('```')) {
        console.error(`[MERMAID-DEBUG] 第${index}行: ${line}`);
      }
    });
  } else {
    console.error(`[MERMAID-DEBUG] ❌ 最终markdown不包含mermaid关键词`);
    console.error(`[MERMAID-DEBUG] 📝 markdown长度: ${md.length} 字符`);
    // 输出前500字符以供检查
    console.error(`[MERMAID-DEBUG] 📖 markdown前500字符:`, md.substring(0, 500));
  }
  
  // 将图床上传和URL替换放到这里，避免后续对于MD文件的二次处理.
  if (config.migrate_image) {
    // 处理内容图片和视频
    // find all image and video url inside markdown.
    const mediaItems = md.match(/!\[.*\]\(([^)]+\.(?:jpg|jpeg|png|gif|bmp|svg|webp|mp4|mov|avi|wmv|flv|mkv).*?)\)/g);
    if (!mediaItems || mediaItems.length == 0) {
      console.debug(`No media url found in the markdown file: ${filePath}`);
    } else {
      // 对于所有的媒体url，进行并行处理
      const newMediaItems = await Promise.all(mediaItems.map(async (item) => {
        const mdMediaReg = /!\[([^[\]]*)]\(([^)]+)\)/;
        if (!mdMediaReg.test(item)) return [item, item];
        const match = mdMediaReg.exec(item);
        const newMediaUrl = await migrateNotionImageFromURL(picgo, match[2]);
        if (newMediaUrl) {
          return [item, `![${match[1]}](${newMediaUrl})`]
        }
        return [item, item];
      }));
      // 替换所有的媒体url
      newMediaItems.forEach((item) => {
        md = md.replace(item[0], item[1]);
      });
    }
    // 处理封面图
    // check if the page has image url in fm
    if (properties.cover && properties.cover.startsWith("https://")) {
      const newPicUrl = await migrateNotionImageFromURL(picgo, properties.cover);
      if (newPicUrl) {
        properties.cover = newPicUrl;
      }
    }
  }
  // 删除不需要的字段
  if (config?.metas_excluded && config.metas_excluded.length) {
    for(const key of config.metas_excluded) {
      if(key && key in properties) {
        delete properties[key];
      }
    }
  }
  
  // 🆕 智能删除系统时间字段
  // 只有在有用户自定义字段时才删除系统字段
  if (properties['date'] || properties['created']) {
    delete properties.created_time;
  }
  if (properties['updated']) {
    delete properties.last_edited_time;
  }
  let fm = YAML.stringify(properties, { doubleQuotedAsJSON: true });
  md = format(`---\n${fm}---\n\n${md}`, { parser: "markdown" });
  writeFileSync(filePath, md);
}

/**
 * 
 * @param {*} database_id 
 * @param {*} updated_after 
 * @returns 
 */
async function getPages(database_id) {
  let filter = {}
  filter = {
    property: config.status.name,
    select: {
      equals: config.status.published,
    },
  }
  // console.debug('Page filter:', filter);
  let resp = await notion.databases.query({
    database_id: database_id,
    filter: filter,
    sorts: [
      {
        timestamp: 'last_edited_time',
        direction: 'ascending'
      }
    ]
  });
  return resp.results;
}

/**
 * update the page status to published, and update the abbrlink if exists
 * @param {*} page 
 */
async function updatePageProperties(page, keys = []) {
  // only update the status property
  // console.debug('Page full properties updated:', page.properties);
  if (keys.length == 0) return;
  let props_updated = {};
  // update status and abbrlink if exists
  keys.forEach(key => {
    if (page.properties[key]) {
      props_updated[key] = page.properties[key];
    }
  });
  console.debug(`Page ${page.id} properties updated keys:`, props_updated);
  await notion.pages.update({
    page_id: page.id,
    properties: props_updated,
  });
}

/**
 * load properties from the markdown file
 * @param {*} filepath 
 * @returns 
 */

function loadPropertiesAndContentFromMarkdownFile(filepath) {
  // load properties from the markdown file
  // check if the file already exists
  if (!existsSync(filepath)) {
    console.debug('File does not exist:', filepath);
    return null;
  }
  const content = readFileSync(filepath, 'utf8');
  // math the front matter
  const fm = content.match(/---\n([\s\S]*?)\n---/);
  // parse the front matter
  if (!fm) return null;
  try {
    let properties = YAML.parse(fm[1]);
    properties.filename = path.parse(filepath).name;
    return properties;
  } catch (e) {
    console.debug('Parse yaml error:', e);
    return null;
  }
}

/**
 * 生成元数据
 * @param {*} page
 * @returns {Object}
 */
async function getPropertiesDict(page) {
  if(!page) return {};
  let data = {};
  
  // 处理数据库属性
  for (const key in page.properties) {
    const value = getPropVal(page.properties[key]);
    if (value == undefined || value == "") continue;
    data[key] = value;
  }
  
  // 封面图处理
  if (page.cover) {
    if (page.cover.type === "external") {
      data['cover'] = page.cover.external.url;
    } else if (page.cover.type === "file") {
      data['cover'] = page.cover.file.url;
    }
  }
  
  // 🆕 智能时间字段处理
  data['id'] = page.id;
  
  // 只在没有用户自定义时间字段时才添加系统字段
  if (!data['created'] && !data['created_at']) {
    data['created_at'] = page.created_time;
  }
  
  // 如果没有updated字段，添加系统last_edited_time
  // 🔧 使用固定UTC格式，避免每次格式化产生差异，确保增量同步正常工作
  if (!data['updated']) {
    const mt = moment(page.last_edited_time);
    if (mt.isValid()) {
      // 使用固定的UTC时间格式，避免时区配置变化导致的文件重复生成
      data['updated'] = mt.utc().format('YYYY-MM-DD HH:mm:ss');
    }
  }
  
  return data;
}

/**
 *
 * @param {ListBlockChildrenResponseResult} block
 */
function callout(n2m) {
  return async (block) => {
    let callout_str = block.callout.text.map((a) => a.plain_text).join("");
    if (!block.has_children) {
      return callout2md(callout_str, block.callout.icon);
    }

    const callout_children_object = await getBlockChildren(
      n2m.notionClient,
      block.id,
      100
    );
    // parse children blocks to md object
    const callout_children = await n2m.blocksToMarkdown(
      callout_children_object
    );

    callout_str +=
      "\n" + callout_children.map((child) => child.parent).join("\n\n");

    return callout2md(callout_str.trim(), block.callout.icon);
  };
}

function callout2md(str, icon) {
  return `<aside>\n${icon2md(icon)}${str}\n</aside>`.trim();
}

function icon2md(icon) {
  switch (icon.type) {
    case "emoji":
      return parse(icon.emoji);
    case "external":
      return `<img src="${icon.external.url}" width="25px" />\n`;
  }
  return "";
}

/**
 * 专门的Mermaid块转换器
 * @param {*} block 
 * @returns 
 */
function mermaidBlock(block) {
  const log = (msg) => {
    console.log(msg);
    console.error(msg);
    process.stderr.write(msg + '\n');
  };
  
  log(`[MERMAID-DEBUG] 🎯 Mermaid转换器被调用！时间戳: ${new Date().toISOString()}`);
  log(`[MERMAID-DEBUG] 📦 Mermaid块完整数据: ${JSON.stringify(block, null, 2)}`);
  
  // 检查不同可能的字段
  let mermaidContent = "";
  
  if (block.mermaid) {
    log(`[MERMAID-DEBUG] 🔍 找到mermaid字段`);
    const mermaid = block.mermaid;
    
    if (mermaid.rich_text && Array.isArray(mermaid.rich_text)) {
      mermaidContent = mermaid.rich_text.map(t => t.plain_text || "").join("\n");
      log(`[MERMAID-DEBUG] ✅ 从mermaid.rich_text获取内容: ${mermaidContent}`);
    } else if (mermaid.text && Array.isArray(mermaid.text)) {
      mermaidContent = mermaid.text.map(t => t.plain_text || t.text?.content || "").join("\n");
      log(`[MERMAID-DEBUG] ✅ 从mermaid.text获取内容: ${mermaidContent}`);
    }
  }
  
  // 如果还是空，尝试其他字段
  if (!mermaidContent && block.code) {
    log(`[MERMAID-DEBUG] 🔄 fallback到code字段`);
    const code = block.code;
    if (code.rich_text && Array.isArray(code.rich_text)) {
      mermaidContent = code.rich_text.map(t => t.plain_text || "").join("\n");
    } else if (code.text && Array.isArray(code.text)) {
      mermaidContent = code.text.map(t => t.plain_text || t.text?.content || "").join("\n");
    }
  }
  
  const result = `\`\`\`mermaid\n${mermaidContent}\n\`\`\``;
  log(`[MERMAID-DEBUG] 🎉 Mermaid最终结果: ${result}`);
  
  return result;
}

/**
 * 自定义代码块转换器，兼容text和rich_text字段
 * @param {*} block 
 * @returns 
 */
function codeBlock(block) {
  // 强制输出到 stderr，确保在 GitHub Actions 中可见
  const log = (msg) => {
    console.log(msg);
    console.error(msg);
    process.stderr.write(msg + '\n');
  };
  
  log(`[MERMAID-DEBUG] 🎯 代码块转换器被调用！时间戳: ${new Date().toISOString()}`);
  
  const { code } = block;
  if (!code) {
    log(`[MERMAID-DEBUG] ❌ code对象为空或undefined`);
    return "";
  }
  
  let codeContent = "";
  const language = code.language || "";
  
  log(`[MERMAID-DEBUG] 🔍 开始处理代码块 - 语言=${language}`);
  log(`[MERMAID-DEBUG] 📦 code对象完整结构: ${JSON.stringify(code, null, 2)}`);
  
  // 特别标记mermaid代码块
  if (language === 'mermaid') {
    log(`[MERMAID-DEBUG] ⭐ 检测到mermaid代码块！`);
  }
  
  // 尝试从多个可能的字段获取代码内容
  if (code.rich_text && Array.isArray(code.rich_text) && code.rich_text.length > 0) {
    // 方式1：从rich_text字段获取（标准情况）
    codeContent = code.rich_text.map((t) => t.plain_text || "").join("\n");
    log(`[MERMAID-DEBUG] ✅ 从rich_text获取内容(${codeContent.length}字符): "${codeContent}"`);
  } else if (code.text && Array.isArray(code.text) && code.text.length > 0) {
    // 方式2：从text字段获取（备用情况）
    codeContent = code.text.map((t) => t.plain_text || t.text?.content || "").join("\n");
    log(`[MERMAID-DEBUG] ✅ 从text获取内容(${codeContent.length}字符): "${codeContent}"`);
  } else {
    // 方式3：检查其他可能的字段
    log(`[MERMAID-DEBUG] ⚠️ rich_text和text都为空，检查其他字段`);
    
    // 尝试直接从code对象的其他属性获取
    const allKeys = Object.keys(code);
    log(`[MERMAID-DEBUG] code对象的所有键: [${allKeys.join(', ')}]`);
    
    // 检查每个字段的值
    allKeys.forEach(key => {
      if (key !== 'language') {
        log(`[MERMAID-DEBUG] ${key}: ${JSON.stringify(code[key], null, 2)}`);
      }
    });
    
    // 如果rich_text字段存在但为空数组，创建默认的空内容，避免内置逻辑报错
    if (!code.rich_text || !Array.isArray(code.rich_text)) {
      log(`[MERMAID-DEBUG] ⚠️ rich_text字段缺失或格式错误，返回空代码块`);
      // 直接返回空代码块，避免内置逻辑处理时出错
      return `\`\`\`${language}\n\n\`\`\``;
    }
  }
  
  const result = `\`\`\`${language}\n${codeContent}\n\`\`\``;
  log(`[MERMAID-DEBUG] 🎯 最终结果(${result.length}字符):`);
  log(`[MERMAID-DEBUG] ${result}`);
  
  // 如果是mermaid且内容为空，强制添加一些标记以便追踪
  if (language === 'mermaid' && codeContent.length === 0) {
    log(`[MERMAID-DEBUG] 🚨 MERMAID代码块内容为空！这就是问题所在！`);
    // 返回带有调试标记的空mermaid块
    return `\`\`\`mermaid\n<!-- MERMAID_DEBUG: 内容为空 -->\n\`\`\``;
  }
  
  // 始终返回有效的代码块格式
  return result;
}

function getPropVal(data) {
  let val = data[data.type];
  if (!val) return undefined;
  switch (data.type) {
    case "multi_select":
      return val.map((a) => a.name);
    case "select":
      return val.name;
    case "date":
      var mt = moment(val.start);
      if (!mt.isValid()) return val.start;
      // 🔧 使用固定UTC格式，避免时区配置差异导致重复生成
      return mt.utc().format('YYYY-MM-DD HH:mm:ss');
    case "formula":
      // 🆕 处理公式字段
      if (val.type === "date" && val.date) {
        // 处理返回日期的公式
        var mt = moment(val.date.start);
        if (!mt.isValid()) return val.date.start;
        // 🔧 使用固定UTC格式，避免时区配置差异导致重复生成
        return mt.utc().format('YYYY-MM-DD HH:mm:ss');
      } else if (val.type === "string") {
        return val.string;
      } else if (val.type === "number") {
        return val.number;
      } else if (val.type === "boolean") {
        return val.boolean;
      }
      return "";
    case "rich_text":
    case "title":
      return val.map((a) => a.plain_text).join("");
    case "text":
      return data.plain_text;
    case "files":
      if (val.length < 1) return "";
      return val[0][val[0].type].url;
    case "created_time":
    case "last_edited_time":
      var mt = moment(val);
      if (!mt.isValid()) return val;
      // 🔧 使用固定UTC格式，避免时区配置差异导致重复生成
      return mt.utc().format('YYYY-MM-DD HH:mm:ss');
    default:
      return "";
  }
}

module.exports = {
  sync,
  init,
};
