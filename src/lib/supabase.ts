import { createClient } from '@supabase/supabase-js';

// Re-export generateCacheKey from cache-utils for backward compatibility
export { generateCacheKey } from './cache-utils';

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

// ============================================
// 订单相关操作
// ============================================

export interface DbOrder {
  id: string;
  device_id: string;
  amount: number;       // 金额（分）
  points: number;       // 积分数量
  pay_method: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  trade_no: string | null;
  refund_no: string | null;
  refund_amount: number | null;
  refund_time: string | null;
  created_at: string;
  paid_at: string | null;
  expire_at: string | null;
}

export interface DbRechargeOption {
  id: number;
  price: number;        // 价格（分）
  points: number;       // 积分数量
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 创建订单
export async function createOrder(params: {
  id: string;
  deviceId: string;
  amount: number;
  points: number;
  payMethod: string;
}): Promise<DbOrder> {
  const supabaseAdmin = getSupabaseAdmin();

  // 设置订单过期时间为30分钟后
  const expireAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert({
      id: params.id,
      device_id: params.deviceId,
      amount: params.amount,
      points: params.points,
      pay_method: params.payMethod,
      status: 'pending',
      expire_at: expireAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`创建订单失败: ${error.message}`);
  }

  return data as DbOrder;
}

// 根据ID获取订单
export async function getOrder(orderId: string): Promise<DbOrder | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    // 未找到记录不算错误，返回null
    return null;
  }

  return data as DbOrder;
}

// 更新订单为已支付（仅当状态为 pending 时才允许更新，防止重复支付）
export async function updateOrderPaid(
  orderId: string,
  tradeNo: string
): Promise<DbOrder> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      trade_no: tradeNo,
    })
    .eq('id', orderId)
    .eq('status', 'pending')  // 仅 pending 状态可更新为 paid
    .select()
    .single();

  if (error) {
    throw new Error(`更新订单支付状态失败: ${error.message}`);
  }

  return data as DbOrder;
}

// 更新订单为已退款（仅当状态为 paid 时才允许退款）
export async function updateOrderRefunded(
  orderId: string,
  refundNo: string,
  refundAmount: number
): Promise<DbOrder> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'refunded',
      refund_no: refundNo,
      refund_amount: refundAmount,
      refund_time: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'paid')  // 仅 paid 状态可退款
    .select()
    .single();

  if (error) {
    throw new Error(`更新订单退款状态失败: ${error.message}`);
  }

  return data as DbOrder;
}

// 获取订单列表（分页，支持按状态和设备筛选）
export async function getOrders(options: {
  status?: string;
  page?: number;
  pageSize?: number;
  deviceId?: string;
}): Promise<{ orders: DbOrder[]; total: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { status, page = 1, pageSize = 50, deviceId } = options;

  let query = supabaseAdmin.from('orders').select('*', { count: 'exact' });

  // 按状态筛选
  if (status) {
    query = query.eq('status', status);
  }

  // 按设备筛选
  if (deviceId) {
    query = query.eq('device_id', deviceId);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`获取订单列表失败: ${error.message}`);
  }

  return {
    orders: (data as DbOrder[]) || [],
    total: count || 0,
  };
}

// 获取订单统计数据
export async function getOrderStats(): Promise<{
  todayRevenue: number;
  todayOrders: number;
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  totalRefunded: number;
  totalUsers: number;
}> {
  const supabaseAdmin = getSupabaseAdmin();

  // 获取今天的起始时间（UTC）
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  // 查询所有已支付的订单
  const { data: allPaidOrders, error: allError } = await supabaseAdmin
    .from('orders')
    .select('amount, device_id, paid_at')
    .eq('status', 'paid');

  if (allError) {
    throw new Error(`获取订单统计失败: ${allError.message}`);
  }

  const orders = (allPaidOrders || []) as Array<{
    amount: number;
    device_id: string;
    paid_at: string | null;
  }>;

  // 查询所有已退款的订单
  const { data: refundedOrders } = await supabaseAdmin
    .from('orders')
    .select('refund_amount')
    .eq('status', 'refunded');

  const totalRefunded = (refundedOrders || []).reduce(
    (sum, o: { refund_amount: number | null }) => sum + (o.refund_amount || 0),
    0
  );

  // 查询总订单数（所有状态）
  const { count: allOrderCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // 计算今日订单和收入
  const todayOrders = orders.filter(
    (o) => o.paid_at && o.paid_at >= todayStartISO
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.amount, 0);

  // 计算总收入和已支付订单数
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const paidOrders = orders.length;

  // 计算独立用户数（按设备去重）
  const uniqueDevices = new Set(orders.map((o) => o.device_id));
  const totalUsers = uniqueDevices.size;

  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    totalRevenue,
    totalOrders: allOrderCount || 0,
    paidOrders,
    totalRefunded,
    totalUsers,
  };
}

