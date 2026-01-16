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
    const duration = 20000;
    const intervalTime = 100;
    const increment = (100 / duration) * intervalTime;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
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

      <div className="text-center">
        <p className="font-serif text-lg text-gold-400">
          {message || currentMessage}
        </p>
        <div className="mt-3 flex justify-center gap-1.5">
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
