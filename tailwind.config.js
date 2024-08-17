const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './*.html',
    './main.css'  // Add this line to include main.css
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'button-blue': '#576c8e',
        'button-dark-blue': '#3d4e6a',
        'button-dark-green': '#006400',
        'button-green': '#4CAF50', // Add this line
      },
    },
  },
  plugins: [],
};