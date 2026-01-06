import {
  PHASE_LABELS,
  TYPE_LABELS,
  getShichenFromHour,
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
});
