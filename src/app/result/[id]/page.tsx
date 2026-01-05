'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { KLineChart, BaguaLoader } from '@/components';
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
      <div className="min-h-screen flex items-center justify-center">
        <BaguaLoader message="加载命数..." />
      </div>
    );
  }

  if (upgrading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BaguaLoader />
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="btn-outline text-sm">
            ← 返回
          </Link>
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="btn-outline text-sm"
          >
            {shareLoading ? '生成中...' : '分享命数'}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-gold-400 mb-2">
            命数轨迹
          </h1>
          <p className="text-text-secondary">
            {birthInfo.gender === 'male' ? '乾造' : '坤造'} ·
            {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日 ·
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
              data={paidResult.klineData}
              currentAge={currentAge}
              isPaid={true}
              highlights={paidResult.highlights.map((h) => ({ age: h.age, score: h.score }))}
              warnings={paidResult.warnings.map((w) => ({ age: w.age, score: w.score }))}
            />
          ) : freeResult ? (
            <KLineChart
              data={freeResult.klineData}
              currentAge={currentAge}
            />
          ) : null}

          <p className="text-xs text-text-secondary text-center mt-2">
            {isPaid ? '✦ 金色标记为高光年份 ◆ 红色标记为警示年份' : '大运十年一换，此为概览'}
          </p>
        </div>

        <div className="mystic-card mb-6">
          <h2 className="font-serif text-xl text-gold-400 mb-4">汝之命数</h2>

          <div className="space-y-4">
            {currentPhase && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-mystic-900/50">
                <span className="text-2xl">
                  {currentPhase === 'rising' && '📈'}
                  {currentPhase === 'peak' && '⭐'}
                  {currentPhase === 'stable' && '➡️'}
                  {currentPhase === 'declining' && '📉'}
                  {currentPhase === 'valley' && '🌙'}
                </span>
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
                <div className="flex items-center gap-3 p-3 rounded-lg bg-mystic-900/50">
                  <span className="text-2xl">✦</span>
                  <div>
                    <p className="text-text-secondary text-sm">高光运程</p>
                    <p className="text-kline-up">
                      有 <span className="font-mono">{freeResult.highlightCount}</span> 段鸿运当头之时
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-mystic-900/50">
                  <span className="text-2xl">◆</span>
                  <div>
                    <p className="text-text-secondary text-sm">警示运程</p>
                    <p className="text-kline-down">
                      有 <span className="font-mono">{freeResult.warningCount}</span> 段需谨慎以对
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <p className="text-text-primary leading-relaxed">
                    {freeResult.briefSummary}
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
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gold-400/20 text-gold-400">
                        {TYPE_LABELS[h.type] || h.type}
                      </span>
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
                      <span className="px-2 py-0.5 text-xs rounded-full bg-kline-down/20 text-kline-down">
                        {TYPE_LABELS[w.type] || w.type}
                      </span>
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
              <h2 className="font-serif text-xl text-gold-400 mb-4">五维详批</h2>
              <div className="space-y-4">
                {Object.entries(paidResult.summary).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg bg-mystic-900/50">
                    <h3 className="font-serif text-gold-400 mb-2">
                      {key === 'personality' && '性格命格'}
                      {key === 'career' && '事业前程'}
                      {key === 'wealth' && '财帛运势'}
                      {key === 'love' && '姻缘情感'}
                      {key === 'health' && '身体康健'}
                    </h3>
                    <p className="text-text-primary text-sm leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mystic-card mb-6">
              <h2 className="font-serif text-xl text-gold-400 mb-4">喜忌提示</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <p className="text-text-secondary text-sm mb-2">喜用五行</p>
                  <div className="flex gap-2">
                    {paidResult.luckyElements.map((el, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-kline-up/20 text-kline-up">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-mystic-900/50">
                  <p className="text-text-secondary text-sm mb-2">忌讳五行</p>
                  <div className="flex gap-2">
                    {paidResult.unluckyElements.map((el, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-kline-down/20 text-kline-down">
                        {el}
                      </span>
                    ))}
                  </div>
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

            <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto">
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 百年逐年运势详图
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 高光年份具体解读
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 警示年份应对之策
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-gold-400">✦</span> 性格/事业/财运/姻缘/健康 五维详批
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
            <p className="text-gold-400 text-3xl mb-2">✦ 人生曲线 ✦</p>
          </div>

          <div className="bg-mystic-800/50 rounded-lg p-6 mb-8">
            <div className="h-[400px] flex items-center justify-center text-text-secondary">
              K线图预览区域
            </div>
          </div>

          {!isPaid && freeResult && (
            <div className="text-center mb-8">
              <p className="text-gold-400 text-2xl mb-4">
                「我的高光之年有 {freeResult.highlightCount} 段」
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
