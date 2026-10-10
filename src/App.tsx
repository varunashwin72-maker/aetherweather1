import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GeoLocation } from '@/types/weather';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { useWeather } from '@/hooks/useWeather';
import { useGeolocation } from '@/hooks/useLocation';
import { ApiError } from '@/lib/api';
import { useFavorites } from '@/hooks/useFavorites';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useAlertNotifier } from '@/hooks/useAlertNotifier';
import { MapPin, LocateFixed, Loader2, X } from 'lucide-react';
import { Navbar, type NavId } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { SearchBar } from '@/components/navigation/SearchBar';
import { WeatherBackground } from '@/components/weather/WeatherBackground';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import { FavoritesPanel } from '@/components/navigation/FavoritesPanel';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Home } from '@/pages/Home';
import { Forecast } from '@/pages/Forecast';
import { Radar } from '@/pages/Radar';
import { Maps } from '@/pages/Maps';
import { Air } from '@/pages/Air';
import { Alerts } from '@/pages/Alerts';
import { LoginPage } from '@/pages/Login';

const DEFAULT_LOCATION: GeoLocation = {
  id: 'om-5128581',
  name: 'New York',
  region: 'New York',
  country: 'United States',
  latitude: 40.7128,
  longitude: -74.006,
};

function AppInner() {
  const { user, loading: authLoading } = useAuth();
  const { settings, setSettings, motion } = useSettings();
  const [active, setActive] = useState<NavId>('home');
  const [location, setLocation] = useState<GeoLocation>(() => {
    try {
      const stored = localStorage.getItem('aether.lastLocation');
      if (stored) return JSON.parse(stored) as GeoLocation;
    } catch { /* ignore */ }
    return DEFAULT_LOCATION;
  });

  const { data, loading, error, lastUpdated, refresh } = useWeather(
    location,
    settings.autoRefreshMinutes
  );
  const { permission, locating, requestCurrent } = useGeolocation();
  const { favorites, recents, addFavorite, removeFavorite, reorderFavorites, addRecent } = useFavorites();
  const [geoError, setGeoError] = useState<string | null>(null);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  // Request browser notification permission when setting is enabled
  useEffect(() => {
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* ignore */ });
    }
  }, [settings.notifications]);

  // Fire alert notifications for logged-in users
  useAlertNotifier(data?.alerts ?? [], location, settings.notifications);

  useEffect(() => {
    try {
      localStorage.setItem('aether.lastLocation', JSON.stringify(location));
    } catch { /* ignore */ }
  }, [location]);

  const handleSelect = useCallback(
    (loc: GeoLocation) => {
      setLocation(loc);
      addRecent(loc);
    },
    [addRecent]
  );

  const handleUseCurrent = useCallback(async () => {
    setGeoError(null);
    try {
      const loc = await requestCurrent();
      handleSelect(loc);
    } catch (e) {
      if (e instanceof ApiError) setGeoError(e.message);
      else setGeoError('Could not get your current location.');
    }
  }, [requestCurrent, handleSelect]);

  useEffect(() => {
    if (hasAutoDetected) return;
    const storedExists = (() => {
      try { return !!localStorage.getItem('aether.lastLocation'); } catch { return false; }
    })();
    if (storedExists) {
      setHasAutoDetected(true);
      return;
    }
    if (permission === 'denied') { setHasAutoDetected(true); return; }
    setHasAutoDetected(true);
    void handleUseCurrent();
  }, [permission, hasAutoDetected, handleUseCurrent]);

  const isFavorite = useMemo(
    () => favorites.some((f) => f.id === location.id),
    [favorites, location]
  );

  const toggleFavorite = useCallback(() => {
    if (isFavorite) removeFavorite(location.id);
    else addFavorite(location);
  }, [isFavorite, location, addFavorite, removeFavorite]);

  const condition = data?.current.condition ?? 'partly-cloudy';
  const isDay = data?.current.isDay ?? true;

  // Show login page when not authenticated (after auth has finished loading)
  if (!authLoading && !user) {
    return <LoginPage />;
  }

  // Show loading state while auth is being restored
  if (authLoading) {
    return (
      <div className="relative min-h-screen">
        <WeatherBackground condition="partly-cloudy" isDay motion="reduced" enabled />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-aether-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <WeatherBackground
        condition={condition}
        isDay={isDay}
        motion={motion}
        enabled={settings.backgroundEffects}
      />

      <div className="relative z-10">
        <Navbar
          active={active}
          onChange={setActive}
          rightSlot={
            <div className="flex items-center gap-3">
              <div className="hidden w-56 sm:block md:w-64 lg:w-72">
                <SearchBar
                  onSelect={handleSelect}
                  onUseCurrent={handleUseCurrent}
                  locating={locating}
                  recents={recents}
                  favorites={favorites}
                  isFavorite={isFavorite}
                  onToggleFavorite={() => toggleFavorite()}
                />
              </div>
              <NotificationBell />
            </div>
          }
        />

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:pb-12">
          {/* Selected location banner */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/80">
            <MapPin className="h-4 w-4 shrink-0 text-aether-300" />
            <span className="text-white/60">Selected location:</span>
            <span className="font-semibold text-white">{location.name}</span>
            {location.region && <span className="text-white/50">· {location.region}</span>}
            {location.country && <span className="text-white/50">· {location.country}</span>}
            <button
              onClick={handleUseCurrent}
              disabled={locating}
              className="ml-2 flex items-center gap-1.5 rounded-full border border-aether-300/30 bg-aether-500/20 px-3 py-1 text-xs font-medium text-white transition hover:bg-aether-500/40 disabled:opacity-60"
              aria-label="Use my current location"
            >
              {locating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <LocateFixed className="h-3 w-3" />
              )}
              {locating ? 'Locating...' : 'Use my location'}
            </button>
          </div>

          {geoError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 animate-fade-in">
              <span className="flex-1">{geoError}</span>
              <button
                onClick={() => setGeoError(null)}
                className="rounded-full p-1 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-200"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Mobile search */}
          <div className="mb-6 sm:hidden">
            <SearchBar
              onSelect={handleSelect}
              onUseCurrent={handleUseCurrent}
              locating={locating}
              recents={recents}
              favorites={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={() => toggleFavorite()}
            />
          </div>

          {permission === 'denied' && (
            <div className="mb-4">
              <ErrorState
                error={{ type: 'permission', message: 'Location access was denied. Search for a city above instead.' }}
              />
            </div>
          )}

          {!data && loading && <LoadingState />}

          {!data && !loading && error && (
            <ErrorState error={error} action={<RetryButton onClick={refresh} />} />
          )}

          {data && (
            <div className="animate-fade-in">
              {active === 'home' && (
                <Home data={data} settings={settings} loading={loading} lastUpdated={lastUpdated} onRefresh={refresh} />
              )}
              {active === 'forecast' && <Forecast data={data} settings={settings} />}
              {active === 'radar' && <Radar data={data} onSelectLocation={handleSelect} />}
              {active === 'maps' && <Maps data={data} onSelectLocation={handleSelect} />}
              {active === 'air' && <Air data={data} />}
              {active === 'alerts' && <Alerts data={data} />}
              {active === 'favorites' && (
                <FavoritesPanel
                  favorites={favorites}
                  activeId={location.id}
                  onSelect={handleSelect}
                  onRemove={removeFavorite}
                  onReorder={reorderFavorites}
                />
              )}
              {active === 'settings' && <SettingsPanel settings={settings} onChange={setSettings} />}
            </div>
          )}
        </main>

        <MobileNav active={active} onChange={setActive} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 pt-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 rounded-full bg-aether-500/30 px-5 py-2 text-sm font-medium text-white transition hover:bg-aether-500/50"
    >
      Try again
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppInner />
      </SettingsProvider>
    </AuthProvider>
  );
}
