import { globby } from 'globby';
import * as Path from 'path';
import * as Webpack from 'webpack';
import WebpackHtmlBuilder from 'webpack-html-builder';
import { merge } from 'webpack-merge';

import { buildConfig as buildBaseConfig } from './webpack.config.base.mjs';

/**
 * @param {object} env
 * @param {string} context
 * @param {'development' | 'production'} mode
 */
export const buildConfig = async (env, context, mode) => {
    const baseConfig = await buildBaseConfig(env, context, 'src', mode);

    /** @type {Webpack.Configuration} */
    const config = {
        output: {
            filename: 'js/[name].js',
            chunkFilename: 'js/[name].js',
            clean: true
        },
        resolve: {
            alias: {
                vue: 'vue/dist/vue.js'
            }
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
                }
            })
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
