'use client';

import { useState, useEffect, useCallback } from 'react';

interface Stats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;  // in 分
  totalRefunded: number; // in 分
  todayOrders: number;
  todayRevenue: number;  // in 分
}

function formatYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

export default function PaymentStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取统计数据失败');
      }

      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err instanceof Error ? err.message : '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="p-8 text-center text-gray-400">加载中...</div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-8 text-center text-red-400">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">支付统计</h3>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors"
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* 总订单数 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">
            {stats?.totalOrders ?? 0}
          </p>
          <p className="text-gray-400 text-xs mt-1">总订单数</p>
        </div>

        {/* 已支付订单 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">
            {stats?.paidOrders ?? 0}
          </p>
          <p className="text-gray-400 text-xs mt-1">已支付订单</p>
        </div>

        {/* 总收入 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">
            &yen;{formatYuan(stats?.totalRevenue ?? 0)}
          </p>
          <p className="text-gray-400 text-xs mt-1">总收入</p>
        </div>

        {/* 总退款 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-400">
            &yen;{formatYuan(stats?.totalRefunded ?? 0)}
          </p>
          <p className="text-gray-400 text-xs mt-1">总退款</p>
        </div>

        {/* 今日订单 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">
            {stats?.todayOrders ?? 0}
          </p>
          <p className="text-gray-400 text-xs mt-1">今日订单</p>
        </div>

        {/* 今日收入 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">
            &yen;{formatYuan(stats?.todayRevenue ?? 0)}
          </p>
          <p className="text-gray-400 text-xs mt-1">今日收入</p>
        </div>
      </div>
    </div>
  );
}
