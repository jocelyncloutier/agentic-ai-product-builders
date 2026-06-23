// src/lib/analytics.ts
//
// Minimal LOCAL event capture so PRD success metrics are measurable (plan H6).
// MVP scope: console + a capped in-memory/localStorage buffer. No external
// vendor, no PII, no transcript content — only game events + buzzword counts.

export type AnalyticsEvent =
  | 'game_start'
  | 'auto_fill'
  | 'win'
  | 'share_click';

interface CapturedEvent {
  event: AnalyticsEvent;
  props: Record<string, string | number | boolean>;
  at: number;
}

const STORAGE_KEY = 'meeting-bingo:events';
const MAX_EVENTS = 200;
const buffer: CapturedEvent[] = [];

/**
 * Record an event. Centralized single entry point. Never throws — analytics
 * failures must not break gameplay.
 */
export function track(
  event: AnalyticsEvent,
  props: Record<string, string | number | boolean> = {},
): void {
  try {
    const entry: CapturedEvent = { event, props, at: Date.now() };
    buffer.push(entry);
    if (buffer.length > MAX_EVENTS) buffer.shift();

    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event, props);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
    }
  } catch {
    /* swallow — analytics is best-effort */
  }
}

/** Read back captured events (e.g. for a future metrics view / debugging). */
export function getCapturedEvents(): CapturedEvent[] {
  return [...buffer];
}
