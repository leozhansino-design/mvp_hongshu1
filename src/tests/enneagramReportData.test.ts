/**
 * 九型人格报告数据测试
 */

import {
  enneagramTypeDatabase,
  getEnneagramReportData,
  getAllTypeSummaries,
  type EnneagramTypeData
} from '@/data/enneagramReportData';

describe('EnneagramReportData', () => {
  describe('enneagramTypeDatabase', () => {
    it('应该包含所有9种人格类型', () => {
      expect(Object.keys(enneagramTypeDatabase)).toHaveLength(9);
      for (let i = 1; i <= 9; i++) {
        expect(enneagramTypeDatabase[i]).toBeDefined();
      }
    });

    it('每种类型应该有完整的数据结构', () => {
      Object.values(enneagramTypeDatabase).forEach((typeData: EnneagramTypeData) => {
        // 基本信息
        expect(typeData.type).toBeGreaterThanOrEqual(1);
        expect(typeData.type).toBeLessThanOrEqual(9);
        expect(typeData.name).toBeTruthy();
        expect(typeData.subtitle).toBeTruthy();

        // 核心特质
        expect(typeData.coreTraits.fear).toBeTruthy();
        expect(typeData.coreTraits.desire).toBeTruthy();
        expect(typeData.coreTraits.motivation).toBeTruthy();
        expect(typeData.coreTraits.trap).toBeTruthy();

        // 深度描述
        expect(typeData.deepDescription.overview).toBeTruthy();
        expect(typeData.deepDescription.innerWorld).toBeTruthy();
        expect(typeData.deepDescription.behavior).toBeTruthy();
        expect(typeData.deepDescription.emotionalPattern).toBeTruthy();

        // 优势和劣势
        expect(Array.isArray(typeData.strengths)).toBe(true);
        expect(typeData.strengths.length).toBeGreaterThan(0);
        expect(Array.isArray(typeData.weaknesses)).toBe(true);
        expect(typeData.weaknesses.length).toBeGreaterThan(0);

        // 成长路径
        expect(Array.isArray(typeData.growthPath.healthy)).toBe(true);
        expect(Array.isArray(typeData.growthPath.average)).toBe(true);
        expect(Array.isArray(typeData.growthPath.unhealthy)).toBe(true);

        // 压力与成长方向
        expect(typeData.stressAndGrowth.stressDirection).toBeGreaterThanOrEqual(1);
        expect(typeData.stressAndGrowth.stressDirection).toBeLessThanOrEqual(9);
        expect(typeData.stressAndGrowth.stressBehavior).toBeTruthy();
        expect(typeData.stressAndGrowth.growthDirection).toBeGreaterThanOrEqual(1);
        expect(typeData.stressAndGrowth.growthDirection).toBeLessThanOrEqual(9);
        expect(typeData.stressAndGrowth.growthBehavior).toBeTruthy();

        // 侧翼
        expect(typeData.wings).toBeDefined();

        // 关系
        expect(typeData.relationships.romantic).toBeTruthy();
        expect(typeData.relationships.friendship).toBeTruthy();
        expect(typeData.relationships.workplace).toBeTruthy();
        expect(typeData.relationships.family).toBeTruthy();

        // 沟通
        expect(typeData.communication.style).toBeTruthy();
        expect(Array.isArray(typeData.communication.preferences)).toBe(true);
        expect(Array.isArray(typeData.communication.tips)).toBe(true);

        // 职业
        expect(Array.isArray(typeData.career.suitable)).toBe(true);
        expect(typeData.career.suitable.length).toBeGreaterThan(0);
        expect(Array.isArray(typeData.career.strengths)).toBe(true);
        expect(Array.isArray(typeData.career.challenges)).toBe(true);
        expect(typeData.career.developmentAdvice).toBeTruthy();

        // 生活建议
        expect(Array.isArray(typeData.lifeSuggestions.health)).toBe(true);
        expect(Array.isArray(typeData.lifeSuggestions.emotional)).toBe(true);
        expect(Array.isArray(typeData.lifeSuggestions.spiritual)).toBe(true);
        expect(Array.isArray(typeData.lifeSuggestions.practical)).toBe(true);

        // 名人和金句
        expect(Array.isArray(typeData.famousPeople)).toBe(true);
        expect(typeData.famousPeople.length).toBeGreaterThan(0);
        expect(Array.isArray(typeData.quotes)).toBe(true);
        expect(typeData.quotes.length).toBeGreaterThan(0);
      });
    });

    it('每种类型应该有正确的侧翼组合', () => {
      for (let i = 1; i <= 9; i++) {
        const typeData = enneagramTypeDatabase[i];
        const prevType = i === 1 ? 9 : i - 1;
        const nextType = i === 9 ? 1 : i + 1;

        const wing1Key = `${i}w${prevType}`;
        const wing2Key = `${i}w${nextType}`;

        expect(typeData.wings[wing1Key] || typeData.wings[wing2Key]).toBeDefined();
      }
    });
  });

  describe('getEnneagramReportData', () => {
    it('应该返回有效类型的数据', () => {
      for (let i = 1; i <= 9; i++) {
        const data = getEnneagramReportData(i);
        expect(data).toBeDefined();
        expect(data?.type).toBe(i);
      }
    });

    it('应该对无效类型返回null', () => {
      expect(getEnneagramReportData(0)).toBeNull();
      expect(getEnneagramReportData(10)).toBeNull();
      expect(getEnneagramReportData(-1)).toBeNull();
    });
  });

  describe('getAllTypeSummaries', () => {
    it('应该返回所有9种类型的摘要', () => {
      const summaries = getAllTypeSummaries();
      expect(summaries).toHaveLength(9);
      summaries.forEach(summary => {
        expect(summary.type).toBeGreaterThanOrEqual(1);
        expect(summary.type).toBeLessThanOrEqual(9);
        expect(summary.name).toBeTruthy();
        expect(summary.subtitle).toBeTruthy();
      });
    });
  });

  describe('数据质量检查', () => {
    it('优势列表应该有至少4项', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.strengths.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('劣势列表应该有至少4项', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.weaknesses.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('职业建议应该有至少6项', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.career.suitable.length).toBeGreaterThanOrEqual(6);
      });
    });

    it('名人列表应该有至少4位', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.famousPeople.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('金句应该有至少3条', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.quotes.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('每个成长路径层级应该有具体内容', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.growthPath.healthy.length).toBeGreaterThan(0);
        expect(typeData.growthPath.average.length).toBeGreaterThan(0);
        expect(typeData.growthPath.unhealthy.length).toBeGreaterThan(0);
      });
    });

    it('生活建议每个维度应该有至少3条', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.lifeSuggestions.health.length).toBeGreaterThanOrEqual(3);
        expect(typeData.lifeSuggestions.emotional.length).toBeGreaterThanOrEqual(3);
        expect(typeData.lifeSuggestions.spiritual.length).toBeGreaterThanOrEqual(3);
        expect(typeData.lifeSuggestions.practical.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('沟通偏好和建议应该各有至少3条', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        expect(typeData.communication.preferences.length).toBeGreaterThanOrEqual(3);
        expect(typeData.communication.tips.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('压力和成长方向验证', () => {
    // 九型人格的压力和成长方向应该遵循特定模式
    const stressDirections: Record<number, number> = {
      1: 4, 2: 8, 3: 9, 4: 2, 5: 7, 6: 3, 7: 1, 8: 5, 9: 6
    };

    const growthDirections: Record<number, number> = {
      1: 7, 2: 4, 3: 6, 4: 1, 5: 8, 6: 9, 7: 5, 8: 2, 9: 3
    };

    it('每种类型的压力方向应该正确', () => {
      for (let i = 1; i <= 9; i++) {
        const typeData = enneagramTypeDatabase[i];
        expect(typeData.stressAndGrowth.stressDirection).toBe(stressDirections[i]);
      }
    });

    it('每种类型的成长方向应该正确', () => {
      for (let i = 1; i <= 9; i++) {
        const typeData = enneagramTypeDatabase[i];
        expect(typeData.stressAndGrowth.growthDirection).toBe(growthDirections[i]);
      }
    });
  });

  describe('内容完整性检查', () => {
    it('所有文本内容不应为空字符串', () => {
      Object.values(enneagramTypeDatabase).forEach(typeData => {
        // 检查所有字符串字段
        expect(typeData.name.trim()).toBeTruthy();
        expect(typeData.subtitle.trim()).toBeTruthy();
        expect(typeData.deepDescription.overview.trim().length).toBeGreaterThan(50);
        expect(typeData.deepDescription.innerWorld.trim().length).toBeGreaterThan(50);
        expect(typeData.deepDescription.behavior.trim().length).toBeGreaterThan(50);
        expect(typeData.deepDescription.emotionalPattern.trim().length).toBeGreaterThan(50);

        // 检查数组内容
        typeData.strengths.forEach(s => expect(s.trim()).toBeTruthy());
        typeData.weaknesses.forEach(w => expect(w.trim()).toBeTruthy());
        typeData.famousPeople.forEach(p => expect(p.trim()).toBeTruthy());
        typeData.quotes.forEach(q => expect(q.trim()).toBeTruthy());
      });
    });
  });
});
