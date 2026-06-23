// src/components/TranscriptPanel.tsx
import { cn } from '../lib/utils';

const PRIVACY_COPY =
  "Audio is sent to your browser's speech service for transcription; we never record or store it.";

interface Props {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  detectedWords: string[];
  error: string | null;
}

function errorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied — you can still tap squares manually.';
    case 'audio-capture':
      return 'No microphone was found — tap squares manually instead.';
    case 'restart-limit-reached':
      return 'Listening stopped after repeated interruptions. Tap “Start listening” to retry.';
    default:
      return '';
  }
}

export function TranscriptPanel({
  isSupported,
  isListening,
  transcript,
  interimTranscript,
  detectedWords,
  error,
}: Props) {
  // Feature-detect fallback — manual mode is a first-class state, not an error (C1).
  if (!isSupported) {
    return (
      <div className="rounded-xl border-2 border-gray-100 bg-gray-50 p-3 text-center text-sm text-gray-500">
        🎙️ Speech recognition isn’t available in this browser. No problem — tap
        squares manually as you hear the buzzwords.
      </div>
    );
  }

  const displayTranscript = transcript.slice(-100);
  const errMsg = error ? errorMessage(error) : '';

  return (
    <div className="rounded-xl border-2 border-gray-100 bg-gray-50 p-3">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            isListening ? 'bg-red-500' : 'bg-gray-300',
          )}
          aria-hidden
        />
        <span className="text-xs font-medium text-gray-600">
          {isListening ? 'Listening…' : 'Mic off'}
        </span>
      </div>

      <p className="min-h-[2.25rem] text-sm text-gray-700">
        <span>{displayTranscript || 'Buzzwords fill your card as they’re spoken.'}</span>{' '}
        <span className="italic text-gray-400">{interimTranscript}</span>
      </p>

      {detectedWords.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-gray-200 pt-2">
          <span className="text-xs text-gray-400">Detected:</span>
          {detectedWords.slice(-5).map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
            >
              ✨ {word}
            </span>
          ))}
        </div>
      )}

      {errMsg && <p className="mt-2 text-xs text-amber-700">{errMsg}</p>}

      <p className="mt-2 text-[11px] leading-snug text-gray-400">{PRIVACY_COPY}</p>
    </div>
  );
}
