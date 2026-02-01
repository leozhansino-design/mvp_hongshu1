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
  const color = validScore >= 75 ? '#34c759' : validScore >= 50 ? '#0066cc' : '#ff3b30';

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${size === 'sm' ? 'w-16 h-16' : 'w-20 h-20'}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="50%" cy="50%" r={radius} stroke="#e8e8ed" strokeWidth={strokeWidth} fill="none" />
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
      {label && <span className="text-xs text-apple-gray-400 mt-1">{label}</span>}
    </div>
  );
}

// 分析卡片组件
function AnalysisCard({ title, content, score, icon }: { title: string; content: string; score?: number; icon: string }) {
  return (
    <div className="p-4 rounded-xl bg-apple-gray-50 border border-apple-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-medium text-apple-blue">{title}</h3>
        </div>
        <ScoreRing score={score} label="" size="sm" />
      </div>
      <p className="text-apple-gray-600 text-sm leading-relaxed">{content}</p>
    </div>
  );
}

// 名字脱敏函数 - 保护用户隐私
function maskName(name: string): string {
  if (!name || name.length === 0) return '匿名';
  if (name.length === 1) return name + '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
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
        backgroundColor: '#ffffff',
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
      setError(err instanceof Error ? err.message : '分析失败，请稍后再试');
      setIsLoading(false);
      setScriptLoading(false);
    }
  }, [curveMode]);

  // 密码页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100 flex items-center justify-center p-4">
        <div className="apple-card w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-apple-blue/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-apple-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-apple-gray-600 mb-1">直播分析模式</h1>
            <p className="text-apple-gray-400 text-sm">主播专用入口</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-apple-gray-500 mb-2">访问密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-apple"
                placeholder="请输入密码"
                autoFocus
              />
              {passwordError && (
                <p className="text-error text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 btn-apple rounded-xl"
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
      <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100">
        <div className="flex h-screen">
          {/* 左侧加载动画 */}
          <div className="w-1/2 flex items-center justify-center border-r border-apple-gray-200">
            <AnalysisLoader
              messages={curveMode === 'wealth' ? WEALTH_LOADING_MESSAGES : undefined}
            />
          </div>
          {/* 右侧等待提示 */}
          <div className="w-1/2 flex items-center justify-center bg-apple-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-apple-blue/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-apple-blue font-medium">正在生成分析...</p>
              <p className="text-apple-gray-400 text-sm mt-2">准备主播稿件</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isWealthMode = curveMode === 'wealth';
  const hasResult = (isWealthMode && wealthResult) || (!isWealthMode && freeResult);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100">
      <div className="flex h-screen">
        {/* 左侧 - 用户输入和结果展示区 */}
        <div className="w-1/2 overflow-y-auto border-r border-apple-gray-200 bg-white">
          <div className="p-6">
            {/* 标题和模式切换 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apple-blue/10 border border-apple-blue/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span className="text-apple-blue text-xs font-medium uppercase tracking-wider">直播分析</span>
              </div>
              <h1 className="text-3xl font-semibold text-apple-gray-600 mb-2">
                {curveMode === 'life' ? '人生曲线分析' : '财富曲线分析'}
              </h1>
              <p className="text-apple-gray-400 text-sm">
                {curveMode === 'life'
                  ? '基于个人信息的发展趋势解析'
                  : '多维度财富周期量化分析'
                }
              </p>

              {/* 模式切换按钮 */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setCurveMode('life');
                    setFreeResult(null);
                    setWealthResult(null);
                    setStreamerScript(null);
                  }}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    curveMode === 'life'
                      ? 'bg-apple-blue text-white'
                      : 'bg-apple-gray-100 text-apple-gray-500 hover:bg-apple-gray-200'
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
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    curveMode === 'wealth'
                      ? 'bg-apple-blue text-white'
                      : 'bg-apple-gray-100 text-apple-gray-500 hover:bg-apple-gray-200'
                  }`}
                >
                  财富曲线
                </button>
              </div>
            </div>

            {/* 输入表单 */}
            {!hasResult && (
              <div className="apple-card max-w-md mx-auto">
                <BirthForm
                  onSubmit={handleSubmit}
                  disabled={isLoading}
                  remainingUsage={999}
                  points={99999}
                  detailedPrice={200}
                />

                {error && (
                  <div className="mt-4 p-3 rounded-xl bg-error/5 border border-error/20">
                    <p className="text-error text-sm text-center">{error}</p>
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
                    className="px-4 py-2 bg-apple-gray-100 text-apple-gray-500 rounded-xl hover:bg-apple-gray-200 transition-colors text-sm"
                  >
                    ← 重新分析
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="px-4 py-2 bg-apple-blue/10 text-apple-blue border border-apple-blue/20 rounded-xl hover:bg-apple-blue/20 transition-colors text-sm"
                  >
                    {shareLoading ? '生成中...' : '导出图片'}
                  </button>
                </div>

                {/* 人生高光时刻 - 最优先显示 */}
                {freeResult?.highlightMoment && !isWealthMode && (
                  <div className="apple-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">🌟</div>
                      <div className="flex-1">
                        <h3 className="text-apple-blue font-medium text-lg mb-2">人生高光时刻</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full bg-apple-blue/10 text-apple-blue text-sm font-mono">
                            {freeResult.highlightMoment.age}岁
                          </span>
                          <span className="text-apple-gray-400 text-sm">· {freeResult.highlightMoment.title}</span>
                        </div>
                        <p className="text-apple-gray-600 leading-relaxed text-sm">{freeResult.highlightMoment.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 财富高光 */}
                {wealthResult && isWealthMode && (
                  <div className="apple-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">💰</div>
                      <div className="flex-1">
                        <h3 className="text-apple-blue font-medium text-lg mb-2">财富巅峰</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full bg-apple-blue/10 text-apple-blue text-sm font-mono">
                            {wealthResult.highlights.peakAge}岁
                          </span>
                          <span className="text-apple-gray-400 text-sm">· {wealthResult.wealthType}</span>
                        </div>
                        <p className="text-apple-gray-600 leading-relaxed text-sm">
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
                <div className="apple-card p-4">
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

                {/* 综合分析图表 */}
                {freeResult && birthInfo && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="text-apple-blue font-medium text-lg mb-4">综合数据</h3>
                    <BaziChartDisplay
                      chart={freeResult.baziChart}
                      showDetails={true}
                      pillarsDetail={baziResult?.pillarsDetail}
                    />
                  </div>
                )}

                {/* 综合总评 */}
                {freeResult && !isWealthMode && (
                  <div className="apple-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-apple-blue font-medium text-lg">综合评分</h3>
                      <div className="text-2xl font-mono text-apple-blue">{freeResult.summaryScore}分</div>
                    </div>
                    <p className="text-apple-gray-600 text-sm leading-relaxed mb-3">{freeResult.summary}</p>
                    {freeResult.currentPhase && (
                      <div className="p-2 rounded-lg bg-apple-gray-100 flex items-center gap-2">
                        <span className="text-lg">
                          {freeResult.currentPhase === 'rising' && '📈'}
                          {freeResult.currentPhase === 'peak' && '⭐'}
                          {freeResult.currentPhase === 'stable' && '➡️'}
                          {freeResult.currentPhase === 'declining' && '📉'}
                          {freeResult.currentPhase === 'valley' && '🌙'}
                        </span>
                        <span className="text-sm text-apple-gray-400">当前趋势：</span>
                        <span className="text-apple-blue text-sm">{PHASE_LABELS[freeResult.currentPhase as PhaseType]}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 财富分析 */}
                {wealthResult && isWealthMode && (
                  <div className="apple-card p-4">
                    <WealthAnalysis analysis={wealthResult.analysis} isPaid={false} />
                  </div>
                )}

                {/* 周期分析 */}
                {daYunResult && (
                  <div className="apple-card p-4">
                    <h3 className="text-apple-blue font-medium text-lg mb-3">周期分析</h3>
                    <p className="text-xs text-apple-gray-400 mb-3">{daYunResult.startInfo}</p>
                    <div className="flex flex-wrap gap-2">
                      {daYunResult.daYunList.slice(0, 8).map((dy, index) => (
                        <div key={index} className="px-3 py-2 bg-apple-gray-100 rounded-lg text-center min-w-[60px]">
                          <div className="text-apple-blue font-medium text-sm">{dy.ganZhi}</div>
                          <div className="text-xs text-apple-gray-400">{dy.startAge}-{dy.endAge}岁</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 元素分析 */}
                {freeResult && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="text-apple-blue font-medium text-lg mb-4">元素分析</h3>
                    <FiveElementsDiagram
                      wood={freeResult.fiveElements.wood}
                      fire={freeResult.fiveElements.fire}
                      earth={freeResult.fiveElements.earth}
                      metal={freeResult.fiveElements.metal}
                      water={freeResult.fiveElements.water}
                    />
                    {freeResult.elementAnalysis && (
                      <div className="mt-6 p-4 rounded-lg bg-apple-gray-50 border border-apple-gray-200">
                        <h3 className="text-apple-blue text-sm mb-2 flex items-center gap-2">
                          <span>⚖️</span>
                          <span>元素平衡分析</span>
                        </h3>
                        <p className="text-apple-gray-600 text-sm leading-relaxed">{freeResult.elementAnalysis}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 多维度分析 */}
                {freeResult && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="text-apple-blue font-medium text-lg mb-4">多维度分析</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {freeResult.personality && <AnalysisCard title="性格特点" content={freeResult.personality} score={freeResult.personalityScore} icon="🎭" />}
                      {freeResult.career && <AnalysisCard title="事业发展" content={freeResult.career} score={freeResult.careerScore} icon="💼" />}
                      {freeResult.wealth && <AnalysisCard title="财富趋势" content={freeResult.wealth} score={freeResult.wealthScore} icon="💰" />}
                      {freeResult.marriage && <AnalysisCard title="感情生活" content={freeResult.marriage} score={freeResult.marriageScore} icon="💕" />}
                      {freeResult.health && <AnalysisCard title="健康状况" content={freeResult.health} score={freeResult.healthScore} icon="🏥" />}
                      {freeResult.fengShui && <AnalysisCard title="环境建议" content={freeResult.fengShui} score={freeResult.fengShuiScore} icon="🏠" />}
                      {freeResult.family && <AnalysisCard title="人际关系" content={freeResult.family} score={freeResult.familyScore} icon="👨‍👩‍👧" />}
                    </div>
                  </div>
                )}

                {/* 核心特质分析 */}
                {freeResult?.dayMaster && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="font-medium text-xl text-apple-blue mb-4">核心特质</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-2 rounded-lg bg-apple-blue/10 text-apple-blue font-medium text-xl">
                        {freeResult.dayMaster.stem}{freeResult.dayMaster.element}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-apple-gray-100 text-apple-gray-500 text-sm">
                        {freeResult.dayMaster.strength}
                      </span>
                    </div>
                    <p className="text-apple-gray-600 leading-relaxed">{freeResult.dayMaster.description}</p>
                    {freeResult.usefulGod && (
                      <div className="mt-4 p-3 rounded-lg bg-apple-gray-50">
                        <span className="text-apple-blue text-sm">优势方向：</span>
                        <p className="text-apple-gray-500 text-sm mt-1">{freeResult.usefulGod}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 高光年份 */}
                {freeResult?.highlights && freeResult.highlights.length > 0 && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="font-medium text-xl text-success mb-4">机遇年份</h3>
                    <div className="space-y-4">
                      {freeResult.highlights.map((h, i) => (
                        <div key={i} className="p-4 rounded-lg bg-success/5 border-l-2 border-success">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-success font-mono text-lg">{h.age}岁</span>
                            <span className="text-apple-gray-400">({h.year}年)</span>
                            {h.type && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success">
                                {TYPE_LABELS[h.type] || h.type}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-lg text-apple-gray-600 mb-1">{h.title}</p>
                          {h.description && (
                            <p className="text-apple-gray-400 text-sm">{h.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 警示年份 */}
                {freeResult?.warnings && freeResult.warnings.length > 0 && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="font-medium text-xl text-warning mb-4">注意年份</h3>
                    <div className="space-y-4">
                      {freeResult.warnings.map((w, i) => (
                        <div key={i} className="p-4 rounded-lg bg-warning/5 border-l-2 border-warning">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-warning font-mono text-lg">{w.age}岁</span>
                            <span className="text-apple-gray-400">({w.year}年)</span>
                            {w.type && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-warning/10 text-warning">
                                {TYPE_LABELS[w.type] || w.type}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-lg text-apple-gray-600 mb-1">{w.title}</p>
                          {w.description && (
                            <p className="text-apple-gray-400 text-sm mb-2">{w.description}</p>
                          )}
                          {w.advice && (
                            <p className="text-apple-blue text-sm">
                              <span className="font-medium">建议：</span>{w.advice}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 优势指南 */}
                {freeResult?.luckyInfo && !isWealthMode && (
                  <div className="apple-card p-4">
                    <h3 className="font-medium text-xl text-apple-blue mb-4">优势指南</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-apple-gray-50 text-center">
                        <p className="text-2xl mb-2">🧭</p>
                        <p className="text-xs text-apple-gray-400 mb-1">有利方位</p>
                        <p className="text-apple-gray-600 text-sm">{freeResult.luckyInfo.direction}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-apple-gray-50 text-center">
                        <p className="text-2xl mb-2">🎨</p>
                        <p className="text-xs text-apple-gray-400 mb-1">幸运颜色</p>
                        <p className="text-apple-gray-600 text-sm">{freeResult.luckyInfo.color}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-apple-gray-50 text-center">
                        <p className="text-2xl mb-2">🔢</p>
                        <p className="text-xs text-apple-gray-400 mb-1">幸运数字</p>
                        <p className="text-apple-gray-600 text-sm">{freeResult.luckyInfo.number}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-apple-gray-50 text-center">
                        <p className="text-2xl mb-2">💼</p>
                        <p className="text-xs text-apple-gray-400 mb-1">适合行业</p>
                        <p className="text-apple-gray-600 text-sm">{freeResult.luckyInfo.industry}</p>
                      </div>
                    </div>
                    {freeResult.luckyExplanation && (
                      <div className="mt-6 p-4 rounded-lg bg-apple-blue/5 border border-apple-blue/10">
                        <h4 className="text-apple-blue text-sm mb-3 flex items-center gap-2">
                          <span>✨</span>
                          <span>详细说明</span>
                        </h4>
                        <p className="text-apple-gray-600 text-sm leading-relaxed">{freeResult.luckyExplanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 主播专属区域 */}
        <div className="w-1/2 bg-apple-gray-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-apple-gray-600">主播专属区域</h2>
              <span className="text-xs text-apple-gray-400 bg-apple-gray-200 px-2 py-1 rounded">用户不可见</span>
            </div>

            {scriptLoading ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 animate-pulse">📝</div>
                <p className="text-apple-blue">AI正在生成主播稿子...</p>
                <p className="text-apple-gray-400 text-sm mt-2">深度分析中</p>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : !streamerScript ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎙️</div>
                <p className="text-apple-gray-500">输入用户信息并点击&quot;开始分析&quot;</p>
                <p className="text-apple-gray-400 text-sm mt-2">分析结果将在此处显示主播稿子</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Focus Hint */}
                {focusHint && (
                  <div className="bg-apple-blue/5 border border-apple-blue/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-apple-blue font-medium">{focusHint.label}</span>
                      <span className="text-xs text-apple-blue/70 px-2 py-0.5 bg-apple-blue/10 rounded">解读侧重</span>
                    </div>
                    <p className="text-apple-gray-500 text-sm mt-1">{focusHint.description}</p>
                  </div>
                )}

                {/* Opening Line */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                  <h3 className="text-purple-600 font-medium mb-2 flex items-center gap-2">
                    <span>🎯</span> 开场白
                  </h3>
                  <p className="text-apple-gray-600 leading-relaxed">&quot;{streamerScript.openingLine}&quot;</p>
                </div>

                {/* Emotional Hook */}
                <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3">
                  <h3 className="text-pink-600 font-medium mb-2 flex items-center gap-2">
                    <span>💝</span> 共情切入
                  </h3>
                  <p className="text-apple-gray-500 text-sm leading-relaxed">{streamerScript.emotionalHook}</p>
                </div>

                {/* Key Points */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <h3 className="text-blue-600 font-medium mb-2 flex items-center gap-2">
                    <span>📋</span> 要点速览
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {streamerScript.keyPoints.map((point, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ========== 四维详细分析 ========== */}
                <div className="border-t border-apple-gray-200 pt-4">
                  <h3 className="text-lg font-bold text-apple-gray-600 mb-4 flex items-center gap-2">
                    <span>📊</span> 四维详细分析
                  </h3>

                  {/* 健康分析 */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-red-600 font-medium flex items-center gap-2">
                        <span>🏥</span> {streamerScript.healthAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-500 rounded">{streamerScript.healthAnalysis.baziReason}</span>
                    </div>
                    <p className="text-apple-gray-600 font-medium mb-2">&quot;{streamerScript.healthAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.healthAnalysis.details.map((d, i) => (
                        <li key={i} className="text-apple-gray-500 text-sm flex items-start gap-1">
                          <span className="text-red-500">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-red-500/5 rounded p-2 text-xs text-red-600">
                      <strong>建议：</strong>{streamerScript.healthAnalysis.advice}
                    </div>
                  </div>

                  {/* 事业分析 */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-amber-600 font-medium flex items-center gap-2">
                        <span>💼</span> {streamerScript.careerAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded">{streamerScript.careerAnalysis.baziReason}</span>
                    </div>
                    <p className="text-apple-gray-600 font-medium mb-2">&quot;{streamerScript.careerAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.careerAnalysis.details.map((d, i) => (
                        <li key={i} className="text-apple-gray-500 text-sm flex items-start gap-1">
                          <span className="text-amber-500">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-amber-500/5 rounded p-2 text-xs text-amber-600">
                      <strong>建议：</strong>{streamerScript.careerAnalysis.advice}
                    </div>
                  </div>

                  {/* 感情分析 */}
                  <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-pink-600 font-medium flex items-center gap-2">
                        <span>💕</span> {streamerScript.relationshipAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-pink-500/10 text-pink-600 rounded">{streamerScript.relationshipAnalysis.baziReason}</span>
                    </div>
                    <p className="text-apple-gray-600 font-medium mb-2">&quot;{streamerScript.relationshipAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.relationshipAnalysis.details.map((d, i) => (
                        <li key={i} className="text-apple-gray-500 text-sm flex items-start gap-1">
                          <span className="text-pink-500">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-pink-500/5 rounded p-2 text-xs text-pink-600">
                      <strong>建议：</strong>{streamerScript.relationshipAnalysis.advice}
                    </div>
                  </div>

                  {/* 前程分析 */}
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-cyan-600 font-medium flex items-center gap-2">
                        <span>🚀</span> {streamerScript.futureAnalysis.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-600 rounded">{streamerScript.futureAnalysis.baziReason}</span>
                    </div>
                    <p className="text-apple-gray-600 font-medium mb-2">&quot;{streamerScript.futureAnalysis.mainPoint}&quot;</p>
                    <ul className="space-y-1 mb-2">
                      {streamerScript.futureAnalysis.details.map((d, i) => (
                        <li key={i} className="text-apple-gray-500 text-sm flex items-start gap-1">
                          <span className="text-cyan-500">▸</span>{d}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-cyan-500/5 rounded p-2 text-xs text-cyan-600">
                      <strong>建议：</strong>{streamerScript.futureAnalysis.advice}
                    </div>
                  </div>
                </div>

                {/* Talking Points */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <h3 className="text-green-600 font-medium mb-2 flex items-center gap-2">
                    <span>💬</span> 延伸话题
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {streamerScript.talkingPoints.map((point, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Phrases */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <h3 className="text-amber-600 font-medium mb-2 flex items-center gap-2">
                    <span>🗣️</span> 金句话术
                  </h3>
                  <div className="space-y-2">
                    {streamerScript.suggestedPhrases.map((phrase, index) => (
                      <div key={index} className="bg-white rounded p-2 text-apple-gray-600 text-sm italic border-l-2 border-amber-500 shadow-sm">
                        &quot;{phrase}&quot;
                      </div>
                    ))}
                  </div>
                </div>

                {/* Background Knowledge */}
                <div className="bg-apple-gray-100 border border-apple-gray-200 rounded-lg p-3">
                  <h3 className="text-apple-gray-500 font-medium mb-2 flex items-center gap-2">
                    <span>📚</span> 背景知识
                  </h3>
                  <p className="text-apple-gray-500 text-xs leading-relaxed">{streamerScript.backgroundKnowledge}</p>
                </div>

                {/* Golden Quotes - 精选金句 */}
                {streamerScript.goldenQuotes && streamerScript.goldenQuotes.length > 0 && (
                  <div className="bg-apple-blue/5 border border-apple-blue/20 rounded-lg p-4">
                    <h3 className="text-apple-blue font-medium mb-3 flex items-center gap-2">
                      <span>✨</span> 精选金句
                      <span className="text-xs text-apple-gray-400 font-normal">（可选择使用）</span>
                    </h3>
                    <div className="space-y-3">
                      {streamerScript.goldenQuotes.map((quote, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border-l-3 border-apple-blue hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-apple-gray-600 text-sm leading-relaxed">
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

        {/* 人生曲线分享图隐藏区域 */}
        {freeResult && birthInfo && (
          <div ref={shareRef} className="fixed -left-[9999px] w-[750px] bg-gradient-to-b from-white to-apple-gray-100" style={{ aspectRatio: '3/4' }}>
            <div className="p-6 flex flex-col h-full">
              {/* 头部标题 */}
              <div className="text-center mb-4">
                <p className="text-apple-blue text-2xl font-bold mb-1">🌟 人生曲线</p>
                <p className="text-apple-gray-500 text-base">{maskName(birthInfo.name || '')} · {birthInfo.gender === 'male' ? '乾造' : '坤造'}</p>
                <p className="text-apple-gray-400 text-xs">{birthInfo.year}年生</p>
              </div>

              {/* 人生曲线图 */}
              <div className="bg-white rounded-2xl p-3 mb-4 flex-shrink-0 border border-apple-gray-200">
                <LifeCurveChart
                  data={freeResult.chartPoints}
                  currentAge={new Date().getFullYear() - birthInfo.year}
                  birthYear={birthInfo.year}
                />
              </div>

              {/* 高光时刻 */}
              {freeResult.highlightMoment && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span>
                    <span className="text-amber-700 font-bold text-lg">人生高光时刻</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                      {freeResult.highlightMoment.age}岁
                    </span>
                  </div>
                  <p className="text-apple-gray-600 leading-relaxed">{freeResult.highlightMoment.description}</p>
                </div>
              )}

              {/* 综合评分 */}
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="text-center">
                  <p className="text-apple-gray-400 text-sm mb-1">综合评分</p>
                  <p className="text-apple-blue text-3xl font-bold">{freeResult.summaryScore}分</p>
                </div>
              </div>

              {/* 底部网址 */}
              <div className="text-center pt-2 pb-1 mt-auto">
                <p className="text-apple-blue text-2xl font-bold tracking-wider">lifecurve.cn</p>
                <p className="text-apple-gray-400 text-xs mt-1">测算你的人生曲线</p>
              </div>
            </div>
          </div>
        )}

        {/* 财富曲线分享图隐藏区域 */}
        {wealthResult && birthInfo && (
          <div ref={wealthShareRef} className="fixed -left-[9999px] w-[750px] bg-gradient-to-b from-black via-gray-900 to-black" style={{ aspectRatio: '3/4' }}>
            <div className="p-6 flex flex-col h-full">
              {/* 头部标题 */}
              <div className="text-center mb-4">
                <p className="text-gold-400 text-2xl font-bold mb-1">💰 财富曲线</p>
                <p className="text-text-secondary text-base">{maskName(birthInfo.name || '')} · {birthInfo.gender === 'male' ? '乾造' : '坤造'}</p>
                <p className="text-text-secondary/70 text-xs">{birthInfo.year}年生</p>
              </div>

              {/* 财富曲线图 */}
              <div className="bg-black/40 rounded-2xl p-3 mb-4 flex-shrink-0">
                <WealthChart
                  dataPoints={wealthResult.dataPoints}
                  highlights={wealthResult.highlights}
                  wealthRange={wealthResult.wealthRange}
                  isPaid={false}
                  hideUpgradePrompt={true}
                />
              </div>

              {/* 财富巅峰和类型 */}
              <div className="flex items-center justify-center gap-6 mb-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm">财富巅峰</span>
                  <span className="text-gold-400 text-xl font-bold">
                    {wealthResult.highlights.peakWealth >= 10000
                      ? '突破一亿'
                      : `${Math.round(wealthResult.highlights.peakWealth)}万`
                    }
                  </span>
                  <span className="text-text-secondary text-xs">({wealthResult.highlights.peakAge}岁)</span>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm">财富类型</span>
                  <span className="text-gold-400 text-lg font-bold">{wealthResult.wealthType}</span>
                </div>
              </div>

              {/* 财富高光文案 */}
              <div className="bg-gold-400/10 border border-gold-400/30 rounded-xl p-4 mb-4 flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🌟</span>
                  <span className="text-gold-400 font-bold text-lg">财富高光时刻</span>
                </div>
                <p className="text-text-primary leading-relaxed">
                  {wealthResult.highlights.peakAge}岁将是你的财富巅峰期，预计身价约{wealthResult.highlights.peakWealth >= 10000 ? '突破一亿' : `${Math.round(wealthResult.highlights.peakWealth)}万`}。{wealthResult.wealthType}类型的你，适合稳健投资与长期积累。
                </p>
              </div>

              {/* 底部网址 */}
              <div className="text-center pt-2 pb-1 mt-auto">
                <p className="text-gold-400 text-2xl font-bold tracking-wider">lifecurve.cn</p>
                <p className="text-text-secondary/60 text-xs mt-1">测算你的财富曲线</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 导出包装组件
export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-apple-blue animate-pulse">加载中...</div>
      </div>
    }>
      <LivePageContent />
    </Suspense>
  );
}
