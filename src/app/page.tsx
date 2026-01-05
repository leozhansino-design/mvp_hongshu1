'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, AnalysisLoader } from '@/components';
import Header from '@/components/Header';
import { generateFreeResult } from '@/services/api';
import {
  getRemainingUsage,
  incrementUsage,
  saveResult,
  getTotalGeneratedCount,
  canUseFreeTrial,
} from '@/services/storage';
import { BirthInfo, StoredResult } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [remainingUsage, setRemainingUsage] = useState(3);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRemainingUsage(getRemainingUsage());
    setTotalGenerated(getTotalGeneratedCount());
  }, []);

  const handleSubmit = useCallback(async (birthInfo: BirthInfo) => {
    if (!canUseFreeTrial()) {
      setError('免费次数已用尽，请解锁完整版');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const freeResult = await generateFreeResult(birthInfo);

      incrementUsage();
      setRemainingUsage(getRemainingUsage());

      const resultId = uuidv4();
      const storedResult: StoredResult = {
        id: resultId,
        birthInfo,
        freeResult,
        isPaid: false,
        createdAt: Date.now(),
      };

      saveResult(storedResult);

      router.push(`/result/${resultId}`);
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '天机运算失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center px-4 py-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <AnalysisLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center mb-6 md:mb-8">
          <h1 className="font-serif text-3xl md:text-5xl text-gold-gradient mb-2 md:mb-3">
            人生曲线
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            探索命运轨迹 · 把握人生节奏
          </p>
        </div>

        <div className="mystic-card-gold w-full max-w-md">
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
      </div>
    </div>
  );
}
