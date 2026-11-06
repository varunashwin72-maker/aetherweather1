import { useCallback, useEffect, useRef } from 'react';
import type { GeoLocation } from '@/types/weather';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface SavedLocationRow {
  location_id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

function toGeoLocation(row: SavedLocationRow): GeoLocation {
  return {
    id: row.location_id,
    name: row.name,
    region: row.region ?? undefined,
    country: row.country ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export function useSavedLocations(
  favorites: GeoLocation[],
  lastSearched: GeoLocation | null
) {
  const { user } = useAuth();
  const syncRef = useRef(0);

  // Upsert favorites + last-searched into user_saved_locations
  const sync = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    const rows: {
      user_id: string;
      location_id: string;
      name: string;
      region: string | null;
      country: string | null;
      latitude: number;
      longitude: number;
      is_favorite: boolean;
      is_last_searched: boolean;
      updated_at: string;
    }[] = [];

    for (const f of favorites) {
      rows.push({
        user_id: user.id,
        location_id: f.id,
        name: f.name,
        region: f.region ?? null,
        country: f.country ?? null,
        latitude: f.latitude,
        longitude: f.longitude,
        is_favorite: true,
        is_last_searched: false,
        updated_at: new Date().toISOString(),
      });
    }

    if (lastSearched) {
      rows.push({
        user_id: user.id,
        location_id: lastSearched.id,
        name: lastSearched.name,
        region: lastSearched.region ?? null,
        country: lastSearched.country ?? null,
        latitude: lastSearched.latitude,
        longitude: lastSearched.longitude,
        is_favorite: favorites.some((f) => f.id === lastSearched.id),
        is_last_searched: true,
        updated_at: new Date().toISOString(),
      });
    }

    if (rows.length === 0) return;

    try {
      // Clear is_last_searched flag for all other locations, then upsert
      await supabase
        .from('user_saved_locations')
        .update({ is_last_searched: false })
        .eq('user_id', user.id)
        .neq('location_id', lastSearched?.id ?? '__none__');

      await supabase
        .from('user_saved_locations')
        .upsert(rows, {
          onConflict: 'user_id,location_id',
          ignoreDuplicates: false,
        });
    } catch {
      /* non-critical — sync is best-effort */
    }
  }, [user, favorites, lastSearched]);

  useEffect(() => {
    syncRef.current += 1;
    const current = syncRef.current;
    const timer = setTimeout(() => {
      if (current === syncRef.current) void sync();
    }, 1500);
    return () => clearTimeout(timer);
  }, [sync]);

  // Remove locations that are no longer in favorites and not last-searched
  const prune = useCallback(
    async (activeIds: Set<string>) => {
      if (!user || !isSupabaseConfigured) return;
      try {
        const { data } = await supabase
          .from('user_saved_locations')
          .select('id, location_id, is_last_searched')
          .eq('user_id', user.id);

        if (!data) return;
        const toDelete = (data as { id: string; location_id: string; is_last_searched: boolean }[])
          .filter((r) => !activeIds.has(r.location_id) && !r.is_last_searched)
          .map((r) => r.id);

        if (toDelete.length > 0) {
          await supabase.from('user_saved_locations').delete().in('id', toDelete);
        }
      } catch {
        /* non-critical */
      }
    },
    [user]
  );

  useEffect(() => {
    const activeIds = new Set(favorites.map((f) => f.id));
    if (lastSearched) activeIds.add(lastSearched.id);
    void prune(activeIds);
  }, [favorites, lastSearched, prune]);

  // Fetch all saved locations for this user (used by the alert checker)
  const fetchAllLocations = useCallback(async (): Promise<GeoLocation[]> => {
    if (!user || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('user_saved_locations')
        .select('location_id, name, region, country, latitude, longitude')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error || !data) return [];
      return (data as SavedLocationRow[]).map(toGeoLocation);
    } catch {
      return [];
    }
  }, [user]);

  return { sync, fetchAllLocations };
}
