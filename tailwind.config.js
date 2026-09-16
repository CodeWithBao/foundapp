/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f3',
          100: '#fbe6e8',
          200: '#f5c0c5',
          300: '#ef9aa2',
          400: '#e4636f',
          500: '#d63945',
          600: '#981B1E', // Primary Burgundy
          700: '#741216', // Dark Burgundy
          800: '#5C0D11', // Deep Burgundy
          900: '#4D0B13',
          950: '#2a0509',
        },
        cream: {
          50: '#FCFAF7', // Cream
          100: '#F8F6F3', // Warm Background
          200: '#F2ECE4',
          300: '#E8E2DD', // Border
          400: '#D4C8BC',
          500: '#C0B4A6',
        },
        champagne: {
          400: '#D8B26A',
          500: '#C69B4A',
          600: '#A67D35',
        },
        'warm-gray': {
          400: '#98A2B3', // Muted
          500: '#667085', // Secondary Text
          600: '#5E5652',
        },
        'text-dark': '#18181B', // Primary Text
        'dntu-red': '#981B1E',
        'dntu-success': '#237A52',
        'dntu-warning': '#C56A00',
        'dntu-danger': '#B42318',
        'dntu-info': '#1D4ED8',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '16px',
        'card-lg': '16px',
      },
      boxShadow: {
        'card': '0 3px 14px rgba(40,25,20,0.04)',
        'card-hover': '0 8px 24px rgba(40,25,20,0.08)',
        'navbar': '0 1px 3px rgba(40,25,20,0.04)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to right, rgba(40,10,10,.80), rgba(70,10,15,.55), rgba(0,0,0,.15))',
      },
    },
  },
  plugins: [],
}
