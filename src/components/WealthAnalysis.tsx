'use client';

import { WealthAnalysis as WealthAnalysisType } from '@/types';

interface WealthAnalysisProps {
  analysis: WealthAnalysisType;
  isPaid?: boolean;
}

export default function WealthAnalysis({ analysis, isPaid = false }: WealthAnalysisProps) {
  // 截取内容的函数 - 免费版显示部分内容
  const truncateContent = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  const sections = [
    {
      title: '总体财运',
      content: analysis.summary,
      freePreview: true, // 免费版完整显示
    },
    {
      title: '早年财运（18-30岁）',
      content: analysis.earlyYears,
      freePreview: true, // 免费版完整显示
    },
    {
      title: '中年财运（30-50岁）',
      content: analysis.middleYears,
      freePreview: false, // 免费版截断显示
    },
    {
      title: '晚年财运（50岁后）',
      content: analysis.lateYears,
      freePreview: false, // 免费版截断显示
    },
    {
      title: '理财建议',
      content: analysis.advice,
      freePreview: false, // 免费版截断显示
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg text-gold-400">财运详解</h3>

      <div className="space-y-3">
        {sections.map((section, index) => {
          // 决定显示的内容
          const displayContent = isPaid || section.freePreview
            ? section.content
            : truncateContent(section.content, 60);

          const isPartial = !isPaid && !section.freePreview;

          return (
            <div
              key={index}
              className="p-4 rounded-lg bg-black/30 border border-gray-800"
            >
              <h4 className="font-medium text-text-primary mb-2">{section.title}</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {displayContent}
                {isPartial && (
                  <span className="text-gold-400/60 ml-1">（完整版可查看详细分析）</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* 增运指南 - 只在付费版显示完整 */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-gold-400/5 to-amber-500/5 border border-gold-400/20">
        <h4 className="font-medium text-gold-400 mb-3">增运秘诀</h4>
        {isPaid ? (
          <div className="space-y-3 text-sm text-text-secondary">
            <div>
              <span className="text-gold-400/80">【方位催财】</span>
              <p className="mt-1">根据你的命盘，建议办公桌朝向或床头方位设在财位方向，可借助方位之力增强财运。</p>
            </div>
            <div>
              <span className="text-gold-400/80">【行业选择】</span>
              <p className="mt-1">从事与自身五行相生的行业，事半功倍。适合的行业能让财运事半功倍。</p>
            </div>
            <div>
              <span className="text-gold-400/80">【投资时机】</span>
              <p className="mt-1">每年的财运有高低起伏，建议在财运旺盛的年份加大投资力度，财运低迷时保守为主。</p>
            </div>
            <div>
              <span className="text-gold-400/80">【人脉助运】</span>
              <p className="mt-1">结交贵人是提升财运的关键。命中财星与官星相配，贵人相助事业更顺。</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            根据你的八字命盘，有针对性的增运方法包括：方位催财、行业选择、投资时机把握...
            <span className="text-gold-400/60">（付费版查看完整增运秘诀）</span>
          </p>
        )}
      </div>

      {/* 免责声明 */}
      <div className="mt-4 p-3 rounded-lg bg-gray-900/30 border border-gray-800/50">
        <p className="text-xs text-text-secondary/60 leading-relaxed">
          <span className="text-gold-400/50">免责声明：</span>
          本曲线基于传统八字命理理论推演，仅供娱乐参考。
          财富受个人努力、机遇、选择、经济环境等多重因素影响，不构成任何投资建议。
        </p>
      </div>
    </div>
  );
}
