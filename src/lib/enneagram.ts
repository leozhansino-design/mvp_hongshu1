/**
 * 九型人格计分逻辑和类型定义
 */

// 九型人格类型名称
export const ENNEAGRAM_TYPE_NAMES: Record<number, string> = {
  1: '完美型',
  2: '助人型',
  3: '成就型',
  4: '自我型',
  5: '理智型',
  6: '忠诚型',
  7: '活跃型',
  8: '领袖型',
  9: '和平型',
};

// 九型人格类型英文名称
export const ENNEAGRAM_TYPE_ENGLISH_NAMES: Record<number, string> = {
  1: 'The Reformer',
  2: 'The Helper',
  3: 'The Achiever',
  4: 'The Individualist',
  5: 'The Investigator',
  6: 'The Loyalist',
  7: 'The Enthusiast',
  8: 'The Challenger',
  9: 'The Peacemaker',
};

// 侧翼组合名称
export const WING_NAMES: Record<string, string> = {
  '1w9': '理想主义者',
  '1w2': '倡导者',
  '2w1': '仆人',
  '2w3': '主人',
  '3w2': '迷人者',
  '3w4': '专业人士',
  '4w3': '贵族',
  '4w5': '放浪诗人',
  '5w4': '偶像破坏者',
  '5w6': '问题解决者',
  '6w5': '守护者',
  '6w7': '好友',
  '7w6': '艺人',
  '7w8': '现实主义者',
  '8w7': '独立者',
  '8w9': '熊',
  '9w8': '裁判',
  '9w1': '梦想家',
};

