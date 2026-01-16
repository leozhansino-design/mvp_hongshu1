'use client';

import { useState, useMemo } from 'react';
import { Gender, BirthInfo, HOUR_OPTIONS, CalendarType } from '@/types';
import { CHINA_PROVINCES, getCityNamesByProvince } from '@/data/chinaCities';

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
  const [hour, setHour] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const years = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(year as number, month as number, 0).getDate();
  }, [year, month]);

  const days = useMemo(() =>
    Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // 根据选中的省份获取城市列表
  const cities = useMemo(() => {
    if (!province) return [];
    return getCityNamesByProvince(province);
  }, [province]);

  // 当省份改变时，重置城市选择
  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    setCity('');
  };

  const isValid = gender && year && month && day && hour;

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
      province: province || undefined,
      city: city || undefined,
    });
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
        <div className="grid grid-cols-3 gap-3">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
            className="select-mystic"
          >
            <option value="">年</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : '')}
            className="select-mystic"
          >
            <option value="">月</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>

          <select
            value={day}
            onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : '')}
            className="select-mystic"
          >
            <option value="">日</option>
            {days.map((d) => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
        </div>
      </div>

      {/* 时辰 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          出生时辰 <span className="text-kline-down">*</span>
        </label>
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="select-mystic"
        >
          <option value="">请选择时辰</option>
          {HOUR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 出生地点 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          出生地点 <span className="text-text-secondary/50">(选填，可提高准确度)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="select-mystic"
          >
            <option value="">省份/直辖市</option>
            {CHINA_PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="select-mystic"
            disabled={!province}
          >
            <option value="">城市</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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
    </form>
  );
}
