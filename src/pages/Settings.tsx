import {
  BellRing,
  Database,
  KeyRound,
  LockKeyhole,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';

const controls = [
  {
    title: 'Reglas estrictas de validación',
    description: 'Marca totales inconsistentes, códigos de generación duplicados y conflictos de política del emisor.',
    enabled: true,
    icon: ShieldCheck,
  },
  {
    title: 'Notificaciones para auditores',
    description: 'Notifica a revisores cuando el volumen de excepciones supera el umbral operativo.',
    enabled: true,
    icon: BellRing,
  },
  {
    title: 'Retención de archivos de evidencia',
    description: 'Mantiene enlaces firmados de PDF y JSON disponibles durante ventanas de revisión de cumplimiento.',
    enabled: false,
    icon: Database,
  },
];

export function Settings() {
  const { user, isDemo } = useAuth();
  const hasN8nConfig = Boolean(import.meta.env.VITE_N8N_WEBHOOK_URL);

  return (
    <>
      <Topbar title="Controles" subtitle="Políticas del espacio, integraciones y postura de acceso" />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
            <div className="border-b border-[var(--color-border)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                Controles de auditoría
              </p>
              <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                Política de validación
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Preferencias actuales del módulo para verificaciones DTE y atención de revisores.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {controls.map(({ title, description, enabled, icon: Icon }) => (
                <div key={title} className="grid gap-4 p-4 sm:grid-cols-[40px_1fr_auto] sm:items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      {title}
                    </p>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                      {description}
                    </p>
                  </div>
                  <label className="inline-flex cursor-default items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {enabled ? 'Activo' : 'Inactivo'}
                    </span>
                    <span
                      className={[
                        'relative h-6 w-10 rounded-full border transition-colors',
                        enabled
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                          : 'border-slate-300 bg-slate-200',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform',
                          enabled ? 'left-[18px]' : 'left-0.5',
                        ].join(' ')}
                      />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                    Session
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                    Perfil de acceso
                  </h2>
                </div>
                <LockKeyhole className="h-5 w-5 text-[var(--color-muted)]" />
              </div>
              <div className="mt-4 rounded-[6px] border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {user?.name ?? 'Auditor demo'}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                  {user?.email ?? 'Sesión demo local'}
                </p>
                <span className="mt-3 inline-flex rounded-[5px] border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan-800">
                  {isDemo ? 'Acceso demo' : user?.role ?? 'Auditor'}
                </span>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                    Integrations
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                    Endpoints de procesamiento
                  </h2>
                </div>
                <SlidersHorizontal className="h-5 w-5 text-[var(--color-muted)]" />
              </div>

              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-slate-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground-soft)]">
                    <KeyRound className="h-4 w-4 text-[var(--color-muted)]" />
                    Supabase
                  </span>
                  <span className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                    Conectado
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-slate-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground-soft)]">
                    <SettingsIcon className="h-4 w-4 text-[var(--color-muted)]" />
                    n8n webhook
                  </span>
                  <span
                    className={[
                      'rounded-[5px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                      hasN8nConfig
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-800',
                    ].join(' ')}
                  >
                    {hasN8nConfig ? 'Configurado' : 'Faltante'}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
