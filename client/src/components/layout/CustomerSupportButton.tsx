import { useEffect, useId, useRef, useState } from 'react';
import { HeadsetIcon, Facebook, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOCIAL_LINKS = [
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/share/1CEcGe3Cxo/',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://www.tiktok.com/@lacvay.ph?_r=1&_t=ZS-9ADTm53S1WJ',
    icon: MessageCircle,
    color: 'text-black',
    bgColor: 'bg-gray-50',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/lacvayph?stkn=MXdtOHdscDg0NTN6eg%3D%3D',
    icon: MessageCircle,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
  },
];

export function CustomerSupportButton({ className }: { className?: string }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const supportRef = useRef<HTMLDivElement>(null);
  const supportPanelId = useId();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (supportRef.current && !supportRef.current.contains(target)) {
        setSupportOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSupportOpen(false);
      }
    };

    if (supportOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [supportOpen]);

  return (
    <div ref={supportRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setSupportOpen((current) => !current)}
        className="relative rounded-full bg-white/95 p-2 shadow-soft backdrop-blur-sm hover:bg-white transition"
        aria-label="Customer Support"
        aria-expanded={supportOpen}
        aria-controls={supportPanelId}
      >
        <HeadsetIcon className="h-4 w-4 text-lacvay-green" />
      </button>

      {supportOpen && (
        <div
          id={supportPanelId}
          role="region"
          aria-label="Customer Support"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-lacvay-green/10 p-2 text-lacvay-green">
                <HeadsetIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Customer Support</p>
                <p className="text-[11px] text-gray-500">Reach out to us on social media</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs text-gray-600 mb-3">
              Connect with LACVAY on your favorite social media platform for support, updates, and
              inquiries.
            </p>

            <div className="space-y-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-gray-50 border border-gray-100',
                    )}
                  >
                    <span className={cn('rounded-lg p-2', social.bgColor)}>
                      <Icon className={cn('h-4 w-4', social.color)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{social.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">@lacvay.ph</p>
                    </div>
                    <svg
                      className="h-4 w-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg bg-lacvay-green/5 p-3">
              <p className="text-[11px] text-gray-600">
                <span className="font-semibold text-lacvay-green">💬 Need help?</span> Message us
                directly on any of our social media channels and we'll get back to you as soon as
                possible!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