// 获取充值选项（按排序字段排序）
// activeOnly: true 只返回启用的（用于前端用户），false 返回全部（用于管理后台）
export async function getRechargeOptions(activeOnly = true): Promise<DbRechargeOption[]> {
  const supabaseAdmin = getSupabaseAdmin();

  let query = supabaseAdmin
    .from('recharge_options')
    .select('*');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`获取充值选项失败: ${error.message}`);
  }

  return (data as DbRechargeOption[]) || [];
}

// 更新充值选项（删除旧选项并插入新选项）
export async function updateRechargeOptions(
  options: Array<{ price: number; points: number; sort_order?: number; is_active?: boolean }>
): Promise<DbRechargeOption[]> {
  const supabaseAdmin = getSupabaseAdmin();

  // 删除所有现有选项
  const { error: deleteError } = await supabaseAdmin
    .from('recharge_options')
    .delete()
    .gte('id', 0);  // 删除所有记录

  if (deleteError) {
    throw new Error(`删除旧充值选项失败: ${deleteError.message}`);
  }

  // 插入新选项
  const newOptions = options.map((opt, index) => ({
    price: opt.price,
    points: opt.points,
    sort_order: opt.sort_order ?? (index + 1),
    is_active: opt.is_active ?? true,
  }));

  const { data, error: insertError } = await supabaseAdmin
    .from('recharge_options')
    .insert(newOptions)
    .select();

  if (insertError) {
    throw new Error(`插入新充值选项失败: ${insertError.message}`);
  }

  return (data as DbRechargeOption[]) || [];
}

// 支付成功后增加积分（更新设备积分、累计充值金额，并记录积分日志）
export async function addPointsFromOrder(
  deviceId: string,
  points: number,
  orderId: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // 获取或创建设备记录
  const device = await getOrCreateDevice(deviceId);
  const newBalance = device.points + points;

  // 获取订单信息以获取金额
  const order = await getOrder(orderId);
  const orderAmount = order?.amount || 0;

  // 更新设备积分和累计充值金额
  const { error: updateError } = await supabaseAdmin
    .from('device_usage')
    .update({
      points: newBalance,
      total_paid: (device as unknown as Record<string, number>).total_paid
        ? (device as unknown as Record<string, number>).total_paid + orderAmount
        : orderAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  if (updateError) {
    throw new Error(`增加积分失败: ${updateError.message}`);
  }

  // 记录积分变动日志
  const { error: logError } = await supabaseAdmin
    .from('points_log')
    .insert({
      device_id: deviceId,
      type: 'recharge',
      points: points,
      balance: newBalance,
      description: `订单充值 (${orderId})`,
    });

  if (logError) {
    throw new Error(`记录积分日志失败: ${logError.message}`);
  }
}

// 退款后扣除积分（积分最小为0，并记录积分日志）
export async function refundPointsFromOrder(
  deviceId: string,
  points: number,
  orderId: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // 获取设备记录
  const device = await getOrCreateDevice(deviceId);

  // 扣除积分，最小为0
  const newBalance = Math.max(0, device.points - points);

  // 更新设备积分
  const { error: updateError } = await supabaseAdmin
    .from('device_usage')
    .update({
      points: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId);

  if (updateError) {
    throw new Error(`扣除积分失败: ${updateError.message}`);
  }

  // 记录积分变动日志
  const { error: logError } = await supabaseAdmin
    .from('points_log')
    .insert({
      device_id: deviceId,
      type: 'consume',
      points: -points,
      balance: newBalance,
      description: `订单退款 (${orderId})`,
    });

  if (logError) {
    throw new Error(`记录退款积分日志失败: ${logError.message}`);
  }
}

// ============================================
// 结果缓存相关操作
// ============================================

export interface DbResultCache {
  id: number;
  cache_key: string;
  device_id: string;
  curve_mode: 'life' | 'wealth';
  is_paid: boolean;
  result_data: unknown;
  birth_info: unknown;
  created_at: string;
}

/**
 * 获取缓存的结果
 */
export async function getCachedResult(cacheKey: string): Promise<DbResultCache | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('result_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DbResultCache;
}

/**
 * 保存结果到缓存
 */
export async function saveCachedResult(params: {
  cacheKey: string;
  deviceId: string;
  curveMode: 'life' | 'wealth';
  isPaid: boolean;
  resultData: unknown;
  birthInfo?: unknown;
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from('result_cache')
    .upsert({
      cache_key: params.cacheKey,
      device_id: params.deviceId,
      curve_mode: params.curveMode,
      is_paid: params.isPaid,
      result_data: params.resultData,
      birth_info: params.birthInfo || null,
    }, {
      onConflict: 'cache_key',
    });

  if (error) {
    console.error('保存缓存结果失败:', error);
    // 不抛出错误，缓存失败不应影响正常流程
  }
}

// ============================================
// 大师相关操作
// ============================================

import { MasterDB, ConsultationDB, ConsultationStatus } from '@/types/master';

// 获取大师列表（按价格自动排序）
export async function getMasters(includeInactive = false): Promise<MasterDB[]> {
  const supabaseAdmin = getSupabaseAdmin();

  let query = supabaseAdmin
    .from('masters')
    .select('*')
    .order('price', { ascending: true }); // 按价格从低到高排序

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`获取大师列表失败: ${error.message}`);
  }

  return (data as MasterDB[]) || [];
}

// 获取单个大师
export async function getMaster(masterId: string): Promise<MasterDB | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('masters')
    .select('*')
    .eq('id', masterId)
    .single();

  if (error) {
    return null;
  }

  return data as MasterDB;
}

// 创建大师
export async function createMaster(master: Omit<MasterDB, 'created_at' | 'updated_at'>): Promise<MasterDB> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('masters')
    .insert(master)
    .select()
    .single();

  if (error) {
    throw new Error(`创建大师失败: ${error.message}`);
  }

  return data as MasterDB;
}

