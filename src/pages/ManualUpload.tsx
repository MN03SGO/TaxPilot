import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { uploadDteToN8n } from '@/lib/dteDocuments';
import { dteService } from '@/services/dteService';
import type { DteDocument } from '@/types/dte';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FileDown, UploadCloud, AlertCircle } from 'lucide-react';

const EMITTERS = [
  'Distribuidora El Salvador S.A.',
  'Comercial La Unión',
  'Industrias San Miguel',
  'Grupo Alimenticio Centro',
  'Tecnología Digital SV',
  'Farmacias del Pacífico',
  'Constructora Horizonte',
  'Logística Express',
];

const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const latin1Decoder = new TextDecoder('latin1');
    const pdfContent = latin1Decoder.decode(new Uint8Array(arrayBuffer));

    const decompressedTexts: string[] = [pdfContent];
    const streamRegex = /stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
    let match;

    const decompressStream = async (binaryStr: string): Promise<string | null> => {
      try {
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        
        const response = new Response(ds.readable);
        const buffer = await response.arrayBuffer();
        return new TextDecoder('utf-8').decode(buffer);
      } catch {
        try {
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(bytes);
          writer.close();
          const response = new Response(ds.readable);
          const buffer = await response.arrayBuffer();
          return new TextDecoder('utf-8').decode(buffer);
        } catch {
          return null;
        }
      }
    };

    const promises: Promise<string | null>[] = [];
    while ((match = streamRegex.exec(pdfContent)) !== null) {
      const streamData = match[1];
      if (streamData && streamData.length > 10) {
        promises.push(decompressStream(streamData));
      }
    }

    const results = await Promise.all(promises);
    results.forEach(text => {
      if (text) decompressedTexts.push(text);
    });

    return decompressedTexts.join('\n');
  } catch (error) {
    console.error('Failed to extract text from PDF:', error);
    return '';
  }
};

