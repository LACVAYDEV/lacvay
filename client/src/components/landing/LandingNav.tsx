import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const sections = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#destinations', label: 'Destinations' },
  { href: '#why-lacvay', label: 'Why LACVAY' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-7 shrink-0" />
          <span className="leading-none">
            <span className="block text-[19px] font-extrabold tracking-tight text-lacvay-green">LACVAY</span>
            <span className="mt-1 block text-[10px] text-gray-500">Batangas City Assistant</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 lg:flex">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="text-[13px] font-medium text-gray-600 transition hover:text-lacvay-green"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-lacvay-green transition hover:bg-lacvay-green/5"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-lacvay-green px-4 py-2 text-[13px] font-semibold text-white shadow-soft transition hover:bg-lacvay-green-dark"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-xl p-2 hover:bg-gray-100 sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn('border-t border-gray-100 bg-white px-4 pb-4 sm:hidden', open ? 'block' : 'hidden')}>
        <nav className="flex flex-col py-2">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-2 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="flex gap-2">
          <Link
            to="/login"
            className="flex-1 rounded-full border border-gray-200 py-2 text-center text-[13px] font-semibold text-lacvay-green"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="flex-1 rounded-full bg-lacvay-green py-2 text-center text-[13px] font-semibold text-white"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
