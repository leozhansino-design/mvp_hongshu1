'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BirthForm, AnalysisLoader, BaziChartDisplay, LifeCurveChart, WealthChart, WealthAnalysis, FiveElementsDiagram } from '@/components';
import { generateFreeResult, generateWealthCurve } from '@/services/api';
import { BirthInfo, CurveMode, CURVE_MODE_LABELS, FreeVersionResult, WealthCurveData } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';
import { getFocusHint, FocusHint } from '@/types/master';
import { BaziResult, DaYunItem, calculateBazi, calculateDaYun } from '@/lib/bazi';

// 直播密码
const LIVE_PASSWORD = 'lifecurve2024';

// 五行特质映射
const WUXING_TRAITS: Record<string, { positive: string[]; challenge: string[]; advice: string }> = {
  '木': {
    positive: ['有创造力', '善于成长', '富有生机', '正直仁慈'],
    challenge: ['容易急躁', '过于理想化', '有时固执'],
    advice: '适合从事创意、教育、医疗等行业'
  },
  '火': {
    positive: ['热情开朗', '有领导力', '积极进取', '光明磊落'],
    challenge: ['性子急', '容易冲动', '有时过于张扬'],
    advice: '适合从事营销、演艺、公关等行业'
  },
  '土': {
    positive: ['稳重踏实', '值得信赖', '有耐心', '重诚信'],
    challenge: ['思维保守', '变通不足', '有时过于固执'],
    advice: '适合从事管理、金融、房地产等稳定行业'
  },
  '金': {
    positive: ['意志坚定', '有决断力', '讲义气', '执行力强'],
    challenge: ['过于刚硬', '不够圆滑', '有时过于严厉'],
    advice: '适合从事法律、军警、金融等行业'
  },
  '水': {
    positive: ['聪明灵活', '善于变通', '洞察力强', '有智慧'],
    challenge: ['想法多变', '有时缺乏坚持', '过于圆滑'],
    advice: '适合从事科研、咨询、贸易等行业'
  },
};

// 主播稿子接口
interface StreamerScript {
  openingLine: string;
  emotionalHook: string;
  keyPoints: string[];
  talkingPoints: string[];
  suggestedPhrases: string[];
  backgroundKnowledge: string;
}

