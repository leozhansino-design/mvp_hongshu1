'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, BaguaLoader } from '@/components';
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <BaguaLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#logoGradient)"
              strokeWidth="2"
            />
            <path
              d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5"
              fill="url(#logoGradient)"
            />
            <circle cx="50" cy="27.5" r="5" fill="#0D0221" />
            <circle cx="50" cy="72.5" r="5" fill="url(#logoGradient)" />
          </svg>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl text-gold-gradient mb-3">
          人生曲线
        </h1>
        <p className="text-text-secondary text-lg">
          观天象，知命数，见未来
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

      <p className="mt-8 text-sm text-text-secondary">
        已有 <span className="text-gold-400 font-mono">{totalGenerated.toLocaleString()}</span> 人探寻过命数轨迹
      </p>
    </div>
  );
}