// 更新大师
export async function updateMaster(
  masterId: string,
  updates: Partial<Omit<MasterDB, 'id' | 'created_at' | 'updated_at'>>
): Promise<MasterDB> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('masters')
    .update(updates)
    .eq('id', masterId)
    .select()
    .single();

  if (error) {
    throw new Error(`更新大师失败: ${error.message}`);
  }

  return data as MasterDB;
}

// 删除大师
export async function deleteMaster(masterId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from('masters')
    .delete()
    .eq('id', masterId);

  if (error) {
    throw new Error(`删除大师失败: ${error.message}`);
  }
}

// 切换大师上架状态
export async function toggleMasterActive(masterId: string, isActive: boolean): Promise<MasterDB> {
  return updateMaster(masterId, { is_active: isActive });
}

// ============================================
// 咨询订单相关操作
// ============================================

// 创建咨询订单
export async function createConsultation(consultation: Omit<ConsultationDB, 'created_at' | 'paid_at' | 'completed_at' | 'refunded_at'>): Promise<ConsultationDB> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('consultations')
    .insert(consultation)
    .select()
    .single();

  if (error) {
    throw new Error(`创建咨询订单失败: ${error.message}`);
  }

  return data as ConsultationDB;
}

// 获取咨询订单
export async function getConsultation(consultationId: string): Promise<ConsultationDB | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('consultations')
    .select('*')
    .eq('id', consultationId)
    .single();

  if (error) {
    return null;
  }

  return data as ConsultationDB;
}

