'use client';

import { useState, useEffect } from 'react';
import { checkUsageStatus, UsageStatus } from '@/lib/device';
import RechargeModal from './RechargeModal';

interface UsageStatusBarProps {
  curveMode?: 'life' | 'wealth';
  onStatusChange?: (status: UsageStatus) => void;
  refreshKey?: number;
}

export default function UsageStatusBar({ curveMode = 'life', onStatusChange, refreshKey = 0 }: UsageStatusBarProps) {
  const [status, setStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  const loadStatus = async () => {
    try {
      const usageStatus = await checkUsageStatus(curveMode);
      setStatus(usageStatus);
      onStatusChange?.(usageStatus);
    } catch (error) {
      console.error('Failed to load usage status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [curveMode, refreshKey]);

  // 页面重新可见时刷新（从结果页返回时触发）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStatus();
      }
    };
    // pageshow 事件在浏览器后退时也会触发（包括从 bfcache 恢复时）
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        loadStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [curveMode]);

  const handleRechargeSuccess = () => {
    loadStatus();
  };

  if (loading) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-mystic-800/50 border border-gray-700">
        <div className="text-center text-text-secondary text-sm">加载中...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // 当前曲线类型的免费次数
  const currentFreeRemaining = curveMode === 'wealth'
    ? status.freeRemainingWealth
    : status.freeRemainingLife;

  const modeLabel = curveMode === 'wealth' ? '财富曲线' : '人生曲线';

  return (
    <>
      <div className="mt-6 p-4 rounded-lg bg-mystic-800/50 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* 免费次数 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">{modeLabel}免费：</span>
              <span className={`font-mono font-bold ${currentFreeRemaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentFreeRemaining}次
              </span>
            </div>

            {/* 积分显示 */}
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">积分：</span>
              <span className={`font-mono font-bold ${status.points > 0 ? 'text-gold-400' : 'text-gray-400'}`}>
                {status.points}
              </span>
            </div>
          </div>

          {/* 充值积分按钮 */}
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-4 py-2 bg-gold-400/20 hover:bg-gold-400/30 text-gold-400 text-sm rounded-lg transition-colors border border-gold-400/30"
          >
            充值积分
          </button>
        </div>

        {/* 提示信息 */}
        {currentFreeRemaining === 0 && status.points < 10 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-red-400/80 text-xs">
              {modeLabel}免费次数已用完，请充值积分继续使用
            </p>
          </div>
        )}

        {currentFreeRemaining === 0 && status.points >= 10 && status.points < 50 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-yellow-400/80 text-xs">
              {modeLabel}免费次数已用完，将消耗 10 积分生成报告
            </p>
          </div>
        )}
      </div>

      {/* 充值积分弹窗 */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        currentPoints={status.points}
        onSuccess={handleRechargeSuccess}
      />
    </>
  );
}
