import { createClient } from '@supabase/supabase-js';

// 数据库类型定义
export interface DbUser {
  id: string;
  wechat_openid: string | null;
  nickname: string | null;
  avatar: string | null;
  points: number;
  total_recharged: number;
  total_consumed: number;
  created_at: string;
  last_login_at: string | null;
}

export interface DbKey {
  id: number;
  key_code: string;
  points: number;
  status: 'unused' | 'used' | 'disabled';
  created_at: string;
  used_at: string | null;
  used_by: string | null;
  used_by_device: string | null;
  used_by_info: string | null;
}

export interface DbDeviceUsage {
  id: number;
  device_id: string;
  free_used: number;          // 人生曲线免费已用次数
  free_used_wealth: number;   // 财富曲线免费已用次数
  points: number;
  created_at: string;
  updated_at: string;
}

export interface DbPointsLog {
  id: number;
  user_id: string | null;
  device_id: string | null;
  type: 'recharge' | 'consume';
  points: number;
  balance: number;
  description: string | null;
  related_key: string | null;
  created_at: string;
}

export interface DbUsageLog {
  id: number;
  user_id: string | null;
  device_id: string | null;
  action: 'free_overview' | 'paid_overview' | 'detailed';
  points_cost: number;
  birth_info: Record<string, unknown> | null;
  result_id: string | null;
  curve_mode: 'life' | 'wealth';
  created_at: string;
}

export interface KeysStats {
  unused_count: number;
  used_count: number;
  disabled_count: number;
  total_count: number;
  total_points_used: number;
  total_points_unused: number;
  unused_10: number;
  used_10: number;
  unused_200: number;
  used_200: number;
  unused_1000: number;
  used_1000: number;
}

// 客户端 Supabase 实例（公开的，用于客户端）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端 Supabase 实例（使用 service key，完全权限）
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// 设备相关操作
// ============================================

// 获取或创建设备记录
export async function getOrCreateDevice(deviceId: string): Promise<DbDeviceUsage> {
  const supabaseAdmin = getSupabaseAdmin();

  // 先尝试获取
  const { data: existing } = await supabaseAdmin
    .from('device_usage')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (existing) {
    return existing as DbDeviceUsage;
  }

  // 不存在则创建
  const { data: created, error } = await supabaseAdmin
    .from('device_usage')
    .insert({ device_id: deviceId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create device: ${error.message}`);
  }

  return created as DbDeviceUsage;
}

// 增加设备使用次数（支持按曲线类型分别计数）
export async function incrementDeviceUsage(deviceId: string, curveMode: 'life' | 'wealth' = 'life'): Promise<DbDeviceUsage> {
  const supabaseAdmin = getSupabaseAdmin();

  // 先获取或创建
  const device = await getOrCreateDevice(deviceId);

  // 根据曲线类型增加对应的使用次数
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (curveMode === 'wealth') {
    updateData.free_used_wealth = (device.free_used_wealth || 0) + 1;
  } else {
    updateData.free_used = device.free_used + 1;
  }

  const { data, error } = await supabaseAdmin
    .from('device_usage')
    .update(updateData)
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`);
  }

  return data as DbDeviceUsage;
}

// ============================================
// 卡密相关操作
// ============================================

// 生成卡密
export async function generateKeys(points: number, count: number): Promise<string[]> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.rpc('batch_generate_keys', {
    p_points: points,
    p_count: count,
  });

  if (error) {
    throw new Error(`Failed to generate keys: ${error.message}`);
  }

  return (data as { key_code: string }[]).map((k) => k.key_code);
}

