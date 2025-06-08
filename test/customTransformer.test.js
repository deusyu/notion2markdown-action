const { getUrlFromFileOrExternalBlock } = require('../src/customTransformer');

describe('customTransformer', () => {
  describe('getUrlFromFileOrExternalBlock', () => {
    it('应该正确处理视频块', () => {
      const videoBlock = {
        type: 'video',
        video: {
          url: 'https://example.com/test.mp4'
        }
      };
      const result = getUrlFromFileOrExternalBlock(videoBlock, 'video');
      expect(result).toBe('https://example.com/test.mp4');
    });

    it('应该处理不同类型的视频块', () => {
      const blockTypes = ['file', 'external', 'video'];
      const testUrl = 'https://example.com/test.mp4';
      
      for (const type of blockTypes) {
        const block = {
          type: type,
          [type]: {
            url: testUrl
          }
        };
        const result = getUrlFromFileOrExternalBlock(block, 'video');
        expect(result).toBe(testUrl);
      }
    });

    it('应该处理无效的视频块', () => {
      const invalidBlocks = [
        null,
        undefined,
        {},
        { type: 'invalid' },
        { type: 'video', video: {} }
      ];
      
      for (const block of invalidBlocks) {
        const result = getUrlFromFileOrExternalBlock(block, 'video');
        expect(result).toBe(false);
      }
    });
  });
}); 