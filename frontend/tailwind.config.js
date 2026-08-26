/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        artisan: {
          50: '#FDFBF7',
          100: '#FAF4EB',
          200: '#F3E5D3',
          300: '#E7CCAA',
          400: '#D5A675',
          500: '#C27D42',
          600: '#A75F2E',
          700: '#864723',
          800: '#67341B',
          900: '#4A2514',
        },
        terracotta: {
          500: '#E05638',
          600: '#C2410C',
          700: '#9A3412',
        },
        saffron: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        indigoCraft: {
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
