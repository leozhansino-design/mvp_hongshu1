import { supabase } from './supabase';

interface AntiAbuseConfig {
  maxRegistrationsPerIp: number;
  maxFreePerDevice: number;
}

// 获取防刷配置
async function getAntiAbuseConfig(): Promise<AntiAbuseConfig> {
  const { data: maxRegData } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'anti_abuse_max_registrations_per_ip')
    .single();

  const { data: maxFreeData } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'anti_abuse_max_free_per_device')
    .single();

  return {
    maxRegistrationsPerIp: parseInt(maxRegData?.value || '3', 10),
    maxFreePerDevice: parseInt(maxFreeData?.value || '1', 10),
  };
}

// 检查设备指纹是否可以注册
export async function checkDeviceCanRegister(fingerprint: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const config = await getAntiAbuseConfig();

  // 检查设备指纹是否已经注册过
  const { data: deviceData } = await supabase
    .from('device_fingerprints')
    .select('user_ids, is_blocked, block_reason')
    .eq('fingerprint', fingerprint)
    .single();

  if (deviceData) {
    // 设备被封禁
    if (deviceData.is_blocked) {
      return {
        allowed: false,
        reason: deviceData.block_reason || '设备已被限制',
      };
    }

    // 检查该设备关联的用户数量
    const userIds = deviceData.user_ids || [];
    if (userIds.length >= config.maxRegistrationsPerIp) {
      return {
        allowed: false,
        reason: '该设备已达到注册上限',
      };
    }
  }

  return { allowed: true };
}

// 检查IP是否可以注册
export async function checkIpCanRegister(ipAddress: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const config = await getAntiAbuseConfig();

  const { data: ipData } = await supabase
    .from('ip_tracking')
    .select('registration_count, is_blocked, block_reason')
    .eq('ip_address', ipAddress)
    .single();

  if (ipData) {
    // IP被封禁
    if (ipData.is_blocked) {
      return {
        allowed: false,
        reason: ipData.block_reason || 'IP已被限制',
      };
    }

    // 检查该IP的注册次数
    if (ipData.registration_count >= config.maxRegistrationsPerIp) {
      return {
        allowed: false,
        reason: '该网络已达到注册上限，请稍后再试',
      };
    }
  }

  return { allowed: true };
}

// 检查是否可以使用免费次数
export async function checkCanUseFree(
  fingerprint: string,
  userId?: string
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // 如果有用户ID，检查用户的免费使用次数
  if (userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('free_used, free_used_wealth')
      .eq('id', userId)
      .single();

    if (userData) {
      // 这里不做限制，用户的免费次数由前端控制显示
      // 但我们需要检查设备是否已经在其他账号使用过免费
    }
  }

  // 检查设备指纹是否已经使用过免费
  const { data: deviceData } = await supabase
    .from('device_fingerprints')
    .select('free_used, is_blocked, block_reason')
    .eq('fingerprint', fingerprint)
    .single();

  if (deviceData) {
    if (deviceData.is_blocked) {
      return {
        allowed: false,
        reason: deviceData.block_reason || '设备已被限制',
      };
    }

    // 如果设备已经使用过免费，但用户是新注册的，不允许
    if (deviceData.free_used && !userId) {
      return {
        allowed: false,
        reason: '该设备已使用过免费次数',
      };
    }
  }

  return { allowed: true };
}

// 记录设备指纹
export async function recordDeviceFingerprint(
  fingerprint: string,
  ipAddress: string,
  userId?: string,
  deviceInfo?: Record<string, unknown>
): Promise<void> {
  // 检查设备指纹是否已存在
  const { data: existingDevice } = await supabase
    .from('device_fingerprints')
    .select('id, ip_addresses, user_ids')
    .eq('fingerprint', fingerprint)
    .single();

  if (existingDevice) {
    // 更新现有记录
    const ipAddresses = existingDevice.ip_addresses || [];
    const userIds = existingDevice.user_ids || [];

    if (!ipAddresses.includes(ipAddress)) {
      ipAddresses.push(ipAddress);
    }

    if (userId && !userIds.includes(userId)) {
      userIds.push(userId);
    }

    await supabase
      .from('device_fingerprints')
      .update({
        ip_addresses: ipAddresses,
        user_ids: userIds,
        device_info: deviceInfo,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existingDevice.id);
  } else {
    // 创建新记录
    await supabase
      .from('device_fingerprints')
      .insert({
        fingerprint,
        device_info: deviceInfo,
        ip_addresses: [ipAddress],
        user_ids: userId ? [userId] : [],
      });
  }
}

// 记录IP地址
export async function recordIpAddress(
  ipAddress: string,
  fingerprint: string,
  userId?: string,
  isRegistration: boolean = false
): Promise<void> {
  const { data: existingIp } = await supabase
    .from('ip_tracking')
    .select('id, fingerprints, user_ids, registration_count')
    .eq('ip_address', ipAddress)
    .single();

  if (existingIp) {
    const fingerprints = existingIp.fingerprints || [];
    const userIds = existingIp.user_ids || [];

    if (!fingerprints.includes(fingerprint)) {
      fingerprints.push(fingerprint);
    }

    if (userId && !userIds.includes(userId)) {
      userIds.push(userId);
    }

    await supabase
      .from('ip_tracking')
      .update({
        fingerprints,
        user_ids: userIds,
        registration_count: isRegistration
          ? (existingIp.registration_count || 0) + 1
          : existingIp.registration_count,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existingIp.id);
  } else {
    await supabase
      .from('ip_tracking')
      .insert({
        ip_address: ipAddress,
        fingerprints: [fingerprint],
        user_ids: userId ? [userId] : [],
        registration_count: isRegistration ? 1 : 0,
      });
  }
}

// 标记设备已使用免费
export async function markDeviceFreeUsed(fingerprint: string): Promise<void> {
  await supabase
    .from('device_fingerprints')
    .update({ free_used: true })
    .eq('fingerprint', fingerprint);
}

// 检查设备是否已使用免费（供新用户注册时检查）
export async function hasDeviceUsedFree(fingerprint: string): Promise<boolean> {
  const { data } = await supabase
    .from('device_fingerprints')
    .select('free_used')
    .eq('fingerprint', fingerprint)
    .single();

  return data?.free_used || false;
}

// 综合检查注册资格
export async function checkRegistrationEligibility(
  fingerprint: string,
  ipAddress: string
): Promise<{
  allowed: boolean;
  reason?: string;
  hasUsedFree?: boolean;
}> {
  // 检查设备
  const deviceCheck = await checkDeviceCanRegister(fingerprint);
  if (!deviceCheck.allowed) {
    return deviceCheck;
  }

  // 检查IP
  const ipCheck = await checkIpCanRegister(ipAddress);
  if (!ipCheck.allowed) {
    return ipCheck;
  }

  // 检查设备是否已使用过免费次数
  const hasUsedFree = await hasDeviceUsedFree(fingerprint);

  return {
    allowed: true,
    hasUsedFree,
  };
}
