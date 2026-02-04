import {
  calculateEnneagram,
  generateEnneagramReport,
  getTypeDescription,
  ENNEAGRAM_TYPE_NAMES,
  ENNEAGRAM_TYPE_ENGLISH_NAMES,
  ENNEAGRAM_TYPE_DESCRIPTIONS,
  WING_NAMES,
} from '@/lib/enneagram';

describe('九型人格计分测试', () => {
  describe('calculateEnneagram - 计分逻辑', () => {
    test('应该正确计算全部选是的情况', () => {
      // 全部选是，每种类型都得16分
      const answers = new Array(144).fill(true);
      const result = calculateEnneagram(answers);

      expect(result.scores).toEqual([16, 16, 16, 16, 16, 16, 16, 16, 16]);
      expect(result.mainType).toBe(1); // 第一个最高分
      expect(result.scorePercentages).toEqual([100, 100, 100, 100, 100, 100, 100, 100, 100]);
    });

    test('应该正确计算全部选否的情况', () => {
      const answers = new Array(144).fill(false);
      const result = calculateEnneagram(answers);

      expect(result.scores).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(result.scorePercentages).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    test('应该正确识别类型1占主导的情况', () => {
      // 只有类型1的题目选是（第1,10,19,28,37,46,55,64,73,82,91,100,109,118,127,136题）
      const answers = new Array(144).fill(false);
      // 类型1的题目索引：0, 9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 99, 108, 117, 126, 135
      [0, 9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 99, 108, 117, 126, 135].forEach(i => {
        answers[i] = true;
      });

      const result = calculateEnneagram(answers);

      expect(result.scores[0]).toBe(16); // 类型1得16分
      expect(result.mainType).toBe(1);
      expect(result.mainTypeName).toBe('完美型');
    });

    test('应该正确识别类型4占主导的情况', () => {
      // 只有类型4的题目选是（索引3, 12, 21, 30, ...）
      const answers = new Array(144).fill(false);
      for (let i = 3; i < 144; i += 9) {
        answers[i] = true;
      }

      const result = calculateEnneagram(answers);

      expect(result.scores[3]).toBe(16); // 类型4得16分
      expect(result.mainType).toBe(4);
      expect(result.mainTypeName).toBe('自我型');
      expect(result.mainTypeEnglishName).toBe('The Individualist');
    });

    test('应该正确计算侧翼类型', () => {
      // 类型4得高分，类型3和5分别得一些分
      const answers = new Array(144).fill(false);
      // 类型4全部选是
      for (let i = 3; i < 144; i += 9) {
        answers[i] = true;
      }
      // 类型5部分选是（8道）
      let type5Count = 0;
      for (let i = 4; i < 144 && type5Count < 8; i += 9) {
        answers[i] = true;
        type5Count++;
      }
      // 类型3部分选是（4道）
      let type3Count = 0;
      for (let i = 2; i < 144 && type3Count < 4; i += 9) {
        answers[i] = true;
        type3Count++;
      }

      const result = calculateEnneagram(answers);

      expect(result.mainType).toBe(4);
      expect(result.wingType).toBe(5); // 侧翼应该是5（得分更高）
      expect(result.wingCombinationName).toBe('放浪诗人'); // 4w5
    });

    test('类型9的侧翼应该正确处理循环（9和1相邻）', () => {
      const answers = new Array(144).fill(false);
      // 类型9全部选是
      for (let i = 8; i < 144; i += 9) {
        answers[i] = true;
      }
      // 类型1部分选是（8道）
      let type1Count = 0;
      for (let i = 0; i < 144 && type1Count < 8; i += 9) {
        answers[i] = true;
        type1Count++;
      }
      // 类型8部分选是（4道）
      let type8Count = 0;
      for (let i = 7; i < 144 && type8Count < 4; i += 9) {
        answers[i] = true;
        type8Count++;
      }

      const result = calculateEnneagram(answers);

      expect(result.mainType).toBe(9);
      expect(result.wingType).toBe(1); // 侧翼应该是1
      expect(result.wingCombinationName).toBe('梦想家'); // 9w1
    });

    test('类型1的侧翼应该正确处理循环（1和9相邻）', () => {
      const answers = new Array(144).fill(false);
      // 类型1全部选是
      for (let i = 0; i < 144; i += 9) {
        answers[i] = true;
      }
      // 类型9部分选是（8道）
      let type9Count = 0;
      for (let i = 8; i < 144 && type9Count < 8; i += 9) {
        answers[i] = true;
        type9Count++;
      }
      // 类型2部分选是（4道）
      let type2Count = 0;
      for (let i = 1; i < 144 && type2Count < 4; i += 9) {
        answers[i] = true;
        type2Count++;
      }

      const result = calculateEnneagram(answers);

      expect(result.mainType).toBe(1);
      expect(result.wingType).toBe(9); // 侧翼应该是9
      expect(result.wingCombinationName).toBe('理想主义者'); // 1w9
    });

    test('答案数量不是144应该抛出错误', () => {
      const shortAnswers = new Array(100).fill(true);
      expect(() => calculateEnneagram(shortAnswers)).toThrow('Expected 144 answers');

      const longAnswers = new Array(200).fill(true);
      expect(() => calculateEnneagram(longAnswers)).toThrow('Expected 144 answers');
    });
  });

  describe('ENNEAGRAM_TYPE_NAMES - 类型名称', () => {
    test('应该包含9种类型名称', () => {
      expect(Object.keys(ENNEAGRAM_TYPE_NAMES).length).toBe(9);
    });

    test('类型名称应该正确', () => {
      expect(ENNEAGRAM_TYPE_NAMES[1]).toBe('完美型');
      expect(ENNEAGRAM_TYPE_NAMES[2]).toBe('助人型');
      expect(ENNEAGRAM_TYPE_NAMES[3]).toBe('成就型');
      expect(ENNEAGRAM_TYPE_NAMES[4]).toBe('自我型');
      expect(ENNEAGRAM_TYPE_NAMES[5]).toBe('理智型');
      expect(ENNEAGRAM_TYPE_NAMES[6]).toBe('忠诚型');
      expect(ENNEAGRAM_TYPE_NAMES[7]).toBe('活跃型');
      expect(ENNEAGRAM_TYPE_NAMES[8]).toBe('领袖型');
      expect(ENNEAGRAM_TYPE_NAMES[9]).toBe('和平型');
    });
  });

  describe('ENNEAGRAM_TYPE_ENGLISH_NAMES - 英文名称', () => {
    test('英文名称应该正确', () => {
      expect(ENNEAGRAM_TYPE_ENGLISH_NAMES[1]).toBe('The Reformer');
      expect(ENNEAGRAM_TYPE_ENGLISH_NAMES[4]).toBe('The Individualist');
      expect(ENNEAGRAM_TYPE_ENGLISH_NAMES[9]).toBe('The Peacemaker');
    });
  });

  describe('WING_NAMES - 侧翼名称', () => {
    test('应该包含18种侧翼组合', () => {
      expect(Object.keys(WING_NAMES).length).toBe(18);
    });

    test('侧翼名称应该正确', () => {
      expect(WING_NAMES['4w5']).toBe('放浪诗人');
      expect(WING_NAMES['9w1']).toBe('梦想家');
      expect(WING_NAMES['1w9']).toBe('理想主义者');
    });
  });

  describe('getTypeDescription - 获取类型描述', () => {
    test('应该返回正确的类型描述', () => {
      const type4Description = getTypeDescription(4);

      expect(type4Description).not.toBeNull();
      expect(type4Description!.brief).toContain('敏感');
      expect(type4Description!.coreDesire).toContain('独特');
      expect(type4Description!.coreFear).toContain('身份认同');
      expect(type4Description!.strengths).toContain('创造力强');
      expect(type4Description!.weaknesses).toContain('情绪化');
      expect(type4Description!.growthDirection).toBe(1);
      expect(type4Description!.stressDirection).toBe(2);
    });

    test('无效类型应该返回null', () => {
      const invalidDescription = getTypeDescription(0);
      expect(invalidDescription).toBeNull();

      const invalidDescription2 = getTypeDescription(10);
      expect(invalidDescription2).toBeNull();
    });
  });

  describe('generateEnneagramReport - 生成报告', () => {
    test('应该生成完整的报告数据', () => {
      const answers = new Array(144).fill(false);
      // 类型4全部选是
      for (let i = 3; i < 144; i += 9) {
        answers[i] = true;
      }

      const result = calculateEnneagram(answers);
      const report = generateEnneagramReport(result);

      expect(report.mainType.number).toBe(4);
      expect(report.mainType.name).toBe('自我型');
      expect(report.mainType.englishName).toBe('The Individualist');
      expect(report.mainType.description).toBeDefined();
      expect(report.mainType.description.brief).toBeDefined();

      expect(report.wing.number).toBeDefined();
      expect(report.wing.name).toBeDefined();

      expect(report.scores).toHaveLength(9);
      expect(report.radarData).toHaveLength(9);

      // 验证雷达图数据格式
      expect(report.radarData[0]).toHaveProperty('type');
      expect(report.radarData[0]).toHaveProperty('score');
      expect(report.radarData[0]).toHaveProperty('fullMark', 16);
    });
  });

  describe('ENNEAGRAM_TYPE_DESCRIPTIONS - 类型详细描述', () => {
    test('每种类型都应该有完整的描述', () => {
      for (let type = 1; type <= 9; type++) {
        const desc = ENNEAGRAM_TYPE_DESCRIPTIONS[type];

        expect(desc).toBeDefined();
        expect(desc.brief).toBeDefined();
        expect(desc.coreDesire).toBeDefined();
        expect(desc.coreFear).toBeDefined();
        expect(desc.coreMotivation).toBeDefined();
        expect(desc.strengths).toBeInstanceOf(Array);
        expect(desc.strengths.length).toBeGreaterThan(0);
        expect(desc.weaknesses).toBeInstanceOf(Array);
        expect(desc.weaknesses.length).toBeGreaterThan(0);
        expect(desc.growthDirection).toBeGreaterThanOrEqual(1);
        expect(desc.growthDirection).toBeLessThanOrEqual(9);
        expect(desc.stressDirection).toBeGreaterThanOrEqual(1);
        expect(desc.stressDirection).toBeLessThanOrEqual(9);
        expect(desc.healthyTraits).toBeInstanceOf(Array);
        expect(desc.unhealthyTraits).toBeInstanceOf(Array);
        expect(desc.famousPeople).toBeInstanceOf(Array);
        expect(desc.career).toBeInstanceOf(Array);
        expect(desc.relationship).toBeDefined();
      }
    });
  });
});
