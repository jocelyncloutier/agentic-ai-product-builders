// src/components/PreviewScreen.tsx
import type { BingoCard as BingoCardType, CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';
import { BingoCard } from './BingoCard';
import { Button } from './ui/Button';

interface Props {
  category: CategoryId;
  card: BingoCardType;
  onRegenerate: () => void;
  onStart: () => void;
  onBack: () => void;
}

const EMPTY = new Set<string>();

/**
 * Ready screen shown after category select. The user can regenerate the card
 * before committing. The game timer does NOT start here — `startedAt` is only
 * set when the user presses Start, so time-to-bingo reflects meeting time, not
 * setup time (plan H1).
 */
export function PreviewScreen({
  category,
  card,
  onRegenerate,
  onStart,
  onBack,
}: Props) {
  const categoryName =
    CATEGORIES.find((c) => c.id === category)?.name ?? category;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Your card is ready</h2>
        <p className="mt-1 text-sm text-gray-500">
          {categoryName} · the timer starts when you hit Start.
        </p>
      </div>

      {/* Non-interactive preview of the real card. */}
      <BingoCard card={card} winningSquareIds={EMPTY} interactive={false} />

      <div className="flex flex-col gap-2">
        <Button onClick={onStart} className="py-3 text-base">
          Start Game
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onRegenerate}>
            🔄 Regenerate
          </Button>
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
        </div>
      </div>
    </main>
  );
}
