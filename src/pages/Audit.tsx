import { useState } from 'react';
import { AlertCircle, Filter, ListChecks, Loader2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { DteDetailsModal } from '@/components/dashboard/DteDetailsModal';
import { useDteDocuments } from '@/hooks/useDteDocuments';
import type { DteStatus, DteDocument } from '@/types/dte';

const statusOptions: Array<{
  label: string;
  value: DteStatus | 'all';
  description: string;
}> = [
  { label: 'Todos', value: 'all', description: 'Vista completa' },
  { label: 'Aprobados', value: 'valid', description: 'Sin observaciones' },
  { label: 'Excepciones', value: 'invalid', description: 'Requieren revision' },
];

export function Audit() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DteStatus | 'all'>('all');
  const [selectedDte, setSelectedDte] = useState<DteDocument | null>(null);

  const { data, isLoading, error, refetch } = useDteDocuments({
    search: search || undefined,
    status,
  });

  return (
    <>
      <Topbar
        title="Cola de validacion"
        subtitle="Registro completo de auditoria DTE, evidencias y excepciones"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por DTE, emisor o NIT..."
      />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto grid max-w-[1480px] gap-5">
          <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)] tp-animate-in">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                    Revision por excepciones
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                    Documentos listos para criterio auditor
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                    Filtra la cola sin salir del flujo de detalle. Los cambios de estado se
                    sincronizan con la consulta actual y el modal de evidencia.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={[
                        'min-w-[112px] rounded-[5px] px-3 py-2 text-left transition-colors',
                        status === option.value
                          ? 'bg-white text-[var(--color-primary)] shadow-sm'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                      ].join(' ')}
                    >
                      <span className="block text-xs font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] font-medium">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex h-11 items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-foreground-soft)]">
                  <Filter className="h-4 w-4 text-[var(--color-muted)]" />
                  {data?.total ?? 0} registros
                </div>
              </div>
            </div>
          </section>

          {isLoading && (
            <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-white">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                <p className="text-sm font-medium text-[var(--color-muted)]">
                  Cargando registros de auditoria...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-[var(--color-danger-soft)] p-5 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
                <div>
                  <p className="font-semibold text-[var(--color-danger)]">
                    No se pudo cargar la cola de auditoria
                  </p>
                  <p className="mt-1">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {data && !isLoading && (
            <AuditTable
              documents={data.data}
              onViewDetails={(doc) => setSelectedDte(doc)}
              onDeleteSuccess={() => refetch()}
            />
          )}
        </div>
      </main>

      {selectedDte && (
        <DteDetailsModal
          document={selectedDte}
          onClose={() => setSelectedDte(null)}
        />
      )}
    </>
  );
}
