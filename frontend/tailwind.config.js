const INDIC_FACES = [
  '"Noto Sans Devanagari"', '"Noto Sans Telugu"', '"Noto Sans Tamil"',
  '"Noto Sans Bengali"', '"Noto Sans Kannada"', '"Noto Sans Gujarati"',
  '"Noto Sans Malayalam"', '"Nirmala UI"',
];

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CraftLink "Neel & Genda" identity: indigo (neel dye) + marigold (genda phool).
        brand: {
          50: '#EEF0FB', 100: '#DDE1F7', 200: '#BCC3EF', 300: '#939DE3', 400: '#6B76D4',
          500: '#4E58C2', 600: '#3B44A8', 700: '#30378A', 800: '#282D6E', 900: '#1E2150', 950: '#13153A',
        },
        // Marigold: calls to action, highlights, the logo accent.
        clay: {
          50: '#FFF8EB', 100: '#FEEBC8', 200: '#FDD592', 300: '#FCBB55', 400: '#F9A72B',
          500: '#F29111', 600: '#D6760A', 700: '#B15A0C', 800: '#8F4711', 900: '#753B11',
        },
        gold: { 300: '#FCBB55', 400: '#F9A72B', 500: '#F29111', 600: '#D6760A' },
        ink: {
          950: '#0F1024', 900: '#1B1C33', 800: '#2B2D45', 700: '#3F4159', 600: '#55576E',
          500: '#6D6F85', 400: '#9092A6', 300: '#B9BACA', 200: '#DCDCE6',
        },
        paper: { DEFAULT: '#F4F4F8', 50: '#FAFAFD', 100: '#F4F4F8', 200: '#EAEAF2', 300: '#DEDEEA' },
        line: { DEFAULT: '#E4E4EE', strong: '#CFCFDD' },
      },
      fontFamily: {
        // The Noto faces sit after the Latin ones: browsers choose a font per
        // character, so Devanagari, Telugu, Tamil, Bengali, Kannada, Gujarati
        // and Malayalam all render in a proper face with no per-page switching.
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          ...INDIC_FACES, 'sans-serif',
        ],
        display: [
          '"Plus Jakarta Sans"', 'Inter', '-apple-system', 'Segoe UI',
          ...INDIC_FACES, 'sans-serif',
        ],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(17, 26, 21, 0.05)',
        card: '0 1px 2px rgba(19, 21, 58, 0.05), 0 1px 3px rgba(19, 21, 58, 0.05)',
        lift: '0 14px 36px -12px rgba(30, 33, 80, 0.28)',
        modal: '0 24px 64px -12px rgba(14, 22, 36, 0.35)',
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem' },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        pop: { '0%': { opacity: '0', transform: 'scale(.97) translateY(6px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-600px 0' }, '100%': { backgroundPosition: '600px 0' } },
      },
      animation: {
        'fade-up': 'fadeUp .35s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fadeIn .2s ease-out both',
        'slide-in': 'slideIn .32s cubic-bezier(.16,1,.3,1) both',
        pop: 'pop .28s cubic-bezier(.16,1,.3,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
