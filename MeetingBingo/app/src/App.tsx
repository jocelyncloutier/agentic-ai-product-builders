import { useEffect, useState } from 'react';
import type { CategoryId, GameState, Screen } from './types';
import { generateCard } from './lib/cardGenerator';
import { track } from './lib/analytics';
import { readJSON, removeKey, writeJSON } from './hooks/useLocalStorage';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { PreviewScreen } from './components/PreviewScreen';
import { GameBoard } from './components/GameBoard';
import { WinScreen } from './components/WinScreen';

const INITIAL_GAME: GameState = {
  status: 'idle',
  category: null,
  card: null,
  isListening: false,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
};

// We persist ONLY an in-progress game (preview/game screens) so a mid-meeting
// refresh doesn't lose the card. No multi-game history (plan §0/M2).
const PERSIST_KEY = 'meeting-bingo:v1';
type Snapshot = { screen: Screen; game: GameState };

function loadSnapshot(): Snapshot | null {
  const saved = readJSON<Snapshot | null>(PERSIST_KEY, null);
  if (!saved || !saved.game?.card) return null;
  if (saved.screen !== 'game' && saved.screen !== 'preview') return null;
  // Mic can't auto-resume without a user gesture — force it off (plan M2).
  // filledCount isn't stored (it's derived from squares), so nothing to recompute.
  return { screen: saved.screen, game: { ...saved.game, isListening: false } };
}

// No router — a single useState<Screen> drives the flow (plan §0):
// landing → category → preview → game → win
export default function App() {
  const restored = loadSnapshot();
  const [screen, setScreen] = useState<Screen>(restored?.screen ?? 'landing');
  const [game, setGame] = useState<GameState>(restored?.game ?? INITIAL_GAME);

  // Persist in-progress games; clear the key otherwise.
  useEffect(() => {
    if ((screen === 'game' || screen === 'preview') && game.card) {
      writeJSON(PERSIST_KEY, { screen, game: { ...game, isListening: false } });
    } else {
      removeKey(PERSIST_KEY);
    }
  }, [screen, game]);

  // Category chosen → generate a card and go to preview. Timer does NOT start
  // here; startedAt stays null until the user presses Start (plan H1).
  function handleCategorySelect(category: CategoryId) {
    setGame({
      ...INITIAL_GAME,
      status: 'setup',
      category,
      card: generateCard(category),
    });
    setScreen('preview');
  }

  function handleRegenerate() {
    setGame((prev) =>
      prev.category ? { ...prev, card: generateCard(prev.category) } : prev,
    );
  }

  // Start pressed → NOW the timer starts.
  function handleStart() {
    setGame((prev) => ({ ...prev, status: 'playing', startedAt: Date.now() }));
    if (game.category) track('game_start', { category: game.category });
    setScreen('game');
  }

  // Fresh card mid-game (same pack) — a new game, so the timer resets.
  function handleNewCard() {
    setGame((prev) =>
      prev.category
        ? {
            ...prev,
            card: generateCard(prev.category),
            status: 'playing',
            startedAt: Date.now(),
            completedAt: null,
            winningLine: null,
            winningWord: null,
          }
        : prev,
    );
    if (game.category) track('game_start', { category: game.category });
  }

  function handlePlayAgain() {
    if (game.category) handleCategorySelect(game.category);
    else setScreen('category');
  }

  function handleHome() {
    setGame(INITIAL_GAME);
    setScreen('landing');
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {screen === 'landing' && (
        <LandingPage onStart={() => setScreen('category')} />
      )}

      {screen === 'category' && (
        <CategorySelect
          onSelect={handleCategorySelect}
          onBack={() => setScreen('landing')}
        />
      )}

      {screen === 'preview' && game.card && game.category && (
        <PreviewScreen
          category={game.category}
          card={game.card}
          onRegenerate={handleRegenerate}
          onStart={handleStart}
          onBack={() => setScreen('category')}
        />
      )}

      {screen === 'game' && game.card && (
        <GameBoard
          game={game}
          setGame={setGame}
          onWin={() => setScreen('win')}
          onNewCard={handleNewCard}
          onQuit={handleHome}
        />
      )}

      {screen === 'win' && (
        <WinScreen
          game={game}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
