import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppContext';

export function ToastHost() {
  const { toast } = useApp();
  if (!toast) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="toast-in pointer-events-none fixed bottom-20 left-1/2 z-[200] max-w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-lacvay-green px-4 py-3 text-center text-sm font-semibold text-white shadow-lg sm:bottom-8"
    >
      {toast}
    </div>,
    document.body,
  );
}
