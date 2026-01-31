'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Master, formatPrice, formatFollowUps, getFocusHint } from '@/types/master';
import { getAuthToken } from '@/services/auth';
import QRCode from 'qrcode';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  master: Master;
}

type PayMethod = 'wechat' | 'alipay';

// 十二时辰定义
const SHI_CHEN_OPTIONS = [
  { value: 0, label: '子时', time: '23:00-01:00' },
  { value: 1, label: '丑时', time: '01:00-03:00' },
  { value: 3, label: '寅时', time: '03:00-05:00' },
  { value: 5, label: '卯时', time: '05:00-07:00' },
  { value: 7, label: '辰时', time: '07:00-09:00' },
  { value: 9, label: '巳时', time: '09:00-11:00' },
  { value: 11, label: '午时', time: '11:00-13:00' },
  { value: 13, label: '未时', time: '13:00-15:00' },
  { value: 15, label: '申时', time: '15:00-17:00' },
  { value: 17, label: '酉时', time: '17:00-19:00' },
  { value: 19, label: '戌时', time: '19:00-21:00' },
  { value: 21, label: '亥时', time: '21:00-23:00' },
];

export default function ConsultationModal({
  isOpen,
  onClose,
  master,
}: ConsultationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'payment'>('form');

  // Form state
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthDay, setBirthDay] = useState<number>(1);
  const [shiChen, setShiChen] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [question, setQuestion] = useState('');

  // Payment state
  const [payMethod, setPayMethod] = useState<PayMethod>('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [consultationId, setConsultationId] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate years from 1940 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1939 }, (_, i) => 1940 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Calculate bazi when birth info changes
  const baziResult = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay || shiChen === '') return null;
    return calculateBazi(birthYear, birthMonth, birthDay, shiChen as number, 0, false);
  }, [birthYear, birthMonth, birthDay, shiChen]);

  // Calculate dayun when bazi and gender are available
  const daYunResult = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay || shiChen === '') return null;
    return calculateDaYun(birthYear, birthMonth, birthDay, shiChen as number, 0, gender, false);
  }, [birthYear, birthMonth, birthDay, shiChen, gender]);

  // Calculate focus hint based on age and gender
  const focusHint = useMemo(() => {
    if (!birthYear) return null;
    return getFocusHint(birthYear, gender);
  }, [birthYear, gender]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError('');
      setQrCodeUrl('');
      setConsultationId('');
      setPaymentError('');
      setVerifying(false);
    }
  }, [isOpen]);

  // Generate QR code
  useEffect(() => {
    if (qrCodeUrl && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrCodeUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [qrCodeUrl]);

  // Poll payment status when in payment step
  useEffect(() => {
    if (step !== 'payment' || !consultationId) return;

    const checkPaymentStatus = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`/api/consultations/${consultationId}?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        const data = await response.json();

        if (response.ok && data.consultation?.paymentStatus === 'paid') {
          // Payment confirmed, redirect to success page
          router.push(`/masters/success?id=${consultationId}`);
          onClose();
        }
      } catch (err) {
        // Silently ignore polling errors
        console.error('Payment status check failed:', err);
      }
    };

    // Check immediately once
    checkPaymentStatus();

    // Then poll every 3 seconds
    const intervalId = setInterval(checkPaymentStatus, 3000);

    return () => clearInterval(intervalId);
  }, [step, consultationId, router, onClose]);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('请输入您的姓名');
      return;
    }

    if (!wechatId.trim()) {
      setError('请输入您的微信号');
      return;
    }

    if (shiChen === '') {
      setError('请选择出生时辰');
      return;
    }

    if (!question.trim() || question.trim().length < 10) {
      setError('问题描述至少10个字');
      return;
    }

    if (question.length > 500) {
      setError('问题描述不能超过500字');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      // Get the shichen label for display
      const shiChenOption = SHI_CHEN_OPTIONS.find(o => o.value === shiChen);
      const birthTime = shiChenOption ? `${shiChenOption.label} (${shiChenOption.time})` : '';

      const response = await fetch('/api/consultations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          masterId: master.id,
          birthYear,
          birthMonth,
          birthDay,
          birthTime,
          gender,
          name: name.trim(),
          wechatId: wechatId.trim(),
          question: question.trim(),
          payMethod,
          // Include bazi data for master reference
          baziData: baziResult ? {
            eightChar: baziResult.eightChar,
            lunar: baziResult.lunar,
            dayMasterElement: baziResult.dayMasterElement,
          } : undefined,
          daYunData: daYunResult ? {
            startInfo: daYunResult.startInfo,
            daYunList: daYunResult.daYunList.slice(0, 5), // First 5 大运
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败');
      }

      setConsultationId(data.consultationId);

      if (payMethod === 'wechat' && data.codeUrl) {
        setQrCodeUrl(data.codeUrl);
        setStep('payment');
      } else if (payMethod === 'alipay' && data.payUrl) {
        // Redirect to Alipay
        window.location.href = data.payUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  // Payment verification state
  const [verifying, setVerifying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePaymentComplete = async () => {
    if (!consultationId) return;

    setVerifying(true);
    setPaymentError('');

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/consultations/${consultationId}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '查询订单失败');
      }

      // Check if payment is completed
      if (data.consultation?.paymentStatus === 'paid') {
        router.push(`/masters/success?id=${consultationId}`);
        onClose();
      } else {
        setPaymentError('支付未完成，请完成支付后再试');
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : '查询订单失败，请稍后再试');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-gray-900 rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {master.avatar ? (
              <img
                src={master.avatar}
                alt={master.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400/30 to-purple-500/30 flex items-center justify-center text-base font-serif text-gold-400">
                {master.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-base font-medium text-white">{master.name}</h3>
              <p className="text-xs text-text-secondary">
                {master.wordCount}字解读 · 可追问{formatFollowUps(master.followUps)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'form' ? (
          <div className="p-4">
            {/* Birth Info */}
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-2">您的生辰</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}月</option>
                  ))}
                </select>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}日</option>
                  ))}
                </select>
              </div>
              <select
                value={shiChen}
                onChange={(e) => setShiChen(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
              >
                <option value="">请选择时辰</option>
                {SHI_CHEN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.time})
                  </option>
                ))}
              </select>
            </div>

            {/* Bazi Display */}
            {baziResult && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="text-xs text-text-secondary mb-2">您的八字</div>
                <div className="grid grid-cols-4 gap-1.5 text-center mb-2">
                  <div>
                    <div className="text-[10px] text-gray-500">年柱</div>
                    <div className="text-gold-400 font-medium text-sm">{baziResult.eightChar.year}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">月柱</div>
                    <div className="text-gold-400 font-medium text-sm">{baziResult.eightChar.month}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">日柱</div>
                    <div className="text-gold-400 font-medium text-sm">{baziResult.eightChar.day}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">时柱</div>
                    <div className="text-gold-400 font-medium text-sm">{baziResult.eightChar.hour}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>农历: {baziResult.lunar.monthCn}月{baziResult.lunar.dayCn}</span>
                  <span>日主: {baziResult.dayMasterElement}</span>
                </div>
              </div>
            )}

            {/* DaYun Display */}
            {daYunResult && daYunResult.daYunList.length > 0 && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="text-xs text-text-secondary mb-2">大运流年</div>
                <div className="text-[10px] text-gray-400 mb-2">{daYunResult.startInfo}</div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {daYunResult.daYunList.slice(0, 6).map((daYun, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 px-2 py-1.5 bg-gray-700/50 rounded text-center min-w-[50px]"
                    >
                      <div className="text-gold-400 font-medium text-xs">{daYun.ganZhi}</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">{daYun.startAge}-{daYun.endAge}岁</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Hint Display */}
            {focusHint && (
              <div className="mb-4 p-3 bg-gold-400/10 rounded-lg border border-gold-400/30">
                <div className="flex items-center gap-2">
                  <span className="text-gold-400 text-sm font-medium">{focusHint.label}</span>
                  <span className="text-xs text-gold-400/70">解读侧重</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{focusHint.description}</div>
              </div>
            )}

            {/* Gender */}
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1.5">性别 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                    gender === 'male'
                      ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  男
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                    gender === 'female'
                      ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  女
                </button>
              </div>
            </div>

            {/* Name + WeChat ID */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  maxLength={20}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">
                  微信号 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={wechatId}
                  onChange={(e) => setWechatId(e.target.value)}
                  placeholder="用于交付报告"
                  maxLength={30}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1.5">您的问题</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="请详细描述您的问题和困惑..."
                maxLength={500}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-gold-400 focus:outline-none resize-none"
              />
              <div className="flex justify-between text-[10px] mt-1">
                <span className="text-amber-400/80">💡 如涉及感情问题，提供对方生辰可获更准确解读</span>
                <span className="text-text-secondary">{question.length}/500字</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1.5">支付方式</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('wechat')}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-sm transition-colors ${
                    payMethod === 'wechat'
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 0 0 .166-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.833.403c.235 0 .465-.013.693-.027a5.913 5.913 0 0 1-.333-1.96c0-3.558 3.389-6.444 7.568-6.444.3 0 .594.017.884.047C16.87 4.689 13.104 2.188 8.691 2.188zm-2.528 4.39c.567 0 1.024.457 1.024 1.023 0 .566-.457 1.023-1.024 1.023-.566 0-1.023-.457-1.023-1.023 0-.566.457-1.024 1.023-1.024zm4.674 0c.567 0 1.024.457 1.024 1.023 0 .566-.457 1.023-1.024 1.023-.566 0-1.023-.457-1.023-1.023 0-.566.457-1.024 1.023-1.024z"/>
                    <path d="M23.993 14.942c0-3.235-3.187-5.858-7.12-5.858-3.932 0-7.12 2.623-7.12 5.858 0 3.236 3.188 5.859 7.12 5.859.86 0 1.68-.125 2.438-.348a.73.73 0 0 1 .607.082l1.614.941a.272.272 0 0 0 .14.046.248.248 0 0 0 .25-.249c0-.061-.025-.121-.042-.181l-.331-1.252a.502.502 0 0 1 .18-.561c1.55-1.136 2.264-2.808 2.264-4.337zm-9.513-.838c-.478 0-.867-.389-.867-.868 0-.478.389-.866.867-.866.479 0 .867.388.867.866 0 .479-.388.868-.867.868zm4.786 0c-.478 0-.867-.389-.867-.868 0-.478.389-.866.867-.866.479 0 .867.388.867.866 0 .479-.388.868-.867.868z"/>
                  </svg>
                  微信
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('alipay')}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-sm transition-colors ${
                    payMethod === 'alipay'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12zm-6.75-3.75c0-.621-.504-1.125-1.125-1.125H9.75c-.621 0-1.125.504-1.125 1.125v6c0 .621.504 1.125 1.125 1.125h4.875c.621 0 1.125-.504 1.125-1.125v-6z"/>
                  </svg>
                  支付宝
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-gold-400 to-amber-500 text-black font-medium rounded-lg hover:from-gold-300 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  处理中...
                </span>
              ) : (
                `支付 ¥${formatPrice(master.price)} 提交咨询`
              )}
            </button>

            {/* Refund Notice */}
            <p className="text-center text-text-secondary text-xs mt-3">
              不满意全额退款
            </p>
          </div>
        ) : (
          // Payment QR Code View
          <div className="p-4 text-center">
            <h3 className="text-base font-medium text-white mb-1">请扫码支付</h3>
            <p className="text-text-secondary text-sm mb-4">
              支付金额：¥{formatPrice(master.price)}
            </p>

            <div className="bg-white p-3 rounded-lg inline-block mb-4">
              <canvas ref={qrCanvasRef} />
            </div>

            <p className="text-text-secondary text-xs mb-2">
              请使用微信扫描二维码完成支付
            </p>
            <p className="text-green-400/80 text-xs mb-4">
              支付成功后将自动跳转
            </p>

            {/* Payment Error */}
            {paymentError && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                {paymentError}
              </div>
            )}

            <button
              onClick={handlePaymentComplete}
              disabled={verifying}
              className="w-full py-2.5 bg-gradient-to-r from-gold-400 to-amber-500 text-black font-medium rounded-lg hover:from-gold-300 hover:to-amber-400 transition-all text-sm disabled:opacity-50"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  验证中...
                </span>
              ) : (
                '我已完成支付'
              )}
            </button>

            <button
              onClick={() => {
                setStep('form');
                setPaymentError('');
              }}
              disabled={verifying}
              className="w-full py-2 mt-2 text-text-secondary hover:text-white transition-colors text-sm disabled:opacity-50"
            >
              返回修改
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
