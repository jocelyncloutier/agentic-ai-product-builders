// src/lib/wordDetector.ts
//
// Buzzword detection tuned to clear the US-2.3 >70% accuracy bar without the
// false-positive risk of full stemming. Strategy:
//   - phrases ("circle back") → substring match
//   - single words ("sprint") → \b word-boundary match
//   - plurals/tenses → strip trailing s/es/ed/ing from the TRANSCRIPT tokens
//     and match again ("sprints"→sprint, "blocked"→block, "APIs"→api) [H2]
//   - WORD_ALIASES → known synonyms ("continuous integration" → CI/CD)
// Per-word matchers are compiled ONCE per card via createCardDetector [M3].

/** Common synonyms/spoken variants → still count as the canonical card word. */
export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration', 'continuous delivery'],
  mvp: ['minimum viable product', 'm.v.p.'],
  roi: ['return on investment', 'r.o.i.'],
  api: ['a.p.i.'],
  devops: ['dev ops', 'dev-ops'],
  'a/b test': ['ab test', 'a b test', 'split test'],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // Hyphens/dashes → space. Speech transcripts render hyphenated words with
    // spaces ("low-hanging fruit" → "low hanging fruit", "win-win" → "win win"),
    // so normalize BOTH the card word and the transcript to match.
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip ONE trailing inflection from a token. Length guards avoid mangling
 * short words ("is", "ed", "sing"). Conservative by design (no full stemmer).
 */
function stemToken(token: string): string {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss'))
    return token.slice(0, -1);
  return token;
}

/** Build a parallel "stemmed" transcript so inflected words match their base. */
function stemTranscript(normalized: string): string {
  return normalized.split(/\s+/).map(stemToken).join(' ');
}

interface CompiledWord {
  word: string; // canonical card word (returned on match)
  key: string; // lowercased, for alreadyFilled lookups
  isPhrase: boolean;
  phrase: string; // normalized phrase (for substring match)
  regex: RegExp | null; // \bword\b for single words
  aliases: string[]; // normalized alias substrings
}

function compileWord(word: string): CompiledWord {
  const norm = normalizeText(word);
  const isPhrase = norm.includes(' ');
  return {
    word,
    key: word.toLowerCase(),
    isPhrase,
    phrase: norm,
    // No 'g' flag → .test() is stateless and reusable across chunks.
    regex: isPhrase ? null : new RegExp(`\\b${escapeRegex(norm)}\\b`, 'i'),
    // Normalize alias strings the same way so e.g. "dev-ops" → "dev ops" too.
    aliases: (WORD_ALIASES[norm] ?? []).map((a) => normalizeText(a)),
  };
}

export interface CardDetector {
  detect(transcript: string, alreadyFilled: Set<string>): string[];
}

/**
 * Compile a detector for a fixed set of card words. Regexes are built once
 * here, not per transcript chunk (plan M3). Reuse the returned detector for
 * the life of the card.
 */
export function createCardDetector(cardWords: string[]): CardDetector {
  const compiled = cardWords.map(compileWord);

  return {
    detect(transcript: string, alreadyFilled: Set<string>): string[] {
      const normalized = normalizeText(transcript);
      const stemmed = stemTranscript(normalized); // built once per chunk
      const detected: string[] = [];

      for (const cw of compiled) {
        if (alreadyFilled.has(cw.key)) continue;

        let hit = false;
        if (cw.isPhrase) {
          hit = normalized.includes(cw.phrase);
        } else if (cw.regex) {
          // Match exact OR inflected (via the stemmed transcript).
          hit = cw.regex.test(normalized) || cw.regex.test(stemmed);
        }

        if (!hit && cw.aliases.length) {
          hit = cw.aliases.some((alias) => normalized.includes(alias));
        }

        if (hit) detected.push(cw.word);
      }

      return detected;
    },
  };
}

/**
 * Stateless exact detector (no aliases, no stemming). Kept for completeness /
 * tests; the app uses createCardDetector for the full, perf-friendly matcher.
 */
export function detectWords(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const normalized = normalizeText(transcript);
  const detected: string[] = [];
  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    const norm = normalizeText(word);
    const hit = norm.includes(' ')
      ? normalized.includes(norm)
      : new RegExp(`\\b${escapeRegex(norm)}\\b`, 'i').test(normalized);
    if (hit) detected.push(word);
  }
  return detected;
}

/** Full detector (aliases + plural/tense strip). Convenience wrapper. */
export function detectWordsWithAliases(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  return createCardDetector(cardWords).detect(transcript, alreadyFilled);
}
