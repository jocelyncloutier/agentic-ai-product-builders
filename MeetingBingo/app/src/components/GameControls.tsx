// src/components/GameControls.tsx
import { Button } from './ui/Button';

interface Props {
  micSupported: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  onNewCard: () => void;
  onQuit: () => void;
}

export function GameControls({
  micSupported,
  isListening,
  onToggleListening,
  onNewCard,
  onQuit,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {micSupported && (
        <Button
          variant={isListening ? 'secondary' : 'primary'}
          onClick={onToggleListening}
          aria-pressed={isListening}
        >
          {isListening ? '⏸ Stop listening' : '🎤 Start listening'}
        </Button>
      )}
      <Button variant="secondary" onClick={onNewCard}>
        🔄 New card
      </Button>
      <Button variant="ghost" onClick={onQuit}>
        Quit
      </Button>
    </div>
  );
}
