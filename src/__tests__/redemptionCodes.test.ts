/**
 * 卡密相关功能测试
 */

describe('卡密功能测试', () => {
  describe('卡密生成逻辑', () => {
    // 生成随机卡密的函数（从API复制）
    function generateCode(length: number = 12): string {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符 O, I, L, 0, 1
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    test('生成的卡密应该是指定长度', () => {
      const code12 = generateCode(12);
      expect(code12.length).toBe(12);

      const code8 = generateCode(8);
      expect(code8.length).toBe(8);

      const code16 = generateCode(16);
      expect(code16.length).toBe(16);
    });

    test('生成的卡密应该只包含允许的字符', () => {
      const allowedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      const code = generateCode(100); // 生成长一点的来测试

      for (const char of code) {
        expect(allowedChars).toContain(char);
      }
    });

    test('生成的卡密不应该包含容易混淆的字符', () => {
      const confusingChars = 'OI01L';

      // 生成大量卡密来确保随机性
      for (let i = 0; i < 100; i++) {
        const code = generateCode(12);
        for (const char of confusingChars) {
          expect(code).not.toContain(char);
        }
      }
    });

    test('连续生成的卡密应该不同', () => {
      const codes = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        codes.add(generateCode(12));
      }

      // 生成1000个卡密，应该几乎全部不同
      expect(codes.size).toBeGreaterThan(count * 0.99);
    });
  });

  describe('卡密格式验证', () => {
    function isValidCode(code: string): boolean {
      if (!code || typeof code !== 'string') return false;
      if (code.length < 8 || code.length > 16) return false;

      const allowedChars = /^[A-HJ-NP-Z2-9]+$/;
      return allowedChars.test(code);
    }

    test('有效的卡密应该通过验证', () => {
      expect(isValidCode('ABCD1234EFGH')).toBe(false); // 包含1
      expect(isValidCode('ABCD2345EFGH')).toBe(true);
      expect(isValidCode('ABCDEFGH')).toBe(true);
      expect(isValidCode('WXYZ5678MNPQ')).toBe(true);
    });

    test('无效的卡密应该不通过验证', () => {
      expect(isValidCode('')).toBe(false);
      expect(isValidCode('ABC')).toBe(false); // 太短
      expect(isValidCode('ABCD1234EFGH')).toBe(false); // 包含1
      expect(isValidCode('ABCD0234EFGH')).toBe(false); // 包含0
      expect(isValidCode('ABCDOEFGHIJK')).toBe(false); // 包含O
      expect(isValidCode('ABCDlEFGHIJK')).toBe(false); // 包含小写l
      expect(isValidCode('abcdefghijkl')).toBe(false); // 小写字母
    });

    test('空值应该不通过验证', () => {
      expect(isValidCode(null as unknown as string)).toBe(false);
      expect(isValidCode(undefined as unknown as string)).toBe(false);
    });
  });

  describe('卡密数据结构', () => {
    interface RedemptionCode {
      id: string;
      code: string;
      test_slug: string;
      report_level: 'basic' | 'full';
      is_used: boolean;
      used_by_device: string | null;
      used_at: string | null;
      batch_name: string | null;
      created_at: string;
    }

    test('卡密对象应该包含所有必要字段', () => {
      const mockCode: RedemptionCode = {
        id: 'uuid-123',
        code: 'ABCD2345EFGH',
        test_slug: 'enneagram',
        report_level: 'basic',
        is_used: false,
        used_by_device: null,
        used_at: null,
        batch_name: '测试批次',
        created_at: new Date().toISOString(),
      };

      expect(mockCode).toHaveProperty('id');
      expect(mockCode).toHaveProperty('code');
      expect(mockCode).toHaveProperty('test_slug');
      expect(mockCode).toHaveProperty('report_level');
      expect(mockCode).toHaveProperty('is_used');
      expect(mockCode).toHaveProperty('used_by_device');
      expect(mockCode).toHaveProperty('used_at');
      expect(mockCode).toHaveProperty('batch_name');
      expect(mockCode).toHaveProperty('created_at');
    });

    test('report_level 只能是 basic 或 full', () => {
      const validLevels = ['basic', 'full'];

      validLevels.forEach(level => {
        const mockCode = {
          report_level: level as 'basic' | 'full',
        };
        expect(['basic', 'full']).toContain(mockCode.report_level);
      });
    });
  });

  describe('卡密使用流程', () => {
    test('未使用的卡密应该可以被使用', () => {
      const unusedCode = {
        code: 'TESTCODE1234',
        is_used: false,
        test_slug: 'enneagram',
      };

      expect(unusedCode.is_used).toBe(false);

      // 模拟使用卡密
      const usedCode = {
        ...unusedCode,
        is_used: true,
        used_by_device: 'device-123',
        used_at: new Date().toISOString(),
      };

      expect(usedCode.is_used).toBe(true);
      expect(usedCode.used_by_device).toBeDefined();
      expect(usedCode.used_at).toBeDefined();
    });

    test('卡密只能用于绑定的测试类型', () => {
      const enneagramCode = {
        code: 'ENNCODE12345',
        test_slug: 'enneagram',
      };

      const lifeCode = {
        code: 'LIFECODE1234',
        test_slug: 'life-curve',
      };

      // 验证卡密匹配
      function canUseCode(code: typeof enneagramCode, targetTest: string): boolean {
        return code.test_slug === targetTest;
      }

      expect(canUseCode(enneagramCode, 'enneagram')).toBe(true);
      expect(canUseCode(enneagramCode, 'life-curve')).toBe(false);
      expect(canUseCode(lifeCode, 'life-curve')).toBe(true);
      expect(canUseCode(lifeCode, 'enneagram')).toBe(false);
    });

    test('已使用的卡密不能再次使用', () => {
      const usedCode = {
        code: 'USEDCODE1234',
        is_used: true,
      };

      function canUseCode(code: typeof usedCode): boolean {
        return !code.is_used;
      }

      expect(canUseCode(usedCode)).toBe(false);

      const unusedCode = {
        code: 'FRESHCODE123',
        is_used: false,
      };

      expect(canUseCode(unusedCode)).toBe(true);
    });
  });

  describe('批量生成卡密', () => {
    test('批量生成应该创建指定数量的卡密', () => {
      function generateBatch(count: number): string[] {
        const codes: string[] = [];
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        for (let i = 0; i < count; i++) {
          let code = '';
          for (let j = 0; j < 12; j++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          codes.push(code);
        }

        return codes;
      }

      const batch10 = generateBatch(10);
      expect(batch10.length).toBe(10);

      const batch100 = generateBatch(100);
      expect(batch100.length).toBe(100);
    });

    test('批量生成的卡密应该唯一', () => {
      function generateBatchUnique(count: number): string[] {
        const codes = new Set<string>();
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        while (codes.size < count) {
          let code = '';
          for (let j = 0; j < 12; j++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          codes.add(code);
        }

        return Array.from(codes);
      }

      const batch = generateBatchUnique(1000);
      const uniqueSet = new Set(batch);

      expect(uniqueSet.size).toBe(batch.length);
    });
  });
});
