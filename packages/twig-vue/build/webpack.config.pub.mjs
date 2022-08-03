import { globby } from 'globby';
import IgnoreEmitPlugin from 'ignore-emit-webpack-plugin';
import * as Path from 'path';
import Webpack from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import WebpackHotLockPlugin from 'webpack-hot-lock-plugin';
import WebpackHtmlBuilder from 'webpack-html-builder';
import { merge } from 'webpack-merge';

import { buildConfig as buildBaseConfig } from './webpack.config.base.mjs';

/**
 * @param {object} env
 * @param {string} context
 * @param {'development' | 'production'} mode
 */
export const buildConfig = async (env, context, mode) => {
    const baseConfig = await buildBaseConfig(env, context, 'pub', mode);

    /** @type {Webpack.Configuration} */
    const config = {
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
                    loader: 'twing-render-loader',
                    options: {
                        environmentModule: new URL('twing.env.mjs', import.meta.url).pathname
                    }
                }
            ]
        },
        plugins: [
            new WebpackHtmlBuilder({
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
            new WebpackHotLockPlugin()
        ]
    };

    return merge(
        baseConfig,
        config
    );
};

export default async env => {
    /** @type {'development' | 'production'} */
    const mode = process.env.NODE_ENV || 'development';
    const context = new URL('..', import.meta.url).pathname;

    return await buildConfig(env, context, mode);
};
