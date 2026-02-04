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
    priceBasic: 198,
    priceFull: 1990,
    category: 'personality',
    isActive: true,
    features: ['144 道专业题目', '约 15-20 分钟', '9 种人格类型', '专业分析报告'],
    basicIncludes: ['核心人格类型', '侧翼类型分析', '雷达图得分展示', '200字简要分析'],
    fullIncludes: ['全部基础版内容', '2000字深度分析', '核心恐惧与渴望解读', '成长方向建议', '人际关系指南', '职业发展建议', '与其他类型相处之道'],
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
    priceBasic: 198,
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
    priceBasic: 198,
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

  const [selectedLevel, setSelectedLevel] = useState<'basic' | 'full' | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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
          const mode = slug === 'life-curve' ? 'life' : 'wealth';
          router.push(`/curve?mode=${mode}&code=${redeemCode}`);
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

  // 直接购买
  const handleDirectPurchase = async () => {
    if (!selectedLevel) return;

    setIsPaying(true);

    // TODO: 实际接入微信/支付宝支付
    // 目前模拟支付成功后跳转
    try {
      const response = await fetch('/api/test/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSlug: slug,
          level: selectedLevel,
          paymentMethod: 'direct'
        }),
      });

      const data = await response.json();

      if (data.success || data.orderId) {
        // 支付成功，跳转到测试页面
        if (slug === 'enneagram') {
          router.push(`/test/${slug}/questions?level=${selectedLevel}&orderId=${data.orderId}`);
        } else {
          const mode = slug === 'life-curve' ? 'life' : 'wealth';
          router.push(`/curve?mode=${mode}&level=${selectedLevel}&orderId=${data.orderId}`);
        }
      } else {
        alert(data.error || '支付失败，请重试');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setIsPaying(false);
    }
  };

  const formatPrice = (priceCents: number) => {
    const yuan = priceCents / 100;
    return yuan.toFixed(2);
  };

  const getSelectedPrice = () => {
    if (!selectedLevel) return 0;
    return selectedLevel === 'basic' ? test.priceBasic : test.priceFull;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header curveMode="life" showModeSelector={false} />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* 返回首页按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        {/* 测试介绍 */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4"
            style={{ backgroundColor: test.color }}
          >
            {test.icon}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
          {test.englishName && (
            <p className="text-gray-400 text-sm mt-1">{test.englishName}</p>
          )}
          <p className="text-gray-600 mt-4 max-w-lg mx-auto leading-relaxed">
            {test.description}
          </p>
        </div>

        {/* 特性列表 */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            {test.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {index === 0 && <span>📝</span>}
                  {index === 1 && <span>⏱️</span>}
                  {index === 2 && <span>📊</span>}
                  {index === 3 && <span>📄</span>}
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 版本选择 */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">选择版本</h2>
        <div className="space-y-4 mb-8">
          {/* 基础版 */}
          <div
            className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
              selectedLevel === 'basic'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedLevel('basic')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedLevel === 'basic' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {selectedLevel === 'basic' && (
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">基础版</h3>
                  <p className="text-sm text-gray-500">快速了解测试结果</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">¥{formatPrice(test.priceBasic)}</span>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-8">
              {test.basicIncludes.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 完整版 */}
          <div
            className={`rounded-2xl border-2 p-5 cursor-pointer transition-all relative ${
              selectedLevel === 'full'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedLevel('full')}
          >
            <div className="absolute -top-3 left-4">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                推荐
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedLevel === 'full' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {selectedLevel === 'full' && (
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">完整版</h3>
                  <p className="text-sm text-gray-500">深度分析 + 成长建议</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">¥{formatPrice(test.priceFull)}</span>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-8">
              {test.fullIncludes.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 支付区域 - 选择版本后显示 */}
        {selectedLevel && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              已选择：{selectedLevel === 'basic' ? '基础版' : '完整版'} - ¥{formatPrice(getSelectedPrice())}
            </h3>

            {/* 卡密输入 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">输入卡密（如有）</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => {
                    setRedeemCode(e.target.value.toUpperCase());
                    setRedeemError('');
                  }}
                  placeholder="输入卡密兑换"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-center tracking-widest bg-white"
                  maxLength={16}
                />
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming || !redeemCode.trim()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedeeming ? '验证中...' : '兑换'}
                </button>
              </div>
              {redeemError && (
                <p className="text-red-500 text-sm mt-2">{redeemError}</p>
              )}
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400">或</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* 直接购买按钮 */}
            <button
              onClick={handleDirectPurchase}
              disabled={isPaying}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isPaying ? '处理中...' : `立即购买 ¥${formatPrice(getSelectedPrice())}`}
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">
              支持微信支付、支付宝
            </p>
          </div>
        )}

        {/* 未选择版本时的提示 */}
        {!selectedLevel && (
          <div className="text-center py-8">
            <p className="text-gray-400">请选择一个版本开始测试</p>
          </div>
        )}

        {/* 免责声明 */}
        <p className="text-center text-gray-400 text-xs mt-8">
          本测试仅供娱乐参考，不构成专业心理诊断或建议
        </p>
      </main>

      <Footer />
    </div>
  );
}
