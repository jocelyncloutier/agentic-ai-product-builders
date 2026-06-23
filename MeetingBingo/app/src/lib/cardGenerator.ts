// src/lib/cardGenerator.ts

import type { BingoCard, BingoSquare, CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';

export const FREE_SPACE_LABEL = 'FREE SPACE';

/** Fisher-Yates shuffle (non-mutating). */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a unique 5x5 bingo card for a category.
 * Center square (2,2) is a pre-filled FREE SPACE.
 */
export function generateCard(categoryId: CategoryId): BingoCard {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Unknown category: ${categoryId}`);

  // Dev assertion (plan L1): each pack must have ≥24 unique words so the 24
  // non-free slots fill without blanks. Guards against a silent regression.
  if (import.meta.env?.DEV) {
    const uniqueCount = new Set(
      category.words.map((w) => w.toLowerCase()),
    ).size;
    if (uniqueCount < 24) {
      throw new Error(
        `Category "${categoryId}" has only ${uniqueCount} unique words; need ≥24.`,
      );
    }
  }

  const selectedWords = shuffle(category.words).slice(0, 24);

  const squares: BingoSquare[][] = [];
  let wordIndex = 0;

  for (let row = 0; row < 5; row++) {
    const rowSquares: BingoSquare[] = [];
    for (let col = 0; col < 5; col++) {
      const isFreeSpace = row === 2 && col === 2;
      rowSquares.push({
        id: `${row}-${col}`,
        word: isFreeSpace ? FREE_SPACE_LABEL : selectedWords[wordIndex++],
        isFilled: isFreeSpace, // free space starts filled
        isAutoFilled: false,
        isFreeSpace,
        filledAt: isFreeSpace ? Date.now() : null,
        row,
        col,
      });
    }
    squares.push(rowSquares);
  }

  return {
    squares,
    words: selectedWords, // flat list (non-free) for word detection
  };
}
