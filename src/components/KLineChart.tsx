'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from 'recharts';
import { ChartPoint, PaidChartPoint } from '@/types';

interface FreeChartProps {
  data: ChartPoint[];
  currentAge?: number;
  isPaid?: false;
}

interface PaidChartProps {
  data: PaidChartPoint[];
  currentAge?: number;
  isPaid: true;
  highlights?: { age: number; score?: number }[];
  warnings?: { age: number; score?: number }[];
}

type KLineChartProps = FreeChartProps | PaidChartProps;

interface TooltipPayloadItem {
  payload: ChartPoint | PaidChartPoint;
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  isPaid?: boolean;
}

function CustomTooltip({ active, payload, isPaid }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="mystic-card p-3 min-w-[120px]">
      <p className="font-mono text-gold-400 text-sm mb-1">
        {data.age}岁
        {isPaid && 'year' in data && (
          <span className="text-text-secondary ml-2">({data.year}年)</span>
        )}
      </p>
      <p className="text-text-primary">
        运势: <span className={data.score >= 60 ? 'text-kline-up' : 'text-kline-down'}>
          {data.score}
        </span>
      </p>
      {data.reason && (
        <p className="text-xs text-text-secondary mt-1">{data.reason}</p>
      )}
    </div>
  );
}

export default function KLineChart(props: KLineChartProps) {
  const { data, currentAge, isPaid } = props;

  const chartData = useMemo(() => {
    // 统一使用 score 作为图表值
    return data.map((point) => ({
      ...point,
      value: point.score,
    }));
  }, [data]);

  const { minValue, maxValue } = useMemo(() => {
    const values = data.map((d) => d.score);
    return {
      minValue: Math.min(...values) - 5,
      maxValue: Math.max(...values) + 5,
    };
  }, [data]);

  const gradientOffset = useMemo(() => {
    const values = chartData.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const neutral = 60;
    if (max <= neutral) return 0;
    if (min >= neutral) return 1;
    return (max - neutral) / (max - min);
  }, [chartData]);

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset={gradientOffset} stopColor="#6BA5C6" stopOpacity={0.9} />
              <stop offset={gradientOffset} stopColor="#C66B6B" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B7AB8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8B7AB8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(139, 122, 184, 0.15)"
            vertical={false}
          />

          <XAxis
            dataKey="age"
            axisLine={{ stroke: 'rgba(139, 122, 184, 0.2)' }}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${value}岁`}
          />

          <YAxis
            domain={[minValue, maxValue]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            width={40}
          />

          <Tooltip content={<CustomTooltip isPaid={isPaid} />} />

          {currentAge && (
            <ReferenceLine
              x={currentAge}
              stroke="#C9A961"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: '今',
                position: 'top',
                fill: '#C9A961',
                fontSize: 14,
              }}
            />
          )}

          <ReferenceLine
            y={60}
            stroke="rgba(139, 122, 184, 0.3)"
            strokeDasharray="3 3"
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#areaGradient)"
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 6,
              fill: '#C9A961',
              stroke: '#0D0D1A',
              strokeWidth: 2,
            }}
          />

          {isPaid && 'highlights' in props && props.highlights && (
            <Scatter
              data={props.highlights.map((h) => ({
                age: h.age,
                value: h.score,
              }))}
              fill="#C9A961"
              shape="star"
            />
          )}

          {isPaid && 'warnings' in props && props.warnings && (
            <Scatter
              data={props.warnings.map((w) => ({
                age: w.age,
                value: w.score,
              }))}
              fill="#C66B6B"
              shape="diamond"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
