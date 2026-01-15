'use client';

import { useState, useEffect, useMemo } from 'react';
import { ANALYSIS_MODULES } from '@/types';

interface AnalysisLoaderProps {
  onComplete?: () => void;
}

export default function AnalysisLoader({ onComplete }: AnalysisLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [queuePosition, setQueuePosition] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [isReverse, setIsReverse] = useState(false);

  // 模拟排队进度
  useEffect(() => {
    if (queuePosition > 0) {
      const queueTimer = setInterval(() => {
        setQueuePosition((prev) => {
          if (prev <= 1) {
            clearInterval(queueTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1500);

      return () => clearInterval(queueTimer);
    }
  }, [queuePosition]);

  // 模拟分析进度
  useEffect(() => {
    if (queuePosition > 0) return;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 8 + 2;
        const newProgress = Math.min(prev + increment, 99);

        const moduleIndex = Math.floor((newProgress / 99) * ANALYSIS_MODULES.length);
        setCurrentModuleIndex(Math.min(moduleIndex, ANALYSIS_MODULES.length - 1));

        if (newProgress >= 99) {
          clearInterval(progressTimer);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }

        return newProgress;
      });
    }, 800);

    return () => clearInterval(progressTimer);
  }, [queuePosition, onComplete]);

  // 太极图正反转动
  useEffect(() => {
    const interval = setInterval(() => {
      setIsReverse((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 估计剩余时间
  const estimatedTime = useMemo(() => {
    if (queuePosition > 0) {
      return `排队中，约 ${queuePosition * 3} 秒`;
    }
    const remaining = Math.ceil((99 - progress) / 10);
    return remaining > 0 ? `约 ${remaining} 秒` : '即将完成';
  }, [queuePosition, progress]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4">
      {/* 太极图 */}
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg
          viewBox="0 0 200 200"
          className={`w-full h-full transition-transform ${
            isReverse ? 'animate-taiji-reverse' : 'animate-taiji-forward'
          }`}
        >
          {/* 外圈 */}
          <circle
            cx="100"
            cy="100"
            r="98"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* 太极图主体 - 黑半边 */}
          <path
            d="M100 2 A98 98 0 0 1 100 198 A49 49 0 0 1 100 100 A49 49 0 0 0 100 2"
            fill="#000000"
          />

          {/* 太极图主体 - 白半边 */}
          <path
            d="M100 198 A98 98 0 0 1 100 2 A49 49 0 0 0 100 100 A49 49 0 0 1 100 198"
            fill="#ffffff"
          />

          {/* 白鱼眼（上方黑色区域的白点） */}
          <circle cx="100" cy="51" r="16" fill="#ffffff" />

          {/* 黑鱼眼（下方白色区域的黑点） */}
          <circle cx="100" cy="149" r="16" fill="#000000" />
        </svg>
      </div>

      {/* 状态信息 */}
      <div className="text-center space-y-3 w-full max-w-sm">
        {queuePosition > 0 ? (
          <>
            <p className="font-serif text-lg text-white">
              天机排演中...
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>当前排位：第 <span className="text-white font-mono">{queuePosition}</span> 位</span>
            </div>
          </>
        ) : (
          <>
            <p className="font-serif text-lg text-white">
              {ANALYSIS_MODULES[currentModuleIndex]?.icon} {ANALYSIS_MODULES[currentModuleIndex]?.name}
            </p>
            <div className="text-gray-400 text-sm">
              AI 深度解析中...
            </div>
          </>
        )}

        {/* 进度条 */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${queuePosition > 0 ? 0 : progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>{queuePosition > 0 ? '等待中' : `${Math.round(progress)}%`}</span>
          <span>{estimatedTime}</span>
        </div>

        {/* 模块进度列表 */}
        {queuePosition === 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {ANALYSIS_MODULES.map((module, index) => {
              const isCompleted = index < currentModuleIndex;
              const isCurrent = index === currentModuleIndex;

              return (
                <div
                  key={module.id}
                  className={`flex items-center gap-1 p-2 rounded text-xs transition-all border ${
                    isCompleted
                      ? 'bg-white/10 text-white border-white/30'
                      : isCurrent
                      ? 'bg-white/20 text-white border-white/50 animate-pulse'
                      : 'bg-black/30 text-gray-500 border-gray-700'
                  }`}
                >
                  <span>{module.icon}</span>
                  <span className="truncate">{module.name}</span>
                  {isCompleted && <span className="ml-auto">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes taiji-forward {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes taiji-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-taiji-forward {
          animation: taiji-forward 3s linear infinite;
        }

        .animate-taiji-reverse {
          animation: taiji-reverse 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
