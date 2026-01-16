'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, AnalysisLoader } from '@/components';
import Header from '@/components/Header';
import { generateFreeResult, generatePaidResult, generateWealthCurve } from '@/services/api';
import {
  getRemainingUsage,
  incrementUsage,
  saveResult,
  getTotalGeneratedCount,
} from '@/services/storage';
import { BirthInfo, StoredResult, CurveMode, CURVE_MODE_LABELS } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const [remainingUsage, setRemainingUsage] = useState(3);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curveMode, setCurveMode] = useState<CurveMode>('life');

  useEffect(() => {
    setRemainingUsage(getRemainingUsage());
    setTotalGenerated(getTotalGeneratedCount());
  }, []);

  const handleSubmit = useCallback(async (birthInfo: BirthInfo, isPaid: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const resultId = uuidv4();

      if (curveMode === 'wealth') {
        // 财富曲线模式
        const wealthResult = await generateWealthCurve(birthInfo, isPaid);

        // 存储财富曲线结果
        const storedResult: StoredResult = {
          id: resultId,
          birthInfo,
          isPaid,
          createdAt: Date.now(),
          // @ts-expect-error - 扩展存储类型
          wealthResult,
          curveMode: 'wealth',
        };

        saveResult(storedResult);
        router.push(`/result/${resultId}?mode=wealth`);
      } else {
        // 人生曲线模式（原有逻辑）
        let storedResult: StoredResult;

        if (isPaid) {
          const paidResult = await generatePaidResult(birthInfo);
          storedResult = {
            id: resultId,
            birthInfo,
            freeResult: paidResult,
            paidResult,
            isPaid: true,
            createdAt: Date.now(),
          };
        } else {
          const freeResult = await generateFreeResult(birthInfo);
          storedResult = {
            id: resultId,
            birthInfo,
            freeResult,
            isPaid: false,
            createdAt: Date.now(),
          };
        }

        incrementUsage();
        setRemainingUsage(getRemainingUsage());
        saveResult(storedResult);
        router.push(`/result/${resultId}`);
      }
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '天机运算失败，请稍后再试');
      setIsLoading(false);
    }
  }, [router, curveMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header curveMode={curveMode} showModeSelector={false} />
        <div className="flex flex-col items-center justify-center px-4 py-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <AnalysisLoader
            messages={curveMode === 'wealth' ? WEALTH_LOADING_MESSAGES : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        curveMode={curveMode}
        onModeChange={setCurveMode}
        showModeSelector={true}
      />
      <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center mb-6 md:mb-8">
          <h1 className={`font-serif text-3xl md:text-5xl mb-2 md:mb-3 ${
            curveMode === 'wealth' ? 'text-gold-gradient' : 'text-gold-gradient'
          }`}>
            {CURVE_MODE_LABELS[curveMode]}
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            {curveMode === 'life'
              ? '探索命运轨迹 · 把握人生节奏'
              : '解析财富密码 · 掌握财运周期'
            }
          </p>
        </div>

        <div className={`mystic-card-gold w-full max-w-md ${
          curveMode === 'wealth' ? 'border-gold-400/30' : ''
        }`}>
          <BirthForm
            onSubmit={handleSubmit}
            disabled={isLoading}
            remainingUsage={remainingUsage}
          />

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        <p className="mt-6 md:mt-8 text-xs md:text-sm text-text-secondary">
          已有 <span className="text-gold-400 font-mono">{totalGenerated.toLocaleString()}</span> 人生成过命盘报告
        </p>

        {/* 模式切换提示 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurveMode(curveMode === 'life' ? 'wealth' : 'life')}
            className="text-xs text-text-secondary hover:text-gold-400 transition-colors"
          >
            切换到{curveMode === 'life' ? '财富曲线' : '人生曲线'} →
          </button>
        </div>
      </div>
    </div>
  );
}
