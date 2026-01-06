'use client';

import { useState } from 'react';
import { DaYunInfo, PaidChartPoint } from '@/types';

interface DaYunTableProps {
  daYunList: DaYunInfo[];
  chartPoints: PaidChartPoint[];
  currentAge: number;
  birthYear: number;
}

export default function DaYunTable({ daYunList, chartPoints, currentAge, birthYear }: DaYunTableProps) {
  const [expandedDaYun, setExpandedDaYun] = useState<number | null>(null);

  // 获取某个大运期间的流年数据
  const getYearsInDaYun = (startAge: number, endAge: number) => {
    return chartPoints.filter(p => p.age >= startAge && p.age <= endAge);
  };

  // 计算大运平均分
  const getDaYunAvgScore = (startAge: number, endAge: number) => {
    const years = getYearsInDaYun(startAge, endAge);
    if (years.length === 0) return 0;
    return Math.round(years.reduce((sum, y) => sum + y.score, 0) / years.length);
  };

  const toggleExpand = (index: number) => {
    setExpandedDaYun(expandedDaYun === index ? null : index);
  };

  return (
    <div className="mystic-card">
      <h2 className="font-serif text-xl text-gold-400 mb-4">大运流年详解</h2>
      <p className="text-text-secondary text-sm mb-4">点击大运可展开查看该运期间每年运势详情</p>

      <div className="space-y-2">
        {daYunList.map((daYun, index) => {
          const avgScore = getDaYunAvgScore(daYun.startAge, daYun.endAge);
          const isExpanded = expandedDaYun === index;
          const isCurrent = currentAge >= daYun.startAge && currentAge <= daYun.endAge;
          const yearsInDaYun = getYearsInDaYun(daYun.startAge, daYun.endAge);

          return (
            <div key={index} className={`rounded-lg overflow-hidden ${isCurrent ? 'ring-2 ring-gold-400' : ''}`}>
              {/* 大运标题行 */}
              <button
                onClick={() => toggleExpand(index)}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  isCurrent ? 'bg-gold-400/10' : 'bg-mystic-900/50 hover:bg-mystic-900/70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-bold font-serif ${isCurrent ? 'text-gold-400' : 'text-purple-300'}`}>
                    {daYun.ganZhi}
                  </span>
                  <span className="text-text-secondary text-sm">
                    {daYun.startAge}-{daYun.endAge}岁
                  </span>
                  <span className="text-text-secondary text-sm">
                    ({birthYear + daYun.startAge - 1}-{birthYear + daYun.endAge - 1}年)
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gold-400 text-mystic-900 font-bold">
                      当前
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-lg ${avgScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                    {avgScore}
                  </span>
                  <span className={`text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* 大运描述 */}
              {daYun.description && (
                <div className="px-4 py-2 bg-mystic-900/30 border-t border-purple-500/10">
                  <p className="text-text-secondary text-sm">{daYun.description}</p>
                </div>
              )}

              {/* 展开的流年列表 */}
              {isExpanded && yearsInDaYun.length > 0 && (
                <div className="bg-mystic-900/20 border-t border-purple-500/20">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-1 p-2">
                    {yearsInDaYun.map((year) => {
                      const isCurrentYear = year.age === currentAge;
                      return (
                        <div
                          key={year.age}
                          className={`p-3 rounded-lg transition-colors ${
                            isCurrentYear
                              ? 'bg-gold-400/20 ring-1 ring-gold-400'
                              : 'bg-mystic-800/50 hover:bg-mystic-800/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm ${isCurrentYear ? 'text-gold-400 font-bold' : 'text-text-primary'}`}>
                              {year.age}岁
                            </span>
                            <span className={`font-mono text-sm ${year.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                              {year.score}
                            </span>
                          </div>
                          <div className="text-xs text-text-secondary">
                            {year.year}年 {year.ganZhi}
                          </div>
                          {year.reason && (
                            <div className="text-xs text-text-secondary mt-1 line-clamp-2">
                              {year.reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
