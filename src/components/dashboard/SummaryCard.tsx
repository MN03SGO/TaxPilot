import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  eyebrow?: string;
  description?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
    tone?: 'positive' | 'negative' | 'neutral';
  };
  accent?: 'primary' | 'cyan' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple';
  sparkline?: number[];
}

const accentStyles = {
  primary: {
    icon: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
    stroke: '#2563EB',
  },
  cyan: {
    icon: 'bg-[var(--color-accent-soft)] text-cyan-700',
    stroke: '#06B6D4',
  },
  success: {
    icon: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    stroke: '#059669',
  },
  warning: {
    icon: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    stroke: '#D97706',
  },
  danger: {
    icon: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    stroke: '#EF4444',
  },
  purple: {
    icon: 'bg-violet-100 text-violet-700',
    stroke: '#7C3AED',
  },
  neutral: {
    icon: 'bg-slate-100 text-slate-700',
    stroke: '#64748B',
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

function getTrendToneClass(tone: 'positive' | 'negative' | 'neutral' | undefined) {
  if (tone === 'positive') return 'text-[var(--color-success)]';
  if (tone === 'negative') return 'text-[var(--color-danger)]';
  return 'text-[var(--color-muted)]';
}

function MiniSparkline({
  values,
  stroke,
}: {
  values: number[];
  stroke: string;
}) {
  const gradientId = useId().replace(/:/g, '');
  const points = values.slice(-12).map((value, index) => ({ index, value }));

  if (points.length < 2) {
    return <div className="h-full rounded-[6px] bg-slate-50" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 7, right: 2, bottom: 5, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
            <stop offset="90%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={1.9}
          fill={`url(#${gradientId})`}
          dot={{ r: 2, stroke, strokeWidth: 1.4, fill: '#ffffff' }}
          activeDot={false}
          animationBegin={180}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  eyebrow,
  description,
  trend,
  accent = 'neutral',
  sparkline = [],
}: SummaryCardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;
  const styles = accentStyles[accent];

  return (
    <article className="group min-w-0 rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] tp-animate-in tp-hover-lift tp-sheen">
      <div className="grid grid-cols-[48px_1fr] gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-[8px] transition-transform duration-200 group-hover:scale-105 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {eyebrow}
            </p>
          )}
          <h2 className="truncate text-sm font-medium text-[var(--color-muted)]">
            {title}
          </h2>
          <p className="mt-2 truncate text-xl font-semibold tracking-normal text-[var(--color-foreground)] sm:text-2xl">
            {value}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_92px]">
        <div className="min-w-0">
          {trend && TrendIcon && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${getTrendToneClass(trend.tone)}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              {trend.value}
              {trend.label && (
                <span className="font-medium text-[var(--color-muted)]">{trend.label}</span>
              )}
            </span>
          )}
          {description && (
            <p className="mt-1 truncate text-xs text-[var(--color-muted)]">{description}</p>
          )}
        </div>

        <div className="hidden h-14 min-w-0 sm:block">
          <MiniSparkline values={sparkline} stroke={styles.stroke} />
        </div>
      </div>
    </article>
  );
}
