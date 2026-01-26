'use client';

import { useState, useEffect } from 'react';
import { checkUsageStatus, UsageStatus } from '@/lib/device';
import RedeemKeyModal from './RedeemKeyModal';

interface UsageStatusBarProps {
  curveMode?: 'life' | 'wealth';
  onStatusChange?: (status: UsageStatus) => void;
}

export default function UsageStatusBar({ curveMode = 'life', onStatusChange }: UsageStatusBarProps) {
  const [status, setStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

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
  }, [curveMode]);

  const handleRedeemSuccess = () => {
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

          {/* 兑换按钮 */}
          <button
            onClick={() => setShowRedeemModal(true)}
            className="px-4 py-2 bg-gold-400/20 hover:bg-gold-400/30 text-gold-400 text-sm rounded-lg transition-colors border border-gold-400/30"
          >
            兑换卡密
          </button>
        </div>

        {/* 提示信息 */}
        {currentFreeRemaining === 0 && status.points < 10 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-red-400/80 text-xs">
              {modeLabel}免费次数已用完，请兑换卡密获取积分继续使用
            </p>
          </div>
        )}

        {currentFreeRemaining === 0 && status.points >= 10 && status.points < 200 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-yellow-400/80 text-xs">
              {modeLabel}免费次数已用完，将消耗 10 积分生成报告
            </p>
          </div>
        )}
      </div>

      {/* 兑换卡密弹窗 */}
      <RedeemKeyModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        onSuccess={handleRedeemSuccess}
      />
    </>
  );
}
