'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatCompact } from '@/lib/utils';

interface ApiUsageChartProps {
  data: Array<{ hour: string; requests: number }>;
}

export function ApiUsageChart({ data }: ApiUsageChartProps): React.JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
        <XAxis
          dataKey="hour"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: 'hsl(var(--popover-foreground))',
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          formatter={(value: number) => [formatCompact(value), 'Requests']}
        />
        <Area
          type="monotone"
          dataKey="requests"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#usageGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
