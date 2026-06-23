// src/lib/motion.ts

/**
 * True when the user has asked the OS/browser to minimize motion. JS animations
 * (confetti) must check this and skip; CSS animations are additionally damped by
 * the `prefers-reduced-motion` block in index.css (plan H10).
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
