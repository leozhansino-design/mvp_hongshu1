'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components';
import TestCard, { TestProduct } from '@/components/TestCard';

// 测试产品分类
const TEST_CATEGORIES = ['全部', '性格', '职业', '情感', '趣味'];

// 分类映射
const CATEGORY_MAP: Record<string, string> = {
  '全部': 'all',
  '性格': 'personality',
  '职业': 'career',
  '情感': 'love',
  '趣味': 'fun',
};

// 测试产品数据
const TEST_PRODUCTS: TestProduct[] = [
  {
    slug: 'life-curve',
    icon: '🔮',
    name: '人生曲线',
    subtitle: '探索您的人生发展趋势',
    color: '#FFF5F5',
    questionCount: null,
    duration: '3分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'fun',
    isActive: true,
    isNew: false,
  },
  {
    slug: 'wealth-curve',
    icon: '💰',
    name: '财富曲线',
    subtitle: '预测您的财富发展走势',
    color: '#FFFFF0',
    questionCount: null,
    duration: '3分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'fun',
    isActive: true,
    isNew: false,
  },
  {
    slug: 'enneagram',
    icon: '🧠',
    name: '九型人格',
    subtitle: '探索你的核心人格类型',
    color: '#F5F0FF',
    questionCount: 144,
    duration: '15-20分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'personality',
    isActive: true,
    isNew: true,
  },
  {
    slug: 'mbti',
    icon: '🎯',
    name: 'MBTI',
    subtitle: '16型人格·职业性格匹配',
    color: '#F0F5FF',
    questionCount: 93,
    duration: '10-15分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'career',
    isActive: false,
    isNew: false,
  },
  {
    slug: 'disc',
    icon: '📊',
    name: 'DISC',
    subtitle: '职场沟通与领导力风格',
    color: '#F0FFF5',
    questionCount: 40,
    duration: '8-10分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'career',
    isActive: false,
    isNew: false,
  },
  {
    slug: 'love-language',
    icon: '❤️',
    name: '爱情语言',
    subtitle: '发现你表达爱的方式',
    color: '#FFF0F5',
    questionCount: 30,
    duration: '5-8分钟',
    priceBasic: 100,
    priceFull: 1990,
    category: 'love',
    isActive: false,
    isNew: false,
  },
];

const FALLBACK_GENERATED_COUNT = 41512;

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [totalGenerated, setTotalGenerated] = useState(FALLBACK_GENERATED_COUNT);

  useEffect(() => {
    const fetchTotalGenerated = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success && data.totalGenerated) {
          setTotalGenerated(data.totalGenerated);
        }
      } catch (error) {
        console.error('获取总生成次数失败:', error);
      }
    };
    fetchTotalGenerated();
  }, []);

  // 过滤测试产品
  const filteredProducts = TEST_PRODUCTS.filter(product => {
    if (activeCategory === '全部') return true;
    return product.category === CATEGORY_MAP[activeCategory];
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header curveMode="life" showModeSelector={false} />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* 标题区域 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            探索你自己
          </h1>
          <p className="text-gray-500 text-lg">
            专业心理测评 · 发现真实的你
          </p>
        </div>

        {/* 分类Tab */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {TEST_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 测试卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <TestCard key={product.slug} test={product} />
          ))}
        </div>

        {/* 底部信任背书 */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-500">
              已为 <span className="text-blue-500 font-semibold">{totalGenerated.toLocaleString()}</span> 人生成分析报告
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
