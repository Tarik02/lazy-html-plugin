import { createRequire } from 'module';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import IgnoreEmitPlugin from 'ignore-emit-webpack-plugin';
import FriendlyErrors from 'friendly-errors-webpack-plugin';
import Webpack from 'webpack';
import LazyHtmlPlugin from '@tarik02/lazy-html-plugin';

import postcssConfig from './postcss.config.js';

export default async () => {
  /** @type {'development' | 'production'} */
  const mode = process.env.NODE_ENV;

  /** @type {Webpack.Configuration} */
  const config = {
    mode,
    entry: {
      'js/index': './js/index.js',
      'css/index': {
        dependOn: 'js/index',
        import: './scss/index.scss'
      }
    },
    output: {
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.twig$/i,
          loader: '@tarik02/render-twing-loader',
          options: {
            environmentModule: createRequire(import.meta.url).resolve('./twing.env'),
          },
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            {
              development: 'style-loader',
              production: MiniCssExtractPlugin.loader,
            }[mode],
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                  postcssOptions: postcssConfig
              }
            },
            'sass-loader',
          ],
        },
        {
          test: /\.(jpe?g|png|svg|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'img/[name][ext]',
          },
        },
      ],
    },
    plugins: [
      new Webpack.ProgressPlugin,
      new FriendlyErrors,
      ...{
        development: [],
        production: [
          new MiniCssExtractPlugin({
            filename: ({ chunk }) => `${ chunk.name }.css`
          }),
          new IgnoreEmitPlugin(/css\/[^\/]+\.js$/),
        ],
      }[mode],
      new Webpack.CleanPlugin(),
      new LazyHtmlPlugin({
        publicPath: 'layouts',
        context: 'layouts',
        pathMapper: {
          inputSuffix: '.twig',
        },
      }),
    ],
  };

  return config;
};
