'use client';

import { useState, useEffect, useMemo } from 'react';
import { ANALYSIS_MODULES } from '@/types';

interface AnalysisLoaderProps {
  onComplete?: () => void;
  messages?: string[];
}

export default function AnalysisLoader({ onComplete, messages }: AnalysisLoaderProps) {
  // 使用自定义消息或默认模块
  const displayModules = messages
    ? messages.map((msg, i) => ({ id: `msg-${i}`, name: msg, icon: '○' }))
    : ANALYSIS_MODULES;
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

        const moduleIndex = Math.floor((newProgress / 99) * displayModules.length);
        setCurrentModuleIndex(Math.min(moduleIndex, displayModules.length - 1));

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
  }, [queuePosition, onComplete, displayModules.length]);

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
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        <div className="yinyang"></div>
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
              {displayModules[currentModuleIndex]?.icon} {displayModules[currentModuleIndex]?.name}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {displayModules.map((module, index) => {
              const isCompleted = index < currentModuleIndex;
              const isCurrent = index === currentModuleIndex;

              return (
                <div
                  key={module.id}
                  className={`flex items-center justify-center gap-1 px-2 py-2 rounded text-xs transition-all border ${
                    isCompleted
                      ? 'bg-white/10 text-white border-white/30'
                      : isCurrent
                      ? 'bg-white/20 text-white border-white/50 animate-pulse'
                      : 'bg-black/30 text-gray-500 border-gray-700'
                  }`}
                >
                  <span>{module.icon}</span>
                  <span className="whitespace-nowrap">{module.name}</span>
                  {isCompleted && <span className="ml-1 flex-shrink-0">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .yinyang {
          width: 200px;
          height: 200px;
          background: #fff;
          box-sizing: border-box;
          border-color: #000;
          border-style: solid;
          border-width: 3px 3px 100px 3px;
          border-radius: 100%;
          position: relative;
          animation: yinyangRotate 4s infinite linear;
        }

        @media (min-width: 768px) {
          .yinyang {
            width: 224px;
            height: 224px;
            border-width: 3px 3px 112px 3px;
          }

          .yinyang::before {
            width: 108px !important;
            height: 108px !important;
            border-width: 41px !important;
          }

          .yinyang::after {
            width: 108px !important;
            height: 108px !important;
            border-width: 41px !important;
          }
        }

        .yinyang::before {
          content: "";
          width: 97px;
          height: 97px;
          background: #fff;
          box-sizing: border-box;
          border-radius: 100%;
          border: 37px solid #000;
          position: absolute;
          left: 0;
          top: 100%;
          transform: translate(0, -50%);
        }

        .yinyang::after {
          content: "";
          width: 97px;
          height: 97px;
          background: #000;
          box-sizing: border-box;
          border-radius: 100%;
          border: 37px solid #fff;
          position: absolute;
          right: 0;
          top: 100%;
          transform: translate(0, -50%);
        }

        @keyframes yinyangRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
