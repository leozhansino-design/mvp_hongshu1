import { WealthCurveData, FreeVersionResult } from '@/types';

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
  analyticsPrefix: 'lc_analytics_',
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
  daYunList: DaYunForPrompt[],
  currentAge: number
) => `请基于以下已排好的八字和大运，进行**简要**命理分析（免费版）。

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
  "summary": "命理概述（80-100字，点到为止）",
  "summaryScore": 75,
  "personality": "性格简析（60字）",
  "personalityScore": 80,
  "career": "事业简析（60字）",
  "careerScore": 72,
  "wealth": "财运简析（60字）",
  "wealthScore": 68,
  "marriage": "婚姻简析（60字）",
  "marriageScore": 75,
  "health": "健康简析（40字）",
  "healthScore": 70,
  "dayMaster": {"stem": "${bazi.dayPillar[0]}", "element": "X", "strength": "身旺/身弱/中和", "description": "日主（30字）"},
  "usefulGod": "用神喜忌（30字）",
  "fiveElements": {"wood": 2, "fire": 1, "earth": 2, "metal": 1, "water": 2},
  "elementAnalysis": "五行相克分析（50字，针对此命格的五行相克特点及影响）",
  "luckyInfo": {"direction": "方位", "color": "颜色", "number": "数字", "industry": "行业"},
  "luckyExplanation": "开运指南详解（80字，结合命局特点给出具体开运建议和注意事项）",
  "highlightMoment": {"age": ${currentAge > 18 ? currentAge + 3 : 25}, "title": "${gender === 'male' ? '事业突破时刻' : '人生高光时刻'}", "description": "结合网络用语（80字，${gender === 'male' ? '侧重事业财运，如\"这波操作堪称教科书级别\"' : '侧重家庭子女，如\"人生赢家既视感\"'}），给用户想象空间，要幽默好玩有画面感"},
  "chartPoints": [
    {"age": 1, "score": 55, "daYun": "${daYunList[0]?.ganZhi || '童限'}", "ganZhi": "XX", "reason": "简述（10字）"}
  ],
  "highlights": [{"age": 28, "year": ${year + 27}, "title": "标题", "description": "描述（30字）"}],
  "warnings": [{"age": 35, "year": ${year + 34}, "title": "标题", "description": "描述（30字）", "advice": "建议（20字）"}],
  "currentPhase": "rising"
}

规则：
1. 八字四柱直接使用上面给出的，不要自己推算
2. **chartPoints只需5个关键点**（1,20,40,60,80岁），daYun使用上面大运
3. **【极其重要】曲线必须严格基于八字大运分析**：
   - score范围30-95，曲线走势必须与大运吉凶完全对应
   - **分析每步大运的干支与命局的生克关系**，用神得力则分高，忌神当令则分低
   - **不同命格有不同走势，没有固定模板**：
     - 少年得志型：童限/早运遇用神，早年分数就可以高
     - 大器晚成型：晚运遇用神，晚年才走高
     - 先扬后抑型：早运好晚运差，晚年分数下降
     - 起伏波折型：大运忽好忽坏，曲线有明显波动
   - **关键**：每个年龄点的分数必须有命理依据，对照上方大运表判断该阶段运势
   - 例：如果某人童限大运为喜用神，则1岁分数可以较高
   - 例：如果20岁走的大运为忌神当令，则20岁分数应该偏低
4. reason限10字内
5. **highlights和warnings各选1-2个**最关键的即可
6. 内容简洁，点到为止，避免过度详细
7. **重要**：曲线形态完全由命局和大运决定，不要套用固定模板`;

