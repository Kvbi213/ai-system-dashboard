/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#080c14',
          subtle: '#0d1320'
        },
        surface: {
          lowest: 'rgba(10, 15, 26, 0.95)',
          low: 'rgba(15, 23, 42, 0.65)',
          card: 'rgba(22, 33, 56, 0.55)',
          high: 'rgba(30, 41, 59, 0.75)',
          highest: 'rgba(51, 65, 85, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.14)'
        },
        omni: {
          cyan: '#38bdf8',
          cyanGlow: 'rgba(56, 189, 248, 0.25)',
          purple: '#c084fc',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#f87171'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      backdropBlur: {
        '2xl': '24px',
        '3xl': '40px'
      }
    },
  },
  plugins: [],
}
