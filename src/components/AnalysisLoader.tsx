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
        <div className="taiji-container">
          <div className="bai"></div>
          <div className="hei"></div>
        </div>
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
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .taiji-container {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #ffffff;
          position: relative;
          animation: rotate 4s linear infinite;
        }

        .taiji-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          background: #000;
          border-radius: 0 100% 100% 0 / 0 50% 50% 0;
        }

        .bai {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 50%;
          background: #fff;
          border-radius: 100% 100% 0 0 / 50% 50% 0 0;
        }

        .bai::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 25%;
          transform: translateY(-50%);
          width: 25%;
          height: 50%;
          background: #000;
          border-radius: 50%;
        }

        .hei {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50%;
          background: #000;
          border-radius: 0 0 100% 100% / 0 0 50% 50%;
        }

        .hei::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 25%;
          transform: translateY(-50%);
          width: 25%;
          height: 50%;
          background: #fff;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
