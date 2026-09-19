import { HeroSection } from '@/components/home/HeroSection';
import { FeatureCards } from '@/components/home/FeatureCards';
import { TouristSpotsSection } from '@/components/home/TouristSpotsSection';
import { RestaurantsSection } from '@/components/home/RestaurantsSection';
import { AIAssistantSection, AIAssistantFab } from '@/components/home/AIAssistantPanel';

export default function HomePage() {
  return (
    <>
      <div className="space-y-6 w-full pb-10">
        {/* 1. Hero / Home Overview */}
        <HeroSection />

        {/* 2. Commute Navigation Tools (Map & Routes, Commute Guide, Transport Checker, Ride Guide) */}
        <FeatureCards />

        {/* 3. Nearby Tourist Spots */}
        <TouristSpotsSection />

        {/* 4. Nearby Restaurants */}
        <RestaurantsSection />

        {/* 5. AI Travel Assistant Chats Highlight */}
        <AIAssistantSection />
      </div>

      <AIAssistantFab />
    </>
  );
}
