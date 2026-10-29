/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rhythm: {
          sun: '#F59E0B',       // Sunny gold for Morning
          earth: '#15803D',     // Warm green
          terracotta: '#EA580C',// Warm terracotta
          navy: '#0F172A',      // High contrast dark text
          cream: '#FEFCE8',     // Soft warm background
          card: '#FFFFFF',
          border: '#D1D5DB',
        },
      },
      fontSize: {
        'accessible-sm': '18px',
        'accessible-base': '20px',
        'accessible-lg': '24px',
        'accessible-xl': '28px',
        'accessible-2xl': '34px',
      },
      minHeight: {
        'accessible-btn': '56px',
        'accessible-big': '68px',
      },
    },
  },
  plugins: [],
};
