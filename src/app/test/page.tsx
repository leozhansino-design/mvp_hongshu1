'use client';

import { useState, useMemo } from 'react';
import { API_CONFIG, SYSTEM_PROMPT, FREE_VERSION_PROMPT, PAID_VERSION_PROMPT, BaziForPrompt, DaYunForPrompt } from '@/lib/constants';
import { BirthInfo, CHINA_CITIES } from '@/types';
import { calculateBazi, calculateDaYun } from '@/lib/bazi';
import Header from '@/components/Header';

export default function TestPage() {
  const [config, setConfig] = useState({
    baseUrl: API_CONFIG.baseUrl,
    apiKey: API_CONFIG.apiKey,
    model: API_CONFIG.model,
  });

  const [birthInfo, setBirthInfo] = useState<BirthInfo>({
    name: '测试',
    gender: 'male',
    year: 1990,
    month: 6,
    day: 15,
    hour: 12,
    minute: 0,
    calendarType: 'solar',
    birthPlace: '',
  });

  const [version, setVersion] = useState<'free' | 'paid'>('free');
  const [generating, setGenerating] = useState(false);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;

  // 预计算八字和大运
  const { baziForPrompt, daYunForPrompt } = useMemo(() => {
    const isLunar = birthInfo.calendarType === 'lunar';
    const baziResult = calculateBazi(
      birthInfo.year, birthInfo.month, birthInfo.day,
      birthInfo.hour, birthInfo.minute, isLunar
    );
    const daYunResult = calculateDaYun(
      birthInfo.year, birthInfo.month, birthInfo.day,
      birthInfo.hour, birthInfo.minute, birthInfo.gender, isLunar
    );

    if (!baziResult || !daYunResult) {
      return { baziForPrompt: null, daYunForPrompt: [] };
    }

    const bazi: BaziForPrompt = {
      yearPillar: baziResult.chart.yearPillar.fullName,
      monthPillar: baziResult.chart.monthPillar.fullName,
      dayPillar: baziResult.chart.dayPillar.fullName,
      hourPillar: baziResult.chart.hourPillar.fullName,
      zodiac: baziResult.chart.zodiac,
      lunarDate: baziResult.chart.lunarDate,
    };

    const daYun: DaYunForPrompt[] = daYunResult.daYunList.map(d => ({
      ganZhi: d.ganZhi,
      startAge: d.startAge,
      endAge: d.endAge,
    }));

    return { baziForPrompt: bazi, daYunForPrompt: daYun };
  }, [birthInfo]);

  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = useMemo(() => {
    if (!baziForPrompt) return '八字计算失败，请检查出生信息';

    return version === 'free'
      ? FREE_VERSION_PROMPT(birthInfo.gender, birthInfo.year, baziForPrompt, daYunForPrompt, currentAge)
      : PAID_VERSION_PROMPT(birthInfo.gender, birthInfo.year, baziForPrompt, daYunForPrompt, currentAge);
  }, [version, birthInfo.gender, birthInfo.year, baziForPrompt, daYunForPrompt, currentAge]);

  const handleGenerate = async () => {
    setGenerating(true);
    setRawResponse('');
    setParsedResult('');
    setError('');

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: version === 'free' ? 8000 : 16000,
        }),
      });

      const data = await response.json();
      setRawResponse(JSON.stringify(data, null, 2));

      if (data.choices && data.choices[0]?.message?.content) {
        const content = data.choices[0].message.content;
        try {
          const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(cleanedContent);
          setParsedResult(JSON.stringify(parsed, null, 2));
        } catch {
          setParsedResult('JSON解析失败，原始内容：\n' + content);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-purple-400">测试页面（无限制）</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：配置和输入 */}
          <div className="space-y-6">
            {/* API配置 */}
            <section className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-green-400">API 配置</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 出生信息 */}
            <section className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-yellow-400">出生信息</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">性别</label>
                  <select
                    value={birthInfo.gender}
                    onChange={(e) => setBirthInfo({ ...birthInfo, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">历法</label>
                  <select
                    value={birthInfo.calendarType || 'solar'}
                    onChange={(e) => setBirthInfo({ ...birthInfo, calendarType: e.target.value as 'solar' | 'lunar' })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  >
                    <option value="solar">阳历(公历)</option>
                    <option value="lunar">阴历(农历)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">年</label>
                  <input
                    type="number"
                    value={birthInfo.year}
                    onChange={(e) => setBirthInfo({ ...birthInfo, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">月</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={birthInfo.month}
                    onChange={(e) => setBirthInfo({ ...birthInfo, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">日</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={birthInfo.day}
                    onChange={(e) => setBirthInfo({ ...birthInfo, day: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">时</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={birthInfo.hour}
                    onChange={(e) => setBirthInfo({ ...birthInfo, hour: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">分</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={birthInfo.minute}
                    onChange={(e) => setBirthInfo({ ...birthInfo, minute: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">出生地（选填）</label>
                  <input
                    type="text"
                    value={birthInfo.birthPlace || ''}
                    onChange={(e) => setBirthInfo({ ...birthInfo, birthPlace: e.target.value })}
                    placeholder="如：北京市、上海市"
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                    list="cities"
                  />
                  <datalist id="cities">
                    {CHINA_CITIES.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="version"
                    checked={version === 'free'}
                    onChange={() => setVersion('free')}
                    className="text-purple-500"
                  />
                  <span className="text-sm">免费版(10点)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="version"
                    checked={version === 'paid'}
                    onChange={() => setVersion('paid')}
                    className="text-purple-500"
                  />
                  <span className="text-sm">付费版(100点)</span>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium transition-colors"
              >
                {generating ? '生成中...' : '生成测试'}
              </button>
            </section>

            {/* System Prompt */}
            <section className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-cyan-400">System Prompt</h2>
                <button
                  onClick={() => navigator.clipboard.writeText(systemPrompt)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  复制
                </button>
              </div>
              <textarea
                readOnly
                value={systemPrompt}
                className="w-full h-32 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
              />
            </section>

            {/* User Prompt */}
            <section className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-orange-400">User Prompt ({version === 'free' ? '免费版' : '付费版'})</h2>
                <button
                  onClick={() => navigator.clipboard.writeText(userPrompt)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  复制
                </button>
              </div>
              <textarea
                readOnly
                value={userPrompt}
                className="w-full h-48 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
              />
            </section>
          </div>

          {/* 右侧：返回结果 */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* 原始响应 */}
            <section className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-pink-400">API 原始响应</h2>
                {rawResponse && (
                  <button
                    onClick={() => navigator.clipboard.writeText(rawResponse)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    复制
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={rawResponse || '等待生成...'}
                className="w-full h-64 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
              />
            </section>

            {/* 解析结果 */}
            <section className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-green-400">解析后的JSON</h2>
                {parsedResult && (
                  <button
                    onClick={() => navigator.clipboard.writeText(parsedResult)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    复制
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={parsedResult || '等待生成...'}
                className="w-full h-96 px-3 py-2 bg-gray-900 rounded border border-gray-700 font-mono text-xs resize-none"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
