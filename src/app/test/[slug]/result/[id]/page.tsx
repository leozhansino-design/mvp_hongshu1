'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import Header from '@/components/Header';
import { Footer } from '@/components';
import {
  ENNEAGRAM_TYPE_NAMES,
  ENNEAGRAM_TYPE_ENGLISH_NAMES,
  ENNEAGRAM_TYPE_DESCRIPTIONS,
  WING_NAMES,
} from '@/lib/enneagram';

interface EnneagramReportData {
  mainType: number;
  mainTypeName: string;
  mainTypeEnglishName: string;
  wingType: number;
  wingTypeName: string;
  wingCombinationName: string;
  scores: number[];
  scorePercentages: number[];
  reportLevel: 'basic' | 'full';
}

export default function EnneagramResultPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, id } = params as { slug: string; id: string };

  const [report, setReport] = useState<EnneagramReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/test/result/${id}`);
        const data = await response.json();

        if (data.success) {
          setReport(data.result);
        } else {
          setError(data.error || '获取报告失败');
        }
      } catch (err) {
        setError('网络错误，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">正在分析你的人格特征...</p>
          <p className="text-gray-400 text-sm mt-2">分析 144 道题目的回答</p>
          <p className="text-gray-400 text-sm">计算 9 种人格维度得分</p>
          <p className="text-gray-400 text-sm">生成你的专属人格档案</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '报告不存在'}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const typeDescription = ENNEAGRAM_TYPE_DESCRIPTIONS[report.mainType];

  // 准备雷达图数据
  const radarData = report.scores.map((score, index) => ({
    type: ENNEAGRAM_TYPE_NAMES[index + 1],
    score,
    fullMark: 16,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Header curveMode="life" showModeSelector={false} />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* 返回按钮 */}
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-8">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        {/* 结果标题 */}
        <div className="text-center mb-8">
          <p className="text-gray-500 mb-2">你的九型人格测试结果</p>
          <div className="inline-block bg-white rounded-3xl shadow-lg px-8 py-6">
            <div className="text-5xl mb-2">🧠</div>
            <h1 className="text-3xl font-bold text-gray-900">
              {report.mainType}号 · {report.mainTypeName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {report.mainTypeEnglishName}
            </p>
            <div className="mt-3 px-4 py-1.5 bg-purple-100 rounded-full inline-block">
              <span className="text-purple-700 text-sm font-medium">
                侧翼: {report.mainType}w{report.wingType} {report.wingCombinationName}
              </span>
            </div>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            九维度得分雷达图
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="type"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 16]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Radar
                  name="得分"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}/16`, '得分']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* 得分列表 */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {report.scores.map((score, index) => (
              <div
                key={index}
                className={`text-center py-2 rounded-lg ${
                  index + 1 === report.mainType
                    ? 'bg-purple-100 border border-purple-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-xs text-gray-500">{ENNEAGRAM_TYPE_NAMES[index + 1]}</div>
                <div className={`font-semibold ${
                  index + 1 === report.mainType ? 'text-purple-600' : 'text-gray-700'
                }`}>
                  {score}/16
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 核心特征 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">核心特征</h2>
          <p className="text-gray-600 leading-relaxed">
            {typeDescription.brief}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-red-700 mb-2">核心恐惧</h3>
              <p className="text-sm text-red-600">{typeDescription.coreFear}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-700 mb-2">核心渴望</h3>
              <p className="text-sm text-green-600">{typeDescription.coreDesire}</p>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-700 mb-2">核心动机</h3>
            <p className="text-sm text-blue-600">{typeDescription.coreMotivation}</p>
          </div>
        </div>

        {/* 优缺点 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-500">+</span> 优势
              </h3>
              <ul className="space-y-2">
                {typeDescription.strengths.map((strength, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-orange-500">-</span> 成长空间
              </h3>
              <ul className="space-y-2">
                {typeDescription.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 基础版内容到此为止，完整版解锁更多 */}
        {report.reportLevel === 'basic' && (
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="font-semibold text-lg">解锁完整报告</h3>
            </div>
            <ul className="text-sm text-white/90 space-y-1 mb-4">
              <li>· 2000字深度人格分析</li>
              <li>· 成长方向与建议</li>
              <li>· 人际关系指南</li>
              <li>· 职业发展建议</li>
              <li>· 与其他类型的相处之道</li>
            </ul>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              19.9元 解锁完整版
            </button>
          </div>
        )}

        {/* 完整版内容 */}
        {report.reportLevel === 'full' && (
          <>
            {/* 成长方向 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">成长与压力方向</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-medium text-green-700 mb-2">
                    成长方向 → {typeDescription.growthDirection}号 {ENNEAGRAM_TYPE_NAMES[typeDescription.growthDirection]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    当你状态良好、心理健康时，你会展现出{ENNEAGRAM_TYPE_NAMES[typeDescription.growthDirection]}的积极特质：
                  </p>
                  <ul className="mt-2 text-sm text-green-600">
                    {typeDescription.healthyTraits.map((trait, index) => (
                      <li key={index}>· {trait}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <h3 className="font-medium text-red-700 mb-2">
                    压力方向 → {typeDescription.stressDirection}号 {ENNEAGRAM_TYPE_NAMES[typeDescription.stressDirection]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    当你处于压力、不健康状态时，可能会展现出{ENNEAGRAM_TYPE_NAMES[typeDescription.stressDirection]}的消极特质：
                  </p>
                  <ul className="mt-2 text-sm text-red-600">
                    {typeDescription.unhealthyTraits.map((trait, index) => (
                      <li key={index}>· {trait}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 职业建议 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">职业发展建议</h2>
              <p className="text-gray-600 mb-4">
                基于你的人格特质，以下职业方向可能更适合你：
              </p>
              <div className="flex flex-wrap gap-2">
                {typeDescription.career.map((career, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>

            {/* 人际关系 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">人际关系指南</h2>
              <p className="text-gray-600 leading-relaxed">
                {typeDescription.relationship}
              </p>
            </div>

            {/* 代表人物 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">代表人物</h2>
              <div className="flex flex-wrap gap-2">
                {typeDescription.famousPeople.map((person, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm"
                  >
                    {person}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 分享按钮 */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `我的九型人格是${report.mainType}号${report.mainTypeName}`,
                  text: `我刚完成了九型人格测试，我是${report.mainTypeName}！来测测你是哪种类型？`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('链接已复制到剪贴板');
              }
            }}
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享结果
          </button>
          <Link
            href="/test/enneagram"
            className="px-6 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            再测一次
          </Link>
        </div>

        {/* 免责声明 */}
        <p className="text-center text-gray-400 text-xs mt-8">
          本测试仅供参考，不构成专业心理诊断或建议
        </p>
      </main>

      <Footer />

      {/* 升级弹窗 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              解锁完整报告
            </h3>
            <p className="text-gray-600 text-sm text-center mb-6">
              支付 19.9 元即可获得2000字深度分析报告
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // TODO: 实现微信支付
                  alert('微信支付功能开发中');
                }}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.139.045c.133 0 .241-.108.241-.243 0-.06-.024-.119-.04-.177l-.325-1.233a.492.492 0 01.177-.554c1.525-1.121 2.5-2.772 2.5-4.617 0-3.248-3.09-6.024-7.059-6.128zm-2.467 2.884c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.983.97-.983zm4.842 0c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.983.969-.983z"/>
                </svg>
                微信支付
              </button>
              <button
                onClick={() => {
                  // TODO: 实现支付宝支付
                  alert('支付宝支付功能开发中');
                }}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.422 15.358c-.85-.376-3.073-1.255-4.207-1.7-.149-.059-.32-.13-.476-.17-.176.397-.386.792-.63 1.179-1.173 1.86-2.958 3.164-5.035 3.676a7.46 7.46 0 01-1.88.24c-3.31 0-6.076-2.182-7.02-5.18H.002v5.6c0 2.755 2.243 5 5 5h14c2.757 0 5-2.245 5-5v-3.645h-.58zM19.002 3h-14c-2.757 0-5 2.243-5 5v3.093h2.088c.937-2.885 3.627-4.984 6.816-4.984 1.996 0 3.812.822 5.128 2.143.12.12.235.246.344.377l.964-.808c.378-.317.83-.535 1.314-.635V7h2.346v.186c.434.135.841.342 1.203.612l.897.751V8c0-2.757-2.243-5-5-5v0z"/>
                </svg>
                支付宝支付
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                暂不需要
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
