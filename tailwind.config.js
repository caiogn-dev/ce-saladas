/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // Cê Saladas Brand Colors - Fresh Green Palette
        primary: {
          DEFAULT: '#2D6A4F',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#2D6A4F',
          600: '#1B4332',
          700: '#14532D',
          800: '#166534',
          900: '#052E16',
          950: '#022C22',
        },
        // Cê Saladas - Verde Folha (accent)
        saladas: {
          DEFAULT: '#40916C',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1B4332',
          800: '#14532D',
          900: '#064E3B',
        },
        // Cê Confeitaria - Rosa Doce
        confeitaria: {
          DEFAULT: '#D4A373',
          50: '#FEF7ED',
          100: '#FCEBD4',
          200: '#F8D4A8',
          300: '#F4B87A',
          400: '#D4A373',
          500: '#BC8A5F',
          600: '#A47148',
          700: '#8B5A34',
          800: '#724823',
          900: '#5C3A1A',
        },
        // Background - Cream natural
        cream: {
          DEFAULT: '#FEFDF8',
          50: '#FFFFFF',
          100: '#FEFDF8',
          200: '#FAF7F0',
          300: '#F5F1E6',
        },
        // Earth tones for accents
        earth: {
          DEFAULT: '#8B5E3C',
          light: '#D4A373',
          dark: '#5C3A1A',
        },
        // Status colors
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        error: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(114, 47, 55, 0.1)',
        'soft-lg': '0 20px 40px rgba(114, 47, 55, 0.15)',
        'hard': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'inner-gold': 'inset 0 -3px 0 0 #00B894',
        'inner-marsala': 'inset 0 -3px 0 0 #A2215A',
        'glow-marsala': '0 0 20px rgba(114, 47, 55, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-soft': 'bounceSoft 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
