'use client';

import { BaziChart } from '@/types';

interface BaziChartDisplayProps {
  chart: BaziChart;
  showDetails?: boolean;
}

// 天干五行对应
const STEM_ELEMENTS: Record<string, { element: string; color: string }> = {
  '甲': { element: '木', color: 'text-green-400' },
  '乙': { element: '木', color: 'text-green-400' },
  '丙': { element: '火', color: 'text-red-400' },
  '丁': { element: '火', color: 'text-red-400' },
  '戊': { element: '土', color: 'text-yellow-500' },
  '己': { element: '土', color: 'text-yellow-500' },
  '庚': { element: '金', color: 'text-gray-300' },
  '辛': { element: '金', color: 'text-gray-300' },
  '壬': { element: '水', color: 'text-blue-400' },
  '癸': { element: '水', color: 'text-blue-400' },
};

// 地支五行对应
const BRANCH_ELEMENTS: Record<string, { element: string; color: string }> = {
  '子': { element: '水', color: 'text-blue-400' },
  '丑': { element: '土', color: 'text-yellow-500' },
  '寅': { element: '木', color: 'text-green-400' },
  '卯': { element: '木', color: 'text-green-400' },
  '辰': { element: '土', color: 'text-yellow-500' },
  '巳': { element: '火', color: 'text-red-400' },
  '午': { element: '火', color: 'text-red-400' },
  '未': { element: '土', color: 'text-yellow-500' },
  '申': { element: '金', color: 'text-gray-300' },
  '酉': { element: '金', color: 'text-gray-300' },
  '戌': { element: '土', color: 'text-yellow-500' },
  '亥': { element: '水', color: 'text-blue-400' },
};

export default function BaziChartDisplay({ chart, showDetails = true }: BaziChartDisplayProps) {
  const pillars = [
    { name: '年柱', pillar: chart.yearPillar },
    { name: '月柱', pillar: chart.monthPillar },
    { name: '日柱', pillar: chart.dayPillar },
    { name: '时柱', pillar: chart.hourPillar },
  ];

  return (
    <div className="space-y-4">
      {/* 四柱八字 */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {pillars.map(({ name, pillar }) => {
          const stemInfo = STEM_ELEMENTS[pillar.heavenlyStem] || { element: '', color: 'text-gold-400' };
          const branchInfo = BRANCH_ELEMENTS[pillar.earthlyBranch] || { element: '', color: 'text-gold-400' };

          return (
            <div key={name} className="text-center">
              <div className="text-xs text-text-secondary mb-2">{name}</div>
              <div className="relative p-3 md:p-4 rounded-lg bg-gradient-to-b from-mystic-800/80 to-mystic-900/80 border border-purple-500/30 hover:border-gold-400/50 transition-colors">
                {/* 天干 */}
                <div className={`font-serif text-2xl md:text-3xl mb-2 ${stemInfo.color}`}>
                  {pillar.heavenlyStem}
                </div>
                {/* 地支 */}
                <div className={`font-serif text-2xl md:text-3xl ${branchInfo.color}`}>
                  {pillar.earthlyBranch}
                </div>
                {/* 五行标签 */}
                {showDetails && (
                  <div className="mt-2 flex flex-col gap-1">
                    <span className={`text-xs ${stemInfo.color}`}>{stemInfo.element}</span>
                    <span className={`text-xs ${branchInfo.color}`}>{branchInfo.element}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 附加信息 */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 rounded-lg bg-mystic-900/50 border border-purple-500/20">
            <div className="text-xs text-text-secondary mb-1">生肖</div>
            <div className="text-gold-400 font-serif text-lg">{chart.zodiac}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-mystic-900/50 border border-purple-500/20">
            <div className="text-xs text-text-secondary mb-1">农历</div>
            <div className="text-purple-300 text-sm">{chart.lunarDate}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-mystic-900/50 border border-purple-500/20">
            <div className="text-xs text-text-secondary mb-1">真太阳时</div>
            <div className="text-purple-300 text-sm">{chart.solarTime}</div>
          </div>
        </div>
      )}
    </div>
  );
}