// 获取咨询订单列表
export async function getConsultations(options: {
  status?: ConsultationStatus;
  masterId?: string;
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ consultations: ConsultationDB[]; total: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { status, masterId, userId, search, page = 1, pageSize = 50 } = options;

  let query = supabaseAdmin.from('consultations').select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (masterId) {
    query = query.eq('master_id', masterId);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (search) {
    query = query.or(`id.ilike.%${search}%,user_phone.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`获取咨询订单列表失败: ${error.message}`);
  }

  return {
    consultations: (data as ConsultationDB[]) || [],
    total: count || 0,
  };
}

// 更新咨询订单为已支付
export async function updateConsultationPaid(
  consultationId: string,
  tradeNo: string
): Promise<ConsultationDB> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('consultations')
    .update({
      status: 'pending',
      paid_at: new Date().toISOString(),
      trade_no: tradeNo,
    })
    .eq('id', consultationId)
    .select()
    .single();

  if (error) {
    throw new Error(`更新咨询订单支付状态失败: ${error.message}`);
  }

  return data as ConsultationDB;
}

// 标记咨询订单为已完成
export async function markConsultationCompleted(consultationId: string): Promise<ConsultationDB> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('consultations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', consultationId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(`标记咨询订单完成失败: ${error.message}`);
  }

  return data as ConsultationDB;
}

// 咨询订单退款
export async function refundConsultation(consultationId: string): Promise<ConsultationDB> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('consultations')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', consultationId)
    .in('status', ['pending'])
    .select()
    .single();

  if (error) {
    throw new Error(`咨询订单退款失败: ${error.message}`);
  }

  return data as ConsultationDB;
}

// 获取咨询订单统计
export async function getConsultationStats(): Promise<{
  pendingCount: number;
  completedCount: number;
  refundedCount: number;
  totalRevenue: number;
  todayOrders: number;
}> {
  const supabaseAdmin = getSupabaseAdmin();

  // 获取今天的起始时间
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  // 获取所有订单
  const { data: allConsultations, error } = await supabaseAdmin
    .from('consultations')
    .select('status, price, created_at');

  if (error) {
    throw new Error(`获取咨询统计失败: ${error.message}`);
  }

  const consultations = (allConsultations || []) as Array<{
    status: string;
    price: number;
    created_at: string;
  }>;

  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  const completedCount = consultations.filter(c => c.status === 'completed').length;
  const refundedCount = consultations.filter(c => c.status === 'refunded').length;
  const totalRevenue = consultations
    .filter(c => c.status !== 'refunded')
    .reduce((sum, c) => sum + c.price, 0);
  const todayOrders = consultations.filter(c => c.created_at >= todayStartISO).length;

  return {
    pendingCount,
    completedCount,
    refundedCount,
    totalRevenue,
    todayOrders,
  };
}

// ============================================
// 全站统计相关操作
// ============================================

// 获取统计值
export async function getStat(statKey: string): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('site_stats')
    .select('stat_value')
    .eq('stat_key', statKey)
    .single();

  if (error) {
    // 如果表不存在或记录不存在，返回默认值
    console.error(`获取统计 ${statKey} 失败:`, error.message);
    return 0;
  }

  return data?.stat_value || 0;
}

// 增加统计值（使用数据库原子操作防止并发问题）
export async function incrementStat(statKey: string, increment: number = 1): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin();

  // 使用 RPC 调用原子增加函数
  const { data, error } = await supabaseAdmin.rpc('increment_stat', {
    p_stat_key: statKey,
    p_increment: increment,
  });

  if (error) {
    console.error(`增加统计 ${statKey} 失败:`, error.message);
    // 如果 RPC 失败，尝试直接更新
    const current = await getStat(statKey);
    return current;
  }

  return data || 0;
}

// 获取总生成次数
export async function getTotalGenerated(): Promise<number> {
  return await getStat('total_generated');
}

// 增加总生成次数
export async function incrementTotalGenerated(): Promise<number> {
  return await incrementStat('total_generated', 1);
}

// ============================================
// 系统配置相关函数
// ============================================

// 缓存系统配置（避免每次请求都查数据库）
const systemConfigCache: Record<string, { value: unknown; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1分钟缓存

// 获取系统配置值
export async function getSystemConfig<T = string>(key: string, defaultValue: T): Promise<T> {
  // 检查缓存
  const cached = systemConfigCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value as T;
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      console.warn(`System config "${key}" not found, using default:`, defaultValue);
      return defaultValue;
    }

    // 解析 JSONB 值
    let parsedValue: T;
    if (typeof data.value === 'string') {
      try {
        parsedValue = JSON.parse(data.value);
      } catch {
        parsedValue = data.value as T;
      }
    } else {
      parsedValue = data.value as T;
    }

    // 更新缓存
    systemConfigCache[key] = { value: parsedValue, timestamp: Date.now() };

    return parsedValue;
  } catch (error) {
    console.error(`Failed to get system config "${key}":`, error);
    return defaultValue;
  }
}

// 获取精批详解积分价格
export async function getDetailedPoints(): Promise<number> {
  const value = await getSystemConfig<string | number>('detailed_points', 200);
  return typeof value === 'string' ? parseInt(value, 10) : value;
}

// 获取概览积分价格
export async function getOverviewPoints(): Promise<number> {
  const value = await getSystemConfig<string | number>('overview_points', 10);
  return typeof value === 'string' ? parseInt(value, 10) : value;
}
