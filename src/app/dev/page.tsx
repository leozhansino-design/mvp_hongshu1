'use client';

import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/lib/constants';
import {
  testAPIConnection,
  getSystemPrompt,
  getFreePrompt,
  getPaidPrompt,
  generateFreeResult,
  generatePaidResult,
} from '@/services/api';
import { getUsageCount, resetUsage } from '@/services/storage';
import { BirthInfo } from '@/types';

export default function DevPage() {
  const [config, setConfig] = useState({
    baseUrl: API_CONFIG.baseUrl,
    apiKey: API_CONFIG.apiKey,
    model: API_CONFIG.model,
  });

  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({ tested: false, success: false, message: '' });

  const [promptVersion, setPromptVersion] = useState<'free' | 'paid'>('free');

  const [testBirthInfo, setTestBirthInfo] = useState<BirthInfo>({
    name: '测试',
    gender: 'male',
    year: 1990,
    month: 6,
    day: 15,
    hour: 12,
    minute: 0,
    calendarType: 'solar',
  });

  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    setUsageCount(getUsageCount());
  }, []);

  const handleTestConnection = async () => {
    setConnectionStatus({ tested: false, success: false, message: '测试中...' });
    const result = await testAPIConnection(config);
    setConnectionStatus({ tested: true, ...result });
  };

  const handleGenerateFree = async () => {
    setGenerating(true);
    setGeneratedResult('');
    try {
      const result = await generateFreeResult(testBirthInfo, config);
      setGeneratedResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setGeneratedResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePaid = async () => {
    setGenerating(true);
    setGeneratedResult('');
    try {
      const result = await generatePaidResult(testBirthInfo, config);
      setGeneratedResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setGeneratedResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleResetUsage = () => {
    resetUsage();
    setUsageCount(0);
  };

  const systemPrompt = getSystemPrompt();
  const userPrompt = promptVersion === 'free'
    ? getFreePrompt(testBirthInfo)
    : getPaidPrompt(testBirthInfo);

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-blue-400">
          开发调试页
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-green-400">API 配置</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                >
                  测试连接
                </button>

                {connectionStatus.tested && (
                  <div className={`p-3 rounded ${connectionStatus.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {connectionStatus.success ? '✓ ' : '✗ '}
                    {connectionStatus.message}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-yellow-400">测试生成</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">性别</label>
                  <select
                    value={testBirthInfo.gender}
                    onChange={(e) => setTestBirthInfo({ ...testBirthInfo, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">年</label>
                  <input
                    type="number"
                    value={testBirthInfo.year}
                    onChange={(e) => setTestBirthInfo({ ...testBirthInfo, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">月</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={testBirthInfo.month}
                    onChange={(e) => setTestBirthInfo({ ...testBirthInfo, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">日</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={testBirthInfo.day}
                    onChange={(e) => setTestBirthInfo({ ...testBirthInfo, day: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">时</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={testBirthInfo.hour}
                    onChange={(e) => setTestBirthInfo({ ...testBirthInfo, hour: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">分</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={testBirthInfo.minute}
                    onChange={(e) => setTestBirthInfo({ ...testBirthInfo, minute: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleGenerateFree}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-medium transition-colors"
                >
                  {generating ? '生成中...' : '生成免费版'}
                </button>
                <button
                  onClick={handleGeneratePaid}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium transition-colors"
                >
                  {generating ? '生成中...' : '生成付费版'}
                </button>
              </div>
            </section>

            <section className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-orange-400">使用次数管理</h2>
              <div className="flex items-center gap-4">
                <span>当前已使用: <span className="text-white font-mono">{usageCount}</span> 次</span>
                <button
                  onClick={handleResetUsage}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
                >
                  重置为0
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-cyan-400">Prompt 预览</h2>
                <select
                  value={promptVersion}
                  onChange={(e) => setPromptVersion(e.target.value as 'free' | 'paid')}
                  className="px-3 py-1 bg-gray-700 rounded border border-gray-600 text-sm focus:outline-none"
                >
                  <option value="free">免费版</option>
                  <option value="paid">付费版</option>
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">System Prompt</label>
                    <button
                      onClick={() => navigator.clipboard.writeText(systemPrompt)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      复制
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={systemPrompt}
                    className="w-full h-40 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">User Prompt</label>
                    <button
                      onClick={() => navigator.clipboard.writeText(userPrompt)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      复制
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={userPrompt}
                    className="w-full h-64 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
                  />
                </div>
              </div>
            </section>

            <section className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-pink-400">生成结果</h2>
              <textarea
                readOnly
                value={generatedResult || '生成结果将显示在这里...'}
                className="w-full h-96 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
