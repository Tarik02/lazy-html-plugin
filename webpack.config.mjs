import Webpack from 'webpack';
import LazyHtmlPlugin from '@tarik02/lazy-html-plugin';

export default async () => {
  /** @type {Webpack.Configuration} */
  const config = {
    mode: process.env.NODE_ENV,
    entry: {
      app: './src/index.js',
    },
    module: {
      rules: [
        {
          test: /\.twig$/,
          use: [
            {
              loader: 'html-loader',
            },
            {
              loader: '@tarik02/render-twing-loader',
            },
          ],
        },
      ],
    },
    plugins: [
      new Webpack.CleanPlugin(),
      new LazyHtmlPlugin({
        prefix: 'layouts',
        directory: 'layouts',
        pathMapper: {
          inputSuffix: '.twig',
        },
      }),
    ],
  };

  return config;
};
