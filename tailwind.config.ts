import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tech dark background
        tech: {
          950: '#030712',  // 最深背景
          900: '#0a0f1a',  // 深色背景
          800: '#111827',  // 卡片背景
          700: '#1e293b',  // 悬停背景
          600: '#334155',  // 边框色
        },
        // 科技蓝 - 主色调
        cyber: {
          300: '#67e8f9',  // 亮青色
          400: '#22d3ee',  // 主青色
          500: '#06b6d4',  // 深青色
          600: '#0891b2',  // 更深
        },
        // 科技蓝 - 辅助色
        neon: {
          blue: '#3b82f6',   // 蓝色
          purple: '#8b5cf6', // 紫色（保留一点点）
          green: '#10b981',  // 成功绿
          red: '#ef4444',    // 错误红
        },
        // K线颜色
        kline: {
          up: '#22d3ee',    // 青色涨
          down: '#f43f5e',  // 玫红跌
          current: '#3b82f6', // 蓝色当前
        },
        // 玻璃效果
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
        // 文字色
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
          accent: '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      backgroundImage: {
        'tech-gradient': 'linear-gradient(180deg, #030712 0%, #0a0f1a 50%, #111827 100%)',
        'cyber-gradient': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(17, 24, 39, 0.8) 0%, rgba(10, 15, 26, 0.9) 100%)',
      },
      boxShadow: {
        'cyber-glow': '0 0 20px rgba(34, 211, 238, 0.3)',
        'cyber-glow-lg': '0 0 40px rgba(34, 211, 238, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'data-flow': 'data-flow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'data-flow': {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(0)' },
          '50%': { opacity: '1', transform: 'translateX(10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
