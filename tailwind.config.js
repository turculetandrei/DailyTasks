/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        podium: ['"FSP DEMO - PODIUM Sharp 4.11"', 'Syne', 'sans-serif'],
      },
      colors: {
        base: '#090909',
        surface: '#111111',
        'surface-hover': '#1A1A1A',
        acid: '#C8F135',
        warm: '#F0EEE6',
        muted: 'rgba(240,238,230,0.4)',
        urgent: '#FF4D4D',
        high: '#FF8C42',
        work: '#5B8DF6',
        health: '#4CD97B',
      },
      fontWeight: {
        400: '400',
        500: '500',
        600: '600',
        700: '700',
        800: '800',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(200%) skewX(-15deg)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 0px rgba(200,241,53,0)' },
          '50%': { boxShadow: '0 0 24px rgba(200,241,53,0.35)' },
        },
        'ticker-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'overdue-blink': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'ticker-scroll': 'ticker-scroll 20s linear infinite',
        'overdue-blink': 'overdue-blink 0.6s ease-in-out',
      },
    },
  },
  plugins: [],
}
