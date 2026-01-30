'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types/auth';
import {
  getAuthUser,
  isAuthenticated,
  refreshUserInfo,
  logout as authLogout,
  updateLocalUserPoints,
  updateLocalUserFreeUsed,
} from '@/services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePoints: (points: number) => void;
  updateFreeUsed: (freeUsed: number, freeUsedWealth?: number) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  loginRedirectMessage: string;
  setLoginRedirectMessage: (message: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRedirectMessage, setLoginRedirectMessage] = useState('');

  // 初始化检查登录状态
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const cachedUser = getAuthUser();
        setUser(cachedUser);

        // 后台刷新用户信息
        const freshUser = await refreshUserInfo();
        if (freshUser) {
          setUser(freshUser);
        } else {
          // Token 失效
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback((newUser: User) => {
    setUser(newUser);
    setShowLoginModal(false);
    setLoginRedirectMessage('');
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const freshUser = await refreshUserInfo();
    if (freshUser) {
      setUser(freshUser);
    }
  }, []);

  const updatePoints = useCallback((points: number) => {
    updateLocalUserPoints(points);
    setUser((prev) => (prev ? { ...prev, points } : null));
  }, []);

  const updateFreeUsed = useCallback((freeUsed: number, freeUsedWealth?: number) => {
    updateLocalUserFreeUsed(freeUsed, freeUsedWealth);
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        freeUsed,
        ...(freeUsedWealth !== undefined ? { freeUsedWealth } : {}),
      };
    });
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    refreshUser,
    updatePoints,
    updateFreeUsed,
    showLoginModal,
    setShowLoginModal,
    loginRedirectMessage,
    setLoginRedirectMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
