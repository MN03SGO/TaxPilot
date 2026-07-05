import { Search, Bell, ChevronDown } from 'lucide-react';
import { VoiceSearchButton } from './VoiceSearchButton';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Topbar({
  title,
  subtitle,
  searchValue = '',
  onSearchChange,
}: TopbarProps) {
  const { user, isDemo } = useAuth();
  
  const userInitials = user?.initials ?? 'TP';
  const userName = user?.name ?? 'Auditor';
  const userRole = isDemo ? 'DEMO' : (user?.role ?? 'Auditor');

  // Format today's date in Spanish format
  const formattedDate = new Intl.DateTimeFormat('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  // Capitalize first letter of weekday
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onSearchChange && (
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="search"
                placeholder="Buscar cualquier cosa..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-neutral-400"
              />
            </div>
            <VoiceSearchButton onTranscript={onSearchChange} />
          </div>
        )}

        <div className="hidden md:block text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1.5" title="Fecha del sistema">
          {capitalizedDate}
        </div>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:bg-neutral-50 hover:text-[var(--color-foreground)]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 transition-colors hover:bg-neutral-50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white shadow-sm">
            {userInitials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-[var(--color-foreground)]">
              {userName}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">{userRole}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted)]" />
        </button>
      </div>
    </header>
  );
}