export const PAID_VERSION_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  currentAge: number,
  existingFreeResult?: FreeVersionResult // 升级时传入现有数据以保持一致性
) => {
  // 如果有现有数据（升级场景），要求保持数据一致性
  const consistencyNote = existingFreeResult ? `
⚠️【最重要 - 数据一致性要求】⚠️
用户已有免费版报告，升级时必须保持以下数据完全一致：
- summaryScore: ${existingFreeResult.summaryScore}
- personalityScore: ${existingFreeResult.personalityScore}
- careerScore: ${existingFreeResult.careerScore}
- wealthScore: ${existingFreeResult.wealthScore}
- marriageScore: ${existingFreeResult.marriageScore}
- healthScore: ${existingFreeResult.healthScore}
- fengShuiScore: ${existingFreeResult.fengShuiScore}
- familyScore: ${existingFreeResult.familyScore}
- highlightMoment: ${existingFreeResult.highlightMoment ? JSON.stringify(existingFreeResult.highlightMoment) : '无'}
- chartPoints趋势必须与免费版一致，只是更详细

免费版chartPoints数据（必须经过这些点）:
${existingFreeResult.chartPoints.map(p => `${p.age}岁: ${p.score}分`).join(' → ')}

请在此基础上补充更多年份的数据点，但关键年份的分数必须保持一致！

` : '';

  return `${consistencyNote}请基于以下已排好的八字和大运，进行**极其详细深入**的命理分析（完整精批版）。

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
  "summary": "命理总评（250字以上，需包含：命局格局、日主强弱、用神忌神、总体运势走向、一生关键转折点、命局特殊格局）",
  "summaryScore": 75,
  "personality": "性格深度分析（200字以上，需包含：天性特点、处事风格、优势劣势、性格成因、人际交往特点、适合发展方向、性格弱点改进）",
  "personalityScore": 80,
  "career": "事业详解（200字以上，需包含：事业格局、适合行业、职业发展路径、事业高峰期、需要注意的事业陷阱、成功关键因素、职业转换建议、创业适合性）",
  "careerScore": 72,
  "wealth": "财运详解（200字以上，需包含：财运格局、求财方式、财富积累时期、投资理财建议、破财风险提示、守财之道、适合投资领域、财运转折点）",
  "wealthScore": 68,
  "marriage": "婚姻详解（200字以上，需包含：婚姻格局、配偶特点、姻缘时机、婚姻状态、感情经营建议、需要注意的婚姻问题、感情危机化解、夫妻相处之道）",
  "marriageScore": 75,
  "health": "健康详解（150字以上，需包含：先天体质、易患疾病、健康薄弱期、养生建议、需要注意的健康隐患、疾病预防、体质调理）",
  "healthScore": 70,
  "fengShui": "风水开运（150字以上，需包含：居住环境选择、办公室布局、吉利方位、颜色运用、风水调理重点、开运物品推荐、家居布置、办公位选择）",
  "fengShuiScore": 78,
  "family": "六亲详解（150字以上，需包含：父母关系、兄弟姐妹、子女缘分、家庭责任、亲情互动建议、六亲对命主的影响、长辈贵人、晚辈关系）",
  "familyScore": 72,
  "children": "子女运详解（120字以上，需包含：子女数量倾向、子女性格特点、子女发展潜力、教育建议、亲子关系、子女对命主的帮扶）",
  "childrenScore": 75,
  "benefactor": "贵人运详解（120字以上，需包含：贵人方位、贵人属相、贵人特征、如何遇贵人、贵人助力时期、小人防范、人际网络建设）",
  "benefactorScore": 70,
  "education": "学业智慧（100字以上，需包含：学习能力、适合专业、考试运势、深造建议、技能发展、知识领域）",
  "educationScore": 78,
  "dayMaster": {"stem": "${bazi.dayPillar[0]}", "element": "X", "strength": "身旺/身弱/中和", "description": "日主特质（120字以上，需详细解释日主的特性、强弱程度、对命局的影响、日元特点）"},
  "usefulGod": "用神喜忌详解（120字以上，需明确指出用神、喜神、忌神、仇神，并解释各自作用、如何运用）",
  "tenGods": {"正官": "详解40字", "七杀": "详解40字", "正印": "详解40字", "偏印": "详解40字", "比肩": "详解40字", "劫财": "详解40字", "食神": "详解40字", "伤官": "详解40字", "正财": "详解40字", "偏财": "详解40字"},
  "shenSha": {"吉神": ["天德贵人: 解释30字", "月德贵人: 解释30字"], "凶煞": ["羊刃: 解释30字", "劫煞: 解释30字"]},
  "fiveElements": {"wood": 2, "fire": 1, "earth": 2, "metal": 1, "water": 2},
  "elementAnalysis": "五行相克分析（120字以上，详细说明此命格的五行生克制化关系、平衡状态、对运势的影响、调理方向）",
  "luckyInfo": {"direction": "详细方位解释", "color": "详细颜色解释", "number": "幸运数字解释", "industry": "详细行业分析", "partner": "合作对象详解", "travelDirection": "出行方位", "residence": "居住方位"},
  "luckyExplanation": "开运指南详解（150字以上，结合命局特点、五行喜忌、大运流年，给出系统的开运建议、实施方法、注意事项）",
  "highlightMoment": {"age": ${currentAge > 18 ? currentAge + 5 : 28}, "title": "${gender === 'male' ? '巅峰时刻·事业称霸' : '高光时刻·人生赢家'}", "description": "结合网络用语（150字以上，${gender === 'male' ? '侧重事业财运成就，如\"这波操作堪称教科书级别\"、\"财富密码已掌握\"' : '侧重家庭子女幸福，如\"人生赢家既视感\"、\"岁月静好，现世安稳\"'}），给用户画面感和想象空间，要幽默好玩接地气"},
  "improveAdvice": {
    "career": "事业改运建议（80字，具体可行的改运方法）",
    "wealth": "财运改运建议（80字，具体可行的改运方法）",
    "marriage": "婚姻改运建议（80字，具体可行的改运方法）",
    "health": "健康改运建议（80字，具体可行的改运方法）",
    "overall": "综合改运建议（100字，整体提升运势的方法）"
  },
  "daYunList": [${daYunList.map(d => `{"startAge": ${d.startAge}, "endAge": ${d.endAge}, "ganZhi": "${d.ganZhi}", "description": "此运详解（80字，需详细说明运势特点、机遇挑战、应对策略、关键事项）"}`).join(', ')}],
  "chartPoints": [
    {"age": 1, "year": ${year}, "daYun": "${daYunList[0]?.ganZhi || '童限'}", "ganZhi": "XX", "score": 55, "reason": "简述（15字）"}
  ],
  "highlights": [{"age": 28, "year": ${year + 27}, "type": "career", "score": 88, "title": "标题", "ganZhi": "XX", "description": "描述（120字，需详细说明高光点的来龙去脉、机遇来源、如何把握）", "advice": "建议（80字，具体行动方案）"}],
  "warnings": [{"age": 35, "year": ${year + 34}, "type": "health", "score": 42, "title": "标题", "ganZhi": "XX", "description": "描述（120字，需详细说明风险点、可能遇到的问题）", "advice": "化解建议（100字，需给出具体可行的化解方法、预防措施）"}],
  "futureYears": [
    {"year": ${new Date().getFullYear()}, "age": ${currentAge}, "ganZhi": "XX", "score": 72, "overview": "运势总评（80字）", "career": "事业（50字）", "wealth": "财运（50字）", "love": "感情（50字）", "health": "健康（50字）", "advice": "建议（60字）"}
  ],
  "yearlyFortune": {
    "thisYear": {"year": ${new Date().getFullYear()}, "ganZhi": "XX", "score": 72, "overview": "今年运势（150字，需全面分析）", "career": "事业运（80字）", "wealth": "财运（80字）", "love": "感情运（80字）", "health": "健康运（80字）", "advice": "建议（100字）"},
    "nextYear": {"year": ${new Date().getFullYear() + 1}, "ganZhi": "XX", "score": 68, "overview": "明年运势（120字，需全面分析）", "advice": "明年建议（80字）"}
  },
  "keyYears": [
    {"age": 30, "year": ${year + 29}, "title": "关键年份标题", "type": "career", "description": "为什么重要（100字，详细说明该年份的特殊意义、机遇或挑战）", "advice": "应对策略（80字）"}
  ],
  "currentPhase": "rising"
}

规则：
1. 八字四柱、大运直接使用上面给出的，不要自己推算
2. **【极其重要】chartPoints曲线必须严格基于八字大运分析**：
   - 需80个点（1-80岁，每年一条），只需score（30-95），reason限15字
   - **曲线走势必须与大运吉凶完全对应**，分析每步大运与命局的生克关系
   - **不同命格有不同走势，没有固定模板**：
     - 少年得志型：童限/早运遇用神，早年分数就可以高
     - 大器晚成型：晚运遇用神，晚年才走高
     - 先扬后抑型：早运好晚运差，晚年分数下降
     - 起伏波折型：大运忽好忽坏，曲线有明显波动
   - 每个年龄段的分数必须有命理依据，对照上方大运表判断该阶段运势
   - 例：如果某人童限大运为喜用神，则早年分数可以较高
   - 例：如果中年走忌神大运，则中年分数应该偏低
   - 在每个10年大运内，允许有1-3分的小波动，但要保持该运整体吉凶基调
3. daYunList使用上面提供的大运，添加详细description（80字）
4. highlights选8-12个关键年份，warnings选5-8个需要注意的年份
5. tenGods每项需详解40字，说明该十神在命局中的作用和影响
6. shenSha需列出该命局中的主要吉神和凶煞，各2-4个
7. futureYears需列出从今年开始的连续5年运势详解
8. keyYears需选出3-5个最关键的年份进行深度解析
9. improveAdvice需针对各个维度给出切实可行的改运建议
10. **重要**：所有评分必须根据实际命局分析得出，不要照抄示例中的75、80等数值
11. **内容充实**：所有文字描述必须达到或超过规定字数，内容要详实、专业、有针对性、实用性强`;
};

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

