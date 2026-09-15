import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Coins, MapPinned, Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { transportIcons } from '@/components/ui/TransportIcons';
import { fareCheckerOptions } from '@/lib/transport';

const perks = [
  {
    icon: MapPinned,
    title: 'Routes that make sense',
    text: 'Step-by-step directions by jeepney, tricycle, taxi, or motorcycle rider.',
  },
  {
    icon: Coins,
    title: 'Fares before you ride',
    text: 'Know roughly what to hand the driver, so nobody has to guess.',
  },
  {
    icon: Sparkles,
    title: 'An assistant that knows the city',
    text: 'Ask for directions, food, or something worth doing this weekend.',
  },
];

const panelBackground: CSSProperties = {
  backgroundColor: '#6B1B2E',
};

/** Fades the illustration into the panel instead of leaving a hard image edge. */
const illustrationFade: CSSProperties = {
  maskImage: 'linear-gradient(to top, #000 30%, transparent 78%)',
  WebkitMaskImage: 'linear-gradient(to top, #000 30%, transparent 78%)',
};

const formBackground: CSSProperties = {
  backgroundColor: '#FFFFFF',
};

export default function AuthPage() {
  const { pathname } = useLocation();
  const mode = pathname === '/signup' ? 'signup' : 'signin';

  return (
    <div className="auth-page flex min-h-screen bg-lacvay-cream lg:h-screen lg:overflow-hidden">
      <aside className="auth-showcase relative hidden w-[46%] max-w-[660px] shrink-0 overflow-hidden lg:block">
        <div className="absolute inset-0" style={panelBackground} />

        <img
          src="/images/hero-batangas-transparent.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 w-full"
          style={illustrationFade}
        />

        <div className="relative flex h-full flex-col p-10 xl:p-14">
          <Link to="/welcome" className="flex items-center gap-2.5 self-start">
            <img
              src="/images/lacvay-logo.png"
              alt="LACVAY Logo"
              className="size-16 object-contain"
            />
            <span className="text-[20px] font-extrabold tracking-tight text-white">LACVAY</span>
          </Link>

          <div className="mt-10 max-w-md 2xl:mt-14">
            <h2 className="text-[30px] font-extrabold leading-[1.14] tracking-tight text-white xl:text-[34px]">
              Your travel buddy in
              <span className="block text-lacvay-yellow">Batangas City</span>
            </h2>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-white/80">
              Routes, fares, rides, and recommendations for every corner of the city — all in one
              place.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {fareCheckerOptions.map(({ type, label }) => {
                const Icon = transportIcons[type];
                return (
                  <span
                    key={type}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.14] px-3 py-1.5 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/20"
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                    {label}
                  </span>
                );
              })}
            </div>

            <ul className="mt-8 space-y-4">
              {perks.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.14] ring-1 ring-inset ring-white/20">
                    <Icon className="h-4 w-4 text-lacvay-yellow" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-white/75">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <main className={`auth-main auth-main-${mode} relative flex flex-1 flex-col items-center px-4 py-6 sm:px-8 lg:min-h-0 lg:overflow-y-auto`} style={formBackground}>
        <div className="flex w-full max-w-[420px] items-center justify-between gap-4">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-[12.5px] font-semibold text-gray-600 shadow-sm transition hover:border-lacvay-green/30 hover:text-lacvay-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <span className="flex items-center gap-2 lg:hidden">
            <img
              src="/images/lacvay-logo.png"
              alt="LACVAY Logo"
              className="size-12 object-contain"
            />
            <span className="text-[17px] font-extrabold tracking-tight text-lacvay-green">LACVAY</span>
          </span>
        </div>

        <div className="auth-form-area flex w-full flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px]">
            <div className="auth-form-card rounded-[28px] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
              <AuthForm mode={mode} />
            </div>

            <p className="mt-5 px-2 text-center text-[11.5px] leading-relaxed text-gray-400">
              LACVAY is a travel assistant for Batangas City. Your saved places and search history
              stay tied to your account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
