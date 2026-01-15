'use client';

import { useState, useEffect, useMemo } from 'react';

interface UnlockLoaderProps {
  onComplete?: () => void;
}

const UNLOCK_MODULES = [
  { id: 'basic', name: '八维详批', icon: '✦' },
  { id: 'ten-gods', name: '十神详解', icon: '○' },
  { id: 'dayun', name: '大运流年', icon: '◐' },
  { id: 'children', name: '子女运势', icon: '○' },
  { id: 'benefactor', name: '贵人运势', icon: '○' },
  { id: 'education', name: '学业智慧', icon: '○' },
  { id: 'shensha', name: '神煞解析', icon: '○' },
  { id: 'improve', name: '改运建议', icon: '○' },
  { id: 'future', name: '逐年运势', icon: '◐' },
  { id: 'key-years', name: '关键年份', icon: '✦' },
];

export default function UnlockLoader({ onComplete }: UnlockLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  // 模拟解锁进度
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 6 + 3; // 3-9的随机增量
        const newProgress = Math.min(prev + increment, 99);

        const moduleIndex = Math.floor((newProgress / 99) * UNLOCK_MODULES.length);
        setCurrentModuleIndex(Math.min(moduleIndex, UNLOCK_MODULES.length - 1));

        if (newProgress >= 99) {
          clearInterval(progressTimer);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }

        return newProgress;
      });
    }, 600); // 每600ms更新一次

    return () => clearInterval(progressTimer);
  }, [onComplete]);

  // 估计剩余时间
  const estimatedTime = useMemo(() => {
    const remaining = Math.ceil((99 - progress) / 8);
    return remaining > 0 ? `约 ${remaining} 秒` : '即将完成';
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 min-h-screen">
      {/* 太极图 */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        <div className="yinyang"></div>
      </div>

      {/* 状态信息 */}
      <div className="text-center space-y-4 w-full max-w-md">
        <h2 className="font-serif text-2xl text-white mb-2">
          正在解锁完整命数...
        </h2>

        <p className="text-lg text-white/90 mb-6">
          {UNLOCK_MODULES[currentModuleIndex]?.icon} {UNLOCK_MODULES[currentModuleIndex]?.name}
        </p>

        {/* 进度条 */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white via-gray-200 to-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-400">
          <span>{Math.round(progress)}%</span>
          <span>{estimatedTime}</span>
        </div>

        {/* 解锁模块网格 */}
        <div className="grid grid-cols-2 gap-2 mt-6">
          {UNLOCK_MODULES.map((module, index) => {
            const isCompleted = index < currentModuleIndex;
            const isCurrent = index === currentModuleIndex;

            return (
              <div
                key={module.id}
                className={`flex items-center gap-2 p-3 rounded text-sm transition-all border ${
                  isCompleted
                    ? 'bg-white/10 text-white border-white/30'
                    : isCurrent
                    ? 'bg-white/20 text-white border-white/50 animate-pulse'
                    : 'bg-black/30 text-gray-500 border-gray-700'
                }`}
              >
                <span className="text-lg">{module.icon}</span>
                <span className="flex-1">{module.name}</span>
                {isCompleted && <span className="text-green-400">✓</span>}
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          正在为您解锁更详尽的命理分析...
        </p>
      </div>

      <style jsx>{`
        .yinyang {
          width: 224px;
          height: 224px;
          background: #fff;
          box-sizing: border-box;
          border-color: #000;
          border-style: solid;
          border-width: 3px 3px 112px 3px;
          border-radius: 100%;
          position: relative;
          animation: yinyangRotate 3s infinite linear;
        }

        .yinyang::before {
          content: "";
          width: 108px;
          height: 108px;
          background: #fff;
          box-sizing: border-box;
          border-radius: 100%;
          border: 41px solid #000;
          position: absolute;
          left: 0;
          top: 100%;
          transform: translate(0, -50%);
        }

        .yinyang::after {
          content: "";
          width: 108px;
          height: 108px;
          background: #000;
          box-sizing: border-box;
          border-radius: 100%;
          border: 41px solid #fff;
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
