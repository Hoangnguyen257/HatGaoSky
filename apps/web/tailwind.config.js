/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#c7dcff',
          300: '#9ec4ff',
          400: '#6ea3ff',
          500: '#3b82f6',
          600: '#1d63ed',
          700: '#154ecb',
          800: '#1740a3',
          900: '#0f2b5c', // Signature Airline Navy
          950: '#0a1a38',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Signature Golden Lotus Accent
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        cabin: {
          economy: '#3b82f6',
          business: '#8b5cf6',
          first: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(15, 43, 92, 0.15)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.35)',
      }
    },
  },
  plugins: [],
};
