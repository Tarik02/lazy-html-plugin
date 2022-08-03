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
 * @param {string} context
 * @param {Awaited<ReturnType<import('../config.pub.mjs').default>>} config
 * @return {Promise<Webpack.Configuration>}
 */
 export const buildConfig = async (context, config) => {
    const { mode } = config;
    const baseConfig = await buildBaseConfig(context, config);

    /** @type {Webpack.Configuration} */
    const webpackConfig = {
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

    const resultConfig = merge(
        baseConfig,
        webpackConfig,
        config.mergeWebpack ?? {}
    );

    config.webpack?.(resultConfig);

    return resultConfig;
};

export default async (env, { mode }) => {
    const { context, default: configFactory } = await import('../config.pub.mjs');
    const config = await configFactory({ env, mode });

    return await buildConfig(context, config);
};
