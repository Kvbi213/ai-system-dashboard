/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./core.client.jsx",
    "./modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        accentPrimary: 'rgb(var(--color-accent-primary) / <alpha-value>)',
        accentSecondary: 'var(--color-accent-secondary)',
        textPrimary: 'var(--color-text-primary)',
        textMuted: 'var(--color-text-muted)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', '"Geist Sans"', 'sans-serif'],
      },
      animation: {
        blink: 'blink 1s infinite',
        shimmer: 'shimmer 2s infinite linear',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'neon-pulse': 'neonPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dropdown-in': 'dropdownIn 0.2s ease-out forwards',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        neonPulse: {
          '0%, 100%': { textShadow: '0 0 10px rgba(var(--color-accent-primary), 0.5), 0 0 20px rgba(var(--color-accent-primary), 0.3)' },
          '50%': { textShadow: '0 0 15px rgba(var(--color-accent-primary), 0.8), 0 0 30px rgba(var(--color-accent-primary), 0.5)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        dropdownIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