// 财富曲线专用提示词
export const WEALTH_CURVE_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  isPaid: boolean,
  existingData?: WealthCurveData // 升级时传入现有数据以保持一致性
) => {
  // 如果有现有数据（升级场景），要求保持数据一致性
  if (existingData && isPaid) {
    return `你是一位精通八字命理的财运分析师。用户已有免费版财富曲线数据，现在需要升级到详细版。

⚠️【最重要】必须保持以下数据完全不变：
- wealthType: "${existingData.wealthType}"
- wealthRange: {"min": ${existingData.wealthRange.min}, "max": ${existingData.wealthRange.max}, "unit": "${existingData.wealthRange.unit}"}
- highlights: ${JSON.stringify(existingData.highlights)}

【现有的11个数据点（必须经过这些点）】
${existingData.dataPoints.map(d => `${d.age}岁: ${d.wealth}万`).join(' → ')}

【任务】
基于现有的11个数据点，生成63个完整的逐年数据点（18-80岁）。新数据点必须：
1. 在现有的11个点上保持完全一致的数值
2. 中间年份的数据要平滑过渡，符合趋势
3. 保持曲线形状和走势与原来一致

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年

【八字四柱】
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}

请返回以下JSON格式：
{
  "wealthRange": ${JSON.stringify(existingData.wealthRange)},
  "wealthType": "${existingData.wealthType}",
  "highlights": ${JSON.stringify(existingData.highlights)},
  "dataPoints": [
    生成63个数据点，从{"age": 18, "wealth": ${existingData.dataPoints[0]?.wealth || 0}}开始，
    必须经过现有的11个点，中间平滑插值，一直到{"age": 80, "wealth": 数字}
  ],
  "analysis": {
    "summary": "您的八字财星分析总结（150字以上，包含专业术语如正财偏财、食伤生财等）...",
    "earlyYears": "18-30岁财运分析（100字以上，具体分析这个阶段的大运财运）...",
    "middleYears": "30-50岁财运分析（100字以上，结合大运详细分析）...",
    "lateYears": "50岁后财运分析（100字以上）...",
    "advice": "理财建议（120字以上，包含具体可操作的建议）..."
  }
}

重要：
1. wealthType、wealthRange、highlights必须与上面给出的完全一致！
2. dataPoints必须有63个点，且必须经过现有的11个数据点
3. 只需要生成详细的analysis分析内容`;
  }

  // 全新生成（非升级场景）
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - year;

  return `你是一位精通八字命理的财运分析师，擅长用戏剧性的方式呈现财富曲线。请根据以下八字信息，生成此人18-80岁的累计财富曲线数据。

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年
当前年龄: 约${currentAge}岁

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

【⚠️ 极其重要 - 制造戏剧性的财富曲线！】

不要生成无聊的平滑曲线！根据八字格局，必须选择以下某种戏剧性模式：

📈 **顶级财运（从财格/财官双美/食伤生财格局）**:
   - 峰值必须达到 1亿-10亿（10000-100000万）
   - 例如：0→50→200→1500→8000→25000→80000→35000（冲到8亿后跌回3.5亿）
   - 可以有一次暴跌（破产、被骗、投资失败），然后东山再起

📊 **中上财运（财星得用/偏财透出）**:
   - 峰值达到 2000万-8000万
   - 例如：0→30→150→800→2500→5000→3000→4500（有起伏）
   - 建议有1-2次明显回撤

📉 **中等财运（财星平平）**:
   - 峰值在 300万-1500万之间
   - 曲线相对平稳但也要有波动

💔 **艰难财运（比劫夺财/枭印夺食/财星被克）**:
   - 峰值只有 30万-200万！
   - 在0-50万之间反复徘徊，几次好不容易攒到80万又跌回20万
   - 例如：0→15→45→80→35→60→90→40→75→120→80
   - 这种命就是一辈子辛苦，财富难留，不要美化！

🎢 **过山车型（七杀/劫财旺）**:
   - 暴涨暴跌！例如：0→500→50→2000→100→5000→200
   - 每次赚到钱就会破财，反复多次

🌅 **大器晚成型（晚年大运走财运）**:
   - 60岁前一直在0-300万徘徊
   - 60岁后突然起飞到数千万甚至上亿

【关键规则】
1. 根据八字格局老实判断属于哪种类型，不要所有人都给中等偏上！
2. 财星弱/被克的命，峰值就是几十万到一两百万，要如实给出
3. 曲线必须有明显的起伏和故事性，不能是无聊的平滑上升
4. 至少要有1次明显的财富回撤（跌幅超过30%）
5. 未来财富考虑通胀（年化2.5%），数字要相应调高

【输出格式】
请返回以下JSON格式：
{
  "wealthRange": {
    "min": 0,
    "max": 数字（Y轴最大值，根据峰值设定，如峰值5亿则设60000）,
    "unit": "万"
  },
  "wealthType": "对应的类型（见下方选项）",
  "highlights": {
    "peakAge": 数字（巅峰年龄）,
    "peakWealth": 数字（巅峰财富，单位万，顶级可到100000即10亿）,
    "maxGrowthAge": 数字（最大增长年龄）,
    "maxGrowthAmount": 数字（最大年增长金额，单位万）,
    "maxLossAge": 数字（最大回撤年龄）,
    "maxLossAmount": 数字（最大年回撤金额，必须大于0！）
  },
  "dataPoints": [
    ${isPaid
      ? '必须生成63个完整的数据点！格式：{"age": 18, "wealth": 0}, {"age": 19, "wealth": 5}, ... 一直到 {"age": 80, "wealth": 数字}'
      : '必须生成11个完整的数据点！格式：{"age": 18, "wealth": 0}, {"age": 24, "wealth": 数字}, {"age": 30, "wealth": 数字}, {"age": 36, "wealth": 数字}, {"age": 42, "wealth": 数字}, {"age": 48, "wealth": 数字}, {"age": 54, "wealth": 数字}, {"age": 60, "wealth": 数字}, {"age": 66, "wealth": 数字}, {"age": 72, "wealth": 数字}, {"age": 78, "wealth": 数字}'
    }
  ],
  "analysis": {
    "summary": "您的八字财星分析总结（150字以上，用戏剧性语言描述财运特点，如'命中注定的亿万富翁'或'一生与财无缘的苦命人'）...",
    "earlyYears": "18-30岁财运分析（100字以上，具体分析这个阶段的故事）...",
    "middleYears": "30-50岁财运分析（100字以上，包含转折点和戏剧性事件）...",
    "lateYears": "50岁后财运分析（100字以上，描述最终结局）...",
    "advice": "理财建议（120字以上，根据命格给出针对性建议）..."
  }
}

【wealthType类型选项】
- "一夜暴富型" - 某个时期财富暴涨
- "东山再起型" - 破产后重新崛起
- "大器晚成型" - 60岁后才发达
- "过山车型" - 大起大落多次
- "稳中有升型" - 慢慢积累
- "命途多舛型" - 一生财运不佳，反复徘徊在低位
- "先富后穷型" - 年轻发达，晚年凄凉
- "白手起家型" - 从0到巅峰的奋斗史

【绝对禁止】
1. 禁止生成无聊的平滑曲线！
2. 禁止所有人都是几百万到几千万的中庸结果！
3. 禁止没有任何回撤的单调上升曲线！
4. maxLossAmount不能为0，至少要有一次回撤！`;
};

