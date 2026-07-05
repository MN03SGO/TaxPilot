import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { transcribeAudio, textToSpeech } from '@/lib/elevenLabs';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
}

export function VoiceSearchButton({ onTranscript }: VoiceSearchButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          const cleanText = text.trim();
          if (cleanText) {
            onTranscript(cleanText);
            // Spoken confirmation: "Buscando: [text]"
            await textToSpeech(`Buscando ${cleanText}`);
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          alert(err.message || 'Error en la transcripción de ElevenLabs.');
        } finally {
          setIsTranscribing(false);
        }
        
        // Release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = mediaRecorder;
      streamRef.current = stream;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Permiso de micrófono denegado o no disponible.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isTranscribing}
        className={[
          'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer shadow-sm',
          isRecording
            ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 animate-pulse'
            : isTranscribing
              ? 'border-teal-200 bg-teal-50 text-teal-600 cursor-not-allowed'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-neutral-50 hover:text-[var(--color-foreground)]'
        ].join(' ')}
        title={isRecording ? 'Detener grabación' : isTranscribing ? 'Procesando voz...' : 'Buscar por voz con ElevenLabs'}
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>

      {/* Ripple Rings when recording */}
      {isRecording && (
        <span className="absolute -inset-1 rounded-lg border border-red-400 opacity-75 animate-ping pointer-events-none" />
      )}
    </div>
  );
}
