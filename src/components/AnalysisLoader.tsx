'use client';

import { useState, useEffect, useMemo } from 'react';
import { ANALYSIS_MODULES } from '@/types';

interface AnalysisLoaderProps {
  onComplete?: () => void;
  messages?: string[];
}

// Tech-style loading messages
const TECH_LOADING_MESSAGES = [
  { id: 'init', name: '初始化时空坐标系统', icon: '◎' },
  { id: 'fetch', name: '调取历史气象数据', icon: '◉' },
  { id: 'model', name: '加载时间维度模型', icon: '◈' },
  { id: 'calc', name: '运行周期算法', icon: '◇' },
  { id: 'analyze', name: '多维度交叉分析', icon: '◆' },
  { id: 'predict', name: '生成趋势预测', icon: '●' },
];

export default function AnalysisLoader({ onComplete, messages }: AnalysisLoaderProps) {
  // 使用自定义消息或默认模块
  const displayModules = messages
    ? messages.map((msg, i) => ({ id: `msg-${i}`, name: msg, icon: '◎' }))
    : TECH_LOADING_MESSAGES;
  const [progress, setProgress] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [queuePosition, setQueuePosition] = useState(() => Math.floor(Math.random() * 3) + 1);
  const [dataPoints, setDataPoints] = useState<number[]>([]);

  // Generate random data points for visualization
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newPoints = [...prev, Math.random() * 100];
        if (newPoints.length > 20) newPoints.shift();
        return newPoints;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

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
      }, 1200);

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
      return `Queue: ${queuePosition}`;
    }
    const remaining = Math.ceil((99 - progress) / 10);
    return remaining > 0 ? `ETA: ${remaining}s` : 'Completing...';
  }, [queuePosition, progress]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4">
      {/* Tech Scanner Animation */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-cyber-400/30"></div>
        <div className="absolute inset-2 rounded-full border border-cyber-400/20"></div>
        <div className="absolute inset-4 rounded-full border border-white/10"></div>

        {/* Scanning line */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-400/20 via-transparent to-transparent animate-scan"></div>
        </div>

        {/* Center hexagon */}
        <div className="relative w-20 h-20 md:w-24 md:h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="none"
              stroke="rgba(34, 211, 238, 0.5)"
              strokeWidth="2"
            />
            <polygon
              points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5"
              fill="rgba(34, 211, 238, 0.1)"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="1"
            />
          </svg>
          {/* Progress percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-cyber-400 font-mono text-xl md:text-2xl font-bold">
              {queuePosition > 0 ? '...' : `${Math.round(progress)}%`}
            </span>
          </div>
        </div>

        {/* Data visualization dots */}
        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-center gap-0.5 opacity-50">
          {dataPoints.map((point, i) => (
            <div
              key={i}
              className="w-1 bg-cyber-400 rounded-t transition-all duration-200"
              style={{ height: `${point * 0.4}%` }}
            />
          ))}
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '6s' }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-cyber-400 shadow-cyber-glow"></div>
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
          <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -ml-0.75 rounded-full bg-neon-blue"></div>
        </div>
      </div>

      {/* 状态信息 */}
      <div className="text-center space-y-3 w-full max-w-sm">
        {queuePosition > 0 ? (
          <>
            <p className="text-lg text-white font-medium">
              Initializing System...
            </p>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <span className="inline-block w-2 h-2 bg-cyber-400 rounded-full animate-pulse" />
              <span className="font-mono">Queue Position: <span className="text-cyber-400">{queuePosition}</span></span>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg text-white font-medium flex items-center justify-center gap-2">
              <span className="text-cyber-400">{displayModules[currentModuleIndex]?.icon}</span>
              <span>{displayModules[currentModuleIndex]?.name}</span>
            </p>
            <div className="text-text-muted text-sm font-mono">
              Processing temporal data matrix...
            </div>
          </>
        )}

        {/* 进度条 */}
        <div className="relative h-1 bg-tech-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${queuePosition > 0 ? 0 : progress}%`,
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6)'
            }}
          />
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer"></div>
        </div>

        <div className="flex justify-between text-xs text-text-muted font-mono">
          <span>{queuePosition > 0 ? 'Waiting...' : `${Math.round(progress)}% Complete`}</span>
          <span>{estimatedTime}</span>
        </div>

        {/* 模块进度列表 */}
        {queuePosition === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {displayModules.map((module, index) => {
              const isCompleted = index < currentModuleIndex;
              const isCurrent = index === currentModuleIndex;

              return (
                <div
                  key={module.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border ${
                    isCompleted
                      ? 'bg-cyber-400/10 text-cyber-400 border-cyber-400/30'
                      : isCurrent
                      ? 'bg-cyber-400/20 text-white border-cyber-400/50 animate-pulse'
                      : 'bg-tech-800/50 text-text-muted border-white/5'
                  }`}
                >
                  <span className="text-sm">{isCompleted ? '✓' : module.icon}</span>
                  <span className="whitespace-nowrap truncate">{module.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Terminal-style log */}
        <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5 text-left font-mono text-xs text-text-muted">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-neon-red"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="w-2 h-2 rounded-full bg-neon-green"></span>
          </div>
          <div className="space-y-1 max-h-16 overflow-hidden">
            <p className="text-cyber-400">$ analyzing temporal coordinates...</p>
            <p className="animate-pulse">{'>'} {displayModules[currentModuleIndex]?.name || 'Loading...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
