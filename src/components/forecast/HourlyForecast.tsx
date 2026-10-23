import { useMemo, useRef, useState, useEffect } from 'react';
import type { HourForecast, DayForecast } from '@/types/weather';
import type { Settings } from '@/utils/formatters';
import { convertTemp, convertWind, tempUnitLabel, windUnitLabel } from '@/utils/formatters';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { conditionMeta } from '@/utils/weatherConditions';
import { cn } from '@/utils/cn';
import { Droplets, Wind, Thermometer, Eye, Sunrise, Sunset, Gauge } from 'lucide-react';

interface Props {
  hours: HourForecast[];
  days: DayForecast[];
  settings: Settings;
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

export function HourlyForecast({ hours, days, settings }: Props) {
  const dayTabs = useMemo(() => {
    const tabs: { label: string; date: number; hours: HourForecast[] }[] = [];
    for (const day of days) {
      const dayHours = hours.filter((h) => isSameDay(h.time, day.date));
      if (dayHours.length > 0) {
        tabs.push({
          label: tabs.length === 0 ? 'Today' : new Date(day.date).toLocaleDateString([], { weekday: 'short' }),
          date: day.date,
          hours: dayHours,
        });
      }
    }
    return tabs;
  }, [hours, days]);

  const [activeDay, setActiveDay] = useState(0);
  const [selected, setSelected] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setSelected(0);
  }, [activeDay]);

  const currentDayHours = dayTabs[activeDay]?.hours ?? [];
  const slice = currentDayHours;

  const temps = slice.map((h) => convertTemp(h.temperature, settings.tempUnit));
  const { min, max } = useMemo(() => {
    if (temps.length === 0) return { min: 0, max: 1 };
    const mn = Math.min(...temps);
    const mx = Math.max(...temps);
    return { min: mn, max: mx === mn ? mn + 1 : mx };
  }, [temps]);

  const currentDay = days.find((d) => isSameDay(d.date, dayTabs[activeDay]?.date ?? 0));
  const sel = slice[selected];

  useEffect(() => {
    if (selected >= 0 && cardRefs.current[selected]) {
      cardRefs.current[selected]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Hourly Forecast</h2>
        <span className="text-xs text-white/50">{slice.length} hours</span>
      </div>

      {/* Day selector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {dayTabs.map((tab, i) => {
          const isActive = i === activeDay;
          const dayData = days.find((d) => isSameDay(d.date, tab.date));
          const hi = dayData ? Math.round(convertTemp(dayData.tempMax, settings.tempUnit)) : '';
          const lo = dayData ? Math.round(convertTemp(dayData.tempMin, settings.tempUnit)) : '';
          return (
            <button
              key={tab.date}
              onClick={() => setActiveDay(i)}
              className={cn(
                'flex min-w-[72px] flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-all',
                isActive
                  ? 'glass-strong border-aether-300/40 shadow-glow'
                  : 'glass border-white/10 hover:border-white/20'
              )}
            >
              <span className={cn('text-xs font-semibold', isActive ? 'text-white' : 'text-white/60')}>
                {tab.label}
              </span>
              {dayData && (
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="font-semibold text-rose-300">{hi}°</span>
                  <span className="text-sky-300">{lo}°</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Temperature graph */}
      {slice.length > 0 && (
        <TempGraph
          hours={slice}
          settings={settings}
          min={min}
          max={max}
          selected={selected}
          onSelect={setSelected}
        />
      )}

      {/* Hourly cards scroller */}
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
        role="listbox"
        aria-label="Hourly forecast"
      >
        {slice.map((h, i) => {
          const temp = Math.round(convertTemp(h.temperature, settings.tempUnit));
          const isSel = i === selected;
          return (
            <button
              key={h.time}
              ref={(el) => { cardRefs.current[i] = el; }}
              onClick={() => setSelected(i)}
              role="option"
              aria-selected={isSel}
              className={cn(
                'flex min-w-[76px] flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center transition-all',
                isSel
                  ? 'glass-strong border-aether-300/40 shadow-glow'
                  : 'glass border-white/10 hover:border-white/20'
              )}
            >
              <span className="text-[11px] font-medium text-white/60">
                {i === 0 && activeDay === 0 ? 'Now' : new Date(h.time).toLocaleTimeString([], { hour: 'numeric' })}
              </span>
              <WeatherIcon condition={h.condition} isDay={h.isDay} className="h-7 w-7" animate={false} />
              <span className="text-base font-semibold text-white">{temp}{tempUnitLabel(settings.tempUnit)}</span>
              <span className="flex items-center gap-0.5 text-[10px] text-sky-300">
                <span className="h-1 w-1 rounded-full bg-sky-300" />
                {h.precipitationProbability}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected hour detail */}
      {sel && (
        <div className="glass-card flex flex-col gap-4 px-5 py-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <WeatherIcon condition={sel.condition} isDay={sel.isDay} className="h-12 w-12" animate />
            <div className="flex flex-col">
              <span className="text-sm text-white/50">
                {new Date(sel.time).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="font-display text-xl font-semibold text-white">
                {new Date(sel.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="text-sm text-white/60">{conditionMeta(sel.condition).label}</span>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <span className="font-display text-3xl font-bold text-white">
                {Math.round(convertTemp(sel.temperature, settings.tempUnit))}{tempUnitLabel(settings.tempUnit)}
              </span>
              <span className="text-xs text-white/50">
                Feels {Math.round(convertTemp(sel.apparentTemperature, settings.tempUnit))}{tempUnitLabel(settings.tempUnit)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Detail icon={<Thermometer className="h-4 w-4" />} label="Feels" value={`${Math.round(convertTemp(sel.apparentTemperature, settings.tempUnit))}${tempUnitLabel(settings.tempUnit)}`} />
            <Detail icon={<Wind className="h-4 w-4" />} label="Wind" value={`${Math.round(convertWind(sel.windSpeed, settings.windUnit))} ${windUnitLabel(settings.windUnit)}`} />
            <Detail icon={<Gauge className="h-4 w-4" />} label="Gusts" value={`${Math.round(convertWind(sel.windGusts, settings.windUnit))} ${windUnitLabel(settings.windUnit)}`} />
            <Detail icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${sel.humidity}%`} />
            <Detail icon={<Droplets className="h-4 w-4" />} label="Precip" value={`${sel.precipitationProbability}%`} />
            <Detail icon={<Eye className="h-4 w-4" />} label="UV" value={`${Math.round(sel.uvIndex)}`} />
          </div>

          {/* Day summary stats */}
          {currentDay && (
            <div className="border-t border-white/10 pt-3">
              <DaySummary hours={slice} day={currentDay} settings={settings} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
      <span className="text-aether-200">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

function DaySummary({ hours, day, settings }: { hours: HourForecast[]; day: DayForecast; settings: Settings }) {
  if (hours.length === 0) return null;

  const feels = hours.map((h) => convertTemp(h.apparentTemperature, settings.tempUnit));
  const winds = hours.map((h) => convertWind(h.windSpeed, settings.windUnit));
  const gusts = hours.map((h) => convertWind(h.windGusts, settings.windUnit));
  const maxPrecip = Math.max(...hours.map((h) => h.precipitationProbability));
  const rainHours = hours.filter((h) => h.precipitation > 0);
  const totalPrecip = rainHours.reduce((sum, h) => sum + h.precipitation, 0);

  const stats = [
    {
      icon: <Sunrise className="h-4 w-4" />,
      label: 'Sunrise',
      value: new Date(day.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      icon: <Sunset className="h-4 w-4" />,
      label: 'Sunset',
      value: new Date(day.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      icon: <Thermometer className="h-4 w-4" />,
      label: 'Feels Range',
      value: `${Math.round(Math.min(...feels))}–${Math.round(Math.max(...feels))}${tempUnitLabel(settings.tempUnit)}`,
    },
    {
      icon: <Wind className="h-4 w-4" />,
      label: 'Wind Range',
      value: `${Math.round(Math.min(...winds))}–${Math.round(Math.max(...winds))} ${windUnitLabel(settings.windUnit)}`,
    },
    {
      icon: <Droplets className="h-4 w-4" />,
      label: 'Peak Precip',
      value: `${maxPrecip}%`,
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: 'Rain Hours',
      value: `${rainHours.length}h / ${hours.length}h`,
    },
  ];

  if (totalPrecip > 0) {
    stats.push({
      icon: <Droplets className="h-4 w-4" />,
      label: 'Total Rain',
      value: `${totalPrecip.toFixed(1)} mm`,
    });
  }

  if (gusts.some((g) => g > 0)) {
    stats.push({
      icon: <Gauge className="h-4 w-4" />,
      label: 'Peak Gusts',
      value: `${Math.round(Math.max(...gusts))} ${windUnitLabel(settings.windUnit)}`,
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
          <span className="text-aether-200">{s.icon}</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-white/45">{s.label}</span>
            <span className="text-sm font-semibold text-white">{s.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TempGraph({
  hours,
  settings,
  min,
  max,
  selected,
  onSelect,
}: {
  hours: HourForecast[];
  settings: Settings;
  min: number;
  max: number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const width = 100;
  const height = 48;
  const n = hours.length;
  const range = max - min || 1;
  const points = hours.map((h, i) => {
    const t = convertTemp(h.temperature, settings.tempUnit);
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
    const y = height - ((t - min) / range) * (height - 6) - 3;
    return { x, y, t };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <div className="glass-card relative overflow-hidden px-4 py-3">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label="Temperature trend">
        <defs>
          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(127,191,251,0.45)" />
            <stop offset="100%" stopColor="rgba(127,191,251,0)" />
          </linearGradient>
          <linearGradient id="tempLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7fc1f5" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tempFill)" />
        <path d={path} fill="none" stroke="url(#tempLine)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <g key={i} onClick={() => onSelect(i)} className="cursor-pointer">
            <rect x={p.x - width / n / 2} y={0} width={width / n} height={height} fill="transparent" />
            {i === selected && <circle cx={p.x} cy={p.y} r="0.9" fill="#fff" stroke="#7fc1f5" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-white/40">
        <span>{Math.round(min)}°</span>
        <span>{Math.round(max)}°</span>
      </div>
    </div>
  );
}
