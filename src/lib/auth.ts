import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseAdmin } from './supabase';
import { User } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'lifecurve-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7天免登录
const SALT_ROUNDS = 10;

// JWT payload类型
interface JWTPayload {
  userId: string;
  phone: string;
  iat?: number;
  exp?: number;
}

// 生成密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成JWT token
export function generateToken(userId: string, phone: string): string {
  return jwt.sign(
    { userId, phone } as JWTPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// 验证JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// 生成用户ID
export function generateUserId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// 通过手机号查找用户
export async function findUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    phone: data.phone,
    points: data.points || 0,
    freeUsed: data.free_used || 0,
    freeUsedWealth: data.free_used_wealth || 0,
    totalPaid: data.total_paid || 0,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

// 通过ID查找用户
export async function findUserById(userId: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    phone: data.phone,
    points: data.points || 0,
    freeUsed: data.free_used || 0,
    freeUsedWealth: data.free_used_wealth || 0,
    totalPaid: data.total_paid || 0,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

// 创建新用户
export async function createUser(
  phone: string,
  passwordHash: string,
  fingerprint?: string
): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .insert({
      phone,
      password_hash: passwordHash,
      points: 0,
      free_used: 0,
      free_used_wealth: 0,
      total_paid: 0,
      migrated_device_id: fingerprint,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating user:', error);
    return null;
  }

  return {
    id: data.id,
    phone: data.phone,
    points: data.points || 0,
    freeUsed: data.free_used || 0,
    freeUsedWealth: data.free_used_wealth || 0,
    totalPaid: data.total_paid || 0,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

// 获取用户密码哈希
export async function getUserPasswordHash(phone: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('password_hash')
    .eq('phone', phone)
    .single();

  if (error || !data) return null;
  return data.password_hash;
}

// 更新用户最后登录时间
export async function updateLastLogin(userId: string): Promise<void> {
  await getSupabaseAdmin()
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

// 更新用户积分
export async function updateUserPoints(userId: string, points: number): Promise<void> {
  await getSupabaseAdmin()
    .from('users')
    .update({ points })
    .eq('id', userId);
}

// 更新用户免费使用次数
export async function updateUserFreeUsed(
  userId: string,
  freeUsed: number,
  freeUsedWealth?: number
): Promise<void> {
  const update: Record<string, number> = { free_used: freeUsed };
  if (freeUsedWealth !== undefined) {
    update.free_used_wealth = freeUsedWealth;
  }

  await getSupabaseAdmin()
    .from('users')
    .update(update)
    .eq('id', userId);
}

// 保存用户会话
export async function saveUserSession(
  userId: string,
  tokenHash: string,
  deviceInfo: Record<string, unknown>,
  ipAddress: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

  await getSupabaseAdmin()
    .from('user_sessions')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      device_info: deviceInfo,
      ip_address: ipAddress,
      expires_at: expiresAt.toISOString(),
    });
}

// 撤销用户会话
export async function revokeUserSession(tokenHash: string): Promise<void> {
  await getSupabaseAdmin()
    .from('user_sessions')
    .update({ is_revoked: true })
    .eq('token_hash', tokenHash);
}

// 从请求头获取token
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// 从token获取用户信息
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  return findUserById(payload.userId);
}

// 哈希token用于存储
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
