import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Manages Web Push subscriptions for the current device.
 * The VAPID public key is fetched from the check-alerts edge function
 * endpoint metadata (stored as an edge function secret on the server).
 *
 * Returns helpers to subscribe/unsubscribe the current device and a
 * `pushEnabled` flag reflecting whether this device is actively subscribed.
 */
export function usePushNotifications(notificationsEnabled: boolean) {
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported] = useState(
    () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  );

  // Determine the VAPID public key from the app config endpoint
  const getVapidKey = useCallback(async (): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-alerts/vapid`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.publicKey ?? null;
    } catch {
      return null;
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !pushSupported || !isSupabaseConfigured) return false;

    try {
      const publicKey = await getVapidKey();
      if (!publicKey) return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;

      if (!endpoint || !p256dh || !auth) return false;

      const { error } = await supabase.from('user_push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          device_label: navigator.userAgent ? shortenUA(navigator.userAgent) : 'Unknown device',
        },
        { onConflict: 'endpoint' }
      );

      if (error) return false;
      setPushEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, [user, pushSupported, getVapidKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !pushSupported || !isSupabaseConfigured) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase
          .from('user_push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', endpoint);
      }
      setPushEnabled(false);
      return true;
    } catch {
      return false;
    }
  }, [user, pushSupported]);

  // Check existing subscription on mount
  useEffect(() => {
    if (!pushSupported || !user || !isSupabaseConfigured) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch {
        setPushEnabled(false);
      }
    })();
  }, [user, pushSupported]);

  return { pushSupported, pushEnabled, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function shortenUA(ua: string): string {
  const browser = /Chrome|Firefox|Safari|Edge|Opera/i.exec(ua)?.[0] ?? 'Browser';
  const os = /Windows|Mac|iPhone|iPad|Android|Linux/i.exec(ua)?.[0] ?? 'Device';
  return `${browser} on ${os}`;
}
