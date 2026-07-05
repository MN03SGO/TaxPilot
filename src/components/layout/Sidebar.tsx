import { NavLink } from 'react-router-dom';
import {
  ClipboardCheck,
  FileBarChart2,
  Gauge,
  LogOut,
  Settings,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/providers/AuthProvider';

export const navItems = [
  {
    to: '/',
    label: 'Centro de control',
    shortLabel: 'Inicio',
    description: 'Resumen de auditoría',
    icon: Gauge,
    end: true,
  },
  {
    to: '/audit',
    label: 'Cola de validación',
    shortLabel: 'Auditoría',
    description: 'Registro de revisión DTE',
    icon: ClipboardCheck,
    end: false,
  },
  {
    to: '/manual-upload',
    label: 'Ingreso DTE',
    shortLabel: 'Carga',
    description: 'Procesamiento n8n',
    icon: UploadCloud,
    end: false,
  },
  {
    to: '/reports',
    label: 'Reportes de cumplimiento',
    shortLabel: 'Reportes',
    description: 'Paquetes de evidencia',
    icon: FileBarChart2,
    end: false,
  },
  {
    to: '/settings',
    label: 'Controles',
    shortLabel: 'Controles',
    description: 'Políticas y acceso',
    icon: Settings,
    end: false,
  },
] as const;

interface SidebarProps {
  user?: AuthUser | null;
}

function TaxPilotMark() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white shadow-[0_10px_30px_rgba(29,78,216,0.28)]">
      <ShieldCheck className="h-5 w-5" />
      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-[3px] border-2 border-[#08111f] bg-[var(--color-accent)]" />
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const { logout, isDemo } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-white/10 bg-[#08111f] text-white lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <TaxPilotMark />
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight">TaxPilot</p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70">
              Aseguramiento DTE
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Periodo fiscal
              </p>
              <p className="mt-1 text-sm font-semibold text-white">Jul 2026</p>
            </div>
            <span className="rounded-[6px] border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
              Activo
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-[3px] bg-white/10">
            <div className="h-full w-[72%] bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))]" />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">72% de cobertura de validación</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Espacio de auditoría
        </p>
        {navItems.map(({ to, label, description, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group grid grid-cols-[34px_1fr] items-center gap-2 rounded-lg px-3 py-2.5 transition-colors',
                isActive
                  ? 'bg-white text-[#08111f] shadow-[0_12px_28px_rgba(0,0,0,0.22)]'
                  : 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
              ].join(' ')
            }
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white/[0.08] text-current">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{label}</span>
              <span className="block truncate text-[11px] text-slate-400">
                {description}
              </span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-cyan-300/15 text-sm font-semibold text-cyan-100">
              {user?.initials ?? 'TP'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white" title={user?.email ?? 'Sesión demo'}>
                {user?.name ?? 'Auditor demo'}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {isDemo ? 'Datos locales demo' : user?.role ?? 'Auditor'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-white/10 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-red-300/30 hover:bg-red-500/10 hover:text-red-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-slate-600">
          v0.1.0 / Módulo de auditoría
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-white/95 px-2 py-2 shadow-[0_-12px_35px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map(({ to, shortLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-[6px] px-1 text-[10px] font-semibold transition-colors',
                isActive
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
