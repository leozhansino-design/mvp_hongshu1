'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, AnalysisLoader, UsageStatusBar, Footer } from '@/components';
import Header from '@/components/Header';
import { generateFreeResult, generatePaidResult, generateWealthCurve } from '@/services/api';
import {
  saveResult,
  getTotalGeneratedCount,
} from '@/services/storage';
import { trackPageView, trackButtonClick } from '@/services/analytics';
import { checkUsageStatus, consumeUsage, UsageStatus, checkResultCache, saveResultCache } from '@/lib/device';
import { BirthInfo, StoredResult, CurveMode, CURVE_MODE_LABELS, FreeVersionResult, PaidVersionResult, WealthCurveData } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

// 基础统计数（运营初始值）
const BASE_GENERATED_COUNT = 23847;

// 主页面内容组件
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, setShowLoginModal, setLoginRedirectMessage, updateFreeUsed, updatePoints } = useAuth();
  const [remainingUsage, setRemainingUsage] = useState(3);
  const [points, setPoints] = useState(0);
  const [totalGenerated, setTotalGenerated] = useState(BASE_GENERATED_COUNT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curveMode, setCurveMode] = useState<CurveMode>('life');
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  // 存储待提交的表单数据（用于登录后继续）
  const [pendingSubmission, setPendingSubmission] = useState<{ birthInfo: BirthInfo; isPaid: boolean } | null>(null);

  // 从 URL 读取模式参数
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'wealth') {
      setCurveMode('wealth');
    } else if (modeParam === 'life') {
      setCurveMode('life');
    }
  }, [searchParams]);

  // 刷新使用状态（从服务器/用户状态加载）
  const refreshUsageStatus = useCallback(async (mode: CurveMode) => {
    try {
      // 如果已登录，使用用户的数据
      if (isLoggedIn && user) {
        const freeLimit = 1; // 每种模式免费1次
        if (mode === 'wealth') {
          setRemainingUsage(Math.max(0, freeLimit - user.freeUsedWealth));
        } else {
          setRemainingUsage(Math.max(0, freeLimit - user.freeUsed));
        }
        setPoints(user.points);
      } else {
        // 未登录时显示默认值（需要登录才能使用）
        setRemainingUsage(1); // 显示有1次免费机会，但点击时会要求登录
        setPoints(0);
      }
      // 通知 UsageStatusBar 也刷新
      setUsageRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to refresh usage status:', err);
    }
  }, [isLoggedIn, user]);

  // 初始加载 + 曲线模式变化时刷新
  useEffect(() => {
    setTotalGenerated(BASE_GENERATED_COUNT + getTotalGeneratedCount());
    refreshUsageStatus(curveMode);
  }, [curveMode, refreshUsageStatus]);

  // 页面可见性变化时刷新（从结果页返回时触发）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUsageStatus(curveMode);
      }
    };
    const handleFocus = () => {
      refreshUsageStatus(curveMode);
    };
    // pageshow 事件在浏览器后退时也会触发（包括从 bfcache 恢复时）
    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted 为 true 表示页面从 bfcache 恢复
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

  // 追踪页面访问
  useEffect(() => {
    trackPageView('home', curveMode);
  }, [curveMode]);

  // 登录成功后处理待提交的表单
  useEffect(() => {
    if (isLoggedIn && pendingSubmission) {
      // 清空待提交数据，然后提交
      const { birthInfo, isPaid } = pendingSubmission;
      setPendingSubmission(null);
      // 延迟一下以确保状态更新
      setTimeout(() => {
        handleSubmitInternal(birthInfo, isPaid);
      }, 100);
    }
  }, [isLoggedIn, pendingSubmission]);

  // 内部提交函数（需要已登录）
  const handleSubmitInternal = useCallback(async (birthInfo: BirthInfo, isPaid: boolean = false) => {
    setIsLoading(true);
    setError(null);

    // 追踪表单提交点击
    trackButtonClick('form_submit', 'home', { curveMode, isPaid });

    try {
      const resultId = uuidv4();

      // 先消耗使用次数/积分（服务端扣费）
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

      // 检查缓存（确保同一用户同样信息返回一致结果）
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
        // 财富曲线模式
        let wealthResult: WealthCurveData;

        if (cacheResult.found && cacheResult.resultData) {
          // 使用缓存结果
          wealthResult = cacheResult.resultData as WealthCurveData;
        } else {
          // 生成新结果
          wealthResult = await generateWealthCurve(birthInfo, isPaid);
          // 保存到缓存（等待完成确保一致性）
          await saveResultCache({
            cacheKey: cacheResult.cacheKey,
            curveMode,
            isPaid,
            resultData: wealthResult,
            birthInfo,
          });
        }

        // 存储财富曲线结果
        const storedResult: StoredResult = {
          id: resultId,
          birthInfo,
          isPaid,
          createdAt: Date.now(),
          wealthResult,
          curveMode: 'wealth',
        };

        saveResult(storedResult);
        router.push(`/result/${resultId}?mode=wealth`);
      } else {
        // 人生曲线模式
        let storedResult: StoredResult;

        if (isPaid) {
          let paidResult: PaidVersionResult;

          if (cacheResult.found && cacheResult.resultData) {
            // 使用缓存结果
            paidResult = cacheResult.resultData as PaidVersionResult;
          } else {
            // 生成新结果
            paidResult = await generatePaidResult(birthInfo);
            // 保存到缓存（等待完成确保一致性）
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
            // 使用缓存结果
            freeResult = cacheResult.resultData as FreeVersionResult;
          } else {
            // 生成新结果
            freeResult = await generateFreeResult(birthInfo);
            // 保存到缓存（等待完成确保一致性）
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
        router.push(`/result/${resultId}`);
      }

      // 刷新使用状态（在后台刷新，不阻塞跳转）
      refreshUsageStatus(curveMode);
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '天机运算失败，请稍后再试');
      setIsLoading(false);
      // 生成失败时也刷新状态（扣费已成功但生成失败的情况）
      refreshUsageStatus(curveMode);
    }
  }, [router, curveMode, refreshUsageStatus]);

  // 外部提交函数（检查登录状态）
  const handleSubmit = useCallback((birthInfo: BirthInfo, isPaid: boolean = false) => {
    // 必须登录才能使用
    if (!isLoggedIn) {
      // 保存待提交的数据
      setPendingSubmission({ birthInfo, isPaid });
      // 显示登录弹窗
      setLoginRedirectMessage(isPaid ? '请先登录后再使用精批功能' : '请先登录后再使用免费概览');
      setShowLoginModal(true);
      return;
    }

    // 已登录，直接提交
    handleSubmitInternal(birthInfo, isPaid);
  }, [isLoggedIn, handleSubmitInternal, setLoginRedirectMessage, setShowLoginModal]);

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
          {curveMode === 'wealth' && (
            <p className="text-gold-400/60 text-xs mt-2">
              已考虑年化2.5%通胀因素，显示未来名义财富值
            </p>
          )}
        </div>

        <div className={`mystic-card-gold w-full max-w-md ${
          curveMode === 'wealth' ? 'border-gold-400/30' : ''
        }`}>
          <BirthForm
            onSubmit={handleSubmit}
            disabled={isLoading}
            remainingUsage={remainingUsage}
            points={points}
          />

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* 使用状态栏 - 显示免费次数和积分 */}
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
            }}
          />
        </div>

        <p className="mt-6 md:mt-8 text-xs md:text-sm text-text-secondary">
          已有 <span className="text-gold-400 font-mono">{totalGenerated.toLocaleString()}</span> 人生成过命盘报告
        </p>
      </div>
      <Footer />
    </div>
  );
}

// 导出包装组件，使用 Suspense 包裹
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">加载中...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
