import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

interface SubscriptionToastProps {
  open: boolean;
  onClose: () => void;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'FREE',
    price: 0,
    currency: '₱',
    description: 'For basic users',
    features: [
      'Basic LACVAY features',
      'Basic transportation information',
      'Basic tourism information',
      'Limited access to routes and AI',
    ],
    buttonText: 'Current Plan',
  },
  {
    name: 'BASIC',
    price: 99,
    currency: '₱',
    description: 'For occasional users',
    features: [
      'Up to 3 saved/checked routes',
      '3 AI Assistant uses',
      'More transportation and tourism information',
      'Suitable for occasional users',
    ],
    buttonText: 'Get Basic',
    isPopular: true,
  },
  {
    name: 'PREMIUM',
    price: 199,
    currency: '₱',
    description: 'For frequent travelers',
    features: [
      'Unlimited routes',
      'Unlimited AI Assistant',
      'Full access to LACVAY features',
      'Best for frequent commuters, travelers, and tourists',
    ],
    buttonText: 'Get Premium',
  },
];

export function SubscriptionToast({ open, onClose }: SubscriptionToastProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Toast Content */}
      <div className="relative max-w-6xl w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition"
          aria-label="Close subscription toast"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-2">Choose Your Plan</h2>
          <p className="text-blue-100 text-lg">
            Select the perfect plan for your LACVAY experience
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PRICING_TIERS.map((tier, index) => (
            <div
              key={index}
              className={cn(
                'relative rounded-2xl p-6 transition-transform hover:scale-105',
                tier.isPopular
                  ? 'bg-gradient-to-br from-white to-blue-50 ring-2 ring-orange-500 shadow-xl'
                  : 'bg-white shadow-lg'
              )}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {tier.name}
              </h3>
              <p className="text-gray-500 text-sm mb-4">{tier.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  {tier.currency}
                  {tier.price}
                </span>
                {tier.price > 0 && (
                  <span className="text-gray-600 ml-2 text-lg">/month</span>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className={cn(
                  'w-full py-3 rounded-xl font-bold transition text-lg',
                  tier.isPopular
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:from-orange-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700'
                )}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-center text-white/90 text-sm">
          <p>
            All plans include 24/7 customer support. No credit card required to get started.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
