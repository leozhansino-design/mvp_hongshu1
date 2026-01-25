'use client';

import { useState, useEffect, useCallback } from 'react';

interface Key {
  id: number;
  key_code: string;
  points: number;
  status: 'unused' | 'used' | 'disabled';
  created_at: string;
  used_at: string | null;
  used_by: string | null;
  used_by_device: string | null;
  used_by_info: string | null;
}

interface KeysStats {
  unused_count: number;
  used_count: number;
  disabled_count: number;
  total_count: number;
  total_points_used: number;
  total_points_unused: number;
  unused_10: number;
  used_10: number;
  unused_200: number;
  used_200: number;
  unused_1000: number;
  used_1000: number;
}

// 生成卡密面板
export function GenerateKeysPanel({ onGenerate }: { onGenerate: () => void }) {
  const [points, setPoints] = useState<10 | 200 | 1000>(10);
  const [count, setCount] = useState<number>(10);
  const [generating, setGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (count < 1 || count > 1000) {
      setError('数量必须在1-1000之间');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, count }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      setGeneratedKeys(data.keys);
      onGenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const copyAllKeys = () => {
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    alert('已复制全部卡密');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">生成卡密</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">积分档位</label>
          <div className="flex gap-2">
            {[10, 200, 1000].map((p) => (
              <button
                key={p}
                onClick={() => setPoints(p as 10 | 200 | 1000)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  points === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p}积分
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">生成数量</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            min={1}
            max={1000}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            placeholder="1-1000"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            {generating ? '生成中...' : '生成卡密'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {generatedKeys.length > 0 && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-sm">
              成功生成 {generatedKeys.length} 个卡密
            </span>
            <button
              onClick={copyAllKeys}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              复制全部
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <pre className="text-gray-300 text-sm font-mono">
              {generatedKeys.join('\n')}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// 卡密池面板
export function KeyPoolPanel({
  keys,
  stats,
  loading,
  onRefresh,
  onDisable,
  filterStatus,
  setFilterStatus,
  filterPoints,
  setFilterPoints,
  page,
  setPage,
  totalPages,
}: {
  keys: Key[];
  stats: KeysStats | null;
  loading: boolean;
  onRefresh: () => void;
  onDisable: (keyCode: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterPoints: string;
  setFilterPoints: (points: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}) {
  const copyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    alert('已复制');
  };

  const exportCSV = () => {
    const headers = ['卡密', '积分', '状态', '创建时间', '使用时间', '使用者'];
    const rows = keys.map((k) => [
      k.key_code,
      k.points.toString(),
      k.status === 'unused' ? '待发放' : k.status === 'used' ? '已使用' : '已作废',
      new Date(k.created_at).toLocaleString('zh-CN'),
      k.used_at ? new Date(k.used_at).toLocaleString('zh-CN') : '',
      k.used_by_device || k.used_by || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `卡密_${filterStatus}_${new Date().toLocaleDateString('zh-CN')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 统计面板 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">总生成</p>
            <p className="text-2xl font-bold text-white">{stats.total_count}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">待发放</p>
            <p className="text-2xl font-bold text-green-400">{stats.unused_count}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">已使用</p>
            <p className="text-2xl font-bold text-blue-400">{stats.used_count}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">已作废</p>
            <p className="text-2xl font-bold text-red-400">{stats.disabled_count}</p>
          </div>
        </div>
      )}

      {/* 按档位统计 */}
      {stats && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-gray-400 text-sm mb-3">按档位统计</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">10积分：</span>
              <span className="text-green-400">{stats.unused_10}待发</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-blue-400">{stats.used_10}已用</span>
            </div>
            <div>
              <span className="text-gray-400">200积分：</span>
              <span className="text-green-400">{stats.unused_200}待发</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-blue-400">{stats.used_200}已用</span>
            </div>
            <div>
              <span className="text-gray-400">1000积分：</span>
              <span className="text-green-400">{stats.unused_1000}待发</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-blue-400">{stats.used_1000}已用</span>
            </div>
          </div>
        </div>
      )}

      {/* 筛选和操作栏 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">状态:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="all">全部</option>
              <option value="unused">待发放</option>
              <option value="used">已使用</option>
              <option value="disabled">已作废</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">档位:</span>
            <select
              value={filterPoints}
              onChange={(e) => {
                setFilterPoints(e.target.value);
                setPage(1);
              }}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="">全部</option>
              <option value="10">10积分</option>
              <option value="200">200积分</option>
              <option value="1000">1000积分</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              导出CSV
            </button>
          </div>
        </div>
      </div>

      {/* 卡密列表 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无卡密数据</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      卡密
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      积分
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      创建时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      使用时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 font-mono text-sm text-white">{key.key_code}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            key.points === 10
                              ? 'bg-gray-600 text-gray-200'
                              : key.points === 200
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {key.points}积分
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            key.status === 'unused'
                              ? 'bg-green-500/20 text-green-400'
                              : key.status === 'used'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {key.status === 'unused'
                            ? '待发放'
                            : key.status === 'used'
                              ? '已使用'
                              : '已作废'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(key.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {key.used_at
                          ? new Date(key.used_at).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyKey(key.key_code)}
                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                          >
                            复制
                          </button>
                          {key.status === 'unused' && (
                            <button
                              onClick={() => onDisable(key.key_code)}
                              className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
                            >
                              作废
                            </button>
                          )}
                        </div>
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
                  第 {page} / {totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 主卡密管理组件
export default function KeyManagement() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [stats, setStats] = useState<KeysStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('unused');
  const [filterPoints, setFilterPoints] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'pool'>('pool');

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        page: page.toString(),
        pageSize: '50',
      });
      if (filterPoints) {
        params.set('points', filterPoints);
      }

      const response = await fetch(`/api/admin/keys?${params}`);
      const data = await response.json();

      if (data.success) {
        setKeys(data.keys);
        setStats(data.stats);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPoints, page]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleDisable = async (keyCode: string) => {
    if (!confirm(`确定要作废卡密 ${keyCode} 吗？`)) return;

    try {
      const response = await fetch('/api/admin/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyCode }),
      });

      if (response.ok) {
        loadKeys();
      }
    } catch (error) {
      console.error('Failed to disable key:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 子标签 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('pool')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === 'pool'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          卡密池
        </button>
        <button
          onClick={() => setActiveSubTab('generate')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === 'generate'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          生成卡密
        </button>
      </div>

      {activeSubTab === 'generate' && <GenerateKeysPanel onGenerate={loadKeys} />}

      {activeSubTab === 'pool' && (
        <KeyPoolPanel
          keys={keys}
          stats={stats}
          loading={loading}
          onRefresh={loadKeys}
          onDisable={handleDisable}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPoints={filterPoints}
          setFilterPoints={setFilterPoints}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
