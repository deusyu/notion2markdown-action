/**
 * 本地测试配置文件 - 匹配你的GitHub Action AWS S3配置
 * 复制并重命名为 test.config.local.js，然后填入你的真实配置
 */

module.exports = {
  // Notion 配置
  notion_secret: process.env.NOTION_TOKEN || "替换为你的Notion Secret",
  database_id: process.env.NOTION_DATABASE_ID || "替换为你的Database ID",
  
  // AWS S3 图床配置 - 匹配你的GitHub Action配置
  picBed: {
    current: "aws-s3",
    uploader: "aws-s3",
    
    // AWS S3 配置 - 匹配你的GitHub Action
    "aws-s3": {
      accessKeyID: process.env.S3_ACCESS_KEY_ID || "替换为你的S3 Access Key ID",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "替换为你的S3 Secret Access Key", 
      bucketName: process.env.S3_BUCKET_NAME || "替换为你的S3 Bucket名",
      uploadPath: "{fileName}.{extName}", // 匹配你的GitHub Action配置
      endpoint: process.env.S3_ENDPOINT || "替换为你的S3 Endpoint",
      urlPrefix: process.env.S3_URL_PREFIX || "替换为你的S3 URL前缀",
      acl: "public-read", // 匹配你的配置
      allowDomains: ["*.amazonaws.com"] // 匹配你的配置
    },
    
    // PicGo插件配置 - 匹配你的GitHub Action
    plugins: {
      "picgo-plugin-s3": true
    }
  },
  
  // 其他配置 - 匹配你的GitHub Action参数
  migrate_image: true, // 对应GitHub Action中的 pic_migrate: true
  pic_compress: false, // 匹配你的 pic_compress: false
  status: {
    name: "pstatus", // 状态字段名：根据API测试结果，字段名是pstatus
    published: "已发布", // 已发布状态值，根据你的实际状态值调整
    unpublish: "正在写" // 未发布状态值：根据API测试结果
  },
  output_dir: {
    page: "source/", // 匹配 output_page_dir: "source"
    post: "source/_posts/notion/", // 匹配 output_post_dir: "source/_posts/notion"  
    clean_unpublished_post: false // 测试时设为false，避免误删文件
  },
  metas_keeped: ["abbrlink"], // 保留的字段，根据需要调整
  metas_excluded: ["ptype", "pstatus"], // 排除的字段，根据需要调整
  timezone: "Asia/Shanghai", // 匹配你的timezone配置
  last_sync_datetime: null // 增量同步时间，null表示全量同步
}; 