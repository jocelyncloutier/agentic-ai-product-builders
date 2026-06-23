// src/components/CategorySelect.tsx
import type { CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface Props {
  onSelect: (categoryId: CategoryId) => void;
  onBack: () => void;
}

// 3 preset packs, each previewing 3 sample words (US-1.2). No custom pack (§0).
export function CategorySelect({ onSelect, onBack }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Pick a buzzword pack</h2>
        <p className="mt-2 text-gray-500">Choose the meeting you're stuck in.</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((category) => (
          <li key={category.id}>
            <button
              onClick={() => onSelect(category.id)}
              className={cn(
                'flex h-full w-full flex-col gap-3 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left',
                'transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              )}
            >
              <span className="text-3xl">{category.icon}</span>
              <span className="font-semibold">{category.name}</span>
              <span className="text-sm text-gray-500">{category.description}</span>
              <span className="mt-auto flex flex-wrap gap-1 pt-2">
                {category.words.slice(0, 3).map((word) => (
                  <span
                    key={word}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {word}
                  </span>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="text-center">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </main>
  );
}
