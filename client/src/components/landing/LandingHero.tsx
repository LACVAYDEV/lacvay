import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Loader2, Bus, Coins, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const heroBackground = {
  backgroundImage: [
    'radial-gradient(45% 60% at 78% 6%, rgba(255,196,0,0.45) 0%, rgba(255,196,0,0) 62%)',
    'radial-gradient(50% 60% at 62% 100%, rgba(200,232,42,0.5) 0%, rgba(200,232,42,0) 68%)',
    'linear-gradient(100deg, #FFFFFF 0%, #FCFEF6 40%, #F1FADD 100%)',
  ].join(', '),
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
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11.5px] font-semibold text-lacvay-green-dark shadow-soft">
            <MapPin className="h-3.5 w-3.5 text-lacvay-green" />
            Batangas City, Philippines
          </span>

          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.12] tracking-tight text-lacvay-green-dark sm:text-[40px] lg:text-[46px]">
            Get around Batangas City
            <span className="block text-lacvay-yellow">like a local</span>
          </h1>

          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-gray-600 sm:text-[15px]">
            LACVAY is your local travel and transportation assistant. Find jeepney, tricycle, taxi,
            and motorcycle rider routes, check fares before you ride, book a trip, discover tourist
            spots, and ask an AI assistant anything about the city.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-gradient-to-r from-lacvay-green to-lacvay-lime px-6 py-3 text-[14px] font-bold text-white shadow-soft transition hover:opacity-95"
            >
              Create Free Account
            </Link>
            <button
              type="button"
              onClick={exploreDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-semibold text-gray-800 shadow-soft transition hover:bg-gray-50 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-lacvay-green" />}
              Explore the Demo
            </button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600">
                <Icon className="h-4 w-4 text-lacvay-green" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <img
            src="/images/hero-batangas.png"
            alt="Batangas City landmarks with a traditional jeepney"
            className="w-full max-w-[420px] mix-blend-multiply"
          />

          <div className="absolute left-0 top-4 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur sm:left-4">
            <p className="text-[10px] font-medium text-gray-500">Jeepney fare</p>
            <p className="text-[15px] font-extrabold text-lacvay-green">₱13 – ₱15</p>
          </div>

          <div className="absolute bottom-6 right-0 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur sm:right-4">
            <p className="text-[10px] font-medium text-gray-500">To SM City Batangas</p>
            <p className="text-[15px] font-extrabold text-lacvay-green-dark">18 min</p>
          </div>
        </div>
      </div>
    </section>
  );
}
