'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getAllResults, deleteResult } from '@/services/storage';
import { StoredResult } from '@/types';

export default function MyPage() {
  const [results, setResults] = useState<StoredResult[]>([]);

  useEffect(() => {
    setResults(getAllResults());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个报告吗？')) {
      deleteResult(id);
      setResults(getAllResults());
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
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

        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">还没有生成过报告</p>
            <Link href="/" className="btn-gold inline-block">
              立即生成
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="mystic-card flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gold-400 font-serif">
                      {result.birthInfo.name || '未命名'}
                    </span>
                    {result.isPaid && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gold-400/20 text-gold-400">
                        完整版
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm">
                    {result.birthInfo.gender === 'male' ? '男' : '女'} ·
                    {result.birthInfo.year}年{result.birthInfo.month}月{result.birthInfo.day}日
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    {formatDate(result.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/result/${result.id}`}
                    className="btn-outline text-sm"
                  >
                    查看
                  </Link>
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