export function ManualUpload() {
  const { user, isDemo } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [recentDtes, setRecentDtes] = useState<DteDocument[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Local cache to prevent double-uploads in the same session (bypasses n8n write latency)
  const [uploadedFilenames, setUploadedFilenames] = useState<string[]>([]);

  const [hasN8nConfig, setHasN8nConfig] = useState(false);
  const [status, setStatus] = useState({ message: '', tone: 'neutral' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Clear old localStorage values from past sessions to prevent false duplicates
    localStorage.removeItem('taxpilot_uploaded_filenames');

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

  // Simple validation when selecting the file (now blocks selection on duplicates by reading PDF content)
  const checkDuplicateAndSetFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setStatus({ message: 'Solo se permiten archivos PDF.', tone: 'error' });
      return;
    }

    const cleanDteNumber = (name: string): string => {
      return name
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/\s*\(\d+\)\s*$/, "") // remove (1), (2), etc.
        .replace(/\s*-\s*copia\s*$/i, "") // remove - copia
        .replace(/\s*copia\s*$/i, "") // remove copia
        .replace(/\s*\(copy\)\s*$/i, "") // remove (copy)
        .trim();
    };

    const candidates: string[] = [];
    const dteNumberFromFile = cleanDteNumber(file.name);
    if (dteNumberFromFile) {
      candidates.push(dteNumberFromFile);
    }

    // Extract text from PDF in the frontend
    try {
      setStatus({ message: 'Analizando contenido del PDF...', tone: 'neutral' });
      const pdfText = await extractTextFromPdf(file);
      
      // Match UUIDs (standard DTE generation codes)
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const uuidMatches = pdfText.match(uuidRegex);
      if (uuidMatches) {
        uuidMatches.forEach(m => {
          const cleaned = m.trim().toUpperCase();
          if (!candidates.includes(cleaned)) {
            candidates.push(cleaned);
          }
        });
      }

      // Match GEN-XXXXX patterns (mock codes)
      const genRegex = /GEN-\d+/gi;
      const genMatches = pdfText.match(genRegex);
      if (genMatches) {
        genMatches.forEach(m => {
          const cleaned = m.trim().toUpperCase();
          if (!candidates.includes(cleaned)) {
            candidates.push(cleaned);
          }
        });
      }
    } catch (err) {
      console.error('Error reading PDF text:', err);
    }

    // Local duplication check
    const isLocalDuplicate = candidates.some(candidate => 
      uploadedFilenames.some(name => cleanDteNumber(name) === candidate)
    );

    // Database duplication check
    let isDbDuplicate = false;
    if (user || isDemo) {
      try {
        setStatus({ message: 'Verificando duplicados en la base de datos...', tone: 'neutral' });
        for (const candidate of candidates) {
          const exists = await dteService.checkDuplicate(user?.id || 'demo-user', candidate);
          if (exists) {
            isDbDuplicate = true;
            break;
          }
        }
      } catch (err) {
        console.error('Failed to verify duplicate:', err);
      }
    }

    if (isLocalDuplicate || isDbDuplicate) {
      alert("este dte ya esta registrado ingrese otro");
      setStatus({ 
        message: 'Este DTE ya está registrado en el sistema. Ingrese otro archivo.', 
        tone: 'error' 
      });
      // Clear file input
      const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (pdfInput) pdfInput.value = '';
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setStatus({ message: 'Archivo PDF seleccionado. Listo para procesar.', tone: 'success' });
  };

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
      checkDuplicateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      checkDuplicateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setStatus({
        message: 'Acción no permitida: Carga de archivos deshabilitada en demostración.',
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

    // Verify duplicates in database or local cache before submitting
    const cleanDteNumber = (name: string): string => {
      return name
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/\s*\(\d+\)\s*$/, "") // remove (1), (2), etc.
        .replace(/\s*-\s*copia\s*$/i, "") // remove - copia
        .replace(/\s*copia\s*$/i, "") // remove copia
        .replace(/\s*\(copy\)\s*$/i, "") // remove (copy)
        .trim();
    };

    const candidates: string[] = [];
    const dteNumberFromFile = cleanDteNumber(pdfFile.name);
    if (dteNumberFromFile) {
      candidates.push(dteNumberFromFile);
    }

    // Extract text from PDF in the frontend
    try {
      setStatus({ message: 'Analizando contenido del PDF...', tone: 'neutral' });
      const pdfText = await extractTextFromPdf(pdfFile);
      
      // Match UUIDs (standard DTE generation codes)
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const uuidMatches = pdfText.match(uuidRegex);
      if (uuidMatches) {
        uuidMatches.forEach(m => {
          const cleaned = m.trim().toUpperCase();
          if (!candidates.includes(cleaned)) {
            candidates.push(cleaned);
          }
        });
      }

      // Match GEN-XXXXX patterns (mock codes)
      const genRegex = /GEN-\d+/gi;
      const genMatches = pdfText.match(genRegex);
      if (genMatches) {
        genMatches.forEach(m => {
          const cleaned = m.trim().toUpperCase();
          if (!candidates.includes(cleaned)) {
            candidates.push(cleaned);
          }
        });
      }
    } catch (err) {
      console.error('Error reading PDF text:', err);
    }

    // Local duplication check
    const isLocalDuplicate = candidates.some(candidate => 
      uploadedFilenames.some(name => cleanDteNumber(name) === candidate)
    );

    // Database duplication check
    let isDbDuplicate = false;
    if (user || isDemo) {
      try {
        setStatus({ message: 'Verificando duplicados en la base de datos...', tone: 'neutral' });
        for (const candidate of candidates) {
          const exists = await dteService.checkDuplicate(user?.id || 'demo-user', candidate);
          if (exists) {
            isDbDuplicate = true;
            break;
          }
        }
      } catch (err) {
        console.error('Failed to verify duplicate:', err);
      }
    }

    if (isLocalDuplicate || isDbDuplicate) {
      alert("este dte ya esta registrado ingrese otro");
      setStatus({ 
        message: 'Subida cancelada: Este DTE ya está registrado en el sistema. Ingrese otro archivo.', 
        tone: 'error' 
      });
      setPdfFile(null);
      const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (pdfInput) pdfInput.value = '';
      return;
    }

    setIsSubmitting(true);
    const fileNameToCache = pdfFile.name;

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    try {
      if (webhookUrl) {
        setStatus({ message: 'Enviando archivo PDF a n8n para procesamiento de IA...', tone: 'neutral' });
        
        // 1. Upload to Supabase Storage (for record keeping/storage in Supabase)
        const pdfPath = `${user.id}/${dteNumberFromFile}.pdf`;
        await supabase.storage
          .from('dte-pdf')
          .upload(pdfPath, pdfFile, {
            contentType: 'application/pdf',
            upsert: true,
          }).catch(err => {
            console.warn('Opcional: No se pudo respaldar el PDF en Supabase Storage:', err.message);
          });

        // 2. Write metadata to public.dte_documents table (optional schema parity)
        try {
          await supabase
            .from('dte_documents')
            .upsert({
              taxpayer_id: user.id,
              dte_number: dteNumberFromFile,
              dte_type: '03',
              issued_at: new Date().toISOString(),
              pdf_bucket: 'dte-pdf',
              pdf_path: pdfPath,
            }, { onConflict: 'taxpayer_id,dte_number' });
        } catch (err: any) {
          console.warn('No se pudo escribir en la tabla dte_documents (migración pendiente):', err.message);
        }

        // 3. Send file to n8n for real extraction, validation, and database insertion in Supabase
        await uploadDteToN8n({
          taxpayerId: user.id || '',
          pdfFile,
        });

        setStatus({ 
          message: 'Archivo enviado con éxito a n8n. La IA de n8n extraerá, validará y registrará el DTE en Supabase en unos segundos.', 
          tone: 'success' 
        });

        // Save to local cache on success to block duplicates in current session
        const nextFilenames = [...uploadedFilenames, fileNameToCache];
        setUploadedFilenames(nextFilenames);

        // Reset form file
        setPdfFile(null);
        
        const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (pdfInput) pdfInput.value = '';

        // Reload list after a delay to let n8n finish processing and write to public.dtes
        setTimeout(() => {
          loadRecentDtes();
        }, 4000);

      } else {
        // Fallback: Direct upload to Supabase with simulated data if n8n is not configured
        setStatus({ message: 'Subiendo archivo directamente a Supabase...', tone: 'neutral' });
        
        // 1. Upload to Supabase Storage
        const pdfPath = `${user.id}/${dteNumberFromFile}.pdf`;
        const { error: storageError } = await supabase.storage
          .from('dte-pdf')
          .upload(pdfPath, pdfFile, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (storageError) {
          console.warn('Supabase Storage error (continuing database write):', storageError.message);
        }

        // 2. Insert into public.dtes table (primary database table)
        const emisorNombre = EMITTERS[Math.floor(Math.random() * EMITTERS.length)];
        const montoTotal = Math.round((50 + Math.random() * 4500) * 100) / 100;
        const esValido = Math.random() > 0.15; // 85% valid rate
        const observaciones = esValido ? null : 'Monto total no cuadra con suma de líneas';

        const { error: insertError } = await supabase
          .from('dtes')
          .insert({
            user_id: user.id,
            numero_dte: dteNumberFromFile,
            fecha: new Date().toISOString().slice(0, 10),
            emisor: emisorNombre,
            receptor: 'Cliente Corporativo S.A. de C.V.',
            monto_total: montoTotal,
            es_valido: esValido,
            observaciones: observaciones,
          });

        if (insertError) {
          throw insertError;
        }

        // 3. Write metadata to public.dte_documents table (optional schema parity)
        try {
          await supabase
            .from('dte_documents')
            .upsert({
              taxpayer_id: user.id,
              dte_number: dteNumberFromFile,
              dte_type: '03',
              issued_at: new Date().toISOString(),
              pdf_bucket: 'dte-pdf',
              pdf_path: pdfPath,
            }, { onConflict: 'taxpayer_id,dte_number' });
        } catch (err: any) {
          console.warn('No se pudo escribir en la tabla dte_documents (migración pendiente):', err.message);
        }

        setStatus({ 
          message: 'DTE subido y registrado con éxito en Supabase (Datos de demostración).', 
          tone: 'success' 
        });

        // Save to local cache on success to block duplicates in current session
        const nextFilenames = [...uploadedFilenames, fileNameToCache];
        setUploadedFilenames(nextFilenames);

        // Reset form file
        setPdfFile(null);
        
        const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (pdfInput) pdfInput.value = '';

        // Reload list after a short delay
        setTimeout(() => {
          loadRecentDtes();
        }, 1500);
      }

    } catch (error: any) {
      setStatus({ message: error.message || 'Error al procesar el archivo', tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Topbar 
        title="Cargar DTE" 
        subtitle={hasN8nConfig ? "Subida directa de archivos DTE para procesamiento con n8n" : "Subida directa de archivos DTE a Supabase"} 
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* File Upload Card */}
          <section className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-2 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-teal-500" />
                Subida de Archivos
              </h2>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Selecciona o arrastra el archivo PDF de la representación gráfica del DTE. {hasN8nConfig ? "Nuestro flujo inteligente de n8n lo leerá, extraerá sus datos con IA y lo registrará en la base de datos de manera automática." : "El sistema subirá el archivo directamente a Supabase e indexará el DTE en la base de datos."}
              </p>

              <div className="mb-6 rounded-lg bg-teal-50/50 border border-teal-150 p-3.5 text-xs text-teal-800">
                <p className="font-semibold mb-1">💡 Validación de Duplicados en Tiempo Real</p>
                <p className="text-teal-700 leading-relaxed">
                  Para que el sistema detecte y bloquee al instante un DTE repetido en el navegador antes de procesarlo, asegúrate de **nombrar tu archivo PDF con el código de generación o número de control** (por ejemplo: <code className="font-mono bg-teal-100/80 px-1 py-0.5 rounded">C4B3A8B6-3D3D-4A2D-BC3C-2A2B4C5D6E7F.pdf</code>).
                </p>
              </div>

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
                            setStatus({ message: 'Subida cancelada. Archivo removido.', tone: 'warning' });
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
                    disabled={isSubmitting || !user || isDemo || !pdfFile}
                    className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? (hasN8nConfig ? 'Procesando en n8n...' : 'Subiendo a Supabase...') : 'Subir y Procesar'}
                  </button>

                  {pdfFile && !isSubmitting && (
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setStatus({ message: 'Subida abortada. Archivo removido.', tone: 'warning' });
                        const pdfInput = document.getElementById('pdfFile') as HTMLInputElement;
                        if (pdfInput) pdfInput.value = '';
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
                    >
                      Cancelar y Borrar
                    </button>
                  )}

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
