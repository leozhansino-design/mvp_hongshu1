'use client';

import { useState, useEffect } from 'react';
import { BirthInfo, Gender, CalendarType } from '@/types';
import { CHINA_PROVINCES, getCityNamesByProvince } from '@/data/chinaCities';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';
import { getFocusHint } from '@/types/master';
// Simple chart component for live mode
function SimpleCurve({
  dataPoints,
  highlights,
  type
}: {
  dataPoints: { age: number; score: number; event: string }[] | { age: number; wealth: number; event: string }[];
  highlights: { peakAge: number; peakScore?: number; peakWealth?: number; currentAge?: number; currentScore?: number };
  type: 'life' | 'wealth';
}) {
  const width = 600;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = dataPoints.map(p => type === 'life' ? (p as { score: number }).score : (p as { wealth: number }).wealth);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = dataPoints.map((p, i) => {
    const x = padding.left + (i / (dataPoints.length - 1)) * chartWidth;
    const val = type === 'life' ? (p as { score: number }).score : (p as { wealth: number }).wealth;
    const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, ...p };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full h-auto">
        {/* Background */}
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#1a1a2e" rx="4" />

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = padding.top + (1 - pct / 100) * chartHeight;
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke="#333" strokeDasharray="4" />
              <text x={padding.left - 8} y={y + 4} fill="#666" fontSize="10" textAnchor="end">
                {type === 'life' ? `${Math.round(minVal + (pct / 100) * range)}` : `${Math.round(minVal + (pct / 100) * range)}万`}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.filter((_, i) => i % 2 === 0).map((p) => (
          <text key={p.age} x={p.x} y={height - 10} fill="#666" fontSize="10" textAnchor="middle">
            {p.age}岁
          </text>
        ))}

        {/* Curve */}
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="#000" strokeWidth="1" />
        ))}

        {/* Peak marker */}
        {highlights.peakAge && (
          <g>
            {(() => {
              const peakPoint = points.find(p => p.age === highlights.peakAge);
              if (!peakPoint) return null;
              return (
                <>
                  <circle cx={peakPoint.x} cy={peakPoint.y} r="8" fill="none" stroke="#22c55e" strokeWidth="2" />
                  <text x={peakPoint.x} y={peakPoint.y - 15} fill="#22c55e" fontSize="11" textAnchor="middle" fontWeight="bold">
                    巅峰
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>{type === 'life' ? '运势指数' : '财富积累'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-green-500" />
          <span>巅峰时期 ({highlights.peakAge}岁)</span>
        </div>
      </div>
    </div>
  );
}

// 直播密码
const LIVE_PASSWORD = 'lifecurve2024';

// 十二时辰定义
const SHI_CHEN_OPTIONS = [
  { value: 0, label: '子时', time: '23:00-01:00' },
  { value: 1, label: '丑时', time: '01:00-03:00' },
  { value: 3, label: '寅时', time: '03:00-05:00' },
  { value: 5, label: '卯时', time: '05:00-07:00' },
  { value: 7, label: '辰时', time: '07:00-09:00' },
  { value: 9, label: '巳时', time: '09:00-11:00' },
  { value: 11, label: '午时', time: '11:00-13:00' },
  { value: 13, label: '未时', time: '13:00-15:00' },
  { value: 15, label: '申时', time: '15:00-17:00' },
  { value: 17, label: '酉时', time: '17:00-19:00' },
  { value: 19, label: '戌时', time: '19:00-21:00' },
  { value: 21, label: '亥时', time: '21:00-23:00' },
];

interface StreamerScript {
  openingLine: string;
  keyPoints: string[];
  talkingPoints: string[];
  suggestedPhrases: string[];
  backgroundKnowledge: string;
  emotionalHook: string;
}

export default function LivePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [shiChen, setShiChen] = useState<number | ''>('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [daYunResult, setDaYunResult] = useState<{ startInfo: string; daYunList: DaYunItem[] } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    lifeCurve?: { dataPoints: { age: number; score: number; event: string }[]; highlights: { peakAge: number; peakScore: number; troughAge: number; troughScore: number; currentAge: number; currentScore: number } };
    wealthCurve?: { dataPoints: { age: number; wealth: number; event: string }[]; highlights: { peakAge: number; peakWealth: number; maxGrowthAge: number; maxGrowthAmount: number } };
  } | null>(null);
  const [streamerScript, setStreamerScript] = useState<StreamerScript | null>(null);
  const [activeTab, setActiveTab] = useState<'life' | 'wealth'>('life');

  // Check for saved auth
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('live_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === LIVE_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('live_auth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('密码错误');
    }
  };

  // Generate years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1939 }, (_, i) => 1940 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const cities = province ? getCityNamesByProvince(province) : [];

  // Calculate bazi when form changes
  useEffect(() => {
    if (year && month && day && shiChen !== '') {
      const bazi = calculateBazi(
        year as number,
        month as number,
        day as number,
        shiChen as number,
        0,
        calendarType === 'lunar'
      );
      setBaziResult(bazi);

      if (gender && bazi) {
        const daYun = calculateDaYun(
          year as number,
          month as number,
          day as number,
          shiChen as number,
          0,
          gender,
          calendarType === 'lunar'
        );
        setDaYunResult(daYun);
      }
    } else {
      setBaziResult(null);
      setDaYunResult(null);
    }
  }, [year, month, day, shiChen, gender, calendarType]);

  const isFormValid = gender && year && month && day && shiChen !== '';

  const handleAnalyze = async () => {
    if (!isFormValid || !baziResult) return;

    setAnalyzing(true);
    setAnalysisResult(null);
    setStreamerScript(null);

    try {
      const birthInfo: BirthInfo = {
        gender,
        calendarType,
        year: year as number,
        month: month as number,
        day: day as number,
        hour: shiChen as number,
        minute: 0,
        name: name || '',
        province: province || undefined,
        city: city || undefined,
      };

      // Call the live analysis API
      const response = await fetch('/api/live/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthInfo,
          baziResult,
          daYunResult,
          analysisType: activeTab,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.analysis);
        setStreamerScript(data.streamerScript);
      } else {
        console.error('Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-gray-800">
          <h1 className="text-2xl font-bold text-gold-400 text-center mb-2">直播模式</h1>
          <p className="text-gray-400 text-center text-sm mb-6">请输入密码进入</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="输入密码"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none mb-4"
          />

          {passwordError && (
            <p className="text-red-400 text-sm text-center mb-4">{passwordError}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-black font-medium rounded-lg hover:from-gold-300 hover:to-amber-400 transition-all"
          >
            进入直播模式
          </button>
        </div>
      </div>
    );
  }

  const focusHint = year ? getFocusHint(year as number, gender) : null;

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Panel - User Visible Area */}
      <div className="w-1/2 border-r border-gray-800 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gold-400 mb-2">
              {activeTab === 'life' ? '人生曲线' : '财富曲线'}
            </h1>
            <p className="text-gray-400 text-sm">探索命运轨迹 · 把握人生节奏</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('life')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'life'
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              人生曲线
            </button>
            <button
              onClick={() => setActiveTab('wealth')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'wealth'
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              财富曲线
            </button>
          </div>

          {/* Form */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 mb-6">
            {/* Name + Gender */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">性别 *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGender('male')}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                      gender === 'male'
                        ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                        : 'border-gray-700 text-gray-400'
                    }`}
                  >
                    乾造(男)
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                      gender === 'female'
                        ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                        : 'border-gray-700 text-gray-400'
                    }`}
                  >
                    坤造(女)
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Type */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">历法 *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="radio"
                    checked={calendarType === 'solar'}
                    onChange={() => setCalendarType('solar')}
                    className="accent-gold-400"
                  />
                  公历
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="radio"
                    checked={calendarType === 'lunar'}
                    onChange={() => setCalendarType('lunar')}
                    className="accent-gold-400"
                  />
                  农历
                </label>
              </div>
            </div>

            {/* Birth Date */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">出生日期 *</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  <option value="">选择年</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : '')}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  <option value="">选择月</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : '')}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
                >
                  <option value="">选择日</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Birth Time */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">出生时辰 *</label>
              <select
                value={shiChen}
                onChange={(e) => setShiChen(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
              >
                <option value="">请选择时辰</option>
                {SHI_CHEN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.time})
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <select
                value={province}
                onChange={(e) => { setProvince(e.target.value); setCity(''); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
              >
                <option value="">选择省份</option>
                {CHINA_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:border-gold-400 focus:outline-none disabled:opacity-50"
              >
                <option value="">城市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!isFormValid || analyzing}
              className="w-full py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-black font-medium rounded-lg hover:from-gold-300 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? '分析中...' : '开始分析'}
            </button>
          </div>

          {/* Bazi Display */}
          {baziResult && (
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 mb-6">
              <h3 className="text-gold-400 text-sm font-medium mb-3">八字排盘</h3>
              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                <div>
                  <div className="text-xs text-gray-500">年柱</div>
                  <div className="text-gold-400 font-medium">{baziResult.eightChar.year}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">月柱</div>
                  <div className="text-gold-400 font-medium">{baziResult.eightChar.month}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">日柱</div>
                  <div className="text-gold-400 font-medium">{baziResult.eightChar.day}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">时柱</div>
                  <div className="text-gold-400 font-medium">{baziResult.eightChar.hour}</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>农历: {baziResult.lunar.monthCn}月{baziResult.lunar.dayCn}</span>
                <span>日主: {baziResult.dayMasterElement}</span>
              </div>
            </div>
          )}

          {/* Chart Display */}
          {analysisResult && (
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              {activeTab === 'life' && analysisResult.lifeCurve && (
                <SimpleCurve
                  dataPoints={analysisResult.lifeCurve.dataPoints}
                  highlights={analysisResult.lifeCurve.highlights}
                  type="life"
                />
              )}
              {activeTab === 'wealth' && analysisResult.wealthCurve && (
                <SimpleCurve
                  dataPoints={analysisResult.wealthCurve.dataPoints}
                  highlights={analysisResult.wealthCurve.highlights}
                  type="wealth"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Streamer Script Area */}
      <div className="w-1/2 bg-gray-950 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-purple-400">主播专属区域</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">用户不可见</span>
          </div>

          {!streamerScript ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎙️</div>
              <p className="text-gray-400">输入用户信息并点击&quot;开始分析&quot;</p>
              <p className="text-gray-500 text-sm mt-2">分析结果将在此处显示主播稿子</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Focus Hint */}
              {focusHint && (
                <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gold-400 font-medium">{focusHint.label}</span>
                    <span className="text-xs text-gold-400/70">解读侧重</span>
                  </div>
                  <p className="text-gray-400 text-sm">{focusHint.description}</p>
                </div>
              )}

              {/* Opening Line */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                  <span>🎯</span> 开场白
                </h3>
                <p className="text-white text-lg leading-relaxed">&quot;{streamerScript.openingLine}&quot;</p>
              </div>

              {/* Emotional Hook */}
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                <h3 className="text-pink-400 font-medium mb-2 flex items-center gap-2">
                  <span>💝</span> 共情切入点
                </h3>
                <p className="text-gray-300 leading-relaxed">{streamerScript.emotionalHook}</p>
              </div>

              {/* Key Points */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                  <span>📋</span> 讲解要点
                </h3>
                <ol className="space-y-2">
                  {streamerScript.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-xs text-blue-400">
                        {index + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Talking Points */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                  <span>💬</span> 可以延伸的话题
                </h3>
                <ul className="space-y-2">
                  {streamerScript.talkingPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="text-green-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Phrases */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">
                  <span>🗣️</span> 推荐话术
                </h3>
                <div className="space-y-3">
                  {streamerScript.suggestedPhrases.map((phrase, index) => (
                    <div key={index} className="bg-gray-900/50 rounded p-3 text-white italic">
                      &quot;{phrase}&quot;
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Knowledge */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 font-medium mb-3 flex items-center gap-2">
                  <span>📚</span> 知识补充
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{streamerScript.backgroundKnowledge}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
