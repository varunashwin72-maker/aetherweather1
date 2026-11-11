import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudHail,
} from 'lucide-react';
import type { WeatherCondition } from '@/types/weather';
import { weatherIconKey } from '@/utils/weatherConditions';

interface Props {
  condition: WeatherCondition;
  isDay?: boolean;
  className?: string;
  animate?: boolean;
}

export function WeatherIcon({ condition, isDay = true, className = '', animate = true }: Props) {
  const key = weatherIconKey(condition, isDay);

  switch (key) {
    case 'sun':
      return (
        <div className={`relative ${className}`}>
          <div className={`absolute inset-0 rounded-full bg-amber-300/20 blur-xl ${animate ? 'animate-breathe' : ''}`} />
          <Sun
            className={`relative h-full w-full text-amber-300 ${animate ? 'animate-spin-slow' : ''}`}
            strokeWidth={1.6}
          />
        </div>
      );
    case 'moon':
      return (
        <div className={`relative ${className}`}>
          <div className={`absolute inset-0 rounded-full bg-slate-100/10 blur-lg ${animate ? 'animate-breathe' : ''}`} />
          <Moon className={`relative h-full w-full text-slate-100 ${animate ? 'animate-float' : ''}`} strokeWidth={1.6} />
        </div>
      );
    case 'cloud-sun':
      return (
        <div className={`relative ${className}`}>
          <Sun
            className={`absolute -top-2 -right-1 h-1/2 w-1/2 text-amber-200 ${animate ? 'animate-spin-slow' : ''}`}
            strokeWidth={1.8}
          />
          <CloudSun
            className={`relative h-full w-full text-amber-200 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
        </div>
      );
    case 'cloud-moon':
      return (
        <div className={`relative ${className}`}>
          <Moon
            className={`absolute -top-1 -right-1 h-2/5 w-2/5 text-slate-100 ${animate ? 'animate-float' : ''}`}
            strokeWidth={1.8}
          />
          <CloudMoon
            className={`relative h-full w-full text-slate-100 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
        </div>
      );
    case 'cloud':
      return (
        <Cloud
          className={`${className} text-slate-200 ${animate ? 'animate-drift-slow' : ''}`}
          strokeWidth={1.6}
        />
      );
    case 'fog':
      return (
        <CloudFog
          className={`${className} text-slate-300 ${animate ? 'animate-sway' : ''}`}
          strokeWidth={1.6}
        />
      );
    case 'drizzle':
      return (
        <div className={`relative ${className}`}>
          <CloudDrizzle
            className={`relative h-full w-full text-sky-200 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
          {animate && (
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-1.5 w-0.5 rounded-full bg-sky-300 animate-rain-fall" style={{ animationDelay: '0s' }} />
          )}
          {animate && (
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-1.5 w-0.5 rounded-full bg-sky-300 animate-rain-fall" style={{ animationDelay: '0.3s' }} />
          )}
          {animate && (
            <div className="pointer-events-none absolute bottom-0 left-3/4 h-1.5 w-0.5 rounded-full bg-sky-300 animate-rain-fall" style={{ animationDelay: '0.6s' }} />
          )}
        </div>
      );
    case 'rain':
      return (
        <div className={`relative ${className}`}>
          <CloudRain
            className={`relative h-full w-full text-sky-300 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
          {animate && (
            <>
              <div className="pointer-events-none absolute -bottom-1 left-1/4 h-2 w-0.5 rounded-full bg-sky-400 animate-rain-fall" style={{ animationDelay: '0s' }} />
              <div className="pointer-events-none absolute -bottom-1 left-1/2 h-2 w-0.5 rounded-full bg-sky-400 animate-rain-fall" style={{ animationDelay: '0.2s' }} />
              <div className="pointer-events-none absolute -bottom-1 left-2/3 h-2 w-0.5 rounded-full bg-sky-400 animate-rain-fall" style={{ animationDelay: '0.4s' }} />
              <div className="pointer-events-none absolute -bottom-1 left-3/4 h-2 w-0.5 rounded-full bg-sky-400 animate-rain-fall" style={{ animationDelay: '0.6s' }} />
            </>
          )}
        </div>
      );
    case 'snow':
      return (
        <div className={`relative ${className}`}>
          <CloudSnow
            className={`relative h-full w-full text-sky-100 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
          {animate && (
            <>
              <div className="pointer-events-none absolute -bottom-0.5 left-1/3 h-1.5 w-1.5 rounded-full bg-white/80 animate-snow-fall" style={{ animationDelay: '0s' }} />
              <div className="pointer-events-none absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 rounded-full bg-white/80 animate-snow-fall" style={{ animationDelay: '0.8s' }} />
              <div className="pointer-events-none absolute -bottom-0.5 left-2/3 h-1.5 w-1.5 rounded-full bg-white/80 animate-snow-fall" style={{ animationDelay: '1.5s' }} />
            </>
          )}
        </div>
      );
    case 'thunderstorm':
      return (
        <div className={`relative ${className}`}>
          <div className={`absolute inset-0 rounded-full bg-amber-400/10 blur-lg ${animate ? 'animate-flash' : ''}`} />
          <CloudLightning
            className={`relative h-full w-full text-amber-300 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
        </div>
      );
    case 'hail':
      return (
        <div className={`relative ${className}`}>
          <CloudHail
            className={`relative h-full w-full text-sky-200 ${animate ? 'animate-drift-slow' : ''}`}
            strokeWidth={1.6}
          />
        </div>
      );
    default:
      return <Cloud className={`${className} text-slate-200`} strokeWidth={1.6} />;
  }
}
