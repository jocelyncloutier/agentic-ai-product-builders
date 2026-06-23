// src/types/index.ts
// Core type definitions for Meeting Bingo (Architecture "Core Type Definitions").
// NOTE: `filledCount` is intentionally NOT stored on GameState — it is derived
// from the squares via countFilled() to keep a single source of truth (plan H5).

// =============================================
// SCREENS (no router — useState<Screen> machine in App.tsx)
// =============================================
export type Screen = 'landing' | 'category' | 'preview' | 'game' | 'win';

// =============================================
// CATEGORY & WORDS
// =============================================
export type CategoryId = 'agile' | 'corporate' | 'tech';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  words: string[];
}

// =============================================
// BINGO CARD
// =============================================
export interface BingoSquare {
  id: string; // Unique ID: "row-col" e.g., "2-3"
  word: string;
  isFilled: boolean;
  isAutoFilled: boolean; // Filled by speech recognition
  isFreeSpace: boolean;
  filledAt: number | null; // Timestamp
  row: number;
  col: number;
}

export interface BingoCard {
  squares: BingoSquare[][]; // 5x5 grid
  words: string[]; // Flat list for detection
}

// =============================================
// GAME STATE
// =============================================
export type GameStatus = 'idle' | 'setup' | 'playing' | 'won';

export interface WinningLine {
  type: 'row' | 'column' | 'diagonal';
  index: number; // 0-4 for row/col, 0-1 for diagonal
  squares: string[]; // IDs of winning squares
}

export interface GameState {
  status: GameStatus;
  category: CategoryId | null;
  card: BingoCard | null;
  isListening: boolean;
  startedAt: number | null;
  completedAt: number | null;
  winningLine: WinningLine | null;
  winningWord: string | null;
  // filledCount removed — derive via countFilled(card) (plan H5).
}

// =============================================
// SPEECH RECOGNITION
// =============================================
export interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// =============================================
// UI STATE
// =============================================
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  duration?: number;
}
