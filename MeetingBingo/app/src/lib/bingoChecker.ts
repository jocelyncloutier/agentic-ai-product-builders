// src/lib/bingoChecker.ts

import type { BingoCard, BingoSquare, WinningLine } from '../types';

/** All 12 winning lines as ordered lists of squares (5 rows, 5 cols, 2 diagonals). */
function getLines(
  squares: BingoSquare[][],
): { type: WinningLine['type']; index: number; squares: BingoSquare[] }[] {
  const lines: {
    type: WinningLine['type'];
    index: number;
    squares: BingoSquare[];
  }[] = [];

  for (let row = 0; row < 5; row++) {
    lines.push({ type: 'row', index: row, squares: squares[row] });
  }
  for (let col = 0; col < 5; col++) {
    lines.push({
      type: 'column',
      index: col,
      squares: squares.map((r) => r[col]),
    });
  }
  lines.push({
    type: 'diagonal',
    index: 0,
    squares: [0, 1, 2, 3, 4].map((i) => squares[i][i]),
  });
  lines.push({
    type: 'diagonal',
    index: 1,
    squares: [0, 1, 2, 3, 4].map((i) => squares[i][4 - i]),
  });

  return lines;
}

/**
 * Return the first fully-filled line, or null. Free space counts toward a line.
 */
export function checkForBingo(card: BingoCard): WinningLine | null {
  for (const line of getLines(card.squares)) {
    if (line.squares.every((sq) => sq.isFilled)) {
      return {
        type: line.type,
        index: line.index,
        squares: line.squares.map((sq) => sq.id),
      };
    }
  }
  return null;
}

/**
 * Count filled NON-FREE squares (max 24). Free space is pre-filled and counts
 * toward lines only, never toward the X/24 progress number (plan L3).
 */
export function countFilled(card: BingoCard): number {
  return card.squares
    .flat()
    .filter((sq) => sq.isFilled && !sq.isFreeSpace).length;
}

/**
 * Find how close the card is to a bingo, for the "one away" hint.
 * Returns the minimum number of squares still needed on any single line
 * (1–4), plus the unfilled words across every line at that minimum level
 * (deduped, in line-scan order) — so a one-away state can name the exact
 * word(s) that would win, e.g. "Need: Scope Creep or MVP" (plan M4).
 * Returns null when there is no almost-complete line.
 */
export function getClosestToWin(
  card: BingoCard,
): { needed: number; words: string[] } | null {
  let minNeeded = 5;
  for (const line of getLines(card.squares)) {
    const needed = line.squares.filter((sq) => !sq.isFilled).length;
    if (needed > 0 && needed < minNeeded) minNeeded = needed;
  }
  if (minNeeded === 5) return null; // nothing partially filled

  const words: string[] = [];
  for (const line of getLines(card.squares)) {
    const unfilled = line.squares.filter((sq) => !sq.isFilled);
    if (unfilled.length === minNeeded) {
      for (const sq of unfilled) {
        if (!sq.isFreeSpace && !words.includes(sq.word)) words.push(sq.word);
      }
    }
  }

  return { needed: minNeeded, words };
}
