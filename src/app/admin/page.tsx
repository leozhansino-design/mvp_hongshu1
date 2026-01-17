'use client';

import { useState, useEffect } from 'react';
import { getAllAnalytics, getAnalyticsSummary, clearAllAnalytics } from '@/services/analytics';
import { UserAnalytics } from '@/types';

// 登录凭证
const ADMIN_USERNAME = 'leozhansino';
const ADMIN_PASSWORD = 'Dianzi123';
const AUTH_KEY = 'lc_admin_auth';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getAnalyticsSummary> | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查是否已登录
  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
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
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      setLoginError('');
    } else {
      setLoginError('账号或密码错误');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有分析数据吗？此操作不可恢复！')) {
      clearAllAnalytics();
      loadData();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
              刷新数据
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
              退出登录
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="总用户数" value={summary.totalUsers} />
            <StatCard label="查看报告" value={summary.totalViews} />
            <StatCard label="点击分享" value={summary.shareClicks} />
            <StatCard label="分享成功" value={summary.shareSuccess} />
            <StatCard label="点击解锁" value={summary.unlockClicks} />
            <StatCard label="解锁成功" value={summary.unlockSuccess} />
            <StatCard label="人生曲线" value={summary.lifeMode} color="purple" />
            <StatCard label="财富曲线" value={summary.wealthMode} color="yellow" />
            <StatCard label="转化率" value={`${summary.conversionRate}%`} color="green" />
            <StatCard label="分享率" value={`${summary.shareRate}%`} color="blue" />
          </div>
        )}

        {/* 用户列表 */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-medium text-white">用户记录 ({analytics.length})</h2>
          </div>

          {analytics.length === 0 ? (
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
                  {analytics.map((user) => (
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

        {/* 详细事件日志 */}
        {analytics.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">事件日志</h2>
            </div>
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {analytics.flatMap(user =>
                  user.events.map((event, idx) => ({
                    ...event,
                    userId: user.id,
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
                    <span className="text-gray-400 w-20 flex-shrink-0">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  label,
  value,
  color = 'default'
}: {
  label: string;
  value: number | string;
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
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
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
