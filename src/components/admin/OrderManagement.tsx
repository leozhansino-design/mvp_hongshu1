'use client';

import { useState, useEffect, useCallback } from 'react';

interface Order {
  id: string;
  device_id: string;
  amount: number;
  points: number;
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

type StatusFilter = '' | 'pending' | 'paid' | 'failed' | 'refunded';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已退款', value: 'refunded' },
  { label: '失败', value: 'failed' },
];

const STATUS_MAP: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: '待支付', className: 'bg-yellow-500/20 text-yellow-400' },
  paid: { label: '已支付', className: 'bg-green-500/20 text-green-400' },
  refunded: { label: '已退款', className: 'bg-red-500/20 text-red-400' },
  failed: { label: '失败', className: 'bg-gray-600 text-gray-300' },
};

const PAY_METHOD_MAP: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);

  // Refund modal state
  const [refundModal, setRefundModal] = useState<{
    open: boolean;
    order: Order | null;
    password: string;
    submitting: boolean;
    message: string;
    messageType: 'success' | 'error' | '';
  }>({
    open: false,
    order: null,
    password: '',
    submitting: false,
    message: '',
    messageType: '',
  });

  // Adjust points modal state
  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    deviceId: string;
    points: string;
    reason: string;
    submitting: boolean;
    message: string;
    messageType: 'success' | 'error' | '';
  }>({
    open: false,
    deviceId: '',
    points: '',
    reason: '',
    submitting: false,
    message: '',
    messageType: '',
  });

  const pageSize = 20;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateId = (id: string) => {
    if (id.length > 8) {
      return id.substring(0, 8) + '...';
    }
    return id;
  };

  // --- Refund modal handlers ---

  const openRefundModal = (order: Order) => {
    setRefundModal({
      open: true,
      order,
      password: '',
      submitting: false,
      message: '',
      messageType: '',
    });
  };

  const closeRefundModal = () => {
    setRefundModal({
      open: false,
      order: null,
      password: '',
      submitting: false,
      message: '',
      messageType: '',
    });
  };

  const handleRefundSubmit = async () => {
    if (!refundModal.order || !refundModal.password) return;

    setRefundModal((prev) => ({ ...prev, submitting: true, message: '', messageType: '' }));

    try {
      const response = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundModal.order.id,
          password: refundModal.password,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setRefundModal((prev) => ({
          ...prev,
          submitting: false,
          message: '退款成功',
          messageType: 'success',
        }));
        // Refresh after a short delay so the user can see the message
        setTimeout(() => {
          closeRefundModal();
          loadOrders();
        }, 1000);
      } else {
        setRefundModal((prev) => ({
          ...prev,
          submitting: false,
          message: data.error || '退款失败',
          messageType: 'error',
        }));
      }
    } catch {
      setRefundModal((prev) => ({
        ...prev,
        submitting: false,
        message: '请求失败，请重试',
        messageType: 'error',
      }));
    }
  };

  // --- Adjust points modal handlers ---

  const openAdjustModal = () => {
    setAdjustModal({
      open: true,
      deviceId: '',
      points: '',
      reason: '',
      submitting: false,
      message: '',
      messageType: '',
    });
  };

  const closeAdjustModal = () => {
    setAdjustModal({
      open: false,
      deviceId: '',
      points: '',
      reason: '',
      submitting: false,
      message: '',
      messageType: '',
    });
  };

  const handleAdjustSubmit = async () => {
    if (!adjustModal.deviceId || !adjustModal.points) return;

    const pointsNum = parseInt(adjustModal.points, 10);
    if (isNaN(pointsNum)) return;

    setAdjustModal((prev) => ({ ...prev, submitting: true, message: '', messageType: '' }));

    try {
      const response = await fetch('/api/admin/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: adjustModal.deviceId,
          points: pointsNum,
          reason: adjustModal.reason,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setAdjustModal((prev) => ({
          ...prev,
          submitting: false,
          message: '积分调整成功',
          messageType: 'success',
        }));
        setTimeout(() => {
          closeAdjustModal();
        }, 1000);
      } else {
        setAdjustModal((prev) => ({
          ...prev,
          submitting: false,
          message: data.error || '积分调整失败',
          messageType: 'error',
        }));
      }
    } catch {
      setAdjustModal((prev) => ({
        ...prev,
        submitting: false,
        message: '请求失败，请重试',
        messageType: 'error',
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 订单列表 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-medium">订单管理</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={openAdjustModal}
              className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              调整积分
            </button>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="px-4 py-2 border-b border-gray-700 flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`px-3 py-1.5 text-sm rounded transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无订单数据</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      订单号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      设备ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      金额
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      积分
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      支付方式
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      创建时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status];
                    return (
                      <tr key={order.id} className="hover:bg-gray-750">
                        <td className="px-4 py-3 font-mono text-sm text-white">
                          {truncateId(order.id)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-300">
                          {truncateId(order.device_id)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white">
                          {(order.amount / 100).toFixed(2)}元
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-green-400">
                          {order.points}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {order.pay_method
                            ? PAY_METHOD_MAP[order.pay_method] || order.pay_method
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {order.status === 'paid' && (
                            <button
                              onClick={() => openRefundModal(order)}
                              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                              退款
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

      {/* Refund modal */}
      {refundModal.open && refundModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeRefundModal}></div>
          <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">确认退款</h3>
              <button
                onClick={closeRefundModal}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Order details */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">订单号</span>
                  <span className="text-white font-mono">{refundModal.order.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">金额</span>
                  <span className="text-white font-mono">
                    {(refundModal.order.amount / 100).toFixed(2)}元
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">积分</span>
                  <span className="text-green-400 font-mono">{refundModal.order.points}</span>
                </div>
              </div>

              {/* Password input */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">管理密码</label>
                <input
                  type="password"
                  value={refundModal.password}
                  onChange={(e) =>
                    setRefundModal((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="请输入管理密码"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Message */}
              {refundModal.message && (
                <div
                  className={`text-sm px-3 py-2 rounded ${
                    refundModal.messageType === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {refundModal.message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeRefundModal}
                  disabled={refundModal.submitting}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRefundSubmit}
                  disabled={refundModal.submitting || !refundModal.password}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {refundModal.submitting ? '处理中...' : '确认退款'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust points modal */}
      {adjustModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeAdjustModal}></div>
          <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">调整积分</h3>
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
              {/* Device ID */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">设备ID</label>
                <input
                  type="text"
                  value={adjustModal.deviceId}
                  onChange={(e) =>
                    setAdjustModal((prev) => ({ ...prev, deviceId: e.target.value }))
                  }
                  placeholder="请输入设备ID"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">积分（可为负数）</label>
                <input
                  type="number"
                  value={adjustModal.points}
                  onChange={(e) =>
                    setAdjustModal((prev) => ({ ...prev, points: e.target.value }))
                  }
                  placeholder="如 100 或 -50"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">原因</label>
                <textarea
                  value={adjustModal.reason}
                  onChange={(e) =>
                    setAdjustModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="请输入调整原因"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Message */}
              {adjustModal.message && (
                <div
                  className={`text-sm px-3 py-2 rounded ${
                    adjustModal.messageType === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {adjustModal.message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeAdjustModal}
                  disabled={adjustModal.submitting}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAdjustSubmit}
                  disabled={adjustModal.submitting || !adjustModal.deviceId || !adjustModal.points}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {adjustModal.submitting ? '处理中...' : '确认调整'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
