/**
 * 直播模式分析API
 * POST /api/live/analyze
 *
 * 返回用户可见的分析结果 + 主播专属的讲解稿子
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BirthInfo } from '@/types';
import { BaziResult, DaYunItem } from '@/lib/bazi';
import { getFocusHint } from '@/types/master';

const anthropic = new Anthropic();

interface StreamerScript {
  openingLine: string;
  keyPoints: string[];
  talkingPoints: string[];
  suggestedPhrases: string[];
  backgroundKnowledge: string;
  emotionalHook: string;
}

// 根据年龄和性别获取共情切入点
function getEmotionalContext(age: number, gender: 'male' | 'female'): string {
  if (age < 18) {
    return '小孩子/学生，父母关心他们的前程发展、学业运势。来看命的往往是担心孩子未来的家长。可以从"理解家长的担忧"、"每个孩子都有独特天赋"入手。';
  }

  if (age >= 60) {
    return '老年人关心健康和晚年生活。来看命的老人往往经历过人生起伏，想了解晚年运势。可以从"人生智慧"、"安享晚年"的角度入手，给予温暖和安慰。';
  }

  if (gender === 'male') {
    return '成年男性最关心事业和财运。来看命的男人往往在事业上遇到瓶颈或困惑。可以从"理解他承担的压力"、"事业发展机遇"入手，给予方向指引。';
  } else {
    return '成年女性最关心感情和婚姻。来看命的女性往往在感情上有困惑或期待。可以从"理解她的情感需求"、"感情运势走向"入手，给予温暖和希望。';
  }
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
    const emotionalContext = getEmotionalContext(age, birthInfo.gender);

    // 构建八字信息
    const baziInfo = `
八字：${baziResult.eightChar.year} ${baziResult.eightChar.month} ${baziResult.eightChar.day} ${baziResult.eightChar.hour}
日主：${baziResult.dayMasterElement}
农历：${baziResult.lunar.yearCn}年${baziResult.lunar.monthCn}月${baziResult.lunar.dayCn}
性别：${birthInfo.gender === 'male' ? '男' : '女'}
年龄：${age}岁
`;

    const daYunInfo = daYunResult ? `
大运信息：${daYunResult.startInfo}
大运列表：${daYunResult.daYunList.slice(0, 8).map(d => `${d.ganZhi}(${d.startAge}-${d.endAge}岁)`).join('、')}
` : '';

    // 根据分析类型选择prompt
    const analysisPrompt = analysisType === 'life'
      ? buildLifeCurvePrompt(baziInfo, daYunInfo, age, focusHint, birthInfo.gender)
      : buildWealthCurvePrompt(baziInfo, daYunInfo, age, focusHint, birthInfo.gender);

    // 主播稿子prompt
    const streamerPrompt = buildStreamerPrompt(baziInfo, daYunInfo, age, focusHint, birthInfo.gender, emotionalContext, analysisType);

    // 并行调用两个API
    const [analysisResponse, streamerResponse] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: analysisPrompt }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: streamerPrompt }],
      }),
    ]);

    // 解析分析结果
    const analysisText = analysisResponse.content[0].type === 'text'
      ? analysisResponse.content[0].text
      : '';

    const analysis = parseAnalysisResponse(analysisText, analysisType);

    // 解析主播稿子
    const streamerText = streamerResponse.content[0].type === 'text'
      ? streamerResponse.content[0].text
      : '';

    const streamerScript = parseStreamerResponse(streamerText);

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

function buildLifeCurvePrompt(baziInfo: string, daYunInfo: string, age: number, focusHint: any, gender: string): string {
  return `你是一位资深命理分析师。请根据以下八字信息生成人生运势曲线数据。

${baziInfo}
${daYunInfo}

解读重点：${focusHint.label} - ${focusHint.description}

请生成18-80岁的人生运势数据，返回JSON格式：
{
  "lifeCurve": {
    "dataPoints": [
      {"age": 18, "score": 65, "event": "求学阶段"},
      ...更多数据点
    ],
    "highlights": {
      "peakAge": 最高峰年龄,
      "peakScore": 最高分数,
      "troughAge": 最低谷年龄,
      "troughScore": 最低分数,
      "currentAge": ${age},
      "currentScore": 当前运势分数
    }
  }
}

注意：
1. score范围0-100，代表整体运势
2. 每5岁一个数据点
3. event简短描述该阶段特征
4. 根据${gender === 'male' ? '男性事业运' : '女性感情运'}侧重分析
5. 只返回JSON，不要其他内容`;
}

function buildWealthCurvePrompt(baziInfo: string, daYunInfo: string, age: number, focusHint: any, gender: string): string {
  return `你是一位资深命理分析师。请根据以下八字信息生成财富运势曲线数据。

${baziInfo}
${daYunInfo}

解读重点：${focusHint.label} - ${focusHint.description}

请生成18-80岁的财富运势数据，返回JSON格式：
{
  "wealthCurve": {
    "dataPoints": [
      {"age": 18, "wealth": 5, "event": "起步阶段"},
      ...更多数据点
    ],
    "highlights": {
      "peakAge": 财富巅峰年龄,
      "peakWealth": 财富巅峰值(万元),
      "maxGrowthAge": 最大增长年龄,
      "maxGrowthAmount": 最大年增长额
    }
  }
}

注意：
1. wealth代表累计财富（万元），合理估算
2. 每5岁一个数据点
3. event简短描述该阶段财运特征
4. 只返回JSON，不要其他内容`;
}

function buildStreamerPrompt(baziInfo: string, daYunInfo: string, age: number, focusHint: any, gender: string, emotionalContext: string, analysisType: string): string {
  const focusArea = gender === 'male' ? '事业财运' : '感情婚姻';
  if (age < 18) {
    // focusArea = '前程发展';
  } else if (age >= 60) {
    // focusArea = '健康运势';
  }

  return `你是一位直播命理分析师的幕后编剧。请根据以下信息，为主播生成讲解稿子。

${baziInfo}
${daYunInfo}

【用户画像】
年龄：${age}岁
性别：${gender === 'male' ? '男' : '女'}
关注重点：${focusHint.label}
分析类型：${analysisType === 'life' ? '人生曲线' : '财富曲线'}

【共情背景】
${emotionalContext}

【重要提示】
来看命的人通常生活不太顺，需要安慰和指引。话术要能"击中心坎"，让人感到被理解。

请返回JSON格式的主播稿子：
{
  "openingLine": "一句话开场白，点出这个八字最突出的特点，让用户感到'你懂我'",
  "emotionalHook": "共情切入点，理解用户当前可能面临的困境，2-3句话",
  "keyPoints": [
    "要点1：这个人的核心特点",
    "要点2：当前运势的重点",
    "要点3：未来发展的关键"
  ],
  "talkingPoints": [
    "可以延伸聊的话题1",
    "可以延伸聊的话题2",
    "可以延伸聊的话题3"
  ],
  "suggestedPhrases": [
    "推荐话术1：用于描述性格特点",
    "推荐话术2：用于分析当前运势",
    "推荐话术3：用于给出建议"
  ],
  "backgroundKnowledge": "关于这个八字的命理知识补充，帮助主播显得更专业"
}

注意：
1. 语言要口语化，像在和观众聊天
2. 侧重${focusArea}方面的分析
3. 开场白要能抓住人心
4. 话术要有温度，给人希望
5. 只返回JSON，不要其他内容`;
}

function parseAnalysisResponse(text: string, type: string): any {
  try {
    // 尝试提取JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Parse analysis error:', e);
  }

  // 返回默认数据
  if (type === 'life') {
    return {
      lifeCurve: {
        dataPoints: Array.from({ length: 13 }, (_, i) => ({
          age: 18 + i * 5,
          score: 50 + Math.random() * 30,
          event: '运势平稳'
        })),
        highlights: {
          peakAge: 45,
          peakScore: 85,
          troughAge: 30,
          troughScore: 45,
          currentAge: 30,
          currentScore: 60
        }
      }
    };
  } else {
    return {
      wealthCurve: {
        dataPoints: Array.from({ length: 13 }, (_, i) => ({
          age: 18 + i * 5,
          wealth: i * 50,
          event: '财运发展'
        })),
        highlights: {
          peakAge: 55,
          peakWealth: 500,
          maxGrowthAge: 40,
          maxGrowthAmount: 100
        }
      }
    };
  }
}

function parseStreamerResponse(text: string): StreamerScript {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Parse streamer script error:', e);
  }

  // 返回默认稿子
  return {
    openingLine: '从你的八字来看，你是一个内心很有想法的人...',
    emotionalHook: '我能感受到你最近可能遇到了一些困扰，这很正常，每个人都会有这样的时期。',
    keyPoints: [
      '性格特点：内心细腻，善于思考',
      '当前运势：正处于转折期',
      '未来发展：机遇与挑战并存'
    ],
    talkingPoints: [
      '可以聊聊最近的工作/生活状态',
      '关于人际关系的处理',
      '未来1-2年的规划建议'
    ],
    suggestedPhrases: [
      '你这个八字很有特点，一般人看不太懂你...',
      '接下来这几年对你来说很关键...',
      '我建议你可以多关注...'
    ],
    backgroundKnowledge: '此命格属于典型的XX格局，历史上很多成功人士都有类似命盘。'
  };
}
