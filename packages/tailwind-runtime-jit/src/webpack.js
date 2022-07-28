import * as Webpack from 'webpack';

export default class TailwindRuntimeJitWebpack {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * @param {Webpack.Compiler} compiler
   */
  apply(compiler) {
    compiler.options.module.rules.unshift({
      test: /(^|[\\\/])tailwind\.config\.[^.\\/]+$/i,
      loader: 'tailwind-runtime-jit/loader'
    });

    (new Webpack.ExternalsPlugin(undefined, {
      'tailwind-runtime-jit': [ 'TailwindRuntimeJit' ],
      'tailwind-runtime-jit/runtime': [ 'TailwindRuntimeJit', 'runtime' ],
      'postcss': [ 'TailwindRuntimeJit', 'postcss' ],
      'tailwindcss': [ 'TailwindRuntimeJit', 'tailwindcss' ],
    })).apply(compiler);
  }
}
