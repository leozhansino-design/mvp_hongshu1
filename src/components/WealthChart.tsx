'use client';

import { useMemo } from 'react';
import { WealthDataPoint, WealthHighlights, WealthRange } from '@/types';

interface WealthChartProps {
  dataPoints: WealthDataPoint[];
  highlights: WealthHighlights;
  wealthRange: WealthRange;
  isPaid?: boolean;
  hideUpgradePrompt?: boolean; // 用于分享图片时隐藏升级提示
}

// 图表尺寸常量
const CHART_WIDTH = 800;
const CHART_HEIGHT = 400;
const CHART_PADDING = { top: 40, right: 40, bottom: 50, left: 70 };

export default function WealthChart({
  dataPoints,
  highlights,
  wealthRange,
  isPaid = false,
  hideUpgradePrompt = false,
}: WealthChartProps) {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  const padding = CHART_PADDING;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 计算坐标
  const { path, areaPath, points, peakPoint, yTicks, xTicks, showBillionPlus } = useMemo(() => {
    // 验证数据
    if (!dataPoints || dataPoints.length === 0) {
      return { path: '', areaPath: '', points: [], peakPoint: null, yTicks: [], xTicks: [], showBillionPlus: false };
    }

    // 过滤无效数据点
    const validDataPoints = dataPoints.filter(d =>
      d && typeof d.age === 'number' && typeof d.wealth === 'number' &&
      !isNaN(d.age) && !isNaN(d.wealth)
    );

    if (validDataPoints.length === 0) {
      return { path: '', areaPath: '', points: [], peakPoint: null, yTicks: [], xTicks: [], showBillionPlus: false };
    }

    const minAge = 18;
    const maxAge = 80;
    const minWealth = wealthRange?.min ?? 0;
    // 确保 maxWealth 有效且大于 minWealth
    let maxWealth = wealthRange?.max ?? 1000;
    if (isNaN(maxWealth) || maxWealth <= minWealth) {
      // 从数据点中计算最大值
      maxWealth = Math.max(...validDataPoints.map(d => d.wealth), 1000);
    }

    // 如果最大值超过1亿（10000万），Y轴最高显示1亿+
    const displayMaxWealth = maxWealth > 10000 ? 12000 : maxWealth; // 留一点余量显示1亿+

    // X 坐标转换
    const xScale = (age: number) => {
      const val = padding.left + ((age - minAge) / (maxAge - minAge)) * chartWidth;
      return isNaN(val) ? padding.left : val;
    };

    // Y 坐标转换 - 使用 displayMaxWealth 来限制Y轴
    const yScale = (wealth: number) => {
      // 超过1亿的部分压缩显示在顶部
      const cappedWealth = Math.min(wealth, displayMaxWealth);
      const range = displayMaxWealth - minWealth;
      if (range <= 0) return padding.top + chartHeight / 2;
      const val = padding.top + chartHeight - ((cappedWealth - minWealth) / range) * chartHeight;
      return isNaN(val) ? padding.top + chartHeight : val;
    };

    // 生成平滑曲线路径 - 使用验证过的数据点
    const pts = validDataPoints.map((d) => ({
      x: xScale(d.age),
      y: yScale(d.wealth),
      age: d.age,
      wealth: d.wealth,
    }));

    // 使用 Catmull-Rom 样条曲线生成平滑路径
    let pathD = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      // 计算控制点
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    // 填充区域路径
    const areaD = pathD + ` L ${pts[pts.length - 1].x} ${padding.top + chartHeight} L ${pts[0].x} ${padding.top + chartHeight} Z`;

    // 找到巅峰点
    const peak = pts.find((p) => p.age === highlights.peakAge) || null;

    // Y轴刻度 - 超过1亿时，最高显示"1亿+"
    const yTickCount = 5;
    const yTickValues = Array.from({ length: yTickCount + 1 }, (_, i) => {
      const value = minWealth + (displayMaxWealth - minWealth) * (i / yTickCount);
      return value;
    });
    // 如果原始最大值超过1亿，标记需要显示"1亿+"
    const showBillionPlus = maxWealth > 10000;

    // X轴刻度
    const xTickValues = [18, 30, 40, 50, 60, 70, 80];

    return {
      path: pathD,
      areaPath: areaD,
      points: pts,
      peakPoint: peak,
      yTicks: yTickValues.map((v) => ({ value: v, y: yScale(v) })),
      xTicks: xTickValues.map((v) => ({ value: v, x: xScale(v) })),
      showBillionPlus,
    };
  }, [dataPoints, highlights, wealthRange, chartWidth, chartHeight]);

  // 格式化金额 - 用于坐标轴（简短）
  const formatWealthAxis = (value: number, isTopTick: boolean = false) => {
    // 如果是最高刻度且超过1亿，显示"1亿+"
    if (isTopTick && showBillionPlus && value >= 10000) {
      return '1亿+';
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}亿`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}千万`;
    }
    return `${value.toFixed(0)}万`;
  };

  // 格式化金额 - 用于tooltip和标注（戏剧性显示）
  const formatWealth = (value: number) => {
    if (value >= 10000) {
      return '突破一亿·不可估量';
    }
    if (value >= 5000) {
      return `${(value / 10000).toFixed(1)}亿`;
    }
    return `${Math.round(value)}万`;
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        <defs>
          {/* 金色渐变 */}
          <linearGradient id="wealthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
          {/* 填充渐变 */}
          <linearGradient id="wealthFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.05" />
          </linearGradient>
          {/* 发光效果 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 网格线 */}
        {yTicks.map((tick, i) => (
          <line
            key={`y-grid-${i}`}
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            stroke="#333"
            strokeDasharray="4 4"
            strokeOpacity="0.5"
          />
        ))}

        {/* X轴 */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke="#555"
          strokeWidth="1"
        />

        {/* Y轴 */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#555"
          strokeWidth="1"
        />

        {/* Y轴刻度和标签 */}
        {yTicks.map((tick, i) => (
          <g key={`y-tick-${i}`}>
            <line
              x1={padding.left - 5}
              y1={tick.y}
              x2={padding.left}
              y2={tick.y}
              stroke="#555"
            />
            <text
              x={padding.left - 10}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-400"
            >
              {formatWealthAxis(tick.value, i === yTicks.length - 1)}
            </text>
          </g>
        ))}

        {/* X轴刻度和标签 */}
        {xTicks.map((tick, i) => (
          <g key={`x-tick-${i}`}>
            <line
              x1={tick.x}
              y1={padding.top + chartHeight}
              x2={tick.x}
              y2={padding.top + chartHeight + 5}
              stroke="#555"
            />
            <text
              x={tick.x}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {tick.value}岁
            </text>
          </g>
        ))}

        {/* 填充区域 */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#wealthFillGradient)"
          />
        )}

        {/* 曲线 */}
        {path && (
          <path
            d={path}
            fill="none"
            stroke="url(#wealthGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* 数据点（付费版显示更多） */}
        {isPaid && points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="2"
            fill="#FFD700"
            opacity="0.6"
          />
        ))}

        {/* 巅峰点标注 */}
        {peakPoint && (
          <g>
            {/* 巅峰点圆圈 */}
            <circle
              cx={peakPoint.x}
              cy={peakPoint.y}
              r="8"
              fill="#FFD700"
              filter="url(#glow)"
            />
            <circle
              cx={peakPoint.x}
              cy={peakPoint.y}
              r="4"
              fill="#FFF"
            />

            {/* 标注文字背景 */}
            <rect
              x={peakPoint.x - 60}
              y={peakPoint.y - 45}
              width="120"
              height="28"
              rx="4"
              fill="rgba(0,0,0,0.8)"
              stroke="#FFD700"
              strokeWidth="1"
            />

            {/* 标注文字 */}
            <text
              x={peakPoint.x}
              y={peakPoint.y - 27}
              textAnchor="middle"
              className="text-sm font-bold fill-white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {highlights.peakAge}岁 · {formatWealth(highlights.peakWealth)}
            </text>
          </g>
        )}

        {/* Y轴标题 */}
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          className="text-xs fill-gray-400"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          累计财富（{wealthRange.unit}）
        </text>

        {/* X轴标题 */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-xs fill-gray-400"
        >
          年龄
        </text>
      </svg>

      {/* 免费版提示 - 分享图片时隐藏 */}
      {!isPaid && !hideUpgradePrompt && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 border border-gold-400/30 rounded-lg px-4 py-2 text-center">
          <p className="text-sm text-gold-400">
            解锁完整版，查看每年详细走势
          </p>
        </div>
      )}
    </div>
  );
}
