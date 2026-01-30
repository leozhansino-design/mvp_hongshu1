'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Master, formatPrice, formatFollowUps } from '@/types/master';
import { getAuthToken } from '@/services/auth';
import QRCode from 'qrcode';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  master: Master;
}

type PayMethod = 'wechat' | 'alipay';

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
  const [birthHour, setBirthHour] = useState<string>('');
  const [birthMinute, setBirthMinute] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');
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
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  // Calculate bazi when birth info changes
  const baziResult = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay) return null;
    const hour = birthHour ? parseInt(birthHour) : 12;
    const minute = birthMinute ? parseInt(birthMinute) : 0;
    return calculateBazi(birthYear, birthMonth, birthDay, hour, minute, false);
  }, [birthYear, birthMonth, birthDay, birthHour, birthMinute]);

  // Calculate dayun when bazi and gender are available
  const daYunResult = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay) return null;
    const hour = birthHour ? parseInt(birthHour) : 12;
    const minute = birthMinute ? parseInt(birthMinute) : 0;
    return calculateDaYun(birthYear, birthMonth, birthDay, hour, minute, gender, false);
  }, [birthYear, birthMonth, birthDay, birthHour, birthMinute, gender]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError('');
      setQrCodeUrl('');
      setConsultationId('');
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

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('请输入您的姓名');
      return;
    }

    if (!birthHour || !birthMinute) {
      setError('请选择完整的出生时间');
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
      const birthTime = birthHour && birthMinute ? `${birthHour}:${birthMinute}` : '';

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

  const handlePaymentComplete = () => {
    if (consultationId) {
      router.push(`/masters/success?id=${consultationId}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {master.avatar ? (
              <img
                src={master.avatar}
                alt={master.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400/30 to-purple-500/30 flex items-center justify-center text-lg font-serif text-gold-400">
                {master.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-white">{master.name}</h3>
              <p className="text-sm text-text-secondary">
                {master.wordCount}字解读 · 可追问{formatFollowUps(master.followUps)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'form' ? (
          <div className="p-6">
            {/* Birth Info */}
            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-3">您的生辰</label>
              <div className="grid grid-cols-5 gap-2">
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}月</option>
                  ))}
                </select>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}日</option>
                  ))}
                </select>
                <select
                  value={birthHour}
                  onChange={(e) => setBirthHour(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  <option value="">时</option>
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>{hour}时</option>
                  ))}
                </select>
                <select
                  value={birthMinute}
                  onChange={(e) => setBirthMinute(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  <option value="">分</option>
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>{minute}分</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bazi Display */}
            {baziResult && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="text-sm text-text-secondary mb-3">您的八字</div>
                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">年柱</div>
                    <div className="text-gold-400 font-medium">{baziResult.eightChar.year}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">月柱</div>
                    <div className="text-gold-400 font-medium">{baziResult.eightChar.month}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">日柱</div>
                    <div className="text-gold-400 font-medium">{baziResult.eightChar.day}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">时柱</div>
                    <div className="text-gold-400 font-medium">{baziResult.eightChar.hour}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>农历: {baziResult.lunar.monthCn}月{baziResult.lunar.dayCn}</span>
                  <span>日主: {baziResult.dayMasterElement}</span>
                </div>
              </div>
            )}

            {/* DaYun Display */}
            {daYunResult && daYunResult.daYunList.length > 0 && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="text-sm text-text-secondary mb-3">大运流年</div>
                <div className="text-xs text-gray-400 mb-3">{daYunResult.startInfo}</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {daYunResult.daYunList.slice(0, 6).map((daYun, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 px-3 py-2 bg-gray-700/50 rounded-lg text-center min-w-[60px]"
                    >
                      <div className="text-gold-400 font-medium text-sm">{daYun.ganZhi}</div>
                      <div className="text-gray-500 text-xs mt-1">{daYun.startAge}-{daYun.endAge}岁</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gender */}
            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-3">性别</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2.5 rounded-lg border transition-colors ${
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
                  className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                    gender === 'female'
                      ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  女
                </button>
              </div>
            </div>

            {/* Name (required) */}
            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-3">
                您的姓名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名（必填）"
                maxLength={20}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none"
              />
            </div>

            {/* Question */}
            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-3">您的问题</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="请详细描述您的问题和困惑，越详细解读越准确..."
                maxLength={500}
                rows={5}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none resize-none"
              />
              <div className="text-right text-sm text-text-secondary mt-1">
                {question.length}/500字
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-3">支付方式</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPayMethod('wechat')}
                  className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                    payMethod === 'wechat'
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 0 0 .166-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.833.403c.235 0 .465-.013.693-.027a5.913 5.913 0 0 1-.333-1.96c0-3.558 3.389-6.444 7.568-6.444.3 0 .594.017.884.047C16.87 4.689 13.104 2.188 8.691 2.188zm-2.528 4.39c.567 0 1.024.457 1.024 1.023 0 .566-.457 1.023-1.024 1.023-.566 0-1.023-.457-1.023-1.023 0-.566.457-1.024 1.023-1.024zm4.674 0c.567 0 1.024.457 1.024 1.023 0 .566-.457 1.023-1.024 1.023-.566 0-1.023-.457-1.023-1.023 0-.566.457-1.024 1.023-1.024z"/>
                    <path d="M23.993 14.942c0-3.235-3.187-5.858-7.12-5.858-3.932 0-7.12 2.623-7.12 5.858 0 3.236 3.188 5.859 7.12 5.859.86 0 1.68-.125 2.438-.348a.73.73 0 0 1 .607.082l1.614.941a.272.272 0 0 0 .14.046.248.248 0 0 0 .25-.249c0-.061-.025-.121-.042-.181l-.331-1.252a.502.502 0 0 1 .18-.561c1.55-1.136 2.264-2.808 2.264-4.337zm-9.513-.838c-.478 0-.867-.389-.867-.868 0-.478.389-.866.867-.866.479 0 .867.388.867.866 0 .479-.388.868-.867.868zm4.786 0c-.478 0-.867-.389-.867-.868 0-.478.389-.866.867-.866.479 0 .867.388.867.866 0 .479-.388.868-.867.868z"/>
                  </svg>
                  微信支付
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('alipay')}
                  className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                    payMethod === 'alipay'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'border-gray-700 text-text-secondary hover:border-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12zm-6.75-3.75c0-.621-.504-1.125-1.125-1.125H9.75c-.621 0-1.125.504-1.125 1.125v6c0 .621.504 1.125 1.125 1.125h4.875c.621 0 1.125-.504 1.125-1.125v-6z"/>
                  </svg>
                  支付宝
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-black font-medium rounded-lg hover:from-gold-300 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  处理中...
                </span>
              ) : (
                `支付 ¥${formatPrice(master.price)} 提交咨询`
              )}
            </button>

            {/* Refund Notice */}
            <p className="text-center text-text-secondary text-sm mt-4">
              不满意全额退款
            </p>
          </div>
        ) : (
          // Payment QR Code View
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-white mb-2">请扫码支付</h3>
            <p className="text-text-secondary text-sm mb-6">
              支付金额：¥{formatPrice(master.price)}
            </p>

            <div className="bg-white p-4 rounded-xl inline-block mb-6">
              <canvas ref={qrCanvasRef} />
            </div>

            <p className="text-text-secondary text-sm mb-6">
              请使用微信扫描二维码完成支付
            </p>

            <button
              onClick={handlePaymentComplete}
              className="w-full py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-black font-medium rounded-lg hover:from-gold-300 hover:to-amber-400 transition-all"
            >
              我已完成支付
            </button>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3 mt-3 text-text-secondary hover:text-white transition-colors"
            >
              返回修改
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
