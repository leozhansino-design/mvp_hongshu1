'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toDataURL as qrToDataURL } from 'qrcode';
import { getDeviceId } from '@/lib/device';

interface RechargeOption {
  id: number;
  price: number;   // cents
  points: number;
  label?: string;
  recommended?: boolean;
}

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  onSuccess: () => void;
}

type ModalView = 'select' | 'wechat_qr' | 'success';
type PayMethod = 'wechat' | 'alipay';

// 新价格阶梯配置
const FALLBACK_OPTIONS: RechargeOption[] = [
  { id: 1, price: 990, points: 100, label: '新手体验' },
  { id: 2, price: 1990, points: 220, label: '轻度用户' },
  { id: 3, price: 4990, points: 600, label: '主力档位', recommended: true },
  { id: 4, price: 9990, points: 1300, label: '高频用户' },
  { id: 5, price: 19990, points: 2800, label: '重度用户' },
  { id: 6, price: 49990, points: 8000, label: 'VIP用户' },
];

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}

export default function RechargeModal({
  isOpen,
  onClose,
  currentPoints,
  onSuccess,
}: RechargeModalProps) {
  const [view, setView] = useState<ModalView>('select');
  const [options, setOptions] = useState<RechargeOption[]>(FALLBACK_OPTIONS);
  const [selectedOption, setSelectedOption] = useState<RechargeOption | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // WeChat QR state
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recharge options
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        const res = await fetch('/api/pay/options');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.options) && data.options.length > 0) {
            setOptions(data.options);
          }
        }
      } catch {
        // Use fallback options silently
      }
    };

    loadOptions();
  }, [isOpen]);

  // Select first option by default
  useEffect(() => {
    if (isOpen && options.length > 0 && !selectedOption) {
      setSelectedOption(options[0]);
    }
  }, [isOpen, options, selectedOption]);

  // Cleanup on close or unmount
  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('select');
      setSelectedOption(null);
      setPayMethod('wechat');
      setError('');
      setQrDataUrl('');
      setOrderId('');
      setCountdown(300);
      setLoading(false);
      cleanup();
    }
  }, [isOpen, cleanup]);

  // Countdown timer for QR code
  useEffect(() => {
    if (view !== 'wechat_qr') return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          cleanup();
          setError('二维码已过期，请重新发起支付');
          setView('select');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [view, cleanup]);

  // Poll payment status
  const startPolling = useCallback(
    (oid: string) => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/pay/status?orderId=${encodeURIComponent(oid)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'paid') {
              cleanup();
              setView('success');
              onSuccess();
              setTimeout(() => {
                handleClose();
              }, 2000);
            }
          }
        } catch {
          // Polling error, continue silently
        }
      }, 2000);
    },
    [cleanup, onSuccess],
  );

  const handleClose = useCallback(() => {
    cleanup();
    setView('select');
    setError('');
    setQrDataUrl('');
    setOrderId('');
    setCountdown(300);
    setLoading(false);
    setSelectedOption(null);
    onClose();
  }, [cleanup, onClose]);

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('请选择充值套餐');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          optionId: selectedOption.id,
          payMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '创建订单失败');
        setLoading(false);
        return;
      }

      if (payMethod === 'wechat') {
        // Generate QR code data URL
        const codeUrl = data.codeUrl;
        if (!codeUrl) {
          setError('未获取到支付二维码');
          setLoading(false);
          return;
        }

        const dataUrl = await qrToDataURL(codeUrl, {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });

        setQrDataUrl(dataUrl);
        setOrderId(data.orderId);
        setCountdown(300);
        setView('wechat_qr');
        startPolling(data.orderId);
      } else {
        // Alipay redirect
        const payUrl = data.payUrl;
        if (payUrl) {
          window.location.href = payUrl;
        } else {
          setError('未获取到支付链接');
        }
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-base font-medium text-white">
            {view === 'wechat_qr' ? '微信支付' : view === 'success' ? '支付成功' : '充值积分'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* ===== SELECT VIEW ===== */}
          {view === 'select' && (
            <>
              {/* Current points */}
              <div className="mb-3 text-center">
                <span className="text-gray-400 text-sm">当前积分 </span>
                <span className="text-gold-400 font-bold text-lg">{currentPoints}</span>
              </div>

              {/* Package grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id;
                  // 计算优惠比例（基准：¥9.9/100积分 = 0.099元/积分）
                  const baseRate = 0.099;
                  const actualRate = opt.price / 100 / opt.points;
                  const bonusPercent = Math.round((1 - actualRate / baseRate) * 100);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt)}
                      className={`
                        relative rounded-lg p-2 text-center transition-all duration-150
                        ${
                          isSelected
                            ? 'bg-gold-400/10 border-2 border-gold-400 shadow-gold-glow'
                            : opt.recommended
                              ? 'bg-gold-400/5 border-2 border-gold-400/50 hover:border-gold-400'
                              : 'bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                        }
                      `}
                    >
                      {/* 推荐标签 */}
                      {opt.recommended && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-gold-400 text-black text-[10px] font-bold rounded-full">
                          推荐
                        </div>
                      )}
                      <div
                        className={`text-base font-bold ${
                          isSelected ? 'text-gold-400' : 'text-white'
                        }`}
                      >
                        &yen;{formatPrice(opt.price)}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          isSelected ? 'text-gold-500' : 'text-gray-300'
                        }`}
                      >
                        {opt.points}积分
                      </div>
                      {/* 优惠信息 */}
                      {bonusPercent > 0 && (
                        <div className="text-[10px] text-green-400">
                          +{bonusPercent}%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Payment method */}
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-2">支付方式</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPayMethod('wechat')}
                    className={`
                      flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150
                      ${
                        payMethod === 'wechat'
                          ? 'bg-gold-400/10 border-2 border-gold-400 text-gold-400'
                          : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-500'
                      }
                    `}
                  >
                    微信支付
                  </button>
                  <button
                    onClick={() => setPayMethod('alipay')}
                    className={`
                      flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150
                      ${
                        payMethod === 'alipay'
                          ? 'bg-gold-400/10 border-2 border-gold-400 text-gold-400'
                          : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-500'
                      }
                    `}
                  >
                    支付宝
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-xs text-center">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedOption}
                className="w-full py-2.5 bg-gold-400 hover:bg-gold-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors text-sm"
              >
                {loading ? '创建订单中...' : '立即支付'}
              </button>

              {/* Refund notice */}
              <p className="text-center text-[10px] text-gray-500 mt-2">
                退款请联系微信：lifecurveai
              </p>
            </>
          )}

          {/* ===== WECHAT QR VIEW ===== */}
          {view === 'wechat_qr' && selectedOption && (
            <div className="flex flex-col items-center py-2">
              {/* Amount */}
              <div className="mb-4 text-center">
                <span className="text-gray-400 text-sm">支付金额</span>
                <div className="text-gold-400 text-2xl font-bold mt-1">
                  &yen;{formatPrice(selectedOption.price)}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl p-3 mb-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="微信支付二维码"
                    width={240}
                    height={240}
                    className="block"
                  />
                ) : (
                  <div className="w-[240px] h-[240px] flex items-center justify-center text-gray-400">
                    加载中...
                  </div>
                )}
              </div>

              {/* Instructions */}
              <p className="text-gray-300 text-sm mb-3">请使用微信扫码支付</p>

              {/* Countdown */}
              <div className="text-gray-500 text-sm mb-4">
                {formatCountdown(countdown)} 后过期
              </div>

              {/* Error */}
              {error && (
                <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => {
                  cleanup();
                  setView('select');
                  setError('');
                  setCountdown(300);
                }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                返回选择套餐
              </button>
            </div>
          )}

          {/* ===== SUCCESS VIEW ===== */}
          {view === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-green-400 mb-2">支付成功!</h4>
              {selectedOption && (
                <p className="text-white text-lg">
                  已充值{' '}
                  <span className="text-gold-400 font-bold">
                    {selectedOption.points}
                  </span>{' '}
                  积分
                </p>
              )}
              <p className="text-gray-500 text-sm mt-3">即将自动关闭...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
