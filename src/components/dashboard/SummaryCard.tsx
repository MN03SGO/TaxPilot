import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  accent?: 'default' | 'success' | 'error';
}

const accentStyles = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  error: 'bg-[var(--color-error-muted)] text-[var(--color-error)]',
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  accent = 'default',
}: SummaryCardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentStyles[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && TrendIcon && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-[var(--color-success)]'
                : trend.direction === 'down'
                  ? 'text-[var(--color-error)]'
                  : 'text-[var(--color-muted)]'
            }`}
          >
            <TrendIcon className="h-3 w-3" />
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{title}</p>
    </article>
  );
}
