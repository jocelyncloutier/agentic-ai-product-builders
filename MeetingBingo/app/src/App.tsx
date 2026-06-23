import { useState } from 'react';
import type { CategoryId, GameState, Screen } from './types';
import { generateCard } from './lib/cardGenerator';
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

// No router — a single useState<Screen> drives the flow (plan §0):
// landing → category → preview → game → win
export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [game, setGame] = useState<GameState>(INITIAL_GAME);

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

  // Regenerate on the preview screen — new card, timer still not started.
  function handleRegenerate() {
    setGame((prev) =>
      prev.category
        ? { ...prev, card: generateCard(prev.category) }
        : prev,
    );
  }

  // Start pressed → NOW the timer starts.
  function handleStart() {
    setGame((prev) => ({
      ...prev,
      status: 'playing',
      startedAt: Date.now(),
    }));
    setScreen('game');
  }

  // Fresh card mid-game (same pack) — counts as a new game, so the timer resets.
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
