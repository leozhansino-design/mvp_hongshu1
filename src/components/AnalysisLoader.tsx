'use client';

import { useState, useEffect, useMemo } from 'react';

interface AnalysisLoaderProps {
  onComplete?: () => void;
  messages?: string[];
}

// 简洁的加载消息
const LOADING_MESSAGES = [
  { id: 'init', name: '收集信息', icon: '1' },
  { id: 'analyze', name: '分析数据', icon: '2' },
  { id: 'calculate', name: '计算趋势', icon: '3' },
  { id: 'generate', name: '生成报告', icon: '4' },
];

export default function AnalysisLoader({ onComplete, messages }: AnalysisLoaderProps) {
  const displayModules = messages
    ? messages.map((msg, i) => ({ id: `msg-${i}`, name: msg, icon: `${i + 1}` }))
    : LOADING_MESSAGES;
  const [progress, setProgress] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [queuePosition, setQueuePosition] = useState(() => Math.floor(Math.random() * 2) + 1);

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
      }, 1000);

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
    }, 600);

    return () => clearInterval(progressTimer);
  }, [queuePosition, onComplete, displayModules.length]);

  const estimatedTime = useMemo(() => {
    if (queuePosition > 0) {
      return `等待中...`;
    }
    const remaining = Math.ceil((99 - progress) / 15);
    return remaining > 0 ? `预计 ${remaining} 秒` : '即将完成';
  }, [queuePosition, progress]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 w-full max-w-sm">
      {/* Apple-style Ring Loader */}
      <div className="relative w-32 h-32">
        {/* Background ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#e8e8ed"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#0066cc"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 56}
            strokeDashoffset={2 * Math.PI * 56 * (1 - (queuePosition > 0 ? 0 : progress / 100))}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-semibold text-apple-gray-600">
            {queuePosition > 0 ? '...' : `${Math.round(progress)}%`}
          </span>
        </div>
      </div>

      {/* Status Info */}
      <div className="text-center space-y-2 w-full">
        <p className="text-lg font-medium text-apple-gray-600">
          {queuePosition > 0
            ? '准备中...'
            : displayModules[currentModuleIndex]?.name
          }
        </p>
        <p className="text-sm text-apple-gray-400">
          {estimatedTime}
        </p>
      </div>

      {/* Progress Steps */}
      {queuePosition === 0 && (
        <div className="w-full space-y-2">
          {displayModules.map((module, index) => {
            const isCompleted = index < currentModuleIndex;
            const isCurrent = index === currentModuleIndex;

            return (
              <div
                key={module.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCompleted
                    ? 'bg-success/10'
                    : isCurrent
                    ? 'bg-apple-blue/10'
                    : 'bg-apple-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isCurrent
                    ? 'bg-apple-blue text-white'
                    : 'bg-apple-gray-300 text-white'
                }`}>
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : module.icon}
                </div>
                <span className={`text-sm ${
                  isCompleted
                    ? 'text-success'
                    : isCurrent
                    ? 'text-apple-blue font-medium'
                    : 'text-apple-gray-400'
                }`}>
                  {module.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