// 生成主播稿子
function generateStreamerScript(
  baziResult: BaziResult,
  daYunResult: { startInfo: string; daYunList: DaYunItem[] } | null,
  age: number,
  gender: 'male' | 'female',
  focusHint: { type: FocusHint; label: string; description: string },
  name: string,
  freeResult?: FreeVersionResult | null,
  wealthResult?: WealthCurveData | null
): StreamerScript {
  const dayMaster = baziResult.dayMasterElement;
  const traits = WUXING_TRAITS[dayMaster] || WUXING_TRAITS['土'];

  // 获取当前大运
  const currentDaYun = daYunResult?.daYunList.find((dy, index) => {
    const startAge = index * 10 + 1;
    const endAge = startAge + 9;
    return age >= startAge && age <= endAge;
  });

  // 从结果中提取关键信息
  const getHighlightInfo = () => {
    if (freeResult) {
      const highlights = freeResult.highlights || [];
      const warnings = freeResult.warnings || [];
      return {
        peakYears: highlights.slice(0, 2).map(h => `${h.age}岁(${h.title})`).join('、'),
        warningYears: warnings.slice(0, 2).map(w => `${w.age}岁`).join('、'),
        currentPhase: freeResult.currentPhase,
        summaryScore: freeResult.summaryScore,
      };
    }
    if (wealthResult) {
      const h = wealthResult.highlights;
      return {
        peakYears: `${h.peakAge}岁(财富巅峰)`,
        warningYears: h.maxLossAge ? `${h.maxLossAge}岁` : '无',
        wealthType: wealthResult.wealthType,
        peakWealth: h.peakWealth,
      };
    }
    return null;
  };

  const highlightInfo = getHighlightInfo();

  // 根据年龄和性别生成开场白
  const getOpeningLine = () => {
    if (age < 18) {
      return `从你的八字来看，${name || '这位小朋友'}是一个${traits.positive[0]}的人，天生就有${traits.positive[1]}的特质，未来发展潜力很大...`;
    }
    if (age >= 60) {
      return `从你的八字来看，${name || '您'}是一个${traits.positive[0]}的人，一生积累了很多${traits.positive[2]}的智慧，晚年福运不错...`;
    }
    if (gender === 'male') {
      return `从你的八字来看，你是一个${traits.positive[0]}的人，但内心深处可能一直在寻找一个答案...`;
    }
    return `从你的八字来看，你是一个${traits.positive[0]}的人，对感情很认真，内心渴望真正的理解和陪伴...`;
  };

  // 共情切入点
  const getEmotionalHook = () => {
    if (age < 18) {
      return `作为家长，您一定非常关心孩子的未来发展。每个孩子都有自己独特的天赋，关键是找到适合他的发展方向。`;
    }
    if (age >= 60) {
      return `人生走到这个阶段，健康和家庭和睦是最重要的。您的八字显示晚年有福，但也需要注意一些养生细节。`;
    }
    if (gender === 'male') {
      return `作为男人，事业和财运是您最关心的话题。您的八字显示您有${traits.positive[3]}的特质，但可能在某些方面还需要把握时机。`;
    }
    return `作为女人，感情和家庭是您内心最柔软的部分。您的八字显示您${traits.positive[2]}，但感情路上可能经历过一些波折。`;
  };

  // 讲解要点 - 根据实际结果生成
  const getKeyPoints = () => {
    const points = [
      `核心特质：${dayMaster}命日主，${traits.positive.slice(0, 3).join('、')}`,
      `当前运势：${age}岁正处于${currentDaYun ? currentDaYun.ganZhi + '大运' : '关键运势期'}`,
      `重点关注：${focusHint.label}方面是您当前最需要关注的领域`,
    ];

    if (highlightInfo) {
      if (highlightInfo.peakYears) {
        points.push(`高光时刻：${highlightInfo.peakYears}`);
      }
      if (freeResult && highlightInfo.summaryScore) {
        points.push(`综合评分：${highlightInfo.summaryScore}分，${highlightInfo.currentPhase === 'rising' ? '上升期' : highlightInfo.currentPhase === 'peak' ? '巅峰期' : highlightInfo.currentPhase === 'stable' ? '平稳期' : '蓄势期'}`);
      }
      if (wealthResult && highlightInfo.peakWealth) {
        points.push(`财富类型：${highlightInfo.wealthType}，巅峰约${Math.round(highlightInfo.peakWealth)}万`);
      }
    }

    return points;
  };

  // 可以延伸的话题
  const getTalkingPoints = () => {
    const basePoints = [
      '五行平衡与调理建议',
      '流年运势的关键节点',
    ];

    if (age < 18) {
      return ['适合什么样的学习方式', '性格特点和相处之道', '未来适合的发展方向', ...basePoints];
    }
    if (age >= 60) {
      return ['健康养生的注意事项', '子女运势和家庭和睦', '晚年福运和贵人运', ...basePoints];
    }
    if (gender === 'male') {
      return ['事业发展的最佳时机', '财运走势和投资建议', '贵人运和合作运', ...basePoints];
    }
    return ['感情中的注意事项', '正缘出现的时间段', '婚姻家庭的经营建议', ...basePoints];
  };

  // 推荐话术 - 根据实际结果生成
  const getSuggestedPhrases = () => {
    const phrases: string[] = [];

    if (age < 18) {
      phrases.push(`这个孩子天生就有善于${traits.positive[1]}方面的潜质，好好培养会很有出息`);
      phrases.push(`学业上可能会在${traits.challenge[0]}阶段遇到一些挑战，但这恰恰是成长的机会`);
      phrases.push(`建议重点关注有责任心方面的培养，这是他的优势所在`);
    } else if (age >= 60) {
      phrases.push(`您的八字显示晚年有福，子女运势也不错`);
      const healthFocus = dayMaster === '火' ? '心血管' : dayMaster === '木' ? '肝胆' : dayMaster === '土' ? '脾胃' : dayMaster === '金' ? '肺部' : '肾脏';
      phrases.push(`健康方面要注意${healthFocus}的调理`);
      phrases.push(`这个年纪最重要的是心态平和，您的福报会越来越好`);
    } else if (gender === 'male') {
      if (highlightInfo?.peakYears) {
        phrases.push(`你的财运其实不差，关键是要把握住${highlightInfo.peakYears}这个时机`);
      }
      phrases.push(`事业上可能会遇到一些${traits.challenge[0]}的情况，但这恰恰是突破的机会`);
      phrases.push(`贵人运还是有的，${traits.advice}`);
    } else {
      phrases.push(`你的感情运其实不错，但可能之前遇人不淑，正缘还在后面`);
      phrases.push(`你${traits.positive[2]}的特质会吸引到对的人，但要注意不要太${traits.challenge[1]}`);
      phrases.push(`从八字看，你的婚姻宫还是不错的，关键是要选对时机`);
    }

    return phrases;
  };

  // 背景知识
  const getBackgroundKnowledge = () => {
    const yearPillar = baziResult.eightChar.year;
    const monthPillar = baziResult.eightChar.month;
    const dayPillar = baziResult.eightChar.day;
    const hourPillar = baziResult.eightChar.hour;

    let extra = '';
    if (freeResult) {
      extra = `当前处于${freeResult.currentPhase === 'rising' ? '上升期，运势正在走高' : freeResult.currentPhase === 'peak' ? '巅峰期，好好把握' : freeResult.currentPhase === 'stable' ? '平稳期，稳中求进' : '蓄势期，积蓄力量'}。`;
    }
    if (wealthResult) {
      extra = `财富类型属于"${wealthResult.wealthType}"，${wealthResult.analysis.summary.slice(0, 50)}...`;
    }

    return `${dayMaster}命的人在五行中属于${dayMaster}，${traits.advice}。${yearPillar}年柱代表祖上和16岁前的运势；${monthPillar}月柱代表父母和16-32岁的运势；${dayPillar}日柱代表自己和配偶；${hourPillar}时柱代表子女和晚年。${extra}`;
  };

  return {
    openingLine: getOpeningLine(),
    emotionalHook: getEmotionalHook(),
    keyPoints: getKeyPoints(),
    talkingPoints: getTalkingPoints(),
    suggestedPhrases: getSuggestedPhrases(),
    backgroundKnowledge: getBackgroundKnowledge(),
  };
}

