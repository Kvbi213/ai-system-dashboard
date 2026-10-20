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
        background: 'var(--color-bg, #121316)',
        surface: '#121316',
        'surface-dim': '#121316',
        'surface-bright': '#38393c',
        'surface-container-lowest': '#0d0e11',
        'surface-container-low': '#1b1b1f',
        'surface-container': '#1f1f23',
        'surface-container-high': '#292a2d',
        'surface-container-highest': '#343538',
        'on-surface': '#e3e2e6',
        'on-surface-variant': '#c2c6d6',
        'inverse-surface': '#e3e2e6',
        'inverse-on-surface': '#2f3034',
        outline: '#8c909f',
        'outline-variant': '#424754',
        'surface-tint': '#adc6ff',
        primary: '#adc6ff',
        'on-primary': '#002e6a',
        'primary-container': '#4d8eff',
        'on-primary-container': '#00285d',
        'inverse-primary': '#005ac2',
        secondary: '#c0c1ff',
        'on-secondary': '#1000a9',
        'secondary-container': '#3131c0',
        'on-secondary-container': '#b0b2ff',
        tertiary: '#ffb786',
        'on-tertiary': '#502400',
        'tertiary-container': '#df7412',
        'on-tertiary-container': '#461f00',
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
        border: 'var(--color-border)',
        accentPrimary: 'rgb(var(--color-accent-primary) / <alpha-value>)',
        accentSecondary: 'var(--color-accent-secondary)',
        textPrimary: 'var(--color-text-primary)',
        textMuted: 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        'code-mono': ['"JetBrains Mono"', 'monospace'],
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
