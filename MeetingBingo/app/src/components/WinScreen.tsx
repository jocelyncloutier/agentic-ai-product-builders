// src/components/WinScreen.tsx
import { useMemo } from 'react';
import type { GameState } from '../types';
import { CATEGORIES } from '../data/categories';
import { countFilled } from '../lib/bingoChecker';
import { BingoCard } from './BingoCard';
import { Button } from './ui/Button';

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

/**
 * Phase 2 win screen: stats + winning-line highlight. Confetti, the discreet
 * celebration default, and reduced-motion guards land in Phase 4 (NEU-17/NEU-20).
 */
export function WinScreen({ game, onPlayAgain, onHome }: Props) {
  const { card, winningLine, winningWord, startedAt, completedAt, category } =
    game;

  const winningSquareIds = useMemo(
    () => new Set(winningLine?.squares ?? []),
    [winningLine],
  );

  const categoryName =
    CATEGORIES.find((c) => c.id === category)?.name ?? category ?? '—';
  const elapsed =
    startedAt && completedAt ? formatDuration(completedAt - startedAt) : '—';
  const filled = card ? countFilled(card) : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6 text-center">
      <div>
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

      <div className="flex gap-2">
        <Button className="flex-1" onClick={onPlayAgain}>
          Play again
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onHome}>
          Home
        </Button>
      </div>
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
