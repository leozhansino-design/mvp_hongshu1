'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import { Header, BaziChartDisplay, LifeCurveChart, DaYunTable, FiveElementsDiagram, DetailedDaYunTable, WealthChart, WealthAnalysis } from '@/components';
import UnlockLoader from '@/components/UnlockLoader';
import { getResult, saveResult } from '@/services/storage';
import { generatePaidResult, generateWealthCurve } from '@/services/api';
import { calculateDaYun } from '@/lib/bazi';
import {
  StoredResult,
  PHASE_LABELS,
  TYPE_LABELS,
  PhaseType,
  WealthHighlights as WealthHighlightsType,
} from '@/types';

interface PageParams {
  id: string;
}

// 有趣的财富高光时刻组件
function WealthFunHighlights({
  highlights,
  wealthType,
  birthYear,
}: {
  highlights: WealthHighlightsType;
  wealthType: string;
  birthYear: number;
}) {
  // 格式化金额 - 更真实的显示
  const formatWealth = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}亿`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}千万`;
    }
    if (value >= 100) {
      return `${value.toFixed(0)}万`;
    }
    return `${value.toFixed(1)}万`;
  };

  // 根据财富类型和年龄生成有趣的故事
  const generateStory = () => {
    const peakYear = birthYear + highlights.peakAge;
    const growthYear = birthYear + highlights.maxGrowthAge;
    const lossYear = birthYear + highlights.maxLossAge;

    // 八字专业术语
    const baziTerms = [
      '食伤生财',
      '财官双美',
      '偏财入库',
      '正财透干',
      '劫财夺财',
      '比劫帮身',
      '印星护身',
      '官印相生',
    ];

    // 根据不同阶段生成故事
    const stories = [];

    // 财富巅峰故事
    const peakStories = [
      `${highlights.peakAge}岁的你，命盘走到${baziTerms[highlights.peakAge % 4]}大运，财库大开！可能是创业成功套现、股票翻倍、或者拆迁暴富，总之这一年你的银行卡余额会让你怀疑人生——"这真的是我的钱？"预计身价冲到${formatWealth(highlights.peakWealth)}，建议提前想好怎么低调炫富~`,
      `${highlights.peakAge}岁，${baziTerms[(highlights.peakAge + 1) % 4]}格局形成，你的财运将达到人生巅峰！这一年不管是投资、副业还是主业，感觉钱就像是追着你跑。朋友圈可能会出现"不经意间"晒出的${formatWealth(highlights.peakWealth)}资产截图，评论区一片酸柠檬~`,
      `${highlights.peakAge}岁的某一天，你可能会收到一笔让你手抖的转账，或者签下一份改变人生的合同。${baziTerms[(highlights.peakAge + 2) % 4]}的命理加持下，财富积累到${formatWealth(highlights.peakWealth)}，这一年的你，终于可以说出那句："钱对我来说只是数字"`,
    ];
    stories.push({
      type: 'peak',
      age: highlights.peakAge,
      year: peakYear,
      content: peakStories[highlights.peakAge % peakStories.length],
    });

    // 最大增长故事
    const growthStories = [
      `${highlights.maxGrowthAge}岁，${baziTerms[(highlights.maxGrowthAge + 3) % 4]}运势爆发！这一年你的财富将暴涨${formatWealth(highlights.maxGrowthAmount)}，平均每天躺赚${Math.floor(highlights.maxGrowthAmount * 10000 / 365)}块！可能是踩中了风口、投资押对了宝、或者天降横财。总之，请提前准备好收钱的姿势~`,
      `${highlights.maxGrowthAge}岁迎来${baziTerms[(highlights.maxGrowthAge + 4) % 4]}年份，财运起飞！一年狂赚${formatWealth(highlights.maxGrowthAmount)}，相当于每个月进账${Math.floor(highlights.maxGrowthAmount / 12)}万。这种赚钱速度，建议录个vlog记录一下，以后可以拍成励志电影~`,
    ];
    stories.push({
      type: 'growth',
      age: highlights.maxGrowthAge,
      year: growthYear,
      content: growthStories[highlights.maxGrowthAge % growthStories.length],
    });

    // 最大回撤故事（如果有的话）
    if (highlights.maxLossAmount > 0) {
      const lossStories = [
        `${highlights.maxLossAge}岁，命理显示${baziTerms[(highlights.maxLossAge + 5) % 4]}受冲，钱包要经历一次"瘦身"，预计缩水${formatWealth(highlights.maxLossAmount)}。可能是冲动消费、投资踩雷、或者被朋友坑了。不过别慌！破财消灾，失去的都是身外之物，留下的才是真正属于你的~`,
        `${highlights.maxLossAge}岁遇到${baziTerms[(highlights.maxLossAge + 6) % 4]}逆转，财运小坎坷，可能会"散财"${formatWealth(highlights.maxLossAmount)}。但命理学讲究"舍得"，舍了才能得！把这笔钱当作给未来的投资吧，毕竟后面还有翻盘的机会~`,
      ];
      stories.push({
        type: 'loss',
        age: highlights.maxLossAge,
        year: lossYear,
        content: lossStories[highlights.maxLossAge % lossStories.length],
      });
    }

    return stories;
  };

  const stories = generateStory();

  // 获取财富类型的有趣解读
  const getTypeComment = () => {
    const comments: Record<string, { summary: string; suggestion: string }> = {
      '早期暴富型': {
        summary: '你的命盘显示"少年得志"格局，财星早透，25-35岁就能积累可观财富。',
        suggestion: '建议趁年轻多学理财知识，别让钱躺在银行贬值。早期暴富容易飘，记得稳住心态！',
      },
      '大器晚成型': {
        summary: '命盘呈"厚积薄发"之象，前半生财运平平，但45岁后财库大开。',
        suggestion: '前期别着急，好好积累人脉和技能。你的黄金期在后面，耐心等待属于你的时代！',
      },
      '稳步上升型': {
        summary: '八字呈"细水长流"格局，财运稳健，适合长期投资和稳定收入。',
        suggestion: '你不适合高风险投资，定投、基金、房产才是你的菜。稳扎稳打，最后赢的是你！',
      },
      '过山车型': {
        summary: '命盘财星忽明忽暗，正财偏财交替出现，一生财运跌宕起伏。',
        suggestion: '高峰期要存钱！低谷期别气馁！建议设置"应急基金"，随时准备应对财务过山车~',
      },
      '平稳一生型': {
        summary: '八字财星平和，无大起大落，属于"小康之命"。',
        suggestion: '虽然不会暴富，但也不会破产，心态放平，知足常乐才是真正的富有！',
      },
      '先扬后抑型': {
        summary: '命盘显示"少年财旺、晚年财弱"，中年是财富分水岭。',
        suggestion: '趁年轻赶紧赚钱存钱！买好保险、规划养老金，别等老了才后悔没早准备！',
      },
    };
    return comments[wealthType] || {
      summary: '你的财富曲线独特，需要具体分析。',
      suggestion: '建议结合八字详批，制定专属理财方案。'
    };
  };

  const typeComment = getTypeComment();

  return (
    <div className="mystic-card mb-6">
      <h3 className="font-serif text-xl text-gold-400 mb-4">财富高光时刻</h3>

      <div className="space-y-4">
        {stories.map((story, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              story.type === 'peak'
                ? 'bg-gold-400/5 border-gold-400/30'
                : story.type === 'growth'
                  ? 'bg-green-500/5 border-green-500/30'
                  : 'bg-red-500/5 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                story.type === 'peak'
                  ? 'bg-gold-400/20 text-gold-400'
                  : story.type === 'growth'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {story.type === 'peak' ? '财富巅峰' : story.type === 'growth' ? '暴富之年' : '破财预警'}
              </span>
              <span className="text-text-secondary text-xs">{story.year}年</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{story.content}</p>
          </div>
        ))}
      </div>

      {/* 财富类型总结 */}
      <div className="mt-4 p-4 rounded-lg bg-purple-500/5 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-purple-400">你的财富类型</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">{wealthType}</span>
        </div>
        <p className="text-sm text-text-primary mb-2">{typeComment.summary}</p>
        <p className="text-xs text-text-secondary">{typeComment.suggestion}</p>
      </div>
    </div>
  );
}

