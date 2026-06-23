// src/components/GameControls.tsx
import { Button } from './ui/Button';

interface Props {
  onNewCard: () => void;
  onQuit: () => void;
  // The listening (mic) toggle is added in Phase 3 (NEU-15/NEU-16).
}

export function GameControls({ onNewCard, onQuit }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="secondary" onClick={onNewCard}>
        🔄 New card
      </Button>
      <Button variant="ghost" onClick={onQuit}>
        Quit
      </Button>
    </div>
  );
}
