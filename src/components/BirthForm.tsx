'use client';

import { useState, useMemo, useEffect } from 'react';
import { Gender, BirthInfo, CalendarType, CHINA_CITIES } from '@/types';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';

interface BirthFormProps {
  onSubmit: (birthInfo: BirthInfo) => void;
  disabled?: boolean;
  remainingUsage: number;
}

export default function BirthForm({ onSubmit, disabled, remainingUsage }: BirthFormProps) {
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [hour, setHour] = useState<number | ''>('');
  const [minute, setMinute] = useState<number | ''>('');
  const [birthPlace, setBirthPlace] = useState<string>('');
  const [showCities, setShowCities] = useState(false);
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [daYunResult, setDaYunResult] = useState<{ startInfo: string; daYunList: DaYunItem[] } | null>(null);

  const currentYear = new Date().getFullYear();

  // 年份选项 (1900 - 当前年份)
  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= 1900; y--) {
      arr.push(y);
    }
    return arr;
  }, [currentYear]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(year as number, month as number, 0).getDate();
  }, [year, month]);

  const days = useMemo(() =>
    Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const filteredCities = useMemo(() => {
    if (!birthPlace) return CHINA_CITIES.slice(0, 50);
    return CHINA_CITIES.filter(city => city.includes(birthPlace));
  }, [birthPlace]);

  const isValid = gender && year && month && day && hour !== '' && minute !== '';

  // 自动计算八字
  useEffect(() => {
    if (year && month && day && hour !== '' && minute !== '') {
      const bazi = calculateBazi(
        year as number,
        month as number,
        day as number,
        hour as number,
        minute as number,
        calendarType === 'lunar'
      );
      setBaziResult(bazi);

      // 如果有性别，计算大运
      if (gender && bazi) {
        const daYun = calculateDaYun(
          year as number,
          month as number,
          day as number,
          hour as number,
          minute as number,
          gender,
          calendarType === 'lunar'
        );
        setDaYunResult(daYun);
      } else {
        setDaYunResult(null);
      }
    } else {
      setBaziResult(null);
      setDaYunResult(null);
    }
  }, [year, month, day, hour, minute, gender, calendarType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || disabled) return;

    onSubmit({
      gender: gender as Gender,
      year: year as number,
      month: month as number,
      day: day as number,
      hour: hour as number,
      minute: minute as number,
      name: name || undefined,
      calendarType,
      birthPlace: birthPlace || undefined,
    });
  };

  const setCurrentTime = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setDay(now.getDate());
    setHour(now.getHours());
    setMinute(now.getMinutes());
  };

  // 时辰显示
  const getShiChenLabel = (h: number): string => {
    const shiChenMap: Record<number, string> = {
      0: '子', 1: '丑', 2: '丑', 3: '寅', 4: '寅', 5: '卯',
      6: '卯', 7: '辰', 8: '辰', 9: '巳', 10: '巳', 11: '午',
      12: '午', 13: '未', 14: '未', 15: '申', 16: '申', 17: '酉',
      18: '酉', 19: '戌', 20: '戌', 21: '亥', 22: '亥', 23: '子',
    };
    return shiChenMap[h] || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 姓名和性别 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            姓名 <span className="text-text-secondary/50">(选填)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名"
            className="input-mystic"
          />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            性别 <span className="text-kline-down">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                gender === 'male'
                  ? 'bg-purple-500/30 border border-purple-400 text-purple-300'
                  : 'bg-mystic-900/50 border border-purple-500/30 text-text-secondary hover:border-purple-400'
              }`}
              onClick={() => setGender('male')}
            >
              乾造 (男)
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                gender === 'female'
                  ? 'bg-pink-500/30 border border-pink-400 text-pink-300'
                  : 'bg-mystic-900/50 border border-purple-500/30 text-text-secondary hover:border-purple-400'
              }`}
              onClick={() => setGender('female')}
            >
              坤造 (女)
            </button>
          </div>
        </div>
      </div>

      {/* 历法选择 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          历法 <span className="text-kline-down">*</span>
        </label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="calendar"
              checked={calendarType === 'solar'}
              onChange={() => setCalendarType('solar')}
              className="w-4 h-4 text-purple-500 bg-mystic-900 border-purple-500/50"
            />
            <span className={calendarType === 'solar' ? 'text-gold-400' : 'text-text-secondary'}>
              公历
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="calendar"
              checked={calendarType === 'lunar'}
              onChange={() => setCalendarType('lunar')}
              className="w-4 h-4 text-purple-500 bg-mystic-900 border-purple-500/50"
            />
            <span className={calendarType === 'lunar' ? 'text-gold-400' : 'text-text-secondary'}>
              农历
            </span>
          </label>
        </div>
      </div>

      {/* 出生日期 - 全部下拉选择 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          出生日期 <span className="text-kline-down">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
              className="select-mystic"
            >
              <option value="">年</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-text-secondary">年</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : '')}
              className="select-mystic"
            >
              <option value="">月</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="text-text-secondary">月</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : '')}
              className="select-mystic"
            >
              <option value="">日</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className="text-text-secondary">日</span>
          </div>
        </div>
      </div>

      {/* 出生时间 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-text-secondary">
            出生时间 <span className="text-kline-down">*</span>
          </label>
          <button
            type="button"
            onClick={setCurrentTime}
            className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded border border-purple-500/30 hover:border-purple-400"
          >
            当前时间
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value ? parseInt(e.target.value) : '')}
              className="select-mystic"
            >
              <option value="">时</option>
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')} ({getShiChenLabel(h)}时)
                </option>
              ))}
            </select>
            <span className="text-text-secondary">时</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value ? parseInt(e.target.value) : '')}
              className="select-mystic"
            >
              <option value="">分</option>
              {minutes.map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-text-secondary">分</span>
          </div>
        </div>
      </div>

      {/* 出生地 */}
      <div className="relative">
        <label className="block text-sm text-text-secondary mb-2">
          出生地 <span className="text-text-secondary/50">(选填，用于计算真太阳时)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => {
              setBirthPlace(e.target.value);
              setShowCities(true);
            }}
            onFocus={() => setShowCities(true)}
            onBlur={() => setTimeout(() => setShowCities(false), 200)}
            placeholder="请选择或输入城市"
            className="input-mystic pr-8"
          />
          {birthPlace && (
            <button
              type="button"
              onClick={() => setBirthPlace('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              ×
            </button>
          )}
        </div>
        {showCities && filteredCities.length > 0 && (
          <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-mystic-800 border border-purple-500/30 rounded-lg shadow-lg">
            {filteredCities.slice(0, 20).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setBirthPlace(city);
                  setShowCities(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-purple-500/20 hover:text-text-primary"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 八字预览 */}
      {baziResult && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/30 to-mystic-900/50 border border-purple-500/30">
          <div className="text-center mb-3">
            <span className="text-xs text-purple-400">命盘预览</span>
            <p className="text-xs text-text-secondary mt-1">
              {baziResult.chart.lunarDate} · {baziResult.chart.zodiac}年
            </p>
          </div>

          {/* 四柱八字 */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: '年柱', pillar: baziResult.chart.yearPillar, naYin: baziResult.naYin.year },
              { label: '月柱', pillar: baziResult.chart.monthPillar, naYin: baziResult.naYin.month },
              { label: '日柱', pillar: baziResult.chart.dayPillar, naYin: baziResult.naYin.day },
              { label: '时柱', pillar: baziResult.chart.hourPillar, naYin: baziResult.naYin.hour },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xs text-text-secondary mb-1">{item.label}</div>
                <div className="bg-mystic-900/80 rounded-lg p-2 border border-purple-500/20">
                  <div className="text-gold-400 font-bold text-lg">{item.pillar.heavenlyStem}</div>
                  <div className="text-purple-300 font-bold text-lg">{item.pillar.earthlyBranch}</div>
                </div>
                <div className="text-xs text-text-secondary/70 mt-1">{item.naYin}</div>
              </div>
            ))}
          </div>

          {/* 五行统计 */}
          <div className="flex justify-center gap-3 text-xs mb-3">
            <span className="text-green-400">木{baziResult.wuXing.year.includes('木') ? 1 : 0}{baziResult.wuXing.month.includes('木') ? 1 : 0}{baziResult.wuXing.day.includes('木') ? 1 : 0}{baziResult.wuXing.hour.includes('木') ? 1 : 0}</span>
            <span className="text-red-400">火{baziResult.wuXing.year.includes('火') ? 1 : 0}{baziResult.wuXing.month.includes('火') ? 1 : 0}{baziResult.wuXing.day.includes('火') ? 1 : 0}{baziResult.wuXing.hour.includes('火') ? 1 : 0}</span>
            <span className="text-yellow-400">土{baziResult.wuXing.year.includes('土') ? 1 : 0}{baziResult.wuXing.month.includes('土') ? 1 : 0}{baziResult.wuXing.day.includes('土') ? 1 : 0}{baziResult.wuXing.hour.includes('土') ? 1 : 0}</span>
            <span className="text-gray-300">金{baziResult.wuXing.year.includes('金') ? 1 : 0}{baziResult.wuXing.month.includes('金') ? 1 : 0}{baziResult.wuXing.day.includes('金') ? 1 : 0}{baziResult.wuXing.hour.includes('金') ? 1 : 0}</span>
            <span className="text-blue-400">水{baziResult.wuXing.year.includes('水') ? 1 : 0}{baziResult.wuXing.month.includes('水') ? 1 : 0}{baziResult.wuXing.day.includes('水') ? 1 : 0}{baziResult.wuXing.hour.includes('水') ? 1 : 0}</span>
          </div>

          {/* 大运预览 */}
          {daYunResult && daYunResult.daYunList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <div className="text-xs text-purple-400 text-center mb-2">大运排盘</div>
              <div className="text-xs text-text-secondary/70 text-center mb-2">{daYunResult.startInfo}</div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {daYunResult.daYunList.slice(0, 8).map((daYun, idx) => (
                  <div key={idx} className="flex-shrink-0 text-center px-2 py-1 bg-mystic-900/50 rounded border border-purple-500/10">
                    <div className="text-gold-400 text-sm font-medium">{daYun.ganZhi}</div>
                    <div className="text-text-secondary/60 text-xs">{daYun.startAge}-{daYun.endAge}岁</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI驱动提示 */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <span className="text-purple-400">✦</span>
        <span className="text-sm text-purple-300">AI命理大师 · 深度解读命盘</span>
      </div>

      <button
        type="submit"
        disabled={!isValid || disabled || remainingUsage <= 0}
        className="btn-gold w-full py-4 text-lg font-serif flex items-center justify-center gap-2"
      >
        <span className="text-xl">✦</span>
        {remainingUsage <= 0 ? '免费次数已用尽' : '生成人生K线'}
      </button>

      {remainingUsage > 0 && (
        <p className="text-center text-sm text-text-secondary">
          免费体验 · 剩余 <span className="text-gold-400">{remainingUsage}/3</span> 次
        </p>
      )}
    </form>
  );
}
