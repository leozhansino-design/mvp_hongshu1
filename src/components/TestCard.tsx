'use client';

import Link from 'next/link';

export interface TestProduct {
  slug: string;
  icon: string;
  name: string;
  subtitle: string;
  description: string;  // 详细介绍
  color: string;
  questionCount: number | null;
  duration: string;
  priceBasic: number;  // 价格（分）
  priceFull: number;   // 完整版价格（分）
  category: string;
  isActive: boolean;
}

interface TestCardProps {
  test: TestProduct;
}

export default function TestCard({ test }: TestCardProps) {
  return (
    <Link href={test.isActive ? `/test/${test.slug}` : '#'}>
      <div
        className={`
          relative rounded-2xl p-6 h-full
          transition-all duration-300
          ${test.isActive
            ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-white border border-gray-200'
            : 'opacity-60 cursor-not-allowed bg-gray-50 border border-gray-100'}
        `}
      >
        {/* 图标 */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4"
          style={{ backgroundColor: test.color }}
        >
          {test.icon}
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {test.name}
        </h3>

        {/* 副标题 */}
        <p className="text-sm font-medium text-gray-700 mb-3">
          {test.subtitle}
        </p>

        {/* 详细介绍 */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {test.description}
        </p>

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-100">
          <span>
            {test.questionCount ? `${test.questionCount}题 · ` : ''}
            {test.duration}
          </span>
          {!test.isActive && (
            <span className="text-gray-400">敬请期待</span>
          )}
        </div>
      </div>
    </Link>
  );
}
