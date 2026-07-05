import { useState } from 'react';
import { AlertCircle, CheckCircle2, ListFilter, Search, TriangleAlert } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { useDteDocuments } from '@/hooks/useDteDocuments';
import type { DteStatus } from '@/types/dte';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const statusFilters: Array<{
  label: string;
  value: DteStatus | 'all';
  icon: typeof ListFilter;
}> = [
  { label: 'Toda la evidencia', value: 'all', icon: ListFilter },
  { label: 'Aprobados', value: 'valid', icon: CheckCircle2 },
  { label: 'Excepciones', value: 'invalid', icon: TriangleAlert },
];

export function Audit() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DteStatus | 'all'>('all');

  const { data, isLoading, error } = useDteDocuments({
    search: search || undefined,
    status,
  });

  const documents = data?.data ?? [];
  const exceptionCount = documents.filter((document) => !document.es_valido).length;
  const exceptionExposure = documents
    .filter((document) => !document.es_valido)
    .reduce((sum, document) => sum + document.monto_total, 0);

  return (
    <>
      <Topbar
        title="Cola de Validación"
        subtitle="Busca, filtra y revisa evidencia de validación DTE"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="grid gap-5">
          <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  Controles de revisión
                </p>
                <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                  Filtros del registro de auditoría
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Acota el registro por estado, emisor, número DTE o código de generación.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(240px,360px)_auto]">
                <div className="relative md:hidden">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar DTE o emisor"
                    className="h-10 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
                  />
                </div>

                <div className="flex rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                  {statusFilters.map(({ label, value, icon: Icon }) => {
                    const isActive = status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatus(value)}
                        className={[
                          'flex h-9 items-center gap-2 rounded-[5px] px-3 text-xs font-semibold transition-colors',
                          isActive
                            ? 'bg-white text-[var(--color-primary)] shadow-sm'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                        ].join(' ')}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  Resultados
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--color-foreground)]">
                  {formatNumber(data?.total ?? 0)}
                </p>
              </div>
              <div className="rounded-[6px] border border-red-200 bg-red-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                  Excepciones visibles
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-red-700">
                  {formatNumber(exceptionCount)}
                </p>
              </div>
              <div className="rounded-[6px] border border-cyan-200 bg-cyan-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                  Exposición por excepción
                </p>
                <p className="mt-1 truncate text-xl font-semibold tabular-nums text-cyan-800">
                  {formatCurrency(exceptionExposure)}
                </p>
              </div>
            </div>
          </section>

          {isLoading && (
            <div className="rounded-lg border border-[var(--color-border)] bg-white py-16 text-center text-sm font-medium text-[var(--color-muted)]">
              Cargando registros de auditoría...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-[var(--color-danger-soft)] p-5 text-sm font-medium text-[var(--color-danger)]">
              <AlertCircle className="mr-2 inline h-4 w-4 align-[-2px]" />
              {error.message}
            </div>
          )}

          {data && (
            <AuditTable
              documents={documents}
              title="Registro de validación DTE"
              subtitle={`${formatNumber(data.total)} registros en la consulta actual`}
            />
          )}
        </div>
      </main>
    </>
  );
}
