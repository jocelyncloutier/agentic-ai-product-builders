// src/components/BingoCard.tsx
import type { BingoCard as BingoCardType } from '../types';
import { BingoSquare } from './BingoSquare';

interface Props {
  card: BingoCardType;
  winningSquareIds: Set<string>;
  onSquareClick?: (squareId: string) => void;
  /** Preview mode renders the card but ignores clicks (plan H1 preview screen). */
  interactive?: boolean;
}

// 5x5 grid. Mobile-first: aspect-square cells + fluid text so the card stays
// legible beside a video call / in split-screen (plan M6).
export function BingoCard({
  card,
  winningSquareIds,
  onSquareClick,
  interactive = true,
}: Props) {
  return (
    <div className="grid w-full grid-cols-5 gap-1.5 sm:gap-2">
      {card.squares.flat().map((square) => (
        <BingoSquare
          key={square.id}
          square={square}
          isWinningSquare={winningSquareIds.has(square.id)}
          onClick={() => {
            if (interactive) onSquareClick?.(square.id);
          }}
        />
      ))}
    </div>
  );
}
