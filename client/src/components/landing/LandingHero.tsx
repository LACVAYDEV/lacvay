import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Loader2, Bus, Coins, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MapPinSolid } from '@/components/ui/Logo';
import { landingTicker } from '@/data/landingContent';

const heroBackground: CSSProperties = {
  backgroundImage: [
    'radial-gradient(45% 60% at 78% 6%, rgba(255,196,0,0.45) 0%, rgba(255,196,0,0) 62%)',
    'radial-gradient(50% 60% at 62% 100%, rgba(200,232,42,0.5) 0%, rgba(200,232,42,0) 68%)',
    'linear-gradient(100deg, #FFFFFF 0%, #FCFEF6 40%, #F1FADD 100%)',
  ].join(', '),
};

/** Softens both ends of the scrolling ticker so items fade rather than clip. */
const tickerFade: CSSProperties = {
  maskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
};

const highlights = [
  { icon: Bus, label: 'Jeepney, tricycle, taxi & motorcycle' },
  { icon: Coins, label: 'Transparent fare estimates' },
  { icon: Sparkles, label: 'AI travel assistant' },
];

export function LandingHero() {
  const { signInAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);

  const exploreDemo = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden" style={heroBackground}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-4 h-72 w-72 animate-drift rounded-full bg-lacvay-lime/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-10 h-80 w-80 animate-drift rounded-full bg-lacvay-yellow/25 blur-3xl [animation-delay:-8s]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11.5px] font-semibold text-lacvay-green-dark shadow-soft">
            <MapPin className="h-3.5 w-3.5 text-lacvay-green" />
            Batangas City, Philippines
          </span>

          <h1
            className="mt-5 animate-fade-up text-[32px] font-extrabold leading-[1.1] tracking-tight text-lacvay-green-dark sm:text-[40px] lg:text-[48px]"
            style={{ animationDelay: '90ms' }}
          >
            Get around <span className="whitespace-nowrap">Batangas City</span>
            <span className="mt-1 block text-lacvay-yellow">like a local</span>
          </h1>

          <p
            className="mt-4 max-w-lg animate-fade-up text-[14px] leading-relaxed text-gray-600 sm:text-[15px]"
            style={{ animationDelay: '180ms' }}
          >
            Find routes by jeepney, tricycle, taxi, or motorcycle rider, check fares before you
            ride, and ask an AI assistant anything about the city.
          </p>

          <div
            className="mt-7 flex animate-fade-up flex-wrap items-center gap-3"
            style={{ animationDelay: '270ms' }}
          >
            <Link
              to="/signup"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-lacvay-green to-lacvay-lime px-6 py-3 text-[14px] font-bold text-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              <span className="relative flex items-center gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <button
              type="button"
              onClick={exploreDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-semibold text-gray-800 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-lacvay-green/30 hover:shadow-card disabled:translate-y-0 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-lacvay-green" />}
              Explore the Demo
            </button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {highlights.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className="flex animate-fade-up items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold text-gray-700 shadow-soft backdrop-blur-sm"
                style={{ animationDelay: `${360 + i * 80}ms` }}
              >
                <Icon className="h-3.5 w-3.5 text-lacvay-green" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:mx-0 lg:ml-auto">
          <svg
            viewBox="0 0 900 600"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path
              d="M60 130 C 230 50, 300 300, 470 255 S 760 370, 850 520"
              fill="none"
              stroke="#159447"
              strokeOpacity="0.4"
              strokeWidth="5"
              strokeDasharray="3 9"
              strokeLinecap="round"
              className="animate-route-dash"
            />
            <circle cx="60" cy="130" r="9" fill="#159447" fillOpacity="0.5" />
          </svg>

          <img
            src="/images/hero-batangas.png"
            alt="Batangas City landmarks with a traditional jeepney"
            className="relative w-full animate-float-in mix-blend-multiply"
            style={{ animationDelay: '220ms, 1.2s' }}
          />

          <span
            aria-hidden="true"
            className="absolute left-[63%] top-[14%] flex h-9 w-9 items-center justify-center"
          >
            <span className="absolute h-6 w-6 animate-pulse-ring rounded-full bg-lacvay-green/40" />
            <MapPinSolid className="relative h-8 w-6 drop-shadow-sm" />
          </span>

          <div
            className="absolute left-0 top-4 animate-fade-up sm:left-2"
            style={{ animationDelay: '620ms' }}
          >
            <div className="animate-float-sm rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur [animation-delay:1.2s]">
              <p className="text-[10px] font-medium text-gray-500">Jeepney fare</p>
              <p className="text-[15px] font-extrabold text-lacvay-green">₱13 – ₱15</p>
            </div>
          </div>

          <div
            className="absolute bottom-8 right-0 animate-fade-up sm:right-2"
            style={{ animationDelay: '740ms' }}
          >
            <div className="animate-float-sm rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur [animation-delay:-1.6s]">
              <p className="text-[10px] font-medium text-gray-500">To SM City Batangas</p>
              <p className="text-[15px] font-extrabold text-lacvay-green-dark">18 min</p>
            </div>
          </div>

          <div
            className="absolute -bottom-2 left-0 hidden animate-fade-up sm:block lg:left-4"
            style={{ animationDelay: '860ms' }}
          >
            <div className="animate-float-sm flex max-w-[190px] items-start gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur [animation-delay:-3.2s]">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lacvay-yellow" />
              <p className="text-[11px] font-medium leading-snug text-gray-600">
                “How do I get to Laiya from the terminal?”
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/70 bg-white/45 py-3.5 backdrop-blur-sm">
        <div className="overflow-hidden" style={tickerFade}>
          <div className="flex w-max animate-marquee items-center gap-7 pr-7 hover:[animation-play-state:paused]">
            {[...landingTicker, ...landingTicker].map((place, i) => (
              <span
                key={`${place}-${i}`}
                className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-lacvay-green-dark/70"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-lacvay-green/60" />
                {place}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
