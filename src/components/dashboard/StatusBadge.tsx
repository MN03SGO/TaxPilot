import type { DteStatus } from '@/types/dte';
import { CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: DteStatus;
}

const config: Record<
  DteStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  valid: {
    label: 'Valid',
    className: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  invalid: {
    label: 'Invalid',
    className: 'bg-[var(--color-error-muted)] text-[var(--color-error)]',
    icon: XCircle,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, icon: Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
