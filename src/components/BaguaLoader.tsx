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
  const [isReverse, setIsReverse] = useState(false);

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

  // 太极图正反转动
  useEffect(() => {
    const interval = setInterval(() => {
      setIsReverse((prev) => !prev);
    }, 3000); // 每3秒切换方向

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* 太极图 */}
      <div className="relative w-48 h-48">
        <svg
          viewBox="0 0 200 200"
          className={`w-full h-full transition-transform duration-3000 ${
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

      <div className="text-center max-w-sm w-full px-4">
        <p className="font-serif text-lg text-white mb-4">
          {message || currentMessage}
        </p>

        {/* 排队人数 */}
        <div className="mb-4 text-gray-400 text-sm">
          <span>当前排队：</span>
          <span className="text-white font-mono mx-1">{displayQueue}</span>
          <span>人</span>
        </div>

        {/* 进度条 */}
        <div className="w-full mb-2">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 进度百分比 */}
        <div className="text-xs text-gray-400 mb-3">
          推算中 <span className="text-white font-mono">{Math.floor(progress)}%</span>
        </div>

        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white"
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
