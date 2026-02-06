'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components';
import EnneagramReport from '@/components/EnneagramReport';
import type { EnneagramResult } from '@/lib/enneagram';

interface EnneagramReportData {
  mainType: number;
  mainTypeName: string;
  mainTypeEnglishName: string;
  mainTypeDescription?: string;
  wingType: number;
  wingTypeName: string;
  wingCombinationName: string;
  scores: number[];
  scorePercentages: number[];
  reportLevel: 'basic' | 'full';
  report?: unknown;
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
      // 首先尝试从本地存储获取
      const localResult = localStorage.getItem(`test_result_${id}`);
      if (localResult) {
        try {
          const parsed = JSON.parse(localResult);
          setReport(parsed);
          setLoading(false);
          return;
        } catch (e) {
          console.log('解析本地结果失败', e);
        }
      }

      // 如果本地没有，尝试从API获取
      try {
        const response = await fetch(`/api/test/result/${id}`);
        const data = await response.json();

        if (data.success && data.result) {
          setReport(data.result);
        } else {
          setError(data.error || '报告不存在，请重新测试');
        }
      } catch (err) {
        setError('报告不存在，请重新测试');
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

  // 构建EnneagramResult对象供新报告组件使用
  const enneagramResult: EnneagramResult = {
    mainType: report.mainType,
    wingType: report.wingType,
    scores: report.scores,
    mainTypeName: report.mainTypeName,
    mainTypeEnglishName: report.mainTypeEnglishName,
    wingTypeName: report.wingTypeName,
    wingCombinationName: report.wingCombinationName,
    scorePercentages: report.scorePercentages,
  };

  // 基础版(¥1.98)使用新的10+页专业报告，完整版(¥19.90)添加AI深度分析
  const renderAIAnalysis = () => {
    if (report.reportLevel === 'full' && report.report) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">AI深度分析（完整版专属）</h2>
            <div className="bg-white/10 rounded-xl p-6">
              <pre className="leading-relaxed whitespace-pre-wrap">
                {typeof report.report === 'string' ? report.report : JSON.stringify(report.report, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      <EnneagramReport result={enneagramResult} />

      {/* 完整版额外内容 - AI深度分析部分 */}
      {renderAIAnalysis()}

      {/* 基础版升级引导 */}
      {report.reportLevel === 'basic' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="font-semibold text-lg">解锁AI深度分析</h3>
            </div>
            <ul className="text-sm text-white/90 space-y-1 mb-4">
              <li>· AI生成的个性化深度分析</li>
              <li>· 针对你独特情况的建议</li>
              <li>· 更精准的成长指导</li>
              <li>· 个性化职业发展路径</li>
            </ul>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              ¥19.9 解锁完整版
            </button>
          </div>
        </div>
      )}

      <Footer />

      {/* 升级弹窗 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              解锁完整版报告
            </h3>
            <p className="text-gray-600 text-sm text-center mb-6">
              支付 ¥19.9 即可获得AI深度分析
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // TODO: 实现微信支付
                  alert('微信支付功能开发中');
                }}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                微信支付
              </button>
              <button
                onClick={() => {
                  // TODO: 实现支付宝支付
                  alert('支付宝支付功能开发中');
                }}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
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