export const WEALTH_LOADING_MESSAGES = [
  '解析财星格局...',
  '分析正财偏财...',
  '推算财运周期...',
  '计算大运财运...',
  '演算流年财运...',
  '生成财富曲线...',
  'AI深度分析中...',
];

// 主播稿子生成提示词
export const STREAMER_SCRIPT_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  currentAge: number,
  focusType: string // career | relationship | future | health
) => `你是一位精通八字命理的直播解说大师，擅长用通俗易懂又专业的语言解读命盘。
现在需要为直播间主播生成解说稿，帮助主播为观众解读八字。

【命主信息】
性别: ${gender === 'male' ? '乾造（男）' : '坤造（女）'}
出生年: ${year}年 | 当前虚岁: ${currentAge}岁
重点关注: ${focusType === 'career' ? '事业财运' : focusType === 'relationship' ? '感情婚姻' : focusType === 'future' ? '前程发展' : '健康养生'}

【八字四柱】（已排好）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

请生成JSON格式的主播解说稿（所有分析必须基于上面的八字推算，要有理有据！）：
{
  "openingLine": "开场白（80字，根据八字特点切入，如'从你的八字来看，你是X命，五行XX偏弱/过旺...'）",
  "emotionalHook": "共情切入点（60字，根据性别和年龄段切入用户关心的话题）",
  "keyPoints": [
    "日主：X命，特点描述",
    "五行：缺X/X过旺/相对平衡",
    "当前：XX岁，XX大运",
    "重点：${focusType === 'career' ? '事业财运' : focusType === 'relationship' ? '感情婚姻' : focusType === 'future' ? '前程发展' : '健康养生'}"
  ],
  "healthAnalysis": {
    "title": "健康运势",
    "mainPoint": "核心健康提示（必须基于五行生克，如'你五行缺水，肾脏要注意'）",
    "baziReason": "八字依据（如'日主X命，五行缺X'）",
    "details": [
      "基于日主五行的健康分析（如'X主X脏，天生有X倾向'）",
      "基于五行缺失的健康提醒（必须具体到器官）",
      "可能出现的症状提醒",
      "年龄相关的健康风险"
    ],
    "advice": "养生建议（基于五行调理）"
  },
  "careerAnalysis": {
    "title": "事业前程",
    "mainPoint": "事业核心特点（如'你是XX型的人，XX是核心竞争力'）",
    "baziReason": "八字依据（如'X命日主，官星/财星/食伤特点'）",
    "details": [
      "适合的行业（基于五行喜忌）",
      "工作风格分析（基于日主特点）",
      "合作运势（与什么五行的人合作好）",
      "当前大运对事业的影响",
      "事业高光期预测"
    ],
    "advice": "事业发展建议（包含警惕点）"
  },
  "relationshipAnalysis": {
    "title": "感情婚姻",
    "mainPoint": "感情核心特点（如'你对感情XX，但要注意XX'）",
    "baziReason": "八字依据（如'X命日主，日支X为婚姻宫'）",
    "details": [
      "感情特质分析（基于日主五行）",
      "感情弱点提醒",
      "理想伴侣类型（基于五行生克）",
      "基于五行缺失的感情提醒",
      "性别相关的感情特点"
    ],
    "advice": "感情经营建议"
  },
  "futureAnalysis": {
    "title": "前程发展",
    "mainPoint": "前程核心判断",
    "baziReason": "八字依据",
    "details": [
      "当前人生阶段分析",
      "未来大运预测",
      "运势阶段判断（上升期/巅峰期/平稳期等）",
      "五行调理建议"
    ],
    "advice": "发展建议"
  },
  "talkingPoints": [
    "可以延伸的话题1",
    "可以延伸的话题2",
    "可以延伸的话题3"
  ],
  "suggestedPhrases": [
    "金句话术1（必须基于八字特点，如'你五行缺X，所以X方面要注意...'）",
    "金句话术2（如'你X命，XX是你的优势...'）",
    "金句话术3（如'你当前X大运，XX年是关键...'）"
  ],
  "goldenQuotes": [
    "命格金句1（根据命格特点给出安慰/鼓励/点醒的话，如'你是X命，天生有X的福气，不用太焦虑'）",
    "命格金句2（如'虽然目前运势低迷，但X年后大运转好，守得云开见月明'）",
    "命格金句3（如'你命中带X，注定不是平凡之人，只是时机未到'）",
    "命格金句4（如'你五行X旺，说明X方面是你的天赋，要好好利用'）"
  ],
  "backgroundKnowledge": "四柱背景知识（简述四柱含义和日主特点，50字）"
}

【重要规则】
1. 所有分析必须基于上面给出的八字四柱和大运！
2. 健康分析必须结合五行生克（木→肝胆、火→心脏、土→脾胃、金→肺部、水→肾脏）
3. 五行缺失/过旺必须体现在分析中，给出具体的影响
4. baziReason字段必须写明具体的八字依据，如"日主甲木，五行缺水"
5. 金句话术要有说服力，让观众觉得主播很专业
6. 根据性别和年龄调整重点：
   - 男性成年人：侧重事业财运
   - 女性成年人：侧重感情婚姻
   - 小孩（<18岁）：侧重前程发展
   - 老人（>=60岁）：侧重健康养生
7. 不要生成通用的模板内容，必须针对这个具体的八字分析！`;

