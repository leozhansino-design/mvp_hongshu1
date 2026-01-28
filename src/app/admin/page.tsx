'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllAnalytics, getAnalyticsSummary, clearAllAnalytics, getAdvancedMetrics, AdvancedMetrics } from '@/services/analytics';
import { UserAnalytics, CurveMode } from '@/types';
import DeviceManagement from '@/components/admin/DeviceManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import PaymentStats from '@/components/admin/PaymentStats';
import RechargeSettings from '@/components/admin/RechargeSettings';

// 登录凭证
const ADMIN_USERNAME = 'leozhansino';
const ADMIN_PASSWORD = 'Dianzi123';
const AUTH_KEY = 'lc_admin_auth';

// Tab类型
type TabType = 'overview' | 'users' | 'funnel' | 'demographics' | 'timeline' | 'devices' | 'orders' | 'pay_stats' | 'pay_settings';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getAnalyticsSummary> | null>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // 筛选状态
  const [filterMode, setFilterMode] = useState<'all' | CurveMode>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'shared' | 'none'>('all');
  const [filterDays, setFilterDays] = useState<number>(7);

  // 检查是否已登录（验证服务端session）
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem(AUTH_KEY);
      if (auth === 'true') {
        // 验证服务端 session 是否仍然有效
        try {
          const res = await fetch('/api/admin/verify');
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            // 服务端 session 已失效，清除本地状态
            localStorage.removeItem(AUTH_KEY);
            setIsAuthenticated(false);
          }
        } catch {
          // 网络错误时也清除，要求重新登录
          localStorage.removeItem(AUTH_KEY);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // 加载数据
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    const data = getAllAnalytics();
    setAnalytics(data);
    setSummary(getAnalyticsSummary());
    setAdvancedMetrics(getAdvancedMetrics(filterDays));
  };

  // 当筛选天数变化时重新加载高级指标
  useEffect(() => {
    if (isAuthenticated) {
      setAdvancedMetrics(getAdvancedMetrics(filterDays));
    }
  }, [filterDays, isAuthenticated]);

  // 筛选后的数据
  const filteredAnalytics = useMemo(() => {
    const now = Date.now();
    const cutoff = now - filterDays * 24 * 60 * 60 * 1000;

    return analytics.filter(user => {
      // 时间筛选
      if (user.createdAt < cutoff) return false;

      // 模式筛选
      if (filterMode !== 'all' && user.curveMode !== filterMode) return false;

      // 状态筛选
      if (filterStatus === 'unlocked' && !user.hasUnlocked) return false;
      if (filterStatus === 'shared' && !user.hasShared) return false;
      if (filterStatus === 'none' && (user.hasUnlocked || user.hasShared)) return false;

      return true;
    });
  }, [analytics, filterMode, filterStatus, filterDays]);

  // 计算高级统计
  const advancedStats = useMemo(() => {
    if (filteredAnalytics.length === 0) {
      return {
        // 转化漏斗
        funnel: { views: 0, shareClicks: 0, shares: 0, unlockClicks: 0, unlocks: 0 },
        funnelRates: { viewToShareClick: 0, shareClickToShare: 0, viewToUnlockClick: 0, unlockClickToUnlock: 0, viewToUnlock: 0 },
        // 人口统计
        genderDist: { male: 0, female: 0 },
        ageDist: { '90后': 0, '80后': 0, '70后': 0, '00后': 0, '其他': 0 },
        modeDist: { life: 0, wealth: 0 },
        // 行为洞察
        shareToUnlockCorr: 0,
        avgTimeToUnlock: 0,
        // 时间分析
        hourlyDist: Array(24).fill(0),
        dailyTrend: [] as { date: string; count: number; unlocks: number }[],
      };
    }

    const currentYear = new Date().getFullYear();

    // 转化漏斗
    const views = filteredAnalytics.filter(u => u.hasViewed).length;
    const shareClicks = filteredAnalytics.filter(u => u.hasClickedShare).length;
    const shares = filteredAnalytics.filter(u => u.hasShared).length;
    const unlockClicks = filteredAnalytics.filter(u => u.hasClickedUnlock).length;
    const unlocks = filteredAnalytics.filter(u => u.hasUnlocked).length;

    // 性别分布
    const genderDist = {
      male: filteredAnalytics.filter(u => u.gender === 'male').length,
      female: filteredAnalytics.filter(u => u.gender === 'female').length,
    };

    // 年龄段分布
    const ageDist = { '00后': 0, '90后': 0, '80后': 0, '70后': 0, '其他': 0 };
    filteredAnalytics.forEach(u => {
      const birthYear = u.birthYear;
      if (birthYear >= 2000) ageDist['00后']++;
      else if (birthYear >= 1990) ageDist['90后']++;
      else if (birthYear >= 1980) ageDist['80后']++;
      else if (birthYear >= 1970) ageDist['70后']++;
      else ageDist['其他']++;
    });

    // 模式分布
    const modeDist = {
      life: filteredAnalytics.filter(u => u.curveMode === 'life').length,
      wealth: filteredAnalytics.filter(u => u.curveMode === 'wealth').length,
    };

    // 分享与解锁关联性 - 分享过的用户解锁率
    const sharedUsers = filteredAnalytics.filter(u => u.hasShared);
    const sharedAndUnlocked = sharedUsers.filter(u => u.hasUnlocked).length;
    const shareToUnlockCorr = sharedUsers.length > 0
      ? Math.round((sharedAndUnlocked / sharedUsers.length) * 100)
      : 0;

    // 平均解锁时间（从查看到解锁）
    let totalUnlockTime = 0;
    let unlockTimeCount = 0;
    filteredAnalytics.forEach(u => {
      if (u.hasUnlocked) {
        const viewEvent = u.events.find(e => e.type === 'view_report');
        const unlockEvent = u.events.find(e => e.type === 'unlock_success');
        if (viewEvent && unlockEvent) {
          totalUnlockTime += unlockEvent.timestamp - viewEvent.timestamp;
          unlockTimeCount++;
        }
      }
    });
    const avgTimeToUnlock = unlockTimeCount > 0
      ? Math.round(totalUnlockTime / unlockTimeCount / 1000)
      : 0;

    // 小时分布
    const hourlyDist = Array(24).fill(0);
    filteredAnalytics.forEach(u => {
      const hour = new Date(u.createdAt).getHours();
      hourlyDist[hour]++;
    });

    // 每日趋势
    const dailyMap = new Map<string, { count: number; unlocks: number }>();
    filteredAnalytics.forEach(u => {
      const date = new Date(u.createdAt).toLocaleDateString('zh-CN');
      const existing = dailyMap.get(date) || { count: 0, unlocks: 0 };
      existing.count++;
      if (u.hasUnlocked) existing.unlocks++;
      dailyMap.set(date, existing);
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      funnel: { views, shareClicks, shares, unlockClicks, unlocks },
      funnelRates: {
        viewToShareClick: views > 0 ? Math.round((shareClicks / views) * 100) : 0,
        shareClickToShare: shareClicks > 0 ? Math.round((shares / shareClicks) * 100) : 0,
        viewToUnlockClick: views > 0 ? Math.round((unlockClicks / views) * 100) : 0,
        unlockClickToUnlock: unlockClicks > 0 ? Math.round((unlocks / unlockClicks) * 100) : 0,
        viewToUnlock: views > 0 ? Math.round((unlocks / views) * 100) : 0,
      },
      genderDist,
      ageDist,
      modeDist,
      shareToUnlockCorr,
      avgTimeToUnlock,
      hourlyDist,
      dailyTrend,
    };
  }, [filteredAnalytics]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME) {
      // 调用服务端 API 验证密码并设置 session cookie
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_KEY, 'true');
          setLoginError('');
        } else {
          setLoginError(data.error || '登录失败');
        }
      } catch {
        setLoginError('网络错误，请重试');
      }
    } else {
      setLoginError('账号或密码错误');
    }
  };

  const handleLogout = async () => {
    // 同时调用 API 清除服务端 cookie
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // 忽略错误
    }
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有分析数据吗？此操作不可恢复！')) {
      clearAllAnalytics();
      loadData();
    }
  };

  const handleExportCSV = () => {
    const headers = ['时间', '姓名', '性别', '出生日期', '省份', '城市', '类型', '已分享', '已解锁', '解锁场景'];
    const rows = filteredAnalytics.map(u => [
      new Date(u.createdAt).toLocaleString('zh-CN'),
      u.name || '',
      u.gender === 'male' ? '男' : '女',
      `${u.birthYear}/${u.birthMonth}/${u.birthDay}`,
      u.province || '',
      u.city || '',
      u.curveMode === 'wealth' ? '财富曲线' : '人生曲线',
      u.hasShared ? '是' : '否',
      u.hasUnlocked ? '是' : '否',
      u.unlockContext || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `用户数据_${new Date().toLocaleDateString('zh-CN')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  // 登录页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white text-center mb-6">管理后台</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">账号</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="请输入账号"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="请输入密码"
                />
              </div>
              {loginError && (
                <p className="text-red-400 text-sm text-center">{loginError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                登录
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 管理页面
  return (
    <div className="min-h-screen bg-gray-900">
      {/* 顶部栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">用户数据分析</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              刷新
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              导出CSV
            </button>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              清除数据
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </div>

      {/* Tab导航 */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: '概览' },
              { id: 'funnel', label: '转化漏斗' },
              { id: 'demographics', label: '用户画像' },
              { id: 'timeline', label: '时间分析' },
              { id: 'users', label: '用户列表' },
              { id: 'devices', label: '设备管理' },
              { id: 'orders', label: '订单管理' },
              { id: 'pay_stats', label: '收入统计' },
              { id: 'pay_settings', label: '充值设置' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-gray-850 border-b border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">时间:</span>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value={1}>今天</option>
              <option value={7}>近7天</option>
              <option value={30}>近30天</option>
              <option value={90}>近90天</option>
              <option value={365}>全部</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">类型:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | CurveMode)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="all">全部</option>
              <option value="life">人生曲线</option>
              <option value="wealth">财富曲线</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">状态:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="all">全部</option>
              <option value="unlocked">已解锁</option>
              <option value="shared">已分享</option>
              <option value="none">未转化</option>
            </select>
          </div>
          <div className="ml-auto text-gray-400 text-sm">
            共 <span className="text-white font-medium">{filteredAnalytics.length}</span> 条记录
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 概览 Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 核心指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <StatCard label="总用户" value={filteredAnalytics.length} icon="👥" />
              <StatCard label="已解锁" value={advancedStats.funnel.unlocks} icon="🔓" color="green" />
              <StatCard label="解锁率" value={`${advancedStats.funnelRates.viewToUnlock}%`} icon="📈" color="green" />
              <StatCard label="已分享" value={advancedStats.funnel.shares} icon="📤" color="blue" />
              <StatCard label="分享率" value={`${advancedStats.funnelRates.viewToShareClick}%`} icon="📊" color="blue" />
            </div>

            {/* CTR / 留存 / 付费率 - 新增核心指标 */}
            {advancedMetrics && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">核心埋点数据</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 点击率 CTR */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      <span>点击率 (CTR)</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">表单提交率</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-blue-400">{advancedMetrics.formSubmitCTR}%</span>
                          <span className="text-gray-500 text-xs ml-2">({advancedMetrics.formSubmitClicks}/{advancedMetrics.homePageViews})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">分享按钮CTR</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-green-400">{advancedMetrics.shareButtonCTR}%</span>
                          <span className="text-gray-500 text-xs ml-2">({advancedMetrics.shareButtonClicks}/{advancedMetrics.resultPageViews})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">解锁按钮CTR</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-yellow-400">{advancedMetrics.unlockButtonCTR}%</span>
                          <span className="text-gray-500 text-xs ml-2">({advancedMetrics.unlockButtonClicks}/{advancedMetrics.resultPageViews})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 留存率 */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                      <span>🔄</span>
                      <span>留存率</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">次日留存</span>
                        <span className={`text-xl font-bold ${advancedMetrics.day1Retention >= 20 ? 'text-green-400' : advancedMetrics.day1Retention >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {advancedMetrics.day1Retention}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">7日留存</span>
                        <span className={`text-xl font-bold ${advancedMetrics.day7Retention >= 10 ? 'text-green-400' : advancedMetrics.day7Retention >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {advancedMetrics.day7Retention}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">30日留存</span>
                        <span className={`text-xl font-bold ${advancedMetrics.day30Retention >= 5 ? 'text-green-400' : advancedMetrics.day30Retention >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {advancedMetrics.day30Retention}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">回访用户</span>
                          <span className="text-gray-300 text-sm">{advancedMetrics.returningVisitors} ({advancedMetrics.returningRate}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 付费率 */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                      <span>💰</span>
                      <span>付费率</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">整体付费率</span>
                        <span className={`text-xl font-bold ${advancedMetrics.paymentRate >= 5 ? 'text-green-400' : advancedMetrics.paymentRate >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {advancedMetrics.paymentRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">解锁点击率</span>
                        <span className="text-xl font-bold text-yellow-400">{advancedMetrics.unlockClickRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">解锁完成率</span>
                        <span className="text-xl font-bold text-green-400">{advancedMetrics.unlockCompleteRate}%</span>
                      </div>
                      <div className="pt-2 border-t border-gray-700 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">人生曲线付费率</span>
                          <span className="text-purple-400 text-sm">{advancedMetrics.lifeModePaymentRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">财富曲线付费率</span>
                          <span className="text-yellow-400 text-sm">{advancedMetrics.wealthModePaymentRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 页面访问统计 */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                    <span>📊</span>
                    <span>页面访问统计</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{advancedMetrics.totalPageViews}</div>
                      <div className="text-gray-400 text-sm">总PV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{advancedMetrics.uniqueVisitors}</div>
                      <div className="text-gray-400 text-sm">独立访客UV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{advancedMetrics.homePageViews}</div>
                      <div className="text-gray-400 text-sm">首页PV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{advancedMetrics.resultPageViews}</div>
                      <div className="text-gray-400 text-sm">结果页PV</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 关键洞察 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightCard
                title="分享用户解锁率"
                value={`${advancedStats.shareToUnlockCorr}%`}
                description="分享过的用户中有多少解锁了付费版"
                trend={advancedStats.shareToUnlockCorr > 30 ? 'up' : 'down'}
              />
              <InsightCard
                title="平均解锁时间"
                value={formatDuration(advancedStats.avgTimeToUnlock)}
                description="用户从查看报告到解锁付费版的平均时间"
                trend="neutral"
              />
              <InsightCard
                title="人生/财富比例"
                value={`${advancedStats.modeDist.life}:${advancedStats.modeDist.wealth}`}
                description="人生曲线与财富曲线的用户数量比"
                trend="neutral"
              />
            </div>

            {/* 简化漏斗 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">转化漏斗概览</h3>
              <div className="flex items-center justify-between">
                <FunnelStep label="查看" value={advancedStats.funnel.views} isFirst />
                <FunnelArrow rate={advancedStats.funnelRates.viewToShareClick} />
                <FunnelStep label="点击分享" value={advancedStats.funnel.shareClicks} />
                <FunnelArrow rate={advancedStats.funnelRates.shareClickToShare} />
                <FunnelStep label="分享成功" value={advancedStats.funnel.shares} />
                <FunnelArrow rate={0} hidden />
                <FunnelStep label="点击解锁" value={advancedStats.funnel.unlockClicks} />
                <FunnelArrow rate={advancedStats.funnelRates.unlockClickToUnlock} />
                <FunnelStep label="解锁成功" value={advancedStats.funnel.unlocks} color="green" />
              </div>
            </div>
          </div>
        )}

        {/* 转化漏斗 Tab */}
        {activeTab === 'funnel' && (
          <div className="space-y-8">
            {/* 详细漏斗 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-6">用户转化漏斗</h3>
              <div className="space-y-4">
                <FunnelBar label="查看报告" value={advancedStats.funnel.views} max={advancedStats.funnel.views} rate={100} />
                <FunnelBar label="点击分享" value={advancedStats.funnel.shareClicks} max={advancedStats.funnel.views} rate={advancedStats.funnelRates.viewToShareClick} color="blue" />
                <FunnelBar label="分享成功" value={advancedStats.funnel.shares} max={advancedStats.funnel.views} rate={Math.round((advancedStats.funnel.shares / Math.max(advancedStats.funnel.views, 1)) * 100)} color="blue" />
                <FunnelBar label="点击解锁" value={advancedStats.funnel.unlockClicks} max={advancedStats.funnel.views} rate={advancedStats.funnelRates.viewToUnlockClick} color="yellow" />
                <FunnelBar label="解锁成功" value={advancedStats.funnel.unlocks} max={advancedStats.funnel.views} rate={advancedStats.funnelRates.viewToUnlock} color="green" />
              </div>
            </div>

            {/* 分享与解锁关联 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">分享用户分析</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">分享后解锁率</span>
                    <span className="text-2xl font-bold text-green-400">{advancedStats.shareToUnlockCorr}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">未分享用户解锁率</span>
                    <span className="text-2xl font-bold text-gray-400">
                      {(() => {
                        const notShared = filteredAnalytics.filter(u => !u.hasShared);
                        const notSharedUnlocked = notShared.filter(u => u.hasUnlocked).length;
                        return notShared.length > 0 ? Math.round((notSharedUnlocked / notShared.length) * 100) : 0;
                      })()}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {advancedStats.shareToUnlockCorr > 30
                      ? '分享用户的解锁意愿明显更高，可考虑增加分享激励'
                      : '分享与解锁关联性不强，可能需要优化分享引导'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">解锁场景分析</h3>
                <div className="space-y-3">
                  {(() => {
                    const contexts: Record<string, number> = {};
                    filteredAnalytics.filter(u => u.unlockContext).forEach(u => {
                      const ctx = u.unlockContext || '未知';
                      contexts[ctx] = (contexts[ctx] || 0) + 1;
                    });
                    return Object.entries(contexts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([ctx, count]) => (
                        <div key={ctx} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm truncate max-w-[200px]">{ctx}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      ));
                  })()}
                  {Object.keys(filteredAnalytics.filter(u => u.unlockContext)).length === 0 && (
                    <p className="text-gray-500 text-sm">暂无解锁场景数据</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户画像 Tab */}
        {activeTab === 'demographics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 性别分布 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">性别分布</h3>
              <div className="flex items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-gray-300">男</span>
                    <span className="ml-auto text-white font-medium">{advancedStats.genderDist.male}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(advancedStats.genderDist.male / Math.max(filteredAnalytics.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded bg-pink-500"></div>
                    <span className="text-gray-300">女</span>
                    <span className="ml-auto text-white font-medium">{advancedStats.genderDist.female}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full transition-all"
                      style={{ width: `${(advancedStats.genderDist.female / Math.max(filteredAnalytics.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 年龄段分布 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">年龄段分布</h3>
              <div className="space-y-3">
                {Object.entries(advancedStats.ageDist)
                  .sort((a, b) => b[1] - a[1])
                  .map(([age, count]) => (
                    <div key={age} className="flex items-center gap-3">
                      <span className="text-gray-300 w-12">{age}</span>
                      <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded transition-all flex items-center justify-end pr-2"
                          style={{ width: `${Math.max((count / Math.max(filteredAnalytics.length, 1)) * 100, 5)}%` }}
                        >
                          <span className="text-xs text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 曲线类型分布 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">曲线类型分布</h3>
              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                    <span className="text-3xl font-bold text-purple-400">{advancedStats.modeDist.life}</span>
                  </div>
                  <span className="text-gray-300">人生曲线</span>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                    <span className="text-3xl font-bold text-yellow-400">{advancedStats.modeDist.wealth}</span>
                  </div>
                  <span className="text-gray-300">财富曲线</span>
                </div>
              </div>
            </div>

            {/* 地区分布 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">地区分布 (Top 10)</h3>
              <div className="space-y-2">
                {(() => {
                  const locations: Record<string, number> = {};
                  filteredAnalytics.forEach(u => {
                    const loc = u.province || u.city || '未知';
                    if (loc !== '未知') {
                      locations[loc] = (locations[loc] || 0) + 1;
                    }
                  });
                  const sorted = Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 10);
                  if (sorted.length === 0) {
                    return <p className="text-gray-500 text-sm">暂无地区数据</p>;
                  }
                  return sorted.map(([loc, count]) => (
                    <div key={loc} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{loc}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 时间分析 Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* 每日趋势 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">每日趋势</h3>
              {advancedStats.dailyTrend.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                <div className="h-48 flex items-end gap-1">
                  {advancedStats.dailyTrend.map((day, idx) => {
                    const maxCount = Math.max(...advancedStats.dailyTrend.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    const unlockHeight = (day.unlocks / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center" style={{ height: '160px' }}>
                          <div className="w-full flex flex-col justify-end h-full relative">
                            <div
                              className="w-full bg-blue-500/30 rounded-t transition-all"
                              style={{ height: `${height}%` }}
                            >
                              <div
                                className="w-full bg-green-500 rounded-t absolute bottom-0"
                                style={{ height: `${unlockHeight}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 rotate-45 origin-left whitespace-nowrap">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-6 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500/30"></div>
                  <span className="text-gray-400 text-sm">总访问</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-gray-400 text-sm">解锁数</span>
                </div>
              </div>
            </div>

            {/* 小时分布 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">24小时活跃分布</h3>
              <div className="h-32 flex items-end gap-0.5">
                {advancedStats.hourlyDist.map((count, hour) => {
                  const maxCount = Math.max(...advancedStats.hourlyDist, 1);
                  const height = (count / maxCount) * 100;
                  const isPeak = count === maxCount && count > 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t transition-all ${isPeak ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${hour}:00 - ${count}人`}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">0:00</span>
                <span className="text-xs text-gray-500">6:00</span>
                <span className="text-xs text-gray-500">12:00</span>
                <span className="text-xs text-gray-500">18:00</span>
                <span className="text-xs text-gray-500">24:00</span>
              </div>
              <p className="text-center text-gray-400 text-sm mt-4">
                高峰时段: {(() => {
                  const maxCount = Math.max(...advancedStats.hourlyDist);
                  if (maxCount === 0) return '暂无数据';
                  const peakHour = advancedStats.hourlyDist.indexOf(maxCount);
                  return `${peakHour}:00 - ${peakHour + 1}:00`;
                })()}
              </p>
            </div>
          </div>
        )}

        {/* 用户列表 Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">用户记录</h2>
              </div>

              {filteredAnalytics.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400">
                  暂无用户数据
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">姓名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">性别</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">出生日期</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">地区</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">类型</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">分享</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">解锁</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">解锁场景</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredAnalytics.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {user.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {user.gender === 'male' ? '男' : '女'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                            {user.birthYear}/{user.birthMonth}/{user.birthDay}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {user.province || user.city || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.curveMode === 'wealth'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {user.curveMode === 'wealth' ? '财富' : '人生'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.hasShared ? (
                              <span className="text-green-400">已分享</span>
                            ) : user.hasClickedShare ? (
                              <span className="text-yellow-400">已点击</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.hasUnlocked ? (
                              <span className="text-green-400">已解锁</span>
                            ) : user.hasClickedUnlock ? (
                              <span className="text-yellow-400">已点击</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                            {user.unlockContext || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 事件日志 */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-medium text-white">最近事件 (100条)</h2>
              </div>
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {filteredAnalytics.flatMap(user =>
                    user.events.map((event) => ({
                      ...event,
                      userName: user.name,
                    }))
                  )
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 100)
                  .map((event, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        {formatDate(event.timestamp)}
                      </span>
                      <span className="text-gray-400 w-20 flex-shrink-0 truncate">
                        {event.userName || '匿名'}
                      </span>
                      <EventBadge type={event.type} />
                      {event.metadata?.curveMode && (
                        <span className="text-gray-500 text-xs">
                          ({event.metadata.curveMode === 'wealth' ? '财富' : '人生'})
                        </span>
                      )}
                    </div>
                  ))}
                  {filteredAnalytics.length === 0 && (
                    <p className="text-gray-500 text-center py-4">暂无事件数据</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 设备管理 Tab */}
        {activeTab === 'devices' && (
          <DeviceManagement />
        )}

        {/* 订单管理 Tab */}
        {activeTab === 'orders' && (
          <OrderManagement />
        )}

        {/* 收入统计 Tab */}
        {activeTab === 'pay_stats' && (
          <PaymentStats />
        )}

        {/* 充值设置 Tab */}
        {activeTab === 'pay_settings' && (
          <RechargeSettings />
        )}
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  label,
  value,
  icon,
  color = 'default'
}: {
  label: string;
  value: number | string;
  icon?: string;
  color?: 'default' | 'green' | 'blue' | 'purple' | 'yellow';
}) {
  const colorClasses = {
    default: 'text-white',
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

// 洞察卡片组件
function InsightCard({
  title,
  value,
  description,
  trend
}: {
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h4 className="text-gray-400 text-sm mb-2">{title}</h4>
      <p className={`text-3xl font-bold mb-2 ${trendColors[trend]}`}>{value}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}

// 漏斗步骤组件
function FunnelStep({
  label,
  value,
  isFirst = false,
  color = 'default'
}: {
  label: string;
  value: number;
  isFirst?: boolean;
  color?: 'default' | 'green';
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold mb-1 ${color === 'green' ? 'text-green-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

// 漏斗箭头组件
function FunnelArrow({ rate, hidden = false }: { rate: number; hidden?: boolean }) {
  if (hidden) return <div className="w-16"></div>;
  return (
    <div className="flex flex-col items-center px-2">
      <div className="text-gray-500 text-2xl">→</div>
      <div className="text-gray-400 text-xs">{rate}%</div>
    </div>
  );
}

// 漏斗条形图
function FunnelBar({
  label,
  value,
  max,
  rate,
  color = 'default'
}: {
  label: string;
  value: number;
  max: number;
  rate: number;
  color?: 'default' | 'blue' | 'yellow' | 'green';
}) {
  const width = max > 0 ? (value / max) * 100 : 0;
  const colorClasses = {
    default: 'bg-gray-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-gray-300 text-sm">{label}</div>
      <div className="flex-1 h-8 bg-gray-700 rounded overflow-hidden relative">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${width}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className="text-white text-sm font-medium">{value}</span>
          <span className="text-white/70 text-sm">{rate}%</span>
        </div>
      </div>
    </div>
  );
}

// 事件标签组件
function EventBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    view_report: { label: '查看报告', className: 'bg-gray-600 text-gray-200' },
    click_share: { label: '点击分享', className: 'bg-blue-500/20 text-blue-400' },
    share_success: { label: '分享成功', className: 'bg-green-500/20 text-green-400' },
    click_unlock: { label: '点击解锁', className: 'bg-yellow-500/20 text-yellow-400' },
    unlock_success: { label: '解锁成功', className: 'bg-green-500/20 text-green-400' },
    mode_switch: { label: '切换模式', className: 'bg-purple-500/20 text-purple-400' },
  };

  const cfg = config[type] || { label: type, className: 'bg-gray-600 text-gray-200' };

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
