'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CurveMode, CURVE_MODE_LABELS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';
import RechargeModal from './RechargeModal';

interface HeaderProps {
  curveMode?: CurveMode;
  onModeChange?: (mode: CurveMode) => void;
  showModeSelector?: boolean;
}

export default function Header({
  curveMode = 'life',
  onModeChange,
  showModeSelector = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // 使用全局 AuthContext
  const {
    user,
    isLoading: authLoading,
    isLoggedIn,
    logout,
    refreshUser,
    showLoginModal,
    setShowLoginModal,
  } = useAuth();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/my', label: '我的报告' },
  ];

  const handleModeChange = (mode: CurveMode) => {
    onModeChange?.(mode);
  };

  const handleLoginSuccess = () => {
    // 登录成功后 AuthContext 会自动更新状态
    // 不需要手动处理
  };

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  const handleRechargeSuccess = () => {
    // 刷新用户信息
    refreshUser();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-apple-gray-200 shadow-apple">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo with Tab Switcher + 专家分析 */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto">
              {showModeSelector ? (
                // 水平标签切换器
                <div className="flex items-center bg-apple-gray-100 rounded-lg p-0.5 sm:p-1 flex-shrink-0">
                  {(Object.keys(CURVE_MODE_LABELS) as CurveMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        curveMode === mode
                          ? 'bg-white text-apple-blue shadow-sm'
                          : 'text-apple-gray-500 hover:text-apple-gray-600'
                      }`}
                    >
                      {CURVE_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              ) : (
                <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-medium text-base md:text-lg text-apple-gray-600">人生曲线</span>
                </Link>
              )}

              {/* 专家分析链接 */}
              <Link
                href="/masters"
                className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border flex-shrink-0 whitespace-nowrap ${
                  pathname === '/masters'
                    ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/30'
                    : 'text-apple-gray-500 hover:text-apple-blue border-apple-gray-200 hover:border-apple-blue/30'
                }`}
              >
                专家分析
              </Link>
            </div>

            {/* Desktop Nav + User */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition-colors ${
                      pathname === item.href
                        ? 'text-apple-blue'
                        : 'text-apple-gray-500 hover:text-apple-gray-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* 用户区域 */}
              {!authLoading && (
                user ? (
                  <UserMenu
                    user={user}
                    onLogout={handleLogout}
                    onRecharge={() => setShowRechargeModal(true)}
                  />
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 text-sm text-apple-blue border border-apple-blue/30 rounded-lg hover:bg-apple-blue/5 transition-colors"
                  >
                    登录
                  </button>
                )
              )}
            </div>

            {/* Mobile: User + Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              {!authLoading && (
                user ? (
                  <UserMenu
                    user={user}
                    onLogout={handleLogout}
                    onRecharge={() => setShowRechargeModal(true)}
                  />
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 text-sm text-apple-blue border border-apple-blue/30 rounded-lg hover:bg-apple-blue/5 transition-colors"
                  >
                    登录
                  </button>
                )
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-apple-gray-500 hover:text-apple-gray-600"
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
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <nav className="md:hidden py-4 border-t border-apple-gray-200">
              {/* Mode Selector for Mobile */}
              {showModeSelector && (
                <div className="pb-4 mb-4 border-b border-apple-gray-200">
                  <p className="text-xs text-apple-gray-400 mb-2">切换模式</p>
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
                            ? 'bg-apple-blue/10 text-apple-blue border border-apple-blue/30'
                            : 'bg-apple-gray-100 text-apple-gray-500 border border-apple-gray-200'
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
                      ? 'text-apple-blue'
                      : 'text-apple-gray-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* 充值弹窗 */}
      {user && (
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          currentPoints={user.points}
          onSuccess={handleRechargeSuccess}
        />
      )}
    </>
  );
}
