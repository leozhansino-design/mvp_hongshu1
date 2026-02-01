'use client';

import { useState, useMemo, useEffect } from 'react';
import { Gender, BirthInfo, CalendarType, isValidChineseName } from '@/types';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';
import { CHINA_PROVINCES, getCityNamesByProvince } from '@/data/chinaCities';
import { useAuth } from '@/contexts/AuthContext';

interface BirthFormProps {
  onSubmit: (birthInfo: BirthInfo, isPaid?: boolean) => void;
  disabled?: boolean;
  remainingUsage: number;
  points?: number;
  detailedPrice?: number;
}

// 时间段定义
const TIME_OPTIONS = [
  { value: 0, label: '23:00-01:00' },
  { value: 1, label: '01:00-03:00' },
  { value: 3, label: '03:00-05:00' },
  { value: 5, label: '05:00-07:00' },
  { value: 7, label: '07:00-09:00' },
  { value: 9, label: '09:00-11:00' },
  { value: 11, label: '11:00-13:00' },
  { value: 13, label: '13:00-15:00' },
  { value: 15, label: '15:00-17:00' },
  { value: 17, label: '17:00-19:00' },
  { value: 19, label: '19:00-21:00' },
  { value: 21, label: '21:00-23:00' },
];

export default function BirthForm({ onSubmit, disabled, remainingUsage, points = 0, detailedPrice = 200 }: BirthFormProps) {
  const { isLoggedIn, setShowLoginModal, setLoginRedirectMessage } = useAuth();
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [timeSlot, setTimeSlot] = useState<number | ''>('');
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const validateName = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return '请输入姓名';
    }
    if (value.includes(' ')) {
      return '姓名不能包含空格';
    }
    if (/[a-zA-Z]/.test(value)) {
      return '姓名不能包含英文字母';
    }
    if (/[0-9]/.test(value)) {
      return '姓名不能包含数字';
    }
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value)) {
      return '姓名不能包含特殊字符';
    }
    if (!/^[\u4e00-\u9fa5]+$/.test(value)) {
      return '姓名只能包含中文汉字';
    }
    if (value.length < 2) {
      return '姓名至少需要2个汉字';
    }
    if (value.length > 4) {
      return '姓名最多4个汉字';
    }
    return '';
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const error = validateName(value);
    setNameError(error);
    if (showErrors) setShowErrors(false);
  };

  const isNameValid = name.length > 0 && isValidChineseName(name);
  const currentYear = new Date().getFullYear();

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

  const cities = useMemo(() => {
    if (!province) return [];
    return getCityNamesByProvince(province);
  }, [province]);

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    setCity('');
  };

  const isValid = isNameValid && gender && year && month && day && timeSlot !== '';

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    const nameValidationError = validateName(name);
    if (nameValidationError) errors.push(nameValidationError);
    if (!gender) errors.push('请选择性别');
    if (!year) errors.push('请选择出生年份');
    if (!month) errors.push('请选择出生月份');
    if (!day) errors.push('请选择出生日期');
    if (timeSlot === '') errors.push('请选择出生时间段');
    return errors;
  };

  const trySubmit = (isPaid: boolean) => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setFormErrors(errors);
      setShowErrors(true);
      const nameValidationError = validateName(name);
      if (nameValidationError) setNameError(nameValidationError);
      return false;
    }

    setShowErrors(false);
    setFormErrors([]);

    const birthInfo: BirthInfo = {
      name,
      gender: gender!,
      calendarType,
      year: year as number,
      month: month as number,
      day: day as number,
      hour: timeSlot as number,
      minute: 0,
      province: province || undefined,
      city: city || undefined,
    };
    onSubmit(birthInfo, isPaid);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || disabled) return;

    onSubmit({
      gender: gender as Gender,
      year: year as number,
      month: month as number,
      day: day as number,
      hour: timeSlot as number,
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
    const hour = now.getHours();
    if (hour === 23 || hour === 0) setTimeSlot(0);
    else if (hour >= 1 && hour < 3) setTimeSlot(1);
    else if (hour >= 3 && hour < 5) setTimeSlot(3);
    else if (hour >= 5 && hour < 7) setTimeSlot(5);
    else if (hour >= 7 && hour < 9) setTimeSlot(7);
    else if (hour >= 9 && hour < 11) setTimeSlot(9);
    else if (hour >= 11 && hour < 13) setTimeSlot(11);
    else if (hour >= 13 && hour < 15) setTimeSlot(13);
    else if (hour >= 15 && hour < 17) setTimeSlot(15);
    else if (hour >= 17 && hour < 19) setTimeSlot(17);
    else if (hour >= 19 && hour < 21) setTimeSlot(19);
    else if (hour >= 21 && hour < 23) setTimeSlot(21);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 姓名和性别 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            姓名 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="请输入中文姓名"
            className={`input-apple ${nameError ? 'border-error' : ''}`}
            maxLength={4}
          />
          {nameError && (
            <p className="text-xs text-error mt-1">{nameError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            性别 <span className="text-error">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                gender === 'male'
                  ? 'bg-apple-blue text-white'
                  : 'bg-apple-gray-100 text-apple-gray-500 hover:bg-apple-gray-200'
              }`}
              onClick={() => setGender('male')}
            >
              男
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                gender === 'female'
                  ? 'bg-apple-blue text-white'
                  : 'bg-apple-gray-100 text-apple-gray-500 hover:bg-apple-gray-200'
              }`}
              onClick={() => setGender('female')}
            >
              女
            </button>
          </div>
        </div>
      </div>

      {/* 历法选择 */}
      <div>
        <label className="block text-sm font-medium text-apple-gray-600 mb-2">
          日历类型
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              calendarType === 'solar' ? 'border-apple-blue bg-apple-blue' : 'border-apple-gray-300'
            }`}>
              {calendarType === 'solar' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${calendarType === 'solar' ? 'text-apple-gray-600' : 'text-apple-gray-400'}`}>
              公历
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => setCalendarType('lunar')}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              calendarType === 'lunar' ? 'border-apple-blue bg-apple-blue' : 'border-apple-gray-300'
            }`}>
              {calendarType === 'lunar' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${calendarType === 'lunar' ? 'text-apple-gray-600' : 'text-apple-gray-400'}`}>
              农历
            </span>
          </label>
        </div>
        <input type="hidden" value={calendarType} onChange={() => {}} />
        <div className="hidden">
          <input
            type="radio"
            name="calendar"
            checked={calendarType === 'solar'}
            onChange={() => setCalendarType('solar')}
          />
          <input
            type="radio"
            name="calendar"
            checked={calendarType === 'lunar'}
            onChange={() => setCalendarType('lunar')}
          />
        </div>
      </div>

      {/* 出生日期 */}
      <div>
        <label className="block text-sm font-medium text-apple-gray-600 mb-2">
          出生日期 <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
            className="select-apple"
          >
            <option value="">年</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : '')}
            className="select-apple"
          >
            <option value="">月</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : '')}
            className="select-apple"
          >
            <option value="">日</option>
            {days.map((d) => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
        </div>
      </div>

      {/* 出生时间 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-apple-gray-600">
            出生时间 <span className="text-error">*</span>
          </label>
          <button
            type="button"
            onClick={setCurrentTime}
            className="text-xs text-apple-blue hover:underline"
          >
            填入当前时间
          </button>
        </div>
        <select
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value ? parseInt(e.target.value) : '')}
          className="select-apple w-full"
        >
          <option value="">请选择时间段</option>
          {TIME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 出生地 */}
      <div>
        <label className="block text-sm font-medium text-apple-gray-600 mb-2">
          出生地 <span className="text-apple-gray-400 text-xs font-normal">(选填)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="select-apple"
          >
            <option value="">省份</option>
            {CHINA_PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="select-apple"
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

      {/* 表单错误提示 */}
      {showErrors && formErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-error/5 border border-error/20">
          <p className="text-error text-sm font-medium mb-1">请完善以下信息：</p>
          <ul className="list-disc list-inside space-y-0.5">
            {formErrors.map((error, idx) => (
              <li key={idx} className="text-error/80 text-xs">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="space-y-3 pt-2">
        {/* 基础版 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            if (!isLoggedIn) {
              setLoginRedirectMessage('请先登录后生成报告');
              setShowLoginModal(true);
              return;
            }
            if (!trySubmit(false)) return;
            if (remainingUsage <= 0 && points < 10) {
              setFormErrors(['免费次数已用完，积分不足']);
              setShowErrors(true);
              return;
            }
          }}
          className="w-full py-4 rounded-xl border-2 border-apple-gray-200 bg-white hover:bg-apple-gray-50 transition-all group"
        >
          <div className="flex items-center justify-between px-4">
            <div className="text-left">
              <div className="text-apple-gray-600 font-medium">基础版</div>
              <p className="text-xs text-apple-gray-400">快速分析报告</p>
            </div>
            <div className="text-right">
              {remainingUsage > 0 ? (
                <div className="text-success font-medium">免费</div>
              ) : (
                <div className="text-apple-blue font-medium">10 积分</div>
              )}
            </div>
          </div>
        </button>

        {/* 完整版 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            if (!isLoggedIn) {
              setLoginRedirectMessage('请先登录后生成报告');
              setShowLoginModal(true);
              return;
            }
            const errors = getValidationErrors();
            if (errors.length > 0) {
              setFormErrors(errors);
              setShowErrors(true);
              const nameValidationError = validateName(name);
              if (nameValidationError) setNameError(nameValidationError);
              return;
            }
            if (points < detailedPrice) {
              setFormErrors([`积分不足，需要${detailedPrice}积分`]);
              setShowErrors(true);
              return;
            }
            trySubmit(true);
          }}
          className={`w-full py-4 rounded-xl transition-all ${
            points >= detailedPrice
              ? 'bg-apple-blue hover:bg-apple-blue-light text-white'
              : 'bg-apple-gray-100 text-apple-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between px-4">
            <div className="text-left">
              <div className="font-medium">完整版</div>
              <p className="text-xs opacity-80">详细分析 + 趋势预测</p>
            </div>
            <div className="text-right">
              <div className="font-medium">{detailedPrice} 积分</div>
            </div>
          </div>
        </button>
      </div>

      {/* 积分提示 */}
      {points < detailedPrice && !showErrors && (
        <p className="text-center text-xs text-apple-gray-400 mt-2">
          完整版需要 {detailedPrice} 积分
        </p>
      )}
    </form>
  );
}
