// src/components/GameBoard.tsx
import { useMemo } from 'react';
import type { BingoCard as BingoCardType, GameState } from '../types';
import { BingoCard } from './BingoCard';
import { GameControls } from './GameControls';
import { checkForBingo, countFilled, getClosestToWin } from '../lib/bingoChecker';

interface Props {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  onWin: () => void;
  onNewCard: () => void;
  onQuit: () => void;
}

const NO_WINNING_SQUARES = new Set<string>();

/**
 * Container that OWNS all game-state mutation via setGame — the single source
 * of truth (plan H5). `filledCount` and the near-win hint are DERIVED here, not
 * stored. No useGame / useBingoDetection hooks (dropped per H5).
 */
export function GameBoard({ game, setGame, onWin, onNewCard, onQuit }: Props) {
  const card = game.card!; // GameBoard only renders when a card exists

  // Derived — never stored on GameState.
  const filledCount = useMemo(() => countFilled(card), [card]);
  const closest = useMemo(() => getClosestToWin(card), [card]);

  const oneAway = closest?.needed === 1 ? closest.words : null;

  // Live-region text for screen readers (plan H8/H9).
  const announcement = oneAway
    ? `One away. Need ${oneAway.join(' or ')}.`
    : `${filledCount} of 24 squares filled.`;

  function handleSquareClick(squareId: string) {
    const toggled = card.squares.flat().find((sq) => sq.id === squareId);
    if (!toggled || toggled.isFreeSpace) return;

    const nowFilled = !toggled.isFilled;
    const newSquares = card.squares.map((row) =>
      row.map((sq) =>
        sq.id === squareId
          ? {
              ...sq,
              isFilled: nowFilled,
              isAutoFilled: false, // manual taps are not auto-fills
              filledAt: nowFilled ? Date.now() : null,
            }
          : sq,
      ),
    );
    const newCard: BingoCardType = { ...card, squares: newSquares };

    // Only a newly-filled square can complete a line.
    const winningLine = nowFilled ? checkForBingo(newCard) : null;

    if (winningLine) {
      // Single state owner: persist the winning card + result via setGame.
      setGame((prev) => ({
        ...prev,
        card: newCard,
        status: 'won',
        completedAt: Date.now(),
        winningLine,
        winningWord: toggled.word,
      }));
      onWin(); // navigation only — no game-state side effects here
    } else {
      setGame((prev) => ({ ...prev, card: newCard }));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-bold">🎯 Meeting Bingo</h2>
        <span
          className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold tabular-nums text-gray-700"
          aria-hidden
        >
          {filledCount}/24
        </span>
      </header>

      <BingoCard
        card={card}
        winningSquareIds={NO_WINNING_SQUARES}
        onSquareClick={handleSquareClick}
      />

      {/* One-away nudge naming the exact word(s) that would win (plan M4). */}
      <div className="min-h-[1.5rem] text-center text-sm font-medium">
        {oneAway && (
          <span className="text-blue-600">
            One away! Need: {oneAway.join(' or ')}
          </span>
        )}
      </div>

      <GameControls onNewCard={onNewCard} onQuit={onQuit} />

      {/* Polite live region — announces progress, one-away, and BINGO. */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>
    </main>
  );
}
