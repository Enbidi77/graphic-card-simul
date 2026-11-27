import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        graphite: {
          950: '#0e1114',
          900: '#14181d',
          850: '#1a2027',
          800: '#222a33',
          700: '#2f3946',
          600: '#475569'
        },
        signal: {
          cyan: '#22d3ee',
          amber: '#f59e0b',
          green: '#10b981',
          red: '#ef4444'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
