/**
 * 直播模式分析API
 * POST /api/live/analyze
 *
 * 返回用户可见的分析结果 + 主播专属的讲解稿子
 * 使用本地模板生成，无需外部AI调用
 */

import { NextRequest, NextResponse } from 'next/server';
import { BirthInfo } from '@/types';
import { BaziResult, DaYunItem } from '@/lib/bazi';
import { getFocusHint, FocusHint } from '@/types/master';

interface StreamerScript {
  openingLine: string;
  keyPoints: string[];
  talkingPoints: string[];
  suggestedPhrases: string[];
  backgroundKnowledge: string;
  emotionalHook: string;
}

// 五行属性
const WUXING_TRAITS: Record<string, { positive: string[]; challenge: string[]; advice: string }> = {
  '木': {
    positive: ['有创造力', '善于成长', '富有生机', '正直仁慈'],
    challenge: ['容易急躁', '过于理想化', '有时固执'],
    advice: '适合从事创意、教育、医疗等行业'
  },
  '火': {
    positive: ['热情开朗', '有感染力', '行动力强', '礼貌周到'],
    challenge: ['容易冲动', '有时过于张扬', '缺乏耐心'],
    advice: '适合从事销售、表演、公关等需要热情的工作'
  },
  '土': {
    positive: ['稳重踏实', '值得信赖', '有责任心', '善于积累'],
    challenge: ['有时过于保守', '不够灵活', '容易犹豫'],
    advice: '适合从事管理、金融、房地产等稳定行业'
  },
  '金': {
    positive: ['果断坚毅', '有原则', '执行力强', '重义气'],
    challenge: ['有时过于刚硬', '不够圆滑', '容易较真'],
    advice: '适合从事法律、金融、技术等需要精准的工作'
  },
  '水': {
    positive: ['聪明灵活', '善于变通', '有智慧', '适应力强'],
    challenge: ['有时过于多虑', '缺乏定性', '容易摇摆'],
    advice: '适合从事研究、咨询、贸易等需要灵活的工作'
  }
};

// 根据年龄和性别获取共情内容
function getEmotionalContent(age: number, gender: 'male' | 'female', focusType: FocusHint): {
  hook: string;
  phrases: string[];
  topics: string[];
} {
  if (age < 18) {
    return {
      hook: '作为家长，您一定非常关心孩子的未来发展。每个孩子都有自己独特的天赋，关键是找到适合他的发展方向。',
      phrases: [
        '这个孩子天生就有XXX方面的潜质，好好培养会很有出息',
        '学业上可能会在XXX阶段遇到一些挑战，但这恰恰是成长的机会',
        '建议重点关注XXX方面的培养，这是他的优势所在'
      ],
      topics: [
        '适合什么样的学习方式',
        '性格特点和相处之道',
        '未来适合的发展方向'
      ]
    };
  }

  if (age >= 60) {
    return {
      hook: '人生走到这个阶段，最重要的是身体健康和内心平静。您经历了这么多，现在是享受生活、安享晚年的时候了。',
      phrases: [
        '您这个命格晚年运势不错，但要注意XXX方面的保养',
        '从八字来看，您是个有福气的人，子女缘分也好',
        '建议平时多注意XXX，这样晚年会更加顺遂'
      ],
      topics: [
        '健康需要注意的方面',
        '晚年的福运',
        '与子女的关系'
      ]
    };
  }

  if (gender === 'male') {
    return {
      hook: '我能感受到您在事业上可能遇到了一些困惑。作为男人，肩上的担子确实不轻，但每个人的命运都有自己的节奏。',
      phrases: [
        '您这个八字事业心很强，但可能一直感觉怀才不遇',
        '接下来几年是您事业的关键期，要把握好机会',
        '财运方面，您属于XXX型的，适合XXX方式积累财富'
      ],
      topics: [
        '事业发展的最佳时机',
        '适合什么类型的工作',
        '贵人运和合作运'
      ]
    };
  } else {
    return {
      hook: '女人的心思最细腻，感情上的事情往往最让人牵挂。我能理解您现在的心情，每个人都渴望被理解、被珍惜。',
      phrases: [
        '您这个八字感情很丰富，但可能总是遇人不淑',
        '从桃花运来看，XXX年份会有比较好的姻缘',
        '您适合找XXX类型的另一半，这样感情会更稳定'
      ],
      topics: [
        '正缘什么时候会出现',
        '感情中需要注意什么',
        '婚姻运势如何'
      ]
    };
  }
}

