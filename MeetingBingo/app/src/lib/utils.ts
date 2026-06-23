// src/lib/utils.ts

/**
 * Tiny className combiner — filters out falsy values and joins with a space.
 * Deliberately avoids pulling in clsx/tailwind-merge for the MVP (plan §3.1).
 * Upgrade later if Tailwind class conflicts start to bite.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
