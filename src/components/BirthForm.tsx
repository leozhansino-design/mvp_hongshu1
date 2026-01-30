'use client';

import { useState, useMemo, useEffect } from 'react';
import { Gender, BirthInfo, CalendarType, isValidChineseName } from '@/types';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';
import { CHINA_PROVINCES, getCityNamesByProvince } from '@/data/chinaCities';

interface BirthFormProps {
  onSubmit: (birthInfo: BirthInfo, isPaid?: boolean) => void;
  disabled?: boolean;
  remainingUsage: number;
  points?: number; // 当前积分
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

export default function BirthForm({ onSubmit, disabled, remainingUsage, points = 0 }: BirthFormProps) {
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [shiChen, setShiChen] = useState<number | ''>('');
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [daYunResult, setDaYunResult] = useState<{ startInfo: string; daYunList: DaYunItem[] } | null>(null);

  // 姓名校验
  const handleNameChange = (value: string) => {
    setName(value);
    if (!value) {
      setNameError('请输入姓名');
    } else if (!isValidChineseName(value)) {
      setNameError('请输入2-4个中文汉字');
    } else {
      setNameError('');
    }
  };

  // 姓名是否有效
  const isNameValid = name.length > 0 && isValidChineseName(name);

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

  const isValid = isNameValid && gender && year && month && day && shiChen !== '';

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
      hour: shiChen as number,
      minute: 0,
      name,
      calendarType,
      province: province || undefined,
      city: city || undefined,
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
      {/* 姓名和性别 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            姓名 <span className="text-kline-down">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="请输入中文姓名"
            className={`input-mystic ${nameError ? 'border-red-500' : ''}`}
            maxLength={4}
          />
          {nameError && (
            <p className="text-xs text-red-400 mt-1">{nameError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            性别 <span className="text-kline-down">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 border ${
                gender === 'male'
                  ? 'bg-white/10 border-white text-white'
                  : 'bg-black/50 border-gray-700 text-text-secondary hover:border-gray-500'
              }`}
              onClick={() => setGender('male')}
            >
              乾造 (男)
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 border ${
                gender === 'female'
                  ? 'bg-white/10 border-white text-white'
                  : 'bg-black/50 border-gray-700 text-text-secondary hover:border-gray-500'
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
              className="w-4 h-4 accent-white bg-black border-gray-700"
            />
            <span className={calendarType === 'solar' ? 'text-white' : 'text-text-secondary'}>
              公历
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="calendar"
              checked={calendarType === 'lunar'}
              onChange={() => setCalendarType('lunar')}
              className="w-4 h-4 accent-white bg-black border-gray-700"
            />
            <span className={calendarType === 'lunar' ? 'text-white' : 'text-text-secondary'}>
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

      {/* 出生时辰 - 12时辰选择 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-text-secondary">
            出生时辰 <span className="text-kline-down">*</span>
          </label>
          <button
            type="button"
            onClick={setCurrentTime}
            className="text-xs text-white hover:text-gray-300 px-2 py-1 rounded border border-gray-700 hover:border-gray-500 bg-black/50"
          >
            当前时间
          </button>
        </div>
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

      {/* 出生地 - 省/市选择 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          出生地 <span className="text-text-secondary/50">(选填，用于计算真太阳时)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
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

      {/* 八字预览 */}
      {baziResult && (
        <div className="p-4 rounded-xl bg-black/80 border border-gray-700">
          <div className="text-center mb-3">
            <span className="text-xs text-white">命盘预览</span>
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
                <div className="bg-black/80 rounded-lg p-2 border border-gray-700">
                  <div className="text-gold-400 font-bold text-lg">{item.pillar.heavenlyStem}</div>
                  <div className="text-white font-bold text-lg">{item.pillar.earthlyBranch}</div>
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
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-white text-center mb-2">大运排盘</div>
              <div className="text-xs text-text-secondary/70 text-center mb-2">{daYunResult.startInfo}</div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {daYunResult.daYunList.slice(0, 8).map((daYun, idx) => (
                  <div key={idx} className="flex-shrink-0 text-center px-2 py-1 bg-black/50 rounded border border-gray-700">
                    <div className="text-gold-400 text-sm font-medium">{daYun.ganZhi}</div>
                    <div className="text-text-secondary/60 text-xs">{daYun.startAge}-{daYun.endAge}岁</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 两个按钮选项 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!isValid || disabled || (remainingUsage <= 0 && points < 10)}
          onClick={() => {
            if (!isValid || disabled) return;
            if (remainingUsage <= 0 && points < 10) return;
            const birthInfo: BirthInfo = {
              name,
              gender: gender!,
              calendarType,
              year: year as number,
              month: month as number,
              day: day as number,
              hour: shiChen as number,
              minute: 0,
              province: province || undefined,
              city: city || undefined,
            };
            onSubmit(birthInfo, false);
          }}
          className="btn-outline py-3 text-base font-serif"
        >
          {remainingUsage > 0 ? '免费概览' : '10积分概览'}
        </button>
        <button
          type="button"
          disabled={!isValid || disabled || points < 50}
          onClick={() => {
            if (!isValid || disabled || points < 50) return;
            const birthInfo: BirthInfo = {
              name,
              gender: gender!,
              calendarType,
              year: year as number,
              month: month as number,
              day: day as number,
              hour: shiChen as number,
              minute: 0,
              province: province || undefined,
              city: city || undefined,
            };
            onSubmit(birthInfo, true);
          }}
          className={`py-3 text-base font-serif ${points >= 50 ? 'btn-gold' : 'btn-gold opacity-50 cursor-not-allowed'}`}
        >
          精批详解
        </button>
      </div>

      {/* 积分不足提示 - 只在积分不够时显示 */}
      {points < 50 && (
        <p className="text-center text-xs text-text-secondary/70 mt-2">
          需要50积分解锁精批详解
        </p>
      )}
    </form>
  );
}
