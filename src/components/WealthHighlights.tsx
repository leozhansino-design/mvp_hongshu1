'use client';

import { WealthHighlights as WealthHighlightsType, WealthType, WEALTH_TYPE_DESCRIPTIONS } from '@/types';

interface WealthHighlightsProps {
  highlights: WealthHighlightsType;
  wealthType: WealthType;
}

export default function WealthHighlights({ highlights, wealthType }: WealthHighlightsProps) {
  // 格式化金额
  const formatWealth = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}亿`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}千万`;
    }
    return `${value.toFixed(0)}万`;
  };

  const highlightItems = [
    {
      icon: '🏆',
      label: '财富巅峰',
      value: `${highlights.peakAge}岁，约${formatWealth(highlights.peakWealth)}`,
      color: 'text-gold-400',
    },
    {
      icon: '📈',
      label: '最大年增长',
      value: `${highlights.maxGrowthAge}岁（+${formatWealth(highlights.maxGrowthAmount)}）`,
      color: 'text-green-400',
    },
    {
      icon: '📉',
      label: '最大年回撤',
      value: `${highlights.maxLossAge}岁（-${formatWealth(highlights.maxLossAmount)}）`,
      color: 'text-red-400',
    },
    {
      icon: '💼',
      label: '财富类型',
      value: wealthType,
      color: 'text-purple-400',
      description: WEALTH_TYPE_DESCRIPTIONS[wealthType],
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gold-400/5 to-transparent rounded-2xl p-6 border border-gold-400/20">
      <h3 className="font-serif text-lg text-gold-400 mb-4 flex items-center gap-2">
        <span>✨</span>
        <span>高光时刻</span>
      </h3>

      <div className="space-y-4">
        {highlightItems.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-gray-800 hover:border-gold-400/30 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">{item.label}</span>
                <span className={`font-medium ${item.color}`}>{item.value}</span>
              </div>
              {item.description && (
                <p className="text-xs text-text-secondary/70 mt-1">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
