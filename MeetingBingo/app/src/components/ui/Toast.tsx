// src/components/ui/Toast.tsx

interface Props {
  message: string;
}

/** Minimal bottom-center toast. Render conditionally from the parent. */
export function Toast({ message }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
