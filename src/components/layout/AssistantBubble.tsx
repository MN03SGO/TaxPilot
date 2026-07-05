import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Loader2, Bot, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { transcribeAudio, textToSpeech } from '@/lib/elevenLabs';
import { dteService } from '@/services/dteService';
import { supabase } from '@/lib/supabase';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

function generateLocalAssistantResponse(text: string, stats: any, documents: any[]): string {
  const query = text.toLowerCase().trim();
  
  const total = stats?.totalProcessed ?? documents.length ?? 0;
  const errors = stats?.errorCount ?? documents.filter(d => !d.es_valido).length ?? 0;
  const amount = stats?.totalAuditedAmount ?? documents.reduce((sum, d) => sum + (d.monto_total || 0), 0) ?? 0;
  const rate = stats?.successRate ?? (total > 0 ? ((total - errors) / total) * 100 : 100);

  let response = "";

  if (query.includes('cuanto') || query.includes('monto') || query.includes('total') || query.includes('dinero') || query.includes('suma')) {
    response = `El monto total de los DTEs auditados en Supabase es de **$${amount.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD**.`;
  } else if (query.includes('error') || query.includes('observaci') || query.includes('invalido') || query.includes('fallo') || query.includes('incorrecto')) {
    if (errors === 0) {
      response = `¡Buenas noticias! No se han detectado DTEs con errores o observaciones en la base de datos de Supabase. La tasa de éxito es del 100%.`;
    } else {
      const invalidDocs = documents.filter(d => !d.es_valido).slice(0, 5);
      const docsList = invalidDocs.map(d => `- **${d.codigo_generacion || d.id}** (${d.emisor_nombre || d.emisor || 'Emisor Desconocido'}): ${d.observaciones || 'Observación no especificada'}`).join('\n');
      response = `Actualmente hay **${errors} DTEs con observaciones** en Supabase (tasa de éxito del ${rate.toFixed(1)}%).\n\nAquí tienes algunos de los DTEs con observaciones:\n${docsList}`;
    }
  } else if (query.includes('documento') || query.includes('dte') || query.includes('cantidad') || query.includes('numero') || query.includes('procesado')) {
    response = `Actualmente se encuentran registrados **${total} DTEs** en Supabase, con una tasa de éxito del **${rate.toFixed(1)}%** y **${errors}** documentos con observaciones.`;
  } else if (query.includes('emisor') || query.includes('quien') || query.includes('empresa') || query.includes('vendedor')) {
    const emitters = Array.from(new Set(documents.map(d => d.emisor_nombre || d.emisor).filter(Boolean))).slice(0, 10);
    if (emitters.length === 0) {
      response = "Aún no hay emisores registrados en tus DTEs de Supabase.";
    } else {
      response = `Los principales emisores registrados en tus DTEs de Supabase son:\n${emitters.map(e => `- ${e}`).join('\n')}`;
    }
  } else if (query.includes('hola') || query.includes('buenos') || query.includes('tardes') || query.includes('dias') || query.includes('saludo')) {
    response = `¡Hola! Soy tu asistente de auditoría TaxPilot. Puedo responder consultas sobre los DTEs almacenados en tu base de datos de Supabase. ¿Qué te gustaría saber hoy?`;
  } else {
    response = `Entiendo que deseas consultar sobre los DTEs. Actualmente tengo acceso a **${total} documentos** en Supabase, sumando un monto total de **$${amount.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD** y **${errors}** DTEs con observaciones.\n\n*(Nota: Para habilitar respuestas complejas y análisis avanzado con inteligencia artificial, por favor despliega la Edge Function de Supabase ejecutando \`supabase functions deploy chat\` en tu terminal).*`;
  }

  return response;
}

