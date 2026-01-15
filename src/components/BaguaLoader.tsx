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
      {/* 太极图 */}
      <div className="relative w-48 h-48">
        <div className="taiji-container">
          <div className="bai"></div>
          <div className="hei"></div>
        </div>
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

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .taiji-container {
          width: 200px;
          height: 200px;
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
