import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { uploadDteToN8n } from '@/lib/dteDocuments';
import { dteService } from '@/services/dteService';
import type { DteDocument } from '@/types/dte';
import { useAuth } from '@/hooks/useAuth';
import { FileDown, UploadCloud, AlertCircle } from 'lucide-react';

export function ManualUpload() {
  const { user, isDemo } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [recentDtes, setRecentDtes] = useState<DteDocument[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const [hasN8nConfig, setHasN8nConfig] = useState(false);
  const [status, setStatus] = useState({ message: '', tone: 'neutral' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecentDtes();
    } else if (isDemo) {
      setStatus({
        message: 'Modo Demo activo: Carga y reenvío a n8n deshabilitados.',
        tone: 'warning',
      });
    }

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      setHasN8nConfig(true);
    } else {
      setStatus({
        message: 'Webhook de n8n no configurado. Define VITE_N8N_WEBHOOK_URL en tu archivo .env.',
        tone: 'warning',
      });
    }
  }, [user, isDemo]);

  async function loadRecentDtes() {
    setIsLoadingRecent(true);
    try {
      const response = await dteService.getDocuments({ pageSize: 5 });
      setRecentDtes(response.data);
    } catch (error: any) {
      console.error('Failed to load recent DTEs:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  }

  // Handle drag-and-drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (isDemo) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setStatus({ message: '', tone: 'neutral' });
      } else {
        setStatus({ message: 'Solo se permiten archivos PDF.', tone: 'error' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setStatus({ message: '', tone: 'neutral' });
      } else {
        setStatus({ message: 'Solo se permiten archivos PDF.', tone: 'error' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setStatus({
        message: 'Acción no permitida: n8n está deshabilitado en el modo de demostración.',
        tone: 'error',
      });
      return;
    }

    if (!user) {
      setStatus({
        message: 'Inicia sesión antes de subir un archivo.',
        tone: 'error',
      });
      return;
    }

    if (!pdfFile) {
      setStatus({
        message: 'Debe seleccionar un archivo PDF.',
        tone: 'error',
      });
      return;
    }

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      setStatus({
        message: 'No se puede subir: Webhook de n8n no configurado en el servidor.',
        tone: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: 'Enviando archivo PDF a n8n para procesamiento de IA...', tone: 'neutral' });

    try {
      await uploadDteToN8n({
        taxpayerId: user.id || '',
        pdfFile,
      });

      setStatus({ 
        message: 'Archivo enviado con éxito a n8n. El DTE se procesará e indexará automáticamente en unos segundos.', 
        tone: 'success' 
      });

      // Reset form file
      setPdfFile(null);
      
      const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (pdfInput) pdfInput.value = '';

      // Reload list after a short delay to let n8n finish processing
      setTimeout(() => {
        loadRecentDtes();
      }, 4000);

    } catch (error: any) {
      setStatus({ message: error.message || 'Error al enviar a n8n', tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Topbar title="Cargar DTE" subtitle="Subida directa de archivos DTE para procesamiento con n8n" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* File Upload Card */}
          <section className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-2 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-teal-500" />
                Subida de Archivos
              </h2>
              <p className="text-xs text-[var(--color-muted)] mb-6">
                Selecciona o arrastra el archivo PDF de la representación gráfica del DTE. Nuestro flujo inteligente de n8n lo leerá, extraerá sus datos con IA y lo registrará en la base de datos de manera automática.
              </p>

              {isDemo && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-850 flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Modo Demostración Activo</h4>
                    <p className="text-xs mt-0.5 text-amber-700">
                      En el modo de demostración, la subida de archivos y el reenvío a n8n están desactivados. Por favor inicia sesión con una cuenta real para procesar DTEs.
                    </p>
                  </div>
                </div>
              )}

              {!hasN8nConfig && !isDemo && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold">Integración de n8n no configurada</h4>
                    <p className="text-xs mt-0.5 text-amber-700">
                      Configura la variable <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_N8N_WEBHOOK_URL</code> en tu archivo <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</code> para habilitar la carga automática.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">
                    Documento DTE (.pdf)
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!isDemo) document.getElementById('pdfFile')?.click();
                    }}
                    className={[
                      'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all',
                      isDemo 
                        ? 'border-slate-200 bg-slate-50/30 opacity-55 cursor-not-allowed'
                        : dragActive
                          ? 'border-teal-500 bg-teal-50/20 scale-[1.01] cursor-pointer'
                          : pdfFile
                            ? 'border-green-500 bg-green-50/10 cursor-pointer'
                            : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50/80 cursor-pointer'
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
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm animate-bounce">
                          <FileDown className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-xs mt-2">
                          {pdfFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(pdfFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfFile(null);
                          }}
                          className="mt-3 text-xs font-semibold text-red-600 hover:text-red-500 hover:underline transition-colors"
                        >
                          Quitar archivo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mt-2">
                          Arrastra tu archivo PDF aquí
                        </p>
                        <p className="text-xs text-slate-500">
                          o <span className="text-teal-600 font-medium hover:text-teal-500 hover:underline">haz clic para buscar</span> en tu equipo
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Solo formato PDF
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-border)]">
                  <button
                    type="submit"
                    disabled={isSubmitting || !user || !hasN8nConfig || isDemo || !pdfFile}
                    className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? 'Procesando en n8n...' : 'Subir y Procesar'}
                  </button>
                  {status.message && (
                    <p
                      className={[
                        'text-xs font-semibold',
                        status.tone === 'success' ? 'text-green-600' :
                        status.tone === 'error' ? 'text-red-600' :
                        status.tone === 'warning' ? 'text-amber-600' : 'text-neutral-500'
                      ].join(' ')}
                    >
                      {status.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Recent List Card */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
              <FileDown className="h-5 w-5 text-[var(--color-muted)]" />
              Últimos DTEs Procesados
            </h2>
            {isLoadingRecent ? (
              <p className="text-sm text-[var(--color-muted)]">Cargando...</p>
            ) : recentDtes.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No hay DTE registrados recientemente.</p>
            ) : (
              <div className="space-y-4">
                {recentDtes.map((d) => (
                  <div key={d.id} className="flex flex-col gap-1 rounded-lg border border-[var(--color-border)] bg-neutral-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold truncate max-w-[120px]" title={d.codigo_generacion}>
                        {d.codigo_generacion}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">{d.fecha_emision}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-neutral-500 truncate max-w-[110px]">{d.emisor_nombre}</span>
                      <div className="flex gap-2">
                        {d.files?.pdfUrl && (
                          <a
                            href={d.files.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-2xs font-bold text-red-700 hover:bg-red-100"
                          >
                            PDF
                          </a>
                        )}
                        {d.files?.jsonUrl && (
                          <a
                            href={d.files.jsonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-2xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            JSON
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
