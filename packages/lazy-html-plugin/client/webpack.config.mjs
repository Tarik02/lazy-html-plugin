import Process from 'process';
import Path from 'path';
import Webpack from 'webpack';

import babelConfig from './babel.config.mjs';

export default async () => {
  const context = Path.resolve(Process.cwd(), './client');

  /** @type {Webpack.Configuration} */
  const config = {
    mode: process.env.NODE_ENV,
    context,
    entry: {
      client: './src/client.ts',
      index: './src/views/Index.tsx',
    },
    output: {
      path: Path.resolve(context, './dist'),
      filename: '[name].js',
    },
    resolve: {
      extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/i,
          loader: 'babel-loader',
          options: babelConfig,
        },
      ],
    },
  };

  return config;
};
