import Webpack from 'webpack';
import LazyHtmlPlugin from '@tarik02/lazy-html-plugin';

export default async () => {
  /** @type {Webpack.Configuration} */
  const config = {
    mode: process.env.NODE_ENV,
    entry: {
      app: './src/index.js',
    },
    plugins: [
      new Webpack.CleanPlugin(),
      new LazyHtmlPlugin({
        prefix: 'layouts',
        directory: 'layouts',
      }),
    ],
  };

  return config;
};
