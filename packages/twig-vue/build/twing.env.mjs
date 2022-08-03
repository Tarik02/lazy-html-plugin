import * as FS from 'fs';
import * as Path from 'path';
import { globby } from 'globby';
import { TwingFunction } from 'twing';

/** @type {import('twing').TwingEnvironmentOptions} */
export const options = {
    debug: true,
};

/**
 * @param {import('webpack').LoaderContext<{}>} loader
 * @param {import('twing').TwingEnvironment} env
 */
export async function configure({ loader, env }) {
    env.addGlobal('mode', loader.mode);

    env.addGlobal('currentPage', Path.basename(Path.relative(loader.context, loader.resourcePath), '.twig'));

    env.addFunction(new TwingFunction('listPages', async (pattern = '*.twig', ext = '.twig', excludeSelf = true) => {
        loader.addContextDependency(loader.context);

        let files = await globby(pattern, { cwd: loader.context });

        if (excludeSelf) {
            files = files.filter(file => file !== Path.relative(loader.context, loader.resourcePath));
        }

        files = files.map(file => Path.basename(file, ext));

        return files;
    }, [
        { name: 'path' },
        { name: 'ext' },
        { name: 'excludeSelf' }
    ]));

    const globalDataSrc = Path.join(loader.context, '_data/_global.json');
    loader.addDependency(globalDataSrc);
    const globals = JSON.parse(await FS.promises.readFile(globalDataSrc, { encoding: 'utf-8' }));
    for (const [key, value] of Object.entries(globals)) {
        env.addGlobal(key, value);
    }
};
