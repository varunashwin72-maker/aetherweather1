import { useMemo } from 'react';
import { Sunrise, Sunset, Sun, Moon } from 'lucide-react';
import type { AstronomyData } from '@/types/weather';
import { moonPhaseName } from '@/services/weatherApi';

interface Props {
  astronomy: AstronomyData;
}

export function SunMoonPanel({ astronomy }: Props) {
  const now = Date.now();
  const dayProgress = useMemo(() => {
    if (now < astronomy.sunrise) return 0;
    if (now > astronomy.sunset) return 1;
    return (now - astronomy.sunrise) / (astronomy.sunset - astronomy.sunrise);
  }, [astronomy, now]);

  const hours = Math.floor(astronomy.dayLength / 3600000);
  const minutes = Math.round((astronomy.dayLength % 3600000) / 60000);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Sun & Moon</h2>
      </div>

      <div className="glass-card relative overflow-hidden px-6 py-6">
        <div className="relative h-32">
          <svg viewBox="0 0 200 80" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,212,122,0.2)" />
                <stop offset="50%" stopColor="rgba(255,212,122,0.6)" />
                <stop offset="100%" stopColor="rgba(127,191,251,0.2)" />
              </linearGradient>
              <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3c4" />
                <stop offset="60%" stopColor="#ffd47a" />
                <stop offset="100%" stopColor="#fbbf24" />
              </radialGradient>
            </defs>
            <path d="M10,70 Q100,-10 190,70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path
              d="M10,70 Q100,-10 190,70"
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2"
              strokeDasharray={`${dayProgress * 260} 260`}
              className="transition-all duration-1000"
            />
            {/* Animated sun with rotating rays */}
            <g
              transform={`translate(${10 + dayProgress * 180}, ${70 - Math.sin(dayProgress * Math.PI) * 80})`}
              className="animate-sun-bob"
            >
              <g className="animate-sun-rays" style={{ transformOrigin: 'center' }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = (i * 45 * Math.PI) / 180;
                  return (
                    <line
                      key={i}
                      x1={Math.cos(a) * 9}
                      y1={Math.sin(a) * 9}
                      x2={Math.cos(a) * 13}
                      y2={Math.sin(a) * 13}
                      stroke="rgba(255,212,122,0.6)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
              <circle r="6" fill="url(#sunCore)" className="drop-shadow-[0_0_10px_rgba(255,212,122,0.8)]" />
              <circle r="8" fill="none" stroke="rgba(255,212,122,0.25)" strokeWidth="0.8" className="animate-pulse-slow" />
            </g>
          </svg>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Stat icon={<Sunrise className="h-4 w-4 text-amber-300" />} label="Sunrise" value={formatTime(astronomy.sunrise)} />
          <Stat icon={<Sunset className="h-4 w-4 text-orange-300" />} label="Sunset" value={formatTime(astronomy.sunset)} />
          <Stat icon={<Sun className="h-4 w-4 text-amber-300" />} label="Solar Noon" value={formatTime(astronomy.solarNoon)} />
          <Stat icon={<Sun className="h-4 w-4 text-amber-200" />} label="Day Length" value={`${hours}h ${minutes}m`} />
        </div>
      </div>

      <div className="glass-card flex items-center gap-5 px-6 py-6">
        <MoonPhaseSVG phase={astronomy.moonPhase} illumination={astronomy.moonIllumination} />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-white/45">Moon Phase</span>
          <span className="font-display text-lg font-semibold text-white">{moonPhaseName(astronomy.moonPhase)}</span>
          <span className="text-sm text-white/60">{astronomy.moonIllumination}% illuminated</span>
          {astronomy.moonAge != null && (
            <span className="text-xs text-white/40">{astronomy.moonAge.toFixed(1)} days old</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/70">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

/**
 * Renders the moon as an SVG with a precisely computed illuminated region.
 * Uses two half-circle paths and an ellipse to create the classic moon phase
 * appearance with the correct terminator shape.
 *
 * phase: 0..1 where 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
 * illumination: 0..100
 */
function MoonPhaseSVG({ phase, illumination }: { phase: number; illumination: number }) {
  const size = 72;
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  // The terminator is an ellipse whose width shrinks/grows with the phase.
  // For waxing phases (0..0.5): right side is lit, left is dark.
  // For waning phases (0.5..1): left side is lit, right is dark.
  const isWaxing = phase < 0.5;
  const illumFraction = illumination / 100;

  // The semi-minor axis of the terminator ellipse
  // At new/full moon it's r (circle), at quarter it's 0 (straight line)
  const terminatorRx = r * Math.abs(1 - 2 * illumFraction);

  // Whether the lit side is convex (gibbous) or concave (crescent)
  const isGibbous = illumFraction > 0.5;

  // Determine which half is lit and the sweep direction
  const litSide = isWaxing ? 'right' : 'left';

  // Build the SVG paths for the lit and dark regions
  // The moon circle: cx,cy radius r
  // The terminator is half of an ellipse with rx = terminatorRx

  // For the lit area we combine a semicircle + a semi-ellipse
  // For waxing (right lit):
  //   - Lit area = right semicircle + (gibbous: left-bulging ellipse half | crescent: right-cut ellipse half)
  // For waning (left lit):
  //   - Lit area = left semicircle + (gibbous: right-bulging ellipse half | crescent: left-cut ellipse half)

  const litPath = buildLitPath(cx, cy, r, terminatorRx, litSide, isGibbous);

  return (
    <div className="relative shrink-0 animate-moon-float" style={{ transformOrigin: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_12px_rgba(200,210,240,0.25)]">
        <defs>
          <radialGradient id="moonLit" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fefce8" />
            <stop offset="60%" stopColor="#e8e6d8" />
            <stop offset="100%" stopColor="#b8b5a0" />
          </radialGradient>
          <radialGradient id="moonDark" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1a2342" />
            <stop offset="100%" stopColor="#0a0f25" />
          </radialGradient>
          <filter id="moonGlow">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* Dark side base (full circle) */}
        <circle cx={cx} cy={cy} r={r} fill="url(#moonDark)" />

        {/* Lit region */}
        <path d={litPath} fill="url(#moonLit)" filter="url(#moonGlow)" />

        {/* Crater details on lit side */}
        <MoonCraters cx={cx} cy={cy} r={r} litSide={litSide} isGibbous={isGibbous} terminatorRx={terminatorRx} />

        {/* Subtle rim highlight */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Outer glow */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,210,240,0.15)" strokeWidth="2" className="animate-moon-glow" />
      </svg>
    </div>
  );
}

function buildLitPath(
  cx: number,
  cy: number,
  r: number,
  terminatorRx: number,
  litSide: 'left' | 'right',
  isGibbous: boolean
): string {
  const top = cy - r;
  const bottom = cy + r;
  const left = cx - r;
  const right = cx + r;

  if (litSide === 'right') {
    // Right semicircle from top to bottom (clockwise via right edge)
    // Then terminator ellipse from bottom back to top
    if (isGibbous) {
      // Gibbous: terminator bulges to the left (lit area is larger than half)
      // Semicircle: top -> right -> bottom, then ellipse bottom -> left -> top
      return `M ${cx} ${top} A ${r} ${r} 0 0 1 ${cx} ${bottom} A ${terminatorRx} ${r} 0 0 0 ${cx} ${top} Z`;
    } else {
      // Crescent: terminator bulges to the right (lit area is less than half)
      // Semicircle: top -> right -> bottom, then ellipse bottom -> right -> top
      return `M ${cx} ${top} A ${r} ${r} 0 0 1 ${cx} ${bottom} A ${terminatorRx} ${r} 0 0 1 ${cx} ${top} Z`;
    }
  } else {
    // Left lit
    if (isGibbous) {
      // Gibbous: terminator bulges to the right
      return `M ${cx} ${top} A ${r} ${r} 0 0 0 ${cx} ${bottom} A ${terminatorRx} ${r} 0 0 1 ${cx} ${top} Z`;
    } else {
      // Crescent: terminator bulges to the left
      return `M ${cx} ${top} A ${r} ${r} 0 0 0 ${cx} ${bottom} A ${terminatorRx} ${r} 0 0 0 ${cx} ${top} Z`;
    }
  }
}

function MoonCraters({
  cx,
  cy,
  r,
  litSide,
  isGibbous,
  terminatorRx,
}: {
  cx: number;
  cy: number;
  r: number;
  litSide: 'left' | 'right';
  isGibbous: boolean;
  terminatorRx: number;
}) {
  // Static crater positions (relative to moon center)
  const craters = [
    { dx: -0.3, dy: -0.25, cr: 0.08 },
    { dx: 0.2, dy: -0.4, cr: 0.06 },
    { dx: 0.35, dy: 0.1, cr: 0.1 },
    { dx: -0.15, dy: 0.3, cr: 0.07 },
    { dx: 0.1, dy: 0.35, cr: 0.05 },
    { dx: -0.4, dy: 0.05, cr: 0.06 },
  ];

  // Determine which craters are on the lit side
  const litLimit = litSide === 'right' ? 0 : 0;
  void litLimit;
  void isGibbous;
  void terminatorRx;

  return (
    <>
      {craters.map((c, i) => {
        const x = cx + c.dx * r;
        const y = cy + c.dy * r;
        const cr = c.cr * r;
        // Only show crater if it's on the lit side
        const isOnLitSide = litSide === 'right' ? c.dx >= -0.05 : c.dx <= 0.05;
        if (!isOnLitSide) return null;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={cr}
            fill="rgba(120,115,95,0.25)"
          />
        );
      })}
    </>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
