import { createLoader } from 'simple-functional-loader';
import Path from 'path';
import Webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';

import { createRequire } from 'module';

const externals = {
  chokidar: 'self.chokidar',
  purgecss: 'self.purgecss',
  tmp: 'self.tmp',
};

export default async context => {
  const require = createRequire(
    createRequire(context).resolve('tailwindcss')
  );

  const moduleOverrides = {
    fs: Path.resolve(context, './src/modules/fs.js'),
    path: require.resolve('path-browserify'),
  };

  const getExternal = ({ context, request }, callback) => {
    if (/node_modules/.test(context) && externals[request]) {
      return callback(null, externals[request]);
    }
    callback();
  }

  const files = [
    {
      pattern: /modern-normalize/,
      file: require.resolve("modern-normalize"),
    },
    {
      pattern: /normalize/,
      file: require.resolve('normalize.css'),
    },
    {
      pattern: /preflight/,
      file: Path.resolve(
        context,
        "node_modules/tailwindcss/lib/plugins/css/preflight.css"
      ),
    },
  ];

  /** @type {Webpack.Configuration} */
  const config = {
    mode: process.env.NODE_ENV,
    context,
    entry: {
      index: './src/index.js',
    },
    output: {
      path: Path.resolve(context, './dist'),
      filename: '[name].js',
      globalObject: 'self',
      library: {
        type: 'global',
        name: 'TailwindRuntimeJit'
      }
    },
    resolve: {
      alias: {
        ...moduleOverrides
      },
      fallback: {
        module: false,
      },
    },
    module: {
      rules: [
        {
          test: require.resolve('glob-parent'),
          use: [
            createLoader(function(_source) {
              return `module.exports = () => ''`;
            }),
          ],
        },
        {
          test: require.resolve('is-glob'),
          use: [
            createLoader(function(_source) {
              return `module.exports = () => false`;
            }),
          ],
        },
        {
          test: require.resolve('fast-glob'),
          use: [
            createLoader(function (_source) {
              return `module.exports = {
                sync: (patterns) => [].concat(patterns)
              }`
            }),
          ],
        },
        {
          test: require.resolve("tailwindcss/lib/lib/setupTrackingContext.js"),
          use: createLoader(function(source) {
            return source.replace(`require(userConfigPath)`, `null`);
          }),
        },
        {
          test: require.resolve("tailwindcss/lib/corePlugins.js"),
          use: createLoader(function(source) {
            return source.replace(
              /_fs\.default\.readFileSync\(.*?'utf8'\)/g,
              (m) => {
                for (let i = 0; i < files.length; i++) {
                  if (
                    files[i].pattern.test(m)
                  ) {
                    return (
                      "`" +
                      fs.readFileSync(files[i].file, "utf8").replace(/`/g, "\\`") +
                      "`"
                    );
                  }
                }
                return m;
              }
            );
          }),
        },
      ],
    },
    plugins: [
      new NodePolyfillPlugin(),
      new Webpack.DefinePlugin({
        'process.env.TAILWIND_MODE': JSON.stringify('build'),
        'process.env.TAILWIND_DISABLE_TOUCH': true,
      })
    ],
    externals: [getExternal],
    experiments: {
      outputModule: true,
    },
  };

  return config;
};
