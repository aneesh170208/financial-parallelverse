import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#070C15',
        surface: '#0C1523',
        panel: '#101B2C',
        elevated: '#142136',
        line: '#203047',
        'line-soft': '#182538',
        ink: '#EEF4F0',
        muted: '#95A6BB',
        faint: '#697B92',
        emerald: {
          300: '#74E9C2',
          400: '#44DCA9',
          500: '#2CCB95',
          600: '#18A97A',
        },
        amber: '#F3B65D',
        rose: '#F47C8B',
        sky: '#6FC3EA',
        violet: '#B49BFA',
        sand: '#E8D8B6',
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 18px 40px -30px rgba(0,0,0,0.8)',
        lift: '0 30px 70px -32px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgba(68,220,169,.12), 0 16px 50px -24px rgba(44,203,149,.28)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '36px 36px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
