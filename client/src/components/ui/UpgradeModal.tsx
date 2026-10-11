import { Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onContinue?: () => void;
  remaining_prompts: number;
  total_prompts: number;
}

interface PricingTier {
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  buttonLabel: string;
  isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'FREE',
    price: 0,
    currency: '₱',
    description: 'Basic LACVAY features',
    features: [
      'Basic transportation information',
      'Basic tourism information',
      'Limited access to routes and AI',
    ],
    buttonLabel: 'Current Plan',
  },
  {
    name: 'BASIC',
    price: 99,
    currency: '₱',
    description: 'Suitable for occasional users',
    features: [
      'Up to 3 saved/checked routes',
      '3 AI Assistant uses',
      'More transportation and tourism information',
    ],
    buttonLabel: 'Upgrade to Basic',
    isPopular: false,
  },
  {
    name: 'PREMIUM',
    price: 199,
    currency: '₱',
    description: 'Best for frequent commuters, travelers, and tourists',
    features: [
      'Unlimited routes',
      'Unlimited AI Assistant',
      'Full access to LACVAY features',
    ],
    buttonLabel: 'Upgrade to Premium',
    isPopular: true,
  },
];

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
      size="lg"
    >
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Limit Reached</h2>
          <p className="text-gray-600">You've used all your {total_prompts} prompts this week. Choose a plan to continue.</p>
        </div>

        {/* Usage Info */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Prompts Used</span>
            <span className="text-2xl font-bold text-lacvay-green">
              {total_prompts - remaining_prompts}/{total_prompts}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 mt-2">
            <div className="h-full w-full bg-lacvay-green" />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Your limit resets every Monday at 12:00 AM
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl overflow-hidden transition-all ${
                tier.isPopular
                  ? 'ring-2 ring-lacvay-green shadow-lg scale-105'
                  : 'border border-gray-200 shadow'
              } ${tier.name === 'FREE' ? 'bg-gray-50' : 'bg-white'}`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-lacvay-green to-blue-600 text-white text-center py-1 text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              
              <div className={`p-6 ${tier.isPopular ? 'pt-12' : ''}`}>
                {/* Tier Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.currency}{tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-sm text-gray-600 ml-2">per month</span>
                  )}
                </div>

                {/* Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (tier.name === 'FREE') {
                      onContinue?.();
                      onClose();
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition mb-6 ${
                    tier.isPopular
                      ? 'bg-gradient-to-r from-lacvay-green to-blue-600 hover:shadow-lg'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {tier.buttonLabel}
                </button>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-lacvay-green shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              onContinue?.();
              onClose();
            }}
            className="text-sm text-lacvay-green font-semibold hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </Modal>
  );
}
