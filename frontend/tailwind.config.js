/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Amazon palette
        amazon: {
          dark:   '#131921',
          nav:    '#232f3e',
          orange: '#ffa41c',
          yellow: '#ffd814',
          search: '#febd69',
          blue:   '#007185',
          link:   '#007185',
          deal:   '#cc0c39',
          prime:  '#00a8e1',
          green:  '#007600',
        },
        // Flipkart palette
        flipkart: {
          blue:   '#2874F0',
          yellow: '#FFD13A',
          orange: '#FF6161',
          green:  '#388E3C',
        },
        // CraftLink brand
        craft: {
          50:   '#FFFBF0',
          100:  '#FEF3C7',
          200:  '#FDE68A',
          300:  '#FCD34D',
          400:  '#FBBF24',
          500:  '#F59E0B',
          600:  '#D97706',
          700:  '#B45309',
          800:  '#92400E',
          900:  '#78350F',
        },
        terracotta: {
          50:  '#FFF1EE',
          100: '#FFE0D9',
          200: '#FFC5B8',
          300: '#FFA08A',
          400: '#FF7455',
          500: '#E05638',
          600: '#C2410C',
          700: '#9A3412',
          800: '#7C2D12',
          900: '#641E0C',
        },
      },
      fontFamily: {
        sans:  ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        head:  ['Outfit', 'Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'card-lg':  '0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        'card-xl':  '0 10px 40px rgba(0,0,0,0.15)',
        'header':   '0 2px 8px rgba(0,0,0,0.25)',
        'modal':    '0 25px 60px rgba(0,0,0,0.3)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.15)',
        'button':   '0 2px 6px rgba(255,164,28,0.4)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(80px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out forwards',
        'slide-right': 'slideRight 0.35s ease-out forwards',
        'shimmer':   'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
}
