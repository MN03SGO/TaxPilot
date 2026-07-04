import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ProcessingVolumePoint } from '@/types/dte';

interface ProcessingVolumeChartProps {
  data: ProcessingVolumePoint[];
}

export function ProcessingVolumeChart({ data }: ProcessingVolumeChartProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          DTE Processing Volume
        </h2>
        <p className="text-xs text-[var(--color-muted)]">
          Documents processed over time
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="validGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="invalidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#737373' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => {
                const [, month, day] = value.split('-');
                return `${day}/${month}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#737373' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="validCount"
              name="Valid"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#validGradient)"
            />
            <Area
              type="monotone"
              dataKey="invalidCount"
              name="Invalid"
              stroke="#dc2626"
              strokeWidth={2}
              fill="url(#invalidGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
