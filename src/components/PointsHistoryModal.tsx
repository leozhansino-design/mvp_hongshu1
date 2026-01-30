'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthToken } from '@/services/auth';

interface PointsLog {
  id: number;
  user_id: string | null;
  device_id: string | null;
  type: 'recharge' | 'consume';
  points: number;
  balance: number;
  description: string | null;
  created_at: string;
}

interface PointsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PointsHistoryModal({ isOpen, onClose }: PointsHistoryModalProps) {
  const [logs, setLogs] = useState<PointsLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/user/points-history?page=${page}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '获取记录失败');
      }

      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取记录失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string, points: number) => {
    if (type === 'recharge') {
      return { label: '充值', color: 'text-green-400', icon: '+' };
    }
    return { label: '消费', color: 'text-red-400', icon: '' };
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-mystic-900 rounded-2xl border border-gold-400/20 w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between p-4 border-b border-gold-400/10">
            <h2 className="text-lg font-bold text-white">积分使用记录</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容区 */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading && logs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-text-secondary">加载中...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchLogs}
                  className="px-4 py-2 bg-gold-400/20 text-gold-400 rounded-lg hover:bg-gold-400/30 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-text-secondary">暂无使用记录</p>
              </div>
            ) : (
              <div className="divide-y divide-gold-400/10">
                {logs.map((log) => {
                  const typeInfo = getTypeLabel(log.type, log.points);
                  return (
                    <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {log.description || (log.type === 'recharge' ? '积分充值' : '积分消费')}
                          </p>
                          <p className="text-text-secondary text-xs mt-1">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${typeInfo.color}`}>
                            {typeInfo.icon}{log.points > 0 ? '+' : ''}{log.points}
                          </p>
                          <p className="text-text-secondary text-xs">
                            余额: {log.balance}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gold-400/10">
              <p className="text-text-secondary text-sm">
                共 {total} 条记录
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span className="text-text-secondary text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