export const STREAMER_LOADING_MESSAGES = [
  '解析命盘格局...',
  '分析五行生克...',
  '推算健康运势...',
  '演算事业前程...',
  '解读感情婚姻...',
  '生成主播稿子...',
];

// 名人命盘分析系统提示词
export const CELEBRITY_SYSTEM_PROMPT = `你是一位精通八字命理的AI大师，融合传统命理学与现代数据可视化技术。
你对《三命通会》《滴天髓》《穷通宝鉴》《子平真诠》等典籍了然于胸。

**【特殊模式：大格局命盘分析】**
这是一个具有大格局潜力的命盘分析，你需要：
1. 严格基于八字命理推演，体现此命格的潜力和特点
2. 此命格应该体现出较强的事业运和财运潜力
3. 高光年份的描述要用命理术语，如"运势大开"、"贵人扶持"、"财星得位"、"官印相生"等
4. 谨慎年份的描述也要用命理术语，如"运势低迷"、"犯太岁"、"财星受克"、"比劫争财"等
5. **禁止提及任何具体事件**，如"创业"、"上市"、"获奖"、"破产"等，只用命理术语描述

**核心规则:**
1. **年龄计算**: 采用虚岁，从1岁开始
2. **评分机制**: 所有维度评分0-100分，此模式下可以给出较高评分（75-92）
3. **数据起伏**: 分数必须呈现明显波动，体现人生高峰与低谷
4. **大运规则**: 大运十年一换，顺行为甲子→乙丑→丙寅，逆行为甲子→癸亥→壬戌

**分析原则:**
1. 严格基于传统八字命理学推演
2. 大运、流年、命局三者结合判断吉凶
3. 只用命理术语描述，不要用具体的世俗事件
4. 体现出这是一个有潜力、有格局的命盘

**输出规则（极其重要）:**
- 直接输出纯JSON，第一个字符必须是{
- 禁止使用\`\`\`json或\`\`\`等markdown代码块
- 禁止在JSON前后添加任何解释性文字
- 确保JSON完整闭合，所有括号配对正确`;

