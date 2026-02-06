'use client';

import React, { useState } from 'react';
import { EnneagramResult } from '@/lib/enneagram';
import { getEnneagramReportData } from '@/data/enneagramReportData';
import { ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';

interface EnneagramReportProps {
  result: EnneagramResult;
  userName?: string;
}

/**
 * 九型人格专业测试报告 - 10+页精美设计
 * 完全前端渲染，无需AI
 */
export default function EnneagramReport({ result, userName = '用户' }: EnneagramReportProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const reportData = getEnneagramReportData(result.mainType);

  if (!reportData) {
    return <div className="text-center py-12 text-red-500">报告数据加载失败</div>;
  }

  const wingType = result.wingType ? `${result.mainType}w${result.wingType}` : null;
  const wingTypeData = wingType && reportData.wings[wingType] ? reportData.wings[wingType] : null;

  // 10+页报告内容
  const pages = [
    // 第1页：封面
    <ReportCover
      key="cover"
      userName={userName}
      typeName={reportData.name}
      subtitle={reportData.subtitle}
      type={result.mainType}
    />,

    // 第2页：你的人格类型总览
    <TypeOverview
      key="overview"
      data={reportData}
      result={result}
      wingTypeData={wingTypeData}
    />,

    // 第3页：核心特质与内心世界
    <CoreTraits
      key="core"
      data={reportData}
    />,

    // 第4页：9维雷达图与分数
    <RadarChart
      key="radar"
      result={result}
    />,

    // 第5页：优势与挑战
    <StrengthsWeaknesses
      key="strengths"
      data={reportData}
    />,

    // 第6页：成长路径
    <GrowthPath
      key="growth"
      data={reportData}
    />,

    // 第7页：压力与成长方向
    <StressGrowthDirection
      key="stress-growth"
      data={reportData}
      result={result}
    />,

    // 第8页：人际关系指南
    <Relationships
      key="relationships"
      data={reportData}
    />,

    // 第9页：沟通风格
    <Communication
      key="communication"
      data={reportData}
    />,

    // 第10页：职业发展
    <CareerDevelopment
      key="career"
      data={reportData}
    />,

    // 第11页：生活建议
    <LifeSuggestions
      key="life"
      data={reportData}
    />,

    // 第12页：名人与金句
    <FamousQuotes
      key="famous"
      data={reportData}
    />,
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">九型人格专业报告</span>
            <span className="text-gray-400">·</span>
            <span>第 {currentPage + 1} / {pages.length} 页</span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>
        </div>
      </div>

      {/* 报告内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[800px] relative">
          {/* 当前页面内容 */}
          <div className="p-8 md:p-12">
            {pages[currentPage]}
          </div>

          {/* 页码指示器 */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPage
                    ? 'bg-blue-500 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            上一页
          </button>
          <div className="text-sm text-gray-500">
            {currentPage + 1} / {pages.length}
          </div>
          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ 各页面组件 ============

// 第1页：封面
function ReportCover({ userName, typeName, subtitle, type }: any) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8'];
  const color = colors[type - 1] || colors[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[700px] text-center">
      <div className="mb-8 relative">
        <div
          className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-5xl font-bold shadow-2xl"
          style={{ backgroundColor: color }}
        >
          {type}
        </div>
        <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          专业版
        </div>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-3">
        九型人格测试报告
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        {userName} 的人格分析
      </p>

      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-6 rounded-2xl shadow-lg mb-6">
        <div className="text-sm opacity-90 mb-2">您的主要人格类型</div>
        <div className="text-3xl font-bold mb-1">{typeName}</div>
        <div className="text-sm opacity-90">{subtitle}</div>
      </div>

      <div className="text-gray-500 text-sm space-y-1">
        <p>专业深度分析 · 12页完整报告</p>
        <p>生成日期：{new Date().toLocaleDateString('zh-CN')}</p>
      </div>
    </div>
  );
}

// 第2页：人格类型总览
function TypeOverview({ data, result, wingTypeData }: any) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8'];
  const color = colors[data.type - 1] || colors[0];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
          第2页 · 人格类型总览
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {data.name}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {data.subtitle}
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">核心概述</h3>
        <p className="text-gray-700 leading-relaxed">
          {data.deepDescription.overview}
        </p>
      </div>

      {wingTypeData && (
        <div className="border-l-4 pl-4" style={{ borderColor: color }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            您的侧翼：{wingTypeData.name}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {wingTypeData.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium mb-1">核心恐惧</div>
          <div className="text-gray-900">{data.coreTraits.fear}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">核心渴望</div>
          <div className="text-gray-900">{data.coreTraits.desire}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">核心动机</div>
          <div className="text-gray-900">{data.coreTraits.motivation}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">情绪陷阱</div>
          <div className="text-gray-900">{data.coreTraits.trap}</div>
        </div>
      </div>
    </div>
  );
}

// 第3页：核心特质与内心世界
function CoreTraits({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第3页 · 深度解析
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">内心世界探索</h2>
      </div>

      <div className="space-y-5">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            内心世界
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.deepDescription.innerWorld}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            行为模式
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.deepDescription.behavior}
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            情绪模式
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.deepDescription.emotionalPattern}
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-amber-800">
          <strong>💡 深度洞察：</strong>理解这些模式是自我成长的第一步。接纳真实的自己，才能走向更好的自己。
        </p>
      </div>
    </div>
  );
}

// 第4页：9维雷达图
function RadarChart({ result }: any) {
  const typeColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8'];
  const typeNames = ['完美主义者', '给予者', '成就者', '浪漫主义者', '观察者', '忠诚者', '享乐主义者', '挑战者', '和平主义者'];

  const maxScore = Math.max(...result.scores);

  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第4页 · 九维分析
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">九型人格分数</h2>
        <p className="text-gray-600">以下是您在九种人格类型上的得分情况</p>
      </div>

      {/* 雷达图可视化（简化版） */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
        <div className="relative aspect-square max-w-md mx-auto">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* 背景网格圆圈 */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="100" cy="100" r="20" fill="none" stroke="#e5e7eb" strokeWidth="1" />

            {/* 轴线 */}
            {[...Array(9)].map((_, i) => {
              const angle = (i * 40 - 90) * Math.PI / 180;
              const x = 100 + 80 * Math.cos(angle);
              const y = 100 + 80 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={x}
                  y2={y}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
              );
            })}

            {/* 数据多边形 */}
            <polygon
              points={result.scores.map((score: number, i: number) => {
                const angle = (i * 40 - 90) * Math.PI / 180;
                const radius = (score / maxScore) * 80;
                const x = 100 + radius * Math.cos(angle);
                const y = 100 + radius * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ')}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="2"
            />

            {/* 数据点 */}
            {result.scores.map((score: number, i: number) => {
              const angle = (i * 40 - 90) * Math.PI / 180;
              const radius = (score / maxScore) * 80;
              const x = 100 + radius * Math.cos(angle);
              const y = 100 + radius * Math.sin(angle);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={typeColors[i]}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* 分数列表 */}
      <div className="space-y-2">
        {result.scores.map((score: number, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600">
              {index + 1}号-{typeNames[index]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="h-full flex items-center justify-end px-2 text-white text-sm font-medium transition-all"
                style={{
                  width: `${(score / maxScore) * 100}%`,
                  backgroundColor: typeColors[index]
                }}
              >
                {score > maxScore * 0.3 && score}
              </div>
            </div>
            <div className="w-12 text-right text-sm font-medium text-gray-900">
              {score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 第5页：优势与挑战
function StrengthsWeaknesses({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第5页 · 优势与挑战
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">认识自己的光与影</h2>
        <p className="text-gray-600">每种人格都有其独特的优势和需要成长的领域</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 优势 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            核心优势
          </h3>
          <ul className="space-y-3">
            {data.strengths.map((strength: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-1">●</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 挑战 */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            成长挑战
          </h3>
          <ul className="space-y-3">
            {data.weaknesses.map((weakness: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-orange-500 mt-1">●</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 成长提示：</strong>优势是你的天赋，但过度使用也可能成为弱点。挑战是成长的方向，接纳并努力改善，你会变得更加完整和平衡。
        </p>
      </div>
    </div>
  );
}

// 第6页：成长路径
function GrowthPath({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第6页 · 成长路径
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">从当下到更好的自己</h2>
        <p className="text-gray-600">了解不同状态下的自己，找到成长的方向</p>
      </div>

      {/* 健康状态 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          健康状态 - 最佳的你
        </h3>
        <ul className="space-y-2">
          {data.growthPath.healthy.map((item: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 一般状态 */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          一般状态 - 日常的你
        </h3>
        <ul className="space-y-2">
          {data.growthPath.average.map((item: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 不健康状态 */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          压力状态 - 需要警惕
        </h3>
        <ul className="space-y-2">
          {data.growthPath.unhealthy.map((item: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">!</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 第7页：压力与成长方向
function StressGrowthDirection({ data, result }: any) {
  const typeNames = ['', '完美主义者', '给予者', '成就者', '浪漫主义者', '观察者', '忠诚者', '享乐主义者', '挑战者', '和平主义者'];

  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第7页 · 动态变化
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">压力与成长的动态</h2>
        <p className="text-gray-600">在不同状态下，你会呈现出不同类型的特征</p>
      </div>

      {/* 压力方向 */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl font-bold">
            {result.mainType}
          </div>
          <div className="text-2xl text-red-400">→</div>
          <div className="w-12 h-12 rounded-full bg-red-400 text-white flex items-center justify-center text-xl font-bold">
            {data.stressAndGrowth.stressDirection}
          </div>
          <div className="flex-1">
            <div className="text-sm text-red-600 font-medium">压力方向</div>
            <div className="text-gray-900">{typeNames[data.stressAndGrowth.stressDirection]}</div>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {data.stressAndGrowth.stressBehavior}
        </p>
        <div className="mt-4 bg-white rounded-lg p-3">
          <p className="text-sm text-gray-700">
            <strong>应对建议：</strong>当你发现自己出现这些行为时，说明你正处于压力之下。这时需要放慢节奏，关注自我照顾，寻求支持。
          </p>
        </div>
      </div>

      {/* 成长方向 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold">
            {result.mainType}
          </div>
          <div className="text-2xl text-green-400">→</div>
          <div className="w-12 h-12 rounded-full bg-green-400 text-white flex items-center justify-center text-xl font-bold">
            {data.stressAndGrowth.growthDirection}
          </div>
          <div className="flex-1">
            <div className="text-sm text-green-600 font-medium">成长方向</div>
            <div className="text-gray-900">{typeNames[data.stressAndGrowth.growthDirection]}</div>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {data.stressAndGrowth.growthBehavior}
        </p>
        <div className="mt-4 bg-white rounded-lg p-3">
          <p className="text-sm text-gray-700">
            <strong>成长建议：</strong>主动学习和模仿这个类型的健康特质，会帮助你突破限制，成为更好的自己。
          </p>
        </div>
      </div>
    </div>
  );
}

// 第8页：人际关系
function Relationships({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第8页 · 人际关系
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">关系中的你</h2>
        <p className="text-gray-600">了解你在不同关系中的模式和建议</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">💕</span>
            恋爱关系
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.relationships.romantic}
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            友谊
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.relationships.friendship}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">💼</span>
            职场关系
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.relationships.workplace}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
            家庭关系
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {data.relationships.family}
          </p>
        </div>
      </div>
    </div>
  );
}

// 第9页：沟通风格
function Communication({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第9页 · 沟通风格
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">你的沟通方式</h2>
        <p className="text-gray-600">理解并优化你的沟通模式</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">沟通风格</h3>
        <p className="text-gray-700 leading-relaxed">
          {data.communication.style}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">✓</span>
            你偏好的沟通方式
          </h3>
          <ul className="space-y-2">
            {data.communication.preferences.map((pref: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-1">●</span>
                <span>{pref}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            沟通改善建议
          </h3>
          <ul className="space-y-2">
            {data.communication.tips.map((tip: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-blue-500 mt-1">●</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>💡 沟通秘诀：</strong>有效的沟通不仅是表达自己，更是理解他人。当你能够识别并适应不同人的沟通风格时，你的人际关系会更加和谐。
        </p>
      </div>
    </div>
  );
}

// 第10页：职业发展
function CareerDevelopment({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第10页 · 职业发展
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">职业道路指南</h2>
        <p className="text-gray-600">发挥你的天赋，实现职业成功</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          适合的职业方向
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.career.suitable.map((career: string, index: number) => (
            <span key={index} className="px-3 py-1.5 bg-white rounded-lg text-gray-700 text-sm border border-gray-200">
              {career}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">✨</span>
            职场优势
          </h3>
          <ul className="space-y-2">
            {data.career.strengths.map((strength: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-1">●</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            职场挑战
          </h3>
          <ul className="space-y-2">
            {data.career.challenges.map((challenge: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-orange-500 mt-1">●</span>
                <span>{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-xl">🚀</span>
          职业发展建议
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {data.career.developmentAdvice}
        </p>
      </div>
    </div>
  );
}

// 第11页：生活建议
function LifeSuggestions({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第11页 · 生活建议
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">全方位生活指南</h2>
        <p className="text-gray-600">从身心灵多个维度提升生活质量</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            健康建议
          </h3>
          <ul className="space-y-2">
            {data.lifeSuggestions.health.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-1">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            情感建议
          </h3>
          <ul className="space-y-2">
            {data.lifeSuggestions.emotional.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-500 mt-1">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🧘</span>
            心灵建议
          </h3>
          <ul className="space-y-2">
            {data.lifeSuggestions.spiritual.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-purple-500 mt-1">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span>
            实践建议
          </h3>
          <ul className="space-y-2">
            {data.lifeSuggestions.practical.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-blue-500 mt-1">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <strong>💡 整合建议：</strong>成长是一个全方位的过程。从小的改变开始，持续实践，你会发现生活质量的显著提升。
        </p>
      </div>
    </div>
  );
}

// 第12页：名人与金句
function FamousQuotes({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        第12页 · 名人与金句
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">你并不孤单</h2>
        <p className="text-gray-600">许多杰出人物也是这个类型</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          代表性名人
        </h3>
        <div className="flex flex-wrap gap-3">
          {data.famousPeople.map((person: string, index: number) => (
            <span key={index} className="px-4 py-2 bg-white rounded-full text-gray-800 text-sm border border-indigo-200 shadow-sm">
              {person}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💬</span>
          给你的金句
        </h3>
        <div className="space-y-4">
          {data.quotes.map((quote: string, index: number) => (
            <div key={index} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6 shadow-lg">
              <p className="text-lg italic text-center">
                "{quote}"
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 text-center space-y-4">
        <p className="text-gray-700 text-lg">
          感谢您使用九型人格测试
        </p>
        <p className="text-gray-600">
          愿你在自我探索的旅程中，不断成长，成为更好的自己
        </p>
        <div className="text-sm text-gray-500 pt-4 border-t border-gray-300">
          <p>报告生成时间：{new Date().toLocaleString('zh-CN')}</p>
          <p className="mt-1">https://claude.ai/code</p>
        </div>
      </div>
    </div>
  );
}
