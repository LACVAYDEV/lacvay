import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

type ConfirmDialogVariant = 'default' | 'warning' | 'danger';

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
}

interface PendingConfirmation {
  options: ConfirmDialogOptions;
  resolve: (confirmed: boolean) => void;
}

const ConfirmDialogContext = createContext<
  ((options: ConfirmDialogOptions) => Promise<boolean>) | null
>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const pendingRef = useRef<PendingConfirmation | null>(null);
  const descriptionId = useId();

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current?.resolve(false);
      const next = { options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const finish = useCallback((confirmed: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    pendingRef.current = null;
    setPending(null);
    current.resolve(confirmed);
  }, []);

  useEffect(() => {
    return () => {
      pendingRef.current?.resolve(false);
      pendingRef.current = null;
    };
  }, []);

  const options = pending?.options;
  const variant = options?.variant ?? 'danger';
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const Icon = variant === 'default' ? HelpCircle : AlertTriangle;

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(options)}
        onClose={() => finish(false)}
        title={options?.title}
        size="md"
        role="alertdialog"
        descriptionId={descriptionId}
        className="max-w-md"
      >
        {options && (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  isDanger && 'bg-red-100 text-red-600',
                  isWarning && 'bg-amber-100 text-amber-700',
                  variant === 'default' && 'bg-lacvay-green/10 text-lacvay-green',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p id={descriptionId} className="pt-1 text-sm leading-6 text-gray-600">
                {options.description}
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => finish(false)}>
                {options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                type="button"
                variant={isDanger ? 'danger' : 'primary'}
                className={cn(
                  isDanger && 'border-red-600 bg-red-600 text-white hover:bg-red-700',
                  isWarning && 'bg-amber-500 text-gray-950 hover:bg-amber-600',
                )}
                onClick={() => finish(true)}
              >
                {options.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider.');
  }
  return context;
}
