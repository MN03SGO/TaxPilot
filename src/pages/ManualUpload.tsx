import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileDown,
  FileJson,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { uploadDteToN8n } from '@/lib/dteDocuments';
import { formatDate } from '@/lib/formatters';
import { dteService } from '@/services/dteService';
import type { DteDocument } from '@/types/dte';

type UploadTone = 'neutral' | 'success' | 'warning' | 'error';

function statusClass(tone: UploadTone) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (tone === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-[var(--color-foreground-soft)]';
}

function RecentDteItem({ document }: { document: DteDocument }) {
  return (
    <div className="rounded-[6px] border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-[var(--color-foreground)]">
            {document.codigo_generacion}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
            {document.emisor_nombre}
          </p>
        </div>
        <span
          className={[
            'rounded-[5px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
            document.es_valido
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700',
          ].join(' ')}
        >
          {document.es_valido ? 'Aprobado' : 'Revisar'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--color-muted)]">
          {formatDate(document.fecha_emision)}
        </p>
        <div className="flex gap-1.5">
          {document.files?.pdfUrl && (
            <a
              href={document.files.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-[5px] border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-100"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </a>
          )}
          {document.files?.jsonUrl && (
            <a
              href={document.files.jsonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-[5px] border border-blue-200 bg-blue-50 px-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
            >
              <FileJson className="h-3.5 w-3.5" />
              JSON
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManualUpload() {
  const { user, isDemo } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [recentDtes, setRecentDtes] = useState<DteDocument[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [hasN8nConfig, setHasN8nConfig] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone: UploadTone }>({
    message: '',
    tone: 'neutral',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRecentDtes = useCallback(async () => {
    setIsLoadingRecent(true);
    try {
      const response = await dteService.getDocuments({ pageSize: 5 });
      setRecentDtes(response.data);
    } catch (error: any) {
      console.error('No se pudieron cargar los DTEs recientes:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadRecentDtes();
    } else if (isDemo) {
      setStatus({
        message: 'El modo demo está activo. La carga y el reenvío a n8n están deshabilitados.',
        tone: 'warning',
      });
    }

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    setHasN8nConfig(Boolean(webhookUrl));
    if (!webhookUrl && !isDemo) {
      setStatus({
        message: 'El webhook de n8n no está configurado. Define VITE_N8N_WEBHOOK_URL en .env.',
        tone: 'warning',
      });
    }
  }, [user, isDemo, loadRecentDtes]);

  const handleDrag = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (isDemo) return;

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setStatus({ message: '', tone: 'neutral' });
      } else {
        setStatus({ message: 'Solo se permiten archivos PDF.', tone: 'error' });
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setStatus({ message: '', tone: 'neutral' });
      } else {
        setStatus({ message: 'Solo se permiten archivos PDF.', tone: 'error' });
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isDemo) {
      setStatus({
        message: 'Acción bloqueada. n8n está deshabilitado en modo demo.',
        tone: 'error',
      });
      return;
    }

    if (!user) {
      setStatus({
        message: 'Inicia sesión antes de cargar un DTE.',
        tone: 'error',
      });
      return;
    }

    if (!pdfFile) {
      setStatus({
        message: 'Selecciona un archivo PDF antes de enviar.',
        tone: 'error',
      });
      return;
    }

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      setStatus({
        message: 'Carga no disponible. El webhook de n8n no está configurado en este entorno.',
        tone: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: 'Enviando PDF a n8n para extracción y validación...', tone: 'neutral' });

    try {
      await uploadDteToN8n({
        taxpayerId: user.id || '',
        pdfFile,
      });

      setStatus({
        message: 'Archivo enviado correctamente. El DTE se indexará cuando finalice el procesamiento.',
        tone: 'success',
      });

      setPdfFile(null);
      const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (pdfInput) pdfInput.value = '';

      setTimeout(() => {
        loadRecentDtes();
      }, 4000);
    } catch (error: any) {
      setStatus({ message: error.message || 'No se pudo enviar el archivo a n8n.', tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Topbar
        title="Ingreso DTE"
        subtitle="Carga evidencia gráfica DTE para extracción y validación con n8n"
      />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.75fr)]">
          <section className="rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
            <div className="border-b border-[var(--color-border)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                Flujo de ingreso
              </p>
              <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                Enviar representación gráfica del DTE
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                Carga la evidencia PDF. TaxPilot la envía a n8n para extracción,
                validación y registro en el espacio de auditoría.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 p-4">
              {(isDemo || !hasN8nConfig) && status.message && (
                <div className={`flex items-start gap-3 rounded-[6px] border p-3 text-sm ${statusClass(status.tone)}`}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {isDemo ? 'Protección demo activa' : 'La integración requiere atención'}
                    </p>
                    <p className="mt-1 leading-5">{status.message}</p>
                  </div>
                </div>
              )}

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  if (!isDemo) document.getElementById('pdfFile')?.click();
                }}
                className={[
                  'grid min-h-[320px] place-items-center rounded-lg border border-dashed p-6 text-center transition-colors',
                  isDemo
                    ? 'border-slate-200 bg-slate-50 opacity-70'
                    : dragActive
                      ? 'border-[var(--color-accent)] bg-cyan-50'
                      : pdfFile
                        ? 'border-emerald-300 bg-emerald-50/55'
                        : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-blue-50/50',
                ].join(' ')}
              >
                <input
                  id="pdfFile"
                  type="file"
                  accept=".pdf"
                  disabled={isDemo}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {pdfFile ? (
                  <div className="grid max-w-md justify-items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-emerald-100 text-emerald-700">
                      <FileDown className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="max-w-sm truncate text-base font-semibold text-[var(--color-foreground)]">
                        {pdfFile.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {(pdfFile.size / 1024).toFixed(1)} KB listos para procesar
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPdfFile(null);
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Quitar archivo
                    </button>
                  </div>
                ) : (
                  <div className="grid max-w-lg justify-items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-white text-[var(--color-primary)] shadow-sm">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-foreground)]">
                        Suelta aquí el PDF del DTE
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        O haz clic para buscar en tu dispositivo. Solo PDF.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                  <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
                  El procesamiento suele aparecer en el registro después de una breve espera.
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !user || !hasN8nConfig || isDemo || !pdfFile}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-strong)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Procesando...' : 'Cargar y procesar'}
                </button>
              </div>

              {status.message && !isDemo && hasN8nConfig && (
                <div className={`flex items-start gap-3 rounded-[6px] border p-3 text-sm ${statusClass(status.tone)}`}>
                  {status.tone === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <p className="leading-5">{status.message}</p>
                </div>
              )}
            </form>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                    Integration state
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                    n8n handoff
                  </h2>
                </div>
                <Link2 className="h-5 w-5 text-[var(--color-muted)]" />
              </div>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-slate-50 p-3">
                  <span className="text-sm font-medium text-[var(--color-foreground-soft)]">
                    Webhook
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
                <div className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-slate-50 p-3">
                  <span className="text-sm font-medium text-[var(--color-foreground-soft)]">
                    Modo demo
                  </span>
                  <span
                    className={[
                      'rounded-[5px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                      isDemo
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    ].join(' ')}
                  >
                    {isDemo ? 'Bloqueado' : 'Editable'}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                    Ingreso reciente
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                    Últimos DTEs procesados
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={loadRecentDtes}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  aria-label="Refresh recent DTEs"
                >
                  <RefreshCw className={isLoadingRecent ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {isLoadingRecent ? (
                  <p className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-sm text-[var(--color-muted)]">
                    Cargando DTEs recientes...
                  </p>
                ) : recentDtes.length === 0 ? (
                  <p className="rounded-[6px] border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-[var(--color-muted)]">
                    No se encontraron DTEs procesados recientemente.
                  </p>
                ) : (
                  recentDtes.map((document) => (
                    <RecentDteItem key={document.id} document={document} />
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
