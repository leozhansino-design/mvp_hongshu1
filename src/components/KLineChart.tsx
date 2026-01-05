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
import { KLinePoint, KLinePointDetailed } from '@/types';

interface FreeChartProps {
  data: KLinePoint[];
  currentAge?: number;
  isPaid?: false;
}

interface PaidChartProps {
  data: KLinePointDetailed[];
  currentAge?: number;
  isPaid: true;
  highlights?: { age: number; score: number }[];
  warnings?: { age: number; score: number }[];
}

type KLineChartProps = FreeChartProps | PaidChartProps;

interface TooltipPayloadItem {
  payload: KLinePoint | KLinePointDetailed;
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
      {'score' in data ? (
        <p className="text-text-primary">
          运势: <span className={data.score >= 60 ? 'text-kline-up' : 'text-kline-down'}>
            {data.score}
          </span>
        </p>
      ) : (
        <>
          <p className="text-xs text-text-secondary">
            开: {data.open} | 收: {data.close}
          </p>
          <p className="text-xs text-text-secondary">
            高: {data.high} | 低: {data.low}
          </p>
        </>
      )}
    </div>
  );
}

export default function KLineChart(props: KLineChartProps) {
  const { data, currentAge, isPaid } = props;

  const chartData = useMemo(() => {
    if (isPaid) {
      return (data as KLinePointDetailed[]).map((point) => ({
        ...point,
        value: (point.open + point.close) / 2,
        isUp: point.close >= point.open,
      }));
    }
    return (data as KLinePoint[]).map((point) => ({
      ...point,
      value: point.score,
    }));
  }, [data, isPaid]);

  const { minValue, maxValue } = useMemo(() => {
    if (isPaid) {
      const paidData = data as KLinePointDetailed[];
      const values = paidData.flatMap((d) => [d.low, d.high]);
      return {
        minValue: Math.min(...values) - 5,
        maxValue: Math.max(...values) + 5,
      };
    }
    const freeData = data as KLinePoint[];
    const values = freeData.map((d) => d.score);
    return {
      minValue: Math.min(...values) - 5,
      maxValue: Math.max(...values) + 5,
    };
  }, [data, isPaid]);

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
              <stop offset={gradientOffset} stopColor="#22D3EE" stopOpacity={0.8} />
              <stop offset={gradientOffset} stopColor="#F43F5E" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9D4EDD" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#9D4EDD" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(157, 78, 221, 0.2)"
            vertical={false}
          />

          <XAxis
            dataKey="age"
            axisLine={{ stroke: 'rgba(157, 78, 221, 0.3)' }}
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
              stroke="#FFD700"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: '今',
                position: 'top',
                fill: '#FFD700',
                fontSize: 14,
              }}
            />
          )}

          <ReferenceLine
            y={60}
            stroke="rgba(157, 78, 221, 0.4)"
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
              fill: '#FFD700',
              stroke: '#0D0221',
              strokeWidth: 2,
            }}
          />

          {isPaid && 'highlights' in props && props.highlights && (
            <Scatter
              data={props.highlights.map((h) => ({
                age: h.age,
                value: h.score,
              }))}
              fill="#FFD700"
              shape="star"
            />
          )}

          {isPaid && 'warnings' in props && props.warnings && (
            <Scatter
              data={props.warnings.map((w) => ({
                age: w.age,
                value: w.score,
              }))}
              fill="#F43F5E"
              shape="diamond"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
