'use client';

import { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '@/lib/constants';

interface BaguaLoaderProps {
  message?: string;
  queueCount?: number;
}

export default function BaguaLoader({ message, queueCount = 0 }: BaguaLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayQueue, setDisplayQueue] = useState(0);

  // 初始化排队人数
  useEffect(() => {
    // 如果实际排队人数少于1，显示随机1-5人
    if (queueCount < 1) {
      setDisplayQueue(Math.floor(Math.random() * 5) + 1);
    } else {
      setDisplayQueue(queueCount);
    }
  }, [queueCount]);

  useEffect(() => {
    if (message) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [message]);

  useEffect(() => {
    if (!message) {
      setCurrentMessage(LOADING_MESSAGES[messageIndex]);
    }
  }, [messageIndex, message]);

  // 模拟进度条
  useEffect(() => {
    setProgress(0);
    const duration = 20000; // 总时长20秒
    const intervalTime = 100; // 每100ms更新一次
    const increment = (100 / duration) * intervalTime;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        // 最多到95%，给实际加载留一些空间
        if (next >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* 星盘/能量圈动画 */}
      <div className="relative w-36 h-36">
        {/* 外圈旋转 */}
        <div className="absolute inset-0 rounded-full border border-gold-400/30 animate-spin" style={{ animationDuration: '12s' }}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute w-2 h-2 bg-gold-400 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateX(68px) translateY(-50%)`,
              }}
            />
          ))}
        </div>

        {/* 中圈反向旋转 */}
        <div className="absolute inset-4 rounded-full border border-purple-400/40" style={{ animation: 'spin 8s linear infinite reverse' }}>
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateX(50px) translateY(-50%)`,
              }}
            />
          ))}
        </div>

        {/* 内圈脉冲 */}
        <div className="absolute inset-8 rounded-full border-2 border-gold-400/50 animate-ping" style={{ animationDuration: '2s' }} />

        {/* 中心图标 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-gold-400/20 backdrop-blur-sm flex items-center justify-center border border-gold-400/30">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold-400 animate-pulse">
              <path
                fill="currentColor"
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              />
            </svg>
          </div>
        </div>

        {/* 光晕效果 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-gold-400/10 blur-xl animate-pulse" />
      </div>

      <div className="text-center max-w-sm w-full px-4">
        <p className="font-serif text-lg text-gold-400 mb-4">
          {message || currentMessage}
        </p>

        {/* 排队人数 */}
        <div className="mb-4 text-text-secondary text-sm">
          <span className="text-purple-400">当前排队：</span>
          <span className="text-gold-400 font-mono mx-1">{displayQueue}</span>
          <span>人</span>
        </div>

        {/* 进度条 */}
        <div className="w-full mb-2">
          <div className="h-2 bg-mystic-900/50 rounded-full overflow-hidden backdrop-blur-sm border border-gold-400/20">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-gold-400 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 进度百分比 */}
        <div className="text-xs text-text-secondary mb-3">
          推算中 <span className="text-gold-400 font-mono">{Math.floor(progress)}%</span>
        </div>

        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-gold-400"
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
