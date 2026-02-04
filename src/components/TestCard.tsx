'use client';

import Link from 'next/link';

export interface TestProduct {
  slug: string;
  icon: string;
  name: string;
  subtitle: string;
  color: string;
  questionCount: number | null;
  duration: string;
  priceBasic: number;  // 价格（分）
  priceFull: number;   // 完整版价格（分）
  category: string;
  isActive: boolean;
  isNew: boolean;
}

interface TestCardProps {
  test: TestProduct;
}

export default function TestCard({ test }: TestCardProps) {
  // 格式化价格显示
  const formatPrice = (priceCents: number) => {
    const yuan = priceCents / 100;
    return yuan % 1 === 0 ? yuan.toString() : yuan.toFixed(1);
  };

  return (
    <Link href={test.isActive ? `/test/${test.slug}` : '#'}>
      <div
        className={`
          relative rounded-2xl border border-gray-100 p-6
          transition-all duration-300
          ${test.isActive
            ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
            : 'opacity-50 cursor-not-allowed'}
        `}
        style={{ backgroundColor: test.color }}
      >
        {/* 新品标签 */}
        {test.isNew && (
          <span className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            NEW
          </span>
        )}

        {/* 图标 */}
        <span className="text-4xl">{test.icon}</span>

        {/* 标题 */}
        <h3 className="text-lg font-semibold mt-4 text-gray-900">
          {test.name}
        </h3>

        {/* 副标题 */}
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {test.subtitle}
        </p>

        {/* 底部信息 */}
        <div className="flex items-center justify-between mt-6 text-xs text-gray-400">
          <span>
            {test.questionCount ? `${test.questionCount}题 · ` : ''}
            {test.duration}
          </span>
          <span className={test.isActive ? 'text-blue-500 font-medium' : ''}>
            {test.isActive ? `${formatPrice(test.priceBasic)}元起` : '敬请期待'}
          </span>
        </div>
      </div>
    </Link>
  );
}
