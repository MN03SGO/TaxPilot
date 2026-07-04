import { useState } from 'react';
import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import type { DteDocument } from '@/types/dte';
import { getDteStatus } from '@/types/dte';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface AuditTableProps {
  documents: DteDocument[];
  onViewDetails?: (document: DteDocument) => void;
}

export function AuditTable({ documents, onViewDetails }: AuditTableProps) {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-12 text-center">
        <p className="text-sm text-[var(--color-muted)]">No DTE documents found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Audit Table
        </h2>
        <p className="text-xs text-[var(--color-muted)]">
          {documents.length} documents — click invalid rows for observations
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-neutral-50/80">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                ID
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Issuer
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Date
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Amount
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {documents.map((doc) => {
              const status = getDteStatus(doc);
              const isInvalid = !doc.es_valido;
              const showTooltip = activeTooltipId === doc.id;

              return (
                <tr
                  key={doc.id}
                  className={[
                    'group transition-colors',
                    isInvalid
                      ? 'border-l-2 border-l-[var(--color-error)] bg-[var(--color-error-muted)]/30 hover:bg-[var(--color-error-muted)]/50'
                      : 'hover:bg-neutral-50/80',
                  ].join(' ')}
                  onClick={() => {
                    if (isInvalid) {
                      setActiveTooltipId(showTooltip ? null : doc.id);
                    }
                  }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {isInvalid && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-error)]" />
                      )}
                      <span className="font-mono text-xs font-medium text-[var(--color-foreground)]">
                        {doc.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--color-foreground)]">
                      {doc.emisor_nombre}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">{doc.emisor_nit}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-muted)]">
                    {formatDate(doc.fecha_emision)}
                  </td>
                  <td className="px-5 py-3.5 font-medium tabular-nums text-[var(--color-foreground)]">
                    {formatCurrency(doc.monto_total, doc.moneda)}
                  </td>
                  <td className="relative px-5 py-3.5">
                    <StatusBadge status={status} />
                    {isInvalid && doc.observaciones && showTooltip && (
                      <div
                        className="absolute left-5 top-full z-10 mt-1 w-64 rounded-lg border border-[var(--color-error)]/20 bg-white p-3 shadow-lg"
                        role="tooltip"
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-error)]">
                          <Info className="h-3 w-3" />
                          Observaciones
                        </div>
                        <p className="text-xs leading-relaxed text-[var(--color-foreground)]">
                          {doc.observaciones}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails?.(doc);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition-colors hover:bg-neutral-100"
                    >
                      Details
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
