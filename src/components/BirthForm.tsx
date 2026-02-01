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
  points?: number; // 当前积分
  detailedPrice?: number; // 精批价格（从后台配置获取）
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

export default function BirthForm({ onSubmit, disabled, remainingUsage, points = 0, detailedPrice = 200 }: BirthFormProps) {
  const { isLoggedIn, setShowLoginModal, setLoginRedirectMessage } = useAuth();
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
  // 表单验证错误
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // 姓名校验 - 详细错误提示
  const validateName = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return '请输入姓名';
    }
    // 检测空格
    if (value.includes(' ')) {
      return '姓名不能包含空格';
    }
    // 检测英文
    if (/[a-zA-Z]/.test(value)) {
      return '姓名不能包含英文字母';
    }
    // 检测数字
    if (/[0-9]/.test(value)) {
      return '姓名不能包含数字';
    }
    // 检测特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value)) {
      return '姓名不能包含特殊字符';
    }
    // 检测非中文字符
    if (!/^[\u4e00-\u9fa5]+$/.test(value)) {
      return '姓名只能包含中文汉字';
    }
    // 检测长度
    if (value.length < 2) {
      return '姓名至少需要2个汉字';
    }
    if (value.length > 4) {
      return '姓名最多4个汉字';
    }
    return '';
  };

  // 姓名校验
  const handleNameChange = (value: string) => {
    setName(value);
    const error = validateName(value);
    setNameError(error);
    if (showErrors) setShowErrors(false);
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

  // 获取所有验证错误
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    // 姓名验证
    const nameValidationError = validateName(name);
    if (nameValidationError) {
      errors.push(nameValidationError);
    }

    // 性别验证
    if (!gender) {
      errors.push('请选择性别参数');
    }

    // 年份验证
    if (!year) {
      errors.push('请选择出生年份');
    }

    // 月份验证
    if (!month) {
      errors.push('请选择出生月份');
    }

    // 日期验证
    if (!day) {
      errors.push('请选择出生日期');
    }

    // 时辰验证
    if (shiChen === '') {
      errors.push('请选择出生时段');
    }

    return errors;
  };

  // 尝试提交并显示错误
  const trySubmit = (isPaid: boolean) => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setFormErrors(errors);
      setShowErrors(true);
      // 如果姓名有问题，同时设置 nameError
      const nameValidationError = validateName(name);
      if (nameValidationError) {
        setNameError(nameValidationError);
      }
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
      hour: shiChen as number,
      minute: 0,
      province: province || undefined,
      city: city || undefined,
    };
    onSubmit(birthInfo, isPaid);
    return true;
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            标识符 <span className="text-kline-down text-xs">(姓名)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="请输入中文姓名"
            className={`input-tech ${nameError ? 'border-neon-red' : ''}`}
            maxLength={4}
          />
          {nameError && (
            <p className="text-xs text-neon-red mt-1">{nameError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            性别参数 <span className="text-kline-down text-xs">(必选)</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center border ${
                gender === 'male'
                  ? 'bg-cyber-400/10 border-cyber-400 text-cyber-400'
                  : 'bg-black/40 border-white/10 text-text-secondary hover:border-white/20'
              }`}
              onClick={() => setGender('male')}
            >
              <span className="mr-1.5">♂</span> Male
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center border ${
                gender === 'female'
                  ? 'bg-cyber-400/10 border-cyber-400 text-cyber-400'
                  : 'bg-black/40 border-white/10 text-text-secondary hover:border-white/20'
              }`}
              onClick={() => setGender('female')}
            >
              <span className="mr-1.5">♀</span> Female
            </button>
          </div>
        </div>
      </div>

      {/* 历法选择 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          日历系统 <span className="text-text-muted text-xs">(Calendar System)</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
              calendarType === 'solar' ? 'border-cyber-400' : 'border-white/30 group-hover:border-white/50'
            }`}>
              {calendarType === 'solar' && <div className="w-2 h-2 rounded-full bg-cyber-400"></div>}
            </div>
            <span className={`text-sm ${calendarType === 'solar' ? 'text-cyber-400' : 'text-text-secondary'}`}>
              公历 (Solar)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
              calendarType === 'lunar' ? 'border-cyber-400' : 'border-white/30 group-hover:border-white/50'
            }`}>
              {calendarType === 'lunar' && <div className="w-2 h-2 rounded-full bg-cyber-400"></div>}
            </div>
            <span className={`text-sm ${calendarType === 'lunar' ? 'text-cyber-400' : 'text-text-secondary'}`}>
              农历 (Lunar)
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
        <div onClick={() => setCalendarType(calendarType === 'solar' ? 'lunar' : 'solar')} className="hidden"></div>
      </div>

      {/* 出生日期 - 全部下拉选择 */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          时间坐标 <span className="text-text-muted text-xs">(Birth Date)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
            className="select-tech w-full"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : '')}
            className="select-tech w-full"
          >
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : '')}
            className="select-tech w-full"
          >
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
        </div>
      </div>

      {/* 出生时辰 - 12时辰选择 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-text-secondary">
            时段参数 <span className="text-text-muted text-xs">(Time Period)</span>
          </label>
          <button
            type="button"
            onClick={setCurrentTime}
            className="text-xs text-cyber-400 hover:text-cyber-300 px-2 py-1 rounded-lg border border-cyber-400/30 hover:border-cyber-400/50 bg-cyber-400/5 transition-all"
          >
            Now
          </button>
        </div>
        <select
          value={shiChen}
          onChange={(e) => setShiChen(e.target.value ? parseInt(e.target.value) : '')}
          className="select-tech w-full"
        >
          <option value="">Select Time Period</option>
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
          地理坐标 <span className="text-text-muted text-xs">(Location - Optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="select-tech"
          >
            <option value="">Province</option>
            {CHINA_PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="select-tech"
            disabled={!province}
          >
            <option value="">City</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 时空矩阵预览 */}
      {baziResult && (
        <div className="p-4 rounded-xl bg-tech-800/50 border border-white/10">
          <div className="text-center mb-3">
            <span className="text-xs text-cyber-400 font-mono uppercase tracking-wider">Temporal Matrix Preview</span>
            <p className="text-xs text-text-muted mt-1">
              {baziResult.chart.lunarDate} · {baziResult.chart.zodiac}年
            </p>
          </div>

          {/* 四柱八字 */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Y', pillar: baziResult.chart.yearPillar, naYin: baziResult.naYin.year },
              { label: 'M', pillar: baziResult.chart.monthPillar, naYin: baziResult.naYin.month },
              { label: 'D', pillar: baziResult.chart.dayPillar, naYin: baziResult.naYin.day },
              { label: 'H', pillar: baziResult.chart.hourPillar, naYin: baziResult.naYin.hour },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xs text-text-muted mb-1 font-mono">{item.label}</div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/10">
                  <div className="text-cyber-400 font-bold text-lg">{item.pillar.heavenlyStem}</div>
                  <div className="text-white font-bold text-lg">{item.pillar.earthlyBranch}</div>
                </div>
                <div className="text-xs text-text-muted/70 mt-1">{item.naYin}</div>
              </div>
            ))}
          </div>

          {/* 五行统计 */}
          <div className="flex justify-center gap-3 text-xs mb-3">
            <span className="text-neon-green">木{baziResult.wuXing.year.includes('木') ? 1 : 0}{baziResult.wuXing.month.includes('木') ? 1 : 0}{baziResult.wuXing.day.includes('木') ? 1 : 0}{baziResult.wuXing.hour.includes('木') ? 1 : 0}</span>
            <span className="text-neon-red">火{baziResult.wuXing.year.includes('火') ? 1 : 0}{baziResult.wuXing.month.includes('火') ? 1 : 0}{baziResult.wuXing.day.includes('火') ? 1 : 0}{baziResult.wuXing.hour.includes('火') ? 1 : 0}</span>
            <span className="text-yellow-400">土{baziResult.wuXing.year.includes('土') ? 1 : 0}{baziResult.wuXing.month.includes('土') ? 1 : 0}{baziResult.wuXing.day.includes('土') ? 1 : 0}{baziResult.wuXing.hour.includes('土') ? 1 : 0}</span>
            <span className="text-gray-300">金{baziResult.wuXing.year.includes('金') ? 1 : 0}{baziResult.wuXing.month.includes('金') ? 1 : 0}{baziResult.wuXing.day.includes('金') ? 1 : 0}{baziResult.wuXing.hour.includes('金') ? 1 : 0}</span>
            <span className="text-neon-blue">水{baziResult.wuXing.year.includes('水') ? 1 : 0}{baziResult.wuXing.month.includes('水') ? 1 : 0}{baziResult.wuXing.day.includes('水') ? 1 : 0}{baziResult.wuXing.hour.includes('水') ? 1 : 0}</span>
          </div>

          {/* 大运预览 */}
          {daYunResult && daYunResult.daYunList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-cyber-400 text-center mb-2 font-mono uppercase tracking-wider">Cycle Sequence</div>
              <div className="text-xs text-text-muted/70 text-center mb-2">{daYunResult.startInfo}</div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {daYunResult.daYunList.slice(0, 8).map((daYun, idx) => (
                  <div key={idx} className="flex-shrink-0 text-center px-2 py-1 bg-black/40 rounded-lg border border-white/10">
                    <div className="text-cyber-400 text-sm font-medium">{daYun.ganZhi}</div>
                    <div className="text-text-muted/60 text-xs">{daYun.startAge}-{daYun.endAge}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 表单错误提示 */}
      {showErrors && formErrors.length > 0 && (
        <div className="p-3 rounded-xl bg-neon-red/10 border border-neon-red/30">
          <p className="text-neon-red text-sm font-medium mb-1">请完善以下参数：</p>
          <ul className="list-disc list-inside space-y-0.5">
            {formErrors.map((error, idx) => (
              <li key={idx} className="text-neon-red/80 text-xs">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SaaS-style Pricing Buttons */}
      <div className="space-y-3">
        {/* Starter Plan */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            // 检查登录状态
            if (!isLoggedIn) {
              setLoginRedirectMessage('请先登录后再生成报告');
              setShowLoginModal(true);
              return;
            }
            // 先验证表单
            if (!trySubmit(false)) return;
            // 再检查积分
            if (remainingUsage <= 0 && points < 10) {
              setFormErrors(['免费额度已用完，积分不足']);
              setShowErrors(true);
              return;
            }
          }}
          className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">Starter</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-text-muted">基础版</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">快速概览 · 5维度分析</p>
            </div>
            <div className="text-right">
              {remainingUsage > 0 ? (
                <div className="text-neon-green font-mono text-lg">FREE</div>
              ) : (
                <div className="text-cyber-400 font-mono text-lg">10 pts</div>
              )}
            </div>
          </div>
        </button>

        {/* Pro Plan */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            // 检查登录状态
            if (!isLoggedIn) {
              setLoginRedirectMessage('请先登录后再生成报告');
              setShowLoginModal(true);
              return;
            }
            // 先验证表单
            const errors = getValidationErrors();
            if (errors.length > 0) {
              setFormErrors(errors);
              setShowErrors(true);
              const nameValidationError = validateName(name);
              if (nameValidationError) {
                setNameError(nameValidationError);
              }
              return;
            }
            // 再检查积分
            if (points < detailedPrice) {
              setFormErrors([`积分不足，需要${detailedPrice}积分解锁专业版`]);
              setShowErrors(true);
              return;
            }
            trySubmit(true);
          }}
          className={`w-full p-4 rounded-xl border transition-all relative overflow-hidden group ${
            points >= detailedPrice
              ? 'border-cyber-400/50 bg-cyber-400/10 hover:bg-cyber-400/20 hover:border-cyber-400'
              : 'border-white/10 bg-white/5 opacity-60'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/0 via-cyber-400/10 to-cyber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

          <div className="flex items-center justify-between relative">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-cyber-400 font-medium">Professional</span>
                <span className="badge badge-pro text-xs">专业版</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">深度分析 · 8维度解析 · 周期预测</p>
            </div>
            <div className="text-right">
              <div className="text-cyber-400 font-mono text-lg">{detailedPrice} pts</div>
            </div>
          </div>
        </button>
      </div>

      {/* 积分不足提示 */}
      {points < detailedPrice && !showErrors && (
        <p className="text-center text-xs text-text-muted mt-2">
          需要 <span className="text-cyber-400 font-mono">{detailedPrice}</span> 积分解锁专业版分析
        </p>
      )}
    </form>
  );
}
