import { Fragment, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  FileJson,
  FileText,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DteDocument } from '@/types/dte';
import { getDteStatus } from '@/types/dte';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface AuditTableProps {
  documents: DteDocument[];
  onViewDetails?: (document: DteDocument) => void;
  title?: string;
  subtitle?: string;
}

function EvidenceLink({
  href,
  label,
  icon: Icon,
}: {
  href?: string | null;
  label: string;
  icon: LucideIcon;
}) {
  if (!href) {
    return (
      <span className="inline-flex h-7 items-center gap-1 rounded-[5px] border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 items-center gap-1 rounded-[5px] border border-[var(--color-border)] bg-white px-2 text-[11px] font-semibold text-[var(--color-foreground-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      onClick={(event) => event.stopPropagation()}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

export function AuditTable({
  documents,
  onViewDetails,
  title = 'DTE validation register',
  subtitle,
}: AuditTableProps) {
  const [activeObservationId, setActiveObservationId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-white p-10 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <FileText className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">
          No se encontraron documentos DTE
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Ajusta los filtros o carga un DTE para iniciar la validación.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            Registro de evidencia
          </p>
          <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {subtitle ?? `${documents.length} documentos listos para revisión del auditor`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          Haz clic en las filas con excepción para ver observaciones
        </div>
      </div>

      <div className="overflow-x-auto tp-scrollbar">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Documento
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Emisor
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Fecha fiscal
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Exposición
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Estado
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Evidencia
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const status = getDteStatus(doc);
              const isInvalid = !doc.es_valido;
              const isExpanded = activeObservationId === doc.id;

              return (
                <Fragment key={doc.id}>
                  <tr
                    className={[
                      'group transition-colors',
                      isInvalid
                        ? 'cursor-pointer bg-red-50/35 hover:bg-red-50'
                        : 'hover:bg-slate-50/80',
                    ].join(' ')}
                    onClick={() => {
                      if (isInvalid) {
                        setActiveObservationId(isExpanded ? null : doc.id);
                      }
                    }}
                  >
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={[
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px]',
                            isInvalid
                              ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                              : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
                          ].join(' ')}
                        >
                          {isInvalid ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold text-[var(--color-foreground)]">
                            {doc.codigo_generacion || doc.id}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            ID {doc.id} / Tipo {doc.tipo_dte}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <p className="max-w-[240px] truncate font-semibold text-[var(--color-foreground-soft)]">
                        {doc.emisor_nombre}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                        {doc.emisor_nit}
                      </p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-sm text-[var(--color-foreground-soft)]">
                      {formatDate(doc.fecha_emision)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-right font-semibold tabular-nums text-[var(--color-foreground)]">
                      {formatCurrency(doc.monto_total, doc.moneda)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <StatusBadge status={status} />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <EvidenceLink href={doc.files?.pdfUrl} label="PDF" icon={FileText} />
                        <EvidenceLink href={doc.files?.jsonUrl} label="JSON" icon={FileJson} />
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewDetails?.(doc);
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-foreground-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        Abrir
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>

                  {isInvalid && isExpanded && (
                    <tr>
                      <td colSpan={7} className="border-b border-red-100 bg-red-50/55 px-4 py-3">
                        <div className="flex items-start gap-3 rounded-[6px] border border-red-200 bg-white p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                            <Info className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-danger)]">
                              Observación del auditor
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--color-foreground-soft)]">
                              {doc.observaciones ?? 'Se detectó una excepción. La fuente de validación no proporcionó texto de observación.'}
                            </p>
                          </div>
                          <ChevronRight className="ml-auto mt-1 h-4 w-4 text-red-300" />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
