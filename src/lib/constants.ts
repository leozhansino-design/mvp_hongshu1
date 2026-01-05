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
2. **评分机制**: 所有维度评分0-100分
3. **数据起伏**: 分数必须呈现明显波动，体现人生高峰与低谷，禁止输出平滑曲线
4. **大运规则**: 大运十年一换，顺行为甲子→乙丑→丙寅，逆行为甲子→癸亥→壬戌

**分析原则:**
1. 严格基于传统八字命理学推演
2. 大运、流年、命局三者结合判断吉凶
3. 解读专业但通俗易懂，专业术语需解释
4. 警示之言必须给出化解之道

**输出规则（极其重要）:**
- 直接输出纯JSON，第一个字符必须是{
- 禁止使用\`\`\`json或\`\`\`等markdown代码块
- 禁止在JSON前后添加任何解释性文字
- 确保JSON完整闭合，所有括号配对正确`;

export const FREE_VERSION_PROMPT = (
  gender: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  calendarType: string,
  birthPlace?: string
) => `请为此命主进行完整八字排盘和大运级别的人生运势推演。

命主信息：
- 性别: ${gender === 'male' ? '男(乾造)' : '女(坤造)'}
- 出生日期: ${year}年${month}月${day}日 ${hour}时${minute}分
- 历法: ${calendarType === 'lunar' ? '农历' : '公历'}
${birthPlace ? `- 出生地: ${birthPlace}（用于计算真太阳时）` : ''}

请输出以下JSON结构：
{
  "baziChart": {
    "yearPillar": {"heavenlyStem": "甲", "earthlyBranch": "子", "fullName": "甲子"},
    "monthPillar": {"heavenlyStem": "乙", "earthlyBranch": "丑", "fullName": "乙丑"},
    "dayPillar": {"heavenlyStem": "丙", "earthlyBranch": "寅", "fullName": "丙寅"},
    "hourPillar": {"heavenlyStem": "丁", "earthlyBranch": "卯", "fullName": "丁卯"},
    "zodiac": "生肖",
    "lunarDate": "农历X年X月X日",
    "solarTime": "真太阳时 HH:MM"
  },
  "summary": "命理总评，综合分析此命格局高低、用神喜忌、一生大势（150字）",
  "summaryScore": 75,
  "personality": "性格分析：根据日主十神分析性格特征、行为模式、思维方式（100字）",
  "personalityScore": 80,
  "career": "事业分析：适合的行业、职业发展方向、贵人方位（100字）",
  "careerScore": 72,
  "wealth": "财运分析：正财偏财、理财方式、财运高峰期（100字）",
  "wealthScore": 68,
  "marriage": "婚姻分析：婚配特点、感情模式、最佳婚配年份（100字）",
  "marriageScore": 75,
  "health": "健康分析：需注意的身体部位、养生建议（80字）",
  "healthScore": 70,
  "fengShui": "风水开运：吉利方位、居住环境建议、开运物品（80字）",
  "fengShuiScore": 78,
  "family": "六亲分析：与父母、兄弟、子女的缘分关系（80字）",
  "familyScore": 72,
  "dayMaster": {
    "stem": "甲",
    "element": "木",
    "strength": "身旺/身弱/中和",
    "description": "日主特质描述（60字）"
  },
  "usefulGod": "用神喜忌说明（60字）",
  "fiveElements": {
    "wood": 2,
    "fire": 1,
    "earth": 2,
    "metal": 1,
    "water": 2
  },
  "luckyInfo": {
    "direction": "东方、东南方",
    "color": "绿色、青色",
    "number": "3、8",
    "industry": "适合从事的行业类型"
  },
  "chartPoints": [
    {"age": 1, "score": 55, "daYun": "童限", "ganZhi": "庚午", "reason": "开局平稳，家庭庇护"},
    {"age": 10, "score": 62, "daYun": "甲子", "ganZhi": "庚辰", "reason": "学业渐进，天资聪颖"},
    {"age": 20, "score": 58, "daYun": "乙丑", "ganZhi": "庚寅", "reason": "初入社会，跌宕历练"},
    {"age": 30, "score": 75, "daYun": "丙寅", "ganZhi": "庚子", "reason": "事业起步，贵人相助"},
    {"age": 40, "score": 82, "daYun": "丁卯", "ganZhi": "庚戌", "reason": "中年得志，名利双收"},
    {"age": 50, "score": 70, "daYun": "戊辰", "ganZhi": "庚申", "reason": "守成为主，稳中求进"},
    {"age": 60, "score": 75, "daYun": "己巳", "ganZhi": "庚午", "reason": "晚年安泰，子孙孝顺"},
    {"age": 70, "score": 68, "daYun": "庚午", "ganZhi": "庚辰", "reason": "颐养天年，修身养性"},
    {"age": 80, "score": 62, "daYun": "辛未", "ganZhi": "庚寅", "reason": "福寿绑身，平安顺遂"},
    {"age": 90, "score": 55, "daYun": "壬申", "ganZhi": "庚子", "reason": "寿终正寝，功德圆满"}
  ],
  "highlights": [
    {"age": 28, "year": ${year + 27}, "title": "事业高峰", "description": "此年印星高照，贵人助力，利于..."},
    {"age": 42, "year": ${year + 41}, "title": "财运亨通", "description": "偏财入命，投资有利..."}
  ],
  "warnings": [
    {"age": 35, "year": ${year + 34}, "title": "健康警示", "description": "注意肝胆问题...", "advice": "宜静养，多运动，佩戴..."}
  ],
  "currentPhase": "rising"
}

**重要规则：**
1. baziChart必须根据出生时间准确排出四柱八字（公历需先转农历）
2. chartPoints必须有10个数据点（1, 10, 20, 30, 40, 50, 60, 70, 80, 90岁）
3. 每个chartPoints的reason必须20-30字，简洁描述该阶段运势特征
4. daYun为该阶段所行大运的干支，ganZhi为代表流年干支
5. score范围30-95，必须有明显波动起伏
6. 所有分析内容必须基于八字命理，有理有据`;

export const PAID_VERSION_PROMPT = (
  gender: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  calendarType: string,
  currentAge: number,
  birthPlace?: string
) => `请为此命主进行完整八字排盘和流年级别的详细人生运势推演。

命主信息：
- 性别: ${gender === 'male' ? '男(乾造)' : '女(坤造)'}
- 出生日期: ${year}年${month}月${day}日 ${hour}时${minute}分
- 历法: ${calendarType === 'lunar' ? '农历' : '公历'}
- 当前虚岁: ${currentAge}岁
${birthPlace ? `- 出生地: ${birthPlace}（用于计算真太阳时）` : ''}

请输出以下JSON结构：
{
  "baziChart": {
    "yearPillar": {"heavenlyStem": "甲", "earthlyBranch": "子", "fullName": "甲子"},
    "monthPillar": {"heavenlyStem": "乙", "earthlyBranch": "丑", "fullName": "乙丑"},
    "dayPillar": {"heavenlyStem": "丙", "earthlyBranch": "寅", "fullName": "丙寅"},
    "hourPillar": {"heavenlyStem": "丁", "earthlyBranch": "卯", "fullName": "丁卯"},
    "zodiac": "生肖",
    "lunarDate": "农历X年X月X日",
    "solarTime": "真太阳时 HH:MM"
  },
  "summary": "命理总评（200字）：综合分析命格层次、格局高低、用神喜忌、一生大势走向",
  "summaryScore": 75,
  "personality": "性格深度分析（150字）：日主特质、十神配置对性格影响、行为模式、人际交往特点",
  "personalityScore": 80,
  "career": "事业详解（150字）：适合行业、职位发展、创业方向、事业贵人、最佳发展期",
  "careerScore": 72,
  "wealth": "财运详解（150字）：正财偏财格局、理财建议、投资方向、财运周期、破财风险",
  "wealthScore": 68,
  "marriage": "婚姻详解（150字）：最佳婚配对象、感情模式、婚姻质量、适婚年龄、婚姻注意事项",
  "marriageScore": 75,
  "health": "健康详解（120字）：先天体质、易患疾病、需注意的身体部位、养生方案",
  "healthScore": 70,
  "fengShui": "风水开运（120字）：吉利方位、居住选择、办公布局、开运物品、颜色搭配",
  "fengShuiScore": 78,
  "family": "六亲详解（120字）：父母缘、兄弟缘、子女缘、配偶缘、贵人缘分析",
  "familyScore": 72,
  "dayMaster": {
    "stem": "甲",
    "element": "木",
    "strength": "身旺/身弱/中和",
    "description": "日主特质详细描述，包括日主在该月令的状态（100字）"
  },
  "usefulGod": "用神喜忌详解：分析用神、喜神、忌神、仇神，及其对命局的影响（100字）",
  "tenGods": {
    "正官": "官星分析",
    "七杀": "杀星分析",
    "正印": "印星分析",
    "偏印": "枭印分析",
    "比肩": "比肩分析",
    "劫财": "劫财分析",
    "食神": "食神分析",
    "伤官": "伤官分析",
    "正财": "正财分析",
    "偏财": "偏财分析"
  },
  "fiveElements": {
    "wood": 2,
    "fire": 1,
    "earth": 2,
    "metal": 1,
    "water": 2
  },
  "luckyInfo": {
    "direction": "东方、东南方",
    "color": "绿色、青色",
    "number": "3、8",
    "industry": "教育、文化、医疗、科技等",
    "partner": "适合与火、土命人合作"
  },
  "daYunList": [
    {"startAge": 1, "endAge": 9, "ganZhi": "童限", "description": "幼年运程概述"},
    {"startAge": 10, "endAge": 19, "ganZhi": "甲子", "description": "此运特点..."},
    {"startAge": 20, "endAge": 29, "ganZhi": "乙丑", "description": "此运特点..."}
  ],
  "chartPoints": [
    {
      "age": 1,
      "year": ${year},
      "daYun": "童限",
      "ganZhi": "X年",
      "open": 50,
      "close": 55,
      "high": 60,
      "low": 45,
      "score": 55,
      "reason": "开局平稳，承蒙家庭呵护"
    }
  ],
  "highlights": [
    {
      "age": 28,
      "year": ${year + 27},
      "type": "career",
      "score": 88,
      "title": "事业腾飞",
      "ganZhi": "X年",
      "description": "此年木火通明，印星高照，贵人相助，适合跳槽升职...",
      "advice": "把握机会，主动出击"
    }
  ],
  "warnings": [
    {
      "age": 35,
      "year": ${year + 34},
      "type": "health",
      "score": 42,
      "title": "健康警示",
      "ganZhi": "X年",
      "description": "流年冲克日主，肝胆之气受损，注意情绪波动...",
      "advice": "宜静养，多运动，佩戴木质饰品，忌饮酒熬夜"
    }
  ],
  "yearlyFortune": {
    "thisYear": {
      "year": ${new Date().getFullYear()},
      "ganZhi": "X年",
      "score": 72,
      "overview": "今年运势概述（100字）",
      "career": "事业运（60字）",
      "wealth": "财运（60字）",
      "love": "感情运（60字）",
      "health": "健康运（60字）",
      "advice": "年度建议（80字）"
    },
    "nextYear": {
      "year": ${new Date().getFullYear() + 1},
      "ganZhi": "X年",
      "score": 68,
      "overview": "明年运势概述（100字）"
    }
  },
  "currentPhase": "rising"
}

**重要规则：**
1. baziChart必须根据出生时间准确排出四柱八字（公历需先转农历）
2. chartPoints必须有100个数据点（1岁到100岁，每年一条）
3. 每个chartPoints的reason必须20-30字，基于大运流年分析
4. K线的open/close/high/low必须合理，体现运势波动
5. highlights选3-5个人生高光年份，warnings选2-3个警示年份
6. 所有分析必须基于八字命理，引用专业术语并解释
7. type可选值: career/wealth/love/health/family/general
8. 大运列表daYunList需要覆盖主要人生阶段`;

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
