// 曲线数据点（免费版）
export interface ChartPoint {
  age: number;
  score: number;
  daYun: string;      // 大运干支
  ganZhi: string;     // 流年干支
  reason: string;     // 20-30字描述
}

// K线数据点（付费版）
export interface KLinePoint {
  age: number;
  year: number;
  daYun: string;
  ganZhi: string;
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string;
}

export interface HighlightYear {
  age: number;
  year: number;
  title: string;
  description: string;
  type?: string;
  score?: number;
  ganZhi?: string;
  advice?: string;
}

export interface WarningYear {
  age: number;
  year: number;
  title: string;
  description: string;
  advice: string;
  type?: string;
  score?: number;
  ganZhi?: string;
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

// 日主分析
export interface DayMaster {
  stem: string;           // 天干
  element: string;        // 五行
  strength: string;       // 身旺/身弱/中和
  description: string;    // 描述
}

// 五行统计
export interface FiveElements {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

// 开运信息
export interface LuckyInfo {
  direction: string;      // 吉利方位
  color: string;          // 幸运颜色
  number: string;         // 幸运数字
  industry: string;       // 适合行业
  partner?: string;       // 适合合作
}

// 免费版结果
export interface FreeVersionResult {
  baziChart: BaziChart;
  // 各维度分析和评分
  summary: string;
  summaryScore: number;
  personality: string;
  personalityScore: number;
  career: string;
  careerScore: number;
  wealth: string;
  wealthScore: number;
  marriage: string;
  marriageScore: number;
  health: string;
  healthScore: number;
  fengShui: string;
  fengShuiScore: number;
  family: string;
  familyScore: number;
  // 日主和用神
  dayMaster: DayMaster;
  usefulGod: string;
  // 五行和开运
  fiveElements: FiveElements;
  luckyInfo: LuckyInfo;
  // 曲线数据
  chartPoints: ChartPoint[];
  // 高光和警示
  highlights: HighlightYear[];
  warnings: WarningYear[];
  // 当前阶段
  currentPhase: 'rising' | 'peak' | 'stable' | 'declining' | 'valley';
}

// 大运信息
export interface DaYunInfo {
  startAge: number;
  endAge: number;
  ganZhi: string;
  description: string;
}

// 十神分析
export interface TenGods {
  正官?: string;
  七杀?: string;
  正印?: string;
  偏印?: string;
  比肩?: string;
  劫财?: string;
  食神?: string;
  伤官?: string;
  正财?: string;
  偏财?: string;
}

// 流年运势
export interface YearlyFortune {
  year: number;
  ganZhi: string;
  score: number;
  overview: string;
  career?: string;
  wealth?: string;
  love?: string;
  health?: string;
  advice?: string;
}

// 付费版结果
export interface PaidVersionResult {
  baziChart: BaziChart;
  // 各维度详细分析和评分
  summary: string;
  summaryScore: number;
  personality: string;
  personalityScore: number;
  career: string;
  careerScore: number;
  wealth: string;
  wealthScore: number;
  marriage: string;
  marriageScore: number;
  health: string;
  healthScore: number;
  fengShui: string;
  fengShuiScore: number;
  family: string;
  familyScore: number;
  // 日主和用神
  dayMaster: DayMaster;
  usefulGod: string;
  tenGods?: TenGods;
  // 五行和开运
  fiveElements: FiveElements;
  luckyInfo: LuckyInfo;
  // 大运列表
  daYunList: DaYunInfo[];
  // K线数据
  chartPoints: KLinePoint[];
  // 高光和警示
  highlights: HighlightYear[];
  warnings: WarningYear[];
  // 流年运势
  yearlyFortune?: {
    thisYear: YearlyFortune;
    nextYear?: YearlyFortune;
  };
  // 当前阶段
  currentPhase: 'rising' | 'peak' | 'stable' | 'declining' | 'valley';
}

export type Gender = 'male' | 'female';
export type CalendarType = 'solar' | 'lunar';

export interface BirthInfo {
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  name?: string;
  calendarType?: CalendarType;
  birthPlace?: string;
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
  rising: '上升期',
  peak: '巅峰期',
  stable: '平稳期',
  declining: '调整期',
  valley: '蓄势期',
};

export const TYPE_LABELS: Record<string, string> = {
  career: '事业',
  wealth: '财运',
  love: '姻缘',
  health: '健康',
  family: '家庭',
  general: '综合',
};

export const TYPE_ICONS: Record<string, string> = {
  career: '💼',
  wealth: '💰',
  love: '💕',
  health: '🏥',
  family: '👨‍👩‍👧',
  general: '✨',
};

// 分析模块
export const ANALYSIS_MODULES = [
  { id: 'bazi', name: '八字排盘', icon: '🔮' },
  { id: 'daymaster', name: '日主分析', icon: '☯️' },
  { id: 'personality', name: '性格解读', icon: '🎭' },
  { id: 'career', name: '事业财运', icon: '💼' },
  { id: 'marriage', name: '婚姻感情', icon: '💕' },
  { id: 'health', name: '健康运势', icon: '🏥' },
  { id: 'fortune', name: '人生曲线', icon: '📈' },
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
