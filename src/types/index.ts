export interface KLinePoint {
  age: number;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KLinePointDetailed {
  age: number;
  year: number;
  open: number;
  close: number;
  high: number;
  low: number;
  trend: 'up' | 'down' | 'stable';
}

export interface HighlightYear {
  age: number;
  year: number;
  score: number;
  type: 'career' | 'wealth' | 'love' | 'health' | 'general';
  title: string;
  description: string;
}

export interface WarningYear {
  age: number;
  year: number;
  score: number;
  type: 'career' | 'wealth' | 'love' | 'health' | 'general';
  title: string;
  description: string;
  advice: string;
}

// 八字四柱
export interface BaziPillar {
  heavenlyStem: string;  // 天干
  earthlyBranch: string; // 地支
  fullName: string;      // 完整名称如"甲子"
}

export interface BaziChart {
  yearPillar: BaziPillar;   // 年柱
  monthPillar: BaziPillar;  // 月柱
  dayPillar: BaziPillar;    // 日柱
  hourPillar: BaziPillar;   // 时柱
  zodiac: string;           // 生肖
  lunarDate: string;        // 农历日期
  solarTime: string;        // 真太阳时
}

export interface DayMasterAnalysis {
  dayMaster: string;      // 日主如"甲木"
  strength: string;       // 身旺/身弱
  description: string;    // 详细描述
}

export interface FiveElements {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface FreeVersionResult {
  baziChart: BaziChart;
  klineData: KLinePoint[];
  currentPhase: 'rising' | 'peak' | 'stable' | 'declining' | 'valley';
  highlightCount: number;
  warningCount: number;
  briefSummary: string;
  coreAnalysis: string;
  dayMasterAnalysis?: DayMasterAnalysis;
  fiveElements?: FiveElements;
  luckyDirection?: string;
  luckyColor?: string;
  luckyNumber?: string;
  personality?: string;
  careerHint?: string;
  wealthHint?: string;
}

export interface PaidVersionResult {
  baziChart: BaziChart;
  klineData: KLinePointDetailed[];
  highlights: HighlightYear[];
  warnings: WarningYear[];
  currentPhase: 'rising' | 'peak' | 'stable' | 'declining' | 'valley';
  summary: {
    personality: string;
    career: string;
    wealth: string;
    love: string;
    health: string;
  };
  luckyElements: string[];
  unluckyElements: string[];
}

export type Gender = 'male' | 'female';
export type CalendarType = 'solar' | 'lunar';

export interface BirthInfo {
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour: number;          // 改为数字 0-23
  minute: number;        // 分钟 0-59
  name?: string;
  calendarType?: CalendarType;
  birthPlace?: string;   // 出生地
}

export interface StoredResult {
  id: string;
  birthInfo: BirthInfo;
  freeResult?: FreeVersionResult;
  paidResult?: PaidVersionResult;
  isPaid: boolean;
  createdAt: number;
}

export type PhaseType = 'rising' | 'peak' | 'stable' | 'declining' | 'valley';

export const PHASE_LABELS: Record<PhaseType, string> = {
  rising: '上升之运',
  peak: '巅峰之运',
  stable: '平稳之运',
  declining: '下降之运',
  valley: '低谷之运',
};

export const TYPE_LABELS: Record<string, string> = {
  career: '事业',
  wealth: '财运',
  love: '姻缘',
  health: '健康',
  general: '综合',
};

export const TYPE_ICONS: Record<string, string> = {
  career: '📈',
  wealth: '💰',
  love: '💕',
  health: '🏥',
  general: '✨',
};

// 分析模块
export const ANALYSIS_MODULES = [
  { id: 'core_bazi', name: '核心命理', icon: '🔮' },
  { id: 'life_kline', name: '人生K线', icon: '📈' },
  { id: 'career_wealth', name: '事业财富', icon: '💰' },
  { id: 'marriage', name: '婚姻人际', icon: '💕' },
  { id: 'health', name: '健康外貌', icon: '🏥' },
  { id: 'fortune', name: '运势预测', icon: '⭐' },
];

// 中国主要城市
export const CHINA_CITIES = [
  '北京市', '上海市', '广州市', '深圳市', '杭州市',
  '南京市', '武汉市', '成都市', '重庆市', '西安市',
  '天津市', '苏州市', '郑州市', '长沙市', '青岛市',
  '沈阳市', '大连市', '厦门市', '福州市', '济南市',
  '昆明市', '贵阳市', '南昌市', '合肥市', '石家庄市',
  '哈尔滨市', '长春市', '太原市', '南宁市', '海口市',
  '兰州市', '银川市', '西宁市', '呼和浩特市', '乌鲁木齐市',
  '拉萨市', '香港', '澳门', '台北市',
];

export const HOUR_OPTIONS = [
  { value: 'zi', label: '子时 (23:00-01:00)' },
  { value: 'chou', label: '丑时 (01:00-03:00)' },
  { value: 'yin', label: '寅时 (03:00-05:00)' },
  { value: 'mao', label: '卯时 (05:00-07:00)' },
  { value: 'chen', label: '辰时 (07:00-09:00)' },
  { value: 'si', label: '巳时 (09:00-11:00)' },
  { value: 'wu', label: '午时 (11:00-13:00)' },
  { value: 'wei', label: '未时 (13:00-15:00)' },
  { value: 'shen', label: '申时 (15:00-17:00)' },
  { value: 'you', label: '酉时 (17:00-19:00)' },
  { value: 'xu', label: '戌时 (19:00-21:00)' },
  { value: 'hai', label: '亥时 (21:00-23:00)' },
  { value: 'unknown', label: '不详' },
];

export const HOUR_LABELS: Record<string, string> = {
  zi: '子时',
  chou: '丑时',
  yin: '寅时',
  mao: '卯时',
  chen: '辰时',
  si: '巳时',
  wu: '午时',
  wei: '未时',
  shen: '申时',
  you: '酉时',
  xu: '戌时',
  hai: '亥时',
  unknown: '不详',
};

// 根据小时获取时辰
export function getShichenFromHour(hour: number): string {
  if (hour === 23 || hour === 0) return '子时';
  if (hour >= 1 && hour < 3) return '丑时';
  if (hour >= 3 && hour < 5) return '寅时';
  if (hour >= 5 && hour < 7) return '卯时';
  if (hour >= 7 && hour < 9) return '辰时';
  if (hour >= 9 && hour < 11) return '巳时';
  if (hour >= 11 && hour < 13) return '午时';
  if (hour >= 13 && hour < 15) return '未时';
  if (hour >= 15 && hour < 17) return '申时';
  if (hour >= 17 && hour < 19) return '酉时';
  if (hour >= 19 && hour < 21) return '戌时';
  if (hour >= 21 && hour < 23) return '亥时';
  return '不详';
}