// 九型人格详细描述
export const ENNEAGRAM_TYPE_DESCRIPTIONS: Record<number, {
  brief: string;
  coreDesire: string;
  coreFear: string;
  coreMotivation: string;
  strengths: string[];
  weaknesses: string[];
  growthDirection: number;
  stressDirection: number;
  healthyTraits: string[];
  unhealthyTraits: string[];
  famousPeople: string[];
  career: string[];
  relationship: string;
}> = {
  1: {
    brief: '完美型的人有强烈的是非观念，追求完美和正确。他们自律、有原则，努力改善自己和周围的一切。',
    coreDesire: '追求正确和完善',
    coreFear: '害怕犯错、被批评或变得腐败',
    coreMotivation: '希望正确行事，努力追求更高的标准，改善一切',
    strengths: ['有原则', '有责任感', '追求卓越', '自律', '诚实'],
    weaknesses: ['过于苛刻', '难以放松', '压抑愤怒', '批判性强', '完美主义'],
    growthDirection: 7,
    stressDirection: 4,
    healthyTraits: ['宽容', '接纳不完美', '能够放松享受', '有幽默感'],
    unhealthyTraits: ['过度批判', '自以为是', '僵化', '压抑情绪'],
    famousPeople: ['甘地', '孔子', '王阳明'],
    career: ['律师', '法官', '教师', '编辑', '质量管理'],
    relationship: '完美型在感情中是忠诚可靠的伴侣，但需要学习接纳伴侣的不完美。'
  },
  2: {
    brief: '助人型的人温暖、关怀他人，渴望被爱和被需要。他们慷慨、善解人意，总是优先考虑他人的需要。',
    coreDesire: '被爱和被需要',
    coreFear: '害怕不被爱、不被需要',
    coreMotivation: '希望被爱、表达对他人的爱、得到认可',
    strengths: ['关怀他人', '慷慨', '善解人意', '热情', '乐于助人'],
    weaknesses: ['过度付出', '忽视自己', '需要被需要', '操控性', '难以接受帮助'],
    growthDirection: 4,
    stressDirection: 8,
    healthyTraits: ['关注自己的需要', '无条件的爱', '情绪成熟', '独立'],
    unhealthyTraits: ['操控', '自我牺牲', '依赖他人的感激', '自欺'],
    famousPeople: ['特蕾莎修女', '费雯丽'],
    career: ['护士', '社工', '心理咨询师', '教师', '客服'],
    relationship: '助人型是体贴入微的伴侣，但需要学会表达自己的需要，而不只是照顾他人。'
  },
  3: {
    brief: '成就型的人追求成功和认可，具有很强的适应能力和效率。他们有目标导向，善于自我展示。',
    coreDesire: '追求成功和被钦佩',
    coreFear: '害怕失败和一无是处',
    coreMotivation: '希望与众不同、有所成就、得到认可',
    strengths: ['高效', '有目标', '适应性强', '自信', '善于激励'],
    weaknesses: ['过于关注形象', '竞争性强', '工作狂', '回避情感', '虚荣'],
    growthDirection: 6,
    stressDirection: 9,
    healthyTraits: ['真诚', '关注内在价值', '能够慢下来', '情感真实'],
    unhealthyTraits: ['欺骗性', '虚荣', '嫉妒', '恶性竞争'],
    famousPeople: ['奥普拉', '贝克汉姆'],
    career: ['企业家', '销售', '营销', '演员', '律师'],
    relationship: '成就型需要学会放下形象，展现真实的自己，让伴侣看到你工作之外的一面。'
  },
  4: {
    brief: '自我型的人敏感、有创意，追求独特和真实。他们有丰富的内心世界，善于表达情感。',
    coreDesire: '追求独特和真实的自我表达',
    coreFear: '害怕没有身份认同或个人意义',
    coreMotivation: '希望表达自己的独特性，创造美和意义',
    strengths: ['创造力强', '敏感', '真诚', '有深度', '善于表达'],
    weaknesses: ['情绪化', '自我中心', '容易忧郁', '羡慕他人', '不切实际'],
    growthDirection: 1,
    stressDirection: 2,
    healthyTraits: ['情绪平衡', '自律', '接纳普通', '活在当下'],
    unhealthyTraits: ['自我沉溺', '戏剧化', '自我厌恶', '抑郁'],
    famousPeople: ['梵高', '弗吉尼亚·伍尔夫', '王家卫'],
    career: ['艺术家', '作家', '设计师', '音乐家', '心理治疗师'],
    relationship: '自我型在感情中深情而浪漫，但需要学会接受平淡，不要总是追求戏剧性。'
  },
  5: {
    brief: '理智型的人善于观察和分析，追求知识和理解。他们独立、冷静，喜欢深入研究感兴趣的领域。',
    coreDesire: '追求知识和理解',
    coreFear: '害怕无能、无用或无助',
    coreMotivation: '希望有能力、有知识，理解世界的运作',
    strengths: ['分析能力强', '独立', '客观', '专注', '有洞察力'],
    weaknesses: ['回避情感', '孤僻', '囤积资源', '难以行动', '冷漠'],
    growthDirection: 8,
    stressDirection: 7,
    healthyTraits: ['参与生活', '情感开放', '果断行动', '慷慨分享'],
    unhealthyTraits: ['极度孤立', '偏执', '虚无主义', '与现实脱节'],
    famousPeople: ['爱因斯坦', '比尔·盖茨', '史蒂芬·霍金'],
    career: ['科学家', '研究员', '程序员', '分析师', '学者'],
    relationship: '理智型需要学会分享情感，让伴侣进入你的内心世界，而不只是知识世界。'
  },
  6: {
    brief: '忠诚型的人负责任、可靠，重视安全和忠诚。他们善于预见问题，对身边的人非常忠诚。',
    coreDesire: '追求安全和支持',
    coreFear: '害怕没有支持和指导',
    coreMotivation: '希望得到安全感，得到他人的支持和保证',
    strengths: ['忠诚', '负责任', '有准备', '合作', '务实'],
    weaknesses: ['焦虑', '多疑', '优柔寡断', '对权威矛盾', '过度警惕'],
    growthDirection: 9,
    stressDirection: 3,
    healthyTraits: ['自信', '勇敢', '信任自己', '内心平静'],
    unhealthyTraits: ['偏执', '过度依赖', '自我怀疑', '攻击性'],
    famousPeople: ['戴安娜王妃', '汤姆·汉克斯'],
    career: ['警察', '医护人员', '行政管理', '金融分析', '安全专家'],
    relationship: '忠诚型是可靠的伴侣，但需要学会信任伴侣和自己，不要总是预设最坏的情况。'
  },
  7: {
    brief: '活跃型的人乐观、有活力，追求快乐和多样性。他们充满创意，喜欢体验生活的各种可能性。',
    coreDesire: '追求快乐和满足',
    coreFear: '害怕被剥夺和限制',
    coreMotivation: '希望快乐、避免痛苦，保持自由和多样性',
    strengths: ['乐观', '有创意', '活力充沛', '多才多艺', '风趣'],
    weaknesses: ['逃避问题', '缺乏专注', '冲动', '过度承诺', '难以承受痛苦'],
    growthDirection: 5,
    stressDirection: 1,
    healthyTraits: ['专注', '能够面对痛苦', '深入而非广泛', '满足当下'],
    unhealthyTraits: ['逃避现实', '成瘾行为', '不负责任', '狂躁'],
    famousPeople: ['罗宾·威廉姆斯', '史蒂文·斯皮尔伯格'],
    career: ['创业者', '旅游行业', '娱乐业', '广告创意', '活动策划'],
    relationship: '活跃型让感情充满乐趣，但需要学会停下来，深入了解伴侣，面对关系中的困难。'
  },
  8: {
    brief: '领袖型的人强大、自信，追求掌控和保护弱小。他们直接、果断，不怕挑战和冲突。',
    coreDesire: '追求自主和掌控',
    coreFear: '害怕被伤害或被控制',
    coreMotivation: '希望自给自足、强大，保护自己和重要的人',
    strengths: ['果断', '有力量', '保护他人', '直接', '有领导力'],
    weaknesses: ['控制欲强', '攻击性', '不易示弱', '霸道', '报复心'],
    growthDirection: 2,
    stressDirection: 5,
    healthyTraits: ['温柔', '能够示弱', '关怀他人', '善用力量'],
    unhealthyTraits: ['暴力', '独裁', '无情', '破坏性'],
    famousPeople: ['丘吉尔', '马丁·路德·金'],
    career: ['企业家', '政治家', '律师', '管理者', '军人'],
    relationship: '领袖型是强大的保护者，但需要学会展现脆弱的一面，让伴侣看到你温柔的内心。'
  },
  9: {
    brief: '和平型的人温和、包容，追求内心平静和和谐。他们善于调解冲突，能理解各方观点。',
    coreDesire: '追求内心平静和和谐',
    coreFear: '害怕失去联结和分裂',
    coreMotivation: '希望保持内心和外在的和平，避免冲突',
    strengths: ['包容', '善于调解', '稳定', '随和', '能理解他人'],
    weaknesses: ['逃避冲突', '被动', '拖延', '忽视自己', '麻木'],
    growthDirection: 3,
    stressDirection: 6,
    healthyTraits: ['有主见', '积极行动', '关注自己', '表达愤怒'],
    unhealthyTraits: ['麻木', '顽固', '消极攻击', '与自己脱节'],
    famousPeople: ['林肯', '达赖喇嘛'],
    career: ['外交官', '调解员', '人力资源', '咨询师', '护理'],
    relationship: '和平型是和谐的伴侣，但需要学会表达自己的意见和需要，不要总是为了和平而妥协。'
  },
};

