import { CATEGORIES } from './data/categories';
import { cn } from './lib/utils';

// Phase 1 placeholder: proves Tailwind, types, data, and the cn() helper are
// wired up. The real screen-state machine (landing → category → preview →
// game → win) lands in Phase 2 (NEU-8).
export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 bg-gray-50 text-gray-900">
      <div className="text-center animate-bounce-in">
        <h1 className="text-4xl font-bold tracking-tight">🎯 Meeting Bingo</h1>
        <p className="mt-2 text-gray-500">
          Foundation ready — Tailwind, types, and data are wired.
        </p>
      </div>

      <ul className="grid w-full max-w-md gap-3">
        {CATEGORIES.map((category) => (
          <li
            key={category.id}
            className={cn(
              'rounded-xl border-2 border-gray-200 bg-white p-4',
              'transition-colors hover:border-blue-300',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
