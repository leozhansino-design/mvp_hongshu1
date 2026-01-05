import {
  PHASE_LABELS,
  TYPE_LABELS,
  HOUR_OPTIONS,
  HOUR_LABELS,
} from '@/types';

describe('Type Definitions', () => {
  describe('PHASE_LABELS', () => {
    test('contains all phase types', () => {
      expect(PHASE_LABELS.rising).toBe('上升之运');
      expect(PHASE_LABELS.peak).toBe('巅峰之运');
      expect(PHASE_LABELS.stable).toBe('平稳之运');
      expect(PHASE_LABELS.declining).toBe('下降之运');
      expect(PHASE_LABELS.valley).toBe('低谷之运');
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

  describe('HOUR_OPTIONS', () => {
    test('contains 13 options (12 hours + unknown)', () => {
      expect(HOUR_OPTIONS.length).toBe(13);
    });

    test('each option has value and label', () => {
      HOUR_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    test('includes unknown option', () => {
      const unknown = HOUR_OPTIONS.find((o) => o.value === 'unknown');
      expect(unknown).toBeDefined();
      expect(unknown?.label).toBe('不详');
    });
  });

  describe('HOUR_LABELS', () => {
    test('matches HOUR_OPTIONS values', () => {
      HOUR_OPTIONS.forEach((option) => {
        expect(HOUR_LABELS[option.value]).toBeDefined();
      });
    });
  });
});
