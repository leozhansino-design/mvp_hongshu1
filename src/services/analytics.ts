import { STORAGE_KEYS } from '@/lib/constants';
import { UserAnalytics, UserEventType, CurveMode, BirthInfo } from '@/types';
import { getDeviceId } from './storage';

// 创建或获取用户分析记录
export function getOrCreateAnalytics(
  reportId: string,
  birthInfo: BirthInfo,
  curveMode: CurveMode
): UserAnalytics {
  if (typeof window === 'undefined') {
    return createEmptyAnalytics(reportId, birthInfo, curveMode);
  }

  const key = `${STORAGE_KEYS.analyticsPrefix}${reportId}`;
  const existing = localStorage.getItem(key);

  if (existing) {
    try {
      return JSON.parse(existing) as UserAnalytics;
    } catch {
      // 如果解析失败，创建新的
    }
  }

  const analytics = createEmptyAnalytics(reportId, birthInfo, curveMode);
  saveAnalytics(analytics);
  return analytics;
}

// 创建空的分析记录
function createEmptyAnalytics(
  reportId: string,
  birthInfo: BirthInfo,
  curveMode: CurveMode
): UserAnalytics {
  return {
    id: reportId,
    deviceId: getDeviceId(),
    createdAt: Date.now(),
    name: birthInfo.name,
    gender: birthInfo.gender,
    birthYear: birthInfo.year,
    birthMonth: birthInfo.month,
    birthDay: birthInfo.day,
    province: birthInfo.province,
    city: birthInfo.city,
    curveMode,
    events: [],
    hasViewed: false,
    hasClickedShare: false,
    hasShared: false,
    hasClickedUnlock: false,
    hasUnlocked: false,
  };
}

// 保存分析记录
export function saveAnalytics(analytics: UserAnalytics): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_KEYS.analyticsPrefix}${analytics.id}`;
  localStorage.setItem(key, JSON.stringify(analytics));
}

// 追踪用户事件
export function trackEvent(
  reportId: string,
  eventType: UserEventType,
  metadata?: {
    curveMode?: CurveMode;
    isPaid?: boolean;
    fromMode?: CurveMode;
    toMode?: CurveMode;
  }
): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_KEYS.analyticsPrefix}${reportId}`;
  const existing = localStorage.getItem(key);

  if (!existing) return;

  try {
    const analytics = JSON.parse(existing) as UserAnalytics;

    // 添加事件
    analytics.events.push({
      type: eventType,
      timestamp: Date.now(),
      metadata,
    });

    // 更新汇总状态
    switch (eventType) {
      case 'view_report':
        analytics.hasViewed = true;
        break;
      case 'click_share':
        analytics.hasClickedShare = true;
        break;
      case 'share_success':
        analytics.hasShared = true;
        break;
      case 'click_unlock':
        analytics.hasClickedUnlock = true;
        // 记录解锁场景
        analytics.unlockContext = generateUnlockContext(analytics, metadata?.curveMode);
        break;
      case 'unlock_success':
        analytics.hasUnlocked = true;
        break;
    }

    saveAnalytics(analytics);
  } catch {
    // 忽略错误
  }
}

// 生成解锁场景描述
function generateUnlockContext(
  analytics: UserAnalytics,
  curveMode?: CurveMode
): string {
  const contexts: string[] = [];

  // 报告类型
  const modeLabel = curveMode === 'wealth' ? '财富曲线' : '人生曲线';
  contexts.push(`查看${modeLabel}`);

  // 是否分享过
  if (analytics.hasShared) {
    contexts.push('分享后解锁');
  } else if (analytics.hasClickedShare) {
    contexts.push('尝试分享后解锁');
  } else {
    contexts.push('直接解锁');
  }

  // 查看时长（通过事件数量估算）
  const viewEvents = analytics.events.filter(e => e.type === 'view_report');
  if (viewEvents.length > 1) {
    contexts.push(`多次查看(${viewEvents.length}次)`);
  }

  return contexts.join(' · ');
}

// 获取所有分析记录
export function getAllAnalytics(): UserAnalytics[] {
  if (typeof window === 'undefined') return [];

  const results: UserAnalytics[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.analyticsPrefix)) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          results.push(JSON.parse(data) as UserAnalytics);
        } catch {
          // skip invalid data
        }
      }
    }
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

// 获取统计摘要
export function getAnalyticsSummary(): {
  totalUsers: number;
  totalViews: number;
  shareClicks: number;
  shareSuccess: number;
  unlockClicks: number;
  unlockSuccess: number;
  lifeMode: number;
  wealthMode: number;
  conversionRate: number;
  shareRate: number;
} {
  const all = getAllAnalytics();

  const summary = {
    totalUsers: all.length,
    totalViews: all.filter(a => a.hasViewed).length,
    shareClicks: all.filter(a => a.hasClickedShare).length,
    shareSuccess: all.filter(a => a.hasShared).length,
    unlockClicks: all.filter(a => a.hasClickedUnlock).length,
    unlockSuccess: all.filter(a => a.hasUnlocked).length,
    lifeMode: all.filter(a => a.curveMode === 'life').length,
    wealthMode: all.filter(a => a.curveMode === 'wealth').length,
    conversionRate: 0,
    shareRate: 0,
  };

  // 计算转化率
  if (summary.totalViews > 0) {
    summary.conversionRate = Math.round((summary.unlockSuccess / summary.totalViews) * 100);
    summary.shareRate = Math.round((summary.shareSuccess / summary.totalViews) * 100);
  }

  return summary;
}

// 清除所有分析数据
export function clearAllAnalytics(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.analyticsPrefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
