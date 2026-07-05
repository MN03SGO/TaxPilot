import { CheckCircle2, OctagonAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DteStatus } from '@/types/dte';

interface StatusBadgeProps {
  status: DteStatus;
}

const config: Record<
  DteStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  valid: {
    label: 'Aprobado',
    className:
      'border-emerald-200 bg-[var(--color-success-soft)] text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  invalid: {
    label: 'Excepción',
    className:
      'border-red-200 bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    icon: OctagonAlert,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, icon: Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
