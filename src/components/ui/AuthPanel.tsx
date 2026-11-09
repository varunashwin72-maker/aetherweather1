import { useState, type FormEvent } from 'react';
import { Cloud, Mail, Lock, Loader2, AlertCircle, ArrowRight, X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AuthPanel({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error);
        else handleClose();
      } else {
        const { error, sessionCreated } = await signUp(email, password);
        if (error) {
          setError(error);
        } else if (sessionCreated) {
          // Email confirmation is off — user is already logged in
          handleClose();
        } else {
          setSuccess('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
          setPassword('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to AetherWeather"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-aether-400 to-aether-600 shadow-glow">
              <Cloud className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Aether<span className="text-aether-300">Weather</span>
              </h2>
              <p className="text-xs text-white/50">
                {mode === 'signin' ? 'Sign in for saved-location alerts' : 'Create an account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-6 py-8">
          {/* Info banner */}
          <div className="mb-6 rounded-2xl border border-aether-300/20 bg-aether-500/10 px-4 py-3.5">
            <p className="text-sm leading-relaxed text-white/70">
              The weather app works without signing in. Create an account to sync your
              favorite places across devices and receive early weather alert push notifications.
            </p>
          </div>

          {/* Mode tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  mode === m ? 'bg-aether-500/30 text-white shadow-glow' : 'text-white/60 hover:text-white'
                )}
              >
                {m === 'signin' ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 animate-fade-in">
              <span className="flex-1">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-fade-in">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-medium uppercase tracking-wider text-white/50">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-aether-300/40">
                <Mail className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-medium uppercase tracking-wider text-white/50">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-aether-300/40">
                <Lock className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aether-500 to-aether-600 px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:from-aether-400 hover:to-aether-500 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            {mode === 'signin'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null); }}
              className="font-medium text-aether-300 hover:text-aether-200"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
