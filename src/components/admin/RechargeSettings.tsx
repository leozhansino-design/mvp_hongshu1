'use client';

import { useState, useEffect, useCallback } from 'react';

interface RechargeOption {
  id?: number;
  price: number;       // in 分
  points: number;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SystemConfig {
  unlock_points: number;
  overview_points: number;
  free_limit: number;
}

export default function RechargeSettings() {
  const [options, setOptions] = useState<RechargeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 系统配置
  const [config, setConfig] = useState<SystemConfig>({
    unlock_points: 50,
    overview_points: 10,
    free_limit: 3,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.success) {
        setOptions(data.options ?? []);
      } else {
        setFeedback({ type: 'error', message: data.error || '加载失败' });
      }
    } catch (error) {
      console.error('Failed to load recharge options:', error);
      setFeedback({ type: 'error', message: '网络错误，加载失败' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load system config:', error);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchConfig();
  }, [fetchOptions, fetchConfig]);

  // Auto-clear feedback after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleFieldChange = (index: number, field: keyof RechargeOption, value: number | boolean) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConfigChange = (field: keyof SystemConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { price: 100, points: 10, sort_order: 0, is_active: true },
    ]);
  };

  const handleDeleteOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options }),
      });
      const data = await response.json();

      if (data.success) {
        setFeedback({ type: 'success', message: '保存成功' });
        // Refresh to get server-assigned ids / timestamps
        await fetchOptions();
      } else {
        setFeedback({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error) {
      console.error('Failed to save recharge options:', error);
      setFeedback({ type: 'error', message: '网络错误，保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await response.json();

      if (data.success) {
        setFeedback({ type: 'success', message: '系统配置已保存' });
      } else {
        setFeedback({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error) {
      console.error('Failed to save system config:', error);
      setFeedback({ type: 'error', message: '网络错误，保存失败' });
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 系统配置 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-medium">积分系统配置</h3>
          <button
            onClick={handleSaveConfig}
            disabled={configSaving || configLoading}
            className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            {configSaving ? '保存中...' : '保存配置'}
          </button>
        </div>

        {configLoading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 解锁积分 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                解锁详细版需要积分
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={config.unlock_points}
                  onChange={(e) => handleConfigChange('unlock_points', Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-400">积分</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">用户解锁精批详解需要消耗的积分</p>
            </div>

            {/* 概览积分 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                概览消耗积分
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={config.overview_points}
                  onChange={(e) => handleConfigChange('overview_points', Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-400">积分</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">免费次数用完后，概览消耗的积分</p>
            </div>

            {/* 免费次数 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                免费次数限制
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={config.free_limit}
                  onChange={(e) => handleConfigChange('free_limit', Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-400">次</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">每个设备每种曲线的免费次数</p>
            </div>
          </div>
        )}
      </div>

      {/* 充值选项管理 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">充值选项管理</h2>
        <div className="flex items-center gap-3">
          {feedback && (
            <span
              className={`text-sm px-3 py-1 rounded ${
                feedback.type === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {feedback.message}
            </span>
          )}
          <button
            onClick={handleAddOption}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + 新增选项
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Options Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-medium">充值选项列表</h3>
          <button
            onClick={fetchOptions}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : options.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            暂无充值选项，点击「新增选项」添加
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    价格（分）
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    价格（元）
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    积分
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    排序
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">
                    启用
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {options.map((option, index) => (
                  <tr key={option.id ?? `new-${index}`} className="hover:bg-gray-750">
                    {/* Price in 分 */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={option.price}
                        onChange={(e) =>
                          handleFieldChange(index, 'price', Math.max(1, parseInt(e.target.value) || 0))
                        }
                        className="w-28 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </td>

                    {/* Price in 元 (read-only display) */}
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {(option.price / 100).toFixed(2)} 元
                    </td>

                    {/* Points */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={option.points}
                        onChange={(e) =>
                          handleFieldChange(index, 'points', Math.max(1, parseInt(e.target.value) || 0))
                        }
                        className="w-24 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </td>

                    {/* Sort Order */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={option.sort_order}
                        onChange={(e) =>
                          handleFieldChange(index, 'sort_order', parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </td>

                    {/* Active Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={option.is_active}
                        onClick={() => handleFieldChange(index, 'is_active', !option.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          option.is_active ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            option.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteOption(index)}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
