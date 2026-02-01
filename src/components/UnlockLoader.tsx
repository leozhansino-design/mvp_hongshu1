'use client';

import { useState, useEffect, useMemo } from 'react';

interface UnlockLoaderProps {
  onComplete?: () => void;
}

const UNLOCK_MODULES = [
  { id: 'basic', name: 'AI深度分析八维运势', icon: '1' },
  { id: 'ten-gods', name: '神经网络解读十神', icon: '2' },
  { id: 'dayun', name: '大数据推演大运流年', icon: '3' },
  { id: 'children', name: 'GPT生成子女运势', icon: '4' },
  { id: 'benefactor', name: '智能匹配贵人特征', icon: '5' },
  { id: 'education', name: 'AI评估学业潜力', icon: '6' },
  { id: 'shensha', name: '深度学习神煞解析', icon: '7' },
  { id: 'improve', name: '个性化改运建议', icon: '8' },
  { id: 'future', name: 'AI预测逐年运势', icon: '9' },
  { id: 'key-years', name: '关键年份智能预警', icon: '10' },
];

const AI_UNLOCK_HINTS = [
  '正在调用千万级命理数据库...',
  '深度学习模型匹配中...',
  'GPT-4大模型分析进行中...',
  '多维度交叉验证数据...',
];

export default function UnlockLoader({ onComplete }: UnlockLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // 循环显示AI提示
  useEffect(() => {
    const hintTimer = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % AI_UNLOCK_HINTS.length);
    }, 2500);
    return () => clearInterval(hintTimer);
  }, []);

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
    <div className="flex flex-col items-center justify-center gap-6 px-4 min-h-screen bg-gradient-to-b from-white to-apple-gray-100">
      {/* Apple-style Ring Loader */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#e8e8ed"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#0066cc"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - progress / 100)}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-semibold text-apple-blue">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* 状态信息 */}
      <div className="text-center space-y-4 w-full max-w-md">
        <h2 className="font-medium text-2xl text-apple-gray-600 mb-2">
          AI 正在解锁完整命数...
        </h2>

        <p className="text-lg text-apple-blue mb-2">
          {UNLOCK_MODULES[currentModuleIndex]?.name}
        </p>

        {/* AI提示 */}
        <p className="text-sm text-apple-gray-400 transition-opacity duration-500">
          {AI_UNLOCK_HINTS[currentHintIndex]}
        </p>

        {/* 进度条 */}
        <div className="relative h-2 bg-apple-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-apple-blue rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-apple-gray-400">
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
                className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all border ${
                  isCompleted
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : isCurrent
                    ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/30'
                    : 'bg-apple-gray-50 text-apple-gray-400 border-apple-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-apple-blue text-white'
                    : 'bg-apple-gray-300 text-white'
                }`}>
                  {isCompleted ? '✓' : module.icon}
                </div>
                <span className="flex-1 text-left">{module.name}</span>
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-apple-gray-400 mt-4">
          基于千万级命理数据，AI正在生成专属分析报告
        </p>
      </div>
    </div>
  );
}
