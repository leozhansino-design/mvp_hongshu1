'use client';

import { useState, useEffect } from 'react';
import { Consultation, ConsultationStatus, formatPrice, getStatusLabel, getStatusColor } from '@/types/master';
import { maskPhone } from '@/types/auth';

interface ConsultationStats {
  pendingCount: number;
  completedCount: number;
  refundedCount: number;
  totalRevenue: number;
  todayOrders: number;
}

export default function ConsultationManagement() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [processing, setProcessing] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    fetchConsultations();
  }, [statusFilter, page]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        includeStats: 'true',
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/admin/consultations?${params}`);
      const data = await response.json();

      if (data.success) {
        setConsultations(data.consultations);
        setTotal(data.total);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchConsultations();
  };

  const handleComplete = async (consultation: Consultation) => {
    if (!confirm('确定要标记此订单为已完成吗？')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/consultations/${consultation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });

      const data = await response.json();

      if (data.success) {
        fetchConsultations();
        setSelectedConsultation(null);
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      alert('操作失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async (consultation: Consultation) => {
    if (!confirm(`确定要为订单 ${consultation.id} 全额退款 ¥${formatPrice(consultation.price)} 吗？`)) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/consultations/${consultation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund' }),
      });

      const data = await response.json();

      if (data.success) {
        fetchConsultations();
        setSelectedConsultation(null);
        alert('退款成功');
      } else {
        alert(data.error || '退款失败');
      }
    } catch (error) {
      console.error('Failed to refund consultation:', error);
      alert('退款失败');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">待处理</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">已完成</p>
            <p className="text-2xl font-bold text-green-400">{stats.completedCount}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">已退款</p>
            <p className="text-2xl font-bold text-red-400">{stats.refundedCount}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">今日订单</p>
            <p className="text-2xl font-bold text-blue-400">{stats.todayOrders}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">总收入</p>
            <p className="text-2xl font-bold text-gold-400">¥{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">状态:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ConsultationStatus | 'all');
              setPage(1);
            }}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="all">全部</option>
            <option value="pending">待处理</option>
            <option value="completed">已完成</option>
            <option value="refunded">已退款</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索订单号或手机号"
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white w-48"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            搜索
          </button>
        </div>

        <button
          onClick={fetchConsultations}
          className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
        >
          刷新
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">订单号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">用户手机</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">大师</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">金额</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">提交时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3">
                        <span className="text-white font-mono text-sm">{consultation.id}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {consultation.userPhone ? maskPhone(consultation.userPhone) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{consultation.masterName}</td>
                      <td className="px-4 py-3 text-gold-400">¥{formatPrice(consultation.price)}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(consultation.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(consultation.status)}`}>
                          {getStatusLabel(consultation.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedConsultation(consultation)}
                          className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                        >
                          查看
                        </button>
                        {consultation.status === 'pending' && (
                          <button
                            onClick={() => handleRefund(consultation)}
                            className="ml-2 px-3 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded transition-colors"
                          >
                            退款
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {consultations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        暂无订单数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
                <div className="text-gray-400 text-sm">
                  共 {total} 条记录
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="text-gray-400 text-sm">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">订单详情</h3>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h4 className="text-sm text-gray-400 mb-3">订单信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">订单号：</span>
                    <span className="text-white font-mono">{selectedConsultation.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">状态：</span>
                    <span className={getStatusColor(selectedConsultation.status).replace('bg-', 'text-').split(' ')[0]}>
                      {getStatusLabel(selectedConsultation.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-400 mb-3">用户信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">手机号：</span>
                    <span className="text-white">{selectedConsultation.userPhone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">支付时间：</span>
                    <span className="text-white">
                      {selectedConsultation.paidAt ? formatDate(selectedConsultation.paidAt) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Info */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-400 mb-3">咨询信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">大师：</span>
                    <span className="text-white">{selectedConsultation.masterName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">金额：</span>
                    <span className="text-gold-400">¥{formatPrice(selectedConsultation.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">报告字数：</span>
                    <span className="text-white">{selectedConsultation.wordCount}字</span>
                  </div>
                  <div>
                    <span className="text-gray-500">追问次数：</span>
                    <span className="text-white">
                      {selectedConsultation.followUps === -1 ? '不限' : `${selectedConsultation.followUps}次`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Birth Info */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-400 mb-3">用户生辰</h4>
                <div className="text-white">
                  {selectedConsultation.birthYear}年{selectedConsultation.birthMonth}月{selectedConsultation.birthDay}日
                  {selectedConsultation.birthTime && ` ${selectedConsultation.birthTime}`}
                  {' '}
                  {selectedConsultation.gender === 'male' ? '男' : '女'}
                  {selectedConsultation.name && ` · ${selectedConsultation.name}`}
                </div>
              </div>

              {/* Focus Hint */}
              {selectedConsultation.focusHint && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm text-gray-400 mb-3">解读重点</h4>
                  <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-3 text-gold-400 text-sm">
                    {selectedConsultation.focusHint}
                  </div>
                </div>
              )}

              {/* Question */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-400 mb-3">用户问题</h4>
                <div className="bg-gray-900 rounded-lg p-4 text-white text-sm whitespace-pre-wrap">
                  {selectedConsultation.question}
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedConsultation.status === 'pending' && (
              <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleComplete(selectedConsultation)}
                  disabled={processing}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing ? '处理中...' : '标记已完成'}
                </button>
                <button
                  onClick={() => handleRefund(selectedConsultation)}
                  disabled={processing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing ? '处理中...' : '全额退款'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Description */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm text-gray-400 mb-2">状态说明</h4>
        <div className="text-sm text-gray-500 space-y-1">
          <p>· <span className="text-yellow-400">待处理</span>：用户已付款，等待您做报告发送</p>
          <p>· <span className="text-green-400">已完成</span>：报告已发送，订单完成</p>
          <p>· <span className="text-red-400">已退款</span>：已全额退款</p>
        </div>
      </div>
    </div>
  );
}
