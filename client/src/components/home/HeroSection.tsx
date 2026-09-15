import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const heroBackground = {
  backgroundImage: [
    'linear-gradient(90deg, rgba(220, 239, 250, 0.9) 0%, rgba(220, 239, 250, 0.64) 30%, rgba(220, 239, 250, 0) 59%)',
    "url('/images/logo1.jpg')",
  ].join(', '),
};

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="home-hero relative h-[400px] overflow-hidden rounded-[26px] shadow-card sm:h-[320px] lg:h-[267px]"
      style={heroBackground}
    >
      <div className="home-hero-landmark" aria-hidden="true" />

      <div className="relative z-10 flex h-full items-center px-7 py-8 sm:px-8 lg:px-10">
        <div className="max-w-[23rem]">
          <h2 className="text-[27px] font-extrabold leading-[1.08] tracking-tight text-lacvay-green-dark sm:text-[30px]">
            Your Batangas City
            <span className="block text-lacvay-yellow">Travel Companion</span>
          </h2>
          <p className="mt-3 max-w-[19rem] text-[12px] leading-[1.55] text-gray-800">
            Find routes, check fares, learn how to book Angkas and taxis, explore attractions, and get AI travel help — all in one place.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate('/map')} className="rounded-full px-5 py-2.5 shadow-md">
              <MapPin className="h-4 w-4" strokeWidth={2.5} />
              Plan Your Trip
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/ai-assistant')}
              className="rounded-full border-0 px-5 py-2.5 shadow-md"
            >
              <Sparkles className="h-4 w-4 text-lacvay-green" strokeWidth={2.5} />
              Ask AI Assistant
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
