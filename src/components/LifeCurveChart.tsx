'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { ChartPoint, KLinePoint } from '@/types';

interface ChartProps {
  data: ChartPoint[] | KLinePoint[];
  currentAge?: number;
  isPaid?: boolean;
  birthYear: number;
}

interface TooltipData {
  age: number;
  year: number;
  score: number;
  daYun: string;
  ganZhi: string;
  reason: string;
  isUp: boolean;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
}

export default function LifeCurveChart({ data, currentAge = 0, isPaid = false, birthYear }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ data: TooltipData; x: number; y: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 处理数据
  const chartData = useMemo(() => {
    return data.map((point) => {
      const year = birthYear + point.age - 1;
      const baseData = {
        age: point.age,
        year,
        daYun: point.daYun,
        ganZhi: point.ganZhi,
        reason: point.reason,
      };

      if ('open' in point) {
        return {
          ...baseData,
          score: point.score,
          open: point.open,
          close: point.close,
          high: point.high,
          low: point.low,
          isUp: point.close >= point.open,
        };
      }
      return {
        ...baseData,
        score: point.score,
        isUp: point.score >= 60,
      };
    });
  }, [data, birthYear]);

  // 计算图表范围
  const { minScore, scoreRange } = useMemo(() => {
    const scores = chartData.map(d => d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    return {
      minScore: Math.max(0, min - 10),
      scoreRange: max - min + 20,
    };
  }, [chartData]);

  // 找到大运分割点
  const daYunGroups = useMemo(() => {
    const groups: { daYun: string; startIndex: number; endIndex: number }[] = [];
    let currentDaYun = '';
    let startIndex = 0;

    chartData.forEach((point, idx) => {
      if (point.daYun !== currentDaYun) {
        if (currentDaYun) {
          groups.push({ daYun: currentDaYun, startIndex, endIndex: idx - 1 });
        }
        currentDaYun = point.daYun;
        startIndex = idx;
      }
    });
    if (currentDaYun) {
      groups.push({ daYun: currentDaYun, startIndex, endIndex: chartData.length - 1 });
    }
    return groups;
  }, [chartData]);

  // SVG 尺寸
  const padding = useMemo(() => ({ top: 40, right: 30, bottom: 40, left: 50 }), []);
  const height = 320;
  const chartWidth = 100 - 8; // percentage minus padding
  const chartHeight = height - padding.top - padding.bottom;

  // 计算点位置
  const getX = useCallback((index: number) => {
    return padding.left + (index / (chartData.length - 1)) * (chartWidth - padding.left - padding.right) * (100 / chartWidth);
  }, [chartData.length, chartWidth, padding.left, padding.right]);

  const getY = useCallback((score: number) => {
    return padding.top + chartHeight - ((score - minScore) / scoreRange) * chartHeight;
  }, [minScore, scoreRange, chartHeight, padding.top]);

  // 生成曲线路径
  const curvePath = useMemo(() => {
    if (chartData.length === 0) return '';

    const points = chartData.map((d, i) => ({
      x: getX(i),
      y: getY(d.score),
    }));

    // 使用三次贝塞尔曲线创建平滑曲线
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const tension = 0.3;

      const cp1x = current.x + (next.x - (points[i - 1]?.x ?? current.x)) * tension;
      const cp1y = current.y + (next.y - (points[i - 1]?.y ?? current.y)) * tension;
      const cp2x = next.x - (points[i + 2]?.x ?? next.x) * tension + current.x * tension;
      const cp2y = next.y - (points[i + 2]?.y ?? next.y) * tension + current.y * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
  }, [chartData, getX, getY]);

  // 填充区域路径
  const areaPath = useMemo(() => {
    if (!curvePath) return '';
    const lastX = getX(chartData.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + chartHeight;
    return `${curvePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [curvePath, chartData.length, getX, chartHeight, padding.top]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x / rect.width;

    const index = Math.round(relativeX * (chartData.length - 1));
    if (index >= 0 && index < chartData.length) {
      setHoveredIndex(index);
      const point = chartData[index];
      setTooltip({
        data: point as TooltipData,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [chartData]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltip(null);
  }, []);

  // Y轴刻度
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const value = Math.round(minScore + (scoreRange * i) / 4);
      ticks.push(value);
    }
    return ticks;
  }, [minScore, scoreRange]);

  // X轴刻度 (每10年)
  const xTicks = useMemo(() => {
    return chartData.filter(d => d.age % 10 === 1 || d.age === 1);
  }, [chartData]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-serif" style={{ color: '#6366F1' }}>人生流年大运曲线图</span>
          <span className="text-xs text-gray-500">(评分仅和自身比较)</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span style={{ color: '#10B981' }}>吉运 (涨)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            <span style={{ color: '#EF4444' }}>凶运 (跌)</span>
          </span>
        </div>
      </div>

      {/* 图表容器 */}
      <div className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        >
          <defs>
            {/* 渐变填充 */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.02" />
            </linearGradient>
            {/* 线条渐变 */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>

          {/* 背景网格 */}
          {yTicks.map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={getY(tick)}
              x2={100 - padding.right}
              y2={getY(tick)}
              stroke="#F3F4F6"
              strokeWidth="0.5"
            />
          ))}

          {/* Y轴刻度 */}
          {yTicks.map((tick, i) => (
            <text
              key={`y-${i}`}
              x={padding.left - 5}
              y={getY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#9CA3AF"
              fontSize="3"
            >
              {tick}
            </text>
          ))}

          {/* 大运分割线和标签 */}
          {daYunGroups.map((group, i) => {
            const startX = getX(group.startIndex);
            return (
              <g key={`dayun-${i}`}>
                {i > 0 && (
                  <line
                    x1={startX}
                    y1={padding.top - 15}
                    x2={startX}
                    y2={padding.top + chartHeight}
                    stroke="#E5E7EB"
                    strokeDasharray="2,2"
                    strokeWidth="0.3"
                  />
                )}
                <text
                  x={getX(group.startIndex + (group.endIndex - group.startIndex) / 2)}
                  y={padding.top - 8}
                  textAnchor="middle"
                  fill="#6366F1"
                  fontSize="3"
                  fontWeight="500"
                >
                  {group.daYun}
                </text>
              </g>
            );
          })}

          {/* 60分基准线 */}
          <line
            x1={padding.left}
            y1={getY(60)}
            x2={100 - padding.right}
            y2={getY(60)}
            stroke="#D1D5DB"
            strokeDasharray="3,3"
            strokeWidth="0.3"
          />

          {/* 填充区域 */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
          />

          {/* 曲线 */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 数据点 */}
          {chartData.map((point, i) => {
            const x = getX(i);
            const y = getY(point.score);
            const isHovered = hoveredIndex === i;
            const isCurrent = point.age === currentAge;
            const isHighlight = point.score >= 85;
            const isWarning = point.score < 40;

            return (
              <g key={`point-${i}`}>
                {(isHovered || isCurrent || isHighlight || isWarning) && (
                  <>
                    {/* 点 */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 2 : 1.5}
                      fill={point.isUp ? '#10B981' : '#EF4444'}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    {/* 高光点标注 */}
                    {isHighlight && !isHovered && (
                      <text
                        x={x}
                        y={y - 5}
                        textAnchor="middle"
                        fill="#F59E0B"
                        fontSize="3"
                      >
                        {point.score}
                      </text>
                    )}
                    {/* 当前年份标注 */}
                    {isCurrent && (
                      <>
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={padding.top + chartHeight}
                          stroke="#F59E0B"
                          strokeDasharray="2,1"
                          strokeWidth="0.3"
                        />
                        <text
                          x={x}
                          y={padding.top - 3}
                          textAnchor="middle"
                          fill="#F59E0B"
                          fontSize="3"
                          fontWeight="bold"
                        >
                          今
                        </text>
                      </>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* X轴 */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={100 - padding.right}
            y2={padding.top + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="0.3"
          />

          {/* X轴刻度 */}
          {xTicks.map((point, i) => {
            const idx = chartData.findIndex(d => d.age === point.age);
            const x = getX(idx);
            return (
              <text
                key={`x-${i}`}
                x={x}
                y={padding.top + chartHeight + 12}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="3"
              >
                {point.age}
              </text>
            );
          })}

          {/* Y轴标签 */}
          <text
            x={10}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="3"
            transform={`rotate(-90, 10, ${padding.top + chartHeight / 2})`}
          >
            运势分
          </text>

          {/* X轴标签 */}
          <text
            x={50}
            y={height - 5}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="3"
          >
            年龄
          </text>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltip.x, (containerRef.current?.offsetWidth || 0) - 200),
              top: tooltip.y + 20,
            }}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-lg font-bold text-gray-800">{tooltip.data.year} </span>
                  <span className="text-gray-800">{tooltip.data.ganZhi}</span>
                  <span className="text-gray-500 ml-1">({tooltip.data.age}岁)</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold text-white ${
                    tooltip.data.isUp ? 'bg-red-500' : 'bg-green-500'
                  }`}
                >
                  {tooltip.data.isUp ? '吉' : '凶'} {tooltip.data.isUp ? '▲' : '▼'}
                </span>
              </div>

              <div className="text-sm text-indigo-600 mb-3">
                大运: {tooltip.data.daYun}
              </div>

              {isPaid && tooltip.data.open !== undefined && (
                <div className="grid grid-cols-4 gap-2 mb-3 text-center text-sm">
                  <div>
                    <div className="text-gray-400">开盘</div>
                    <div className="font-mono font-bold text-gray-700">{tooltip.data.open}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">收盘</div>
                    <div className="font-mono font-bold text-gray-700">{tooltip.data.close}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">最高</div>
                    <div className="font-mono font-bold text-gray-700">{tooltip.data.high}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">最低</div>
                    <div className="font-mono font-bold text-gray-700">{tooltip.data.low}</div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 leading-relaxed">
                {tooltip.data.reason}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
