'use client';

import { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '@/lib/constants';

interface BaguaLoaderProps {
  message?: string;
}

export default function BaguaLoader({ message }: BaguaLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);

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

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative w-32 h-32">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full animate-bagua-spin"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1"
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1"
            opacity="0.3"
          />
          <path
            d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5"
            fill="url(#goldGradient)"
            opacity="0.8"
          />
          <path
            d="M50 95 A45 45 0 0 1 50 5 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 95"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1"
          />
          <circle cx="50" cy="27.5" r="6" fill="#0D0221" stroke="url(#goldGradient)" strokeWidth="1" />
          <circle cx="50" cy="72.5" r="6" fill="url(#goldGradient)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <line
                x1="50"
                y1="8"
                x2="50"
                y2="15"
                stroke="url(#goldGradient)"
                strokeWidth="2"
                opacity="0.6"
              />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 animate-pulse-glow rounded-full" />
      </div>

      <div className="text-center">
        <p className="font-serif text-lg text-gold-400 animate-pulse">
          {message || currentMessage}
        </p>
        <div className="mt-2 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gold-400 opacity-50"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
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
