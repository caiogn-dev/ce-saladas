/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // Cê Saladas Brand Colors
        primary: {
          DEFAULT: '#A2215A',
          50: '#FDF2F6',
          100: '#FCE7EF',
          200: '#F9CFDF',
          300: '#F4A8C5',
          400: '#EC72A1',
          500: '#A2215A',
          600: '#8A1C4D',
          700: '#721740',
          800: '#5A1233',
          900: '#420D26',
          950: '#2A0819',
        },
        // Cê Saladas - Verde fresco
        saladas: {
          DEFAULT: '#00B894',
          50: '#E6FFF9',
          100: '#B3FFE9',
          200: '#80FFD9',
          300: '#4DFFC9',
          400: '#1AFFB9',
          500: '#00B894',
          600: '#009977',
          700: '#007A5A',
          800: '#005C3D',
          900: '#003D20',
        },
        // Cê Confeitaria - Laranja quente
        confeitaria: {
          DEFAULT: '#E17055',
          50: '#FEF3F0',
          100: '#FCE4DE',
          200: '#F9C9BD',
          300: '#F5AE9C',
          400: '#F2937B',
          500: '#E17055',
          600: '#C85A40',
          700: '#A0472F',
          800: '#78341E',
          900: '#50210D',
        },
        // Semantic colors
        cream: {
          DEFAULT: '#FAFAFA',
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F5F5F5',
          300: '#EEEEEE',
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
