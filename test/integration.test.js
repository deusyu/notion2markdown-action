const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const { PicGo } = require('picgo');
const { init, sync } = require('../src/notion');

describe('视频处理集成测试', () => {
  let notion;
  let n2m;
  let picgo;
  let config;

  beforeEach(() => {
    config = {
      notion_secret: process.env.NOTION_SECRET || 'test-secret',
      database_id: process.env.NOTION_DATABASE_ID || 'test-database-id',
      migrate_image: true,
      picBed: {
        current: 'smms',
        uploader: 'smms',
        smms: {
          token: process.env.SMMS_TOKEN || 'test-token'
        }
      },
      status: {
        name: 'status',
        published: '已发布'
      },
      output_dir: {
        page: 'test-output/pages',
        post: 'test-output/posts',
        clean_unpublished_post: false
      }
    };

    notion = new Client({ auth: config.notion_secret });
    n2m = new NotionToMarkdown({ notionClient: notion });
    picgo = new PicGo();
  });

  it('应该正确处理包含视频的Notion页面', async () => {
    // 初始化
    init(config);

    // 模拟一个包含视频的页面
    const testPage = {
      id: 'test-page-id',
      properties: {
        title: {
          title: [{ plain_text: '测试视频页面' }]
        },
        status: {
          select: { name: '已发布' }
        }
      },
      cover: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString()
    };

    // 模拟Notion API响应
    jest.spyOn(notion.databases, 'query').mockResolvedValue({
      results: [testPage]
    });

    // 模拟NotionToMarkdown转换
    jest.spyOn(n2m, 'pageToMarkdown').mockResolvedValue([
      {
        type: 'video',
        parent: '![测试视频](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/12345678-1234-1234-1234-123456789012/test.mp4)'
      }
    ]);

    // 执行同步
    const result = await sync();

    // 验证结果
    expect(result.handled).toBe(1);
    expect(result.queried).toBe(1);
  });

  it('应该处理多种视频格式的页面', async () => {
    // 初始化
    init(config);

    // 模拟包含多种视频格式的页面
    const testPage = {
      id: 'test-page-id',
      properties: {
        title: {
          title: [{ plain_text: '测试多种视频格式' }]
        },
        status: {
          select: { name: '已发布' }
        }
      },
      cover: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString()
    };

    // 模拟Notion API响应
    jest.spyOn(notion.databases, 'query').mockResolvedValue({
      results: [testPage]
    });

    // 模拟NotionToMarkdown转换，包含多种视频格式
    const videoFormats = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
    const markdownBlocks = videoFormats.map(format => ({
      type: 'video',
      parent: `![${format}视频](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/12345678-1234-1234-1234-123456789012/test.${format})`
    }));

    jest.spyOn(n2m, 'pageToMarkdown').mockResolvedValue(markdownBlocks);

    // 执行同步
    const result = await sync();

    // 验证结果
    expect(result.handled).toBe(1);
    expect(result.queried).toBe(1);
  });
}); 