/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#8B1538',
          600: '#7a1230',
          700: '#6a0f28',
          800: '#5a0d20',
          900: '#4a0a18',
        },
        roman: {
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#8B1538',
            600: '#7a1230',
            700: '#6a0f28',
            800: '#5a0d20',
            900: '#4a0a18',
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#D4AF37',
            600: '#c19d31',
            700: '#ad8b2a',
            800: '#997824',
            900: '#85661d',
          },
        },
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#D4AF37',
          600: '#c19d31',
          700: '#ad8b2a',
          800: '#997824',
          900: '#85661d',
        },
      },
    },
  },
  plugins: [],
}