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

  const testBirthInfo: BirthInfo = {
    gender: 'male',
    year: 1990,
    month: 6,
    day: 15,
    hour: 'wu',
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

    test('getFreePrompt includes birth info', () => {
      const prompt = getFreePrompt(testBirthInfo);
      expect(prompt).toContain('1990');
      expect(prompt).toContain('6');
      expect(prompt).toContain('15');
      expect(prompt).toContain('男');
      expect(prompt).toContain('午时');
    });

    test('getPaidPrompt includes birth info and age', () => {
      const prompt = getPaidPrompt(testBirthInfo);
      expect(prompt).toContain('1990');
      expect(prompt).toContain('男');
      expect(prompt).toContain('流年级别');
    });

    test('getFreePrompt for female', () => {
      const femaleInfo: BirthInfo = { ...testBirthInfo, gender: 'female' };
      const prompt = getFreePrompt(femaleInfo);
      expect(prompt).toContain('女');
    });
  });
});
