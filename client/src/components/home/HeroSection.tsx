import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const heroBackground = {
  backgroundImage: [
    'linear-gradient(90deg, rgba(4, 38, 58, 0.94) 0%, rgba(4, 46, 69, 0.78) 48%, rgba(4, 38, 58, 0.18) 100%)',
    "url('/images/logo1.jpg')",
  ].join(', '),
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
};

export function HeroSection({ className = '' }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <section
      className={cn(
        'home-hero relative min-h-[410px] overflow-hidden rounded-[22px] bg-lacvay-green-dark shadow-card sm:min-h-[390px] sm:rounded-[26px] lg:min-h-[410px]',
        className,
      )}
      style={heroBackground}
    >
      <div className="relative z-10 flex min-h-[410px] items-center px-6 py-12 sm:min-h-[390px] sm:px-10 lg:min-h-[410px] lg:px-12">
        <div className="max-w-[21rem] sm:max-w-[28rem]">
          <span className="inline-flex items-center gap-2 font-montserrat text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 sm:text-xs">
            <MapPin className="h-3 w-3" strokeWidth={3} />
            BATANGAS CITY
          </span>
          <h2 className="mt-4 text-white">
            <span className="block font-display text-[31px] font-bold leading-[1.04] tracking-tight min-[375px]:text-[34px] sm:text-[42px] lg:text-[46px]">
              Explore Batangas City
            </span>
            <span className="mt-1 block -rotate-1 font-signature text-[40px] font-normal leading-none min-[375px]:text-[44px] sm:text-[54px] lg:text-[58px]">
              with LACVAY
            </span>
          </h2>
          <p className="mt-4 max-w-[19rem] font-montserrat text-[11px] font-medium leading-[1.65] text-white/90 min-[375px]:text-[12px] sm:max-w-[25rem] sm:text-[13px]">
            Find the best routes, check fares, book rides, and discover local spots — all in one
            place.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => navigate('/map')}
              className="min-h-11 rounded-full border border-white/70 bg-lacvay-green px-7 py-2.5 font-montserrat font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-lacvay-green-dark"
            >
              Plan My Route
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/tourist-spots')}
        className="absolute bottom-12 right-10 z-10 hidden -rotate-6 text-right font-signature text-[30px] font-normal leading-[0.9] text-white drop-shadow-md transition hover:scale-105 lg:block"
      >
        See more
        <span className="block">of Batangas</span>
      </button>
    </section>
  );
}
