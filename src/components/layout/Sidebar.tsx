import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileBarChart2,
  Settings,
  Shield,
  UploadCloud,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/audit', label: 'Audit', icon: ClipboardCheck },
  { to: '/manual-upload', label: 'Cargar DTE', icon: UploadCloud },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

interface SidebarProps {
  user?: any;
}

export function Sidebar({ user }: SidebarProps) {
  const { logout } = useAuth();
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('taxpilot_mock_bypass') === 'true';

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-border)] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
            TaxPilot
          </p>
          <p className="text-xs text-[var(--color-muted)]">DTE Audit</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ to, label, icon: Icon, ...rest }) => (
          <NavLink
            key={to}
            to={to}
            {...rest}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-neutral-100 text-[var(--color-foreground)]'
                  : 'text-[var(--color-muted)] hover:bg-neutral-50 hover:text-[var(--color-foreground)]',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-4 flex flex-col gap-2.5">
        {user && (
          <div className="flex flex-col mb-1 max-w-[200px]">
            <span className="text-xs font-semibold text-[var(--color-foreground)] truncate" title={user.email}>
              {user.email}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              Auditor Autenticado
            </span>
          </div>
        )}
        {isBypassed && (
          <div className="flex flex-col mb-1">
            <span className="text-xs font-semibold text-amber-600">
              Modo Demo
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              Visualizando datos locales
            </span>
          </div>
        )}
        {(user || isBypassed) && (
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar Sesión
          </button>
        )}
        <p className="text-[10px] text-[var(--color-muted)] mt-1">v0.1.0 — Audit Module</p>
      </div>
    </aside>
  );
}
