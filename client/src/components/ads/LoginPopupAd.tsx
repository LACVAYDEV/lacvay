import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginPopupAdProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPopupAd({ isOpen, onClose }: LoginPopupAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setShowAd(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowAd(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowAd(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black transition-opacity duration-300',
          showAd ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none',
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto',
            showAd
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4',
          )}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close advertisement"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>

          {/* Ad Content */}
          <div className="bg-gradient-to-br from-teal-600 via-blue-600 to-blue-800 px-6 py-8">
            <div className="text-center">
              <div className="mb-4 text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to LACVAY!
              </h2>
              <p className="text-sm text-white/90 mb-6">
                Explore your city with ease. Start your adventure now!
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    ✓
                  </div>
                  <span className="text-sm">Find the best tourist spots</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    ✓
                  </div>
                  <span className="text-sm">Book affordable rides</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    ✓
                  </div>
                  <span className="text-sm">Discover great restaurants</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 space-y-2">
            <button
              onClick={() => {
                handleClose();
              }}
              className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold hover:shadow-lg transition"
            >
              Start Exploring
            </button>
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Maybe Later
            </button>
          </div>

          {/* Promo badge */}
          <div className="bg-lacvay-blush px-6 py-3 text-center border-t border-gray-100">
            <p className="text-xs text-lacvay-green font-semibold">
              🎁 First ride discount code: WELCOME20
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
