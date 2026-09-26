import { Compass } from 'lucide-react';
import { HeroSection } from '@/components/home/HeroSection';
import { HeaderToolbar } from '@/components/layout/HeaderToolbar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FeatureCards } from '@/components/home/FeatureCards';
import { TouristSpotsSection } from '@/components/home/TouristSpotsSection';
import { RestaurantsSection } from '@/components/home/RestaurantsSection';
import { AIAssistantSection } from '@/components/home/AIAssistantPanel';

export default function HomePage() {
  return (
    <div className="space-y-6 w-full pb-10">
      <div className="relative -mx-4 mt-3 md:-mx-6 md:mt-4 lg:mx-0 lg:mt-2">
        <HeroSection className="rounded-none sm:rounded-[26px] lg:rounded-[26px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-3 pt-4 min-[375px]:p-4 min-[375px]:pt-5 sm:p-5 sm:pt-6 lg:p-6">
          <HeaderToolbar className="pointer-events-auto" />
        </div>
      </div>

      {/* 2. Commute Navigation Tools (Map & Routes, Commute Guide, Transport Checker, Ride Guide) */}
      <section>
        <SectionHeader
          title="Plan your trip"
          subtitle="Routes, fares, and step-by-step commute help"
          icon={<Compass className="h-4 w-4" />}
        />
        <FeatureCards />
      </section>

      {/* 3. Nearby Tourist Spots */}
      <TouristSpotsSection />

      {/* 4. Nearby Restaurants */}
      <RestaurantsSection />

      {/* 5. AI Travel Assistant Chats Highlight */}
      <AIAssistantSection />
    </div>
  );
}
