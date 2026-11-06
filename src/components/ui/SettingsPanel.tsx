import { Thermometer, Wind, Palette, Sparkles, RefreshCw, Bell, Eye, Moon, User, LogOut, Mail, Cloud, Smartphone, BellRing, LogIn } from 'lucide-react';
import type { Settings } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/utils/cn';

interface Props {
  settings: Settings;
  onChange: (s: Partial<Settings>) => void;
  pushSupported: boolean;
  pushEnabled: boolean;
  onSubscribe: () => Promise<boolean>;
  onUnsubscribe: () => Promise<boolean>;
  onOpenAuth: () => void;
}

export function SettingsPanel({
  settings,
  onChange,
  pushSupported,
  pushEnabled,
  onSubscribe,
  onUnsubscribe,
  onOpenAuth,
}: Props) {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Settings</h2>
        <span className="text-xs text-white/50">Stored on this device</span>
      </div>

      {/* User profile or sign-in prompt */}
      {user ? (
        <div className="glass-card flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center gap-2 text-white">
            <span className="text-aether-200"><User className="h-4 w-4" /></span>
            <span className="text-sm font-semibold">Account</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-aether-400 to-aether-600 shadow-glow">
              <Cloud className="h-6 w-6 text-white" strokeWidth={2.2} />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Mail className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <span className="truncate">{user.email}</span>
              </span>
              <span className="text-xs text-white/45">
                {notifications.length} alert{notifications.length !== 1 ? 's' : ''}
                {unreadCount > 0 && <> · <span className="text-rose-300">{unreadCount} unread</span></>}
              </span>
            </div>
          </div>
          <button
            onClick={() => void signOut()}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      ) : (
        <div className="glass-card flex flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-2 text-white">
            <span className="text-aether-200"><Cloud className="h-4 w-4" /></span>
            <span className="text-sm font-semibold">Account</span>
          </div>
          <p className="text-xs leading-relaxed text-white/55">
            Sign in to sync your favorite places across devices and receive early weather
            alert push notifications on this device.
          </p>
          <button
            onClick={onOpenAuth}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aether-500 to-aether-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:from-aether-400 hover:to-aether-500"
          >
            <LogIn className="h-4 w-4" />
            Sign In or Create Account
          </button>
        </div>
      )}

      <Section icon={<Thermometer className="h-4 w-4" />} title="Temperature">
        <Segmented
          value={settings.tempUnit}
          options={[{ v: 'celsius', l: 'Celsius °C' }, { v: 'fahrenheit', l: 'Fahrenheit °F' }]}
          onChange={(v) => onChange({ tempUnit: v as Settings['tempUnit'] })}
        />
      </Section>

      <Section icon={<Wind className="h-4 w-4" />} title="Wind">
        <Segmented
          value={settings.windUnit}
          options={[{ v: 'kmh', l: 'km/h' }, { v: 'mph', l: 'mph' }, { v: 'ms', l: 'm/s' }]}
          onChange={(v) => onChange({ windUnit: v as Settings['windUnit'] })}
        />
      </Section>

      <Section icon={<Palette className="h-4 w-4" />} title="Theme">
        <Segmented
          value={settings.theme}
          options={[{ v: 'dark', l: 'Dark' }, { v: 'light', l: 'Light' }, { v: 'auto', l: 'Auto' }]}
          onChange={(v) => onChange({ theme: v as Settings['theme'] })}
        />
      </Section>

      <Section icon={<Sparkles className="h-4 w-4" />} title="Animations">
        <Segmented
          value={settings.animations}
          options={[{ v: 'full', l: 'Full' }, { v: 'reduced', l: 'Reduced' }, { v: 'off', l: 'Off' }]}
          onChange={(v) => onChange({ animations: v as Settings['animations'] })}
        />
        <p className="mt-2 text-xs text-white/45">
          Reduced motion is also applied automatically when your system requests it.
        </p>
      </Section>

      <Section icon={<Eye className="h-4 w-4" />} title="Background effects">
        <Toggle
          checked={settings.backgroundEffects}
          onChange={(v) => onChange({ backgroundEffects: v })}
          label="Animated weather background"
        />
      </Section>

      <Section icon={<RefreshCw className="h-4 w-4" />} title="Auto-refresh">
        <Segmented
          value={String(settings.autoRefreshMinutes)}
          options={[{ v: '5', l: '5 min' }, { v: '10', l: '10 min' }, { v: '30', l: '30 min' }]}
          onChange={(v) => onChange({ autoRefreshMinutes: Number(v) })}
        />
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <Toggle
          checked={settings.notifications}
          onChange={(v) => onChange({ notifications: v })}
          label="Weather alerts"
        />
        <p className="mt-2 text-xs text-white/45">
          Browser notifications require permission and will be requested when enabled.
        </p>
      </Section>

      {/* Push notifications for saved locations */}
      <Section icon={<BellRing className="h-4 w-4" />} title="Early alert reminders">
        {user ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/55">
              Get push notifications on this device for weather alerts across all your favorite
              places and your last searched location — even when the tab isn't open.
            </p>
            {pushSupported ? (
              <Toggle
                checked={pushEnabled}
                onChange={(v) => { void (v ? onSubscribe() : onUnsubscribe()); }}
                label={pushEnabled ? 'Push alerts enabled on this device' : 'Enable push alerts on this device'}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-white/45">
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                Push notifications aren't supported on this browser.
              </div>
            )}
            {pushEnabled && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200">
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                This device will receive early weather alerts for your saved locations.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/55">
              Sign in to enable push notifications for weather alerts across all your saved locations.
            </p>
            <button
              onClick={onOpenAuth}
              className="flex items-center justify-center gap-2 rounded-xl border border-aether-300/30 bg-aether-500/20 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-aether-500/40"
            >
              <LogIn className="h-4 w-4" />
              Sign in to enable
            </button>
          </div>
        )}
      </Section>

      <div className="glass-card flex items-center gap-3 px-4 py-3 text-xs text-white/50">
        <Moon className="h-4 w-4 text-aether-200" />
        {user
          ? 'Your alerts, saved locations, and device push subscriptions are synced to your account. Other preferences are stored locally on this device.'
          : 'AetherWeather stores your preferences and favorites locally on this device. Sign in to sync across devices.'}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-2 text-white">
        <span className="text-aether-200">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all',
            value === o.v ? 'bg-aether-500/30 text-white shadow-glow' : 'text-white/60 hover:text-white'
          )}
          aria-pressed={value === o.v}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3"
      role="switch"
      aria-checked={checked}
    >
      <span className="text-sm text-white/80">{label}</span>
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-aether-500/60' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  );
}
