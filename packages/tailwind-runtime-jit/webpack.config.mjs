import nodeExternals from 'webpack-node-externals';
import Webpack from 'webpack';

import createRuntimeConfig from './webpack.config.runtime.mjs';

export default async () => {
  const runtimeConfig = await createRuntimeConfig(
    new URL('.', import.meta.url).pathname
  );

  /** @type {Webpack.Configuration} */
  const nodeConfig = {
    target: 'node',
    devtool: 'eval-source-map',
    entry: {
      webpack: './src/webpack.js',
      loader: './src/loader.js',
    },
    output: {
      library: {
        type: 'commonjs2',
      },
    },
    externals: [nodeExternals({
      modulesDir: new URL('../../node_modules', import.meta.url).pathname
    })],
  };

  return [runtimeConfig, nodeConfig];
};
