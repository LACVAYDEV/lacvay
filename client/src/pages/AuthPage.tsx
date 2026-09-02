import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Coins, MapPinned, ShieldCheck, Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { LogoMark } from '@/components/ui/Logo';
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
  backgroundImage: [
    'radial-gradient(115% 85% at 88% -5%, rgba(200, 232, 42, 0.26) 0%, rgba(200, 232, 42, 0) 55%)',
    'radial-gradient(95% 75% at -10% 105%, rgba(4, 92, 46, 0.85) 0%, rgba(4, 92, 46, 0) 62%)',
    'linear-gradient(158deg, #17A150 0%, #159447 42%, #08783D 100%)',
  ].join(', '),
};

const dotGrid: CSSProperties = {
  backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

/** Fades the illustration into the panel instead of leaving a hard image edge. */
const illustrationFade: CSSProperties = {
  maskImage: 'linear-gradient(to top, #000 38%, transparent 86%)',
  WebkitMaskImage: 'linear-gradient(to top, #000 38%, transparent 86%)',
};

const formBackground: CSSProperties = {
  backgroundImage: [
    'radial-gradient(75% 55% at 100% 0%, rgba(200, 232, 42, 0.18) 0%, rgba(200, 232, 42, 0) 62%)',
    'radial-gradient(65% 50% at 0% 100%, rgba(21, 148, 71, 0.09) 0%, rgba(21, 148, 71, 0) 60%)',
    'linear-gradient(180deg, #FFFFFF 0%, #FAFBF4 100%)',
  ].join(', '),
};

export default function AuthPage() {
  const { pathname } = useLocation();
  const mode = pathname === '/signup' ? 'signup' : 'signin';

  return (
    <div className="flex min-h-screen bg-lacvay-cream">
      <aside className="relative hidden w-[46%] max-w-[660px] shrink-0 overflow-hidden lg:block">
        <div className="absolute inset-0" style={panelBackground} />
        <div className="absolute inset-0 opacity-70" style={dotGrid} />

        <img
          src="/images/hero-batangas.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 w-full opacity-90 mix-blend-multiply"
          style={illustrationFade}
        />

        <div className="relative flex h-full flex-col p-10 xl:p-14">
          <Link to="/welcome" className="flex items-center gap-2.5 self-start">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/20">
              <LogoMark className="h-7 w-5" />
            </span>
            <span className="text-[20px] font-extrabold tracking-tight text-white">LACVAY</span>
          </Link>

          <div className="mt-10 max-w-md 2xl:mt-14">
            <h2 className="text-[30px] font-extrabold leading-[1.14] tracking-tight text-white xl:text-[34px]">
              Your travel buddy in
              <span className="block text-lacvay-lime">Batangas City</span>
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
                    <Icon className="h-3.5 w-3.5 text-lacvay-lime" />
                    {label}
                  </span>
                );
              })}
            </div>

            <ul className="mt-8 space-y-4">
              {perks.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.14] ring-1 ring-inset ring-white/20">
                    <Icon className="h-4 w-4 text-lacvay-lime" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-white/75">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-white/[0.12] p-4 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lacvay-lime" />
              <p className="text-[12px] leading-relaxed text-white/85">
                No account needed to look around. Continue as a guest and sign up later to keep your
                saved places and history.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col items-center px-4 py-6 sm:px-8" style={formBackground}>
        <div className="flex w-full max-w-[420px] items-center justify-between gap-4">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-[12.5px] font-semibold text-gray-600 shadow-sm transition hover:border-lacvay-green/30 hover:text-lacvay-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <span className="flex items-center gap-2 lg:hidden">
            <LogoMark className="h-8 w-6" />
            <span className="text-[17px] font-extrabold tracking-tight text-lacvay-green">LACVAY</span>
          </span>
        </div>

        <div className="flex w-full flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px]">
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
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
