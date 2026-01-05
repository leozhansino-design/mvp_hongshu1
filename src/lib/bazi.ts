// 八字计算工具 - 使用 lunar-javascript 库
import { Solar, Lunar } from 'lunar-javascript';
import { BaziChart, BaziPillar } from '@/types';

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 生肖
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 天干五行
const GAN_WU_XING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 地支五行
const ZHI_WU_XING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// 时辰对应表
const HOUR_TO_ZHI: Record<number, number> = {
  23: 0, 0: 0,    // 子时
  1: 1, 2: 1,     // 丑时
  3: 2, 4: 2,     // 寅时
  5: 3, 6: 3,     // 卯时
  7: 4, 8: 4,     // 辰时
  9: 5, 10: 5,    // 巳时
  11: 6, 12: 6,   // 午时
  13: 7, 14: 7,   // 未时
  15: 8, 16: 8,   // 申时
  17: 9, 18: 9,   // 酉时
  19: 10, 20: 10, // 戌时
  21: 11, 22: 11, // 亥时
};

// 时辰名称
const SHI_CHEN_NAME: Record<number, string> = {
  0: '子时 (23:00-01:00)',
  1: '丑时 (01:00-03:00)',
  2: '寅时 (03:00-05:00)',
  3: '卯时 (05:00-07:00)',
  4: '辰时 (07:00-09:00)',
  5: '巳时 (09:00-11:00)',
  6: '午时 (11:00-13:00)',
  7: '未时 (13:00-15:00)',
  8: '申时 (15:00-17:00)',
  9: '酉时 (17:00-19:00)',
  10: '戌时 (19:00-21:00)',
  11: '亥时 (21:00-23:00)',
};

export interface BaziResult {
  chart: BaziChart;
  eightChar: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  wuXing: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  naYin: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  dayMasterElement: string;
  lunar: {
    year: number;
    month: number;
    day: number;
    monthCn: string;
    dayCn: string;
    yearGanZhi: string;
  };
}

export interface DaYunItem {
  index: number;
  ganZhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
}

export interface LiuNianItem {
  year: number;
  age: number;
  ganZhi: string;
}

/**
 * 计算八字
 */
export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  isLunar: boolean = false
): BaziResult | null {
  try {
    let solar: typeof Solar;
    let lunar: typeof Lunar;

    if (isLunar) {
      // 农历转公历
      lunar = Lunar.fromYmd(year, month, day);
      solar = lunar.getSolar();
    } else {
      // 公历
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
      lunar = solar.getLunar();
    }

    // 获取八字
    const eightChar = lunar.getEightChar();

    // 四柱
    const yearGan = eightChar.getYearGan();
    const yearZhi = eightChar.getYearZhi();
    const monthGan = eightChar.getMonthGan();
    const monthZhi = eightChar.getMonthZhi();
    const dayGan = eightChar.getDayGan();
    const dayZhi = eightChar.getDayZhi();
    const hourGan = eightChar.getTimeGan();
    const hourZhi = eightChar.getTimeZhi();

    // 构建四柱
    const yearPillar: BaziPillar = {
      heavenlyStem: yearGan,
      earthlyBranch: yearZhi,
      fullName: yearGan + yearZhi,
    };

    const monthPillar: BaziPillar = {
      heavenlyStem: monthGan,
      earthlyBranch: monthZhi,
      fullName: monthGan + monthZhi,
    };

    const dayPillar: BaziPillar = {
      heavenlyStem: dayGan,
      earthlyBranch: dayZhi,
      fullName: dayGan + dayZhi,
    };

    const hourPillar: BaziPillar = {
      heavenlyStem: hourGan,
      earthlyBranch: hourZhi,
      fullName: hourGan + hourZhi,
    };

    // 生肖
    const zhiIndex = DI_ZHI.indexOf(yearZhi);
    const zodiac = SHENG_XIAO[zhiIndex] || '未知';

    // 农历日期
    const lunarMonthCn = lunar.getMonthInChinese();
    const lunarDayCn = lunar.getDayInChinese();

    // 时辰
    const shiChenIndex = HOUR_TO_ZHI[hour] ?? 0;
    const solarTime = SHI_CHEN_NAME[shiChenIndex] || '';

    const chart: BaziChart = {
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar,
      zodiac,
      lunarDate: `${lunar.getYearInChinese()}年${lunarMonthCn}月${lunarDayCn}`,
      solarTime,
    };

    return {
      chart,
      eightChar: {
        year: yearGan + yearZhi,
        month: monthGan + monthZhi,
        day: dayGan + dayZhi,
        hour: hourGan + hourZhi,
      },
      wuXing: {
        year: eightChar.getYearWuXing(),
        month: eightChar.getMonthWuXing(),
        day: eightChar.getDayWuXing(),
        hour: eightChar.getTimeWuXing(),
      },
      naYin: {
        year: eightChar.getYearNaYin(),
        month: eightChar.getMonthNaYin(),
        day: eightChar.getDayNaYin(),
        hour: eightChar.getTimeNaYin(),
      },
      dayMasterElement: GAN_WU_XING[dayGan] || '未知',
      lunar: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        monthCn: lunarMonthCn,
        dayCn: lunarDayCn,
        yearGanZhi: lunar.getYearInGanZhi(),
      },
    };
  } catch (error) {
    console.error('八字计算错误:', error);
    return null;
  }
}

