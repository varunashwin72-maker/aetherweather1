import { useMemo } from 'react';
import { Droplets, Wind, Thermometer, Eye } from 'lucide-react';
import type { DayForecast, HourForecast } from '@/types/weather';
import type { Settings } from '@/utils/formatters';
import { convertTemp, convertWind, tempUnitLabel, windUnitLabel } from '@/utils/formatters';
import { WeatherIcon } from '@/components/weather/WeatherIcon';

interface Props {
  day: DayForecast;
  hours: HourForecast[];
  settings: Settings;
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

export function DayHourlyDetail({ day, hours, settings }: Props) {
  const dayHours = useMemo(() => hours.filter((h) => isSameDay(h.time, day.date)), [hours, day.date]);

  if (dayHours.length === 0) {
    return (
      <p className="px-4 pb-4 text-sm text-white/45">
        Hour-by-hour data is not available for this day yet.
      </p>
    );
  }

  const temps = dayHours.map((h) => convertTemp(h.temperature, settings.tempUnit));
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div className="flex flex-col gap-3 px-2 pb-4 pt-1 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {dayHours.map((h) => {
          const temp = Math.round(convertTemp(h.temperature, settings.tempUnit));
          const tempPct = ((convertTemp(h.temperature, settings.tempUnit) - minTemp) / tempRange) * 100;
          return (
            <div
              key={h.time}
              className="flex min-w-[68px] flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] px-2.5 py-2.5 text-center transition-colors hover:bg-white/[0.08]"
            >
              <span className="text-[10px] font-medium text-white/55">
                {new Date(h.time).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
              </span>
              <WeatherIcon condition={h.condition} isDay={h.isDay} className="h-6 w-6" animate={false} />
              <span className="text-sm font-semibold text-white">
                {temp}
                <span className="text-[10px] text-white/50">{tempUnitLabel(settings.tempUnit)}</span>
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-sky-300">
                <Droplets className="h-2.5 w-2.5" />
                {h.precipitationProbability}%
              </span>
              <div className="mt-0.5 h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full bg-gradient-to-r from-sky-400 to-amber-300"
                  style={{ width: `${Math.max(8, tempPct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <DaySummary hours={dayHours} settings={settings} />
    </div>
  );
}

function DaySummary({ hours, settings }: { hours: HourForecast[]; settings: Settings }) {
  if (hours.length === 0) return null;

  const temps = hours.map((h) => convertTemp(h.temperature, settings.tempUnit));
  const feels = hours.map((h) => convertTemp(h.apparentTemperature, settings.tempUnit));
  const winds = hours.map((h) => convertWind(h.windSpeed, settings.windUnit));
  const gusts = hours.map((h) => convertWind(h.windGusts, settings.windUnit));
  const maxPrecip = Math.max(...hours.map((h) => h.precipitationProbability));

  const rainHours = hours.filter((h) => h.precipitation > 0);
  const totalPrecip = rainHours.reduce((sum, h) => sum + h.precipitation, 0);

  const stats = [
    {
      icon: <Thermometer className="h-4 w-4" />,
      label: 'Feels Like',
      value: `${Math.round(Math.min(...feels))}–${Math.round(Math.max(...feels))}${tempUnitLabel(settings.tempUnit)}`,
    },
    {
      icon: <Wind className="h-4 w-4" />,
      label: 'Wind Range',
      value: `${Math.round(Math.min(...winds))}–${Math.round(Math.max(...winds))} ${windUnitLabel(settings.windUnit)}`,
    },
    {
      icon: <Droplets className="h-4 w-4" />,
      label: 'Peak Precip Chance',
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
      label: 'Total Rainfall',
      value: `${totalPrecip.toFixed(1)} mm`,
    });
  }

  if (gusts.some((g) => g > 0)) {
    stats.push({
      icon: <Wind className="h-4 w-4" />,
      label: 'Peak Gusts',
      value: `${Math.round(Math.max(...gusts))} ${windUnitLabel(settings.windUnit)}`,
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-3 lg:grid-cols-4">
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
