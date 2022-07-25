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
    entry: './src/index.ts',
    output: {
      path: Path.resolve(context, './dist'),
      filename: 'index.js',
    },
    resolve: {
      extensions: [ '.js', '.ts' ],
    },
    module: {
      rules: [
        {
          test: /\.[jt]s$/i,
          loader: 'babel-loader',
          options: babelConfig,
        },
      ],
    },
  };

  return config;
};
