// src/lib/shareUtils.ts

export interface ShareStats {
  categoryName: string;
  startedAt: number | null;
  completedAt: number | null;
  winningWord: string | null;
  filledCount: number;
}

export type ShareOutcome = 'shared' | 'copied' | 'failed';

/** Whole minutes of play (min 1, so a fast win doesn't read "0 min"). */
function minutesPlayed(startedAt: number | null, completedAt: number | null): number {
  if (!startedAt || !completedAt) return 0;
  return Math.max(1, Math.round((completedAt - startedAt) / 60000));
}

/** App URL from the current origin — never a hardcoded constant (plan L2). */
function appUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/** Paste-ready summary block (plan §4 format). */
export function buildShareText(stats: ShareStats): string {
  const minutes = minutesPlayed(stats.startedAt, stats.completedAt);
  return [
    '🎯 I got BINGO on Meeting Bingo!',
    `${stats.categoryName} · ${minutes} min · winning word: "${stats.winningWord ?? '—'}"`,
    `${stats.filledCount}/24 squares`,
    `Play → ${appUrl()}`,
  ].join('\n');
}

/**
 * Share the result. Mobile → Web Share if available; otherwise copy to the
 * clipboard. Returns the outcome so the caller can toast appropriately.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ text });
      return 'shared';
    }
  } catch (err) {
    // User cancelling the native sheet throws AbortError — treat as a no-op,
    // don't fall through to clipboard.
    if (err instanceof DOMException && err.name === 'AbortError') return 'failed';
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    /* fall through */
  }
  return 'failed';
}
