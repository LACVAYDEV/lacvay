import { X, AlertCircle, Zap } from 'lucide-react';
import { useState } from 'react';

interface PromptLimitBannerProps {
  remainingPrompts: number;
  totalPrompts: number;
}

export function PromptLimitBanner({ remainingPrompts, totalPrompts }: PromptLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || remainingPrompts === totalPrompts) {
    return null;
  }

  const usedPrompts = totalPrompts - remainingPrompts;
  const percentageUsed = (usedPrompts / totalPrompts) * 100;

  return (
    <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-amber-900">
              {remainingPrompts === 0
                ? '🎯 Prompt Limit Reached'
                : `⚡ ${remainingPrompts} Prompt${remainingPrompts === 1 ? '' : 's'} Remaining This Week`}
            </h3>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-800">
                {usedPrompts} of {totalPrompts} used
              </span>
              <span className="text-xs text-amber-700">{Math.round(percentageUsed)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-200">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-amber-800 mb-3">
            {remainingPrompts === 0 ? (
              <>
                You've reached your free tier limit. Upgrade to Premium for unlimited AI prompts.
              </>
            ) : (
              <>
                You have <span className="font-semibold">{remainingPrompts} free prompt{remainingPrompts === 1 ? '' : 's'}</span> left this
                week. <span className="font-semibold text-amber-900">Upgrade to Premium</span> for unlimited access.
              </>
            )}
          </p>

          {/* CTA Button */}
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-md hover:from-amber-700 hover:to-orange-700"
              onClick={(e) => {
                e.preventDefault();
                // This will be triggered by parent component
                const event = new CustomEvent('show-subscription-toast');
                window.dispatchEvent(event);
              }}
            >
              <Zap className="h-4 w-4" />
              View Plans
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-50"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition"
          aria-label="Dismiss banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
