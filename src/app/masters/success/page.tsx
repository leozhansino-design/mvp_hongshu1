'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Consultation, formatPrice } from '@/types/master';
import { getAuthToken } from '@/services/auth';

function SuccessContent() {
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('id');

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/consultations/${consultationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setConsultation(data.consultation);
      } else {
        setError(data.message || '获取订单信息失败');
      }
    } catch (err) {
      setError('获取订单信息失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">!</div>
          <h1 className="text-2xl font-medium mb-4">订单信息获取失败</h1>
          <p className="text-text-secondary mb-8">{error || '请稍后重试'}</p>
          <Link
            href="/masters"
            className="inline-block px-6 py-3 bg-gold-400/20 text-gold-400 rounded-lg hover:bg-gold-400/30 transition-colors"
          >
            返回大师列表
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium mb-2">提交成功</h1>
          <p className="text-text-secondary">大师将在24小时内为您解读</p>
        </div>

        {/* Important Notice */}
        <div className="bg-gold-400/10 rounded-xl p-6 border border-gold-400/30 mb-6">
          <h2 className="text-lg font-medium text-center mb-4 text-gold-400">重要提示</h2>
          <p className="text-center text-white mb-4">
            大师测算完成后，将通过微信发送报告给您
          </p>
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-text-secondary">请添加客服微信：</span>
              <span className="text-gold-400 font-medium">lifecurve_ai</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-text-secondary">或关注公众号：</span>
              <span className="text-gold-400 font-medium">人生曲线AI</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-medium text-center mb-6">领取报告步骤</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <p className="text-white">添加客服微信 <span className="text-gold-400">lifecurve_ai</span></p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <p className="text-white">告知客服您的订单号</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <p className="text-white">大师完成测算后，报告将发送至您的微信</p>
              </div>
            </div>
          </div>

          {/* Service Account Prompt */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-text-secondary text-sm mb-3">
              您也可以关注公众号「人生曲线AI」获取更多命理资讯
            </p>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-medium mb-4">订单信息</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">订单号</span>
              <span className="text-white font-mono">{consultation.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">大师</span>
              <span className="text-white">{consultation.masterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">金额</span>
              <span className="text-gold-400">¥{formatPrice(consultation.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">提交时间</span>
              <span className="text-white">{formatDate(consultation.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-text-secondary text-sm mt-6">
          如有问题请联系客服微信：lifecurve_ai
        </p>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
