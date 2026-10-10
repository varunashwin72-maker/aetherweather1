import type { GeoLocation } from '@/types/weather';
import { ApiError, safeFetchJson } from '@/lib/api';
import { config, OPEN_METEO_GEO_BASE } from '@/lib/config';
import { owSearchLocations, owReverseGeocode } from '@/services/openWeatherApi';

interface OpenMeteoGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoResult[];
}

interface BigDataCloudResult {
  city?: string;
  locality?: string;
  principalLocality?: string;
  localityInfo?: { administrative?: { name?: string }[] };
  countryName?: string;
  countryCode?: string;
}

export async function searchLocations(query: string, count = 8): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (config.weatherApiProvider === 'openweather' && config.weatherApiKey) {
    return owSearchLocations(trimmed, count);
  }

  const url = `${OPEN_METEO_GEO_BASE}/search?name=${encodeURIComponent(
    trimmed
  )}&count=${count}&language=en&format=json`;
  try {
    const data = await safeFetchJson<OpenMeteoGeoResponse>(url);
    return (data.results ?? []).map(mapGeo);
  } catch (e) {
    if (e instanceof ApiError && e.type === 'not-found') return [];
    throw e;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  if (config.weatherApiProvider === 'openweather' && config.weatherApiKey) {
    return owReverseGeocode(lat, lon);
  }

  // Open-Meteo's geocoding API does not support reverse lookups, so we use
  // BigDataCloud's free reverse-geocode endpoint to get a place name.
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(6)}&longitude=${lon.toFixed(6)}&localityLanguage=en`;
    const data = await safeFetchJson<BigDataCloudResult>(url);
    const name = data.city || data.locality || data.principalLocality || '';
    const region = data.localityInfo?.administrative?.[0]?.name;
    if (name) {
      return {
        id: `geo-${lat.toFixed(4)}-${lon.toFixed(4)}`,
        name,
        region,
        country: data.countryName,
        latitude: lat,
        longitude: lon,
      };
    }
  } catch {
    /* fall through to coordinates */
  }

  return {
    id: `geo-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    latitude: lat,
    longitude: lon,
  };
}

export function mapGeo(r: OpenMeteoGeoResult): GeoLocation {
  return {
    id: `om-${r.id}`,
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  };
}
