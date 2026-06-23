// src/hooks/useSpeechRecognition.ts
import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API isn't in the standard TS DOM lib, so we treat the
// constructor and events as `any` (MVP-acceptable, matches Architecture).
const SpeechRecognitionCtor: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    : undefined;

// Errors that mean "don't bother restarting" — surface them instead (plan H4).
const FATAL_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
]);

// Backoff cap: if we restart this many times without a healthy result in
// between, give up rather than spin in a tight onend→start loop (plan H4).
const MAX_RESTART_ATTEMPTS = 5;

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string; // accumulated FINAL transcript
  interimTranscript: string; // current in-flight (non-final) text
  error: string | null;
  start: (onFinalChunk?: (chunk: string) => void) => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  // Synchronous source of truth for "should we be listening?" — read inside
  // onend so the restart decision never depends on async React state (plan H3).
  const isListeningRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const onFinalChunkRef = useRef<((chunk: string) => void) | null>(null);

  const isSupported = !!SpeechRecognitionCtor;

  useEffect(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      setInterimTranscript(interim);
      if (final) {
        // A healthy final result — the session is alive, so reset backoff.
        restartAttemptsRef.current = 0;
        setTranscript((prev) => prev + final);
        // Detection runs on FINAL chunks only (plan Phase 3 step 3).
        onFinalChunkRef.current?.(final);
      }
    };

    recognition.onerror = (event: any) => {
      const err: string = event.error;
      setError(err);
      if (FATAL_ERRORS.has(err)) {
        // Synchronously stop so onend won't restart into the same error (H3/H4).
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Restart OUTSIDE any setState updater, reading the synchronous ref (H3).
      if (!isListeningRef.current) return;
      if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) {
        isListeningRef.current = false;
        setIsListening(false);
        setError('restart-limit-reached');
        return;
      }
      restartAttemptsRef.current += 1;
      try {
        recognition.start();
      } catch {
        // start() throws if it's somehow already running — safe to ignore.
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // StrictMode double-mount safe: stop and detach before re-running.
      isListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* not started */
      }
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const start = useCallback(
    (onFinalChunk?: (chunk: string) => void) => {
      if (!recognitionRef.current) return;
      onFinalChunkRef.current = onFinalChunk ?? null;
      isListeningRef.current = true; // set BEFORE start so onend can read it
      restartAttemptsRef.current = 0;
      setError(null);
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        // already running — ignore
      }
    },
    [],
  );

  const stop = useCallback(() => {
    isListeningRef.current = false; // synchronous — blocks the onend restart
    setIsListening(false);
    onFinalChunkRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* not started */
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
