const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './*.html'
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
      },
    },
  },
  plugins: [],
};