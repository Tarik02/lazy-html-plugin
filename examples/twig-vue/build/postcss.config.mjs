import tailwindNesting from 'tailwindcss/nesting/index.js';
import tailwind from 'tailwindcss';
import postcssInlineSvg from 'postcss-inline-svg';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const plugins = [
  tailwindNesting(),
  tailwind({
    config: new URL('tailwind.config.js', import.meta.url).pathname
  }),
  postcssInlineSvg,
  autoprefixer({
    grid: 'no-autoplace'
  }),
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    cssnano
  );
}

export default {
  plugins
};
