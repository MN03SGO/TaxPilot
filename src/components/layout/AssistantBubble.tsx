import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Loader2, Bot, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { transcribeAudio, textToSpeech } from '@/lib/elevenLabs';
import { dteService } from '@/services/dteService';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
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

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    try {
      if (!webhookUrl) {
        throw new Error('Webhook de n8n no configurado.');
      }

      // Fetch DTEs and stats to feed the AI context
      const [stats, documents] = await Promise.all([
        dteService.getDashboardStats().catch(() => null),
        dteService.getDocuments({ pageSize: 100 }).catch(() => null),
      ]);

      // Send chat payload to n8n with context and language instructions
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          message: text,
          taxpayerId: user?.id || 'demo-user',
          language: 'es', // Explicitly request Spanish
          systemInstruction: 'Responde siempre en español de manera concisa y profesional. Tienes acceso al contexto con los datos reales del DTE y estadísticas del panel.',
          context: {
            stats: stats || { totalProcessed: 0, errorCount: 0, totalAuditedAmount: 0, successRate: 100 },
            documents: documents?.data || [],
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n respondió con error: ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      
      // Handle standard response schemas
      let answer = data?.output || data?.message || data?.response || 
                     (typeof data === 'string' ? data : null) || 
                     'DTE recibido e indexado correctamente en la base de datos.';

      if (answer === 'Workflow was started' || (data && data.message === 'Workflow was started')) {
        answer = '🎤 ¡Tu micrófono y la transcripción de ElevenLabs funcionan perfectamente! Sin embargo, tu nodo Webhook en n8n está respondiendo con el mensaje predeterminado ("Workflow was started"). Para chatear con la IA, entra a n8n, edita la configuración del nodo Webhook, cambia el campo "Respond" a "Using Respond to Webhook Node", y coloca un nodo "Respond to Webhook" al final de tu flujo con la respuesta de la IA.';
      }

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
      
      let errorMsg = 'Lo siento, no he podido conectar con el asistente de n8n.';
      if (isDemo) {
        errorMsg = `[Modo Demo] Has dicho: "${text}". La conexión con n8n está desactivada en demostración.`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: errorMsg,
          timestamp: new Date(),
        },
      ]);
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      {isOpen && (
        <section className="mb-4 flex h-[480px] w-[360px] flex-col rounded-2xl border border-[var(--color-border)] bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-white">
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
                className="rounded-lg p-1 hover:bg-teal-500/50 transition-colors cursor-pointer"
                title={isMuted ? 'Activar voz' : 'Silenciar asistente'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 hover:bg-teal-500/50 transition-colors cursor-pointer"
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
                <p className="leading-relaxed">{msg.text}</p>
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
                <span>Analizando datos en n8n...</span>
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
              className="flex-1 h-9 rounded-lg border border-[var(--color-border)] bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-teal-500 focus:bg-white"
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
          'relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg transition-transform hover:scale-105 cursor-pointer',
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
