import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ProtectedRoute, PublicOnlyRoute, AdminRoute, SessionModeRoute, AppSplash } from '@/components/auth/RouteGuards';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/ui/States';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
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
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminPlacesPage = lazy(() => import('@/pages/admin/AdminPlacesPage'));
const AdminPlaceFormPage = lazy(() => import('@/pages/admin/AdminPlaceFormPage'));
const AdminRestaurantsPage = lazy(() => import('@/pages/admin/AdminRestaurantsPage'));
const AdminRestaurantFormPage = lazy(() => import('@/pages/admin/AdminRestaurantFormPage'));
const AdminTransitPage = lazy(() => import('@/pages/admin/AdminTransitPage'));
const AdminGuidesPage = lazy(() => import('@/pages/admin/AdminGuidesPage'));
const AdminPromotionsPage = lazy(() => import('@/pages/admin/AdminPromotionsPage'));
const AdminPromotionFormPage = lazy(() => import('@/pages/admin/AdminPromotionFormPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const ChooseModePage = lazy(() => import('@/pages/ChooseModePage'));

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
          <Route path="/saved-places" element={<SavedPage defaultTab="places" />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

/** Root route: Shows LandingPage for unauthenticated visitors, AppShell for signed-in commuters */
function RootRoute() {
  const { session, isLoading, needsModeChoice } = useAuth();

  if (isLoading) return <AppSplash />;

  if (!session) {
    return <LandingPage />;
  }

  if (needsModeChoice) {
    return <Navigate to="/choose-mode" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Suspense fallback={<AppSplash />}>
            <Routes>
              {/* Root URL: LandingPage for visitors; User AppShell for signed-in commuters */}
              <Route path="/" element={<RootRoute />} />

              {/* Public & Auth pages */}
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
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/terms" element={<LegalPage />} />

              {/* Protected mode choice */}
              <Route
                path="/choose-mode"
                element={
                  <ProtectedRoute>
                    <ChooseModePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected admin section */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingState />}>
                      <AdminLayout />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="places" element={<AdminPlacesPage />} />
                <Route path="places/new" element={<AdminPlaceFormPage />} />
                <Route path="places/:id/edit" element={<AdminPlaceFormPage />} />
                <Route path="promotions" element={<AdminPromotionsPage />} />
                <Route path="promotions/new" element={<AdminPromotionFormPage />} />
                <Route path="promotions/:id/edit" element={<AdminPromotionFormPage />} />
                <Route path="restaurants" element={<AdminRestaurantsPage />} />
                <Route path="restaurants/new" element={<AdminRestaurantFormPage />} />
                <Route path="restaurants/:id/edit" element={<AdminRestaurantFormPage />} />
                <Route path="transit" element={<AdminTransitPage />} />
                <Route path="guides" element={<AdminGuidesPage />} />
              </Route>

              {/* All client/user app feature routes - STRICTLY PROTECTED */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SessionModeRoute>
                      <AppShell />
                    </SessionModeRoute>
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
