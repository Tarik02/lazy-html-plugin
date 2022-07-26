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
          use: '@tarik02/render-twing-loader',
        },
        {
          test: /\.jpg$/i,
          type: 'asset/resource',
          generator: {
            filename: 'img/[name].[hash:10][ext]',
          },
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
