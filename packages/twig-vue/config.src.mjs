import * as Path from 'node:path';
import { fileURLToPath } from 'node:url';

export const context = Path.dirname(fileURLToPath(import.meta.url));

export default async ({ env, mode }) => {
    return {
        env,
        type: 'src',
        mode,

        context,
        output: Path.join(context, 'dist/src'),

        js: [
            `./js-src/*.+(js|ts)`
        ],
        css: [
            './scss/*.scss',
            './scss/!_*.scss'
        ],
        layouts: './layouts',

        mergeWebpack: {
            resolve: {
                alias: {
                    vue: 'vue/dist/vue.js'
                }
            }
        }
    };
};
