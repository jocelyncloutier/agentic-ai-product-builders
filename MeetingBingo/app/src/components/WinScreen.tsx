// src/components/WinScreen.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameState } from '../types';
import { CATEGORIES } from '../data/categories';
import { countFilled } from '../lib/bingoChecker';
import { prefersReducedMotion } from '../lib/motion';
import { buildShareText, shareResult } from '../lib/shareUtils';
import { track } from '../lib/analytics';
import { BingoCard } from './BingoCard';
import { Button } from './ui/Button';
import { Toast } from './ui/Toast';

interface Props {
  game: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Discreet by default: a small, brief, center burst — not a full-screen storm —
// so it stays professional if a boss is watching the shared screen (plan H11).
function fireConfetti(big: boolean) {
  if (prefersReducedMotion()) return; // reduced-motion → no confetti (plan H10)
  confetti({
    particleCount: big ? 120 : 40,
    spread: big ? 70 : 45,
    startVelocity: big ? 45 : 28,
    scalar: big ? 1 : 0.8,
    gravity: 1.2,
    ticks: big ? 200 : 120,
    origin: { x: 0.5, y: 0.4 },
    disableForReducedMotion: true,
  });
}

export function WinScreen({ game, onPlayAgain, onHome }: Props) {
  const { card, winningLine, winningWord, startedAt, completedAt, category } =
    game;
  const [toast, setToast] = useState<string | null>(null);
  const reportedRef = useRef(false);

  const winningSquareIds = useMemo(
    () => new Set(winningLine?.squares ?? []),
    [winningLine],
  );

  const categoryName =
    CATEGORIES.find((c) => c.id === category)?.name ?? category ?? '—';
  const elapsed =
    startedAt && completedAt ? formatDuration(completedAt - startedAt) : '—';
  const filled = card ? countFilled(card) : 0;

  // Discreet celebration + win analytics, once on mount.
  useEffect(() => {
    fireConfetti(false);
    if (!reportedRef.current) {
      reportedRef.current = true;
      track('win', {
        category: category ?? 'unknown',
        timeToBingoMs: startedAt && completedAt ? completedAt - startedAt : 0,
        filledCount: filled,
        winningWord: winningWord ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    const text = buildShareText({
      categoryName,
      startedAt,
      completedAt,
      winningWord,
      filledCount: filled,
    });
    const outcome = await shareResult(text);
    track('share_click', { outcome });
    if (outcome === 'copied') setToast('Copied to clipboard!');
    else if (outcome === 'shared') setToast('Shared!');
    else setToast('Could not share — copy manually.');
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6 text-center">
      <div role="status" aria-live="polite">
        <h2 className="text-4xl font-extrabold tracking-tight">🎉 BINGO!</h2>
        <p className="mt-1 text-gray-500">You survived the meeting.</p>
      </div>

      {card && (
        <BingoCard
          card={card}
          winningSquareIds={winningSquareIds}
          interactive={false}
        />
      )}

      <dl className="grid grid-cols-2 gap-3 text-left">
        <Stat label="Time to bingo" value={elapsed} />
        <Stat label="Winning word" value={winningWord ?? '—'} />
        <Stat label="Squares filled" value={`${filled}/24`} />
        <Stat label="Pack" value={categoryName} />
      </dl>

      <div className="flex flex-col gap-2">
        <Button onClick={handleShare}>📋 Share result</Button>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onPlayAgain}>
            Play again
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onHome}>
            Home
          </Button>
        </div>
        {/* Opt-in louder celebration — default stays discreet (plan H11). */}
        <Button
          variant="ghost"
          className="text-xs"
          onClick={() => fireConfetti(true)}
        >
          🎉 More confetti
        </Button>
      </div>

      {toast && <Toast message={toast} />}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-gray-100 bg-white p-3">
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-gray-800">{value}</dd>
    </div>
  );
}
