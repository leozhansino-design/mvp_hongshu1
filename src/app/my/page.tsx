'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getAllResults, deleteResult } from '@/services/storage';
import { StoredResult, PHASE_LABELS, HOUR_LABELS, PhaseType } from '@/types';

export default function MyReportsPage() {
  const [results, setResults] = useState<StoredResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResults = getAllResults();
    setResults(storedResults);
    setLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这份报告吗？')) {
      deleteResult(id);
      setResults(results.filter((r) => r.id !== id));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-serif text-2xl md:text-3xl text-gold-400 mb-6">
          我的报告
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">加载中...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="mystic-card text-center py-12">
            <div className="text-6xl mb-4 opacity-30">✦</div>
            <p className="text-text-secondary mb-4">暂无报告记录</p>
            <Link href="/" className="btn-gold inline-block px-6 py-2">
              开始测算
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const { birthInfo, freeResult, isPaid, createdAt } = result;
              const phase = (freeResult?.currentPhase || 'stable') as PhaseType;

              return (
                <div key={result.id} className="mystic-card hover:border-gold-400/40 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">
                          {birthInfo.gender === 'male' ? '♂' : '♀'}
                        </span>
                        <span className="font-serif text-lg text-text-primary">
                          {birthInfo.name || '匿名'}
                        </span>
                        {isPaid && (
                          <span className="px-2 py-0.5 text-xs rounded bg-gold-400/20 text-gold-400">
                            完整版
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary space-y-1">
                        <p>
                          {birthInfo.calendarType === 'lunar' ? '农历' : '公历'} {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日 {HOUR_LABELS[birthInfo.hour]}
                        </p>
                        <p>
                          当前运势：<span className="text-gold-400">{PHASE_LABELS[phase]}</span>
                        </p>
                        <p className="text-xs text-text-secondary/60">
                          {formatDate(createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Link
                        href={`/result/${result.id}`}
                        className="btn-outline px-4 py-1.5 text-sm"
                      >
                        查看详情
                      </Link>
                      <button
                        onClick={() => handleDelete(result.id)}
                        className="px-4 py-1.5 text-sm text-kline-down/70 hover:text-kline-down transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
