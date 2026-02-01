'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import { BirthForm, AnalysisLoader, BaziChartDisplay, LifeCurveChart, WealthChart, WealthAnalysis, FiveElementsDiagram } from '@/components';
import { generateFreeResult, generateWealthCurve, generateStreamerScript } from '@/services/api';
import { BirthInfo, CurveMode, CURVE_MODE_LABELS, FreeVersionResult, WealthCurveData, PHASE_LABELS, PhaseType, StreamerScriptResult, TYPE_LABELS } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';
import { getFocusHint, FocusHint } from '@/types/master';
import { DaYunItem, calculateDaYun, calculateBazi, BaziResult } from '@/lib/bazi';

// 直播密码
const LIVE_PASSWORD = 'lifecurve2024';

// 评分圆环组件
function ScoreRing({ score, label, size = 'md' }: { score?: number; label: string; size?: 'sm' | 'md' }) {
  const validScore = score !== undefined && score !== null && !isNaN(score) ? score : 0;
  const radius = size === 'sm' ? 28 : 36;
  const strokeWidth = size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const progress = (validScore / 100) * circumference;
  const color = validScore >= 75 ? '#22c55e' : validScore >= 50 ? '#D4AF37' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${size === 'sm' ? 'w-16 h-16' : 'w-20 h-20'}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="50%" cy="50%" r={radius} stroke="#1a1a1a" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx="50%" cy="50%" r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-bold ${size === 'sm' ? 'text-lg' : 'text-xl'}`} style={{ color }}>{validScore}</span>
        </div>
      </div>
      {label && <span className="text-xs text-text-secondary mt-1">{label}</span>}
    </div>
  );
}

// 分析卡片组件
function AnalysisCard({ title, content, score, icon }: { title: string; content: string; score?: number; icon: string }) {
  return (
    <div className="p-4 rounded-lg bg-black/30 border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-serif text-gold-400">{title}</h3>
        </div>
        <ScoreRing score={score} label="" size="sm" />
      </div>
      <p className="text-text-primary text-sm leading-relaxed">{content}</p>
    </div>
  );
}

// 直播页面内容组件
function LivePageContent() {
  const searchParams = useSearchParams();

  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 表单和结果状态
  const [curveMode, setCurveMode] = useState<CurveMode>('life');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 结果数据
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [freeResult, setFreeResult] = useState<FreeVersionResult | null>(null);
  const [wealthResult, setWealthResult] = useState<WealthCurveData | null>(null);
  const [daYunResult, setDaYunResult] = useState<{ startInfo: string; daYunList: DaYunItem[] } | null>(null);
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);

  // 主播稿子
  const [streamerScript, setStreamerScript] = useState<StreamerScriptResult | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [focusHint, setFocusHint] = useState<{ type: FocusHint; label: string; description: string } | null>(null);

  // 分享相关
  const [shareLoading, setShareLoading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const wealthShareRef = useRef<HTMLDivElement>(null);

  // 从 URL 读取模式参数
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'wealth') {
      setCurveMode('wealth');
    } else if (modeParam === 'life') {
      setCurveMode('life');
    }
  }, [searchParams]);

  // 密码验证
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === LIVE_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      sessionStorage.setItem('live_auth', 'true');
    } else {
      setPasswordError('密码错误');
    }
  };

  // 检查 session 认证
  useEffect(() => {
    if (sessionStorage.getItem('live_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 分享功能
  const handleShare = async () => {
    const ref = curveMode === 'wealth' ? wealthShareRef.current : shareRef.current;
    if (!ref) return;
    setShareLoading(true);
    try {
      const canvas = await html2canvas(ref, {
        backgroundColor: curveMode === 'wealth' ? '#0a0a0a' : '#0D0221',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `live-${curveMode === 'wealth' ? 'wealth' : 'life'}-curve-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('生成分享图失败:', error);
      alert('生成分享图失败');
    } finally {
      setShareLoading(false);
    }
  };

  // 提交处理 - 使用和首页一样的API，并行调用
  const handleSubmit = useCallback(async (info: BirthInfo, _isPaid: boolean = false) => {
    setIsLoading(true);
    setScriptLoading(true);
    setError(null);
    setBirthInfo(info);

    // 清空之前的结果
    setFreeResult(null);
    setWealthResult(null);
    setStreamerScript(null);
    setBaziResult(null);

    try {
      // 计算八字（包含详细的十神、藏干信息）
      const bazi = calculateBazi(
        info.year,
        info.month,
        info.day,
        info.hour,
        info.minute || 0,
        info.calendarType === 'lunar'
      );
      setBaziResult(bazi);

      // 计算大运（0-90岁）
      const daYun = calculateDaYun(
        info.year,
        info.month,
        info.day,
        info.hour,
        info.minute || 0,
        info.gender,
        info.calendarType === 'lunar'
      );
      setDaYunResult(daYun);

      // 计算关注重点
      const hint = getFocusHint(info.year, info.gender);
      setFocusHint(hint);

      // 根据关注重点确定focusType
      const focusTypeMap: Record<string, 'career' | 'relationship' | 'future' | 'health'> = {
        'career': 'career',
        'relationship': 'relationship',
        'future': 'future',
        'health': 'health'
      };
      const focusType = focusTypeMap[hint.type] || 'career';

      // 并行调用所有API
      if (curveMode === 'wealth') {
        // 财富曲线模式 - 并行调用财富曲线和主播稿子API
        const [resultWealth, script] = await Promise.all([
          generateWealthCurve(info, false),
          generateStreamerScript(info, focusType).catch(err => {
            console.error('生成主播稿子失败:', err);
            return null;
          })
        ]);
        setWealthResult(resultWealth);
        if (script) setStreamerScript(script);
      } else {
        // 人生曲线模式 - 并行调用人生曲线和主播稿子API
        const [resultFree, script] = await Promise.all([
          generateFreeResult(info),
          generateStreamerScript(info, focusType).catch(err => {
            console.error('生成主播稿子失败:', err);
            return null;
          })
        ]);
        setFreeResult(resultFree);
        if (script) setStreamerScript(script);
      }

      setIsLoading(false);
      setScriptLoading(false);

    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '天机运算失败，请稍后再试');
      setIsLoading(false);
      setScriptLoading(false);
    }
  }, [curveMode]);

  // 密码页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="mystic-card-gold w-full max-w-sm p-6">
          <h1 className="text-2xl font-serif text-gold-400 text-center mb-6">主播直播模式</h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">请输入访问密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold-400"
                placeholder="输入密码"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gold-400 text-black font-medium rounded-lg hover:bg-gold-300 transition-colors"
            >
              进入直播模式
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 加载中页面 - 使用和首页一样的加载动画
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex h-screen">
          {/* 左侧加载动画 */}
          <div className="w-1/2 flex items-center justify-center border-r border-gray-800">
            <AnalysisLoader
              messages={curveMode === 'wealth' ? WEALTH_LOADING_MESSAGES : undefined}
            />
          </div>
          {/* 右侧等待提示 */}
          <div className="w-1/2 flex items-center justify-center bg-gray-950">
            <div className="text-center">
              <div className="text-6xl mb-4">🔮</div>
              <p className="text-gold-400">正在推算命盘...</p>
              <p className="text-gray-500 text-sm mt-2">主播稿子即将生成</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isWealthMode = curveMode === 'wealth';
  const hasResult = (isWealthMode && wealthResult) || (!isWealthMode && freeResult);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="flex h-screen">
        {/* 左侧 - 用户输入和结果展示区 */}
        <div className="w-1/2 overflow-y-auto border-r border-gray-800">
          <div className="p-6">
            {/* 标题和模式切换 */}
            <div className="text-center mb-6">
              <h1 className="font-serif text-3xl text-gold-gradient mb-2">
                {CURVE_MODE_LABELS[curveMode]}
              </h1>
              <p className="text-text-secondary text-sm">
                {curveMode === 'life'
                  ? '探索命运轨迹 · 把握人生节奏'
                  : '解析财富密码 · 掌握财运周期'
                }
              </p>

              {/* 模式切换按钮 */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    setCurveMode('life');
                    setFreeResult(null);
                    setWealthResult(null);
                    setStreamerScript(null);
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                    curveMode === 'life'
                      ? 'bg-gold-400 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  人生曲线
                </button>
                <button
                  onClick={() => {
                    setCurveMode('wealth');
                    setFreeResult(null);
                    setWealthResult(null);
                    setStreamerScript(null);
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                    curveMode === 'wealth'
                      ? 'bg-gold-400 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  财富曲线
                </button>
              </div>
            </div>

            {/* 输入表单 - 使用和首页一样的BirthForm */}
            {!hasResult && (
              <div className="mystic-card-gold max-w-md mx-auto">
                <BirthForm
                  onSubmit={handleSubmit}
                  disabled={isLoading}
                  remainingUsage={999}
                  points={99999}
                  detailedPrice={200}
                />

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* 结果展示 */}
            {hasResult && (
              <div className="space-y-6">
                {/* 顶部操作栏 */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setFreeResult(null);
                      setWealthResult(null);
                      setStreamerScript(null);
                      setBirthInfo(null);
                    }}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    ← 重新分析
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="px-4 py-2 bg-gold-400/20 text-gold-400 border border-gold-400/50 rounded-lg hover:bg-gold-400/30 transition-colors text-sm"
                  >
                    {shareLoading ? '生成中...' : '📤 分享图片'}
                  </button>
                </div>

                {/* 人生高光时刻 - 最优先显示 */}
                {freeResult?.highlightMoment && !isWealthMode && (
                  <div className="mystic-card-gold p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">🌟</div>
                      <div className="flex-1">
                        <h3 className="text-gold-400 font-serif text-lg mb-2">人生高光时刻</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full bg-gold-400/20 text-gold-400 text-sm font-mono">
                            {freeResult.highlightMoment.age}岁
                          </span>
                          <span className="text-text-secondary text-sm">· {freeResult.highlightMoment.title}</span>
                        </div>
                        <p className="text-text-primary leading-relaxed text-sm">{freeResult.highlightMoment.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 财富高光 */}
                {wealthResult && isWealthMode && (
                  <div className="mystic-card-gold p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">💰</div>
                      <div className="flex-1">
                        <h3 className="text-gold-400 font-serif text-lg mb-2">财富巅峰</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full bg-gold-400/20 text-gold-400 text-sm font-mono">
                            {wealthResult.highlights.peakAge}岁
                          </span>
                          <span className="text-text-secondary text-sm">· {wealthResult.wealthType}</span>
                        </div>
                        <p className="text-text-primary leading-relaxed text-sm">
                          {wealthResult.highlights.peakWealth >= 10000
                            ? '预计财富巅峰 突破一亿·不可估量！'
                            : `预计财富巅峰约 ${Math.round(wealthResult.highlights.peakWealth)}万`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 图表展示 */}
                <div className="mystic-card p-4">
                  {!isWealthMode && freeResult && birthInfo && (
                    <LifeCurveChart
                      data={freeResult.chartPoints}
                      currentAge={new Date().getFullYear() - birthInfo.year}
                      birthYear={birthInfo.year}
                      daYunList={daYunResult?.daYunList}
                    />
                  )}
                  {isWealthMode && wealthResult && birthInfo && (
                    <WealthChart
                      dataPoints={wealthResult.dataPoints}
                      highlights={wealthResult.highlights}
                      wealthRange={wealthResult.wealthRange}
                      isPaid={false}
                    />
                  )}
                </div>

                {/* 八字排盘 - 使用详细的pillarsDetail */}
                {freeResult && birthInfo && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-4">四柱八字</h3>
                    <BaziChartDisplay
                      chart={freeResult.baziChart}
                      showDetails={true}
                      pillarsDetail={baziResult?.pillarsDetail}
                    />
                  </div>
                )}

                {/* 命理总评 */}
                {freeResult && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-gold-400 font-serif text-lg">命理总评</h3>
                      <div className="text-2xl font-mono text-gold-400">{freeResult.summaryScore}分</div>
                    </div>
                    <p className="text-text-primary text-sm leading-relaxed mb-3">{freeResult.summary}</p>
                    {freeResult.currentPhase && (
                      <div className="p-2 rounded-lg bg-gray-800/50 flex items-center gap-2">
                        <span className="text-lg">
                          {freeResult.currentPhase === 'rising' && '📈'}
                          {freeResult.currentPhase === 'peak' && '⭐'}
                          {freeResult.currentPhase === 'stable' && '➡️'}
                          {freeResult.currentPhase === 'declining' && '📉'}
                          {freeResult.currentPhase === 'valley' && '🌙'}
                        </span>
                        <span className="text-sm text-text-secondary">当前运势：</span>
                        <span className="text-gold-400 text-sm">{PHASE_LABELS[freeResult.currentPhase as PhaseType]}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 财富分析 */}
                {wealthResult && isWealthMode && (
                  <div className="mystic-card p-4">
                    <WealthAnalysis analysis={wealthResult.analysis} isPaid={false} />
                  </div>
                )}

                {/* 大运流年 */}
                {daYunResult && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-3">大运流年</h3>
                    <p className="text-xs text-gray-400 mb-3">{daYunResult.startInfo}</p>
                    <div className="flex flex-wrap gap-2">
                      {daYunResult.daYunList.slice(0, 8).map((dy, index) => (
                        <div key={index} className="px-3 py-2 bg-gray-800/50 rounded-lg text-center min-w-[60px]">
                          <div className="text-gold-400 font-medium text-sm">{dy.ganZhi}</div>
                          <div className="text-xs text-gray-500">{dy.startAge}-{dy.endAge}岁</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 五行分析 */}
                {freeResult && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-4">五行生克</h3>
                    <FiveElementsDiagram
                      wood={freeResult.fiveElements.wood}
                      fire={freeResult.fiveElements.fire}
                      earth={freeResult.fiveElements.earth}
                      metal={freeResult.fiveElements.metal}
                      water={freeResult.fiveElements.water}
                    />
                    {freeResult.elementAnalysis && (
                      <div className="mt-6 p-4 rounded-lg bg-black/30 border border-gray-700">
                        <h3 className="text-gold-400 text-sm mb-2 flex items-center gap-2">
                          <span>⚖️</span>
                          <span>五行相克分析</span>
                        </h3>
                        <p className="text-text-primary text-sm leading-relaxed">{freeResult.elementAnalysis}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 八维详批 */}
                {freeResult && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="text-gold-400 font-serif text-lg mb-4">八维详批</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {freeResult.personality && <AnalysisCard title="性格命格" content={freeResult.personality} score={freeResult.personalityScore} icon="🎭" />}
                      {freeResult.career && <AnalysisCard title="事业前程" content={freeResult.career} score={freeResult.careerScore} icon="💼" />}
                      {freeResult.wealth && <AnalysisCard title="财帛运势" content={freeResult.wealth} score={freeResult.wealthScore} icon="💰" />}
                      {freeResult.marriage && <AnalysisCard title="婚姻姻缘" content={freeResult.marriage} score={freeResult.marriageScore} icon="💕" />}
                      {freeResult.health && <AnalysisCard title="健康体质" content={freeResult.health} score={freeResult.healthScore} icon="🏥" />}
                      {freeResult.fengShui && <AnalysisCard title="风水开运" content={freeResult.fengShui} score={freeResult.fengShuiScore} icon="🏠" />}
                      {freeResult.family && <AnalysisCard title="六亲关系" content={freeResult.family} score={freeResult.familyScore} icon="👨‍👩‍👧" />}
                    </div>
                  </div>
                )}

                {/* 日主分析 */}
                {freeResult?.dayMaster && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="font-serif text-xl text-gold-400 mb-4">日主分析</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/30 to-gold-400/30 text-gold-400 font-serif text-xl">
                        {freeResult.dayMaster.stem}{freeResult.dayMaster.element}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                        {freeResult.dayMaster.strength}
                      </span>
                    </div>
                    <p className="text-text-primary leading-relaxed">{freeResult.dayMaster.description}</p>
                    {freeResult.usefulGod && (
                      <div className="mt-4 p-3 rounded-lg bg-mystic-800/50">
                        <span className="text-gold-400 text-sm">用神喜忌：</span>
                        <p className="text-text-secondary text-sm mt-1">{freeResult.usefulGod}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 高光年份 */}
                {freeResult?.highlights && freeResult.highlights.length > 0 && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="font-serif text-xl text-gold-400 mb-4">✦ 高光之年</h3>
                    <div className="space-y-4">
                      {freeResult.highlights.map((h, i) => (
                        <div key={i} className="p-4 rounded-lg bg-gradient-to-r from-gold-400/10 to-transparent border-l-2 border-gold-400">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gold-400 font-mono text-lg">{h.age}岁</span>
                            <span className="text-text-secondary">({h.year}年)</span>
                            {h.type && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gold-400/20 text-gold-400">
                                {TYPE_LABELS[h.type] || h.type}
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-lg text-text-primary mb-1">{h.title}</p>
                          {h.description && (
                            <p className="text-text-secondary text-sm">{h.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 警示年份 */}
                {freeResult?.warnings && freeResult.warnings.length > 0 && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="font-serif text-xl text-kline-down mb-4">◆ 谨慎之年</h3>
                    <div className="space-y-4">
                      {freeResult.warnings.map((w, i) => (
                        <div key={i} className="p-4 rounded-lg bg-kline-down/5 border-l-2 border-kline-down">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-kline-down font-mono text-lg">{w.age}岁</span>
                            <span className="text-text-secondary">({w.year}年)</span>
                            {w.type && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-kline-down/20 text-kline-down">
                                {TYPE_LABELS[w.type] || w.type}
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-lg text-text-primary mb-1">{w.title}</p>
                          {w.description && (
                            <p className="text-text-secondary text-sm mb-2">{w.description}</p>
                          )}
                          {w.advice && (
                            <p className="text-accent-blue text-sm">
                              <span className="text-gold-400">化解之道：</span>{w.advice}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 开运指南 */}
                {freeResult?.luckyInfo && !isWealthMode && (
                  <div className="mystic-card p-4">
                    <h3 className="font-serif text-xl text-gold-400 mb-4">开运指南</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                        <p className="text-2xl mb-2">🧭</p>
                        <p className="text-xs text-text-secondary mb-1">吉利方位</p>
                        <p className="text-purple-300 text-sm">{freeResult.luckyInfo.direction}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                        <p className="text-2xl mb-2">🎨</p>
                        <p className="text-xs text-text-secondary mb-1">幸运颜色</p>
                        <p className="text-purple-300 text-sm">{freeResult.luckyInfo.color}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                        <p className="text-2xl mb-2">🔢</p>
                        <p className="text-xs text-text-secondary mb-1">幸运数字</p>
                        <p className="text-purple-300 text-sm">{freeResult.luckyInfo.number}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-mystic-900/50 text-center">
                        <p className="text-2xl mb-2">💼</p>
                        <p className="text-xs text-text-secondary mb-1">适合行业</p>
                        <p className="text-purple-300 text-sm">{freeResult.luckyInfo.industry}</p>
                      </div>
                    </div>
                    {freeResult.luckyExplanation && (
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30">
                        <h4 className="text-gold-400 text-sm mb-3 flex items-center gap-2">
                          <span>✨</span>
                          <span>开运详解</span>
                        </h4>
                        <p className="text-text-primary text-sm leading-relaxed">{freeResult.luckyExplanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 主播专属区域 */}
        <div className="w-1/2 bg-gray-950 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-purple-400">主播专属区域</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">用户不可见</span>
            </div>

            {scriptLoading ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 animate-pulse">🔮</div>
                <p className="text-purple-400">AI正在生成主播稿子...</p>
                <p className="text-gray-500 text-sm mt-2">根据八字命理深度分析中</p>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : !streamerScript ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎙️</div>
                <p className="text-gray-400">输入用户信息并点击&quot;开始分析&quot;</p>
                <p className="text-gray-500 text-sm mt-2">分析结果将在此处显示主播稿子</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Focus Hint */}
                {focusHint && (
                  <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gold-400 font-medium">{focusHint.label}</span>
                      <span className="text-xs text-gold-400/70 px-2 py-0.5 bg-gold-400/20 rounded">解读侧重</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{focusHint.description}</p>
                  </div>
                )}

                {/* Opening Line */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <h3 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                    <span>🎯</span> 开场白
                  </h3>
                  <p className="text-white leading-relaxed">&quot;{streamerScript.openingLine}&quot;</p>
                </div>

                {/* Emotional Hook */}
                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3">
                  <h3 className="text-pink-400 font-medium mb-2 flex items-center gap-2">
                    <span>💝</span> 共情切入
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{streamerScript.emotionalHook}</p>
                </div>

                {/* Key Points */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <h3 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                    <span>📋</span> 要点速览
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {streamerScript.keyPoints.map((point, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ========== 四维详细分析 ========== */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>🔮</span> 四维详批（有理有据）
                  </h3>

                  {/* 健康分析 */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-red-400 font-medium flex items-center gap-2">
                        <span>🏥</span> {streamerScript.healthAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">{streamerScript.healthAnalysis.baziReason}</span>
                    </div>
                    <p className="text-white font-medium mb-2">&quot;{streamerScript.healthAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.healthAnalysis.details.map((d, i) => (
                        <li key={i} className="text-gray-300 text-sm flex items-start gap-1">
                          <span className="text-red-400">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-red-900/30 rounded p-2 text-xs text-red-200">
                      <strong>建议：</strong>{streamerScript.healthAnalysis.advice}
                    </div>
                  </div>

                  {/* 事业分析 */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-amber-400 font-medium flex items-center gap-2">
                        <span>💼</span> {streamerScript.careerAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">{streamerScript.careerAnalysis.baziReason}</span>
                    </div>
                    <p className="text-white font-medium mb-2">&quot;{streamerScript.careerAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.careerAnalysis.details.map((d, i) => (
                        <li key={i} className="text-gray-300 text-sm flex items-start gap-1">
                          <span className="text-amber-400">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-amber-900/30 rounded p-2 text-xs text-amber-200">
                      <strong>建议：</strong>{streamerScript.careerAnalysis.advice}
                    </div>
                  </div>

                  {/* 感情分析 */}
                  <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-pink-400 font-medium flex items-center gap-2">
                        <span>💕</span> {streamerScript.relationshipAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded">{streamerScript.relationshipAnalysis.baziReason}</span>
                    </div>
                    <p className="text-white font-medium mb-2">&quot;{streamerScript.relationshipAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.relationshipAnalysis.details.map((d, i) => (
                        <li key={i} className="text-gray-300 text-sm flex items-start gap-1">
                          <span className="text-pink-400">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-pink-900/30 rounded p-2 text-xs text-pink-200">
                      <strong>建议：</strong>{streamerScript.relationshipAnalysis.advice}
                    </div>
                  </div>

                  {/* 前程分析 */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-cyan-400 font-medium flex items-center gap-2">
                        <span>🚀</span> {streamerScript.futureAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">{streamerScript.futureAnalysis.baziReason}</span>
                    </div>
                    <p className="text-white font-medium mb-2">&quot;{streamerScript.futureAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.futureAnalysis.details.map((d, i) => (
                        <li key={i} className="text-gray-300 text-sm flex items-start gap-1">
                          <span className="text-cyan-400">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-cyan-900/30 rounded p-2 text-xs text-cyan-200">
                      <strong>建议：</strong>{streamerScript.futureAnalysis.advice}
                    </div>
                  </div>
                </div>

                {/* Talking Points */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <h3 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                    <span>💬</span> 延伸话题
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {streamerScript.talkingPoints.map((point, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Phrases */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <h3 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                    <span>🗣️</span> 金句话术
                  </h3>
                  <div className="space-y-2">
                    {streamerScript.suggestedPhrases.map((phrase, index) => (
                      <div key={index} className="bg-gray-900/50 rounded p-2 text-white text-sm italic border-l-2 border-amber-400">
                        &quot;{phrase}&quot;
                      </div>
                    ))}
                  </div>
                </div>

                {/* Background Knowledge */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
                    <span>📚</span> 背景知识
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{streamerScript.backgroundKnowledge}</p>
                </div>

                {/* Golden Quotes - 命格金句 */}
                {streamerScript.goldenQuotes && streamerScript.goldenQuotes.length > 0 && (
                  <div className="bg-gradient-to-r from-gold-400/10 to-purple-500/10 border border-gold-400/30 rounded-lg p-4">
                    <h3 className="text-gold-400 font-medium mb-3 flex items-center gap-2">
                      <span>✨</span> 命格金句
                      <span className="text-xs text-gray-500 font-normal">（可选择使用）</span>
                    </h3>
                    <div className="space-y-3">
                      {streamerScript.goldenQuotes.map((quote, index) => (
                        <div key={index} className="bg-black/30 rounded-lg p-3 border-l-3 border-gold-400 hover:bg-black/40 transition-colors cursor-pointer">
                          <p className="text-white text-sm leading-relaxed">
                            &quot;{quote}&quot;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出包装组件
export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-gold-400 animate-pulse">加载中...</div>
      </div>
    }>
      <LivePageContent />
    </Suspense>
  );
}
