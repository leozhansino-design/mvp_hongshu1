import { STORAGE_KEYS, FREE_USAGE_LIMIT } from '@/lib/constants';
import { StoredResult } from '@/types';

export function getUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  const usage = localStorage.getItem(STORAGE_KEYS.usage);
  return usage ? parseInt(usage, 10) : 0;
}

export function incrementUsage(): number {
  if (typeof window === 'undefined') return 0;
  const current = getUsageCount();
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEYS.usage, newCount.toString());
  return newCount;
}

export function resetUsage(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.usage, '0');
}

export function getRemainingUsage(): number {
  return Math.max(0, FREE_USAGE_LIMIT - getUsageCount());
}

export function canUseFreeTrial(): boolean {
  return getUsageCount() < FREE_USAGE_LIMIT;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = localStorage.getItem(STORAGE_KEYS.device);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEYS.device, deviceId);
  }
  return deviceId;
}

export function saveResult(result: StoredResult): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_KEYS.resultPrefix}${result.id}`;
  localStorage.setItem(key, JSON.stringify(result));
}

export function getResult(id: string): StoredResult | null {
  if (typeof window === 'undefined') return null;
  const key = `${STORAGE_KEYS.resultPrefix}${id}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as StoredResult;
  } catch {
    return null;
  }
}

export function getAllResults(): StoredResult[] {
  if (typeof window === 'undefined') return [];

  const results: StoredResult[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.resultPrefix)) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          results.push(JSON.parse(data) as StoredResult);
        } catch {
          // skip invalid data
        }
      }
    }
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteResult(id: string): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_KEYS.resultPrefix}${id}`;
  localStorage.removeItem(key);
}

export function getTotalGeneratedCount(): number {
  const baseCount = 12345;
  const daysSinceStart = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
  return baseCount + daysSinceStart * 7 + getUsageCount();
}
