'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BirthForm, AnalysisLoader } from '@/components';
import Header from '@/components/Header';
import { saveResult } from '@/services/storage';
import { BirthInfo, StoredResult, FreeVersionResult } from '@/types';

// 模拟数据生成函数
function generateMockResult(birthInfo: BirthInfo): FreeVersionResult {
  const birthYear = birthInfo.year;

  return {
    baziChart: {
      yearPillar: { heavenlyStem: '甲', earthlyBranch: '子', fullName: '甲子' },
      monthPillar: { heavenlyStem: '乙', earthlyBranch: '丑', fullName: '乙丑' },
      dayPillar: { heavenlyStem: '丙', earthlyBranch: '寅', fullName: '丙寅' },
      hourPillar: { heavenlyStem: '丁', earthlyBranch: '卯', fullName: '丁卯' },
      zodiac: '鼠',
      lunarDate: `农历${birthYear}年${birthInfo.month}月${birthInfo.day}日`,
      solarTime: `真太阳时 ${birthInfo.hour}:${birthInfo.minute}`,
    },
    summary: '此命格局中正，日主丙火生于丑月，得年柱甲木相生，时柱丁火帮扶，整体气势偏旺。命中财官印三奇俱全，主一生事业有成，财运亨通，但需注意中年后健康问题。',
    summaryScore: 75,
    personality: '日主丙火，性格热情开朗，待人真诚，富有领导魅力。思维敏捷，善于表达，但有时过于急躁，需要学会耐心。',
    personalityScore: 80,
    career: '适合从事管理、销售、教育等需要与人打交道的工作。35-45岁为事业黄金期，宜把握机会。',
    careerScore: 78,
    wealth: '正财运稳定，偏财运中等。30岁后财运渐旺，适合稳健投资，不宜投机取巧。',
    wealthScore: 72,
    marriage: '婚姻宫位稳定，适宜晚婚。最佳结婚年龄在28-32岁之间，配偶宜选五行属木或土之人。',
    marriageScore: 75,
    health: '先天体质较好，但需注意心血管和眼睛问题。40岁后宜加强锻炼，忌熬夜。',
    healthScore: 70,
    fengShui: '吉利方位为东方和南方，居住宜选择采光充足的房屋。可佩戴木质饰品增运。',
    fengShuiScore: 76,
    family: '与父母缘分深厚，兄弟姐妹关系和睦。子女运较好，宜生育一至两个子女。',
    familyScore: 74,
    dayMaster: {
      stem: '丙',
      element: '火',
      strength: '身旺',
      description: '丙火日主，如太阳之火，光明正大，热情洋溢，有领导才能。',
    },
    usefulGod: '用神为水，喜神为金，忌神为木火。宜从事与水、金相关的行业。',
    fiveElements: {
      wood: 2,
      fire: 3,
      earth: 1,
      metal: 1,
      water: 1,
    },
    luckyInfo: {
      direction: '北方、西方',
      color: '黑色、白色、金色',
      number: '1、6、4、9',
      industry: '金融、科技、水利、物流',
    },
    chartPoints: [
      { age: 1, score: 55, daYun: '童限', ganZhi: '甲子', reason: '幼年承蒙庇护，平稳度过' },
      { age: 10, score: 62, daYun: '甲午', ganZhi: '甲戌', reason: '学业进步，初露锋芒' },
      { age: 20, score: 48, daYun: '乙未', ganZhi: '甲申', reason: '初入社会，跌宕历练' },
      { age: 30, score: 72, daYun: '丙申', ganZhi: '甲午', reason: '事业起步，渐入佳境' },
      { age: 40, score: 85, daYun: '丁酉', ganZhi: '甲辰', reason: '鼎盛之年，名利双收' },
      { age: 50, score: 78, daYun: '戊戌', ganZhi: '甲寅', reason: '守成为主，稳中求进' },
      { age: 60, score: 65, daYun: '己亥', ganZhi: '甲子', reason: '渐入晚境，安享清福' },
      { age: 70, score: 58, daYun: '庚子', ganZhi: '甲戌', reason: '颐养天年，子孙绕膝' },
      { age: 80, score: 52, daYun: '辛丑', ganZhi: '甲申', reason: '福寿双全，安度晚年' },
      { age: 90, score: 45, daYun: '壬寅', ganZhi: '甲午', reason: '功德圆满，寿终正寝' },
    ],
    highlights: [
      {
        age: 28,
        year: birthYear + 27,
        title: '事业腾飞',
        description: '此年印星高照，贵人助力，适合跳槽升职或创业。',
        type: 'career',
      },
      {
        age: 42,
        year: birthYear + 41,
        title: '财运亨通',
        description: '偏财入命，投资有利，但需谨慎行事，不可贪心。',
        type: 'wealth',
      },
    ],
    warnings: [
      {
        age: 35,
        year: birthYear + 34,
        title: '健康警示',
        description: '流年冲克日主，注意心血管健康，宜多运动少熬夜。',
        advice: '佩戴黑曜石，多吃黑色食物，避免过度劳累。',
        type: 'health',
      },
    ],
    currentPhase: 'rising',
  };
}

export default function TestChartPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (birthInfo: BirthInfo) => {
    setIsLoading(true);
    setError(null);

    try {
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 生成模拟数据
      const freeResult = generateMockResult(birthInfo);

      const resultId = uuidv4();
      const storedResult: StoredResult = {
        id: resultId,
        birthInfo,
        freeResult,
        isPaid: false,
        createdAt: Date.now(),
      };

      saveResult(storedResult);

      // 跳转到结果页面
      router.push(`/result/${resultId}`);
    } catch (err) {
      console.error('生成失败:', err);
      setError(err instanceof Error ? err.message : '测试生成失败');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center px-4 py-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <AnalysisLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block px-3 py-1 mb-3 rounded-full bg-yellow-500/20 border border-yellow-500/50">
            <span className="text-yellow-400 text-sm">🧪 测试模式 - 不消耗次数</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-gold-gradient mb-2 md:mb-3">
            人生曲线
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            测试页面 · 使用模拟数据
          </p>
        </div>

        <div className="mystic-card-gold w-full max-w-md">
          <BirthForm
            onSubmit={handleSubmit}
            disabled={isLoading}
            remainingUsage={999}
          />

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        <p className="mt-6 md:mt-8 text-xs md:text-sm text-text-secondary">
          此页面使用模拟数据，不调用 API，不消耗免费次数
        </p>
      </div>
    </div>
  );
}
