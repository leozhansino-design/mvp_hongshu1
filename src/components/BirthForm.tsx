'use client';

import { useState, useMemo } from 'react';
import { Gender, BirthInfo, HOUR_OPTIONS, CalendarType } from '@/types';

interface BirthFormProps {
  onSubmit: (birthInfo: BirthInfo, isPaid?: boolean) => void;
  disabled?: boolean;
  remainingUsage: number;
}

// 十二时辰定义
const SHI_CHEN_OPTIONS = [
  { value: 0, label: '子时', time: '23:00-01:00' },
  { value: 1, label: '丑时', time: '01:00-03:00' },
  { value: 3, label: '寅时', time: '03:00-05:00' },
  { value: 5, label: '卯时', time: '05:00-07:00' },
  { value: 7, label: '辰时', time: '07:00-09:00' },
  { value: 9, label: '巳时', time: '09:00-11:00' },
  { value: 11, label: '午时', time: '11:00-13:00' },
  { value: 13, label: '未时', time: '13:00-15:00' },
  { value: 15, label: '申时', time: '15:00-17:00' },
  { value: 17, label: '酉时', time: '17:00-19:00' },
  { value: 19, label: '戌时', time: '19:00-21:00' },
  { value: 21, label: '亥时', time: '21:00-23:00' },
];

export default function BirthForm({ onSubmit, disabled, remainingUsage }: BirthFormProps) {
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [shiChen, setShiChen] = useState<number | ''>('');
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

  const isValid = gender && year && month && day && shiChen !== '';

  // 自动计算八字
  useEffect(() => {
    if (year && month && day && shiChen !== '') {
      const bazi = calculateBazi(
        year as number,
        month as number,
        day as number,
        shiChen as number,
        0,
        calendarType === 'lunar'
      );
      setBaziResult(bazi);

      // 如果有性别，计算大运
      if (gender && bazi) {
        const daYun = calculateDaYun(
          year as number,
          month as number,
          day as number,
          shiChen as number,
          0,
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
  }, [year, month, day, shiChen, gender, calendarType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || disabled) return;

    onSubmit({
      gender: gender as Gender,
      year: year as number,
      month: month as number,
      day: day as number,
      hour,
      name: name || undefined,
      calendarType,
    });
  };

  const setCurrentTime = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setDay(now.getDate());
    // 根据当前小时设置时辰
    const hour = now.getHours();
    if (hour === 23 || hour === 0) setShiChen(0);
    else if (hour >= 1 && hour < 3) setShiChen(1);
    else if (hour >= 3 && hour < 5) setShiChen(3);
    else if (hour >= 5 && hour < 7) setShiChen(5);
    else if (hour >= 7 && hour < 9) setShiChen(7);
    else if (hour >= 9 && hour < 11) setShiChen(9);
    else if (hour >= 11 && hour < 13) setShiChen(11);
    else if (hour >= 13 && hour < 15) setShiChen(13);
    else if (hour >= 15 && hour < 17) setShiChen(15);
    else if (hour >= 17 && hour < 19) setShiChen(17);
    else if (hour >= 19 && hour < 21) setShiChen(19);
    else if (hour >= 21 && hour < 23) setShiChen(21);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 姓名（可选） */}
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

      {/* 性别 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          性别 <span className="text-kline-down">*</span>
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
            onClick={() => setGender('male')}
          >
            <span className="text-xl">♂</span>
            <span className="block mt-1">男</span>
          </button>
          <button
            type="button"
            className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
            onClick={() => setGender('female')}
          >
            <span className="text-xl">♀</span>
            <span className="block mt-1">女</span>
          </button>
        </div>
      </div>

      {/* 历法选择 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          历法 <span className="text-kline-down">*</span>
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
              calendarType === 'solar'
                ? 'bg-gold-400/20 border border-gold-400 text-gold-400'
                : 'bg-mystic-900/50 border border-purple-500/30 text-text-secondary hover:border-purple-400'
            }`}
            onClick={() => setCalendarType('solar')}
          >
            阳历(公历)
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
              calendarType === 'lunar'
                ? 'bg-gold-400/20 border border-gold-400 text-gold-400'
                : 'bg-mystic-900/50 border border-purple-500/30 text-text-secondary hover:border-purple-400'
            }`}
            onClick={() => setCalendarType('lunar')}
          >
            阴历(农历)
          </button>
        </div>
      </div>

      {/* 生辰 */}
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

      {/* 时辰 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          出生时辰 <span className="text-kline-down">*</span>
        </label>
        <select
          value={shiChen}
          onChange={(e) => setShiChen(e.target.value ? parseInt(e.target.value) : '')}
          className="select-mystic w-full"
        >
          <option value="">请选择时辰</option>
          {SHI_CHEN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.time})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!isValid || disabled || remainingUsage <= 0}
        className="btn-gold w-full py-4 text-lg font-serif"
      >
        {remainingUsage <= 0 ? '免费次数已用尽' : '开启命盘'}
      </button>

      {remainingUsage > 0 && (
        <p className="text-center text-sm text-text-secondary">
          免费体验 · 剩余 <span className="text-gold-400">{remainingUsage}/3</span> 次
        </p>
      )}

      {/* 两个按钮选项 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!isValid || disabled}
          onClick={() => {
            if (!isValid || disabled) return;
            const birthInfo: BirthInfo = {
              name: name || undefined,
              gender: gender!,
              calendarType,
              year: year as number,
              month: month as number,
              day: day as number,
              hour: shiChen as number,
              minute: 0,
              birthPlace: birthPlace || undefined,
            };
            onSubmit(birthInfo, false);
          }}
          className="btn-outline py-3 text-base font-serif"
        >
          免费概览
        </button>
        <button
          type="button"
          disabled={!isValid || disabled}
          onClick={() => {
            if (!isValid || disabled) return;
            const birthInfo: BirthInfo = {
              name: name || undefined,
              gender: gender!,
              calendarType,
              year: year as number,
              month: month as number,
              day: day as number,
              hour: shiChen as number,
              minute: 0,
              birthPlace: birthPlace || undefined,
            };
            onSubmit(birthInfo, true);
          }}
          className="btn-gold py-3 text-base font-serif"
        >
          精批详解
        </button>
      </div>

      {/* TODO: 测试完成后恢复次数显示 */}
      <p className="text-center text-sm text-text-secondary mt-3">
        测试模式 · <span className="text-yellow-400">无限次数</span>
      </p>
    </form>
  );
}
