import { useEffect, useRef, useState } from 'react';
import { Bell, X, Check, AlertTriangle, ShieldAlert, Info, Wind, Sun, Eye, Droplets, Thermometer, CheckCheck } from 'lucide-react';
import { useNotifications, type AlertNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { WeatherAlert } from '@/types/weather';

const SEVERITY_STYLE: Record<WeatherAlert['severity'], { color: string; dot: string; label: string }> = {
  extreme: { color: 'text-rose-300', dot: 'bg-rose-400', label: 'Extreme' },
  severe: { color: 'text-amber-300', dot: 'bg-amber-400', label: 'Severe' },
  moderate: { color: 'text-yellow-200', dot: 'bg-yellow-400', label: 'Moderate' },
  minor: { color: 'text-sky-200', dot: 'bg-sky-400', label: 'Minor' },
  unknown: { color: 'text-white/70', dot: 'bg-white/50', label: 'Advisory' },
};

const ICONS: Record<string, typeof Wind> = {
  'High UV Exposure': Sun,
  'High Wind Warning': Wind,
  'Extreme Heat': Thermometer,
  'Extreme Cold': Thermometer,
  'Low Visibility': Eye,
  'Heavy Rain Expected': Droplets,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-xl glass text-white transition hover:bg-white/10"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] rounded-2xl border border-white/10 shadow-glass animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-aether-200" />
              <span className="text-sm font-semibold text-white">Alerts</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-200">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Close notifications"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-white">No alerts yet</p>
                <p className="text-xs text-white/45">
                  You'll be notified here when weather alerts are detected for your area.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkRead={() => void markAsRead(n.id)}
                  onDismiss={() => void dismiss(n.id)}
                />
              ))
            )}
          </div>

          {/* Footer — user info + sign out */}
          {user && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-xs text-white/45">Signed in as</span>
                <span className="text-xs font-medium text-white/80">{user.email}</span>
              </div>
              <button
                onClick={() => void signOut()}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification: n,
  onMarkRead,
  onDismiss,
}: {
  notification: AlertNotification;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const style = SEVERITY_STYLE[n.severity] ?? SEVERITY_STYLE.unknown;
  const Icon = ICONS[n.title] ?? AlertTriangle;

  return (
    <div
      className={cn(
        'flex items-start gap-3 border-b border-white/5 px-4 py-3 transition-colors',
        !n.is_read && 'bg-aether-500/[0.06]'
      )}
    >
      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5', style.color)}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{n.title}</span>
          {!n.is_read && <span className={cn('h-2 w-2 rounded-full', style.dot)} />}
        </div>
        <p className="text-xs text-white/60">{n.description}</p>
        <div className="flex items-center gap-2 text-[11px] text-white/40">
          <span className="flex items-center gap-0.5">
            <Info className="h-3 w-3" />
            {n.location_name}
          </span>
          <span>·</span>
          <span>{timeAgo(n.created_at)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        {!n.is_read && (
          <button
            onClick={onMarkRead}
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