// 计分结果接口
export interface EnneagramResult {
  scores: number[];           // 9种类型的得分 [type1Score, type2Score, ...]
  mainType: number;           // 主人格类型 1-9
  wingType: number;           // 侧翼类型
  mainTypeName: string;       // 如 "完美型"
  mainTypeEnglishName: string;
  wingTypeName: string;
  wingCombinationName: string; // 如 "放浪诗人"
  scorePercentages: number[]; // 各类型得分百分比
}

/**
 * 计算九型人格测试结果
 * @param answers 长度144的数组，true=是，false=否
 * @returns 计算结果
 */
export function calculateEnneagram(answers: boolean[]): EnneagramResult {
  if (answers.length !== 144) {
    throw new Error(`Expected 144 answers, got ${answers.length}`);
  }

  // 初始化9种类型得分
  const scores = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 索引0-8对应类型1-9

  // 计算得分：每9题一循环，第n题对应类型((n-1)%9)+1
  answers.forEach((answer, index) => {
    if (answer) {
      const typeIndex = index % 9; // 0-8
      scores[typeIndex] += 1;
    }
  });

  // 找主类型（得分最高）
  const maxScore = Math.max(...scores);
  const mainTypeIndex = scores.indexOf(maxScore);
  const mainType = mainTypeIndex + 1;

  // 找侧翼（相邻两个类型中得分更高的）
  // 九型人格是一个圆，所以1的相邻是9和2，9的相邻是8和1
  const leftWingIndex = mainTypeIndex === 0 ? 8 : mainTypeIndex - 1;
  const rightWingIndex = mainTypeIndex === 8 ? 0 : mainTypeIndex + 1;
  const wingTypeIndex = scores[leftWingIndex] >= scores[rightWingIndex] ? leftWingIndex : rightWingIndex;
  const wingType = wingTypeIndex + 1;

  // 计算得分百分比（最高16分，因为每种类型16题）
  const maxPossibleScore = 16;
  const scorePercentages = scores.map(score => Math.round((score / maxPossibleScore) * 100));

  // 获取侧翼组合名称
  const wingCombinationKey = `${mainType}w${wingType}`;
  const wingCombinationName = WING_NAMES[wingCombinationKey] || '';

  return {
    scores,
    mainType,
    wingType,
    mainTypeName: ENNEAGRAM_TYPE_NAMES[mainType],
    mainTypeEnglishName: ENNEAGRAM_TYPE_ENGLISH_NAMES[mainType],
    wingTypeName: ENNEAGRAM_TYPE_NAMES[wingType],
    wingCombinationName,
    scorePercentages,
  };
}

