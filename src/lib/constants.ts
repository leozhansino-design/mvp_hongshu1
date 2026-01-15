export const API_CONFIG = {
  baseUrl: 'https://api.bltcy.ai/v1',
  apiKey: 'sk-z4a6qvhXCbfboOyBwL33BR66mJdHTKj5NO4pfIUSkLBm2jGF',
  model: 'gemini-3-flash-preview',
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
2. **评分机制**: 所有维度评分0-100分，**必须实事求是**
3. **数据起伏**: 分数必须呈现明显波动，体现人生高峰与低谷，禁止输出平滑曲线
4. **大运规则**: 大运十年一换，顺行为甲子→乙丑→丙寅，逆行为甲子→癸亥→壬戌

**分析原则:**
1. 严格基于传统八字命理学推演
2. 大运、流年、命局三者结合判断吉凶
3. 解读专业但通俗易懂，专业术语需解释
4. 警示之言必须给出化解之道
5. **实话实说原则（非常重要）**：
   - 命局好的敢给85-95分，不要怕高
   - 命局普通的给60-75分
   - 命局有缺陷的敢给35-55分，不要怕低
   - **禁止所有评分都集中在70-80分之间**
   - **禁止为了讨好用户而虚高评分**
   - 要体现真实的命理水平差异

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

请输出JSON格式（注意：下面的分数只是格式示例，请根据实际命局给出真实评分）：
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
  "fengShui": "风水开运（60字）",
  "fengShuiScore": 78,
  "family": "六亲关系（60字）",
  "familyScore": 72,
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
4. reason限15字内
5. **重要**：所有评分必须根据实际命局分析得出，不要照抄示例中的75、80等数值`;

export const PAID_VERSION_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  currentAge: number
) => `请基于以下已排好的八字和大运，进行详细深入的命理分析。

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年 | 当前虚岁: ${currentAge}岁

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

请输出JSON格式（注意：下面的分数只是格式示例，请根据实际命局给出真实评分）：
{
  "summary": "命理总评（200字以上，需包含：命局格局、日主强弱、用神忌神、总体运势走向、一生关键转折点）",
  "summaryScore": 75,
  "personality": "性格深度分析（150字以上，需包含：天性特点、处事风格、优势劣势、性格成因、人际交往特点、适合发展方向）",
  "personalityScore": 80,
  "career": "事业详解（150字以上，需包含：事业格局、适合行业、职业发展路径、事业高峰期、需要注意的事业陷阱、成功关键因素）",
  "careerScore": 72,
  "wealth": "财运详解（150字以上，需包含：财运格局、求财方式、财富积累时期、投资理财建议、破财风险提示、守财之道）",
  "wealthScore": 68,
  "marriage": "婚姻详解（150字以上，需包含：婚姻格局、配偶特点、姻缘时机、婚姻状态、感情经营建议、需要注意的婚姻问题）",
  "marriageScore": 75,
  "health": "健康详解（120字以上，需包含：先天体质、易患疾病、健康薄弱期、养生建议、需要注意的健康隐患）",
  "healthScore": 70,
  "fengShui": "风水开运（120字以上，需包含：居住环境选择、办公室布局、吉利方位、颜色运用、风水调理重点、开运物品推荐）",
  "fengShuiScore": 78,
  "family": "六亲详解（120字以上，需包含：父母关系、兄弟姐妹、子女缘分、家庭责任、亲情互动建议、六亲对命主的影响）",
  "familyScore": 72,
  "dayMaster": {"stem": "${bazi.dayPillar[0]}", "element": "X", "strength": "身旺/身弱/中和", "description": "日主特质（100字以上，需详细解释日主的特性、强弱程度、对命局的影响）"},
  "usefulGod": "用神喜忌详解（100字以上，需明确指出用神、喜神、忌神、仇神，并解释各自作用）",
  "tenGods": {"正官": "详解30字", "七杀": "详解30字", "正印": "详解30字", "偏印": "详解30字", "比肩": "详解30字", "劫财": "详解30字", "食神": "详解30字", "伤官": "详解30字", "正财": "详解30字", "偏财": "详解30字"},
  "fiveElements": {"wood": 2, "fire": 1, "earth": 2, "metal": 1, "water": 2},
  "luckyInfo": {"direction": "具体方位", "color": "具体颜色", "number": "幸运数字", "industry": "具体行业", "partner": "合作对象类型"},
  "daYunList": [${daYunList.map(d => `{"startAge": ${d.startAge}, "endAge": ${d.endAge}, "ganZhi": "${d.ganZhi}", "description": "此运详解（50字，需说明运势特点、机遇挑战、应对策略）"}`).join(', ')}],
  "chartPoints": [
    {"age": 1, "year": ${year}, "daYun": "${daYunList[0]?.ganZhi || '童限'}", "ganZhi": "XX", "score": 55, "reason": "简述（15字）"}
  ],
  "highlights": [{"age": 28, "year": ${year + 27}, "type": "career", "score": 88, "title": "标题", "ganZhi": "XX", "description": "描述（80字，需详细说明高光点的来龙去脉）", "advice": "建议（50字）"}],
  "warnings": [{"age": 35, "year": ${year + 34}, "type": "health", "score": 42, "title": "标题", "ganZhi": "XX", "description": "描述（80字，需详细说明风险点）", "advice": "化解建议（60字，需给出具体可行的化解方法）"}],
  "yearlyFortune": {
    "thisYear": {"year": ${new Date().getFullYear()}, "ganZhi": "XX", "score": 72, "overview": "今年运势（120字，需全面分析）", "career": "事业运（60字）", "wealth": "财运（60字）", "love": "感情运（60字）", "health": "健康运（60字）", "advice": "建议（80字）"},
    "nextYear": {"year": ${new Date().getFullYear() + 1}, "ganZhi": "XX", "score": 68, "overview": "明年运势（100字，需全面分析）"}
  },
  "currentPhase": "rising"
}

规则：
1. 八字四柱、大运直接使用上面给出的，不要自己推算
2. chartPoints需80个点（1-80岁，每年一条），只需score（30-95），reason限15字
3. daYunList使用上面提供的大运，添加详细description（50字）
4. highlights选5-8个关键年份，warnings选3-5个需要注意的年份
5. tenGods每项需详解30字，说明该十神在命局中的作用
6. **重要**：所有评分必须根据实际命局分析得出，不要照抄示例中的75、80等数值
7. **内容充实**：所有文字描述必须达到或超过规定字数，内容要详实、专业、有针对性`;

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
