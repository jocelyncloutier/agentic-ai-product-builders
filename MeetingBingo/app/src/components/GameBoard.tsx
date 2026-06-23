// src/components/GameBoard.tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import type { BingoCard as BingoCardType, GameState } from '../types';
import { BingoCard } from './BingoCard';
import { GameControls } from './GameControls';
import { TranscriptPanel } from './TranscriptPanel';
import { checkForBingo, countFilled, getClosestToWin } from '../lib/bingoChecker';
import { createCardDetector } from '../lib/wordDetector';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
 * stored. Speech detection runs on FINAL chunks only and auto-fills matches.
 */
export function GameBoard({ game, setGame, onWin, onNewCard, onQuit }: Props) {
  const card = game.card!; // GameBoard only renders when a card exists

  const speech = useSpeechRecognition();
  const [detectedWords, setDetectedWords] = useState<string[]>([]);

  // Derived — never stored on GameState.
  const filledCount = useMemo(() => countFilled(card), [card]);
  const closest = useMemo(() => getClosestToWin(card), [card]);
  const oneAway = closest?.needed === 1 ? closest.words : null;

  // Detector regexes compiled ONCE per card (plan M3); card.words only changes
  // when a new card is generated.
  const detector = useMemo(() => createCardDetector(card.words), [card.words]);

  // Refs so the (stable) speech callback always reads the LATEST card/detector
  // instead of a stale closure captured at start() time.
  const gameRef = useRef(game);
  gameRef.current = game;
  const detectorRef = useRef(detector);
  detectorRef.current = detector;

  const announcement = oneAway
    ? `One away. Need ${oneAway.join(' or ')}.`
    : `${filledCount} of 24 squares filled.`;

  // Apply a fill (manual or auto) and handle win routing. Single state owner.
  const applyFill = useCallback(
    (current: BingoCardType, matchedIds: Set<string>, auto: boolean, winWordHint?: string) => {
      const newSquares = current.squares.map((row) =>
        row.map((sq) =>
          matchedIds.has(sq.id) && !sq.isFilled && !sq.isFreeSpace
            ? { ...sq, isFilled: true, isAutoFilled: auto, filledAt: Date.now() }
            : sq,
        ),
      );
      const newCard: BingoCardType = { ...current, squares: newSquares };
      const winningLine = checkForBingo(newCard);

      if (winningLine) {
        const onLine = winningLine.squares
          .map((id) => newCard.squares.flat().find((s) => s.id === id))
          .find((s) => s && !s.isFreeSpace && matchedIds.has(s.id));
        const winningWord = winWordHint ?? onLine?.word ?? null;
        setGame((prev) => ({
          ...prev,
          card: newCard,
          status: 'won',
          completedAt: Date.now(),
          winningLine,
          winningWord,
        }));
        onWin();
      } else {
        setGame((prev) => ({ ...prev, card: newCard }));
      }
    },
    [setGame, onWin],
  );

  // Manual tap toggles a single square.
  function handleSquareClick(squareId: string) {
    const toggled = card.squares.flat().find((sq) => sq.id === squareId);
    if (!toggled || toggled.isFreeSpace) return;

    if (toggled.isFilled) {
      // Unfill — never completes a line, so no win check needed.
      const newSquares = card.squares.map((row) =>
        row.map((sq) =>
          sq.id === squareId
            ? { ...sq, isFilled: false, isAutoFilled: false, filledAt: null }
            : sq,
        ),
      );
      setGame((prev) => ({ ...prev, card: { ...card, squares: newSquares } }));
    } else {
      applyFill(card, new Set([squareId]), false, toggled.word);
    }
  }

  // Final speech chunk → detect → auto-fill. Stable callback; reads refs.
  const handleFinalChunk = useCallback(
    (chunk: string) => {
      const current = gameRef.current.card;
      if (!current) return;

      const alreadyFilled = new Set(
        current.squares.flat().filter((s) => s.isFilled).map((s) => s.word.toLowerCase()),
      );
      const detected = detectorRef.current.detect(chunk, alreadyFilled);
      if (detected.length === 0) return;

      setDetectedWords((prev) => [...prev, ...detected].slice(-5));

      const detectedKeys = new Set(detected.map((w) => w.toLowerCase()));
      const matchedIds = new Set(
        current.squares
          .flat()
          .filter((s) => !s.isFilled && detectedKeys.has(s.word.toLowerCase()))
          .map((s) => s.id),
      );
      if (matchedIds.size === 0) return;

      applyFill(current, matchedIds, true);
    },
    [applyFill],
  );

  function handleToggleListening() {
    if (speech.isListening) {
      speech.stop();
      setGame((prev) => ({ ...prev, isListening: false }));
    } else {
      speech.start(handleFinalChunk);
      setGame((prev) => ({ ...prev, isListening: true }));
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

      <TranscriptPanel
        isSupported={speech.isSupported}
        isListening={speech.isListening}
        transcript={speech.transcript}
        interimTranscript={speech.interimTranscript}
        detectedWords={detectedWords}
        error={speech.error}
      />

      <GameControls
        micSupported={speech.isSupported}
        isListening={speech.isListening}
        onToggleListening={handleToggleListening}
        onNewCard={onNewCard}
        onQuit={onQuit}
      />

      {/* Polite live region — announces progress, one-away, and detections. */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>
    </main>
  );
}