/**
 * 计算大运
 */
export function calculateDaYun(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'male' | 'female',
  isLunar: boolean = false
): { startInfo: string; daYunList: DaYunItem[] } | null {
  try {
    let solar: typeof Solar;
    let lunar: typeof Lunar;

    if (isLunar) {
      lunar = Lunar.fromYmd(year, month, day);
      solar = lunar.getSolar();
    } else {
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
      lunar = solar.getLunar();
    }

    const eightChar = lunar.getEightChar();
    // 1 = 男, 0 = 女
    const genderValue = gender === 'male' ? 1 : 0;
    const yun = eightChar.getYun(genderValue);

    const startYear = yun.getStartYear();
    const startMonth = yun.getStartMonth();
    const startDay = yun.getStartDay();

    const startInfo = `${startYear}年${startMonth}个月${startDay}天后起运`;

    const daYunArr = yun.getDaYun();
    const daYunList: DaYunItem[] = [];

    for (let i = 0; i < daYunArr.length && i < 10; i++) {
      const daYun = daYunArr[i];
      daYunList.push({
        index: i,
        ganZhi: daYun.getGanZhi(),
        startAge: daYun.getStartAge(),
        endAge: daYun.getEndAge(),
        startYear: daYun.getStartYear(),
        endYear: daYun.getEndYear(),
      });
    }

    return { startInfo, daYunList };
  } catch (error) {
    console.error('大运计算错误:', error);
    return null;
  }
}

/**
 * 计算流年
 */
export function calculateLiuNian(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'male' | 'female',
  daYunIndex: number = 1,
  isLunar: boolean = false
): LiuNianItem[] {
  try {
    let solar: typeof Solar;
    let lunar: typeof Lunar;

    if (isLunar) {
      lunar = Lunar.fromYmd(year, month, day);
      solar = lunar.getSolar();
    } else {
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
      lunar = solar.getLunar();
    }

    const eightChar = lunar.getEightChar();
    const genderValue = gender === 'male' ? 1 : 0;
    const yun = eightChar.getYun(genderValue);
    const daYunArr = yun.getDaYun();

    if (daYunIndex >= daYunArr.length) {
      return [];
    }

    const liuNianArr = daYunArr[daYunIndex].getLiuNian();
    const liuNianList: LiuNianItem[] = [];

    for (let i = 0; i < liuNianArr.length; i++) {
      const liuNian = liuNianArr[i];
      liuNianList.push({
        year: liuNian.getYear(),
        age: liuNian.getAge(),
        ganZhi: liuNian.getGanZhi(),
      });
    }

    return liuNianList;
  } catch (error) {
    console.error('流年计算错误:', error);
    return [];
  }
}

/**
 * 获取当前流年
 */
export function getCurrentLiuNian(): string {
  const now = new Date();
  const solar = Solar.fromDate(now);
  const lunar = solar.getLunar();
  return lunar.getYearInGanZhi();
}

/**
 * 获取五行统计
 */
export function countFiveElements(bazi: BaziResult): Record<string, number> {
  const count: Record<string, number> = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0,
  };

  // 从五行信息中统计
  const wuXingStr = `${bazi.wuXing.year}${bazi.wuXing.month}${bazi.wuXing.day}${bazi.wuXing.hour}`;

  for (const char of wuXingStr) {
    if (count[char] !== undefined) {
      count[char]++;
    }
  }

  return count;
}

/**
 * 格式化时辰显示
 */
export function formatShiChen(hour: number): string {
  const shiChenIndex = HOUR_TO_ZHI[hour] ?? 0;
  return SHI_CHEN_NAME[shiChenIndex] || '未知';
}

/**
 * 获取时辰地支
 */
export function getHourZhi(hour: number): string {
  const shiChenIndex = HOUR_TO_ZHI[hour] ?? 0;
  return DI_ZHI[shiChenIndex];
}

export { TIAN_GAN, DI_ZHI, SHENG_XIAO, GAN_WU_XING, ZHI_WU_XING, SHI_CHEN_NAME };
