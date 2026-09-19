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
    navigate('/map', {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved</h1>
          <p className="text-sm text-gray-500">Your bookmarked places and saved trip guides</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lacvay-green/10 text-lacvay-green">
            <Bookmark className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Sign in to view your saved items</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Sign in with your LACVAY account to sync your saved places and AI-generated travel itineraries across devices.
          </p>
          <Button type="button" onClick={() => navigate('/login')} className="mt-5">
            Sign In to LACVAY
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Trips & Places</h1>
          <p className="text-sm text-gray-500">
            Access your bookmarked spots and AI-generated commute guides
          </p>
        </div>

        {/* Tab Filter Chips */}
        <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => handleTabChange('places')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'places'
                ? 'bg-white text-lacvay-green shadow-soft'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Saved Places</span>
            <span className="rounded-full bg-lacvay-green/10 px-2 py-0.5 text-[10px] text-lacvay-green">
              {favorites.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('guides')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'guides'
                ? 'bg-white text-lacvay-green shadow-soft'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Saved Guides</span>
            <span className="rounded-full bg-lacvay-green/10 px-2 py-0.5 text-[10px] text-lacvay-green">
              {savedGuides.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Saved Places */}
      {activeTab === 'places' && (
        <>
          {favorites.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                title="No saved places yet"
                description="Tap the heart icon on any tourist spot or attraction in Batangas City to bookmark it here."
              />
              <div className="flex justify-center">
                <Button onClick={() => navigate('/tourist-spots')}>
                  Explore Batangas Tourist Spots
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="space-y-4">
              <EmptyState
                title="No saved guides yet"
                description="Chat with our AI Travel Assistant to craft a custom itinerary, then tap 'Save Guide to My Trips' to view and project your stops here."
              />
              <div className="flex justify-center">
                <Button onClick={() => navigate('/ai-assistant')} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ask AI Assistant
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {savedGuides.map((guide) => {
                const steps: SavedGuideStep[] = Array.isArray(guide.steps)
                  ? guide.steps
                  : [];

                return (
                  <Card
                    key={guide.id}
                    className="flex flex-col justify-between overflow-hidden border border-gray-100 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-xl rounded-2xl"
                  >
                    <div className="space-y-3.5">
                      {/* Top Row: Title & Action */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
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
                        <div className="rounded-xl bg-gray-50/90 p-3 border border-gray-100 space-y-2">
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
                        <span>View on Map</span>
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
