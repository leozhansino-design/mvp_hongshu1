'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, BaguaLoader } from '@/components';
import Header from '@/components/Header';
import { generateFreeResult } from '@/services/api';
import {
  getRemainingUsage,
  incrementUsage,
  saveResult,
  getTotalGeneratedCount,
} from '@/services/storage';
import { BirthInfo, StoredResult } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [remainingUsage, setRemainingUsage] = useState(3);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    setRemainingUsage(getRemainingUsage());
    setTotalGenerated(getTotalGeneratedCount());
  }, []);

  const handleSubmit = useCallback(async (birthInfo: BirthInfo, isPaid: boolean = false) => {
    // TODO: 测试完成后恢复次数限制
    // if (!canUseFreeTrial()) {
    //   setError('免费次数已用尽，请解锁完整版');
    //   return;
    // }

    setIsLoading(true);
    setError(null);

    // 模拟获取排队人数（实际应该从API获取）
    // 这里简单模拟一个0-10之间的随机数
    const actualQueue = Math.floor(Math.random() * 11);
    setQueueCount(actualQueue);

    try {
      const resultId = uuidv4();
      let storedResult: StoredResult;

      if (isPaid) {
        // 精批详解 - 调用付费版API
        const { generatePaidResult } = await import('@/services/api');
        const paidResult = await generatePaidResult(birthInfo);
        storedResult = {
          id: resultId,
          birthInfo,
          freeResult: paidResult, // 付费结果也存到freeResult字段用于显示
          paidResult,
          isPaid: true,
          createdAt: Date.now(),
        };
      } else {
        // 免费概览
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

      // 跳转后不再设置 loading 为 false，保持 loading 状态直到页面切换
      router.push(`/result/${resultId}`);
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '天机运算失败，请稍后再试');
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <BaguaLoader queueCount={queueCount} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 mb-3 md:mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full text-gold-400">
              <path
                fill="currentColor"
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              />
            </svg>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl text-gold-gradient mb-2 md:mb-3">
            人生曲线
          </h1>
          <p className="text-text-secondary text-base md:text-lg">
            探索命运轨迹，把握人生节奏
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
