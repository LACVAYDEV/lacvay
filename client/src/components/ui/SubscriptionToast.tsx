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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Toast Content */}
      <div className="relative max-w-6xl w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 sm:p-2 text-white hover:bg-white/20 rounded-lg transition"
          aria-label="Close subscription toast"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 text-center pt-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">Choose Your Plan</h2>
          <p className="text-blue-100 text-xs sm:text-sm md:text-lg">
            Select the perfect plan for your LACVAY experience
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {PRICING_TIERS.map((tier, index) => (
            <div
              key={index}
              className={cn(
                'relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 transition-transform hover:scale-105',
                tier.isPopular
                  ? 'bg-gradient-to-br from-white to-blue-50 ring-2 ring-orange-500 shadow-xl'
                  : 'bg-white shadow-lg'
              )}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-0.5 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                  Most Popular
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">
                {tier.name}
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{tier.description}</p>

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
                  {tier.currency}
                  {tier.price}
                </span>
                {tier.price > 0 && (
                  <span className="text-gray-600 ml-1 sm:ml-2 text-xs sm:text-sm md:text-lg">/month</span>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {tier.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm md:text-sm text-gray-700"
                  >
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className={cn(
                  'w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold transition text-sm sm:text-base md:text-lg',
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
        <div className="text-center text-white/90 text-xs sm:text-sm">
          <p className="line-clamp-3">
            All plans include 24/7 customer support. No credit card required to get started.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
