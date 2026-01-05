'use client';

import { useState, useEffect, useMemo } from 'react';
import { ANALYSIS_MODULES } from '@/types';

interface AnalysisLoaderProps {
  onComplete?: () => void;
}

// 八卦符号
const BAGUA_SYMBOLS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

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
        const newProgress = Math.min(prev + increment, 100);

        // 更新当前模块
        const moduleIndex = Math.floor((newProgress / 100) * ANALYSIS_MODULES.length);
        setCurrentModuleIndex(Math.min(moduleIndex, ANALYSIS_MODULES.length - 1));

        if (newProgress >= 100) {
          clearInterval(progressTimer);
          onComplete?.();
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
    const remaining = Math.ceil((100 - progress) / 10);
    return `约 ${remaining} 秒`;
  }, [queuePosition, progress]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4">
      {/* 八卦阵动画 */}
      <div className="relative w-40 h-40 md:w-48 md:h-48">
        {/* 外层八卦旋转 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ animation: 'spin 20s linear infinite' }}
        >
          {BAGUA_SYMBOLS.map((symbol, index) => {
            const angle = (index * 45) * (Math.PI / 180);
            const radius = 72;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={index}
                className="absolute text-2xl text-gold-400/80"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {symbol}
              </div>
            );
          })}
        </div>

        {/* 中层能量环 */}
        <div
          className="absolute inset-6 rounded-full border-2 border-purple-500/40"
          style={{ animation: 'spin 8s linear infinite reverse' }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-transparent" />
        </div>

        {/* 内层光环脉冲 */}
        <div
          className="absolute inset-12 rounded-full border border-gold-400/60 animate-ping"
          style={{ animationDuration: '2s' }}
        />

        {/* 中心太极 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mystic-800 to-mystic-900 border-2 border-gold-400/50 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="relative w-12 h-12">
              {/* 太极图 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-black overflow-hidden">
                <div className="absolute top-0 left-1/2 w-1/2 h-full bg-white" />
                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-black rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-white rounded-full" />
              </div>
              <div
                className="absolute inset-0 rounded-full"
                style={{ animation: 'spin 4s linear infinite' }}
              />
            </div>
          </div>
        </div>

        {/* 光晕 */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-purple-500/20 to-transparent blur-xl animate-pulse" />
      </div>

      {/* 状态信息 */}
      <div className="text-center space-y-3 w-full max-w-sm">
        {queuePosition > 0 ? (
          <>
            <p className="font-serif text-lg text-gold-400">
              天机排演中...
            </p>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>当前排位：第 <span className="text-gold-400 font-mono">{queuePosition}</span> 位</span>
            </div>
          </>
        ) : (
          <>
            <p className="font-serif text-lg text-gold-400">
              {ANALYSIS_MODULES[currentModuleIndex]?.icon} {ANALYSIS_MODULES[currentModuleIndex]?.name}
            </p>
            <div className="text-text-secondary text-sm">
              AI 深度解析中...
            </div>
          </>
        )}

        {/* 进度条 */}
        <div className="relative h-2 bg-mystic-900 rounded-full overflow-hidden border border-purple-500/30">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-gold-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${queuePosition > 0 ? 0 : progress}%` }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ animation: 'shimmer 2s infinite' }}
          />
        </div>

        <div className="flex justify-between text-xs text-text-secondary">
          <span>{queuePosition > 0 ? '等待中' : `${Math.round(progress)}%`}</span>
          <span>{estimatedTime}</span>
        </div>

        {/* 模块进度列表 */}
        {queuePosition === 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {ANALYSIS_MODULES.map((module, index) => {
              const isCompleted = index < currentModuleIndex;
              const isCurrent = index === currentModuleIndex;

              return (
                <div
                  key={module.id}
                  className={`flex items-center gap-1 p-2 rounded text-xs transition-all ${
                    isCompleted
                      ? 'bg-kline-up/10 text-kline-up'
                      : isCurrent
                      ? 'bg-gold-400/10 text-gold-400 animate-pulse'
                      : 'bg-mystic-900/30 text-text-secondary'
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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
