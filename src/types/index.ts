// 曲线数据点（免费版）
export interface ChartPoint {
  age: number;
  score: number;
  daYun: string;      // 大运干支
  ganZhi: string;     // 流年干支
  reason: string;     // 20-30字描述
}

// 付费版数据点（简化版，只需score）
export interface PaidChartPoint {
  age: number;
  year: number;
  daYun: string;
  ganZhi: string;
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
  elementAnalysis?: string; // 五行相克分析
  luckyInfo: LuckyInfo;
  luckyExplanation?: string; // 开运指南详解
  highlightMoment?: { age: number; title: string; description: string }; // 人生高光时刻
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
  elementAnalysis?: string; // 五行相克分析
  luckyInfo: LuckyInfo;
  luckyExplanation?: string; // 开运指南详解
  highlightMoment?: { age: number; title: string; description: string }; // 人生高光时刻
  // 大运列表
  daYunList: DaYunInfo[];
  // 曲线数据（简化版）
  chartPoints: PaidChartPoint[];
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

// 分析模块（8维详批）
export const ANALYSIS_MODULES = [
  { id: 'summary', name: '命理总评', icon: '○' },
  { id: 'personality', name: '性格解读', icon: '○' },
  { id: 'career', name: '事业运势', icon: '○' },
  { id: 'wealth', name: '财运分析', icon: '○' },
  { id: 'marriage', name: '婚姻感情', icon: '○' },
  { id: 'health', name: '健康运势', icon: '○' },
  { id: 'fengShui', name: '风水开运', icon: '○' },
  { id: 'family', name: '六亲关系', icon: '○' },
];

// 中国主要城市（按省份分组）
export const CHINA_CITIES = [
  // 直辖市
  '北京市', '上海市', '天津市', '重庆市',
  // 广东省
  '广州市', '深圳市', '东莞市', '佛山市', '珠海市', '惠州市', '中山市', '汕头市', '江门市', '湛江市', '肇庆市', '茂名市', '揭阳市', '梅州市', '清远市', '阳江市', '韶关市', '河源市', '云浮市', '汕尾市', '潮州市',
  // 江苏省
  '南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市', '扬州市', '盐城市', '泰州市', '镇江市', '淮安市', '连云港市', '宿迁市',
  // 浙江省
  '杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市', '金华市', '台州市', '湖州市', '丽水市', '衢州市', '舟山市',
  // 山东省
  '济南市', '青岛市', '烟台市', '潍坊市', '临沂市', '淄博市', '济宁市', '泰安市', '威海市', '日照市', '德州市', '聊城市', '滨州市', '菏泽市', '枣庄市', '东营市',
  // 河南省
  '郑州市', '洛阳市', '开封市', '南阳市', '新乡市', '安阳市', '许昌市', '商丘市', '信阳市', '周口市', '驻马店市', '平顶山市', '焦作市', '濮阳市', '漯河市', '三门峡市', '鹤壁市',
  // 四川省
  '成都市', '绵阳市', '德阳市', '南充市', '宜宾市', '自贡市', '乐山市', '泸州市', '达州市', '内江市', '遂宁市', '攀枝花市', '眉山市', '广安市', '资阳市', '广元市', '雅安市', '巴中市',
  // 湖北省
  '武汉市', '宜昌市', '襄阳市', '荆州市', '黄冈市', '十堰市', '孝感市', '荆门市', '咸宁市', '鄂州市', '随州市', '黄石市', '恩施市',
  // 湖南省
  '长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '郴州市', '娄底市', '邵阳市', '益阳市', '永州市', '怀化市', '张家界市', '湘西州',
  // 福建省
  '福州市', '厦门市', '泉州市', '漳州市', '莆田市', '宁德市', '三明市', '南平市', '龙岩市',
  // 安徽省
  '合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '阜阳市', '宿州市', '滁州市', '六安市', '宣城市', '池州市', '亳州市',
  // 江西省
  '南昌市', '赣州市', '九江市', '宜春市', '吉安市', '上饶市', '抚州市', '景德镇市', '萍乡市', '新余市', '鹰潭市',
  // 河北省
  '石家庄市', '唐山市', '保定市', '廊坊市', '邯郸市', '沧州市', '秦皇岛市', '张家口市', '邢台市', '承德市', '衡水市',
  // 辽宁省
  '沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市',
  // 陕西省
  '西安市', '咸阳市', '宝鸡市', '渭南市', '汉中市', '安康市', '榆林市', '延安市', '商洛市', '铜川市',
  // 山西省
  '太原市', '大同市', '运城市', '长治市', '晋城市', '临汾市', '晋中市', '吕梁市', '忻州市', '阳泉市', '朔州市',
  // 云南省
  '昆明市', '曲靖市', '大理市', '玉溪市', '昭通市', '保山市', '丽江市', '普洱市', '临沧市', '红河州', '文山州', '西双版纳州',
  // 贵州省
  '贵阳市', '遵义市', '六盘水市', '安顺市', '毕节市', '铜仁市', '黔南州', '黔东南州', '黔西南州',
  // 广西壮族自治区
  '南宁市', '柳州市', '桂林市', '梧州市', '北海市', '玉林市', '钦州市', '百色市', '贵港市', '河池市', '来宾市', '崇左市', '防城港市', '贺州市',
  // 黑龙江省
  '哈尔滨市', '齐齐哈尔市', '大庆市', '牡丹江市', '佳木斯市', '鸡西市', '双鸭山市', '伊春市', '七台河市', '鹤岗市', '绥化市', '黑河市',
  // 吉林省
  '长春市', '吉林市', '四平市', '通化市', '白城市', '辽源市', '松原市', '白山市', '延边州',
  // 甘肃省
  '兰州市', '天水市', '白银市', '庆阳市', '平凉市', '酒泉市', '张掖市', '武威市', '定西市', '陇南市', '嘉峪关市', '金昌市',
  // 内蒙古自治区
  '呼和浩特市', '包头市', '鄂尔多斯市', '赤峰市', '通辽市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '乌海市',
  // 宁夏回族自治区
  '银川市', '吴忠市', '石嘴山市', '固原市', '中卫市',
  // 青海省
  '西宁市', '海东市', '海西州', '海北州', '海南州', '黄南州', '果洛州', '玉树州',
  // 新疆维吾尔自治区
  '乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '阿克苏市', '喀什市', '和田市', '伊宁市', '塔城市', '阿勒泰市', '库尔勒市', '昌吉市', '博乐市', '阿图什市',
  // 西藏自治区
  '拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区',
  // 海南省
  '海口市', '三亚市', '三沙市', '儋州市', '琼海市', '文昌市', '万宁市', '东方市',
  // 港澳台
  '香港', '澳门', '台北市', '高雄市', '台中市', '台南市', '新北市', '桃园市',
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

// ========== 财富曲线相关类型 ==========

// 财富数据点
export interface WealthDataPoint {
  age: number;      // 18-80
  wealth: number;   // 累计财富（万元）
}

// 财富高光时刻
export interface WealthHighlights {
  peakAge: number;           // 财富巅峰年龄
  peakWealth: number;        // 财富巅峰金额
  maxGrowthAge: number;      // 最大年增长年龄
  maxGrowthAmount: number;   // 最大年增长金额
  maxLossAge: number;        // 最大年回撤年龄
  maxLossAmount: number;     // 最大年回撤金额
}

// 财富范围
export interface WealthRange {
  min: number;
  max: number;
  unit: string;
}

// 财富分析
export interface WealthAnalysis {
  summary: string;      // 总结
  earlyYears: string;   // 18-30岁分析
  middleYears: string;  // 30-50岁分析
  lateYears: string;    // 50岁后分析
  advice: string;       // 理财建议
}

// 财富类型
export type WealthType =
  | '早期暴富型'
  | '大器晚成型'
  | '稳步上升型'
  | '过山车型'
  | '平稳一生型'
  | '先扬后抑型';

// 财富类型描述
export const WEALTH_TYPE_DESCRIPTIONS: Record<WealthType, string> = {
  '早期暴富型': '年轻时就到达巅峰，25-35岁到顶，之后平稳或下降',
  '大器晚成型': '前半生积累，后半生收获，前30年平缓，45岁后起飞',
  '稳步上升型': '细水长流，一直缓慢上升',
  '过山车型': '大起大落，多个峰值和谷值',
  '平稳一生型': '没有大起大落，整体平缓，小幅波动',
  '先扬后抑型': '前期辉煌，后期消耗，中年到顶，之后下降',
};

// 财富曲线完整数据
export interface WealthCurveData {
  wealthRange: WealthRange;
  wealthType: WealthType;
  highlights: WealthHighlights;
  dataPoints: WealthDataPoint[];
  analysis: WealthAnalysis;
}

// 财富曲线结果（免费版）
export interface FreeWealthResult {
  baziChart: BaziChart;
  wealthCurve: WealthCurveData;
  // 免费版只有10个数据点
}

// 财富曲线结果（付费版）
export interface PaidWealthResult {
  baziChart: BaziChart;
  wealthCurve: WealthCurveData;
  // 付费版有62个数据点（18-80岁每年一个）
}

// 曲线模式类型
export type CurveMode = 'life' | 'wealth';

// 曲线模式标签
export const CURVE_MODE_LABELS: Record<CurveMode, string> = {
  life: '人生曲线',
  wealth: '财富曲线',
};
