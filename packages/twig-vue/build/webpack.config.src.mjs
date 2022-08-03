import { fileURLToPath } from 'node:url';
import * as Webpack from 'webpack';
import WebpackHtmlBuilder from 'webpack-html-builder';
import { merge } from 'webpack-merge';

import { buildConfig as buildBaseConfig } from './webpack.config.base.mjs';

/**
 * @param {string} context
 * @param {Awaited<ReturnType<import('../config.src.mjs').default>>} config
 * @return {Promise<Webpack.Configuration>}
 */
export const buildConfig = async (context, config) => {
    const { mode } = config;
    const baseConfig = await buildBaseConfig(context, config);

    /** @type {Webpack.Configuration} */
    const webpackConfig = {
        output: {
            filename: 'js/[name].js',
            chunkFilename: 'js/[name].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.twig$/i,
                    loader: 'twing-render-loader',
                    options: {
                        environmentModule: fileURLToPath(new URL('twing.env.mjs', import.meta.url))
                    }
                }
            ]
        },
        plugins: [
            new WebpackHtmlBuilder({
                publicPath: 'layouts',
                context: config.layouts,
                pathMapper: {
                    inputSuffix: '.twig'
                }
            })
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
    const { context, default: configFactory } = await import('../config.src.mjs');
    const config = await configFactory({ env, mode });

    return await buildConfig(context, config);
};
