// 用户认证相关类型

export interface User {
  id: string;
  phone: string;
  points: number;
  freeUsed: number;
  freeUsedWealth: number;
  totalPaid: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  isNewUser?: boolean;
}

export interface LoginRequest {
  phone: string;
  password: string;
  fingerprint: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
}

export interface AntiAbuseCheckResult {
  allowed: boolean;
  reason?: string;
  fingerprint?: string;
}

export interface UserSession {
  userId: string;
  phone: string;
  points: number;
  freeUsed: number;
  freeUsedWealth: number;
}

// 手机号验证正则（中国大陆手机号）
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

// 密码要求（6-20位，包含数字）
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 20;

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}

// 掩码手机号 (138****8888)
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
}
