/**
 * 本地测试配置文件
 * 复制并重命名为 test.config.local.js，然后填入你的真实配置
 */

module.exports = {
  // Notion 配置
  notion_secret: process.env.NOTION_SECRET || "替换为你的Notion Secret",
  database_id: process.env.NOTION_DATABASE_ID || "替换为你的Database ID",
  
  // 图床配置 - 根据你使用的图床类型选择
  picBed: {
    current: "smms", // 或者 "tcyun", "aliyun", "qiniu", "upyun" 等
    uploader: "smms",
    
    // SMMS 配置示例
    smms: {
      token: process.env.SMMS_TOKEN || "替换为你的SMMS Token"
    },
    
    // 腾讯云COS配置示例
    tcyun: {
      secretId: process.env.TCYUN_SECRET_ID || "",
      secretKey: process.env.TCYUN_SECRET_KEY || "",
      bucket: process.env.TCYUN_BUCKET || "",
      appId: process.env.TCYUN_APP_ID || "",
      area: process.env.TCYUN_AREA || "ap-beijing",
      path: process.env.TCYUN_PATH || "",
      customUrl: process.env.TCYUN_CUSTOM_URL || ""
    },
    
    // 阿里云OSS配置示例
    aliyun: {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || "",
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || "",
      bucket: process.env.ALIYUN_BUCKET || "",
      area: process.env.ALIYUN_AREA || "oss-cn-beijing",
      path: process.env.ALIYUN_PATH || "",
      customUrl: process.env.ALIYUN_CUSTOM_URL || ""
    }
  },
  
  // 其他配置
  migrate_image: true, // 是否迁移图片/视频
  pic_compress: false, // 是否压缩图片
  status: {
    name: "status", // 状态字段名
    published: "已发布", // 已发布状态值
    unpublish: "草稿" // 未发布状态值
  },
  output_dir: {
    page: "test-output/pages/", // 页面输出目录
    post: "test-output/posts/", // 文章输出目录
    clean_unpublished_post: false // 测试时不要删除未发布的文章
  },
  metas_keeped: ["abbrlink"], // 保留的字段
  metas_excluded: ["ptype", "pstatus"], // 排除的字段
  timezone: "Asia/Shanghai",
  last_sync_datetime: null // 增量同步时间，null表示全量同步
}; 