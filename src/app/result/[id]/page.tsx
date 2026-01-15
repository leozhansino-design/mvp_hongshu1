'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { KLineChart, BaguaLoader, Header } from '@/components';
import { getResult, saveResult } from '@/services/storage';
import { generatePaidResult } from '@/services/api';
import {
  StoredResult,
  PHASE_LABELS,
  TYPE_LABELS,
  HOUR_LABELS,
  PhaseType,
} from '@/types';

interface PageParams {
  id: string;
}

export default function ResultPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

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
    try {
      const paidResult = await generatePaidResult(result.birthInfo);
      const updatedResult: StoredResult = {
        ...result,
        paidResult,
        isPaid: true,
      };
      saveResult(updatedResult);
      setResult(updatedResult);
    } catch (error) {
      console.error('升级失败:', error);
      alert('天机运算失败，请稍后再试');
    } finally {
      setUpgrading(false);
    }
  };

  const handleShare = async () => {
    if (!shareRef.current) return;

    setShareLoading(true);
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#0D0221',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `life-curve-${Date.now()}.png`;
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
          <BaguaLoader message="加载中..." />
        </div>
      </div>
    );
  }

  if (upgrading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <BaguaLoader />
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { birthInfo, freeResult, paidResult, isPaid } = result;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;

  const currentPhase = (isPaid ? paidResult?.currentPhase : freeResult?.currentPhase) as PhaseType | undefined;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="btn-outline text-sm"
          >
            {shareLoading ? '生成中...' : '分享报告'}
          </button>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-gold-400 mb-2">
            {birthInfo.name ? `${birthInfo.name}的命盘` : '命盘报告'}
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            {birthInfo.gender === 'male' ? '男' : '女'} ·
            {birthInfo.calendarType === 'lunar' ? '农历' : '公历'} {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日 ·
            {HOUR_LABELS[birthInfo.hour]}
          </p>
        </div>

        <div className="mystic-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-gold-400">
              {isPaid ? '百年运势详图' : '百年运势'}
            </h2>
            <span className="text-xs text-text-secondary">
              {isPaid ? '流年级别 · 100个数据点' : '大运级别 · 10个数据点'}
            </span>
          </div>

          {isPaid && paidResult ? (
            <KLineChart
              data={paidResult.chartPoints}
              currentAge={currentAge}
              isPaid={true}
              highlights={paidResult.highlights.filter(h => h.score !== undefined).map((h) => ({ age: h.age, score: h.score! }))}
              warnings={paidResult.warnings.filter(w => w.score !== undefined).map((w) => ({ age: w.age, score: w.score! }))}
            />
          ) : freeResult ? (
            <KLineChart
              data={freeResult.chartPoints}
              currentAge={currentAge}
            />
          ) : null}

          <p className="text-xs text-text-secondary text-center mt-2">
            {isPaid ? '金色标记为高光年份 · 红色标记为警示年份' : '大运十年一换，此为概览'}
          </p>
        </div>

        <div className="mystic-card mb-6">
          <h2 className="font-serif text-xl text-gold-400 mb-4">汝之命数</h2>

          <div className="space-y-4">
            {currentPhase && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-mystic-900/30 backdrop-blur-xl border border-gold-400/20">
                <div className={`w-3 h-3 rounded-full ${
                  currentPhase === 'rising' ? 'bg-kline-up shadow-[0_0_12px_rgba(107,165,198,0.6)]' :
                  currentPhase === 'peak' ? 'bg-gold-400 shadow-[0_0_12px_rgba(201,169,97,0.6)]' :
                  currentPhase === 'stable' ? 'bg-text-secondary shadow-[0_0_12px_rgba(156,163,175,0.4)]' :
                  currentPhase === 'declining' ? 'bg-kline-down shadow-[0_0_12px_rgba(198,107,107,0.6)]' :
                  'bg-purple-400 shadow-[0_0_12px_rgba(139,122,184,0.6)]'
                }`} />
                <div>
                  <p className="text-text-secondary text-sm">当前阶段</p>
                  <p className="text-gold-400 font-serif">
                    正值「{PHASE_LABELS[currentPhase]}」
                  </p>
                </div>
              </div>
            )}

            {!isPaid && freeResult && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-mystic-900/30 backdrop-blur-xl border border-kline-up/20">
                  <div className="w-3 h-3 rounded-full bg-kline-up shadow-[0_0_12px_rgba(107,165,198,0.6)]" />
                  <div>
                    <p className="text-text-secondary text-sm">高光运程</p>
                    <p className="text-kline-up">
                      有 <span className="font-mono">{freeResult.highlights.length}</span> 段鸿运当头之时
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-mystic-900/30 backdrop-blur-xl border border-kline-down/20">
                  <div className="w-3 h-3 rounded-full bg-kline-down shadow-[0_0_12px_rgba(198,107,107,0.6)]" />
                  <div>
                    <p className="text-text-secondary text-sm">警示运程</p>
                    <p className="text-kline-down">
                      有 <span className="font-mono">{freeResult.warnings.length}</span> 段需谨慎以对
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-mystic-900/30 backdrop-blur-xl border border-purple-400/10">
                  <p className="text-text-primary leading-relaxed">
                    {freeResult.summary}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {isPaid && paidResult && (
          <>
            <div className="mystic-card mb-6">
              <h2 className="font-serif text-xl text-gold-400 mb-4">鸿运之年</h2>
              <div className="space-y-4">
                {paidResult.highlights.map((h, i) => (
                  <div key={i} className="p-4 rounded-lg bg-mystic-900/50 border-l-2 border-gold-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gold-400 font-mono">{h.age}岁</span>
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

            <div className="mystic-card mb-6">
              <h2 className="font-serif text-xl text-kline-down mb-4">谨慎之年</h2>
              <div className="space-y-4">
                {paidResult.warnings.map((w, i) => (
                  <div key={i} className="p-4 rounded-lg bg-mystic-900/50 border-l-2 border-kline-down">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-kline-down font-mono">{w.age}岁</span>
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
                      化解之道：{w.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mystic-card mb-6">
              <h2 className="font-serif text-xl text-gold-400 mb-4">八维详批</h2>
              <div className="space-y-4">
                {/* 命理总评 */}
                <div className="p-4 rounded-lg bg-mystic-900/50 border border-gold-400/20">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>命理总评</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.summaryScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.summary}</p>
                </div>

                {/* 性格命格 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>性格命格</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.personalityScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.personality}</p>
                </div>

                {/* 事业前程 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>事业前程</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.careerScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.career}</p>
                </div>

                {/* 财帛运势 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>财帛运势</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.wealthScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.wealth}</p>
                </div>

                {/* 姻缘情感 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>姻缘情感</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.marriageScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.marriage}</p>
                </div>

                {/* 身体康健 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>身体康健</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.healthScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.health}</p>
                </div>

                {/* 风水开运 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>风水开运</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.fengShuiScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.fengShui}</p>
                </div>

                {/* 六亲关系 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2 flex items-center gap-2">
                    <span>六亲关系</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/20">{paidResult.familyScore}分</span>
                  </h3>
                  <p className="text-text-primary text-sm leading-relaxed">{paidResult.family}</p>
                </div>
              </div>
            </div>

            <div className="mystic-card mb-6">
              <h2 className="font-serif text-xl text-gold-400 mb-4">五行生克</h2>
              <div className="space-y-4">
                {/* 五行分布 */}
                {paidResult.fiveElements && (
                  <div className="p-4 rounded-lg bg-mystic-900/50">
                    <h3 className="font-serif text-gold-400 mb-3">五行分布</h3>
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-2">
                          <span className="text-green-400 font-bold">{paidResult.fiveElements.wood}</span>
                        </div>
                        <span className="text-green-400 text-xs">木</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-2">
                          <span className="text-red-400 font-bold">{paidResult.fiveElements.fire}</span>
                        </div>
                        <span className="text-red-400 text-xs">火</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mb-2">
                          <span className="text-yellow-400 font-bold">{paidResult.fiveElements.earth}</span>
                        </div>
                        <span className="text-yellow-400 text-xs">土</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center mb-2">
                          <span className="text-gray-300 font-bold">{paidResult.fiveElements.metal}</span>
                        </div>
                        <span className="text-gray-300 text-xs">金</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mb-2">
                          <span className="text-blue-400 font-bold">{paidResult.fiveElements.water}</span>
                        </div>
                        <span className="text-blue-400 text-xs">水</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 五行生克原理 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-3">生克原理</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-green-400">● </span>
                      <span className="text-text-secondary">相生：</span>
                      <span className="text-text-primary">木生火，火生土，土生金，金生水，水生木</span>
                    </div>
                    <div>
                      <span className="text-red-400">● </span>
                      <span className="text-text-secondary">相克：</span>
                      <span className="text-text-primary">木克土，土克水，水克火，火克金，金克木</span>
                    </div>
                  </div>
                </div>

                {/* 解释说明 */}
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-text-secondary text-xs leading-relaxed">
                    💡 五行生克反映了命局的平衡状态。五行俱全且分布均衡为上佳，缺失或偏颇则需通过用神来调和。
                    相生代表助力与滋养，相克代表制约与消耗。理解五行生克规律，有助于把握命运起伏的内在逻辑。
                  </p>
                </div>
              </div>
            </div>

            <div className="mystic-card mb-6">
              <h2 className="font-serif text-xl text-gold-400 mb-4">开运指南</h2>
              <div className="space-y-4">
                {/* 用神喜忌 */}
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <h3 className="font-serif text-gold-400 mb-2">用神喜忌</h3>
                  <p className="text-text-primary text-sm leading-relaxed">
                    {paidResult.usefulGod}
                  </p>
                </div>

                {/* 吉祥方位、颜色等 */}
                {paidResult.luckyInfo && (
                  <div className="p-4 rounded-lg bg-mystic-900/50">
                    <h3 className="font-serif text-gold-400 mb-3">趋吉避凶</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-text-secondary">吉利方位：</span>
                        <span className="text-text-primary">{paidResult.luckyInfo.direction}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">开运颜色：</span>
                        <span className="text-text-primary">{paidResult.luckyInfo.color}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">幸运数字：</span>
                        <span className="text-text-primary">{paidResult.luckyInfo.number}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">宜从行业：</span>
                        <span className="text-text-primary">{paidResult.luckyInfo.industry}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 解释说明 */}
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-text-secondary text-xs leading-relaxed">
                    💡 开运指南根据八字喜忌推算，结合用神、五行平衡原理，为您量身定制趋吉避凶之道。
                    日常生活中可适当运用上述方位、颜色、数字来增强运势，选择适合的行业方向更能事半功倍。
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!isPaid && (
          <div className="mystic-card-gold text-center">
            <h2 className="font-serif text-xl text-gold-400 mb-2">
              欲知天机全貌？
            </h2>
            <p className="text-text-secondary mb-6">
              解锁完整命数 · ¥19.9
            </p>

            <ul className="text-left mb-6 space-y-3 max-w-xs mx-auto">
              <li className="flex items-center gap-3 text-text-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                百年逐年运势详图
              </li>
              <li className="flex items-center gap-3 text-text-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                高光年份具体解读
              </li>
              <li className="flex items-center gap-3 text-text-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                警示年份应对之策
              </li>
              <li className="flex items-center gap-3 text-text-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                性格/事业/财运/姻缘/健康/风水/六亲 八维详批
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

        <div
          ref={shareRef}
          className="fixed -left-[9999px] w-[1080px] p-12"
          style={{ background: 'linear-gradient(180deg, #0D0221 0%, #1A0A2E 50%, #16213E 100%)' }}
        >
          <div className="text-center mb-8">
            <p className="text-gold-400 text-3xl mb-2 font-serif">人生曲线</p>
          </div>

          <div className="bg-mystic-800/50 rounded-lg p-6 mb-8">
            <div className="h-[400px] flex items-center justify-center text-text-secondary">
              K线图预览区域
            </div>
          </div>

          {!isPaid && freeResult && (
            <div className="text-center mb-8">
              <p className="text-gold-400 text-2xl mb-4">
                「我的高光之年有 {freeResult.highlights.length} 段」
              </p>
              <p className="text-text-primary text-xl">
                当前正值「{currentPhase ? PHASE_LABELS[currentPhase] : ''}」
              </p>
            </div>
          )}

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
