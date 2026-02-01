'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import { BirthForm, AnalysisLoader, BaziChartDisplay, LifeCurveChart, WealthChart, WealthAnalysis, FiveElementsDiagram } from '@/components';
import { generateCelebrityFreeResult, generateCelebrityWealthCurve } from '@/services/api';
import { BirthInfo, CurveMode, CURVE_MODE_LABELS, FreeVersionResult, WealthCurveData, PHASE_LABELS, PhaseType, TYPE_LABELS } from '@/types';
import { WEALTH_LOADING_MESSAGES } from '@/lib/constants';
import { DaYunItem, calculateDaYun, calculateBazi, BaziResult } from '@/lib/bazi';

// 名人密码
const CELE_PASSWORD = 'celebrity2024';

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

// 名人页面内容组件
function CelePageContent() {
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

  // 分享相关
  const [shareLoading, setShareLoading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

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
    if (password === CELE_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      sessionStorage.setItem('cele_auth', 'true');
    } else {
      setPasswordError('密码错误');
    }
  };

  // 检查 session 认证
  useEffect(() => {
    if (sessionStorage.getItem('cele_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 分享功能
  const handleShare = async () => {
    if (!shareRef.current) return;
    setShareLoading(true);
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `celebrity-${curveMode}-curve-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('生成分享图失败:', error);
      alert('生成分享图失败');
    } finally {
      setShareLoading(false);
    }
  };

  // 提交处理 - 使用名人版API
  const handleSubmit = useCallback(async (info: BirthInfo, _isPaid: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setBirthInfo(info);

    // 清空之前的结果
    setFreeResult(null);
    setWealthResult(null);
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

      // 根据模式调用名人版API
      if (curveMode === 'wealth') {
        const resultWealth = await generateCelebrityWealthCurve(info, false);
        setWealthResult(resultWealth);
      } else {
        const resultFree = await generateCelebrityFreeResult(info);
        setFreeResult(resultFree);
      }

      setIsLoading(false);

    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后再试');
      setIsLoading(false);
    }
  }, [curveMode]);

  // 密码页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100 flex items-center justify-center p-4">
        <div className="apple-card w-full max-w-sm">
          <h1 className="text-2xl font-medium text-apple-gray-600 text-center mb-6">名人数据分析</h1>
          <p className="text-apple-gray-400 text-sm text-center mb-4">专为公众人物数据分析优化</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-apple-gray-500 mb-2">请输入访问密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-apple"
                placeholder="输入密码"
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
              进入名人模式
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 加载中页面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100 flex items-center justify-center">
        <AnalysisLoader
          messages={curveMode === 'wealth' ? WEALTH_LOADING_MESSAGES : undefined}
        />
      </div>
    );
  }

  const isWealthMode = curveMode === 'wealth';
  const hasResult = (isWealthMode && wealthResult) || (!isWealthMode && freeResult);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* 标题和模式切换 */}
        <div className="text-center mb-8">
          <h1 className="font-medium text-4xl text-apple-gray-600 mb-2">
            {CURVE_MODE_LABELS[curveMode]}
          </h1>
          <p className="text-apple-gray-400 text-sm">
            {curveMode === 'life'
              ? '探索发展趋势 · 把握人生节奏'
              : '解析财富趋势 · 掌握增长周期'
            }
          </p>

          {/* 模式切换按钮 */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => {
                setCurveMode('life');
                setFreeResult(null);
                setWealthResult(null);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              <div className="mt-4 p-3 rounded-lg bg-error/5 border border-error/20">
                <p className="text-error text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* 结果展示 */}
        {hasResult && (
          <div ref={shareRef} className="space-y-6">
            {/* 顶部操作栏 */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setFreeResult(null);
                  setWealthResult(null);
                  setBirthInfo(null);
                }}
                className="px-4 py-2 bg-apple-gray-100 text-apple-gray-500 rounded-lg hover:bg-apple-gray-200 transition-colors text-sm"
              >
                ← 重新分析
              </button>
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="px-4 py-2 bg-apple-blue/10 text-apple-blue border border-apple-blue/20 rounded-lg hover:bg-apple-blue/20 transition-colors text-sm"
              >
                {shareLoading ? '生成中...' : '分享图片'}
              </button>
            </div>

            {/* 人生高光时刻 */}
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
              <h3 className="text-apple-blue font-medium text-lg mb-4">
                {CURVE_MODE_LABELS[curveMode]}
              </h3>
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
  );
}

// 导出包装组件
export default function CelePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-apple-blue animate-pulse">加载中...</div>
      </div>
    }>
      <CelePageContent />
    </Suspense>
  );
}
