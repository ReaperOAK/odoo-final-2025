/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B63FF',
          50: '#eaf2ff',
          100: '#d6e7ff',
        },
        success: '#16A34A',
        danger: '#EF4444',
        warn: '#F97316',
        bg: '#F8FAFC'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
