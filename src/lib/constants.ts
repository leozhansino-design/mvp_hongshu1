export const API_CONFIG = {
  baseUrl: 'https://api.bltcy.ai/v1',
  apiKey: 'sk-z4a6qvhXCbfboOyBwL33BR66mJdHTKj5NO4pfIUSkLBm2jGF',
  model: 'gemini-2.5-flash-preview-05-20',
};

export const FREE_USAGE_LIMIT = 3;

export const STORAGE_KEYS = {
  usage: 'lc_usage',
  device: 'lc_device',
  resultPrefix: 'lc_result_',
};

export const SYSTEM_PROMPT = `你是一位精通八字命理的AI大师，融合传统命理学与现代数据分析技术。
你对《三命通会》《滴天髓》《穷通宝鉴》等典籍了然于胸，同时能够将复杂的命理信息转化为易于理解的可视化数据。

你需要根据用户的出生信息，进行以下分析：
1. 排出完整的八字命盘（年柱、月柱、日柱、时柱）
2. 计算真太阳时并转换为农历日期
3. 推演人生运势并以K线数据形式呈现
4. 提供核心命理分析

分析原则：
1. 严格基于传统八字命理学进行推演
2. 运势评分范围30-95，要有真实起伏，体现人生的高低起落
3. 大运十年一换，流年每年不同，要体现周期变化规律
4. 解读专业但通俗易懂，适当解释命理术语
5. 警示之言亦需给出化解之道，整体基调积极向上

输出规则：
- 严格输出JSON格式
- 不要markdown代码块
- 不要任何解释性文字
- 只输出JSON本身`;

export const FREE_VERSION_PROMPT = (
  gender: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  calendarType: string,
  birthPlace?: string
) => `请为此命主进行八字排盘和大运级别的人生运势推演。

命主信息：
- 性别: ${gender === 'male' ? '男' : '女'}
- 出生日期: ${year}年${month}月${day}日 ${hour}时${minute}分
- 历法: ${calendarType === 'lunar' ? '农历' : '公历'}
${birthPlace ? `- 出生地: ${birthPlace}` : ''}

请输出JSON：
{
  "baziChart": {
    "yearPillar": {"heavenlyStem": "甲", "earthlyBranch": "子", "fullName": "甲子"},
    "monthPillar": {"heavenlyStem": "乙", "earthlyBranch": "丑", "fullName": "乙丑"},
    "dayPillar": {"heavenlyStem": "丙", "earthlyBranch": "寅", "fullName": "丙寅"},
    "hourPillar": {"heavenlyStem": "丁", "earthlyBranch": "卯", "fullName": "丁卯"},
    "zodiac": "鼠",
    "lunarDate": "农历X年X月X日",
    "solarTime": "真太阳时 XX:XX"
  },
  "klineData": [
    {"age": 1, "score": 55, "trend": "up"},
    {"age": 10, "score": 62, "trend": "up"},
    {"age": 20, "score": 58, "trend": "down"},
    {"age": 30, "score": 70, "trend": "up"},
    {"age": 40, "score": 75, "trend": "up"},
    {"age": 50, "score": 68, "trend": "down"},
    {"age": 60, "score": 72, "trend": "up"},
    {"age": 70, "score": 65, "trend": "down"},
    {"age": 80, "score": 60, "trend": "down"},
    {"age": 90, "score": 55, "trend": "down"}
  ],
  "currentPhase": "rising",
  "highlightCount": 3,
  "warningCount": 2,
  "briefSummary": "命主八字日主为X，生于X月...(100字左右的简要概述，不要透露具体年份)",
  "coreAnalysis": "核心命理分析：日主X生于X月，X为用神...(200字左右的核心命理解读)",
  "dayMasterAnalysis": {
    "dayMaster": "甲木",
    "strength": "身旺/身弱",
    "description": "日主X代表...，生于X月..."
  },
  "fiveElements": {
    "wood": 2,
    "fire": 1,
    "earth": 2,
    "metal": 1,
    "water": 2
  },
  "luckyDirection": "东方、东南方",
  "luckyColor": "绿色、青色",
  "luckyNumber": "3、8",
  "personality": "性格特点概述(80字左右)",
  "careerHint": "事业方向提示(60字左右)",
  "wealthHint": "财运概况提示(60字左右)"
}

注意：
- baziChart必须根据出生时间准确排出四柱八字
- 如果是公历需要先转换为农历再排八字
- score范围30-95，要有真实起伏
- trend为该阶段相比上一阶段的走势
- currentPhase可选: rising/peak/stable/declining/valley
- coreAnalysis要专业但易懂
- fiveElements中的数字代表八字中该五行的数量
- 各分析内容要专业但通俗易懂`;

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
) => `请为此命主进行八字排盘和流年级别的详细人生运势推演。

命主信息：
- 性别: ${gender === 'male' ? '男' : '女'}
- 出生日期: ${year}年${month}月${day}日 ${hour}时${minute}分
- 历法: ${calendarType === 'lunar' ? '农历' : '公历'}
- 当前年龄: ${currentAge}岁
${birthPlace ? `- 出生地: ${birthPlace}` : ''}

请输出JSON：
{
  "baziChart": {
    "yearPillar": {"heavenlyStem": "甲", "earthlyBranch": "子", "fullName": "甲子"},
    "monthPillar": {"heavenlyStem": "乙", "earthlyBranch": "丑", "fullName": "乙丑"},
    "dayPillar": {"heavenlyStem": "丙", "earthlyBranch": "寅", "fullName": "丙寅"},
    "hourPillar": {"heavenlyStem": "丁", "earthlyBranch": "卯", "fullName": "丁卯"},
    "zodiac": "鼠",
    "lunarDate": "农历X年X月X日",
    "solarTime": "真太阳时 XX:XX"
  },
  "klineData": [
    {
      "age": 1,
      "year": ${year},
      "open": 50,
      "close": 52,
      "high": 58,
      "low": 45,
      "trend": "up"
    }
    // ... 共100条数据，1岁到100岁每年一条
  ],
  "highlights": [
    {
      "age": 28,
      "year": ${year + 27},
      "score": 88,
      "type": "career",
      "title": "事业腾飞",
      "description": "此年木火通明，印星高照，利于..."
    }
    // 3-5个高光年份
  ],
  "warnings": [
    {
      "age": 35,
      "year": ${year + 34},
      "score": 42,
      "type": "health",
      "title": "身体欠安",
      "description": "流年冲克，肾水受损...",
      "advice": "宜静养，忌操劳，可佩戴..."
    }
    // 2-3个警示年份
  ],
  "currentPhase": "rising",
  "summary": {
    "personality": "日主为...，性格...(200字)",
    "career": "事业方面...(200字)",
    "wealth": "财运方面...(200字)",
    "love": "姻缘方面...(200字)",
    "health": "健康方面...(150字)"
  },
  "luckyElements": ["木", "火"],
  "unluckyElements": ["金"]
}

注意：
- baziChart必须根据出生时间准确排出四柱八字
- K线的open/close/high/low要合理，close与open差值决定涨跌
- type可选: career/wealth/love/health/general
- 解读要专业但易懂，适当引用命理术语但需解释
- 警示要给具体化解建议`;

export const LOADING_MESSAGES = [
  '正在排演四柱八字...',
  '计算真太阳时...',
  '推算大运流年...',
  '解析命盘格局...',
  '演算吉凶走势...',
  'AI深度分析中...',
];