export function AssistantBubble() {
  const { user, isDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: '¡Hola! Soy tu asistente de auditoría TaxPilot. ¿En qué puedo ayudarte hoy? Puedes escribirme o pulsar el micrófono para hablar.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsResponding(true);

    try {
      // Fetch DTEs and stats to feed the AI context
      const [stats, documents] = await Promise.all([
        dteService.getDashboardStats().catch(() => null),
        dteService.getDocuments({ pageSize: 100 }).catch(() => null),
      ]);

      // Send chat payload to Supabase Edge Function 'chat'
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: text,
          taxpayerId: user?.id || 'demo-user',
          language: 'es', // Explicitly request Spanish
          systemInstruction: 'Eres el Asistente Oficial de Auditoría de TaxPilot (Módulo de Aseguramiento DTE). Responde siempre en español de manera concisa, analítica y sumamente profesional. Tienes acceso al contexto en tiempo real del panel (periodo fiscal activo: Julio 2026, con 72% de cobertura de validación). Utiliza las métricas oficiales del sistema: DTEs procesados, Errores detectados, Monto auditado, Tasa de éxito.',
          context: {
            stats: stats || { totalProcessed: 0, errorCount: 0, totalAuditedAmount: 0, successRate: 100 },
            documents: documents?.data || [],
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) {
        throw error;
      }

      // Handle standard response schemas
      let answer = data?.response || data?.output || data?.message || 
                     (typeof data === 'string' ? data : null) || 
                     'DTE recibido e indexado correctamente en la base de datos.';

      const assistantMsg: Message = {
        sender: 'assistant',
        text: answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Speak answer back if not muted
      if (!isMuted) {
        await textToSpeech(answer);
      }

    } catch (err: any) {
      console.error('Chat Assistant error:', err);
      
      let answer = '';
      
      // Determine if error is a 404, Function Not Found, or connection failure to Edge Function
      const isFunctionNotFound = err.message?.includes('404') || 
                                 err.status === 404 || 
                                 err.message?.toLowerCase().includes('not found') ||
                                 err.message?.toLowerCase().includes('failed to send a request') ||
                                 err.message?.toLowerCase().includes('edge function');
      
      if (isFunctionNotFound) {
        // Fallback: Fetch DTEs and stats locally to answer using the local parser
        try {
          const [stats, documents] = await Promise.all([
            dteService.getDashboardStats().catch(() => null),
            dteService.getDocuments({ pageSize: 100 }).catch(() => null),
          ]);
          
          answer = generateLocalAssistantResponse(
            text, 
            stats || { totalProcessed: 0, errorCount: 0, totalAuditedAmount: 0, successRate: 100 }, 
            documents?.data || []
          );
        } catch (localErr) {
          console.error('Local assistant fallback failed:', localErr);
          answer = '🤖 La Edge Function "chat" no está desplegada en tu proyecto de Supabase. Despliégala ejecutando `supabase functions deploy chat` desde tu terminal en la carpeta del proyecto para habilitar el asistente con IA.';
        }
      } else if (isDemo) {
        answer = `[Modo Demo] Has dicho: "${text}". La conexión con Supabase está desactivada en demostración.`;
      } else {
        answer = `Error de conexión: ${err.message || 'No se pudo conectar con Supabase Functions.'}`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: answer,
          timestamp: new Date(),
        },
      ]);

      // Speak answer back if not muted
      if (!isMuted && answer) {
        await textToSpeech(answer).catch(() => null);
      }
    } finally {
      setIsResponding(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          const cleanText = text.trim();
          if (cleanText) {
            await handleSend(cleanText);
          }
        } catch (err: any) {
          console.error(err);
          alert(err.message || 'Error al transcribir el audio.');
        } finally {
          setIsTranscribing(false);
        }
        
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = mediaRecorder;
      streamRef.current = stream;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('No se pudo acceder al micrófono.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-[45] flex max-w-[calc(100vw-2rem)] flex-col items-end sm:right-6 lg:bottom-6">
      {/* Chat Window Panel */}
      {isOpen && (
        <section className="mb-3 flex h-[min(480px,calc(100dvh-10.5rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out sm:mb-4 sm:rounded-2xl lg:h-[480px]">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-400 border border-teal-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  TaxPilot AI
                  <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                </h3>
                <p className="text-[10px] text-teal-100">En línea</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Speaker Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="flex h-8 w-8 items-center justify-center rounded-lg p-1 transition-colors hover:bg-teal-500/50"
                title={isMuted ? 'Activar voz' : 'Silenciar asistente'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg p-1 transition-colors hover:bg-teal-500/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={[
                  'flex max-w-[80%] flex-col rounded-2xl px-4 py-2.5 text-xs shadow-sm',
                  msg.sender === 'user'
                    ? 'ml-auto bg-teal-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                ].join(' ')}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                <span
                  className={[
                    'text-[8px] mt-1 select-none',
                    msg.sender === 'user' ? 'text-teal-200 self-end' : 'text-slate-400'
                  ].join(' ')}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isResponding && (
              <div className="flex max-w-[80%] items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-3 text-xs text-slate-500 shadow-sm rounded-bl-none">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                <span>Analizando datos en Supabase...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 border-t border-[var(--color-border)] bg-white p-3"
          >
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer',
                isRecording
                  ? 'border-red-300 bg-red-50 text-red-600 animate-pulse'
                  : isTranscribing
                    ? 'border-teal-250 bg-teal-50 text-teal-600 cursor-not-allowed'
                    : 'border-[var(--color-border)] text-slate-500 hover:bg-slate-50'
              ].join(' ')}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale al auditor..."
              className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-slate-50 px-3 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      {/* Trigger Bubble Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-[0_18px_40px_rgba(15,118,110,0.35)] transition-transform hover:scale-105',
          isOpen ? 'rotate-90 bg-slate-800' : ''
        ].join(' ')}
        aria-label="Toggle Assistant Chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
