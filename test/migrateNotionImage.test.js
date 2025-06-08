const { migrateNotionImageFromURL } = require('../src/migrateNotionImage');
const { PicGo } = require('picgo');

describe('migrateNotionImage', () => {
  let picgo;
  
  beforeEach(() => {
    picgo = new PicGo();
    picgo.setConfig({
      'picBed': {
        'current': 'smms',
        'uploader': 'smms',
        'smms': {
          'token': 'test-token'
        }
      }
    });
  });

  describe('migrateNotionImageFromURL', () => {
    it('应该正确处理视频文件URL', async () => {
      const videoUrl = 'https://s3.us-west-2.amazonaws.com/secure.notion-static.com/12345678-1234-1234-1234-123456789012/test.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256';
      const result = await migrateNotionImageFromURL(picgo, videoUrl);
      expect(result).toBeDefined();
      expect(result).toMatch(/\.mp4$/);
    });

    it('应该支持多种视频格式', async () => {
      const formats = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
      for (const format of formats) {
        const videoUrl = `https://s3.us-west-2.amazonaws.com/secure.notion-static.com/12345678-1234-1234-1234-123456789012/test.${format}?X-Amz-Algorithm=AWS4-HMAC-SHA256`;
        const result = await migrateNotionImageFromURL(picgo, videoUrl);
        expect(result).toBeDefined();
        expect(result).toMatch(new RegExp(`\\.${format}$`));
      }
    });

    it('应该跳过非视频文件URL', async () => {
      const nonVideoUrl = 'https://example.com/test.txt';
      const result = await migrateNotionImageFromURL(picgo, nonVideoUrl);
      expect(result).toBe(nonVideoUrl);
    });
  });
}); 