// 直播页面内容组件
function LivePageContent() {
  const searchParams = useSearchParams();

  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 表单和结果状态
  const [curveMode, setCurveMode] = useState<CurveMode>('life');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 结果数据
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [freeResult, setFreeResult] = useState<FreeVersionResult | null>(null);
  const [wealthResult, setWealthResult] = useState<WealthCurveData | null>(null);
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [daYunResult, setDaYunResult] = useState<{ startInfo: string; daYunList: DaYunItem[] } | null>(null);

  // 主播稿子
  const [streamerScript, setStreamerScript] = useState<StreamerScript | null>(null);
  const [focusHint, setFocusHint] = useState<{ type: FocusHint; label: string; description: string } | null>(null);

  // 从 URL 读取模式参数
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'wealth') {
      setCurveMode('wealth');
    } else if (modeParam === 'life') {
      setCurveMode('life');
    }
  }, [searchParams]);

  // 密码验证
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === LIVE_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      sessionStorage.setItem('live_auth', 'true');
    } else {
      setPasswordError('密码错误');
    }
  };

  // 检查 session 认证
  useEffect(() => {
    if (sessionStorage.getItem('live_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 提交处理 - 使用和首页一样的API
  const handleSubmit = useCallback(async (info: BirthInfo, _isPaid: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setBirthInfo(info);

    // 清空之前的结果
    setFreeResult(null);
    setWealthResult(null);
    setStreamerScript(null);

    try {
      // 计算八字 (gender: 0=male, 1=female)
      const genderNum = info.gender === 'male' ? 0 : 1;
      const bazi = calculateBazi(
        info.year,
        info.month,
        info.day,
        info.hour,
        genderNum,
        info.calendarType === 'lunar'
      );
      setBaziResult(bazi);

      // 计算大运
      const daYun = calculateDaYun(
        info.year,
        info.month,
        info.day,
        info.hour,
        info.minute || 0,
        info.gender,
        info.calendarType === 'lunar'
      );
      setDaYunResult(daYun);

      // 计算年龄
      const currentYear = new Date().getFullYear();
      const age = currentYear - info.year;

      // 计算关注重点
      const hint = getFocusHint(info.year, info.gender);
      setFocusHint(hint);

      let resultFree: FreeVersionResult | null = null;
      let resultWealth: WealthCurveData | null = null;

      if (curveMode === 'wealth') {
        // 财富曲线模式 - 调用和首页一样的API
        resultWealth = await generateWealthCurve(info, false);
        setWealthResult(resultWealth);
      } else {
        // 人生曲线模式 - 调用和首页一样的API
        resultFree = await generateFreeResult(info);
        setFreeResult(resultFree);
      }

      // 生成主播稿子
      if (bazi) {
        const script = generateStreamerScript(bazi, daYun, age, info.gender, hint, info.name, resultFree, resultWealth);
        setStreamerScript(script);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '天机运算失败，请稍后再试');
      setIsLoading(false);
    }
  }, [curveMode]);

  // 密码页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="mystic-card-gold w-full max-w-sm p-6">
          <h1 className="text-2xl font-serif text-gold-400 text-center mb-6">主播直播模式</h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">请输入访问密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold-400"
                placeholder="输入密码"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gold-400 text-black font-medium rounded-lg hover:bg-gold-300 transition-colors"
            >
              进入直播模式
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 加载中页面 - 使用和首页一样的加载动画
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex h-screen">
          {/* 左侧加载动画 */}
          <div className="w-1/2 flex items-center justify-center border-r border-gray-800">
            <AnalysisLoader
              messages={curveMode === 'wealth' ? WEALTH_LOADING_MESSAGES : undefined}
            />
          </div>
          {/* 右侧等待提示 */}
          <div className="w-1/2 flex items-center justify-center bg-gray-950">
            <div className="text-center">
              <div className="text-6xl mb-4">🔮</div>
              <p className="text-gold-400">正在推算命盘...</p>
              <p className="text-gray-500 text-sm mt-2">主播稿子即将生成</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isWealthMode = curveMode === 'wealth';
  const hasResult = (isWealthMode && wealthResult) || (!isWealthMode && freeResult);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="flex h-screen">
        {/* 左侧 - 用户输入和结果展示区 */}
        <div className="w-1/2 overflow-y-auto border-r border-gray-800">
          <div className="p-6">
            {/* 标题和模式切换 */}
            <div className="text-center mb-6">
              <h1 className="font-serif text-3xl text-gold-gradient mb-2">
                {CURVE_MODE_LABELS[curveMode]}
              </h1>
              <p className="text-text-secondary text-sm">
                {curveMode === 'life'
                  ? '探索命运轨迹 · 把握人生节奏'
                  : '解析财富密码 · 掌握财运周期'
                }
              </p>

              {/* 模式切换按钮 */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    setCurveMode('life');
                    setFreeResult(null);
                    setWealthResult(null);
                    setStreamerScript(null);
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                    curveMode === 'life'
                      ? 'bg-gold-400 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  人生曲线
                </button>
                <button
                  onClick={() => {
                    setCurveMode('wealth');
                    setFreeResult(null);
                    setWealthResult(null);
                    setStreamerScript(null);
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                    curveMode === 'wealth'
                      ? 'bg-gold-400 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  财富曲线
                </button>
              </div>
            </div>

            {/* 输入表单 - 使用和首页一样的BirthForm */}
            {!hasResult && (
              <div className="mystic-card-gold max-w-md mx-auto">
                <BirthForm
                  onSubmit={handleSubmit}
                  disabled={isLoading}
                  remainingUsage={999}
                  points={99999}
                  detailedPrice={200}
                />

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* 结果展示 */}
            {hasResult && (
              <div className="space-y-6">
                {/* 重新分析按钮 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setFreeResult(null);
                      setWealthResult(null);
                      setStreamerScript(null);
                      setBirthInfo(null);
                    }}
                    className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    ← 重新分析
                  </button>
                </div>

                {/* 八字排盘 - 使用和结果页一样的组件 */}
                {freeResult && birthInfo && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-4">八字排盘</h3>
                    <BaziChartDisplay chart={freeResult.baziChart} showDetails={true} />
                    <div className="flex justify-end mt-2">
                      <span className="text-sm text-gray-500">日主: {freeResult.dayMaster.element}</span>
                    </div>
                  </div>
                )}

                {/* 大运流年 */}
                {daYunResult && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-4">大运流年</h3>
                    <p className="text-sm text-gray-400 mb-3">{daYunResult.startInfo}</p>
                    <div className="flex flex-wrap gap-2">
                      {daYunResult.daYunList.slice(0, 6).map((dy, index) => (
                        <div key={index} className="px-3 py-2 bg-gray-800/50 rounded-lg text-center">
                          <div className="text-gold-400 font-medium">{dy.ganZhi}</div>
                          <div className="text-xs text-gray-500">{dy.startAge}-{dy.endAge}岁</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 图表展示 - 使用和结果页一样的组件 */}
                <div className="mystic-card p-4">
                  {!isWealthMode && freeResult && birthInfo && (
                    <LifeCurveChart
                      data={freeResult.chartPoints}
                      currentAge={new Date().getFullYear() - birthInfo.year}
                      birthYear={birthInfo.year}
                    />
                  )}
                  {isWealthMode && wealthResult && birthInfo && (
                    <>
                      <WealthChart
                        dataPoints={wealthResult.dataPoints}
                        highlights={wealthResult.highlights}
                        wealthRange={wealthResult.wealthRange}
                        isPaid={false}
                      />
                      <div className="mt-4">
                        <WealthAnalysis analysis={wealthResult.analysis} isPaid={false} />
                      </div>
                    </>
                  )}
                </div>

                {/* 五行分析 */}
                {freeResult && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-4">五行分布</h3>
                    <FiveElementsDiagram
                      wood={freeResult.fiveElements.wood}
                      fire={freeResult.fiveElements.fire}
                      earth={freeResult.fiveElements.earth}
                      metal={freeResult.fiveElements.metal}
                      water={freeResult.fiveElements.water}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 主播专属区域 */}
        <div className="w-1/2 bg-gray-950 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-purple-400">主播专属区域</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">用户不可见</span>
            </div>

            {!streamerScript ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎙️</div>
                <p className="text-gray-400">输入用户信息并点击&quot;开始分析&quot;</p>
                <p className="text-gray-500 text-sm mt-2">分析结果将在此处显示主播稿子</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Focus Hint */}
                {focusHint && (
                  <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gold-400 font-medium">{focusHint.label}</span>
                      <span className="text-xs text-gold-400/70">解读侧重</span>
                    </div>
                    <p className="text-gray-400 text-sm">{focusHint.description}</p>
                  </div>
                )}

                {/* Opening Line */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                    <span>🎯</span> 开场白
                  </h3>
                  <p className="text-white text-lg leading-relaxed">&quot;{streamerScript.openingLine}&quot;</p>
                </div>

                {/* Emotional Hook */}
                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="text-pink-400 font-medium mb-2 flex items-center gap-2">
                    <span>💝</span> 共情切入点
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{streamerScript.emotionalHook}</p>
                </div>

                {/* Key Points */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                    <span>📋</span> 讲解要点
                  </h3>
                  <ol className="space-y-2">
                    {streamerScript.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-xs text-blue-400">
                          {index + 1}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Talking Points */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                    <span>💬</span> 可以延伸的话题
                  </h3>
                  <ul className="space-y-2">
                    {streamerScript.talkingPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-green-400">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Phrases */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">
                    <span>🗣️</span> 推荐话术
                  </h3>
                  <div className="space-y-3">
                    {streamerScript.suggestedPhrases.map((phrase, index) => (
                      <div key={index} className="bg-gray-900/50 rounded p-3 text-white italic">
                        &quot;{phrase}&quot;
                      </div>
                    ))}
                  </div>
                </div>

                {/* Background Knowledge */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-gray-400 font-medium mb-3 flex items-center gap-2">
                    <span>📚</span> 知识补充
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{streamerScript.backgroundKnowledge}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出包装组件
export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-gold-400 animate-pulse">加载中...</div>
      </div>
    }>
      <LivePageContent />
    </Suspense>
  );
}
