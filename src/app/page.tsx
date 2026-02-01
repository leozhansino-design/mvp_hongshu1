'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, AnalysisLoader, UsageStatusBar, Footer } from '@/components';
import Header from '@/components/Header';
import { generateFreeResult, generatePaidResult, generateWealthCurve } from '@/services/api';
import {
  saveResult,
} from '@/services/storage';
import { trackPageView, trackButtonClick } from '@/services/analytics';
import { consumeUsage, UsageStatus, checkResultCache, saveResultCache } from '@/lib/device';
import { BirthInfo, StoredResult, CurveMode, FreeVersionResult, PaidVersionResult, WealthCurveData } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

const FALLBACK_GENERATED_COUNT = 41512;

// 简洁标题
const PAGE_TITLES: Record<CurveMode, string> = {
  life: '人生曲线',
  wealth: '财富曲线',
};

const PAGE_SUBTITLES: Record<CurveMode, string> = {
  life: '探索您的人生发展趋势',
  wealth: '了解您的财富增长轨迹',
};

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, setShowLoginModal, setLoginRedirectMessage } = useAuth();
  const [remainingUsage, setRemainingUsage] = useState(3);
  const [points, setPoints] = useState(0);
  const [detailedPrice, setDetailedPrice] = useState(200);
  const [totalGenerated, setTotalGenerated] = useState(FALLBACK_GENERATED_COUNT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curveMode, setCurveMode] = useState<CurveMode>('life');
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [pendingSubmission, setPendingSubmission] = useState<{ birthInfo: BirthInfo; isPaid: boolean } | null>(null);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'wealth') {
      setCurveMode('wealth');
    } else if (modeParam === 'life') {
      setCurveMode('life');
    }
  }, [searchParams]);

  const refreshUsageStatus = useCallback(async (mode: CurveMode) => {
    try {
      if (isLoggedIn && user) {
        const freeLimit = 1;
        if (mode === 'wealth') {
          setRemainingUsage(Math.max(0, freeLimit - user.freeUsedWealth));
        } else {
          setRemainingUsage(Math.max(0, freeLimit - user.freeUsed));
        }
        setPoints(user.points);
      } else {
        setRemainingUsage(1);
        setPoints(0);
      }
      setUsageRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to refresh usage status:', err);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const fetchTotalGenerated = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success && data.totalGenerated) {
          setTotalGenerated(data.totalGenerated);
        }
      } catch (error) {
        console.error('获取总生成次数失败:', error);
      }
    };
    fetchTotalGenerated();
    refreshUsageStatus(curveMode);
  }, [curveMode, refreshUsageStatus]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUsageStatus(curveMode);
      }
    };
    const handleFocus = () => {
      refreshUsageStatus(curveMode);
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshUsageStatus(curveMode);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [curveMode, refreshUsageStatus]);

  useEffect(() => {
    trackPageView('home', curveMode);
  }, [curveMode]);

  useEffect(() => {
    if (isLoggedIn && pendingSubmission) {
      const { birthInfo, isPaid } = pendingSubmission;
      setPendingSubmission(null);
      setTimeout(() => {
        handleSubmitInternal(birthInfo, isPaid);
      }, 100);
    }
  }, [isLoggedIn, pendingSubmission]);

  const handleSubmitInternal = useCallback(async (birthInfo: BirthInfo, isPaid: boolean = false) => {
    setIsLoading(true);
    setError(null);
    trackButtonClick('form_submit', 'home', { curveMode, isPaid });

    try {
      const resultId = uuidv4();
      const action = isPaid ? 'detailed' : 'free_overview';
      const consumeResult = await consumeUsage(
        action,
        birthInfo as unknown as Record<string, unknown>,
        resultId,
        curveMode
      );

      if (!consumeResult.success) {
        setError(consumeResult.error || '使用次数/积分不足');
        setIsLoading(false);
        return;
      }

      const cacheParams = {
        name: birthInfo.name,
        year: birthInfo.year,
        month: birthInfo.month,
        day: birthInfo.day,
        hour: birthInfo.hour,
        gender: birthInfo.gender,
        isLunar: birthInfo.calendarType === 'lunar',
        curveMode,
        isPaid,
      };
      const cacheResult = await checkResultCache(cacheParams);

      if (curveMode === 'wealth') {
        let wealthResult: WealthCurveData;
        if (cacheResult.found && cacheResult.resultData) {
          wealthResult = cacheResult.resultData as WealthCurveData;
        } else {
          wealthResult = await generateWealthCurve(birthInfo, isPaid);
          await saveResultCache({
            cacheKey: cacheResult.cacheKey,
            curveMode,
            isPaid,
            resultData: wealthResult,
            birthInfo,
          });
        }

        const storedResult: StoredResult = {
          id: resultId,
          birthInfo,
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
            paidResult = await generatePaidResult(birthInfo);
            await saveResultCache({
              cacheKey: cacheResult.cacheKey,
              curveMode,
              isPaid,
              resultData: paidResult,
              birthInfo,
            });
          }
          storedResult = {
            id: resultId,
            birthInfo,
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
            freeResult = await generateFreeResult(birthInfo);
            await saveResultCache({
              cacheKey: cacheResult.cacheKey,
              curveMode,
              isPaid,
              resultData: freeResult,
              birthInfo,
            });
          }
          storedResult = {
            id: resultId,
            birthInfo,
            freeResult,
            isPaid: false,
            createdAt: Date.now(),
          };
        }

        saveResult(storedResult);
        fetch('/api/stats', { method: 'POST' }).catch(console.error);
        router.push(`/result/${resultId}`);
      }

      refreshUsageStatus(curveMode);
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后再试');
      setIsLoading(false);
      refreshUsageStatus(curveMode);
    }
  }, [router, curveMode, refreshUsageStatus]);

  const handleSubmit = useCallback((birthInfo: BirthInfo, isPaid: boolean = false) => {
    if (!isLoggedIn) {
      setPendingSubmission({ birthInfo, isPaid });
      setLoginRedirectMessage(isPaid ? '请先登录后使用完整版' : '请先登录后使用');
      setShowLoginModal(true);
      return;
    }
    handleSubmitInternal(birthInfo, isPaid);
  }, [isLoggedIn, handleSubmitInternal, setLoginRedirectMessage, setShowLoginModal]);

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
            remainingUsage={remainingUsage}
            points={points}
            detailedPrice={detailedPrice}
          />

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-error/5 border border-error/20">
              <p className="text-error text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Usage Status */}
        <div className="w-full max-w-md">
          <UsageStatusBar
            curveMode={curveMode}
            refreshKey={usageRefreshKey}
            onStatusChange={(status: UsageStatus) => {
              if (curveMode === 'wealth') {
                setRemainingUsage(status.freeRemainingWealth);
              } else {
                setRemainingUsage(status.freeRemainingLife);
              }
              setPoints(status.points);
              setDetailedPrice(status.detailedPrice);
            }}
          />
        </div>

        {/* Stats Badge */}
        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-apple-gray-100">
          <div className="w-2 h-2 rounded-full bg-success"></div>
          <span className="text-sm text-apple-gray-500">
            已为 <span className="text-apple-blue font-medium">{totalGenerated.toLocaleString()}</span> 人生成分析报告
          </span>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-apple-gray-500">加载中...</span>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
