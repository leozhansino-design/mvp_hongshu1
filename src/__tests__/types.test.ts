import {
  PHASE_LABELS,
  TYPE_LABELS,
  getShichenFromHour,
  isValidChineseName,
  CHINESE_NAME_REGEX,
} from '@/types';

describe('Type Definitions', () => {
  describe('PHASE_LABELS', () => {
    test('contains all phase types', () => {
      expect(PHASE_LABELS.rising).toBe('上升期');
      expect(PHASE_LABELS.peak).toBe('巅峰期');
      expect(PHASE_LABELS.stable).toBe('平稳期');
      expect(PHASE_LABELS.declining).toBe('调整期');
      expect(PHASE_LABELS.valley).toBe('蓄势期');
    });
  });

  describe('TYPE_LABELS', () => {
    test('contains all type labels', () => {
      expect(TYPE_LABELS.career).toBe('事业');
      expect(TYPE_LABELS.wealth).toBe('财运');
      expect(TYPE_LABELS.love).toBe('姻缘');
      expect(TYPE_LABELS.health).toBe('健康');
      expect(TYPE_LABELS.general).toBe('综合');
    });
  });

  describe('getShichenFromHour', () => {
    test('returns correct shichen for each hour', () => {
      expect(getShichenFromHour(0)).toBe('子时');
      expect(getShichenFromHour(23)).toBe('子时');
      expect(getShichenFromHour(1)).toBe('丑时');
      expect(getShichenFromHour(3)).toBe('寅时');
      expect(getShichenFromHour(5)).toBe('卯时');
      expect(getShichenFromHour(7)).toBe('辰时');
      expect(getShichenFromHour(9)).toBe('巳时');
      expect(getShichenFromHour(11)).toBe('午时');
      expect(getShichenFromHour(13)).toBe('未时');
      expect(getShichenFromHour(15)).toBe('申时');
      expect(getShichenFromHour(17)).toBe('酉时');
      expect(getShichenFromHour(19)).toBe('戌时');
      expect(getShichenFromHour(21)).toBe('亥时');
    });
  });

  describe('isValidChineseName', () => {
    test('accepts valid 2-character Chinese names', () => {
      expect(isValidChineseName('张三')).toBe(true);
      expect(isValidChineseName('李四')).toBe(true);
      expect(isValidChineseName('王五')).toBe(true);
    });

    test('accepts valid 3-character Chinese names', () => {
      expect(isValidChineseName('张小明')).toBe(true);
      expect(isValidChineseName('欧阳修')).toBe(true);
      expect(isValidChineseName('司马懿')).toBe(true);
    });

    test('accepts valid 4-character Chinese names', () => {
      expect(isValidChineseName('欧阳小明')).toBe(true);
      expect(isValidChineseName('诸葛亮亮')).toBe(true);
    });

    test('rejects single character names', () => {
      expect(isValidChineseName('张')).toBe(false);
      expect(isValidChineseName('李')).toBe(false);
    });

    test('rejects names longer than 4 characters', () => {
      expect(isValidChineseName('张三李四王')).toBe(false);
      expect(isValidChineseName('欧阳小明明')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidChineseName('')).toBe(false);
    });

    test('rejects English characters', () => {
      expect(isValidChineseName('John')).toBe(false);
      expect(isValidChineseName('张John')).toBe(false);
      expect(isValidChineseName('abc')).toBe(false);
    });

    test('rejects numbers', () => {
      expect(isValidChineseName('123')).toBe(false);
      expect(isValidChineseName('张123')).toBe(false);
      expect(isValidChineseName('张三1')).toBe(false);
    });

    test('rejects special characters', () => {
      expect(isValidChineseName('张@三')).toBe(false);
      expect(isValidChineseName('张 三')).toBe(false);
      expect(isValidChineseName('张-三')).toBe(false);
    });

    test('rejects mixed Chinese and other characters', () => {
      expect(isValidChineseName('张abc三')).toBe(false);
      expect(isValidChineseName('a张三')).toBe(false);
      expect(isValidChineseName('张三b')).toBe(false);
    });
  });

  describe('CHINESE_NAME_REGEX', () => {
    test('regex pattern is correct', () => {
      expect(CHINESE_NAME_REGEX.source).toBe('^[\\u4e00-\\u9fa5]{2,4}$');
    });
  });
});
