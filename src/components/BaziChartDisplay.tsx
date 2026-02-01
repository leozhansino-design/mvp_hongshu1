'use client';

import { BaziChart } from '@/types';
import { PillarDetail } from '@/lib/bazi';

interface BaziChartDisplayProps {
  chart: BaziChart;
  showDetails?: boolean;
  pillarsDetail?: {
    year: PillarDetail;
    month: PillarDetail;
    day: PillarDetail;
    hour: PillarDetail;
  };
}

// 天干五行颜色对应
const STEM_COLORS: Record<string, string> = {
  '甲': 'text-green-400', '乙': 'text-green-400',
  '丙': 'text-red-400', '丁': 'text-red-400',
  '戊': 'text-yellow-500', '己': 'text-yellow-500',
  '庚': 'text-gray-300', '辛': 'text-gray-300',
  '壬': 'text-blue-400', '癸': 'text-blue-400',
};

// 五行颜色
const ELEMENT_COLORS: Record<string, string> = {
  '木': 'text-green-400',
  '火': 'text-red-400',
  '土': 'text-yellow-500',
  '金': 'text-gray-300',
  '水': 'text-blue-400',
};

// 十神颜色
const TEN_GOD_COLORS: Record<string, string> = {
  '比肩': 'text-cyan-400',
  '劫财': 'text-cyan-300',
  '食神': 'text-orange-400',
  '伤官': 'text-orange-300',
  '偏财': 'text-yellow-400',
  '正财': 'text-yellow-300',
  '七杀': 'text-red-400',
  '正官': 'text-red-300',
  '偏印': 'text-purple-400',
  '正印': 'text-purple-300',
  '日主': 'text-gold-400',
};

export default function BaziChartDisplay({ chart, showDetails = true, pillarsDetail }: BaziChartDisplayProps) {
  const pillars = [
    { name: '年柱', pillar: chart.yearPillar, detail: pillarsDetail?.year },
    { name: '月柱', pillar: chart.monthPillar, detail: pillarsDetail?.month },
    { name: '日柱', pillar: chart.dayPillar, detail: pillarsDetail?.day },
    { name: '时柱', pillar: chart.hourPillar, detail: pillarsDetail?.hour },
  ];

  // 如果有详细信息，显示增强版
  if (pillarsDetail) {
    return (
      <div className="space-y-3">
        {/* 表格式八字排盘 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            {/* 表头 */}
            <thead>
              <tr className="text-text-secondary text-xs">
                <th className="p-2 text-left w-16"></th>
                {pillars.map(({ name }) => (
                  <th key={name} className="p-2 text-center">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 干神 */}
              <tr className="border-t border-purple-500/20">
                <td className="p-2 text-text-secondary text-xs">干神</td>
                {pillars.map(({ name, detail }) => (
                  <td key={name} className="p-2 text-center">
                    <span className={`text-xs ${TEN_GOD_COLORS[detail?.ganShen || ''] || 'text-gray-400'}`}>
                      {detail?.ganShen || '-'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 天干 */}
              <tr className="border-t border-purple-500/20 bg-mystic-900/30">
                <td className="p-2 text-text-secondary text-xs">天干</td>
                {pillars.map(({ name, pillar, detail }) => (
                  <td key={name} className="p-2 text-center">
                    <span className={`font-serif text-2xl md:text-3xl ${STEM_COLORS[pillar.heavenlyStem] || 'text-gold-400'}`}>
                      {pillar.heavenlyStem}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 地支 */}
              <tr className="border-t border-purple-500/20 bg-mystic-900/30">
                <td className="p-2 text-text-secondary text-xs">地支</td>
                {pillars.map(({ name, pillar, detail }) => (
                  <td key={name} className="p-2 text-center">
                    <span className={`font-serif text-2xl md:text-3xl ${STEM_COLORS[detail?.cangGan[0]?.gan || ''] || ELEMENT_COLORS[detail?.zhiWuXing || ''] || 'text-gold-400'}`}>
                      {pillar.earthlyBranch}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 藏干 */}
              <tr className="border-t border-purple-500/20">
                <td className="p-2 text-text-secondary text-xs">藏干</td>
                {pillars.map(({ name, detail }) => (
                  <td key={name} className="p-2 text-center">
                    <div className="flex flex-col gap-0.5">
                      {detail?.cangGan.map((cg, i) => (
                        <div key={i} className="flex items-center justify-center gap-1">
                          <span className={`text-xs ${STEM_COLORS[cg.gan] || 'text-gray-400'}`}>{cg.gan}</span>
                          <span className="text-xs text-gray-500">·</span>
                          <span className={`text-xs ${ELEMENT_COLORS[cg.wuXing] || 'text-gray-400'}`}>{cg.wuXing}</span>
                        </div>
                      )) || '-'}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 支神 */}
              <tr className="border-t border-purple-500/20">
                <td className="p-2 text-text-secondary text-xs">支神</td>
                {pillars.map(({ name, detail }) => (
                  <td key={name} className="p-2 text-center">
                    <div className="flex flex-col gap-0.5">
                      {detail?.cangGan.map((cg, i) => (
                        <span key={i} className={`text-xs ${TEN_GOD_COLORS[cg.shiShen] || 'text-gray-400'}`}>
                          {cg.shiShen}
                        </span>
                      )) || '-'}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 纳音 */}
              <tr className="border-t border-purple-500/20">
                <td className="p-2 text-text-secondary text-xs">纳音</td>
                {pillars.map(({ name, detail }) => (
                  <td key={name} className="p-2 text-center">
                    <span className="text-xs text-purple-300">{detail?.naYin || '-'}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 附加信息 */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center p-2 rounded-lg bg-mystic-900/50 border border-purple-500/20">
              <div className="text-xs text-text-secondary mb-1">生肖</div>
              <div className="text-gold-400 font-serif text-lg">{chart.zodiac}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-mystic-900/50 border border-purple-500/20">
              <div className="text-xs text-text-secondary mb-1">农历</div>
              <div className="text-purple-300 text-sm">{chart.lunarDate}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-mystic-900/50 border border-purple-500/20">
              <div className="text-xs text-text-secondary mb-1">真太阳时</div>
              <div className="text-purple-300 text-sm">{chart.solarTime}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 原始简化版显示
  return (
    <div className="space-y-4">
      {/* 四柱八字 */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {pillars.map(({ name, pillar }) => {
          const stemColor = STEM_COLORS[pillar.heavenlyStem] || 'text-gold-400';
          const branchColor = STEM_COLORS[pillar.earthlyBranch] || 'text-gold-400';

          return (
            <div key={name} className="text-center">
              <div className="text-xs text-text-secondary mb-2">{name}</div>
              <div className="relative p-3 md:p-4 rounded-lg bg-gradient-to-b from-mystic-800/80 to-mystic-900/80 border border-purple-500/30 hover:border-gold-400/50 transition-colors">
                {/* 天干 */}
                <div className={`font-serif text-2xl md:text-3xl mb-2 ${stemColor}`}>
                  {pillar.heavenlyStem}
                </div>
                {/* 地支 */}
                <div className={`font-serif text-2xl md:text-3xl ${branchColor}`}>
                  {pillar.earthlyBranch}
                </div>
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
