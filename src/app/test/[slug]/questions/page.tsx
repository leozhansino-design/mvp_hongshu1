'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import enneagramQuestions from '@/data/enneagram-questions.json';

function QuestionsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const level = searchParams.get('level') || 'basic';
  const redeemCode = searchParams.get('code');

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化答案数组和从localStorage恢复
  useEffect(() => {
    if (slug === 'enneagram') {
      const savedAnswers = localStorage.getItem(`enneagram_answers_${level}`);
      const savedQuestion = localStorage.getItem(`enneagram_current_${level}`);

      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          setAnswers(parsed);
          if (savedQuestion) {
            setCurrentQuestion(parseInt(savedQuestion, 10));
          }
        } catch {
          setAnswers(new Array(144).fill(null));
        }
      } else {
        setAnswers(new Array(144).fill(null));
      }
    }
  }, [slug, level]);

  // 保存进度到localStorage
  useEffect(() => {
    if (slug === 'enneagram' && answers.length > 0) {
      localStorage.setItem(`enneagram_answers_${level}`, JSON.stringify(answers));
      localStorage.setItem(`enneagram_current_${level}`, currentQuestion.toString());
    }
  }, [answers, currentQuestion, slug, level]);

  // 处理答案选择
  const handleAnswer = useCallback((answer: boolean) => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    // 延迟跳转下一题
    setTimeout(() => {
      if (currentQuestion < 143) {
        setCurrentQuestion(currentQuestion + 1);
      }
      setIsAnimating(false);
    }, 300);
  }, [currentQuestion, answers, isAnimating]);

  // 提交测试
  const handleSubmit = async () => {
    // 检查是否所有题目都已回答
    const unansweredCount = answers.filter(a => a === null).length;
    if (unansweredCount > 0) {
      alert(`还有 ${unansweredCount} 道题目未回答，请完成所有题目后再提交。`);
      // 跳转到第一个未回答的题目
      const firstUnanswered = answers.findIndex(a => a === null);
      if (firstUnanswered !== -1) {
        setCurrentQuestion(firstUnanswered);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // 转换答案为布尔数组
      const boolAnswers = answers.map(a => a === true);

      // 提交答案到API
      const response = await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSlug: slug,
          answers: boolAnswers,
          level,
          redeemCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 清除本地存储
        localStorage.removeItem(`enneagram_answers_${level}`);
        localStorage.removeItem(`enneagram_current_${level}`);

        // 跳转到结果页
        router.push(`/test/${slug}/result/${data.resultId}`);
      } else {
        alert(data.error || '提交失败，请重试');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取当前题目
  const question = enneagramQuestions.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / 144) * 100;
  const answeredCount = answers.filter(a => a !== null).length;

  if (!question) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      {/* 进度条 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">答题进度</span>
            <span className="text-sm text-gray-900 font-medium">
              {currentQuestion + 1} / 144
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">已答 {answeredCount} 题</span>
            <span className="text-xs text-gray-400">剩余 {144 - answeredCount} 题</span>
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* 题号 */}
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-gray-100 rounded-full text-sm text-gray-500">
              第 {currentQuestion + 1} 题
            </span>
          </div>

          {/* 题目文字 */}
          <div className="text-center mb-10">
            <p className="text-xl md:text-2xl text-gray-900 leading-relaxed">
              {question.text}
            </p>
          </div>

          {/* 选项按钮 */}
          <div className="space-y-4">
            <button
              onClick={() => handleAnswer(true)}
              disabled={isAnimating}
              className={`w-full py-5 rounded-2xl text-lg font-medium transition-all duration-200 ${
                answers[currentQuestion] === true
                  ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              是
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={isAnimating}
              className={`w-full py-5 rounded-2xl text-lg font-medium transition-all duration-200 ${
                answers[currentQuestion] === false
                  ? 'bg-gray-700 text-white shadow-lg scale-[1.02]'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              否
            </button>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一题
          </button>

          {currentQuestion === 143 && answeredCount === 144 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '提交答案'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(143, currentQuestion + 1))}
              disabled={currentQuestion === 143}
              className="flex items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              下一题
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <QuestionsContent />
    </Suspense>
  );
}