// 名人版人生曲线提示词
export const CELEBRITY_FREE_VERSION_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  currentAge: number,
  _celebrityName?: string
) => `请基于以下已排好的八字和大运，进行**大格局命盘**命理分析。

【特殊说明】
这是一个具有大格局潜力的命盘。请根据八字推演运势时：
- 高光年份用命理术语描述，如"运势大开"、"贵人相助"、"财官双美"、"印绶护身"等
- 谨慎年份也用命理术语，如"运势低迷"、"比劫争财"、"官杀混杂"、"财星受克"等
- 分析要体现出这是一个有潜力、有格局的命盘
- **禁止提及任何具体事件**如"创业"、"上市"、"公司"、"投资"等，只用命理术语

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年 | 当前虚岁: ${currentAge}岁

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

请输出JSON格式：
{
  "summary": "命理概述（80-100字，用命理术语描述格局特点，如'财官印全'、'食神生财'等）",
  "summaryScore": 85,
  "personality": "性格简析（60字，基于日主五行特点分析）",
  "personalityScore": 85,
  "career": "事业简析（60字，用官星、印星等术语描述事业格局）",
  "careerScore": 88,
  "wealth": "财运简析（60字，用财星、食伤等术语描述财富格局）",
  "wealthScore": 85,
  "marriage": "婚姻简析（60字）",
  "marriageScore": 72,
  "health": "健康简析（40字）",
  "healthScore": 70,
  "fengShui": "风水开运（60字）",
  "fengShuiScore": 75,
  "family": "六亲关系（60字）",
  "familyScore": 72,
  "dayMaster": {"stem": "${bazi.dayPillar[0]}", "element": "X", "strength": "身旺/身弱/中和", "description": "日主特点（30字，基于五行特性分析）"},
  "usefulGod": "用神喜忌（30字）",
  "fiveElements": {"wood": 2, "fire": 1, "earth": 2, "metal": 1, "water": 2},
  "elementAnalysis": "五行相克分析（50字，分析五行配置特点）",
  "luckyInfo": {"direction": "方位", "color": "颜色", "number": "数字", "industry": "行业"},
  "luckyExplanation": "开运指南详解（80字）",
  "highlightMoment": {"age": ${currentAge > 30 ? Math.min(currentAge - 5, 45) : 35}, "title": "运势巅峰时刻", "description": "用命理术语+网络用语（80字，如'这一年大运流年双美，财官印齐聚，堪称人生开挂时刻'、'运势一路狂飙'），要有画面感但不提具体事件"},
  "chartPoints": [
    {"age": 1, "score": 55, "daYun": "${daYunList[0]?.ganZhi || '童限'}", "ganZhi": "XX", "reason": "命理术语（10字）"}
  ],
  "highlights": [{"age": 28, "year": ${year + 27}, "type": "career", "title": "运势大开", "description": "用命理术语描述（30字，如'财星得位，贵人相助'）"}],
  "warnings": [{"age": 35, "year": ${year + 34}, "type": "career", "title": "运势受阻", "description": "用命理术语描述（30字）", "advice": "化解建议（20字）"}],
  "currentPhase": "rising"
}

规则：
1. 八字四柱直接使用上面给出的，不要自己推算
2. **chartPoints只需5个关键点**（1,20,40,60,80岁），daYun使用上面大运
3. **【极其重要】曲线必须严格基于八字大运分析**：
   - score范围30-95，曲线走势必须与大运吉凶完全对应
   - **分析每步大运的干支与命局的生克关系**，用神得力则分高，忌神当令则分低
   - **不同命格有不同走势，没有固定模板**：
     - 少年得志型：童限/早运遇用神，早年分数就可以高
     - 大器晚成型：晚运遇用神，晚年才走高
     - 先扬后抑型：早运好晚运差，晚年分数下降
   - 每个年龄点的分数必须有命理依据，对照上方大运表判断
   - 大格局命盘的特点是：整体分数偏高（60-92），但走势仍由大运决定
4. reason限10字内，用命理术语
5. **所有描述只用命理术语**，禁止提及具体世俗事件
6. 整体分析要体现这是一个有潜力有格局的命盘`;

