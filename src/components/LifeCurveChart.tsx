'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { ChartPoint, KLinePoint } from '@/types';

interface ChartProps {
  data: ChartPoint[] | KLinePoint[];
  currentAge?: number;
  birthYear: number;
}

interface InterpolatedPoint {
  age: number;
  year: number;
  score: number;
  daYun: string;
  ganZhi: string;
  reason: string;
  isKeyPoint: boolean; // 是否是原始关键点
}

// 三次样条插值函数
function cubicInterpolate(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;

  const a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
  const b = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
  const c = -0.5 * y0 + 0.5 * y2;
  const d = y1;

  return a * t3 + b * t2 + c * t + d;
}

export default function LifeCurveChart({ data, currentAge = 0, birthYear }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 对原始数据进行插值，生成每年的数据点
  const interpolatedData = useMemo((): InterpolatedPoint[] => {
    if (data.length === 0) return [];

    // 如果已经是100个点（付费版），直接使用
    if (data.length >= 50) {
      return data.map((point) => ({
        age: point.age,
        year: birthYear + point.age - 1,
        score: point.score,
        daYun: point.daYun,
        ganZhi: point.ganZhi,
        reason: point.reason,
        isKeyPoint: true,
      }));
    }

    // 免费版：10个点插值为每年的点
    const result: InterpolatedPoint[] = [];
    const sortedData = [...data].sort((a, b) => a.age - b.age);

    // 为每一年生成数据点
    for (let age = 1; age <= 90; age++) {
      // 找到这个年龄所在的区间
      let i = 0;
      while (i < sortedData.length - 1 && sortedData[i + 1].age <= age) {
        i++;
      }

      const currentPoint = sortedData[i];
      const nextPoint = sortedData[Math.min(i + 1, sortedData.length - 1)];
      const prevPoint = sortedData[Math.max(i - 1, 0)];
      const nextNextPoint = sortedData[Math.min(i + 2, sortedData.length - 1)];

      // 检查是否是关键点
      const keyPoint = sortedData.find(p => p.age === age);

      if (keyPoint) {
        // 如果是关键点，直接使用原始数据
        result.push({
          age,
          year: birthYear + age - 1,
          score: keyPoint.score,
          daYun: keyPoint.daYun,
          ganZhi: keyPoint.ganZhi,
          reason: keyPoint.reason,
          isKeyPoint: true,
        });
      } else {
        // 插值计算
        const x0 = prevPoint.age;
        const y0 = prevPoint.score;
        const x1 = currentPoint.age;
        const y1 = currentPoint.score;
        const x2 = nextPoint.age;
        const y2 = nextPoint.score;
        const x3 = nextNextPoint.age;
        const y3 = nextNextPoint.score;

        // 计算插值位置 t (0-1)
        const t = x1 === x2 ? 0 : (age - x1) / (x2 - x1);

        // 三次样条插值
        const interpolatedScore = Math.round(cubicInterpolate(x0, y0, x1, y1, x2, y2, x3, y3, t));

        // 限制分数范围
        const score = Math.max(30, Math.min(95, interpolatedScore));

        result.push({
          age,
          year: birthYear + age - 1,
          score,
          daYun: currentPoint.daYun,
          ganZhi: `${age}岁`,
          reason: `${currentPoint.daYun}运程中`,
          isKeyPoint: false,
        });
      }
    }

    return result;
  }, [data, birthYear]);

  // 找到大运分组
  const daYunGroups = useMemo(() => {
    const groups: { daYun: string; startIndex: number; endIndex: number }[] = [];
    let currentDaYun = '';
    let startIndex = 0;

    interpolatedData.forEach((point, idx) => {
      if (point.daYun !== currentDaYun) {
        if (currentDaYun) {
          groups.push({ daYun: currentDaYun, startIndex, endIndex: idx - 1 });
        }
        currentDaYun = point.daYun;
        startIndex = idx;
      }
    });
    if (currentDaYun) {
      groups.push({ daYun: currentDaYun, startIndex, endIndex: interpolatedData.length - 1 });
    }
    return groups;
  }, [interpolatedData]);

  // 图表配置
  const config = useMemo(() => {
    const padding = { top: 50, right: 35, bottom: 50, left: 45 };
    const width = 1100;
    const height = 350;
    return {
      padding,
      width,
      height,
      chartWidth: width - padding.left - padding.right,
      chartHeight: height - padding.top - padding.bottom,
    };
  }, []);

  // 计算X坐标
  const getX = useCallback((index: number) => {
    if (interpolatedData.length <= 1) return config.padding.left;
    return config.padding.left + (index / (interpolatedData.length - 1)) * config.chartWidth;
  }, [interpolatedData.length, config]);

  // 计算Y坐标 (0-100范围)
  const getY = useCallback((score: number) => {
    return config.padding.top + config.chartHeight - (score / 100) * config.chartHeight;
  }, [config]);

  // 生成平滑曲线路径
  const curvePath = useMemo(() => {
    if (interpolatedData.length === 0) return '';

    const points = interpolatedData.map((d, i) => ({
      x: getX(i),
      y: getY(d.score),
    }));

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    // 使用简单的线段连接（因为数据已经是插值后的）
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }, [interpolatedData, getX, getY]);

  // 填充区域路径
  const areaPath = useMemo(() => {
    if (!curvePath || interpolatedData.length === 0) return '';
    const lastX = getX(interpolatedData.length - 1);
    const firstX = getX(0);
    const bottomY = config.padding.top + config.chartHeight;
    return `${curvePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [curvePath, interpolatedData.length, getX, config]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scaleX = config.width / rect.width;
    const scaledX = x * scaleX;

    const relativeX = (scaledX - config.padding.left) / config.chartWidth;
    const index = Math.round(relativeX * (interpolatedData.length - 1));

    if (index >= 0 && index < interpolatedData.length) {
      setHoveredIndex(index);
      setTooltipPos({ x, y: e.clientY - rect.top });
    }
  }, [interpolatedData.length, config]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Y轴刻度
  const yTicks = [0, 25, 50, 75, 100];

  // X轴刻度 - 每10年显示
  const xTickAges = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];

  const hoveredData = hoveredIndex !== null ? interpolatedData[hoveredIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 标题和图例 */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-sm font-bold">K</span>
          <h3 className="text-base font-medium text-gray-800">
            人生流年大运曲线图
            <span className="text-xs text-gray-400 ml-2 font-normal">(评分仅和自身比较)</span>
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="text-green-600">吉运 (涨)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-red-500">凶运 (跌)</span>
          </span>
        </div>
      </div>

      {/* 图表容器 */}
      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${config.width} ${config.height}`}
            className="min-w-[900px] w-full"
            style={{ height: '350px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* 渐变填充 */}
              <linearGradient id="curveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Y轴网格线 */}
            {yTicks.map(tick => (
              <g key={tick}>
                <line
                  x1={config.padding.left}
                  y1={getY(tick)}
                  x2={config.width - config.padding.right}
                  y2={getY(tick)}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
                <text
                  x={config.padding.left - 8}
                  y={getY(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[11px]"
                  fill="#9CA3AF"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* 大运分割线和标签 */}
            {daYunGroups.map((group, idx) => {
              const startX = getX(group.startIndex);
              const endX = getX(group.endIndex);
              const midX = (startX + endX) / 2;

              return (
                <g key={idx}>
                  {/* 大运分割线 */}
                  {idx > 0 && (
                    <line
                      x1={startX}
                      y1={config.padding.top - 15}
                      x2={startX}
                      y2={config.height - config.padding.bottom}
                      stroke="#E5E7EB"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                  )}
                  {/* 大运名称 */}
                  <text
                    x={midX}
                    y={config.padding.top - 28}
                    textAnchor="middle"
                    className="text-[12px] font-medium"
                    fill="#DC2626"
                  >
                    {group.daYun}
                  </text>
                </g>
              );
            })}

            {/* 填充区域 */}
            <path d={areaPath} fill="url(#curveAreaGradient)" />

            {/* 曲线 */}
            <path
              d={curvePath}
              fill="none"
              stroke="#6366F1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* K线柱 - 每年都显示 */}
            {interpolatedData.map((point, idx) => {
              const x = getX(idx);
              const y = getY(point.score);
              const isHovered = hoveredIndex === idx;
              const isCurrent = point.age === currentAge;
              const barWidth = Math.max(4, config.chartWidth / interpolatedData.length * 0.7);

              // 计算K线柱的颜色（相对于前一年）
              const prevScore = idx > 0 ? interpolatedData[idx - 1].score : point.score;
              const isUp = point.score >= prevScore;
              const barTop = Math.min(y, getY(prevScore));
              const barHeight = Math.abs(y - getY(prevScore));

              return (
                <g key={idx}>
                  {/* K线柱 */}
                  <rect
                    x={x - barWidth / 2}
                    y={barTop}
                    width={barWidth}
                    height={Math.max(barHeight, 1)}
                    fill={isUp ? '#22C55E' : '#EF4444'}
                    opacity={isHovered ? 1 : 0.6}
                    rx="1"
                  />

                  {/* 当前年龄标记 */}
                  {isCurrent && (
                    <>
                      <line
                        x1={x}
                        y1={config.padding.top}
                        x2={x}
                        y2={config.height - config.padding.bottom}
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                      <text
                        x={x}
                        y={config.padding.top - 10}
                        textAnchor="middle"
                        className="text-[11px] font-bold"
                        fill="#F59E0B"
                      >
                        ★{point.score}
                      </text>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#F59E0B"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {/* 关键点标记 */}
                  {point.isKeyPoint && !isCurrent && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill="#6366F1"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}

                  {/* Hover点 */}
                  {isHovered && !isCurrent && !point.isKeyPoint && (
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={isUp ? '#22C55E' : '#EF4444'}
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}

            {/* X轴 */}
            <line
              x1={config.padding.left}
              y1={config.height - config.padding.bottom}
              x2={config.width - config.padding.right}
              y2={config.height - config.padding.bottom}
              stroke="#E5E7EB"
              strokeWidth="1"
            />

            {/* X轴刻度 - 每10年 */}
            {xTickAges.map(age => {
              const idx = interpolatedData.findIndex(p => p.age === age);
              if (idx === -1) return null;
              const x = getX(idx);
              return (
                <text
                  key={age}
                  x={x}
                  y={config.height - config.padding.bottom + 20}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill="#9CA3AF"
                >
                  {age}
                </text>
              );
            })}

            {/* 轴标签 */}
            <text
              x={config.width - 15}
              y={config.height - 15}
              textAnchor="end"
              className="text-[10px]"
              fill="#9CA3AF"
            >
              年龄
            </text>
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredData && (
          <div
            className="absolute z-50 pointer-events-none transition-opacity duration-150"
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.offsetWidth || 600) - 200),
              top: Math.max(tooltipPos.y - 120, 10),
            }}
          >
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[180px]">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                <div>
                  <span className="text-base font-bold text-gray-800">{hoveredData.year}年</span>
                  <span className="text-gray-600 ml-2">{hoveredData.ganZhi}</span>
                </div>
                <span className="text-sm text-gray-500">({hoveredData.age}岁)</span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-indigo-600">大运: {hoveredData.daYun}</span>
                {hoveredData.isKeyPoint && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold text-white bg-indigo-500">
                    关键年
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">运势评分:</span>
                <span className={`text-lg font-bold ${hoveredData.score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                  {hoveredData.score}
                </span>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                {hoveredData.reason}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
