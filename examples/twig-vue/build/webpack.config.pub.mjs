import LazyHtmlPlugin from '@tarik02/lazy-html-plugin';
import { globby } from 'globby';
import IgnoreEmitPlugin from 'ignore-emit-webpack-plugin';
import * as Path from 'path';
import Webpack from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import WebpackHotLockPlugin from 'webpack-hot-lock-plugin';
import { merge } from 'webpack-merge';

import { buildConfig as buildBaseConfig } from './webpack.config.base.mjs';

/**
 * @param {string} context
 * @param {'development' | 'production'} mode
 */
export const buildConfig = async (context, mode) => {
    const baseConfig = await buildBaseConfig(context, 'pub', mode);

    /** @type {Webpack.Configuration} */
    const config = {
        entry: async () => {
            const entries = {
                app: {
                    dependOn: mode === 'development' ? 'css/runtime' : undefined,
                    import: './js-pub/index.js'
                }
            };

            entries['css/runtime'] = {
                development: './build/tailwind.config.js',
                production: 'data:application/javascript;base64,'
            }[mode];
            for (const file of await globby([ './scss/*.scss', './scss/!_*.scss' ], { cwd: context })) {
                const name = Path.basename(file, '.scss');

                entries[`css/${ name }`] = {
                    dependOn: 'css/runtime',
                    import: file
                };
            }

            return entries;
        },
        output: {
            filename: {
                development: 'js/[name].js',
                production: 'js/[name].[chunkhash:10].js'
            }[mode],
            chunkFilename: {
                development: 'js/[name].js',
                production: 'js/[name].[chunkhash:10].js'
            }[mode],
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.twig$/i,
                    loader: '@tarik02/render-twing-loader',
                    options: {
                        environmentModule: new URL('twing.env.mjs', import.meta.url).pathname
                    }
                }
            ]
        },
        plugins: [
            new LazyHtmlPlugin({
                publicPath: 'layouts',
                context: 'layouts',
                pathMapper: {
                    inputSuffix: '.twig'
                },
                forceAll: true
            }),
            new IgnoreEmitPlugin(/^layouts/),
            new WebpackAssetsManifest({
                output: 'manifest.json',
                contextRelativeKeys: true,
                transform: ({ entrypoints, ...assets }) => ({ mode, entrypoints, assets }),
                writeToDisk: false,
                fileExtRegex: /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i,
                publicPath: '',
                entrypoints: true
            }),
            new WebpackHotLockPlugin(),
        ],
        devServer: {
            allowedHosts: 'all',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
            }
        }
    };

    return merge(
        baseConfig,
        config
    );
};

export default async () => {
    /** @type {'development' | 'production'} */
    const mode = process.env.NODE_ENV || 'development';
    const context = new URL('..', import.meta.url).pathname;

    return await buildConfig(
        context,
        mode
    );
};
