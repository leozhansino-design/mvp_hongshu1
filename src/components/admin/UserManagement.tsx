'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  phone: string;
  points: number;
  free_used: number;
  free_used_wealth: number;
  total_paid: number;
  created_at: string;
  last_login_at: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 积分调整弹窗状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (searchPhone.trim()) {
        params.set('phone', searchPhone.trim());
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchPhone]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const openAdjustModal = (user: User) => {
    setSelectedUser(user);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustError('');
  };

  const closeAdjustModal = () => {
    setSelectedUser(null);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustError('');
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser) return;

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      setAdjustError('请输入有效的积分数量（正数增加，负数减少）');
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('请输入调整原因');
      return;
    }

    setAdjusting(true);
    setAdjustError('');

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: amount,
          reason: adjustReason.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 更新本地用户列表
        setUsers(users.map(u =>
          u.id === selectedUser.id
            ? { ...u, points: data.newPoints }
            : u
        ));
        closeAdjustModal();
      } else {
        setAdjustError(data.error || '调整失败');
      }
    } catch (error) {
      setAdjustError('网络错误，请重试');
    } finally {
      setAdjusting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  };

  return (
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="输入手机号搜索用户..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
          {searchPhone && (
            <button
              type="button"
              onClick={() => {
                setSearchPhone('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              清除
            </button>
          )}
        </form>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">总用户数</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">有积分用户</p>
          <p className="text-2xl font-bold text-green-400">
            {users.filter(u => u.points > 0).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">付费用户</p>
          <p className="text-2xl font-bold text-blue-400">
            {users.filter(u => u.total_paid > 0).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">总积分</p>
          <p className="text-2xl font-bold text-yellow-400">
            {users.reduce((sum, u) => sum + u.points, 0)}
          </p>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-medium">用户列表</h3>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {searchPhone ? '未找到匹配的用户' : '暂无用户数据'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      手机号
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      积分
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      累计充值
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">
                      免费次数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      注册时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      最后登录
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 font-mono text-white">
                        {user.phone}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono ${user.points > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                          {user.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-yellow-400">
                          ¥{((user.total_paid || 0) / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-300 text-sm">
                          人生{user.free_used}/3 · 财富{user.free_used_wealth || 0}/3
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {user.last_login_at ? formatDate(user.last_login_at) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openAdjustModal(user)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          调整积分
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  第 {page} / {totalPages} 页，共 {total} 条
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 积分调整弹窗 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeAdjustModal}></div>
          <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">调整用户积分</h3>
              <button
                onClick={closeAdjustModal}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 用户信息 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">用户手机号</p>
                <p className="text-white font-mono">{selectedUser.phone}</p>
                <p className="text-gray-400 text-sm mt-2 mb-1">当前积分</p>
                <p className="text-2xl font-bold text-green-400">{selectedUser.points}</p>
              </div>

              {/* 积分调整输入 */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  积分变动（正数增加，负数减少）
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="例如: 100 或 -50"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 调整原因 */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  调整原因
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="请输入调整原因..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* 预览 */}
              {adjustAmount && !isNaN(parseInt(adjustAmount)) && parseInt(adjustAmount) !== 0 && (
                <div className="bg-gray-800 rounded-lg p-3 text-sm">
                  <span className="text-gray-400">调整后积分：</span>
                  <span className="text-white font-medium ml-2">
                    {Math.max(0, selectedUser.points + parseInt(adjustAmount))}
                  </span>
                  <span className="text-gray-500 ml-2">
                    ({parseInt(adjustAmount) > 0 ? '+' : ''}{adjustAmount})
                  </span>
                </div>
              )}

              {/* 错误提示 */}
              {adjustError && (
                <p className="text-red-400 text-sm">{adjustError}</p>
              )}

              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={closeAdjustModal}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAdjustPoints}
                  disabled={adjusting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {adjusting ? '处理中...' : '确认调整'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
