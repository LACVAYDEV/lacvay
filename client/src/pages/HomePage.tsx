import { HeroSection } from '@/components/home/HeroSection';
import { FeatureCards } from '@/components/home/FeatureCards';
import { TransportBar } from '@/components/home/TransportBar';
import { TouristSpotsSection } from '@/components/home/TouristSpotsSection';
import { RestaurantsSection } from '@/components/home/RestaurantsSection';
import { AIAssistantSection, AIAssistantFab } from '@/components/home/AIAssistantPanel';

export default function HomePage() {
  return (
    <>
      <div className="space-y-6 w-full pb-10">
        {/* 1. Hero / Home Overview */}
        <HeroSection />

        {/* 2. Quick Access to Ride-Hailing Apps */}
        <div>
          <h2 className="mb-3 text-[16px] font-bold text-gray-900">Book a Ride</h2>
          <TransportBar />
        </div>

        {/* 3. Commute Navigation Tools (Map & Routes, Commute Guide, Transport Checker, Ride Guide) */}
        <FeatureCards />

        {/* 4. Nearby Tourist Spots */}
        <TouristSpotsSection />

        {/* 5. Nearby Restaurants */}
        <RestaurantsSection />

        {/* 6. AI Travel Assistant Chats Highlight */}
        <AIAssistantSection />
      </div>

      <AIAssistantFab />
    </>
  );
}
