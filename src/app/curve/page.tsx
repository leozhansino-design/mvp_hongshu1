'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, AnalysisLoader, Footer } from '@/components';
import Header from '@/components/Header';
import { generateFreeResult, generatePaidResult, generateWealthCurve } from '@/services/api';
import { saveResult } from '@/services/storage';
import { trackPageView, trackButtonClick } from '@/services/analytics';
import { checkResultCache, saveResultCache } from '@/lib/device';
import { BirthInfo, StoredResult, CurveMode, FreeVersionResult, PaidVersionResult, WealthCurveData } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';

// 简洁标题
const PAGE_TITLES: Record<CurveMode, string> = {
  life: '人生曲线',
  wealth: '财富曲线',
};

const PAGE_SUBTITLES: Record<CurveMode, string> = {
  life: '探索您的人生发展趋势',
  wealth: '了解您的财富增长轨迹',
};

// 价格配置（分）
const PRICES = {
  basic: 100,    // 1元
  full: 1990,    // 19.9元
};

function CurvePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [curveMode, setCurveMode] = useState<CurveMode>('life');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingBirthInfo, setPendingBirthInfo] = useState<BirthInfo | null>(null);
  const [pendingLevel, setPendingLevel] = useState<'basic' | 'full'>('basic');

  // 获取URL参数
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'wealth') {
      setCurveMode('wealth');
    } else if (modeParam === 'life') {
      setCurveMode('life');
    }
  }, [searchParams]);

  useEffect(() => {
    trackPageView('curve', curveMode);
  }, [curveMode]);

  // 处理表单提交
  const handleSubmit = useCallback((birthInfo: BirthInfo) => {
    setPendingBirthInfo(birthInfo);
    setShowPayModal(true);
  }, []);

  // 处理支付后开始分析
  const handleStartAnalysis = async (level: 'basic' | 'full') => {
    if (!pendingBirthInfo) return;

    setShowPayModal(false);
    setIsLoading(true);
    setError(null);
    trackButtonClick('form_submit', 'curve', { curveMode, level });

    try {
      const resultId = uuidv4();
      const isPaid = level === 'full';

      const cacheParams = {
        name: pendingBirthInfo.name,
        year: pendingBirthInfo.year,
        month: pendingBirthInfo.month,
        day: pendingBirthInfo.day,
        hour: pendingBirthInfo.hour,
        gender: pendingBirthInfo.gender,
        isLunar: pendingBirthInfo.calendarType === 'lunar',
        curveMode,
        isPaid,
      };
      const cacheResult = await checkResultCache(cacheParams);

      if (curveMode === 'wealth') {
        let wealthResult: WealthCurveData;
        if (cacheResult.found && cacheResult.resultData) {
          wealthResult = cacheResult.resultData as WealthCurveData;
        } else {
          wealthResult = await generateWealthCurve(pendingBirthInfo, isPaid);
          await saveResultCache({
            cacheKey: cacheResult.cacheKey,
            curveMode,
            isPaid,
            resultData: wealthResult,
            birthInfo: pendingBirthInfo,
          });
        }

        const storedResult: StoredResult = {
          id: resultId,
          birthInfo: pendingBirthInfo,
          isPaid,
          createdAt: Date.now(),
          wealthResult,
          curveMode: 'wealth',
        };

        saveResult(storedResult);
        fetch('/api/stats', { method: 'POST' }).catch(console.error);
        router.push(`/result/${resultId}?mode=wealth`);
      } else {
        let storedResult: StoredResult;

        if (isPaid) {
          let paidResult: PaidVersionResult;
          if (cacheResult.found && cacheResult.resultData) {
            paidResult = cacheResult.resultData as PaidVersionResult;
          } else {
            paidResult = await generatePaidResult(pendingBirthInfo);
            await saveResultCache({
              cacheKey: cacheResult.cacheKey,
              curveMode,
              isPaid,
              resultData: paidResult,
              birthInfo: pendingBirthInfo,
            });
          }
          storedResult = {
            id: resultId,
            birthInfo: pendingBirthInfo,
            freeResult: paidResult,
            paidResult,
            isPaid: true,
            createdAt: Date.now(),
          };
        } else {
          let freeResult: FreeVersionResult;
          if (cacheResult.found && cacheResult.resultData) {
            freeResult = cacheResult.resultData as FreeVersionResult;
          } else {
            freeResult = await generateFreeResult(pendingBirthInfo);
            await saveResultCache({
              cacheKey: cacheResult.cacheKey,
              curveMode,
              isPaid,
              resultData: freeResult,
              birthInfo: pendingBirthInfo,
            });
          }
          storedResult = {
            id: resultId,
            birthInfo: pendingBirthInfo,
            freeResult,
            isPaid: false,
            createdAt: Date.now(),
          };
        }

        saveResult(storedResult);
        fetch('/api/stats', { method: 'POST' }).catch(console.error);
        router.push(`/result/${resultId}`);
      }
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后再试');
      setIsLoading(false);
    }
  };

  // 格式化价格
  const formatPrice = (priceCents: number) => {
    const yuan = priceCents / 100;
    return yuan % 1 === 0 ? yuan.toString() : yuan.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
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
    <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100">
      <Header
        curveMode={curveMode}
        onModeChange={setCurveMode}
        showModeSelector={true}
      />
      <div className="flex flex-col items-center justify-center px-4 py-12 md:py-16" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold text-apple-gray-600 mb-3">
            {PAGE_TITLES[curveMode]}
          </h1>
          <p className="text-apple-gray-400 text-lg">
            {PAGE_SUBTITLES[curveMode]}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="apple-card w-full max-w-md">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-apple-gray-200">
            <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-apple-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-apple-gray-600 font-medium text-lg">个人信息</h2>
              <p className="text-apple-gray-400 text-sm">请填写您的基本信息</p>
            </div>
          </div>

          <BirthForm
            onSubmit={handleSubmit}
            disabled={isLoading}
            remainingUsage={0}
            points={0}
            detailedPrice={PRICES.full}
            hideUsageInfo={true}
          />

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-error/5 border border-error/20">
              <p className="text-error text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* 价格提示 */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            基础版 <span className="text-blue-500 font-medium">{formatPrice(PRICES.basic)}元</span> ·
            完整版 <span className="text-blue-500 font-medium">{formatPrice(PRICES.full)}元</span>
          </p>
        </div>
      </div>
      <Footer />

      {/* 支付选择弹窗 */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">选择版本</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              {pendingBirthInfo?.name}，选择适合您的版本
            </p>

            <div className="space-y-3">
              {/* 基础版 */}
              <button
                onClick={() => handleStartAnalysis('basic')}
                className="w-full py-4 px-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">基础版</h4>
                    <p className="text-sm text-gray-500">快速了解{curveMode === 'wealth' ? '财运' : '运势'}概览</p>
                  </div>
                  <span className="text-xl font-bold text-blue-500">{formatPrice(PRICES.basic)}元</span>
                </div>
              </button>

              {/* 完整版 */}
              <button
                onClick={() => handleStartAnalysis('full')}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all text-left relative"
              >
                <span className="absolute -top-2 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                  推荐
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">完整版</h4>
                    <p className="text-sm text-gray-500">深度分析 + 详细指导</p>
                  </div>
                  <span className="text-xl font-bold text-blue-500">{formatPrice(PRICES.full)}元</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowPayModal(false)}
              className="w-full mt-4 py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CurvePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-apple-gray-500">加载中...</span>
        </div>
      </div>
    }>
      <CurvePageContent />
    </Suspense>
  );
}
