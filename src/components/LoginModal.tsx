'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login as authLogin, getAuthUser } from '@/services/auth';
import { isValidPhone, isValidPassword } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (isNewUser: boolean) => void;
  redirectMessage?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  redirectMessage,
}: LoginModalProps) {
  const { login: contextLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 重置表单
  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // 验证表单
  const validateForm = (): string | null => {
    if (!phone.trim()) {
      return '请输入手机号';
    }
    if (!isValidPhone(phone.trim())) {
      return '请输入正确的手机号';
    }
    if (!password) {
      return '请输入密码';
    }
    if (!isValidPassword(password)) {
      return '密码长度需要6-20位';
    }
    return null;
  };

  // 处理登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await authLogin(phone.trim(), password);

      if (result.success) {
        // 更新全局 AuthContext 状态
        const user = getAuthUser();
        if (user) {
          contextLogin(user);
        }
        onSuccess?.(result.isNewUser || false);
        onClose();
      } else {
        setError(result.message || '登录失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-sm bg-mystic-900 rounded-2xl shadow-2xl border border-gold-400/20 overflow-hidden">
              {/* 头部 */}
              <div className="relative px-6 pt-6 pb-4 text-center">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-text-secondary hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="text-xl font-serif text-gold-400">登录 / 注册</h2>
                {redirectMessage && (
                  <p className="text-sm text-text-secondary mt-2">{redirectMessage}</p>
                )}
              </div>

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="px-6 pb-6">
                {/* 手机号输入 */}
                <div className="mb-4">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="手机号"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setPhone(value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-black/30 border border-gold-400/30 rounded-lg
                             text-white placeholder-text-secondary/50 focus:outline-none
                             focus:border-gold-400 transition-colors"
                    autoComplete="tel"
                  />
                </div>

                {/* 密码输入 */}
                <div className="mb-4 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="密码"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-black/30 border border-gold-400/30 rounded-lg
                             text-white placeholder-text-secondary/50 focus:outline-none
                             focus:border-gold-400 transition-colors pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-gold-400 to-gold-500 text-black font-bold
                           rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      处理中...
                    </span>
                  ) : (
                    '登录 / 注册'
                  )}
                </button>

                {/* 提示文字 */}
                <p className="text-center text-xs text-text-secondary/70 mt-4">
                  新用户自动注册，老用户直接登录
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
