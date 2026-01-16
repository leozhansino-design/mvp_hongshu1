'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/my', label: '我的报告' },
  ];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeChange = (mode: CurveMode) => {
    onModeChange?.(mode);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {showModeSelector ? (
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 font-serif text-lg text-white hover:text-gold-400 transition-colors"
              >
                <span>{CURVE_MODE_LABELS[curveMode]}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <span className="font-serif text-lg text-white">人生曲线</span>
              </Link>
            )}

            {/* Dropdown Menu */}
            {showModeSelector && dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-black/95 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {(Object.keys(CURVE_MODE_LABELS) as CurveMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      curveMode === mode
                        ? 'bg-gold-400/20 text-gold-400'
                        : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {mode === 'life' ? (
                        <span className="text-purple-400">☯</span>
                      ) : (
                        <span className="text-gold-400">💰</span>
                      )}
                      {CURVE_MODE_LABELS[mode]}
                    </span>
                  </button>
                ))}
              </div>
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
