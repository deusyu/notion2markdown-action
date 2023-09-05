/*
 * @Author: Dorad, ddxi@qq.com
 * @Date: 2023-09-02 10:54:25 +08:00
 * @LastEditors: Dorad, ddxi@qq.com
 * @LastEditTime: 2023-09-03 22:29:17 +08:00
 * @FilePath: \src\index.js
 * @Description: 
 * 
 * Copyright (c) 2023 by Dorad (ddxi@qq.com), All Rights Reserved.
 */
const notion = require("./notion");
const core = require("@actions/core");


function isJson(str) {
  try {
    const obj = JSON.parse(str);
    if (obj && typeof obj == "object") return true;
  } catch (e) { }

  return false;
}

var migrate_image = core.getInput("migrate_image") === "true" || false;
const picBedConfigStr = core.getInput("picBedConfig") || "{}";

// test the picBed config
if (!isJson(picBedConfigStr)) {
  core.warning("picBedConfig is not a valid json string, use default config: {}, and set migrate_image to false.");
  migrate_image = false;
}

var picBedConfig = {};

if (migrate_image) {
  core.info("migrate_image is true, use picBedConfig to upload images.");
  picBedConfig = JSON.parse(picBedConfigStr);
}

var pic_base_url = core.getInput("pic_base_url") || null;

if (pic_base_url && !pic_base_url.endsWith("/")) {
  pic_base_url = pic_base_url + "/";
}

var keys_to_keep = core.getInput("keys_to_keep");
if (keys_to_keep && keys_to_keep.trim().length > 0) {
  keys_to_keep = keys_to_keep.split(",").map((key) => key.trim());
}

let config = {
  notion_secret: core.getInput("notion_secret"),
  database_id: core.getInput("database_id"),
  migrate_image: migrate_image || false,
  picBed: picBedConfig || {},
  pic_base_url: pic_base_url || null,
  pic_compress: core.getInput("pic_compress") === "true" || false,
  status: {
    name: core.getInput("status_name") || "status",
    published: core.getInput("status_published") || "已发布",
  },
  output_dir: {
    page: core.getInput("page_output_dir") || "source/",
    post: core.getInput("post_output_dir") || "source/_posts/notion/",
    clean_unpublished_post: core.getInput("clean_unpublished_post") === "true" || false,
  },
  keys_to_keep: keys_to_keep,
  last_sync_datetime: core.getInput("last_sync_datetime") || null,
  timezone: core.getInput("timezone") || "Asia/Shanghai",
};

// add current running file dir to PATH
process.env.PATH = __dirname + ":" + process.env.PATH;
// add all the exec file under __dirname/vendor* dirs the executable permission expect the source dir
const { execSync } = require("child_process");
// try to find all the files under __dirname/vendor* dirs and set the executable permission
try {
  execSync(`find ${__dirname}/vendor* -type f -not -name "*.tar.gz" -exec chmod +x {} \\;`);
} catch (e) {
  core.error(`Failed to set the executable permission for all the files under ${__dirname}/vendor* dirs, error: ${e}`);
}

(async function () {
  core.startGroup('Notion2markdown-action')
  notion.init(config);
  // get output
  const out = await notion.sync(core);
  // set output
  core.setOutput("updated_count", out.handled + out.deleted);
  core.summary(`Notion2markdown-action finished, queried: ${out.queried}, handled: ${out.handled} and deleted: ${out.deleted}`)
  core.endGroup('Notion2markdown-action');
})();
