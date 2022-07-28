/** @type {import('tailwindcss').Config} */
module.exports = {
  content: process.env.NODE_ENV === 'development' ? [] : [
    './layouts/**/*.twig'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0040ff',
        text: '#000'
      }
    }
  }
};