// 获取卡密列表
export async function getKeys(options: {
  status?: 'unused' | 'used' | 'disabled' | 'all';
  points?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ keys: DbKey[]; total: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { status = 'all', points, page = 1, pageSize = 50 } = options;

  let query = supabaseAdmin.from('keys').select('*', { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (points) {
    query = query.eq('points', points);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to get keys: ${error.message}`);
  }

  return {
    keys: (data as DbKey[]) || [],
    total: count || 0,
  };
}

// 获取卡密统计
export async function getKeysStats(): Promise<KeysStats> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.from('keys_stats').select('*').single();

  if (error) {
    // 如果视图不存在，手动计算
    const { data: keys } = await supabaseAdmin.from('keys').select('status, points');
    const allKeys = (keys as DbKey[]) || [];

    return {
      unused_count: allKeys.filter((k) => k.status === 'unused').length,
      used_count: allKeys.filter((k) => k.status === 'used').length,
      disabled_count: allKeys.filter((k) => k.status === 'disabled').length,
      total_count: allKeys.length,
      total_points_used: allKeys
        .filter((k) => k.status === 'used')
        .reduce((sum, k) => sum + k.points, 0),
      total_points_unused: allKeys
        .filter((k) => k.status === 'unused')
        .reduce((sum, k) => sum + k.points, 0),
      unused_10: allKeys.filter((k) => k.points === 10 && k.status === 'unused').length,
      used_10: allKeys.filter((k) => k.points === 10 && k.status === 'used').length,
      unused_200: allKeys.filter((k) => k.points === 200 && k.status === 'unused').length,
      used_200: allKeys.filter((k) => k.points === 200 && k.status === 'used').length,
      unused_1000: allKeys.filter((k) => k.points === 1000 && k.status === 'unused').length,
      used_1000: allKeys.filter((k) => k.points === 1000 && k.status === 'used').length,
    };
  }

  return data as KeysStats;
}

// 禁用卡密
export async function disableKey(keyCode: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from('keys')
    .update({ status: 'disabled' })
    .eq('key_code', keyCode)
    .eq('status', 'unused');

  if (error) {
    throw new Error(`Failed to disable key: ${error.message}`);
  }

  return true;
}

// 兑换卡密
export async function redeemKey(
  keyCode: string,
  deviceId: string,
  userId?: string
): Promise<{ success: boolean; points?: number; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  // 查找卡密
  const { data: key, error: keyError } = await supabaseAdmin
    .from('keys')
    .select('*')
    .eq('key_code', keyCode.toUpperCase())
    .single();

  if (keyError || !key) {
    return { success: false, error: '卡密无效' };
  }

  if (key.status === 'used') {
    return { success: false, error: '卡密已被使用' };
  }

  if (key.status === 'disabled') {
    return { success: false, error: '卡密已作废' };
  }

  const dbKey = key as DbKey;

  // 更新卡密状态
  const { error: updateError } = await supabaseAdmin
    .from('keys')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
      used_by: userId || null,
      used_by_device: deviceId,
    })
    .eq('key_code', keyCode.toUpperCase());

  if (updateError) {
    return { success: false, error: '兑换失败，请重试' };
  }

  // 增加设备积分
  const device = await getOrCreateDevice(deviceId);
  const newBalance = device.points + dbKey.points;

  await supabaseAdmin
    .from('device_usage')
    .update({
      points: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  // 记录积分变动
  await supabaseAdmin.from('points_log').insert({
    user_id: userId || null,
    device_id: deviceId,
    type: 'recharge',
    points: dbKey.points,
    balance: newBalance,
    description: '兑换卡密',
    related_key: keyCode.toUpperCase(),
  });

  return { success: true, points: dbKey.points };
}

// ============================================
// 使用记录
// ============================================

// 记录使用
export async function logUsage(options: {
  deviceId: string;
  userId?: string;
  action: 'free_overview' | 'paid_overview' | 'detailed';
  pointsCost?: number;
  birthInfo?: Record<string, unknown>;
  resultId?: string;
  curveMode?: 'life' | 'wealth';
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  await supabaseAdmin.from('usage_log').insert({
    user_id: options.userId || null,
    device_id: options.deviceId,
    action: options.action,
    points_cost: options.pointsCost || 0,
    birth_info: options.birthInfo || null,
    result_id: options.resultId || null,
    curve_mode: options.curveMode || 'life',
  });
}

// 扣除积分
export async function consumePoints(
  deviceId: string,
  points: number,
  description: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  const device = await getOrCreateDevice(deviceId);

  if (device.points < points) {
    return { success: false, error: '积分不足' };
  }

  const newBalance = device.points - points;

  await supabaseAdmin
    .from('device_usage')
    .update({
      points: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  // 记录积分变动
  await supabaseAdmin.from('points_log').insert({
    user_id: userId || null,
    device_id: deviceId,
    type: 'consume',
    points: -points,
    balance: newBalance,
    description,
  });

  return { success: true };
}

// 获取积分记录
export async function getPointsLog(
  deviceId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ logs: DbPointsLog[]; total: number }> {
  const supabaseAdmin = getSupabaseAdmin();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from('points_log')
    .select('*', { count: 'exact' })
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to get points log: ${error.message}`);
  }

  return {
    logs: (data as DbPointsLog[]) || [],
    total: count || 0,
  };
}

// 获取使用记录（管理员）
export async function getUsageLogs(options: {
  page?: number;
  pageSize?: number;
  action?: string;
}): Promise<{ logs: DbUsageLog[]; total: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { page = 1, pageSize = 50, action } = options;

  let query = supabaseAdmin.from('usage_log').select('*', { count: 'exact' });

  if (action) {
    query = query.eq('action', action);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to get usage logs: ${error.message}`);
  }

  return {
    logs: (data as DbUsageLog[]) || [],
    total: count || 0,
  };
}
