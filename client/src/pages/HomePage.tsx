import { HeroSection } from '@/components/home/HeroSection';
import { PlanTripCard } from '@/components/home/PlanTripCard';
import { FeatureCards } from '@/components/home/FeatureCards';
import { TouristSpotsSection } from '@/components/home/TouristSpotsSection';
import { PromotionsSection } from '@/components/home/PromotionsSection';
import { AIAssistantPanel, AIAssistantFab } from '@/components/home/AIAssistantPanel';

export default function HomePage() {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-5">
          <HeroSection />
          <FeatureCards />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <TouristSpotsSection />
            <PromotionsSection />
          </div>
        </div>

        <div className="space-y-5">
          <PlanTripCard />
          <div className="hidden xl:block">
            <AIAssistantPanel />
          </div>
        </div>
      </div>

      <AIAssistantFab />
    </>
  );
}
