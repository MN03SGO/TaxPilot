import { X, FileText, AlertTriangle, User, Calendar, DollarSign, Download, CheckCircle, ArrowUpRight } from 'lucide-react';
import type { DteDocument } from '@/types/dte';
import { getDteStatus } from '@/types/dte';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface DteDetailsModalProps {
  document: DteDocument;
  onClose: () => void;
}

export function DteDetailsModal({ document, onClose }: DteDetailsModalProps) {
  const status = getDteStatus(document);
  const isInvalid = !document.es_valido;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl transform flex-col overflow-hidden rounded-xl border border-slate-100 bg-white p-4 text-left align-middle shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <FileText className="h-5 w-5 text-teal-600" />
                Detalles del DTE
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 break-all font-mono text-xs text-slate-500">
              ID: {document.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Validation Alert for Invalid DTEs */}
          {isInvalid && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">
                    Discrepancias e Inconsistencias Detectadas
                  </h4>
                  <p className="mt-1 text-sm text-red-700 leading-relaxed">
                    {document.observaciones || 'Se han detectado errores durante la validación del documento DTE.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isInvalid && (
            <div className="rounded-xl border border-green-200 bg-green-50/30 p-4 flex gap-3 items-center">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                Este DTE ha sido auditado y validado correctamente sin inconsistencias detectadas.
              </p>
            </div>
          )}

          {/* Grid Information */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            
            {/* Section: Document Identifiers */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Información del Documento
              </h4>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Código de Generación:</span>
                  <p className="text-sm font-semibold text-slate-800 font-mono break-all">
                    {document.codigo_generacion || 'No disponible'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Fecha de Emisión:</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(document.fecha_emision)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Tipo DTE:</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {document.tipo_dte === '03' ? 'Comprobante de Crédito Fiscal (03)' : `Tipo ${document.tipo_dte}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Financial Values */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Monto y Moneda
              </h4>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Monto Total:</span>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(document.monto_total, document.moneda)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Moneda:</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {document.moneda} (Dólar estadounidense)
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Fecha de Auditoría:</span>
                  <p className="text-sm text-slate-600">
                    {document.created_at ? formatDate(document.created_at) : 'En esta sesión'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Emitter */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Emisor (Taxpayer)
              </h4>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Nombre / Razón Social:</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {document.emisor_nombre || 'No disponible'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">NIT Emisor:</span>
                  <p className="text-sm font-semibold text-slate-800 font-mono">
                    {document.emisor_nit || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Receptor */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Receptor (Cliente)
              </h4>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Nombre / Razón Social:</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {document.receptor_nombre || 'Cliente Corporativo S.A. de C.V.'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">NIT Receptor:</span>
                  <p className="text-sm text-slate-600 font-mono">
                    0614-123456-789-0 (Fijo)
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Section: Documents / Attachments */}
          {document.files && (document.files.pdfUrl || document.files.jsonUrl) && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Documentos y Recursos Relacionados
              </h4>
              <div className="flex flex-wrap gap-3">
                {document.files.pdfUrl && (
                  <a
                    href={document.files.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Ver Documento PDF original
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
                {document.files.jsonUrl && (
                  <a
                    href={document.files.jsonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Descargar Metadatos JSON
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 sm:w-auto"
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
}
