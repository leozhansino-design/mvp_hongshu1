'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components';

// 测试产品数据
const TEST_PRODUCTS: Record<string, {
  slug: string;
  icon: string;
  name: string;
  englishName?: string;
  subtitle: string;
  description: string;
  color: string;
  questionCount: number | null;
  duration: string;
  priceBasic: number;
  priceFull: number;
  category: string;
  isActive: boolean;
  features: string[];
  basicIncludes: string[];
  fullIncludes: string[];
}> = {
  'enneagram': {
    slug: 'enneagram',
    icon: '🧠',
    name: '九型人格测试',
    englishName: 'Enneagram of Personality',
    subtitle: '探索你的核心人格类型',
    description: '九型人格将人的性格分为九种核心类型，揭示你内在最深层的价值观、恐惧和渴望。通过144道题目的科学测试，发现真实的自己，了解自己的优势和成长方向。',
    color: '#F5F0FF',
    questionCount: 144,
    duration: '15-20分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'personality',
    isActive: true,
    features: ['144 道题目', '约 15-20 分钟', '9 种人格类型', '专业分析报告'],
    basicIncludes: ['核心人格类型', '侧翼类型分析', '雷达图得分', '200字简要分析'],
    fullIncludes: ['全部基础版内容', '2000字深度分析', '核心恐惧与渴望', '成长方向建议', '人际关系指南', '职业发展建议', '与其他类型相处之道'],
  },
  'life-curve': {
    slug: 'life-curve',
    icon: '🔮',
    name: '人生曲线',
    subtitle: '探索您的人生发展趋势',
    description: '基于传统八字命理学，结合AI分析技术，为您呈现一生的运势起伏。找出人生中的高峰期和低谷期，提前做好准备。',
    color: '#FFF5F5',
    questionCount: null,
    duration: '3分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'fun',
    isActive: true,
    features: ['输入生辰八字', '约 3 分钟', '一生运势曲线', 'AI智能分析'],
    basicIncludes: ['人生运势曲线图', '总体运势评分', '简要运势分析'],
    fullIncludes: ['全部基础版内容', '详细八字分析', '性格特征解读', '事业发展建议', '婚姻感情分析', '健康注意事项', '每年运势详解'],
  },
  'wealth-curve': {
    slug: 'wealth-curve',
    icon: '💰',
    name: '财富曲线',
    subtitle: '预测您的财富发展走势',
    description: '专注于财运分析，预测您的财富增长轨迹。了解财运高峰期，把握投资机会，规避财务风险。',
    color: '#FFFFF0',
    questionCount: null,
    duration: '3分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'fun',
    isActive: true,
    features: ['输入生辰八字', '约 3 分钟', '财富走势曲线', 'AI智能分析'],
    basicIncludes: ['财富走势曲线图', '总体财运评分', '简要财运分析'],
    fullIncludes: ['全部基础版内容', '详细财运分析', '正财偏财解读', '投资时机建议', '理财方向指引', '财富增长策略', '每年财运详解'],
  },
};

export default function TestIntroPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const test = TEST_PRODUCTS[slug];

  // 如果测试不存在或未激活，跳转到首页
  useEffect(() => {
    if (!test || !test.isActive) {
      router.push('/');
    }
  }, [test, router]);

  if (!test) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 处理卡密兑换
  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      setRedeemError('请输入卡密');
      return;
    }

    setIsRedeeming(true);
    setRedeemError('');

    try {
      const response = await fetch('/api/redeem/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode, testSlug: slug }),
      });

      const data = await response.json();

      if (data.success) {
        // 卡密验证成功，跳转到测试页面
        if (slug === 'enneagram') {
          router.push(`/test/${slug}/questions?code=${redeemCode}`);
        } else {
          router.push(`/test/${slug}/start?code=${redeemCode}`);
        }
      } else {
        setRedeemError(data.error || '卡密无效或已被使用');
      }
    } catch (error) {
      setRedeemError('网络错误，请重试');
    } finally {
      setIsRedeeming(false);
    }
  };

  // 开始测试（付费）
  const handleStartTest = (level: 'basic' | 'full') => {
    if (slug === 'enneagram') {
      router.push(`/test/${slug}/questions?level=${level}`);
    } else {
      // 人生曲线和财富曲线跳转到原来的页面
      const mode = slug === 'life-curve' ? 'life' : 'wealth';
      router.push(`/curve?mode=${mode}&level=${level}`);
    }
  };

  const formatPrice = (priceCents: number) => {
    const yuan = priceCents / 100;
    return yuan % 1 === 0 ? yuan.toString() : yuan.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header curveMode="life" showModeSelector={false} />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* 返回按钮 */}
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-8">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>

        {/* 测试介绍卡片 */}
        <div className="text-center mb-8">
          <span className="text-6xl">{test.icon}</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{test.name}</h1>
          {test.englishName && (
            <p className="text-gray-400 text-sm mt-1">{test.englishName}</p>
          )}
          <p className="text-gray-600 mt-4 max-w-lg mx-auto">
            {test.description}
          </p>
        </div>

        {/* 特性列表 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            {test.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  {index === 0 && <span className="text-blue-500">📝</span>}
                  {index === 1 && <span className="text-blue-500">⏱</span>}
                  {index === 2 && <span className="text-blue-500">📊</span>}
                  {index === 3 && <span className="text-blue-500">📄</span>}
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 价格选项 */}
        <div className="space-y-4 mb-6">
          {/* 基础版 */}
          <div
            className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 transition-all"
            onClick={() => handleStartTest('basic')}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">基础版</h3>
                <p className="text-sm text-gray-500">快速了解测试结果</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-500">{formatPrice(test.priceBasic)}</span>
                <span className="text-gray-500 text-sm">元</span>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {test.basicIncludes.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 完整版 */}
          <div
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-5 cursor-pointer hover:border-blue-400 transition-all relative"
            onClick={() => handleStartTest('full')}
          >
            <div className="absolute -top-3 left-4">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                推荐
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">完整版</h3>
                <p className="text-sm text-gray-500">深度分析 + 成长建议</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-500">{formatPrice(test.priceFull)}</span>
                <span className="text-gray-500 text-sm">元</span>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {test.fullIncludes.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 卡密入口 */}
        <div className="text-center">
          <button
            onClick={() => setShowRedeemModal(true)}
            className="text-gray-500 text-sm hover:text-blue-500 transition-colors"
          >
            💳 已有卡密？点击输入
          </button>
        </div>

        {/* 免责声明 */}
        <p className="text-center text-gray-400 text-xs mt-8">
          本测试仅供娱乐参考，不构成专业心理诊断或建议
        </p>
      </main>

      <Footer />

      {/* 卡密输入弹窗 */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">输入卡密</h3>
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="请输入卡密"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 mb-3 text-center text-lg tracking-widest"
              maxLength={16}
            />
            {redeemError && (
              <p className="text-red-500 text-sm mb-3">{redeemError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setRedeemCode('');
                  setRedeemError('');
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRedeem}
                disabled={isRedeeming}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isRedeeming ? '验证中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
