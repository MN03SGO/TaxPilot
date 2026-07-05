import {
  CalendarClock,
  Download,
  FileBarChart2,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';

const reportPacks = [
  {
    title: 'Resumen de validación DTE',
    description: 'Volumen aceptado vs excepciones, concentración por emisor y resultados de reglas.',
    cadence: 'Mensual',
    state: 'Próximamente',
    icon: FileBarChart2,
  },
  {
    title: 'Paquete de evidencia de excepciones',
    description: 'DTEs inválidos con observaciones, archivos fuente y notas de revisión.',
    cadence: 'Bajo demanda',
    state: 'Planificado',
    icon: FileCheck2,
  },
  {
    title: 'Registro de exposición fiscal',
    description: 'Totales monetarios auditados agrupados por tipo DTE, emisor y periodo.',
    cadence: 'Trimestral',
    state: 'Planificado',
    icon: ShieldCheck,
  },
];

export function Reports() {
  return (
    <>
      <Topbar title="Reportes de Cumplimiento" subtitle="Prepara paquetes de exportación listos para auditoría" />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="grid gap-5">
          <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  Operaciones de reporte
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[var(--color-foreground)]">
                  Exportaciones de evidencia para equipos de cumplimiento
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                  Este módulo está preparado para exportaciones PDF y resúmenes de cumplimiento.
                  El espacio rediseñado muestra la taxonomía de reportes y controles que
                  se conectarán con la evidencia de auditoría existente.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-[var(--color-surface)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      Exportaciones controladas
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Trazabilidad y aprobaciones antes de descargar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {reportPacks.map(({ title, description, cadence, state, icon: Icon }) => (
              <article
                key={title}
                className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-[5px] border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800">
                    {state}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-foreground)]">
                  {title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--color-muted)]">
                  {description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-foreground-soft)]">
                    <CalendarClock className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                    {cadence}
                  </span>
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-slate-50 px-3 text-xs font-semibold text-slate-400"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              Cola de exportación
            </p>
            <div className="mt-4 overflow-hidden rounded-[6px] border border-slate-200">
              <div className="grid grid-cols-[1fr_130px_130px] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                <span>Paquete</span>
                <span>Estado</span>
                <span>Responsable</span>
              </div>
              <div className="grid grid-cols-[1fr_130px_130px] px-4 py-4 text-sm text-[var(--color-muted)]">
                <span>No se han generado exportaciones en este espacio.</span>
                <span>En espera</span>
                <span>Equipo auditor</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
