export const API_CONFIG = {
  baseUrl: 'https://api.bltcy.ai/v1',
  apiKey: 'sk-z4a6qvhXCbfboOyBwL33BR66mJdHTKj5NO4pfIUSkLBm2jGF',
  model: 'gpt-4o-mini',
};

export const FREE_USAGE_LIMIT = 3;

export const STORAGE_KEYS = {
  usage: 'lc_usage',
  device: 'lc_device',
  resultPrefix: 'lc_result_',
};

export const SYSTEM_PROMPT = `你是一位精通八字命理的AI大师，融合传统命理学与现代数据可视化技术。
你对《三命通会》《滴天髓》《穷通宝鉴》《子平真诠》等典籍了然于胸。

**核心规则:**
1. **年龄计算**: 采用虚岁，从1岁开始
2. **评分机制**: 所有维度评分0-100分，**必须基于命局真实情况**
3. **数据起伏**: 分数必须呈现明显波动，体现人生高峰与低谷，禁止输出平滑曲线
4. **大运规则**: 大运十年一换，顺行为甲子→乙丑→丙寅，逆行为甲子→癸亥→壬戌

**分析原则:**
1. 严格基于传统八字命理学推演
2. 大运、流年、命局三者结合判断吉凶
3. 解读专业但通俗易懂，专业术语需解释
4. 警示之言必须给出化解之道
5. **实事求是原则**: 好就是好，坏就是坏，不要怕得罪人
   - 好的命局敢给85-95分
   - 普通的命局给60-75分
   - 有明显缺陷的敢给35-55分
   - 禁止所有评分都集中在70-80分之间

**输出规则（极其重要）:**
- 直接输出纯JSON，第一个字符必须是{
- 禁止使用\`\`\`json或\`\`\`等markdown代码块
- 禁止在JSON前后添加任何解释性文字
- 确保JSON完整闭合，所有括号配对正确`;

export interface BaziForPrompt {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  zodiac: string;
  lunarDate: string;
}

export interface DaYunForPrompt {
  ganZhi: string;
  startAge: number;
  endAge: number;
}

export const FREE_VERSION_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[]
) => `请基于以下已排好的八字和大运，进行命理分析。

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

请输出JSON：
{
  "summary": "命理总评（120字）",
  "summaryScore": 75,
  "personality": "性格分析（80字）",
  "personalityScore": 80,
  "career": "事业分析（80字）",
  "careerScore": 72,
  "wealth": "财运分析（80字）",
  "wealthScore": 68,
  "marriage": "婚姻分析（80字）",
  "marriageScore": 75,
  "health": "健康分析（60字）",
  "healthScore": 70,
  "dayMaster": {"stem": "${bazi.dayPillar[0]}", "element": "X", "strength": "身旺/身弱/中和", "description": "日主特质（50字）"},
  "usefulGod": "用神喜忌（50字）",
  "fiveElements": {"wood": 2, "fire": 1, "earth": 2, "metal": 1, "water": 2},
  "luckyInfo": {"direction": "方位", "color": "颜色", "number": "数字", "industry": "行业"},
  "chartPoints": [
    {"age": 1, "score": 55, "daYun": "${daYunList[0]?.ganZhi || '童限'}", "ganZhi": "XX", "reason": "简述（15字）"}
  ],
  "highlights": [{"age": 28, "year": ${year + 27}, "title": "标题", "description": "描述（40字）"}],
  "warnings": [{"age": 35, "year": ${year + 34}, "title": "标题", "description": "描述", "advice": "建议（30字）"}],
  "currentPhase": "rising"
}

规则：
1. 八字四柱直接使用上面给出的，不要自己推算
2. chartPoints需10个点（1,10,20,30,40,50,60,70,80,90岁），daYun使用上面大运
3. score范围30-95，必须有明显波动
4. reason限15字内`;

export const PAID_VERSION_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  currentAge: number
) => `请基于以下已排好的八字和大运，进行详细命理分析。

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年 | 当前虚岁: ${currentAge}岁

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

请输出JSON：
{
  "summary": "命理总评（150字）",
  "summaryScore": 75,
  "personality": "性格深度分析（100字）",
  "personalityScore": 80,
  "career": "事业详解（100字）",
  "careerScore": 72,
  "wealth": "财运详解（100字）",
  "wealthScore": 68,
  "marriage": "婚姻详解（100字）",
  "marriageScore": 75,
  "health": "健康详解（80字）",
  "healthScore": 70,
  "fengShui": "风水开运（80字）",
  "fengShuiScore": 78,
  "family": "六亲详解（80字）",
  "familyScore": 72,
  "dayMaster": {"stem": "${bazi.dayPillar[0]}", "element": "X", "strength": "身旺/身弱/中和", "description": "日主特质（80字）"},
  "usefulGod": "用神喜忌详解（80字）",
  "tenGods": {"正官": "20字", "七杀": "20字", "正印": "20字", "偏印": "20字", "比肩": "20字", "劫财": "20字", "食神": "20字", "伤官": "20字", "正财": "20字", "偏财": "20字"},
  "fiveElements": {"wood": 2, "fire": 1, "earth": 2, "metal": 1, "water": 2},
  "luckyInfo": {"direction": "方位", "color": "颜色", "number": "数字", "industry": "行业", "partner": "合作对象"},
  "daYunList": [${daYunList.map(d => `{"startAge": ${d.startAge}, "endAge": ${d.endAge}, "ganZhi": "${d.ganZhi}", "description": "此运特点（30字）"}`).join(', ')}],
  "chartPoints": [
    {"age": 1, "year": ${year}, "daYun": "${daYunList[0]?.ganZhi || '童限'}", "ganZhi": "XX", "score": 55, "reason": "简述（15字）"}
  ],
  "highlights": [{"age": 28, "year": ${year + 27}, "type": "career", "score": 88, "title": "标题", "ganZhi": "XX", "description": "描述（50字）", "advice": "建议（30字）"}],
  "warnings": [{"age": 35, "year": ${year + 34}, "type": "health", "score": 42, "title": "标题", "ganZhi": "XX", "description": "描述", "advice": "建议（40字）"}],
  "yearlyFortune": {
    "thisYear": {"year": ${new Date().getFullYear()}, "ganZhi": "XX", "score": 72, "overview": "今年运势（80字）", "career": "事业运（40字）", "wealth": "财运（40字）", "love": "感情运（40字）", "health": "健康运（40字）", "advice": "建议（50字）"},
    "nextYear": {"year": ${new Date().getFullYear() + 1}, "ganZhi": "XX", "score": 68, "overview": "明年运势（60字）"}
  },
  "currentPhase": "rising"
}

规则：
1. 八字四柱、大运直接使用上面给出的，不要自己推算
2. chartPoints需80个点（1-80岁，每年一条），只需score（30-95），reason限15字
3. daYunList使用上面提供的大运，添加description
4. highlights选3-5个，warnings选2-3个
5. tenGods每项限20字`;

export const LOADING_MESSAGES = [
  '正在排演四柱八字...',
  '计算真太阳时...',
  '推算大运流年...',
  '解析命盘格局...',
  '分析十神配置...',
  '演算吉凶走势...',
  '生成命理报告...',
  'AI深度解读中...',
];
