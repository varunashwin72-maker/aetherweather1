import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import webPush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SECRET_KEY') ?? '';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:alerts@aetherweather.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface SavedLocation {
  user_id: string;
  location_id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // VAPID public key endpoint — the frontend calls this to subscribe
    if (url.pathname.endsWith('/vapid')) {
      return new Response(
        JSON.stringify({ publicKey: VAPID_PUBLIC_KEY || null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Fetch all saved locations across all users
    const { data: locations, error: locError } = await supabase
      .from('user_saved_locations')
      .select('user_id, location_id, name, region, country, latitude, longitude');

    if (locError || !locations) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch locations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedLocs = locations as SavedLocation[];
    const stats = { checked: 0, alerts: 0, pushed: 0, errors: 0 };

    // Group locations by user for push delivery
    const userLocationMap = new Map<string, SavedLocation[]>();
    for (const loc of typedLocs) {
      stats.checked++;
      const arr = userLocationMap.get(loc.user_id) ?? [];
      arr.push(loc);
      userLocationMap.set(loc.user_id, arr);
    }

    // Check weather for each unique location and generate alerts
    for (const [userId, userLocs] of userLocationMap) {
      for (const loc of userLocs) {
        try {
          const alerts = await checkWeatherAlerts(loc.latitude, loc.longitude, loc.location_id, loc.name);

          for (const alert of alerts) {
            const alertKey = `${alert.type}:${loc.location_id}`;

            // Check if we already notified this user about this alert
            const { data: existing } = await supabase
              .from('user_alert_check_log')
              .select('id')
              .eq('user_id', userId)
              .eq('alert_key', alertKey)
              .maybeSingle();

            if (existing) continue;

            // Persist the notification to user_alert_notifications
            await supabase.from('user_alert_notifications').upsert(
              {
                user_id: userId,
                alert_id: alertKey,
                title: alert.title,
                description: alert.description,
                severity: alert.severity,
                location_name: loc.name,
              },
              { onConflict: 'user_id,alert_id', ignoreDuplicates: true }
            );

            // Log that we've notified about this alert
            await supabase.from('user_alert_check_log').upsert(
              {
                user_id: userId,
                alert_key: alertKey,
                location_id: loc.location_id,
              },
              { onConflict: 'user_id,alert_key', ignoreDuplicates: true }
            );

            stats.alerts++;

            // Send push notifications to all of this user's devices
            if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
              const { data: subs } = await supabase
                .from('user_push_subscriptions')
                .select('endpoint, p256dh, auth')
                .eq('user_id', userId);

              if (subs) {
                for (const sub of subs as PushSubscriptionRow[]) {
                  try {
                    await webPush.sendNotification(
                      {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                      },
                      JSON.stringify({
                        title: alert.title,
                        body: `${alert.description} (${loc.name})`,
                        icon: '/favicon.ico',
                        badge: '/favicon.ico',
                        tag: alertKey,
                      })
                    );
                    stats.pushed++;
                  } catch (err) {
                    // 410 Gone = subscription expired; remove it
                    if (err instanceof webPush.WebPushError && err.statusCode === 410) {
                      await supabase
                        .from('user_push_subscriptions')
                        .delete()
                        .eq('user_id', userId)
                        .eq('endpoint', sub.endpoint);
                    }
                    stats.errors++;
                  }
                }
              }
            }
          }
        } catch {
          stats.errors++;
        }
      }
    }

    // Clean up stale check log entries older than 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('user_alert_check_log').delete().lt('notified_at', cutoff);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface DerivedAlert {
  type: string;
  title: string;
  description: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';
}

async function checkWeatherAlerts(
  lat: number,
  lon: number,
  locationId: string,
  locationName: string
): Promise<DerivedAlert[]> {
  const alerts: DerivedAlert[] = [];

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'wind_gusts_10m',
      'visibility',
      'uv_index',
      'precipitation',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
    ].join(','),
    timezone: 'auto',
    forecast_days: '1',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) return alerts;

  const data = await res.json();
  const current = data.current;
  const daily = data.daily;

  if (!current) return alerts;

  if (current.uv_index >= 8) {
    alerts.push({
      type: 'uv',
      title: 'High UV Exposure',
      description: `UV index is ${Math.round(current.uv_index)} in ${locationName}. Limit direct sun exposure and use protection.`,
      severity: current.uv_index >= 11 ? 'extreme' : 'severe',
    });
  }

  if (current.wind_speed_10m >= 60) {
    alerts.push({
      type: 'wind',
      title: 'High Wind Warning',
      description: `Sustained winds near ${Math.round(current.wind_speed_10m)} km/h with gusts up to ${Math.round(current.wind_gusts_10m)} km/h in ${locationName}.`,
      severity: current.wind_speed_10m >= 90 ? 'severe' : 'moderate',
    });
  }

  if (daily?.temperature_2m_max?.[0] >= 37) {
    alerts.push({
      type: 'heat',
      title: 'Extreme Heat',
      description: `High of ${Math.round(daily.temperature_2m_max[0])}°C expected in ${locationName}. Stay hydrated and avoid prolonged sun exposure.`,
      severity: daily.temperature_2m_max[0] >= 40 ? 'extreme' : 'severe',
    });
  }

  if (daily?.temperature_2m_max?.[0] <= -5) {
    alerts.push({
      type: 'cold',
      title: 'Extreme Cold',
      description: `High of only ${Math.round(daily.temperature_2m_max[0])}°C in ${locationName}. Dress warmly and limit time outdoors.`,
      severity: daily.temperature_2m_max[0] <= -15 ? 'extreme' : 'severe',
    });
  }

  if (current.visibility > 0 && current.visibility < 1000) {
    alerts.push({
      type: 'vis',
      title: 'Low Visibility',
      description: `Visibility reduced to ${Math.round(current.visibility)} m in ${locationName}. Drive with caution.`,
      severity: 'moderate',
    });
  }

  if (daily?.precipitation_probability_max?.[0] >= 70 && current.precipitation > 0) {
    alerts.push({
      type: 'rain',
      title: 'Heavy Rain Expected',
      description: `${daily.precipitation_probability_max[0]}% chance of precipitation in ${locationName}. Plan accordingly.`,
      severity: 'minor',
    });
  }

  return alerts;
}
