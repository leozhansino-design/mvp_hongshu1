'use client';

import { useState } from 'react';
import { calculateLiuNian, LiuNianItem } from '@/lib/bazi';

interface DaYunItem {
  index: number;
  ganZhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
}

interface DetailedDaYunTableProps {
  daYunList: DaYunItem[];
  currentAge: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  gender: 'male' | 'female';
  isLunar: boolean;
}

export default function DetailedDaYunTable({
  daYunList,
  currentAge,
  birthYear,
  birthMonth,
  birthDay,
  birthHour,
  birthMinute,
  gender,
  isLunar,
}: DetailedDaYunTableProps) {
  const [expandedDaYun, setExpandedDaYun] = useState<number | null>(null);
  const [liuNianCache, setLiuNianCache] = useState<Record<number, LiuNianItem[]>>({});

  const toggleDaYun = (index: number) => {
    if (expandedDaYun === index) {
      setExpandedDaYun(null);
    } else {
      setExpandedDaYun(index);

      // 如果还没有缓存该大运的流年，计算并缓存
      if (!liuNianCache[index]) {
        const liuNian = calculateLiuNian(
          birthYear,
          birthMonth,
          birthDay,
          birthHour,
          birthMinute,
          gender,
          index,
          isLunar
        );
        setLiuNianCache(prev => ({
          ...prev,
          [index]: liuNian
        }));
      }
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-white font-serif mb-3">大运流年 (0-100岁)</h3>

      {daYunList.map((daYun) => {
        const isCurrent = currentAge >= daYun.startAge && currentAge <= daYun.endAge;
        const isExpanded = expandedDaYun === daYun.index;
        const liuNianData = liuNianCache[daYun.index] || [];

        return (
          <div key={daYun.index} className="border border-gray-700 rounded-lg overflow-hidden">
            {/* 大运标题行 */}
            <button
              onClick={() => toggleDaYun(daYun.index)}
              className={`w-full p-3 text-left transition-all flex items-center justify-between ${
                isCurrent
                  ? 'bg-gold-400/10 border-l-4 border-gold-400'
                  : 'bg-black/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`font-mono text-sm ${isCurrent ? 'text-gold-400 font-bold' : 'text-white'}`}>
                  {daYun.startAge}-{daYun.endAge}岁
                </div>
                <div className={`font-serif text-lg ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                  {daYun.ganZhi}
                </div>
                <div className="text-xs text-gray-500">
                  ({daYun.startYear}-{daYun.endYear}年)
                </div>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs bg-gold-400/20 text-gold-400 rounded">
                    当前
                  </span>
                )}
              </div>

              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 流年展开内容 */}
            {isExpanded && (
              <div className="p-3 bg-black/50 border-t border-gray-700">
                <div className="text-xs text-gray-400 mb-2">流年详情</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {liuNianData.map((liuNian, idx) => {
                    const isCurrentYear = liuNian.age === currentAge;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded text-center border ${
                          isCurrentYear
                            ? 'bg-gold-400/10 border-gold-400'
                            : 'bg-black/30 border-gray-700'
                        }`}
                      >
                        <div className={`text-xs mb-1 ${isCurrentYear ? 'text-gold-400' : 'text-gray-500'}`}>
                          {liuNian.year}年
                        </div>
                        <div className={`font-serif text-sm ${isCurrentYear ? 'text-white font-bold' : 'text-gray-300'}`}>
                          {liuNian.ganZhi}
                        </div>
                        <div className={`text-xs mt-1 ${isCurrentYear ? 'text-gold-400' : 'text-gray-500'}`}>
                          {liuNian.age}岁
                        </div>
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
  );
}
