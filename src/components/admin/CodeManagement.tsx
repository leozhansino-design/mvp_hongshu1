'use client';

import { useState, useEffect } from 'react';

interface RedemptionCode {
  id: string;
  code: string;
  test_slug: string;
  report_level: string;
  is_used: boolean;
  used_by_device: string | null;
  used_at: string | null;
  batch_name: string | null;
  created_at: string;
}

const TEST_OPTIONS = [
  { value: 'enneagram', label: '九型人格' },
  { value: 'life-curve', label: '人生曲线' },
  { value: 'wealth-curve', label: '财富曲线' },
];

export default function CodeManagement() {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [total, setTotal] = useState(0);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  // 筛选条件
  const [filterTestSlug, setFilterTestSlug] = useState('');
  const [filterIsUsed, setFilterIsUsed] = useState('');
  const [filterBatchName, setFilterBatchName] = useState('');

  // 生成表单
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateTestSlug, setGenerateTestSlug] = useState('enneagram');
  const [generateCount, setGenerateCount] = useState(10);
  const [generateBatchName, setGenerateBatchName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // 加载卡密列表
  const loadCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (filterTestSlug) params.set('testSlug', filterTestSlug);
      if (filterIsUsed !== '') params.set('isUsed', filterIsUsed);
      if (filterBatchName) params.set('batchName', filterBatchName);

      const response = await fetch(`/api/admin/codes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCodes(data.codes);
        setTotal(data.total);
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('加载卡密列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, [page, filterTestSlug, filterIsUsed, filterBatchName]);

  // 生成卡密
  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 10000) {
      alert('生成数量需要在1-10000之间');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSlug: generateTestSlug,
          reportLevel: 'basic', // 卡密只支持基础版
          count: generateCount,
          batchName: generateBatchName || `批次-${new Date().toLocaleDateString('zh-CN')}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedCodes(data.codes);
        loadCodes();
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 删除卡密
  const handleDelete = async (codeId: string) => {
    if (!confirm('确定要删除这个卡密吗？')) return;

    try {
      const response = await fetch(`/api/admin/codes?id=${codeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadCodes();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    }
  };

  // 导出卡密
  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterTestSlug) params.set('testSlug', filterTestSlug);
    if (filterBatchName) params.set('batchName', filterBatchName);
    if (filterIsUsed === 'false') params.set('onlyUnused', 'true');

    window.open(`/api/admin/codes/export?${params.toString()}`, '_blank');
  };

  // 复制卡密
  const handleCopyCodes = () => {
    const text = generatedCodes.join('\n');
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs">总卡密数</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs">已使用</p>
          <p className="text-2xl font-bold text-green-400">
            {codes.filter(c => c.is_used).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs">未使用</p>
          <p className="text-2xl font-bold text-blue-400">
            {codes.filter(c => !c.is_used).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs">批次数</p>
          <p className="text-2xl font-bold text-purple-400">{batches.length}</p>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          批量生成卡密
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          导出CSV
        </button>
        <button
          onClick={loadCodes}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          刷新
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-800 rounded-lg p-4">
        <select
          value={filterTestSlug}
          onChange={(e) => setFilterTestSlug(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">全部测试</option>
          {TEST_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filterIsUsed}
          onChange={(e) => setFilterIsUsed(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">全部状态</option>
          <option value="false">未使用</option>
          <option value="true">已使用</option>
        </select>
        <select
          value={filterBatchName}
          onChange={(e) => setFilterBatchName(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">全部批次</option>
          {batches.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
      </div>

      {/* 卡密列表 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : codes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无卡密</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">卡密</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">测试</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">级别</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">批次</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">创建时间</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm font-mono text-white">
                      {code.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {TEST_OPTIONS.find(t => t.value === code.test_slug)?.label || code.test_slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        code.report_level === 'full'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {code.report_level === 'full' ? '完整版' : '基础版'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {code.batch_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {code.is_used ? (
                        <span className="text-green-400">已使用</span>
                      ) : (
                        <span className="text-gray-500">未使用</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(code.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code.code);
                          alert('已复制');
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                      >
                        复制
                      </button>
                      {!code.is_used && (
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              共 {total} 条，第 {page} / {totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-700 rounded text-sm text-white disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-700 rounded text-sm text-white disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 生成卡密弹窗 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-6">批量生成卡密</h3>

            {generatedCodes.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">测试类型</label>
                  <select
                    value={generateTestSlug}
                    onChange={(e) => setGenerateTestSlug(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  >
                    {TEST_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">
                    卡密仅支持 <span className="text-blue-400 font-medium">基础版</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">完整版请引导用户直接在线购买</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">生成数量</label>
                  <input
                    type="number"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)}
                    min={1}
                    max={10000}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">批次名称</label>
                  <input
                    type="text"
                    value={generateBatchName}
                    onChange={(e) => setGenerateBatchName(e.target.value)}
                    placeholder={`默认：批次-${new Date().toLocaleDateString('zh-CN')}`}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {generating ? '生成中...' : `生成 ${generateCount} 个`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-green-400 text-center">
                  成功生成 {generatedCodes.length} 个卡密
                </p>
                <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {generatedCodes.join('\n')}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyCodes}
                    className="flex-1 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    复制全部
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedCodes([]);
                      setShowGenerateModal(false);
                    }}
                    className="flex-1 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
