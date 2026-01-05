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
        // 神秘深色背景
        mystic: {
          900: '#0D0221',
          800: '#1A0A2E',
          700: '#16213E',
          600: '#2D1B4E',
        },
        // 金色光芒
        gold: {
          400: '#FFD700',
          500: '#D4AF37',
          600: '#B8860B',
        },
        // 紫气
        purple: {
          400: '#9D4EDD',
          500: '#7B2CBF',
          600: '#5A189A',
        },
        // K线颜色
        kline: {
          up: '#22D3EE',    // 青色涨
          down: '#F43F5E',  // 玫红跌
          current: '#FFD700', // 金色当前
        },
        // 神秘蓝
        accent: {
          blue: '#00D9FF',
        },
        // 文字色
        text: {
          primary: '#E8E6E3',
          secondary: '#9CA3AF',
          gold: '#FFD700',
        }
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      backgroundImage: {
        'mystic-gradient': 'linear-gradient(180deg, #0D0221 0%, #1A0A2E 50%, #16213E 100%)',
        'gold-gradient': 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
        'purple-gradient': 'linear-gradient(90deg, #9D4EDD 0%, #7B2CBF 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'purple-glow': '0 0 20px rgba(157, 78, 221, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
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
      },
    },
  },
  plugins: [],
} satisfies Config;
