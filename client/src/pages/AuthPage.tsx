import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Bus, Coins, Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { LogoMark } from '@/components/ui/Logo';

const perks = [
  { icon: Bus, title: 'Routes that make sense', text: 'Jeepney and tricycle directions across Batangas City.' },
  { icon: Coins, title: 'Fares before you ride', text: 'Estimates for jeepneys, tricycles, and taxis.' },
  { icon: Sparkles, title: 'An assistant that knows the city', text: 'Ask for directions, food, or things to do.' },
];

export default function AuthPage() {
  const { pathname } = useLocation();
  const mode = pathname === '/signup' ? 'signup' : 'signin';

  return (
    <div className="flex min-h-screen bg-lacvay-cream">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-lacvay-green to-lacvay-green-dark p-10 lg:flex">
        <div>
          <Link to="/welcome" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <LogoMark className="h-7 w-5" />
            </span>
            <span className="text-[20px] font-extrabold tracking-tight text-white">LACVAY</span>
          </Link>

          <h2 className="mt-12 max-w-sm text-[30px] font-extrabold leading-[1.15] tracking-tight text-white">
            Your travel buddy in
            <span className="block text-lacvay-lime">Batangas City</span>
          </h2>

          <ul className="mt-8 space-y-5">
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-4 w-4 text-lacvay-lime" />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-white">{title}</p>
                  <p className="mt-0.5 max-w-xs text-[12px] leading-relaxed text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <img
          src="/images/hero-batangas.png"
          alt=""
          className="pointer-events-none absolute -bottom-6 -right-10 w-[300px] opacity-90 mix-blend-luminosity"
        />
      </aside>

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-8">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1.5 self-start text-[12.5px] font-semibold text-gray-500 transition hover:text-lacvay-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[400px] rounded-[26px] bg-white p-6 shadow-card sm:p-8">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <LogoMark className="h-9 w-7" />
              <span className="text-[19px] font-extrabold tracking-tight text-lacvay-green">LACVAY</span>
            </div>

            <AuthForm mode={mode} />
          </div>
        </div>
      </main>
    </div>
  );
}
