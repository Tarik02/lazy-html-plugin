import * as Path from 'node:path';
import { fileURLToPath } from 'node:url';

export const context = Path.dirname(fileURLToPath(import.meta.url));

export default async ({ env, mode }) => {
    return {
        env,
        type: 'pub',
        mode,

        context,
        output: Path.join(context, 'dist/pub'),

        js: [
            `./js-pub/*.+(js|ts)`
        ],
        css: [
            './scss/*.scss',
            './scss/!_*.scss'
        ]
    };
};
