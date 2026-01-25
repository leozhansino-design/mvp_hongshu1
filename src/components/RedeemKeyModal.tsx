'use client';

import { useState } from 'react';
import { redeemKeyCode } from '@/lib/device';

interface RedeemKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (points: number) => void;
}

export default function RedeemKeyModal({ isOpen, onClose, onSuccess }: RedeemKeyModalProps) {
  const [keyCode, setKeyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ points: number; total: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyCode.trim()) {
      setError('请输入卡密');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const result = await redeemKeyCode(keyCode.trim());

      if (result.success) {
        setSuccess({
          points: result.pointsAdded!,
          total: result.totalPoints!,
        });
        onSuccess?.(result.pointsAdded!);
        setKeyCode('');
      } else {
        setError(result.error || '兑换失败');
      }
    } catch {
      setError('兑换失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setKeyCode('');
    setError('');
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70" onClick={handleClose}></div>

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">兑换卡密</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {success ? (
            // 成功状态
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-green-400 mb-2">兑换成功!</h4>
              <p className="text-white text-lg mb-1">
                获得 <span className="text-gold-400 font-bold">{success.points}</span> 积分
              </p>
              <p className="text-gray-400 text-sm">
                当前积分：{success.total}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                完成
              </button>
            </div>
          ) : (
            // 输入表单
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">请输入卡密</label>
                <input
                  type="text"
                  value={keyCode}
                  onChange={(e) => {
                    setKeyCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="LC-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-center font-mono text-lg tracking-wider focus:outline-none focus:border-gold-400 placeholder:text-gray-500"
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !keyCode.trim()}
                className="w-full py-3 bg-gold-400 hover:bg-gold-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors"
              >
                {loading ? '兑换中...' : '兑换'}
              </button>

              <p className="mt-4 text-gray-500 text-xs text-center">
                卡密格式：LC-XXXX-XXXX-XXXX
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
