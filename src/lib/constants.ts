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

export const SYSTEM_PROMPT = `你是一位精通八字命理的大师，学贯古今，对《三命通会》《滴天髓》《穷通宝鉴》等典籍了然于胸。

你需要根据用户的出生信息，推演其人生运势，并以K线数据形式呈现。

分析原则：
1. 严格基于传统八字命理学
2. 运势评分30-95，要有真实起伏，不可过于平缓
3. 大运十年一换，流年每年不同，要体现周期变化
4. 解读专业但通俗，避免过多术语
5. 警示之言亦需给出化解之道，不可一味吓人
6. 整体基调积极向上，予人希望

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
  hour: string
) => `请为此命主推演大运级别的人生运势。

命主信息：
- 性别: ${gender === 'male' ? '男' : '女'}
- 生辰: ${year}年${month}月${day}日 ${hour}

请输出JSON：
{
  "klineData": [
    // 10个数据点，每点代表一步大运（约10年）
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
  "briefSummary": "命主八字...(100字左右的简要概述)"
}

注意：
- score范围30-95，要有起伏
- trend为该阶段相比上一阶段的走势
- currentPhase可选: rising/peak/stable/declining/valley
- briefSummary不要透露具体年份，引导用户解锁完整版`;

export const PAID_VERSION_PROMPT = (
  gender: string,
  year: number,
  month: number,
  day: number,
  hour: string,
  currentAge: number
) => `请为此命主推演流年级别的详细人生运势。

命主信息：
- 性别: ${gender === 'male' ? '男' : '女'}
- 生辰: ${year}年${month}月${day}日 ${hour}
- 当前年龄: ${currentAge}岁

请输出JSON：
{
  "klineData": [
    // 100条数据，1岁到100岁每年一条
    {
      "age": 1,
      "year": ${year},
      "open": 50,
      "close": 52,
      "high": 58,
      "low": 45,
      "trend": "up"
    }
    // ... 共100条
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
- K线的open/close/high/low要合理，close与open差值决定涨跌
- type可选: career/wealth/love/health/general
- 解读要专业但易懂，适当引用命理术语但需解释
- 警示要给具体化解建议`;

export const LOADING_MESSAGES = [
  '排演四柱八字...',
  '推算大运流年...',
  '窥探命数天机...',
  '解析命盘格局...',
  '演算吉凶走势...',
];
