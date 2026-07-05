import { Bell, CalendarDays, ChevronDown, LogOut, Search, ShieldCheck } from 'lucide-react';
import { VoiceSearchButton } from '@/components/layout/VoiceSearchButton';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

function todayLabel() {
  return new Intl.DateTimeFormat('es-SV', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date()).replace(/\s/g, '\u00a0');
}

export function Topbar({
  title,
  subtitle,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar DTE, emisor, NIT...',
}: TopbarProps) {
  const { user, logout, isDemo } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/[0.92] backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#08111f] text-white lg:hidden">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)] [&>span:nth-child(3)]:hidden md:[&>span:nth-child(3)]:inline">
              <span className="shrink-0 whitespace-nowrap">TaxPilot</span>
              <span className="hidden h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)] md:block" />
              <span>Espacio de auditoría</span>
            </div>
            <h1 className="truncate text-xl font-semibold tracking-normal text-[var(--color-foreground)]">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-[var(--color-muted)]">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {onSearchChange && (
            <div className="hidden items-center gap-2 md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="h-10 w-[min(28vw,360px)] rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-slate-400 outline-none transition-colors focus:border-[var(--color-primary)] focus:bg-white"
                />
              </div>
              <VoiceSearchButton onTranscript={onSearchChange} />
            </div>
          )}

          <div
            className="hidden h-10 max-w-[180px] shrink-0 items-center gap-2 overflow-hidden rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-foreground-soft)] sm:flex"
            style={{ whiteSpace: 'nowrap' }}
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            <span className="min-w-0 truncate">{todayLabel()}</span>
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-white text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-foreground)]"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--color-danger)] tp-pulse-dot" />
          </button>

          <div className="flex h-10 min-w-0 items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-white px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
              {user?.initials ?? 'TP'}
            </div>
            <div className="hidden max-w-[150px] text-left sm:block">
              <p className="truncate text-xs font-semibold text-[var(--color-foreground)]">
                {user?.name ?? 'Auditor'}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {isDemo ? 'Demo' : user?.role ?? 'Auditoría'}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--color-muted)] sm:block" />
            <button
              type="button"
              onClick={logout}
              className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      {onSearchChange && (
        <div className="flex gap-2 px-4 pb-3 md:hidden">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-10 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white"
            />
          </div>
          <VoiceSearchButton onTranscript={onSearchChange} />
        </div>
      )}
    </header>
  );
}
