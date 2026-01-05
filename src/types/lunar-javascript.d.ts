declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    static fromDate(date: Date): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toYmd(): string;
    toYmdHms(): string;
    toFullString(): string;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromDate(date: Date): Lunar;
    getSolar(): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    getEightChar(): EightChar;
    toFullString(): string;
  }

  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getTimeWuXing(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenGan(): string;
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
    getYun(gender: number): Yun;
  }

  export class Yun {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartSolar(): Solar;
    getDaYun(): DaYun[];
  }

  export class DaYun {
    getIndex(): number;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getGanZhi(): string;
    getLunar(): Lunar;
    getLiuNian(): LiuNian[];
    getXiaoYun(): XiaoYun[];
  }

  export class LiuNian {
    getIndex(): number;
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
    getLunar(): Lunar;
  }

  export class XiaoYun {
    getIndex(): number;
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
  }
}
