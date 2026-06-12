/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom colors requested
        primary: {
          light: '#2563EB',
          dark: '#3B82F6',
          DEFAULT: '#2563EB',
        },
        secondary: {
          light: '#4F46E5',
          dark: '#6366F1',
          DEFAULT: '#4F46E5',
        },
        background: {
          light: '#F8FAFC',
          dark: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
