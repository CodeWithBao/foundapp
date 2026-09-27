/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#18181B',
          soft: '#475467',
          muted: '#667085',
          slate: '#525760',
          dark: '#101828',
        },
        paper: {
          DEFAULT: '#F8F6F3',
          panel: '#F1ECE6',
          soft: '#FAF8F5',
          white: '#FFFFFF',
        },
        hairline: {
          DEFAULT: '#E8E2DD',
          warm: '#E4DDD6',
          strong: '#D0C7BF',
        },
        navy: {
          50: '#f3f6fa',
          100: '#e6edf5',
          700: '#17345d',
          800: '#152b47',
          900: '#0b1f3a',
        },
        burgundy: {
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbcbcb',
          300: '#f69d9e',
          400: '#ee6466',
          500: '#df3639',
          600: '#981B1E', // DNTU Primary Burgundy
          700: '#741216', // Dark Burgundy
          800: '#5C0D11', // Deep Burgundy
          900: '#3D070A',
          950: '#220406',
        },
        accent: {
          DEFAULT: '#981B1E',
          hover: '#741216',
          tint: '#FDF2F2',
          border: '#FECDCA',
        },
        cream: {
          50: '#F8F6F3', // Paper Canvas
          100: '#F3EFE9', // Warm Background
          200: '#EAE4DC',
          300: '#E8E2DD', // Border
          400: '#D5CCC2',
          500: '#BDB3A7',
        },
        gold: {
          DEFAULT: '#B9882E',
          hover: '#9E7223',
          tint: '#FAF3E1',
          border: '#EEDCB2',
        },
        champagne: {
          300: '#E6C687',
          400: '#D8B26A',
          500: '#C69B4A',
          600: '#A67D35',
        },
        'warm-gray': {
          400: '#98A2B3',
          500: '#667085',
          600: '#475467',
        },
        'text-dark': '#18181B',
        'dntu-red': '#981B1E',
        'dntu-success': '#039855',
        'dntu-warning': '#F79009',
        'dntu-danger': '#D92D20',
        'dntu-info': '#175CD3',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        script: ['Caveat', 'cursive'],
      },
      borderRadius: {
        'card-sm': '8px',
        'card': '14px',
        'card-lg': '18px',
        'card-xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 5px rgba(71, 82, 96, 0.04)',
        'card-hover': '0 14px 34px rgba(28, 37, 48, 0.10), 0 2px 8px rgba(28, 37, 48, 0.04)',
        'navbar': '0 1px 6px rgba(28, 37, 48, 0.06)',
        'landing-sm': '0 1px 2px rgb(28 37 48 / .05), 0 8px 20px -10px rgb(28 37 48 / .1)',
        'landing-md': '0 2px 6px -2px rgb(28 37 48 / .08), 0 20px 46px -20px rgb(28 37 48 / .22)',
        'landing-lg': '0 4px 10px -4px rgb(28 37 48 / .1), 0 38px 90px -34px rgb(28 37 48 / .3)',
        'pill': '0 2px 6px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to right, rgba(40,10,10,.85), rgba(92,13,17,.75), rgba(28,37,48,.65))',
      },
      transitionTimingFunction: {
        'skillbridge': 'cubic-bezier(.16, 1, .3, 1)',
      }
    },
  },
  plugins: [],
}
