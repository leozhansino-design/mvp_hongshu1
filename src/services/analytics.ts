import { STORAGE_KEYS } from '@/lib/constants';
import { UserAnalytics, UserEventType, CurveMode, BirthInfo } from '@/types';
import { getDeviceId } from './storage';

// ========== 页面访问追踪 ==========
const PAGE_VIEWS_KEY = 'lc_page_views';
const VISITOR_KEY = 'lc_visitor_data';

interface PageView {
  page: string;
  timestamp: number;
  deviceId: string;
  referrer?: string;
  curveMode?: CurveMode;
}

interface VisitorData {
  deviceId: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  visitDays: string[]; // 访问的日期列表 (YYYY-MM-DD)
}

// 追踪页面访问
export function trackPageView(page: string, curveMode?: CurveMode): void {
  if (typeof window === 'undefined') return;

  const deviceId = getDeviceId();
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  // 保存页面访问记录
  const pageViews = getPageViews();
  pageViews.push({
    page,
    timestamp: now,
    deviceId,
    referrer: document.referrer || undefined,
    curveMode,
  });
  // 只保留最近1000条
  if (pageViews.length > 1000) {
    pageViews.splice(0, pageViews.length - 1000);
  }
  localStorage.setItem(PAGE_VIEWS_KEY, JSON.stringify(pageViews));

  // 更新访客数据
  const visitors = getVisitors();
  const existingVisitor = visitors.find(v => v.deviceId === deviceId);

  if (existingVisitor) {
    existingVisitor.lastVisit = now;
    existingVisitor.visitCount++;
    if (!existingVisitor.visitDays.includes(today)) {
      existingVisitor.visitDays.push(today);
    }
  } else {
    visitors.push({
      deviceId,
      firstVisit: now,
      lastVisit: now,
      visitCount: 1,
      visitDays: [today],
    });
  }
  localStorage.setItem(VISITOR_KEY, JSON.stringify(visitors));
}

