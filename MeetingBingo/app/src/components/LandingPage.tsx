// src/components/LandingPage.tsx
import { Button } from './ui/Button';

interface Props {
  onStart: () => void;
}

// Solo play only — a single game-entry CTA, no "Join Game" flow (plan §0).
export function LandingPage({ onStart }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight">🎯 Meeting Bingo</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-gray-500">
          Turn meeting buzzwords into a game. Squares fill themselves when the
          jargon gets spoken — or tap them yourself.
        </p>
      </div>

      <Button onClick={onStart} className="px-8 py-3 text-base">
        New Game
      </Button>

      <p className="max-w-sm text-xs text-gray-400">
        Audio is sent to your browser's speech service for transcription; we
        never record or store it.
      </p>
    </main>
  );
}
