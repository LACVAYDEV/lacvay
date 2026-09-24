import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  Compass,
  Map,
  Trash2,
  Sparkles,
  MapPin,
  Calendar,
  Route,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { favoritesService } from '@/services/favoritesService';
import { savedGuidesService } from '@/services/savedGuidesService';
import { PlaceCard } from '@/components/places/PlaceCard';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { UserFavorite, SavedGuide, SavedGuideStep } from '@/types';

interface SavedPageProps {
  defaultTab?: 'places' | 'guides';
}

export default function Saved({ defaultTab = 'places' }: SavedPageProps) {
  const { user } = useAuth();
  const { showToast } = useApp();
  const confirm = useConfirmDialog();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'guides' || tabParam === 'places'
      ? tabParam
      : defaultTab;

  const [activeTab, setActiveTab] = useState<'places' | 'guides'>(initialTab);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL search parameter
  const handleTabChange = (tab: 'places' | 'guides') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      favoritesService.getUserFavorites(user.id).catch(() => []),
      savedGuidesService.getUserSavedGuides(user.id).catch(() => []),
    ]).then(([favs, guides]) => {
      if (isMounted) {
        setFavorites(favs);
        setSavedGuides(guides);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFavoriteToggle = (placeId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      setFavorites((prev) => prev.filter((f) => f.place_id !== placeId));
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    const confirmed = await confirm({
      title: 'Remove saved guide?',
      description: 'This guide will be removed from your saved trips.',
      confirmLabel: 'Remove guide',
    });
    if (!confirmed) return;
    try {
      await savedGuidesService.deleteSavedGuide(guideId, user?.id);
      setSavedGuides((prev) => prev.filter((g) => g.id !== guideId));
      showToast('Guide removed from your trips');
    } catch {
      showToast('Failed to remove guide');
    }
  };

  const handleViewOnMap = (guide: SavedGuide) => {
    navigate('/commute', {
      state: {
        guide: {
          id: guide.id,
          title: guide.title,
          summary: guide.summary,
          steps: Array.isArray(guide.steps) ? guide.steps : [],
        },
      },
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={<Bookmark className="h-6 w-6" />}
        title="Sign in to view your saved items"
        description="Sync your saved places and AI-generated travel itineraries across devices."
        action={
          <Button type="button" onClick={() => navigate('/login')}>
            Sign in to LACVAY
          </Button>
        }
      />
    );
  }

  const tabs = [
    { id: 'places' as const, label: 'Saved Places', icon: MapPin, count: favorites.length },
    { id: 'guides' as const, label: 'Saved Guides', icon: Compass, count: savedGuides.length },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Tab Filter Chips */}
      <div className="flex w-full items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-soft sm:w-fit">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              aria-pressed={active}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:flex-none ${
                active
                  ? 'bg-lacvay-green text-white shadow-soft'
                  : 'text-gray-600 hover:bg-lacvay-cream hover:text-lacvay-green'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-lacvay-blush text-lacvay-green'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Saved Places */}
      {activeTab === 'places' && (
        <>
          {favorites.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No saved places yet"
              description="Tap the heart on any tourist spot or restaurant to keep it here."
              action={
                <Button onClick={() => navigate('/tourist-spots')}>Explore tourist spots</Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {favorites.map((fav) => {
                const place = fav.place || fav.places;
                if (!place) return null;

                return (
                  <PlaceCard
                    key={fav.id}
                    place={place}
                    isFavorited={true}
                    onFavoriteChange={handleFavoriteToggle}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Saved Guides */}
      {activeTab === 'guides' && (
        <>
          {savedGuides.length === 0 ? (
            <EmptyState
              icon={<Compass className="h-6 w-6" />}
              title="No saved guides yet"
              description="Ask LACVAY AI for a route, then tap Save Guide to keep the steps here."
              action={
                <Button onClick={() => navigate('/ai-assistant')} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ask LACVAY AI
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {savedGuides.map((guide) => {
                const steps: SavedGuideStep[] = Array.isArray(guide.steps)
                  ? guide.steps
                  : [];

                return (
                  <Card
                    key={guide.id}
                    className="flex flex-col justify-between overflow-hidden border border-lacvay-green/5 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="space-y-3.5">
                      {/* Top Row: Title & Action */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-lacvay-blush px-2.5 py-0.5 text-[10.5px] font-semibold text-lacvay-green">
                            <Route className="h-3 w-3" />
                            {steps.length > 0 ? `${steps.length} Stops` : 'Custom Itinerary'}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                            {guide.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGuide(guide.id)}
                          className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="Delete saved guide"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Summary */}
                      {guide.summary && (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {guide.summary}
                        </p>
                      )}

                      {/* Steps Checklist Preview */}
                      {steps.length > 0 && (
                        <div className="space-y-2 rounded-2xl bg-lacvay-cream p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Itinerary Stops
                          </p>
                          <ul className="space-y-1.5">
                            {steps.slice(0, 4).map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lacvay-green/15 text-[10px] font-bold text-lacvay-green">
                                  {step.order ?? idx + 1}
                                </span>
                                <span className="truncate font-medium">{step.title}</span>
                              </li>
                            ))}
                            {steps.length > 4 && (
                              <li className="text-[11px] text-gray-400 pl-6">
                                + {steps.length - 4} more stops
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Date metadata */}
                      {guide.created_at && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Saved on {new Date(guide.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        onClick={() => handleViewOnMap(guide)}
                        className="w-full justify-center gap-2 text-xs font-bold shadow-sm"
                      >
                        <Map className="h-4 w-4" />
                        <span>View Commute Guide</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
