'use client';

import { WealthAnalysis as WealthAnalysisType } from '@/types';

interface WealthAnalysisProps {
  analysis: WealthAnalysisType;
  isPaid?: boolean;
}

export default function WealthAnalysis({ analysis, isPaid = false }: WealthAnalysisProps) {
  const sections = [
    {
      title: '总体财运',
      content: analysis.summary,
      icon: '💰',
    },
    {
      title: '早年财运（18-30岁）',
      content: analysis.earlyYears,
      icon: '🌱',
    },
    {
      title: '中年财运（30-50岁）',
      content: analysis.middleYears,
      icon: '🌳',
    },
    {
      title: '晚年财运（50岁后）',
      content: analysis.lateYears,
      icon: '🍂',
    },
    {
      title: '理财建议',
      content: analysis.advice,
      icon: '💡',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg text-gold-400 flex items-center gap-2">
        <span>📊</span>
        <span>财运详解</span>
      </h3>

      <div className="space-y-3">
        {sections.map((section, index) => {
          // 免费版只显示前两个section，其他模糊处理
          const isLocked = !isPaid && index > 1;

          return (
            <div
              key={index}
              className={`p-4 rounded-xl bg-black/40 border border-gray-800 ${
                isLocked ? 'relative overflow-hidden' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{section.icon}</span>
                <h4 className="font-medium text-text-primary">{section.title}</h4>
              </div>

              <p
                className={`text-sm text-text-secondary leading-relaxed ${
                  isLocked ? 'blur-sm select-none' : ''
                }`}
              >
                {section.content}
              </p>

              {isLocked && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 flex items-end justify-center pb-4">
                  <span className="text-xs text-gold-400 bg-black/60 px-3 py-1 rounded-full border border-gold-400/30">
                    🔒 解锁完整版查看
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 免责声明 */}
      <div className="mt-6 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
        <p className="text-xs text-text-secondary/70 leading-relaxed">
          <span className="text-gold-400/70">免责声明：</span>
          本曲线基于传统八字命理理论推演，仅供娱乐参考。
          财富受个人努力、机遇、选择、经济环境等多重因素影响。
          不构成任何投资或人生决策建议。
        </p>
      </div>
    </div>
  );
}
