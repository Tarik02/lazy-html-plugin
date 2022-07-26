const Path = require('path');

let plugins = [
  require('tailwindcss')({
    config: Path.resolve(__dirname, 'tailwind.config.js')
  })
];

module.exports = {
  plugins
};
