import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ProtectedRoute, PublicOnlyRoute, AppSplash } from '@/components/auth/RouteGuards';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/ui/States';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const CommutePage = lazy(() => import('@/pages/CommutePage'));
const FaresPage = lazy(() => import('@/pages/FaresPage'));
const RidesPage = lazy(() => import('@/pages/RidesPage'));
const TouristSpotsPage = lazy(() => import('@/pages/TouristSpotsPage'));
const TouristSpotDetailPage = lazy(() => import('@/pages/TouristSpotDetailPage'));
const AIAssistantPage = lazy(() => import('@/pages/AIAssistantPage'));
const RestaurantsPage = lazy(() => import('@/pages/RestaurantsPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const SavedPlaces = lazy(() => import('@/pages/SavedPlaces'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/commute" element={<CommutePage />} />
          <Route path="/fares" element={<FaresPage />} />
          <Route path="/rides" element={<RidesPage />} />
          <Route path="/tourist-spots" element={<TouristSpotsPage />} />
          <Route path="/tourist-spots/:id" element={<TouristSpotDetailPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/saved-places" element={<SavedPlaces />} />
          <Route path="/history" element={<HistoryPage />} />
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
