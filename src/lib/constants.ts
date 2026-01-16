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
3. **【重要】曲线趋势要求**：
   - score范围30-95，但必须有**清晰的整体趋势**，不要上下随机波动
   - 根据命局选择一种整体走势：低开高走（早年艰难晚年幸福）、高开低走（早年顺遂晚年平淡）、先抑后扬（中年低谷后期上升）、平稳上升、波浪上升等
   - 例如低开高走：1岁45分→20岁50分→40岁65分→60岁75分→80岁80分，整体向上
   - 例如高开低走：1岁75分→20岁70分→40岁60分→60岁55分→80岁50分，整体向下
   - 5个点之间的分数变化要符合趋势，不要忽高忽低
4. reason限10字内
5. **highlights和warnings各选1-2个**最关键的即可
6. 内容简洁，点到为止，避免过度详细
7. **重要**：所有评分必须根据实际命局分析得出，不要照抄示例中的75、80等数值`;

export const PAID_VERSION_PROMPT = (
  gender: string,
  year: number,
  bazi: BaziForPrompt,
  daYunList: DaYunForPrompt[],
  currentAge: number
) => `请基于以下已排好的八字和大运，进行**极其详细深入**的命理分析（完整精批版）。

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
2. **【关键】chartPoints曲线趋势要求**：
   - 需80个点（1-80岁，每年一条），只需score（30-95），reason限15字
   - **必须有清晰的整体趋势线**，不要每年都上下波动！
   - 根据命局确定一个主趋势：低开高走、高开低走、先抑后扬、平稳上升、M型（两个高峰）、W型（中年低谷）等
   - 例如低开高走：1-20岁在40-50分区间缓慢上升→20-40岁50-65分稳步上升→40-60岁65-80分快速上升→60-80岁75-85分高位稳定
   - 例如先抑后扬：1-30岁60-55分缓慢下降→30-45岁45-40分低谷期→45-65岁40-70分快速上升→65-80岁70-80分高位
   - 在每个10年大运内，允许有1-3分的小波动（如某年遇流年不利稍降2分），但不要每年都大起大落
   - **禁止出现**：连续上下跳跃（如65→72→60→75→58这种锯齿状），要保持趋势的连续性和合理性
3. daYunList使用上面提供的大运，添加详细description（80字）
4. highlights选8-12个关键年份，warnings选5-8个需要注意的年份
5. tenGods每项需详解40字，说明该十神在命局中的作用和影响
6. shenSha需列出该命局中的主要吉神和凶煞，各2-4个
7. futureYears需列出从今年开始的连续5年运势详解
8. keyYears需选出3-5个最关键的年份进行深度解析
9. improveAdvice需针对各个维度给出切实可行的改运建议
10. **重要**：所有评分必须根据实际命局分析得出，不要照抄示例中的75、80等数值
11. **内容充实**：所有文字描述必须达到或超过规定字数，内容要详实、专业、有针对性、实用性强`;

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
  isPaid: boolean
) => `你是一位精通八字命理的财运分析师。请根据以下八字信息，生成此人18-80岁的累计财富曲线数据。

【命主信息】
性别: ${gender === 'male' ? '乾造' : '坤造'}
出生年: ${year}年

【八字四柱】（已排好，请直接使用）
年柱: ${bazi.yearPillar} | 月柱: ${bazi.monthPillar} | 日柱: ${bazi.dayPillar} | 时柱: ${bazi.hourPillar}
生肖: ${bazi.zodiac} | 农历: ${bazi.lunarDate}

【大运】（已排好，请直接使用）
${daYunList.map(d => `${d.startAge}-${d.endAge}岁: ${d.ganZhi}`).join(' | ')}

分析要求：
1. 基于八字中的财星（正财、偏财）、食伤生财、官杀护财等格局分析
2. 结合大运流年的财运变化
3. 诚实分析，不为讨好用户而美化结果
4. 有的人财运一般就如实显示，不是每个人都能大富大贵
5. 曲线是累计财富，会有上升也会有下降（消费、亏损、投资失败等）
6. 下降幅度要合理，不要出现断崖式暴跌

【财富范围参考】根据八字格局选择合适的财富范围（非常重要，请严格区分）：
- 财星弱/无财星：峰值50-200万（普通打工者）
- 财星一般：峰值200-600万（小有积蓄）
- 财星中等：峰值600-1500万（中产阶级）
- 财星旺盛：峰值1500-4000万（较为富裕）
- 大财格局（食伤生财/财官双美）：峰值4000万-2亿（大富）
每个八字都不同，请根据实际命盘判断，不要千篇一律！

请返回以下JSON格式：
{
  "wealthRange": {
    "min": 0,
    "max": 数字（根据命局设定合适的Y轴最大值）,
    "unit": "万"
  },
  "wealthType": "对应的类型",
  "highlights": {
    "peakAge": 数字（巅峰年龄）,
    "peakWealth": 数字（巅峰财富，单位万）,
    "maxGrowthAge": 数字（最大增长年龄）,
    "maxGrowthAmount": 数字（最大增长金额，单位万）,
    "maxLossAge": 数字（最大回撤年龄，如无明显回撤可设为0）,
    "maxLossAmount": 数字（最大回撤金额，单位万）
  },
  "dataPoints": [
    ${isPaid
      ? '共63个点，18-80岁每年一个，格式：{"age": 18, "wealth": 0}, {"age": 19, "wealth": 数字}, ...'
      : '共11个点，每6年一个点：18,24,30,36,42,48,54,60,66,72,78岁'
    }
  ],
  "analysis": {
    "summary": "您的八字财星分析总结（150字以上，包含专业术语如正财偏财、食伤生财等）...",
    "earlyYears": "18-30岁财运分析（100字以上，具体分析这个阶段的大运财运）...",
    "middleYears": "30-50岁财运分析（100字以上，结合大运详细分析）...",
    "lateYears": "50岁后财运分析（100字以上）...",
    "advice": "理财建议（120字以上，包含具体可操作的建议）..."
  }
}

重要规则：
1. dataPoints必须有${isPaid ? '63' : '11'}个点
2. wealth单位是万元，表示累计资产
3. 曲线要符合命理逻辑，与八字格局匹配
4. wealthType必须是以下之一：早期暴富型、大器晚成型、稳步上升型、过山车型、平稳一生型、先扬后抑型
5. 财富数值要真实反映命盘，普通命盘峰值可能只有100-300万
6. 曲线可以下降（消费、亏损等），但要合理
7. highlights数值要与dataPoints数据一致
8. 不同的八字要给出差异化的财富曲线，避免雷同！`;

export const WEALTH_LOADING_MESSAGES = [
  '解析财星格局...',
  '分析正财偏财...',
  '推算财运周期...',
  '计算大运财运...',
  '演算流年财运...',
  '生成财富曲线...',
  'AI深度分析中...',
];