/**
 * 获取九型人格类型的详细信息
 */
export function getTypeDescription(type: number) {
  return ENNEAGRAM_TYPE_DESCRIPTIONS[type] || null;
}

/**
 * 生成报告数据
 */
export function generateEnneagramReport(result: EnneagramResult): {
  mainType: {
    number: number;
    name: string;
    englishName: string;
    description: typeof ENNEAGRAM_TYPE_DESCRIPTIONS[1];
  };
  wing: {
    number: number;
    name: string;
    combinationName: string;
  };
  scores: {
    type: number;
    name: string;
    score: number;
    percentage: number;
  }[];
  radarData: { type: string; score: number; fullMark: number }[];
} {
  const mainTypeDescription = getTypeDescription(result.mainType);

  // 生成各类型得分数据
  const scoresData = result.scores.map((score, index) => ({
    type: index + 1,
    name: ENNEAGRAM_TYPE_NAMES[index + 1],
    score,
    percentage: result.scorePercentages[index],
  }));

  // 生成雷达图数据
  const radarData = result.scores.map((score, index) => ({
    type: ENNEAGRAM_TYPE_NAMES[index + 1],
    score,
    fullMark: 16,
  }));

  return {
    mainType: {
      number: result.mainType,
      name: result.mainTypeName,
      englishName: result.mainTypeEnglishName,
      description: mainTypeDescription!,
    },
    wing: {
      number: result.wingType,
      name: result.wingTypeName,
      combinationName: result.wingCombinationName,
    },
    scores: scoresData,
    radarData,
  };
}
