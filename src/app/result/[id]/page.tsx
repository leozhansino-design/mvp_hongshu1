'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { Header, BaziChartDisplay, LifeCurveChart, DaYunTable, FiveElementsDiagram, DetailedDaYunTable } from '@/components';
import { getResult, saveResult } from '@/services/storage';
import { generatePaidResult } from '@/services/api';
import { calculateDaYun } from '@/lib/bazi';
import {
  StoredResult,
  PHASE_LABELS,
  TYPE_LABELS,
  PhaseType,
} from '@/types';

interface PageParams {
  id: string;
}

// 评分圆环组件
function ScoreRing({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' }) {
  const radius = size === 'sm' ? 28 : 36;
  const strokeWidth = size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#D4AF37' : '#ef4444';

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
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-text-secondary mt-1">{label}</span>
    </div>
  );
}

// 分析卡片组件
function AnalysisCard({ title, content, score, icon }: { title: string; content: string; score: number; icon: string }) {
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
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showDaYun, setShowDaYun] = useState(false);
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

  if (loading || upgrading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="text-gold-400 animate-pulse">
            {upgrading ? '正在解锁完整命数...' : '加载中...'}
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { birthInfo, freeResult, paidResult, isPaid } = result;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;
  const data = isPaid ? paidResult : freeResult;
  const currentPhase = data?.currentPhase as PhaseType | undefined;

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

        {/* 人生曲线图 - 放在最上面 */}
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
