import { Fragment, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  FileJson,
  FileText,
  Info,
  Trash2,
} from 'lucide-react';
import type { DteDocument } from '@/types/dte';
import { getDteStatus } from '@/types/dte';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { dteService } from '@/services/dteService';

interface AuditTableProps {
  documents: DteDocument[];
  onViewDetails?: (document: DteDocument) => void;
  onDeleteSuccess?: () => void;
}

function stop(event: MouseEvent) {
  event.stopPropagation();
}

function EvidenceLink({
  href,
  label,
  icon: Icon,
}: {
  href?: string | null;
  label: string;
  icon: typeof FileText;
}) {
  if (!href) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={stop}
      className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-2.5 text-xs font-semibold text-[var(--color-foreground-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

export function AuditTable({ documents, onViewDetails, onDeleteSuccess }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-white p-12 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[8px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Info className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">
          No hay DTEs para revisar
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Cuando ingresen documentos, apareceran en esta cola de validacion.
        </p>
      </div>
    );
  }

  async function handleDelete(document: DteDocument, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!window.confirm('¿Estas seguro de eliminar este DTE permanentemente?')) {
      return;
    }

    setDeletingId(document.id);
    try {
      await dteService.deleteDocument(document.id);
      onDeleteSuccess?.();
    } catch (error) {
      console.error('No se pudo eliminar el DTE:', error);
      alert('Error al intentar eliminar el DTE.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)] tp-animate-in">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Cola de validacion
          </p>
          <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
            Revision documental DTE
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {documents.length} documentos auditables con evidencia, observaciones y acciones.
          </p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-[6px] border border-[var(--color-border)] bg-slate-50 text-xs sm:min-w-[220px]">
          <div className="border-r border-[var(--color-border)] px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Validos
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-success)]">
              {documents.filter((document) => document.es_valido).length}
            </p>
          </div>
          <div className="px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Excepcion
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-danger)]">
              {documents.filter((document) => !document.es_valido).length}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto tp-scrollbar">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              <th className="w-10 px-5 py-3" />
              <th className="px-5 py-3">Documento</th>
              <th className="px-5 py-3">Emisor</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3 text-right">Monto</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Evidencia</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((document) => {
              const status = getDteStatus(document);
              const isInvalid = !document.es_valido;
              const isExpanded = expandedId === document.id;
              const canExpand = isInvalid && Boolean(document.observaciones);

              return (
                <Fragment key={document.id}>
                  <tr
                    className={[
                      'group transition-colors',
                      isInvalid ? 'bg-red-50/35 hover:bg-red-50/65' : 'hover:bg-slate-50/80',
                      canExpand ? 'cursor-pointer' : '',
                    ].join(' ')}
                    onClick={() => {
                      if (canExpand) {
                        setExpandedId(isExpanded ? null : document.id);
                      }
                    }}
                  >
                    <td className="px-5 py-4">
                      <span
                        className={[
                          'flex h-6 w-6 items-center justify-center rounded-[5px] border transition-transform',
                          isInvalid
                            ? 'border-red-200 bg-white text-[var(--color-danger)]'
                            : 'border-emerald-200 bg-emerald-50 text-[var(--color-success)]',
                          isExpanded ? 'rotate-90' : '',
                        ].join(' ')}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-[var(--color-foreground)]">
                        {document.codigo_generacion || document.id}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Tipo {document.tipo_dte || 'DTE'} / ID {document.id}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[260px] truncate font-semibold text-[var(--color-foreground-soft)]">
                        {document.emisor_nombre}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                        {document.emisor_nit}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-foreground-soft)]">
                      {formatDate(document.fecha_emision)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-[var(--color-foreground)]">
                      {formatCurrency(document.monto_total, document.moneda)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <EvidenceLink href={document.files?.pdfUrl} label="PDF" icon={FileText} />
                        <EvidenceLink href={document.files?.jsonUrl} label="JSON" icon={FileJson} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onViewDetails?.(document);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-2.5 text-xs font-semibold text-[var(--color-foreground-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          Abrir
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDelete(document, event)}
                          disabled={deletingId === document.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === document.id ? 'Eliminando' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-white">
                      <td className="border-l-2 border-l-[var(--color-danger)] px-5 py-4" />
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid gap-3 rounded-[6px] border border-red-200 bg-red-50 p-4 sm:grid-cols-[36px_1fr]">
                          <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-white text-[var(--color-danger)]">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-danger)]">
                              Observacion de validacion
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-red-800">
                              {document.observaciones}
                            </p>
                          </div>
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
    </section>
  );
}
