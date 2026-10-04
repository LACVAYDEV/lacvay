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
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
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
            'relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto',
            showAd
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4',
          )}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 flex items-center justify-center rounded p-1 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close advertisement"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>

          {/* Content */}
          <div className="px-8 py-10">
            {!submitted ? (
              <>
                <h2 className="text-center text-3xl font-bold text-lacvay-green mb-3">
                  Get 20% Off
                </h2>
                <p className="text-center text-sm text-gray-600 mb-6">
                  Enter your email. Get your 20% off code.
                  <br />
                  Be the first to know about all things LACVAY.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-lacvay-green focus:ring-1 focus:ring-lacvay-green"
                  />

                  <button
                    type="submit"
                    className="w-full px-4 py-3 rounded bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold text-sm hover:shadow-lg transition"
                  >
                    Get My 20% Off
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mb-4 text-5xl">✓</div>
                <h3 className="text-xl font-bold text-lacvay-green mb-2">
                  Thank you!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your discount code has been sent to<br />
                  <span className="font-semibold">{email}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Use code: <span className="font-bold text-lacvay-green">WELCOME20</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
