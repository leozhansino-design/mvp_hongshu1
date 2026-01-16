'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CurveMode, CURVE_MODE_LABELS } from '@/types';

interface HeaderProps {
  curveMode?: CurveMode;
  onModeChange?: (mode: CurveMode) => void;
  showModeSelector?: boolean;
}

export default function Header({ curveMode = 'life', onModeChange, showModeSelector = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/my', label: '我的报告' },
  ];

  const handleModeChange = (mode: CurveMode) => {
    onModeChange?.(mode);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo with Tab Switcher */}
          <div className="flex items-center gap-1">
            {showModeSelector ? (
              // 水平标签切换器
              <div className="flex items-center bg-gray-900/50 rounded-lg p-1">
                {(Object.keys(CURVE_MODE_LABELS) as CurveMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      curveMode === mode
                        ? mode === 'wealth'
                          ? 'bg-gradient-to-r from-gold-400/30 to-amber-500/30 text-gold-400 shadow-sm'
                          : 'bg-purple-500/20 text-purple-300 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {CURVE_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <span className="font-serif text-lg text-white">人生曲线</span>
              </Link>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  pathname === item.href
                    ? 'text-gold-400'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800">
            {/* Mode Selector for Mobile */}
            {showModeSelector && (
              <div className="pb-4 mb-4 border-b border-gray-800">
                <p className="text-xs text-text-secondary mb-2">切换模式</p>
                <div className="flex gap-2">
                  {(Object.keys(CURVE_MODE_LABELS) as CurveMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        handleModeChange(mode);
                        setMenuOpen(false);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                        curveMode === mode
                          ? 'bg-gold-400/20 text-gold-400 border border-gold-400/50'
                          : 'bg-white/5 text-text-secondary border border-gray-700'
                      }`}
                    >
                      {CURVE_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm ${
                  pathname === item.href
                    ? 'text-gold-400'
                    : 'text-text-secondary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
