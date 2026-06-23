// src/components/BingoSquare.tsx
import { memo } from 'react';
import type { BingoSquare as BingoSquareType } from '../types';
import { cn } from '../lib/utils';

interface Props {
  square: BingoSquareType;
  isWinningSquare: boolean;
  onClick: () => void;
}

function BingoSquareComponent({ square, isWinningSquare, onClick }: Props) {
  const { word, isFilled, isAutoFilled, isFreeSpace } = square;

  const stateLabel = isFreeSpace
    ? 'free space'
    : isFilled
      ? 'filled'
      : 'empty';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFreeSpace}
      aria-pressed={isFilled}
      aria-label={`${word}, ${stateLabel}${isWinningSquare ? ', winning square' : ''}`}
      className={cn(
        'relative flex aspect-square items-center justify-center rounded-lg border-2 p-1 text-center',
        'text-[10px] font-medium leading-tight transition-all duration-200 sm:text-xs',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        !isFreeSpace && 'hover:scale-105 active:scale-95',
        // Default (empty)
        !isFilled && 'border-gray-200 bg-white text-gray-700 hover:border-blue-300',
        // Filled (manual)
        isFilled && !isFreeSpace && 'border-blue-600 bg-blue-500 text-white',
        // Free space — amber-800 on amber-100 clears 4.5:1 contrast (plan L4)
        isFreeSpace && 'cursor-default border-amber-300 bg-amber-100 text-amber-800',
        // One-shot bounce on auto-fill; self-terminates (plan M1)
        isAutoFilled && 'animate-bounce-in',
        // Winning square — green + ring, distinct from the blue filled state
        isWinningSquare && 'border-green-600 bg-green-500 text-white ring-2 ring-green-300',
      )}
    >
      {/* Non-color cue: a checkmark marks any filled (non-free) square (plan H9) */}
      {isFilled && !isFreeSpace && (
        <span aria-hidden className="absolute right-0.5 top-0.5 text-[9px] leading-none">
          ✓
        </span>
      )}
      <span className={cn('break-words', isFilled && !isFreeSpace && 'opacity-95')}>
        {word}
      </span>
    </button>
  );
}

// Memoized so interim speech-transcript updates (Phase 3) don't re-render all
// 25 squares — only squares whose props actually change repaint (plan M3).
export const BingoSquare = memo(BingoSquareComponent);