// 名人版财富曲线提示词
export const CELEBRITY_WEALTH_CURVE_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  isPaid: boolean,
  _celebrityName?: string
) => {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - year;

  return `你是一位精通八字命理的财运分析师。请根据以下八字信息，生成此人18-80岁的累计财富曲线数据。

【特殊说明】
这是一个具有大财运格局的命盘。
- 财富曲线要体现较高的财富积累潜力
- 分析要用命理术语，如"财星得位"、"食神生财"、"偏财透出"等
- **禁止提及具体事件**如"创业"、"上市"、"投资失败"等

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年
当前年龄: 约${currentAge}岁

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

【大格局财富曲线要求】
作为大财运格局的命盘，财富曲线应该体现：
1. 峰值应该达到千万级别甚至亿级别
2. 要有明显的财富爆发点（用命理术语描述，如"财星大旺"、"食伤生财得力"）
3. 可能有回撤（用命理术语描述，如"比劫争财"、"财星受克"），但最终恢复
4. 整体呈现上升趋势

【输出格式】
请返回以下JSON格式：
{
  "wealthRange": {
    "min": 0,
    "max": 数字（Y轴最大值，大格局建议10000-100000，即1亿-10亿）,
    "unit": "万"
  },
  "wealthType": "白手起家型/一夜暴富型/东山再起型/稳中有升型",
  "highlights": {
    "peakAge": 数字（巅峰年龄）,
    "peakWealth": 数字（巅峰财富，单位万，大格局建议5000-50000）,
    "maxGrowthAge": 数字（最大增长年龄）,
    "maxGrowthAmount": 数字（最大年增长金额，单位万）,
    "maxLossAge": 数字（最大回撤年龄，如有的话）,
    "maxLossAmount": 数字（最大年回撤金额）
  },
  "dataPoints": [
    ${isPaid
      ? '生成63个完整的数据点（18-80岁）'
      : '生成11个数据点：18,24,30,36,42,48,54,60,66,72,78岁'
    }
  ],
  "analysis": {
    "summary": "财星分析总结（150字以上，用命理术语描述财富格局，禁止提及具体事件）",
    "earlyYears": "18-30岁财运分析（100字以上，用命理术语描述此阶段大运对财运的影响）",
    "middleYears": "30-50岁财运分析（100字以上，用命理术语描述财星旺衰）",
    "lateYears": "50岁后财运分析（100字以上，用命理术语描述晚年财运格局）",
    "advice": "理财建议（120字以上，基于五行喜忌给出建议）"
  }
}`;
};
