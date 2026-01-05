'use client';

import { useState, useMemo } from 'react';
import { Gender, BirthInfo, HOUR_OPTIONS } from '@/types';

interface BirthFormProps {
  onSubmit: (birthInfo: BirthInfo) => void;
  disabled?: boolean;
  remainingUsage: number;
}

export default function BirthForm({ onSubmit, disabled, remainingUsage }: BirthFormProps) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [hour, setHour] = useState<string>('');

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
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-3">
          性别
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
            onClick={() => setGender('male')}
          >
            <span className="text-2xl">☰</span>
            <span className="block mt-1">乾</span>
          </button>
          <button
            type="button"
            className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
            onClick={() => setGender('female')}
          >
            <span className="text-2xl">☷</span>
            <span className="block mt-1">坤</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-3">
          生辰
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

      <div>
        <label className="block text-sm text-text-secondary mb-3">
          时辰
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

      <button
        type="submit"
        disabled={!isValid || disabled || remainingUsage <= 0}
        className="btn-gold w-full py-4 text-lg font-serif"
      >
        {remainingUsage <= 0 ? '免费次数已用尽' : '窥探命数'}
      </button>

      {remainingUsage > 0 && (
        <p className="text-center text-sm text-text-secondary">
          初窥天机 · 剩余 <span className="text-gold-400">{remainingUsage}/3</span> 次
        </p>
      )}
    </form>
  );
}
