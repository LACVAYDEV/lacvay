import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ProtectedRoute, PublicOnlyRoute, AppSplash } from '@/components/auth/RouteGuards';
import { PartnerOnly, TravelerOnly } from '@/components/auth/RoleRoutes';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/ui/States';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const PartnerHomePage = lazy(() => import('@/pages/PartnerHomePage'));
const PartnerRequestsPage = lazy(() => import('@/pages/PartnerRequestsPage'));
const PartnerEarningsPage = lazy(() => import('@/pages/PartnerEarningsPage'));
const PartnerHistoryPage = lazy(() => import('@/pages/PartnerHistoryPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const CommutePage = lazy(() => import('@/pages/CommutePage'));
const FaresPage = lazy(() => import('@/pages/FaresPage'));
const TodaTerritoriesPage = lazy(() => import('@/pages/TodaTerritoriesPage'));
const RidesPage = lazy(() => import('@/pages/RidesPage'));
const TouristSpotsPage = lazy(() => import('@/pages/TouristSpotsPage'));
const TouristSpotDetailPage = lazy(() => import('@/pages/TouristSpotDetailPage'));
const AIAssistantPage = lazy(() => import('@/pages/AIAssistantPage'));
const RestaurantsPage = lazy(() => import('@/pages/RestaurantsPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route
            path="/"
            element={
              <TravelerOnly>
                <HomePage />
              </TravelerOnly>
            }
          />
          <Route
            path="/partner"
            element={
              <PartnerOnly>
                <PartnerHomePage />
              </PartnerOnly>
            }
          />
          <Route
            path="/partner/requests"
            element={
              <PartnerOnly>
                <PartnerRequestsPage />
              </PartnerOnly>
            }
          />
          <Route
            path="/partner/earnings"
            element={
              <PartnerOnly>
                <PartnerEarningsPage />
              </PartnerOnly>
            }
          />
          <Route
            path="/partner/history"
            element={
              <PartnerOnly>
                <PartnerHistoryPage />
              </PartnerOnly>
            }
          />
          <Route
            path="/map"
            element={
              <TravelerOnly>
                <MapPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/commute"
            element={
              <TravelerOnly>
                <CommutePage />
              </TravelerOnly>
            }
          />
          <Route
            path="/fares"
            element={
              <TravelerOnly>
                <FaresPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/toda"
            element={
              <TravelerOnly>
                <TodaTerritoriesPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/rides"
            element={
              <TravelerOnly>
                <RidesPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/tourist-spots"
            element={
              <TravelerOnly>
                <TouristSpotsPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/tourist-spots/:id"
            element={
              <TravelerOnly>
                <TouristSpotDetailPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <TravelerOnly>
                <AIAssistantPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/restaurants"
            element={
              <TravelerOnly>
                <RestaurantsPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/promotions"
            element={
              <TravelerOnly>
                <PromotionsPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/saved"
            element={
              <TravelerOnly>
                <SavedPage />
              </TravelerOnly>
            }
          />
          <Route
            path="/history"
            element={
              <TravelerOnly>
                <HistoryPage />
              </TravelerOnly>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Suspense fallback={<AppSplash />}>
            <Routes>
              <Route
                path="/welcome"
                element={
                  <PublicOnlyRoute>
                    <LandingPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
