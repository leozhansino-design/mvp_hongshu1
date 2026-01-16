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

export interface FreeVersionResult {
  klineData: KLinePoint[];
  currentPhase: 'rising' | 'peak' | 'stable' | 'declining' | 'valley';
  highlightCount: number;
  warningCount: number;
  briefSummary: string;
}

export interface PaidVersionResult {
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
  hour: string;
  name?: string;
  calendarType?: CalendarType;
  province?: string;  // 出生省份
  city?: string;      // 出生城市
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
