'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { ChartPoint, PaidChartPoint } from '@/types';

interface ChartProps {
  data: ChartPoint[] | PaidChartPoint[];
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
  isKeyPoint: boolean;
}

// 三次样条插值
function cubicInterpolate(y0: number, y1: number, y2: number, y3: number, t: number): number {
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

  // 对原始数据进行插值
  const interpolatedData = useMemo((): InterpolatedPoint[] => {
    if (data.length === 0) return [];

    // 付费版直接使用
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

    // 免费版：插值
    const result: InterpolatedPoint[] = [];
    const sortedData = [...data].sort((a, b) => a.age - b.age);

    for (let age = 1; age <= 90; age++) {
      let i = 0;
      while (i < sortedData.length - 1 && sortedData[i + 1].age <= age) {
        i++;
      }

      const currentPoint = sortedData[i];
      const nextPoint = sortedData[Math.min(i + 1, sortedData.length - 1)];
      const prevPoint = sortedData[Math.max(i - 1, 0)];
      const nextNextPoint = sortedData[Math.min(i + 2, sortedData.length - 1)];

      const keyPoint = sortedData.find(p => p.age === age);

      if (keyPoint) {
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
        const t = currentPoint.age === nextPoint.age ? 0 : (age - currentPoint.age) / (nextPoint.age - currentPoint.age);
        const interpolatedScore = Math.round(cubicInterpolate(
          prevPoint.score, currentPoint.score, nextPoint.score, nextNextPoint.score, t
        ));

        // 优化算法：最小化波动，突出整体趋势
        // 目标：平滑过渡，让用户能清楚看到整体走势（低开高走、高开低走等）

        // 1. 极小的大运内波动（10年一个周期）- 进一步减小
        const daYunProgress = (age % 10) / 10; // 0-1，在大运中的进度
        const daYunWave = Math.sin(daYunProgress * Math.PI * 2) * 1; // 大运内小起伏，±1分（减半）

        // 2. 趋势因子：强化从currentPoint到nextPoint的平滑过渡
        const scoreDiff = nextPoint.score - currentPoint.score;
        const trendStrength = Math.abs(scoreDiff) > 15 ? 1.0 : 0.7;
        const trendFactor = scoreDiff * t * trendStrength;

        // 3. 只在特定年份添加微小转折（象征流年变化）- 进一步减小幅度
        let microFluctuation = 0;
        const yearInDaYun = age % 10;
        if (yearInDaYun === 3 || yearInDaYun === 7) {
          // 在大运的第3、7年添加极小波动
          microFluctuation = Math.sin(age * 1.7) * 1.5; // 从2.5减到1.5
        }

        // 综合波动（控制在±3分以内，让整体趋势更明显）
        const totalFluctuation = daYunWave + trendFactor + microFluctuation;
        const scoreWithFluctuation = interpolatedScore + totalFluctuation;
        const score = Math.max(30, Math.min(95, Math.round(scoreWithFluctuation)));

        // 生成该大运阶段的通用描述
        const daYunDescription = `${currentPoint.daYun}大运期间，${currentPoint.reason.slice(0, 15)}`;

        result.push({
          age,
          year: birthYear + age - 1,
          score,
          daYun: currentPoint.daYun,
          ganZhi: `流年${age}岁`,
          reason: daYunDescription,
          isKeyPoint: false,
        });
      }
    }

    return result;
  }, [data, birthYear]);

  // 大运分组
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
    const height = 450; // 增加高度，让曲线更清晰易读
    return {
      padding,
      width,
      height,
      chartWidth: width - padding.left - padding.right,
      chartHeight: height - padding.top - padding.bottom,
    };
  }, []);

  const getX = useCallback((index: number) => {
    if (interpolatedData.length <= 1) return config.padding.left;
    return config.padding.left + (index / (interpolatedData.length - 1)) * config.chartWidth;
  }, [interpolatedData.length, config]);

  const getY = useCallback((score: number) => {
    return config.padding.top + config.chartHeight - (score / 100) * config.chartHeight;
  }, [config]);

  // 生成平滑曲线 - 使用贝塞尔曲线
  const curvePath = useMemo(() => {
    if (interpolatedData.length === 0) return '';

    const points = interpolatedData.map((d, i) => ({
      x: getX(i),
      y: getY(d.score),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  }, [interpolatedData, getX, getY]);

  // 填充区域
  const areaPath = useMemo(() => {
    if (!curvePath || interpolatedData.length === 0) return '';
    const lastX = getX(interpolatedData.length - 1);
    const firstX = getX(0);
    const bottomY = config.padding.top + config.chartHeight;
    return `${curvePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [curvePath, interpolatedData.length, getX, config]);

  // 鼠标事件
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

  const yTicks = [0, 25, 50, 75, 100];
  const xTickAges = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  const hoveredData = hoveredIndex !== null ? interpolatedData[hoveredIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 标题 */}
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

      {/* 图表 */}
      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${config.width} ${config.height}`}
            className="min-w-[900px] w-full"
            style={{ height: '320px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>

            {/* Y轴网格 */}
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

            {/* 大运标签 */}
            {daYunGroups.map((group, idx) => {
              const startX = getX(group.startIndex);
              const endX = getX(group.endIndex);
              const midX = (startX + endX) / 2;

              return (
                <g key={idx}>
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
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* 平滑曲线 */}
            <path
              d={curvePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 关键数据点 */}
            {interpolatedData.map((point, idx) => {
              const x = getX(idx);
              const y = getY(point.score);
              const isHovered = hoveredIndex === idx;
              const isCurrent = point.age === currentAge;

              return (
                <g key={idx}>
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
                      <circle cx={x} cy={y} r="6" fill="#F59E0B" stroke="white" strokeWidth="2" />
                    </>
                  )}

                  {/* Hover点 */}
                  {isHovered && !isCurrent && (
                    <circle cx={x} cy={y} r="5" fill="#8B5CF6" stroke="white" strokeWidth="2" />
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

            {/* X轴刻度 */}
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
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.offsetWidth || 600) - 200),
              top: Math.max(tooltipPos.y - 100, 10),
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
