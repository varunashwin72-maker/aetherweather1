import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { WeatherAlert, GeoLocation } from '@/types/weather';

/**
 * Watches weather alerts for the active location and:
 * 1. Persists new alerts to the user_alert_notifications table (via upsert)
 * 2. Fires browser notifications if permission is granted and setting is on
 */
export function useAlertNotifier(
  alerts: WeatherAlert[],
  location: GeoLocation,
  notificationsEnabled: boolean
) {
  const { user } = useAuth();
  const lastAlertIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    // Skip the very first run — we don't want to notify on alerts that were
    // already present when the page loaded. Only notify on NEW alerts that
    // appear after initial load.
    if (!initialized.current) {
      lastAlertIds.current = new Set(alerts.map((a) => a.id));
      initialized.current = true;
      return;
    }

    const currentIds = new Set(alerts.map((a) => a.id));
    const newAlerts = alerts.filter((a) => !lastAlertIds.current.has(a.id));

    if (newAlerts.length === 0) {
      lastAlertIds.current = currentIds;
      return;
    }

    lastAlertIds.current = currentIds;

    // Persist new alerts to database (upsert to avoid duplicates)
    void persistAlerts(newAlerts, user.id, location.name);

    // Fire browser notifications
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      for (const alert of newAlerts) {
        const severityLabel = alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1);
        const body = `${severityLabel}: ${alert.description} (${location.name})`;
        try {
          new Notification(alert.title, { body, icon: '/favicon.ico' });
        } catch {
          /* notifications may not be available in all contexts */
        }
      }
    }
  }, [alerts, user, location.name, notificationsEnabled]);
}

async function persistAlerts(alerts: WeatherAlert[], userId: string, locationName: string) {
  if (!isSupabaseConfigured) return;
  try {
    const rows = alerts.map((a) => ({
      user_id: userId,
      alert_id: a.id,
      title: a.title,
      description: a.description,
      severity: a.severity,
      location_name: locationName,
    }));

    const { error } = await supabase
      .from('user_alert_notifications')
      .upsert(rows, { onConflict: 'user_id,alert_id', ignoreDuplicates: true });

    if (error) {
      // Silently ignore — notifications persistence is non-critical
    }
  } catch {
    /* non-critical */
  }
}