// 评分圆环组件
function ScoreRing({ score, label, size = 'md' }: { score?: number; label: string; size?: 'sm' | 'md' }) {
  // 如果score未定义，使用0
  const validScore = score !== undefined && score !== null && !isNaN(score) ? score : 0;

  const radius = size === 'sm' ? 28 : 36;
  const strokeWidth = size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const progress = (validScore / 100) * circumference;
  const color = validScore >= 75 ? '#22c55e' : validScore >= 50 ? '#D4AF37' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${size === 'sm' ? 'w-16 h-16' : 'w-20 h-20'}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="#1a1a1a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-bold ${size === 'sm' ? 'text-lg' : 'text-xl'}`} style={{ color }}>
            {validScore}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-text-secondary mt-1">{label}</span>}
    </div>
  );
}

// 分析卡片组件
function AnalysisCard({ title, content, score, icon }: { title: string; content: string; score?: number; icon: string }) {
  return (
    <div className="p-4 rounded-lg bg-black/30 border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-serif text-gold-400">{title}</h3>
        </div>
        <ScoreRing score={score} label="" size="sm" />
      </div>
      <p className="text-text-primary text-sm leading-relaxed">{content}</p>
    </div>
  );
}

export default function ResultPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [unlockComplete, setUnlockComplete] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showDaYun, setShowDaYun] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const wealthShareRef = useRef<HTMLDivElement>(null);

  // 检测是否为财富曲线模式
  const isWealthMode = searchParams.get('mode') === 'wealth';

  useEffect(() => {
    const storedResult = getResult(resolvedParams.id);
    if (!storedResult) {
      router.push('/');
      return;
    }
    setResult(storedResult);
    setLoading(false);
  }, [resolvedParams.id, router]);

  const handleUpgrade = async () => {
    if (!result) return;
    setUpgrading(true);
    setUnlockComplete(false);
  };

  const handleUnlockComplete = async () => {
    if (!result) return;
    try {
      if (isWealthMode) {
        // 财富曲线升级
        const wealthResult = await generateWealthCurve(result.birthInfo, true);
        const updatedResult: StoredResult = {
          ...result,
          wealthResult,
          isPaid: true,
          curveMode: 'wealth',
        };
        saveResult(updatedResult);
        setResult(updatedResult);
      } else {
        // 人生曲线升级
        const paidResult = await generatePaidResult(result.birthInfo);
        const updatedResult: StoredResult = {
          ...result,
          paidResult,
          isPaid: true,
        };
        saveResult(updatedResult);
        setResult(updatedResult);
      }
      setUnlockComplete(true);
      // 延迟一下再关闭upgrading，让用户看到完成状态
      setTimeout(() => {
        setUpgrading(false);
      }, 500);
    } catch (error) {
      console.error('升级失败:', error);
      alert('天机运算失败，请稍后再试');
      setUpgrading(false);
    }
  };

  const handleShare = async () => {
    const ref = isWealthMode ? wealthShareRef.current : shareRef.current;
    if (!ref) return;
    setShareLoading(true);
    try {
      const canvas = await html2canvas(ref, {
        backgroundColor: isWealthMode ? '#0a0a0a' : '#0D0221',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${isWealthMode ? 'wealth' : 'life'}-curve-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('生成分享图失败:', error);
      alert('生成分享图失败');
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="text-gold-400 animate-pulse">加载中...</div>
        </div>
      </div>
    );
  }

  if (upgrading) {
    return (
      <div className="min-h-screen">
        <Header />
        <UnlockLoader onComplete={handleUnlockComplete} />
      </div>
    );
  }

  if (!result) return null;

  const { birthInfo, freeResult, paidResult, isPaid, wealthResult } = result;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;
  const data = isPaid ? paidResult : freeResult;
  const currentPhase = data?.currentPhase as PhaseType | undefined;

  // 财富曲线模式的渲染
  if (isWealthMode && wealthResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          {/* 顶部信息 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-gold-gradient">
                {birthInfo.name ? `${birthInfo.name}的财富曲线` : '财富曲线报告'}
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                {birthInfo.gender === 'male' ? '乾造' : '坤造'} ·
                {birthInfo.calendarType === 'lunar' ? '农历' : '公历'} {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日
              </p>
            </div>
            <button onClick={handleShare} disabled={shareLoading} className="btn-outline text-sm border-gold-400/50 text-gold-400 hover:bg-gold-400/10">
              {shareLoading ? '生成中...' : '分享'}
            </button>
          </div>

          {/* 财富曲线图 */}
          <div className="mystic-card-gold mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4 flex items-center gap-2">
              <span>财富曲线</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-400/80 font-normal">
                {wealthResult.wealthType}
              </span>
            </h2>
            <WealthChart
              dataPoints={wealthResult.dataPoints}
              highlights={wealthResult.highlights}
              wealthRange={wealthResult.wealthRange}
              isPaid={isPaid}
            />
          </div>

          {/* 财富高光时刻 - 有趣版 */}
          <WealthFunHighlights
            highlights={wealthResult.highlights}
            wealthType={wealthResult.wealthType}
            birthYear={birthInfo.year}
          />

          {/* 财富详细分析 */}
          <div className="mystic-card mb-6">
            <WealthAnalysis analysis={wealthResult.analysis} isPaid={isPaid} />
          </div>

          {/* 升级提示 - 详细财富走势 */}
          {!isPaid && (
            <div className="mystic-card-gold">
              <div className="text-center mb-6">
                <h2 className="font-serif text-xl text-gold-400 mb-2">解锁详细财富走势</h2>
                <p className="text-text-secondary text-sm">看清每一年的财富起落，把握最佳投资时机</p>
              </div>

              {/* 对比展示 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <p className="text-xs text-text-secondary mb-2">免费版</p>
                  <p className="text-2xl font-mono text-text-primary">11个</p>
                  <p className="text-xs text-text-secondary">数据点（每6年）</p>
                </div>
                <div className="p-4 rounded-lg bg-gold-400/10 border border-gold-400/30">
                  <p className="text-xs text-gold-400 mb-2">完整版</p>
                  <p className="text-2xl font-mono text-gold-400">63个</p>
                  <p className="text-xs text-gold-400/80">数据点（逐年）</p>
                </div>
              </div>

              {/* 价值点 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                  <span className="text-gold-400 text-sm mt-0.5">▸</span>
                  <div>
                    <p className="text-sm text-text-primary">精准定位每年财运走势</p>
                    <p className="text-xs text-text-secondary">知道哪年该冲、哪年该稳，不再盲目投资</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                  <span className="text-gold-400 text-sm mt-0.5">▸</span>
                  <div>
                    <p className="text-sm text-text-primary">提前预警破财年份</p>
                    <p className="text-xs text-text-secondary">避开财运低谷，减少不必要的损失</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                  <span className="text-gold-400 text-sm mt-0.5">▸</span>
                  <div>
                    <p className="text-sm text-text-primary">专属增运方案</p>
                    <p className="text-xs text-text-secondary">根据你的命盘定制财运提升策略</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button onClick={handleUpgrade} className="btn-gold px-10 py-3 text-lg">
                  ¥19.9 解锁完整版
                </button>
                <p className="text-xs text-text-secondary mt-3">
                  一次购买，永久查看 · 支持多次生成
                </p>
                <p className="text-xs text-gold-400/50 mt-2">
                  （MVP演示版 - 点击直接体验）
                </p>
              </div>
            </div>
          )}

          {/* 财富分享图隐藏区域 */}
          <div ref={wealthShareRef} className="fixed -left-[9999px] w-[1080px] p-12 bg-gradient-to-b from-black via-gray-900 to-black">
            <div className="text-center mb-8">
              <p className="text-gold-400 text-3xl mb-2">💰 财富曲线 💰</p>
              <p className="text-text-secondary">{birthInfo.name || '财富报告'}</p>
            </div>
            <div className="text-center mb-8">
              <p className="text-gold-400 text-2xl">财富类型：{wealthResult.wealthType}</p>
              <p className="text-text-primary text-xl mt-4">
                巅峰年龄：{wealthResult.highlights.peakAge}岁
              </p>
            </div>
            <div className="border-t border-gold-400/30 pt-8 text-center">
              <p className="text-text-secondary mb-4">扫码探寻你的财富密码</p>
              <div className="w-32 h-32 bg-white mx-auto rounded-lg flex items-center justify-center">
                <span className="text-black text-xs">二维码</span>
              </div>
              <p className="text-gold-400 mt-4">lifecurve.app</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* 顶部信息 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-gold-400">
              {birthInfo.name ? `${birthInfo.name}的命盘` : '命盘报告'}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {birthInfo.gender === 'male' ? '乾造' : '坤造'} ·
              {birthInfo.calendarType === 'lunar' ? '农历' : '公历'} {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日
              {birthInfo.hour !== undefined ? ` ${String(birthInfo.hour).padStart(2, '0')}:${String(birthInfo.minute || 0).padStart(2, '0')}` : ''}
            </p>
          </div>
          <button onClick={handleShare} disabled={shareLoading} className="btn-outline text-sm">
            {shareLoading ? '生成中...' : '分享'}
          </button>
        </div>

        {/* 人生高光时刻 - 最优先显示 */}
        {data?.highlightMoment && (
          <div className="mystic-card-gold mb-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl">🌟</div>
              <div className="flex-1">
                <h2 className="font-serif text-xl text-gold-400 mb-2">人生高光时刻</h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-400 text-sm font-mono">
                    {data.highlightMoment.age}岁
                  </span>
                  <span className="text-text-secondary text-sm">· {data.highlightMoment.title}</span>
                </div>
                <p className="text-text-primary leading-relaxed text-base">{data.highlightMoment.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* 人生曲线图 */}
        {data?.chartPoints && data.chartPoints.length > 0 && (
          <div className="mb-6">
            <LifeCurveChart
              data={data.chartPoints}
              currentAge={currentAge}
              birthYear={birthInfo.year}
            />
          </div>
        )}

        {/* 大运流年表格 - 仅付费版显示 */}
        {isPaid && paidResult?.daYunList && paidResult.chartPoints && (
          <div className="mb-6">
            <DaYunTable
              daYunList={paidResult.daYunList}
              chartPoints={paidResult.chartPoints}
              currentAge={currentAge}
              birthYear={birthInfo.year}
            />
          </div>
        )}

        {/* 八字排盘 */}
        {data?.baziChart && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4">四柱八字</h2>
            <BaziChartDisplay chart={data.baziChart} showDetails={true} />

            {/* 大运流年折叠按钮 */}
            <button
              onClick={() => setShowDaYun(!showDaYun)}
              className="mt-4 w-full py-2 text-sm text-white border border-gray-700 rounded hover:bg-white/10 transition-colors"
            >
              {showDaYun ? '收起' : '查看'}大运流年
            </button>

            {/* 大运流年展开内容 */}
            {showDaYun && (() => {
              const isLunar = birthInfo.calendarType === 'lunar';
              const daYunResult = calculateDaYun(
                birthInfo.year,
                birthInfo.month,
                birthInfo.day,
                birthInfo.hour || 0,
                birthInfo.minute || 0,
                birthInfo.gender,
                isLunar
              );

              if (!daYunResult) return null;

              // 显示0-100岁的大运
              const daYunList = daYunResult.daYunList.filter(d => d.startAge <= 100);

              return (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <DetailedDaYunTable
                    daYunList={daYunList}
                    currentAge={currentAge}
                    birthYear={birthInfo.year}
                    birthMonth={birthInfo.month}
                    birthDay={birthInfo.day}
                    birthHour={birthInfo.hour || 0}
                    birthMinute={birthInfo.minute || 0}
                    gender={birthInfo.gender}
                    isLunar={isLunar}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* 命理总评 */}
        {data && (
          <div className="mystic-card mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-serif text-xl text-gold-400">命理总评</h2>
              <ScoreRing score={data.summaryScore} label="综合" />
            </div>
            <p className="text-text-primary leading-relaxed">{data.summary}</p>

            {currentPhase && (
              <div className="mt-4 p-3 rounded-lg bg-mystic-800/50 flex items-center gap-3">
                <span className="text-2xl">
                  {currentPhase === 'rising' && '📈'}
                  {currentPhase === 'peak' && '⭐'}
                  {currentPhase === 'stable' && '➡️'}
                  {currentPhase === 'declining' && '📉'}
                  {currentPhase === 'valley' && '🌙'}
                </span>
                <div>
                  <span className="text-text-secondary text-sm">当前运势阶段：</span>
                  <span className="text-gold-400 font-serif ml-2">{PHASE_LABELS[currentPhase]}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 日主分析 */}
        {data?.dayMaster && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4">日主分析</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/30 to-gold-400/30 text-gold-400 font-serif text-xl">
                {data.dayMaster.stem}{data.dayMaster.element}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                {data.dayMaster.strength}
              </span>
            </div>
            <p className="text-text-primary leading-relaxed">{data.dayMaster.description}</p>
            {data.usefulGod && (
              <div className="mt-4 p-3 rounded-lg bg-mystic-800/50">
                <span className="text-gold-400 text-sm">用神喜忌：</span>
                <p className="text-text-secondary text-sm mt-1">{data.usefulGod}</p>
              </div>
            )}
          </div>
        )}

        {/* 五行分布 */}
        {data?.fiveElements && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4">五行生克</h2>
            <FiveElementsDiagram
              wood={data.fiveElements.wood}
              fire={data.fiveElements.fire}
              earth={data.fiveElements.earth}
              metal={data.fiveElements.metal}
              water={data.fiveElements.water}
            />
            {data.elementAnalysis && (
              <div className="mt-6 p-4 rounded-lg bg-black/30 border border-gray-700">
                <h3 className="text-gold-400 text-sm mb-2 flex items-center gap-2">
                  <span>⚖️</span>
                  <span>五行相克分析</span>
                </h3>
                <p className="text-text-primary text-sm leading-relaxed">{data.elementAnalysis}</p>
              </div>
            )}
          </div>
        )}

        {/* 八维分析 */}
        {data && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4">八维详批</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.personality && <AnalysisCard title="性格命格" content={data.personality} score={data.personalityScore} icon="🎭" />}
              {data.career && <AnalysisCard title="事业前程" content={data.career} score={data.careerScore} icon="💼" />}
              {data.wealth && <AnalysisCard title="财帛运势" content={data.wealth} score={data.wealthScore} icon="💰" />}
              {data.marriage && <AnalysisCard title="婚姻姻缘" content={data.marriage} score={data.marriageScore} icon="💕" />}
              {data.health && <AnalysisCard title="健康体质" content={data.health} score={data.healthScore} icon="🏥" />}
              {data.fengShui && <AnalysisCard title="风水开运" content={data.fengShui} score={data.fengShuiScore} icon="🏠" />}
              {data.family && <AnalysisCard title="六亲关系" content={data.family} score={data.familyScore} icon="👨‍👩‍👧" />}
            </div>
          </div>
        )}

        {/* 开运指南 */}
        {data?.luckyInfo && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4">开运指南</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                <p className="text-2xl mb-2">🧭</p>
                <p className="text-xs text-text-secondary mb-1">吉利方位</p>
                <p className="text-purple-300 text-sm">{data.luckyInfo.direction}</p>
              </div>
              <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                <p className="text-2xl mb-2">🎨</p>
                <p className="text-xs text-text-secondary mb-1">幸运颜色</p>
                <p className="text-purple-300 text-sm">{data.luckyInfo.color}</p>
              </div>
              <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                <p className="text-2xl mb-2">🔢</p>
                <p className="text-xs text-text-secondary mb-1">幸运数字</p>
                <p className="text-purple-300 text-sm">{data.luckyInfo.number}</p>
              </div>
              <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                <p className="text-2xl mb-2">💼</p>
                <p className="text-xs text-text-secondary mb-1">适合行业</p>
                <p className="text-purple-300 text-sm">{data.luckyInfo.industry}</p>
              </div>
            </div>
            {data.luckyExplanation && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30">
                <h3 className="text-gold-400 text-sm mb-3 flex items-center gap-2">
                  <span>✨</span>
                  <span>开运详解</span>
                </h3>
                <p className="text-text-primary text-sm leading-relaxed">{data.luckyExplanation}</p>
              </div>
            )}
          </div>
        )}

        {/* 高光年份 */}
        {data?.highlights && data.highlights.length > 0 && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-gold-400 mb-4">✦ 高光之年</h2>
            <div className="space-y-4">
              {data.highlights.map((h, i) => (
                <div key={i} className="p-4 rounded-lg bg-gradient-to-r from-gold-400/10 to-transparent border-l-2 border-gold-400">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gold-400 font-mono text-lg">{h.age}岁</span>
                    <span className="text-text-secondary">({h.year}年)</span>
                    {h.type && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gold-400/20 text-gold-400">
                        {TYPE_LABELS[h.type] || h.type}
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-lg text-text-primary mb-1">{h.title}</p>
                  <p className="text-text-secondary text-sm">{h.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 警示年份 */}
        {data?.warnings && data.warnings.length > 0 && (
          <div className="mystic-card mb-6">
            <h2 className="font-serif text-xl text-kline-down mb-4">◆ 谨慎之年</h2>
            <div className="space-y-4">
              {data.warnings.map((w, i) => (
                <div key={i} className="p-4 rounded-lg bg-kline-down/5 border-l-2 border-kline-down">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-kline-down font-mono text-lg">{w.age}岁</span>
                    <span className="text-text-secondary">({w.year}年)</span>
                    {w.type && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-kline-down/20 text-kline-down">
                        {TYPE_LABELS[w.type] || w.type}
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-lg text-text-primary mb-1">{w.title}</p>
                  <p className="text-text-secondary text-sm mb-2">{w.description}</p>
                  <p className="text-accent-blue text-sm">
                    <span className="text-gold-400">化解之道：</span>{w.advice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 升级提示 */}
        {!isPaid && (
          <div className="mystic-card-gold text-center">
            <h2 className="font-serif text-xl text-gold-400 mb-2">欲知天机全貌？</h2>
            <p className="text-text-secondary mb-6">解锁完整命数 · ¥19.9</p>
            <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto">
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 百年逐年运势详图
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 十神深度解析
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 大运流年详批
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 今明两年运势预测
              </li>
            </ul>
            <button onClick={handleUpgrade} className="btn-gold px-8 py-3">
              洞悉全局
            </button>
            <p className="text-xs text-text-secondary mt-3">
              （MVP演示版 - 点击直接体验付费版效果）
            </p>
          </div>
        )}

        {/* 分享图隐藏区域 */}
        <div ref={shareRef} className="fixed -left-[9999px] w-[1080px] p-12" style={{ background: 'linear-gradient(180deg, #0D0221 0%, #1A0A2E 50%, #16213E 100%)' }}>
          <div className="text-center mb-8">
            <p className="text-gold-400 text-3xl mb-2">✦ 人生曲线 ✦</p>
            <p className="text-text-secondary">{birthInfo.name || '命盘报告'}</p>
          </div>
          <div className="text-center mb-8">
            <p className="text-gold-400 text-2xl">综合评分：{data?.summaryScore}</p>
            <p className="text-text-primary text-xl mt-4">
              当前正值「{currentPhase ? PHASE_LABELS[currentPhase] : ''}」
            </p>
          </div>
          <div className="border-t border-purple-500/30 pt-8 text-center">
            <p className="text-text-secondary mb-4">扫码探寻你的命数轨迹</p>
            <div className="w-32 h-32 bg-white mx-auto rounded-lg flex items-center justify-center">
              <span className="text-mystic-900 text-xs">二维码</span>
            </div>
            <p className="text-gold-400 mt-4">lifecurve.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
