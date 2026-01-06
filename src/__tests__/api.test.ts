import { testAPIConnection, getSystemPrompt, getFreePrompt, getPaidPrompt } from '@/services/api';
import { BirthInfo } from '@/types';

const mockFetch = global.fetch as jest.Mock;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const testConfig = {
    baseUrl: 'https://api.test.com/v1',
    apiKey: 'test-key',
    model: 'test-model',
  };

  // 使用正确的 BirthInfo 格式（hour 是数字）
  const testBirthInfo: BirthInfo = {
    gender: 'male',
    year: 1996,
    month: 5,
    day: 7,
    hour: 15,
    minute: 0,
    calendarType: 'solar',
  };

  describe('testAPIConnection', () => {
    test('returns success when API responds correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '连接成功' } }],
        }),
      });

      const result = await testAPIConnection(testConfig);
      expect(result.success).toBe(true);
      expect(result.message).toBe('连接成功');
    });

    test('returns failure when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const result = await testAPIConnection(testConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('401');
    });

    test('returns failure on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await testAPIConnection(testConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('Prompt Generation', () => {
    test('getSystemPrompt returns non-empty string', () => {
      const prompt = getSystemPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('八字命理');
    });

    test('getFreePrompt includes pre-calculated bazi', () => {
      const prompt = getFreePrompt(testBirthInfo);
      expect(prompt).toContain('1996');
      expect(prompt).toContain('乾造');
      // 验证预计算的八字信息
      expect(prompt).toContain('年柱');
      expect(prompt).toContain('月柱');
      expect(prompt).toContain('日柱');
      expect(prompt).toContain('时柱');
      // 验证包含大运
      expect(prompt).toContain('大运');
    });

    test('getPaidPrompt includes pre-calculated bazi and daYun', () => {
      const prompt = getPaidPrompt(testBirthInfo);
      expect(prompt).toContain('1996');
      expect(prompt).toContain('乾造');
      // 验证包含当前年龄
      expect(prompt).toContain('虚岁');
      // 验证预计算的八字和大运
      expect(prompt).toContain('年柱');
      expect(prompt).toContain('大运');
    });

    test('getFreePrompt for female uses 坤造', () => {
      const femaleInfo: BirthInfo = { ...testBirthInfo, gender: 'female' };
      const prompt = getFreePrompt(femaleInfo);
      expect(prompt).toContain('坤造');
    });

    test('prompt uses pre-calculated bazi not letting AI calculate', () => {
      const prompt = getFreePrompt(testBirthInfo);
      // 验证提示词明确告诉AI使用已提供的八字
      expect(prompt).toContain('已排好');
      expect(prompt).toContain('直接使用');
    });
  });
});
