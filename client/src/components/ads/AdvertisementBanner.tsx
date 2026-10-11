import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ad {
  id: number;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  bgGradient: string;
}

const dummyAds: Ad[] = [
  {
    id: 1,
    title: 'Explore Tourist Spots',
    description: 'Discover the best attractions in Batangas City',
    image: '🏔️',
    ctaText: 'Explore Now',
    bgGradient: 'from-blue-600 to-blue-800',
  },
  {
    id: 2,
    title: 'Book Your Ride',
    description: 'Easy and affordable transportation options',
    image: '🚐',
    ctaText: 'Book Ride',
    bgGradient: 'from-teal-600 to-teal-800',
  },
  {
    id: 3,
    title: 'Discover Restaurants',
    description: 'Best dining experiences in the city',
    image: '🍽️',
    ctaText: 'View Restaurants',
    bgGradient: 'from-emerald-600 to-emerald-800',
  },
];

export const AD_BANNER_DISMISSED_KEY = 'lacvay-ad-banner-dismissed';

export function isAdBannerDismissed(): boolean {
  try {
    return localStorage.getItem(AD_BANNER_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissAdBanner(): void {
  try {
    localStorage.setItem(AD_BANNER_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

interface AdvertisementBannerProps {
  onClose?: () => void;
}

export function AdvertisementBanner({ onClose }: AdvertisementBannerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % dummyAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    dismissAdBanner();
    setIsVisible(false);
    onClose?.();
  };

  const handlePrevious = () => {
    setCurrentAdIndex((prev) => (prev - 1 + dummyAds.length) % dummyAds.length);
  };

  const handleNext = () => {
    setCurrentAdIndex((prev) => (prev + 1) % dummyAds.length);
  };

  if (!isVisible) return null;

  const currentAd = dummyAds[currentAdIndex];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-gradient-to-r transition-all duration-300 shadow-card',
        `bg-gradient-to-r ${currentAd.bgGradient}`,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Left navigation */}
        <button
          onClick={handlePrevious}
          className="flex-shrink-0 rounded-full p-2 text-white hover:bg-white/20 transition lg:order-1"
          aria-label="Previous ad"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Center content */}
        <div className="flex flex-1 items-center gap-4 px-4 order-2 sm:order-2">
          <div className="text-4xl">{currentAd.image}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-base md:text-lg truncate">
              {currentAd.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/90 line-clamp-1 md:line-clamp-2">
              {currentAd.description}
            </p>
          </div>
          <button
            className="hidden sm:flex flex-shrink-0 rounded-full px-4 py-2 bg-white text-current font-semibold text-xs sm:text-sm hover:bg-white/90 transition whitespace-nowrap"
          >
            {currentAd.ctaText}
          </button>
        </div>

        {/* Right navigation */}
        <button
          onClick={handleNext}
          className="flex-shrink-0 rounded-full p-2 text-white hover:bg-white/20 transition lg:order-3"
          aria-label="Next ad"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 flex-shrink-0 rounded-full p-1 text-white hover:bg-white/20 transition"
          aria-label="Close advertisement"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 px-4 pb-3">
        {dummyAds.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentAdIndex(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              index === currentAdIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70',
            )}
            aria-label={`Go to ad ${index + 1}`}
            aria-current={index === currentAdIndex}
          />
        ))}
      </div>

      {/* CTA Button for mobile */}
      <div className="sm:hidden px-4 pb-3">
        <button className="w-full rounded-full px-4 py-2 bg-white text-current font-semibold text-xs hover:bg-white/90 transition">
          {currentAd.ctaText}
        </button>
      </div>
    </div>
  );
}
