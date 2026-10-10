import { useState, type FormEvent } from 'react';
import { Cloud, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { WeatherBackground } from '@/components/weather/WeatherBackground';
import { cn } from '@/utils/cn';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error);
        } else {
          setSuccess('Account created! You can now sign in.');
          setMode('signin');
          setPassword('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <WeatherBackground condition="partly-cloudy" isDay motion="full" enabled />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-aether-400 to-aether-600 shadow-glow">
              <Cloud className="h-7 w-7 text-white" strokeWidth={2.2} />
            </span>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                Aether<span className="text-aether-300">Weather</span>
              </h1>
              <p className="mt-1 text-sm text-white/50">Sign in to get alerts for your area</p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl border border-white/10 p-6 shadow-glass sm:p-8">
            {/* Mode tabs */}
            <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                    mode === m ? 'bg-aether-500/30 text-white shadow-glow' : 'text-white/60 hover:text-white'
                  )}
                >
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
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-white/50">
                  Email
                </label>
                <div className="glass flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 transition-colors focus-within:border-aether-300/40">
                  <Mail className="h-4 w-4 shrink-0 text-white/40" />
                  <input
                    id="email"
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
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-white/50">
                  Password
                </label>
                <div className="glass flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 transition-colors focus-within:border-aether-300/40">
                  <Lock className="h-4 w-4 shrink-0 text-white/40" />
                  <input
                    id="password"
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
      </div>
    </div>
  );
}
