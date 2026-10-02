import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onContinue?: () => void;
  remaining_prompts: number;
  total_prompts: number;
}

export function UpgradeModal({
  open,
  onClose,
  onContinue,
  remaining_prompts,
  total_prompts,
}: UpgradeModalProps) {
  return (
    <Modal 
      open={open} 
      onClose={onClose}
      role="alertdialog"
      size="md"
    >
      <div className="space-y-5 p-6">
        {/* Header with icon */}
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-lacvay-green/10 p-3 text-lacvay-green">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Weekly Limit Reached</h2>
            <p className="text-sm text-gray-500">You've used all your prompts this week</p>
          </div>
        </div>

        {/* Usage Info */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Prompts Used</span>
            <span className="text-2xl font-bold text-lacvay-green">
              {total_prompts - remaining_prompts}/{total_prompts}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-full bg-lacvay-green" />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Your limit resets every Monday at 12:00 AM
          </p>
        </div>

        {/* Upgrade Benefits */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Premium Benefits:</h3>
          <ul className="space-y-2">
            {[
              'Unlimited AI prompts',
              'Priority support',
              'Advanced features',
              'Early access to new features',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lacvay-green/10">
                  <span className="text-xs font-bold text-lacvay-green">✓</span>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button className="w-full bg-lacvay-green hover:bg-lacvay-green-dark">
            <Zap className="h-4 w-4" />
            Upgrade to Premium
          </Button>
          <button
            type="button"
            onClick={() => {
              onContinue?.();
              onClose();
            }}
            className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Continue without upgrading
          </button>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-500">
          You can still use all features.{' '}
          <span className="font-medium text-lacvay-green">Upgrade anytime to unlock unlimited prompts.</span>
        </p>
      </div>
    </Modal>
  );
}
