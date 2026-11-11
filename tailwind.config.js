/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aether: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#bbdcfd',
          300: '#7fbffb',
          400: '#3a9bf8',
          500: '#1280ec',
          600: '#0663c9',
          700: '#074fa0',
          800: '#0a4483',
          900: '#0d3a6e',
          950: '#082347',
        },
        accent: {
          400: '#5eead4',
          500: '#2dd4bf',
          600: '#14b8a6',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        danger: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        ok: {
          400: '#4ade80',
          500: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Sora"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 12, 30, 0.18)',
        glow: '0 0 40px rgba(58, 155, 248, 0.35)',
        'glow-accent': '0 0 40px rgba(45, 212, 191, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down': 'slideDown 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 18s linear infinite',
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        aurora: 'aurora 16s ease-in-out infinite alternate',
        'drift-slow': 'driftSlow 12s ease-in-out infinite',
        'sway': 'sway 6s ease-in-out infinite',
        'rain-fall': 'rainFall 1.2s linear infinite',
        'snow-fall': 'snowFall 3s ease-in-out infinite',
        'flash': 'flash 4s ease-in-out infinite',
        'breathe': 'breathe 5s ease-in-out infinite',
        'sun-bob': 'sunBob 5s ease-in-out infinite',
        'sun-rays': 'sunRays 24s linear infinite',
        'moon-float': 'moonFloat 9s ease-in-out infinite',
        'moon-glow': 'moonGlow 6s ease-in-out infinite',
        'needle-sway': 'needleSway 4s ease-in-out infinite',
        'compass-ring': 'compassRing 30s linear infinite',
        'draw-line': 'drawLine 1.4s ease-out forwards',
        'fade-scale': 'fadeScale 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        aurora: {
          '0%': { transform: 'translate(-10%, -5%) rotate(0deg) scale(1)' },
          '50%': { transform: 'translate(10%, 5%) rotate(8deg) scale(1.15)' },
          '100%': { transform: 'translate(-5%, 8%) rotate(-6deg) scale(1.05)' },
        },
        driftSlow: {
          '0%,100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(6px) translateY(-4px)' },
          '50%': { transform: 'translateX(-3px) translateY(-8px)' },
          '75%': { transform: 'translateX(-6px) translateY(-2px)' },
        },
        sway: {
          '0%,100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        rainFall: {
          '0%': { transform: 'translateY(-4px)', opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(8px)', opacity: '0' },
        },
        snowFall: {
          '0%,100%': { transform: 'translateY(-2px) translateX(0)', opacity: '0.5' },
          '25%': { transform: 'translateY(2px) translateX(-3px)', opacity: '1' },
          '50%': { transform: 'translateY(6px) translateX(2px)', opacity: '0.8' },
          '75%': { transform: 'translateY(4px) translateX(-1px)', opacity: '1' },
        },
        flash: {
          '0%,90%,100%': { opacity: '1' },
          '93%': { opacity: '0.3' },
          '95%': { opacity: '1' },
          '97%': { opacity: '0.4' },
        },
        breathe: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        sunBob: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        sunRays: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        moonFloat: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-4px) rotate(2deg)' },
        },
        moonGlow: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        needleSway: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        compassRing: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeScale: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
