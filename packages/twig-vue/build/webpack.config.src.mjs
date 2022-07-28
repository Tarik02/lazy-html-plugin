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
        entry: async () => {
            const entries = {
                'app': {
                    dependOn: 'css/runtime',
                    import: './js-src/index.js'
                }
            };

            entries['css/runtime'] = {
                development: './build/tailwind.config.js',
                production: 'data:application/javascript;base64,'
            }[mode];
            for (const file of await globby(['./scss/*.scss', './scss/!_*.scss'], { cwd: context })) {
                const name = Path.basename(file, '.scss');

                entries[`css/${name}`] = {
                    dependOn: 'css/runtime',
                    import: file
                };
            }

            return entries;
        },
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
