import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProcessingVolumePoint } from '@/types/dte';
import { formatNumber } from '@/lib/formatters';

interface ProcessingVolumeChartProps {
  data: ProcessingVolumePoint[];
}

interface TooltipPayload {
  color?: string;
  name?: string;
  value?: number;
}

function formatAxisDate(value: string) {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[6px] border border-[var(--color-border)] bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
      <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">
        {label ? formatAxisDate(label) : 'Periodo'}
      </p>
      <div className="grid gap-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-2 text-[var(--color-muted)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-[var(--color-foreground)]">
              {formatNumber(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProcessingVolumeChart({ data }: ProcessingVolumeChartProps) {
  const totals = data.reduce(
    (acc, point) => {
      acc.valid += point.validCount;
      acc.invalid += point.invalidCount;
      acc.peak = Math.max(acc.peak, point.validCount, point.invalidCount);
      return acc;
    },
    { valid: 0, invalid: 0, peak: 0 },
  );
  const total = totals.valid + totals.invalid;
  const validPercent = total > 0 ? Math.round((totals.valid / total) * 100) : 0;
  const invalidPercent = total > 0 ? 100 - validPercent : 0;
  const yMax = Math.max(5, totals.peak + 1);
  const yTicks =
    yMax <= 8
      ? Array.from({ length: yMax + 1 }, (_, index) => index)
      : undefined;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)] tp-animate-in tp-delay-2 tp-hover-lift">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">
              Resumen de procesamiento DTE
            </h2>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-[var(--color-muted)]">
              i
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Documentos procesados por fecha de emisión
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['7D', '30D', '90D'].map((period) => (
            <button
              key={period}
              type="button"
              className={[
                'h-9 rounded-[6px] border px-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5',
                period === '30D'
                  ? 'border-blue-200 bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:text-[var(--color-foreground)]',
              ].join(' ')}
            >
              {period}
            </button>
          ))}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-white text-lg leading-none text-[var(--color-muted)] transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--color-foreground)]"
            aria-label="Más opciones"
          >
            ⋮
          </button>
        </div>
      </div>

      <div className="h-[330px] px-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 8 }}>
            <defs>
              <linearGradient id="taxpilotValidArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.26} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="taxpilotInvalidArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={formatAxisDate}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, yMax]}
              ticks={yTicks}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="validCount"
              name="Válidos"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#taxpilotValidArea)"
              dot={{ r: 2.5, stroke: '#059669', strokeWidth: 1.5, fill: '#ffffff' }}
              activeDot={{ r: 4, stroke: '#059669', strokeWidth: 2, fill: '#ffffff' }}
              animationBegin={180}
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="invalidCount"
              name="Inválidos"
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#taxpilotInvalidArea)"
              dot={{ r: 2.5, stroke: '#DC2626', strokeWidth: 1.5, fill: '#ffffff' }}
              activeDot={{ r: 4, stroke: '#DC2626', strokeWidth: 2, fill: '#ffffff' }}
              animationBegin={320}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 px-5 pb-5 text-xs">
        <span className="inline-flex items-center gap-2 font-medium text-[var(--color-foreground-soft)]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
          Válidos
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
            {validPercent}%
          </span>
        </span>
        <span className="inline-flex items-center gap-2 font-medium text-[var(--color-foreground-soft)]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
          Inválidos
          <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
            {invalidPercent}%
          </span>
        </span>
      </div>
    </div>
  );
}
