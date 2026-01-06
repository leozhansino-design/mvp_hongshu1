import { calculateBazi, calculateDaYun, countFiveElements, formatShiChen } from '@/lib/bazi';

describe('八字计算测试', () => {
  // 测试用例：1996年5月7日申时（15:00-17:00）
  const testCase = {
    year: 1996,
    month: 5,
    day: 7,
    hour: 15,
    minute: 0,
    isLunar: false,
  };

  describe('calculateBazi - 八字排盘', () => {
    test('应正确计算公历日期的八字', () => {
      const result = calculateBazi(
        testCase.year,
        testCase.month,
        testCase.day,
        testCase.hour,
        testCase.minute,
        testCase.isLunar
      );

      expect(result).not.toBeNull();
      expect(result!.chart).toBeDefined();

      // 验证四柱存在
      expect(result!.chart.yearPillar).toBeDefined();
      expect(result!.chart.monthPillar).toBeDefined();
      expect(result!.chart.dayPillar).toBeDefined();
      expect(result!.chart.hourPillar).toBeDefined();

      // 验证四柱格式正确
      expect(result!.chart.yearPillar.fullName.length).toBe(2);
      expect(result!.chart.monthPillar.fullName.length).toBe(2);
      expect(result!.chart.dayPillar.fullName.length).toBe(2);
      expect(result!.chart.hourPillar.fullName.length).toBe(2);
    });

    test('1996年5月7日申时的八字应该是丙子年癸巳月甲辰日壬申时', () => {
      const result = calculateBazi(1996, 5, 7, 15, 0, false);

      expect(result).not.toBeNull();
      // 年柱：丙子
      expect(result!.chart.yearPillar.fullName).toBe('丙子');
      // 月柱：癸巳
      expect(result!.chart.monthPillar.fullName).toBe('癸巳');
      // 日柱：甲辰
      expect(result!.chart.dayPillar.fullName).toBe('甲辰');
      // 时柱：壬申
      expect(result!.chart.hourPillar.fullName).toBe('壬申');
    });

    test('应正确判断生肖', () => {
      const result = calculateBazi(1996, 5, 7, 15, 0, false);
      expect(result!.chart.zodiac).toBe('鼠');
    });

    test('农历日期转换应正确', () => {
      // 测试农历模式
      const result = calculateBazi(1996, 3, 20, 15, 0, true); // 农历三月二十
      expect(result).not.toBeNull();
      expect(result!.lunar).toBeDefined();
    });

    test('无效日期应返回null', () => {
      // 无效月份
      const result = calculateBazi(1996, 13, 7, 15, 0, false);
      expect(result).toBeNull();
    });
  });

  describe('calculateDaYun - 大运计算', () => {
    test('应正确计算男命大运', () => {
      const result = calculateDaYun(1996, 5, 7, 15, 0, 'male', false);

      expect(result).not.toBeNull();
      expect(result!.daYunList).toBeDefined();
      expect(result!.daYunList.length).toBeGreaterThan(0);

      // 验证大运结构
      const firstDaYun = result!.daYunList[0];
      expect(firstDaYun.ganZhi).toBeDefined();
      expect(firstDaYun.startAge).toBeDefined();
      expect(firstDaYun.endAge).toBeDefined();
    });

    test('应正确计算女命大运', () => {
      const result = calculateDaYun(1996, 5, 7, 15, 0, 'female', false);

      expect(result).not.toBeNull();
      expect(result!.daYunList.length).toBeGreaterThan(0);
    });

    test('男命和女命大运方向应不同', () => {
      const maleResult = calculateDaYun(1996, 5, 7, 15, 0, 'male', false);
      const femaleResult = calculateDaYun(1996, 5, 7, 15, 0, 'female', false);

      expect(maleResult).not.toBeNull();
      expect(femaleResult).not.toBeNull();

      // 大运列表应该不完全相同（因为顺逆不同）
      const maleDaYunNames = maleResult!.daYunList.map(d => d.ganZhi);
      const femaleDaYunNames = femaleResult!.daYunList.map(d => d.ganZhi);

      // 至少有些大运应该不同
      expect(maleDaYunNames).not.toEqual(femaleDaYunNames);
    });

    test('大运年龄应该连续且递增', () => {
      const result = calculateDaYun(1996, 5, 7, 15, 0, 'male', false);

      expect(result).not.toBeNull();

      for (let i = 1; i < result!.daYunList.length; i++) {
        const prev = result!.daYunList[i - 1];
        const curr = result!.daYunList[i];
        // 当前大运的开始年龄应该等于或大于上一个大运的结束年龄
        expect(curr.startAge).toBeGreaterThanOrEqual(prev.endAge);
      }
    });
  });

  describe('countFiveElements - 五行统计', () => {
    test('应正确统计五行数量', () => {
      const bazi = calculateBazi(1996, 5, 7, 15, 0, false);
      expect(bazi).not.toBeNull();

      const fiveElements = countFiveElements(bazi!);

      // 验证五行都存在
      expect(fiveElements['木']).toBeDefined();
      expect(fiveElements['火']).toBeDefined();
      expect(fiveElements['土']).toBeDefined();
      expect(fiveElements['金']).toBeDefined();
      expect(fiveElements['水']).toBeDefined();

      // 五行总数应该是8（四柱八个字）
      const total = Object.values(fiveElements).reduce((a, b) => a + b, 0);
      expect(total).toBe(8);
    });
  });

  describe('formatShiChen - 时辰格式化', () => {
    test('应正确格式化各时辰', () => {
      expect(formatShiChen(0)).toContain('子时');
      expect(formatShiChen(23)).toContain('子时');
      expect(formatShiChen(3)).toContain('寅时');
      expect(formatShiChen(12)).toContain('午时');
      expect(formatShiChen(15)).toContain('申时');
      expect(formatShiChen(21)).toContain('亥时');
    });
  });

  describe('稳定性测试 - 相同输入应得到相同输出', () => {
    test('多次调用相同参数应返回相同结果', () => {
      const result1 = calculateBazi(1996, 5, 7, 15, 0, false);
      const result2 = calculateBazi(1996, 5, 7, 15, 0, false);

      expect(result1!.chart.yearPillar.fullName).toBe(result2!.chart.yearPillar.fullName);
      expect(result1!.chart.monthPillar.fullName).toBe(result2!.chart.monthPillar.fullName);
      expect(result1!.chart.dayPillar.fullName).toBe(result2!.chart.dayPillar.fullName);
      expect(result1!.chart.hourPillar.fullName).toBe(result2!.chart.hourPillar.fullName);
    });
  });
});
