import { useCallback, useEffect, useState } from 'react';
import type { GeoLocation } from '@/types/weather';
import { ApiError } from '@/lib/api';
import { reverseGeocode, searchLocations } from '@/services/locationApi';

function isGeolocationError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    typeof (e as { code: unknown }).code === 'number' &&
    'message' in e
  );
}

function geolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location access was denied. Search for a city instead, or allow location access in your browser settings.';
    case 2:
      return 'Your location could not be determined. Check that location services are enabled on your device.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'Location access was denied. Search for a city instead, or allow location access in your browser settings.';
  }
}

export function useGeolocation() {
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!('permissions' in navigator)) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        if (cancelled) return;
        if (result.state === 'granted') setPermission('granted');
        else if (result.state === 'denied') setPermission('denied');
        else setPermission('prompt');
        result.onchange = () => {
          if (cancelled) return;
          if (result.state === 'granted') setPermission('granted');
          else if (result.state === 'denied') setPermission('denied');
          else setPermission('prompt');
        };
      })
      .catch(() => {
        /* permissions API not supported, leave as 'unknown' */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestCurrent = useCallback(async (): Promise<GeoLocation> => {
    if (!('geolocation' in navigator)) {
      throw new ApiError('permission', 'Geolocation is not available on this device.');
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        });
      });
      setPermission('granted');
      const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      return loc;
    } catch (e) {
      if (isGeolocationError(e)) {
        const code = (e as { code: number }).code;
        setPermission('denied');
        throw new ApiError('permission', geolocationErrorMessage(code));
      }
      throw e;
    } finally {
      setLocating(false);
    }
  }, []);

  return { permission, locating, requestCurrent };
}

export function useLocationSearch() {
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchLocations(query);
      setResults(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => setResults([]);
  }, []);

  return { results, loading, error, search, setResults };
}
