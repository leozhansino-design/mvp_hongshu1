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

// 藏干表 - 每个地支中隐藏的天干（本气、中气、余气）
const CANG_GAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

// 十神对应表 - 根据日主和另一个天干的五行生克关系
// 同我者为比劫，生我者为印，我生者为食伤，克我者为官杀，我克者为财
const TEN_GODS_MAP: Record<string, Record<string, string>> = {
  // 甲木日主
  '甲': {
    '甲': '比肩', '乙': '劫财',
    '丙': '食神', '丁': '伤官',
    '戊': '偏财', '己': '正财',
    '庚': '七杀', '辛': '正官',
    '壬': '偏印', '癸': '正印',
  },
  // 乙木日主
  '乙': {
    '甲': '劫财', '乙': '比肩',
    '丙': '伤官', '丁': '食神',
    '戊': '正财', '己': '偏财',
    '庚': '正官', '辛': '七杀',
    '壬': '正印', '癸': '偏印',
  },
  // 丙火日主
  '丙': {
    '甲': '偏印', '乙': '正印',
    '丙': '比肩', '丁': '劫财',
    '戊': '食神', '己': '伤官',
    '庚': '偏财', '辛': '正财',
    '壬': '七杀', '癸': '正官',
  },
  // 丁火日主
  '丁': {
    '甲': '正印', '乙': '偏印',
    '丙': '劫财', '丁': '比肩',
    '戊': '伤官', '己': '食神',
    '庚': '正财', '辛': '偏财',
    '壬': '正官', '癸': '七杀',
  },
  // 戊土日主
  '戊': {
    '甲': '七杀', '乙': '正官',
    '丙': '偏印', '丁': '正印',
    '戊': '比肩', '己': '劫财',
    '庚': '食神', '辛': '伤官',
    '壬': '偏财', '癸': '正财',
  },
  // 己土日主
  '己': {
    '甲': '正官', '乙': '七杀',
    '丙': '正印', '丁': '偏印',
    '戊': '劫财', '己': '比肩',
    '庚': '伤官', '辛': '食神',
    '壬': '正财', '癸': '偏财',
  },
  // 庚金日主
  '庚': {
    '甲': '偏财', '乙': '正财',
    '丙': '七杀', '丁': '正官',
    '戊': '偏印', '己': '正印',
    '庚': '比肩', '辛': '劫财',
    '壬': '食神', '癸': '伤官',
  },
  // 辛金日主
  '辛': {
    '甲': '正财', '乙': '偏财',
    '丙': '正官', '丁': '七杀',
    '戊': '正印', '己': '偏印',
    '庚': '劫财', '辛': '比肩',
    '壬': '伤官', '癸': '食神',
  },
  // 壬水日主
  '壬': {
    '甲': '食神', '乙': '伤官',
    '丙': '偏财', '丁': '正财',
    '戊': '七杀', '己': '正官',
    '庚': '偏印', '辛': '正印',
    '壬': '比肩', '癸': '劫财',
  },
  // 癸水日主
  '癸': {
    '甲': '伤官', '乙': '食神',
    '丙': '正财', '丁': '偏财',
    '戊': '正官', '己': '七杀',
    '庚': '正印', '辛': '偏印',
    '壬': '劫财', '癸': '比肩',
  },
};

// 纳音表 - 六十甲子纳音
const NA_YIN_MAP: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水',
  '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '砂石金', '乙未': '砂石金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水',
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

// 藏干详细信息
export interface CangGanInfo {
  gan: string;      // 天干
  wuXing: string;   // 五行
  shiShen: string;  // 十神
}

// 柱的详细信息
export interface PillarDetail {
  gan: string;           // 天干
  zhi: string;           // 地支
  ganWuXing: string;     // 天干五行
  zhiWuXing: string;     // 地支五行
  ganShen: string;       // 干神（天干十神）
  cangGan: CangGanInfo[]; // 藏干信息
  naYin: string;         // 纳音
}

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
  // 新增：详细的四柱信息
  pillarsDetail: {
    year: PillarDetail;
    month: PillarDetail;
    day: PillarDetail;
    hour: PillarDetail;
  };
  dayMaster: string;  // 日主天干
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
 * 获取十神
 */
export function getTenGod(dayMaster: string, targetGan: string): string {
  if (dayMaster === targetGan) return '日主';
  return TEN_GODS_MAP[dayMaster]?.[targetGan] || '';
}

/**
 * 获取藏干详细信息
 */
export function getCangGanDetail(dayMaster: string, zhi: string): CangGanInfo[] {
  const cangGans = CANG_GAN[zhi] || [];
  return cangGans.map(gan => ({
    gan,
    wuXing: GAN_WU_XING[gan] || '',
    shiShen: getTenGod(dayMaster, gan),
  }));
}

/**
 * 获取纳音
 */
export function getNaYin(ganZhi: string): string {
  return NA_YIN_MAP[ganZhi] || '';
}

/**
 * 计算柱的详细信息
 */
function calculatePillarDetail(dayMaster: string, gan: string, zhi: string): PillarDetail {
  const ganZhi = gan + zhi;
  return {
    gan,
    zhi,
    ganWuXing: GAN_WU_XING[gan] || '',
    zhiWuXing: ZHI_WU_XING[zhi] || '',
    ganShen: gan === dayMaster ? '日主' : (TEN_GODS_MAP[dayMaster]?.[gan] || ''),
    cangGan: getCangGanDetail(dayMaster, zhi),
    naYin: NA_YIN_MAP[ganZhi] || '',
  };
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
    let solar: Solar;
    let lunar: Lunar;

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

    // 计算详细的四柱信息
    const pillarsDetail = {
      year: calculatePillarDetail(dayGan, yearGan, yearZhi),
      month: calculatePillarDetail(dayGan, monthGan, monthZhi),
      day: calculatePillarDetail(dayGan, dayGan, dayZhi),
      hour: calculatePillarDetail(dayGan, hourGan, hourZhi),
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
      pillarsDetail,
      dayMaster: dayGan,
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
    let solar: Solar;
    let lunar: Lunar;

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

    // 获取足够覆盖0-90岁的大运（最多12个，每个10年）
    for (let i = 0; i < daYunArr.length && i < 12; i++) {
      const daYun = daYunArr[i];
      const endAge = daYun.getEndAge();
      // 只添加到90岁以内的大运
      if (daYun.getStartAge() <= 90) {
        daYunList.push({
          index: i,
          ganZhi: daYun.getGanZhi(),
          startAge: daYun.getStartAge(),
          endAge: Math.min(endAge, 90),
          startYear: daYun.getStartYear(),
          endYear: daYun.getEndYear(),
        });
      }
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
    let solar: Solar;
    let lunar: Lunar;

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

export { TIAN_GAN, DI_ZHI, SHENG_XIAO, GAN_WU_XING, ZHI_WU_XING, SHI_CHEN_NAME, CANG_GAN, TEN_GODS_MAP, NA_YIN_MAP };