// 获取页面访问记录
export function getPageViews(): PageView[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PAGE_VIEWS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 获取访客数据
export function getVisitors(): VisitorData[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(VISITOR_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ========== 按钮点击追踪 ==========
const CLICKS_KEY = 'lc_button_clicks';

interface ButtonClick {
  button: string; // 按钮标识
  page: string;   // 页面
  timestamp: number;
  deviceId: string;
  metadata?: Record<string, unknown>;
}

// 追踪按钮点击
export function trackButtonClick(
  button: string,
  page: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  const clicks = getButtonClicks();
  clicks.push({
    button,
    page,
    timestamp: Date.now(),
    deviceId: getDeviceId(),
    metadata,
  });
  // 只保留最近1000条
  if (clicks.length > 1000) {
    clicks.splice(0, clicks.length - 1000);
  }
  localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks));
}

// 获取按钮点击记录
export function getButtonClicks(): ButtonClick[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CLICKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ========== 综合统计 ==========

export interface AdvancedMetrics {
  // 页面访问
  totalPageViews: number;
  uniqueVisitors: number;
  homePageViews: number;
  resultPageViews: number;

  // 点击率 (CTR)
  formSubmitClicks: number;       // 表单提交点击
  formSubmitCTR: number;          // 表单提交点击率
  shareButtonClicks: number;      // 分享按钮点击
  shareButtonCTR: number;         // 分享按钮点击率
  unlockButtonClicks: number;     // 解锁按钮点击
  unlockButtonCTR: number;        // 解锁按钮点击率

  // 留存率
  day1Retention: number;          // 次日留存
  day7Retention: number;          // 7日留存
  day30Retention: number;         // 30日留存
  returningVisitors: number;      // 回访用户数
  returningRate: number;          // 回访率

  // 付费率
  paymentRate: number;            // 付费转化率 (查看->付费)
  unlockClickRate: number;        // 解锁点击率 (查看->点击解锁)
  unlockCompleteRate: number;     // 解锁完成率 (点击解锁->完成)

  // 按模式统计
  lifeModePaymentRate: number;
  wealthModePaymentRate: number;
}

export function getAdvancedMetrics(filterDays: number = 365): AdvancedMetrics {
  const now = Date.now();
  const cutoff = now - filterDays * 24 * 60 * 60 * 1000;

  // 获取数据
  const pageViews = getPageViews().filter(p => p.timestamp >= cutoff);
  const visitors = getVisitors();
  const clicks = getButtonClicks().filter(c => c.timestamp >= cutoff);
  const analytics = getAllAnalytics().filter(a => a.createdAt >= cutoff);

  // 基础统计
  const totalPageViews = pageViews.length;
  const uniqueDevices = new Set(pageViews.map(p => p.deviceId));
  const uniqueVisitors = uniqueDevices.size;
  const homePageViews = pageViews.filter(p => p.page === 'home').length;
  const resultPageViews = pageViews.filter(p => p.page === 'result').length;

  // 点击统计
  const formSubmitClicks = clicks.filter(c => c.button === 'form_submit').length;
  const shareButtonClicks = clicks.filter(c => c.button === 'share').length;
  const unlockButtonClicks = clicks.filter(c => c.button === 'unlock').length;

  // 点击率计算
  const formSubmitCTR = homePageViews > 0 ? Math.round((formSubmitClicks / homePageViews) * 100) : 0;
  const shareButtonCTR = resultPageViews > 0 ? Math.round((shareButtonClicks / resultPageViews) * 100) : 0;
  const unlockButtonCTR = resultPageViews > 0 ? Math.round((unlockButtonClicks / resultPageViews) * 100) : 0;

  // 留存率计算
  let day1Retained = 0;
  let day7Retained = 0;
  let day30Retained = 0;
  let totalForRetention = 0;

  visitors.forEach(v => {
    const firstVisitDate = new Date(v.firstVisit);
    const daysSinceFirst = Math.floor((now - v.firstVisit) / (24 * 60 * 60 * 1000));

    if (daysSinceFirst >= 1) {
      totalForRetention++;
      // 检查是否在首次访问后的第2天回访
      const day1Date = new Date(firstVisitDate);
      day1Date.setDate(day1Date.getDate() + 1);
      const day1Str = day1Date.toISOString().split('T')[0];
      if (v.visitDays.includes(day1Str)) {
        day1Retained++;
      }
    }

    if (daysSinceFirst >= 7) {
      // 检查7天内是否有回访
      const hasDay7Visit = v.visitDays.some(d => {
        const visitDate = new Date(d);
        const firstDate = new Date(v.firstVisit);
        const diff = Math.floor((visitDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
        return diff >= 1 && diff <= 7;
      });
      if (hasDay7Visit) day7Retained++;
    }

    if (daysSinceFirst >= 30) {
      // 检查30天内是否有回访
      const hasDay30Visit = v.visitDays.some(d => {
        const visitDate = new Date(d);
        const firstDate = new Date(v.firstVisit);
        const diff = Math.floor((visitDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
        return diff >= 1 && diff <= 30;
      });
      if (hasDay30Visit) day30Retained++;
    }
  });

  const returningVisitors = visitors.filter(v => v.visitCount > 1).length;
  const returningRate = visitors.length > 0 ? Math.round((returningVisitors / visitors.length) * 100) : 0;

  const day1Retention = totalForRetention > 0 ? Math.round((day1Retained / totalForRetention) * 100) : 0;
  const day7Retention = visitors.filter(v => Math.floor((now - v.firstVisit) / (24 * 60 * 60 * 1000)) >= 7).length > 0
    ? Math.round((day7Retained / visitors.filter(v => Math.floor((now - v.firstVisit) / (24 * 60 * 60 * 1000)) >= 7).length) * 100)
    : 0;
  const day30Retention = visitors.filter(v => Math.floor((now - v.firstVisit) / (24 * 60 * 60 * 1000)) >= 30).length > 0
    ? Math.round((day30Retained / visitors.filter(v => Math.floor((now - v.firstVisit) / (24 * 60 * 60 * 1000)) >= 30).length) * 100)
    : 0;

  // 付费率计算
  const totalViewed = analytics.filter(a => a.hasViewed).length;
  const totalUnlockClicked = analytics.filter(a => a.hasClickedUnlock).length;
  const totalUnlocked = analytics.filter(a => a.hasUnlocked).length;

  const paymentRate = totalViewed > 0 ? Math.round((totalUnlocked / totalViewed) * 100) : 0;
  const unlockClickRate = totalViewed > 0 ? Math.round((totalUnlockClicked / totalViewed) * 100) : 0;
  const unlockCompleteRate = totalUnlockClicked > 0 ? Math.round((totalUnlocked / totalUnlockClicked) * 100) : 0;

  // 按模式统计付费率
  const lifeAnalytics = analytics.filter(a => a.curveMode === 'life');
  const wealthAnalytics = analytics.filter(a => a.curveMode === 'wealth');

  const lifeViewed = lifeAnalytics.filter(a => a.hasViewed).length;
  const lifeUnlocked = lifeAnalytics.filter(a => a.hasUnlocked).length;
  const lifeModePaymentRate = lifeViewed > 0 ? Math.round((lifeUnlocked / lifeViewed) * 100) : 0;

  const wealthViewed = wealthAnalytics.filter(a => a.hasViewed).length;
  const wealthUnlocked = wealthAnalytics.filter(a => a.hasUnlocked).length;
  const wealthModePaymentRate = wealthViewed > 0 ? Math.round((wealthUnlocked / wealthViewed) * 100) : 0;

  return {
    totalPageViews,
    uniqueVisitors,
    homePageViews,
    resultPageViews,
    formSubmitClicks,
    formSubmitCTR,
    shareButtonClicks,
    shareButtonCTR,
    unlockButtonClicks,
    unlockButtonCTR,
    day1Retention,
    day7Retention,
    day30Retention,
    returningVisitors,
    returningRate,
    paymentRate,
    unlockClickRate,
    unlockCompleteRate,
    lifeModePaymentRate,
    wealthModePaymentRate,
  };
}

// ========== 原有功能 ==========

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
    if (key && (
      key.startsWith(STORAGE_KEYS.analyticsPrefix) ||
      key === PAGE_VIEWS_KEY ||
      key === VISITOR_KEY ||
      key === CLICKS_KEY
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
