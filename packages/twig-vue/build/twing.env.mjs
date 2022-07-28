import * as FS from 'fs';
import * as Path from 'path';
import { globby } from 'globby';
import { TwingFunction } from 'twing';

/** @type {import('twing').TwingEnvironmentOptions} */
export const options = {
    debug: true,
};

/**
 * @param {import('twing').TwingEnvironment} env
 * @this {import('webpack').LoaderContext<{}>}
 */
export async function configure(env, params) {
    env.addGlobal('mode', this.mode);

    env.addGlobal('currentPage', Path.basename(Path.relative(this.context, this.resourcePath), '.twig'));

    env.addFunction(new TwingFunction('listPages', async (pattern = '*.twig', ext = '.twig', excludeSelf = true) => {
        this.addContextDependency(this.context);

        let files = await globby(pattern, { cwd: this.context });

        if (excludeSelf) {
            files = files.filter(file => file !== Path.relative(this.context, this.resourcePath));
        }

        files = files.map(file => Path.basename(file, ext));

        return files;
    }, [
        { name: 'path' },
        { name: 'ext' },
        { name: 'excludeSelf' }
    ]));

    const globalDataSrc = Path.join(this.context, '_data/_global.json');
    this.addDependency(globalDataSrc);
    const globals = JSON.parse(await FS.promises.readFile(globalDataSrc, { encoding: 'utf-8' }));
    for (const [key, value] of Object.entries(globals)) {
        env.addGlobal(key, value);
    }
};
