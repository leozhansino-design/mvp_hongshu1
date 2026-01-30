'use client';

import { User, DeviceInfo, AuthResponse, UserSession } from '@/types/auth';

const AUTH_TOKEN_KEY = 'lc_auth_token';
const AUTH_USER_KEY = 'lc_auth_user';

// 获取设备信息
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      language: '',
      platform: '',
      screenResolution: '',
      timezone: '',
      cookieEnabled: false,
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookieEnabled: navigator.cookieEnabled,
  };
}

// 生成设备指纹
export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';

  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
  ];

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('BrowserFP', 2, 15);
      components.push(canvas.toDataURL());
    }
  } catch {
    // Canvas fingerprint not available
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    // WebGL fingerprint not available
  }

  // Hash the components
  const text = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 保存认证信息到本地
export function saveAuth(token: string, user: User): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

// 获取保存的token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// 获取保存的用户信息
export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// 清除认证信息
export function clearAuth(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getAuthUser();
}

// 获取当前会话信息
export function getCurrentSession(): UserSession | null {
  const user = getAuthUser();
  if (!user) return null;

  return {
    userId: user.id,
    phone: user.phone,
    points: user.points,
    freeUsed: user.freeUsed,
    freeUsedWealth: user.freeUsedWealth,
  };
}

// 更新本地用户积分
export function updateLocalUserPoints(points: number): void {
  const user = getAuthUser();
  if (!user) return;

  user.points = points;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

// 更新本地用户免费次数
export function updateLocalUserFreeUsed(freeUsed: number, freeUsedWealth?: number): void {
  const user = getAuthUser();
  if (!user) return;

  user.freeUsed = freeUsed;
  if (freeUsedWealth !== undefined) {
    user.freeUsedWealth = freeUsedWealth;
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

// 登录API调用
export async function login(phone: string, password: string): Promise<AuthResponse> {
  const fingerprint = await generateFingerprint();
  const deviceInfo = getDeviceInfo();

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      password,
      fingerprint,
      deviceInfo,
    }),
  });

  const data = await response.json();

  if (data.success && data.token && data.user) {
    saveAuth(data.token, data.user);
  }

  return data;
}

// 登出API调用
export async function logout(): Promise<void> {
  const token = getAuthToken();

  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore logout errors
    }
  }

  clearAuth();
}

// 刷新用户信息
export async function refreshUserInfo(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        saveAuth(token, data.user);
        return data.user;
      }
    } else if (response.status === 401) {
      // Token expired or invalid
      clearAuth();
    }
  } catch {
    // Network error
  }

  return null;
}

// 检查防刷状态
export async function checkAntiAbuse(): Promise<{ allowed: boolean; reason?: string }> {
  const fingerprint = await generateFingerprint();

  try {
    const response = await fetch('/api/auth/check-abuse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fingerprint }),
    });

    return await response.json();
  } catch {
    return { allowed: true }; // Allow on error
  }
}