// 生成运势曲线数据
function generateCurveData(baziResult: BaziResult, daYunResult: any, age: number, type: 'life' | 'wealth') {
  const dataPoints = [];
  const dayMaster = baziResult.dayMasterElement;

  // 基础运势值（根据日主五行）
  const baseScore = {
    '木': 60, '火': 65, '土': 55, '金': 62, '水': 58
  }[dayMaster] || 60;

  // 生成数据点
  for (let i = 0; i <= 12; i++) {
    const pointAge = 18 + i * 5;

    // 模拟运势波动
    let score = baseScore;

    // 根据大运信息调整
    if (daYunResult && daYunResult.daYunList) {
      const currentDaYun = daYunResult.daYunList.find(
        (d: DaYunItem) => pointAge >= d.startAge && pointAge <= d.endAge
      );
      if (currentDaYun) {
        // 简化的五行生克关系
        score += (Math.random() - 0.5) * 20;
      }
    }

    // 添加一些随机波动
    score += (Math.sin(pointAge / 10) * 10);
    score = Math.max(30, Math.min(95, score));

    const events = [
      '稳步发展', '机遇期', '调整期', '上升期', '平稳期',
      '转折点', '积累期', '收获期', '挑战期', '突破期'
    ];

    dataPoints.push({
      age: pointAge,
      score: Math.round(score),
      wealth: type === 'wealth' ? Math.round(score * pointAge / 10) : undefined,
      event: events[Math.floor(Math.random() * events.length)]
    });
  }

  // 找出高峰和低谷
  const sortedByScore = [...dataPoints].sort((a, b) => b.score - a.score);
  const peak = sortedByScore[0];
  const trough = sortedByScore[sortedByScore.length - 1];
  const current = dataPoints.find(d => d.age <= age && d.age + 5 > age) || dataPoints[0];

  if (type === 'life') {
    return {
      lifeCurve: {
        dataPoints,
        highlights: {
          peakAge: peak.age,
          peakScore: peak.score,
          troughAge: trough.age,
          troughScore: trough.score,
          currentAge: age,
          currentScore: current.score
        }
      }
    };
  } else {
    return {
      wealthCurve: {
        dataPoints: dataPoints.map(d => ({
          age: d.age,
          wealth: d.wealth || d.score * 5,
          event: d.event
        })),
        highlights: {
          peakAge: peak.age,
          peakWealth: (peak.wealth || peak.score * 5),
          maxGrowthAge: dataPoints[5]?.age || 43,
          maxGrowthAmount: Math.round(Math.random() * 50 + 30)
        }
      }
    };
  }
}

// 生成主播稿子
function generateStreamerScript(
  baziResult: BaziResult,
  daYunResult: any,
  age: number,
  gender: 'male' | 'female',
  focusHint: { type: FocusHint; label: string; description: string }
): StreamerScript {
  const dayMaster = baziResult.dayMasterElement;
  const traits = WUXING_TRAITS[dayMaster] || WUXING_TRAITS['土'];
  const emotional = getEmotionalContent(age, gender, focusHint.type);

  // 开场白
  const openingLines = [
    `从你的八字来看，你是一个${traits.positive[0]}的人，但内心深处可能一直在寻找一个答案...`,
    `一看你这个八字，就知道你不是一般人。${traits.positive[1]}，这是很多人没有的特质。`,
    `你这个命格很有意思，${dayMaster}命的人通常${traits.positive[2]}，但也容易${traits.challenge[0]}。`
  ];

  // 关键要点
  const keyPoints = [
    `核心特质：${dayMaster}命日主，天生${traits.positive.slice(0, 2).join('、')}`,
    `当前运势：${age}岁正处于${daYunResult?.daYunList?.[0]?.ganZhi || '关键'}运势期`,
    `重点关注：${focusHint.label}方面是您当前最需要关注的领域`
  ];

  // 延伸话题
  const talkingPoints = [
    ...emotional.topics,
    '五行平衡与调理建议',
    '流年运势的关键节点'
  ];

  // 推荐话术
  const suggestedPhrases = emotional.phrases.map(p =>
    p.replace(/XXX/g, traits.positive[Math.floor(Math.random() * traits.positive.length)])
  );

  // 知识补充
  const backgroundKnowledge = `
${dayMaster}命的人在五行中属于${dayMaster}，${traits.advice}。
${baziResult.eightChar.year}年柱代表祖上和16岁前的运势；
${baziResult.eightChar.month}月柱代表父母和16-32岁的运势；
${baziResult.eightChar.day}日柱代表自己和配偶；
${baziResult.eightChar.hour}时柱代表子女和晚年。
当前大运${daYunResult?.daYunList?.[0]?.ganZhi || ''}主导着近十年的整体运势走向。
  `.trim();

  return {
    openingLine: openingLines[Math.floor(Math.random() * openingLines.length)],
    emotionalHook: emotional.hook,
    keyPoints,
    talkingPoints,
    suggestedPhrases,
    backgroundKnowledge
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthInfo, baziResult, daYunResult, analysisType } = body as {
      birthInfo: BirthInfo;
      baziResult: BaziResult;
      daYunResult: { startInfo: string; daYunList: DaYunItem[] } | null;
      analysisType: 'life' | 'wealth';
    };

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthInfo.year;
    const focusHint = getFocusHint(birthInfo.year, birthInfo.gender);

    // 生成曲线数据
    const analysis = generateCurveData(baziResult, daYunResult, age, analysisType);

    // 生成主播稿子
    const streamerScript = generateStreamerScript(
      baziResult,
      daYunResult,
      age,
      birthInfo.gender,
      focusHint
    );

    return NextResponse.json({
      success: true,
      analysis,
      streamerScript,
    });

  } catch (error) {
    console.error('Live analysis error:', error);
    return NextResponse.json(
      { success: false, error: '分析失败，请重试' },
      { status: 500 }
    );
  }
}
