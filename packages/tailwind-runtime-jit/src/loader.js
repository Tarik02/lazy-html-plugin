import { Volume } from 'memfs';
import * as Path from 'path';
import * as Webpack from 'webpack';

/**
 * @this {Webpack.LoaderContext<{}>}
 * @param {string} request
 * @returns
 */
export async function pitch(request) {
  this.cacheable && this.cacheable(true);

  const { default: createRuntimeConfig } = await import(/* webpackIgnore: true */ '../webpack.config.runtime.mjs');

  /** @type {Webpack.Configuration} */
  const config = await createRuntimeConfig(Path.join(__dirname, '..'));

  const compiler = Webpack.webpack({
    ...config,
    mode: this.mode,
    devtool: false
  });

  const fs = new Volume();
  compiler.outputPath = '/';
  compiler.outputFileSystem = fs;

  /** @type {Webpack.Stats} */
  const stats = await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });

  for (const error of stats.compilation.errors) {
    this.emitError(error);
  }

  for (const error of stats.compilation.warnings) {
    this.emitWarning(error);
  }

  return `
${fs.readFileSync('/index.js')}
var config = require(${JSON.stringify('!' + this.resourcePath)});
var runtime = require('tailwind-runtime-jit/runtime')();
runtime.update(config);
module.hot.accept(${JSON.stringify('!' + this.resourcePath)}, function () {
  runtime.update(require(${JSON.stringify('!' + this.resourcePath)}));
});
module.exports = {};
`;
};
