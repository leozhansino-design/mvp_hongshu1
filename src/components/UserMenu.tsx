'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, maskPhone } from '@/types/auth';
import { logout } from '@/services/auth';
import PointsHistoryModal from './PointsHistoryModal';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onRecharge: () => void;
}

export default function UserMenu({ user, onLogout, onRecharge }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    onLogout();
    setIsOpen(false);
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* 用户头像按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <span className="text-black text-sm font-bold">
              {user.phone ? user.phone.slice(-2) : 'U'}
            </span>
          </div>
          <span className="text-sm text-text-primary hidden sm:block">
            {maskPhone(user.phone)}
          </span>
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 下拉菜单 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-64 bg-mystic-900 rounded-xl border border-gold-400/20 shadow-2xl overflow-hidden z-50"
            >
              {/* 用户信息区 */}
              <div className="p-4 border-b border-gold-400/10">
                <p className="text-sm text-text-secondary mb-1">手机号</p>
                <p className="text-white font-mono">{maskPhone(user.phone)}</p>
              </div>

              {/* 积分显示 */}
              <div className="p-4 border-b border-gold-400/10 bg-gold-400/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">当前积分</p>
                    <p className="text-2xl font-bold text-gold-400">{user.points}</p>
                  </div>
                  <button
                    onClick={() => {
                      onRecharge();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-gold-400 to-gold-500 text-black text-sm font-bold rounded-lg hover:from-gold-500 hover:to-gold-600 transition-colors"
                  >
                    充值
                  </button>
                </div>
              </div>

              {/* 菜单项 */}
              <div className="py-2">
                <button
                  onClick={handleViewHistory}
                  className="w-full px-4 py-3 text-left text-text-primary hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  使用记录
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  退出登录
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 积分使用记录弹窗 */}
      <PointsHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
}
