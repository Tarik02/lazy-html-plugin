import * as Express from 'express';
import * as globPromise from 'glob-promise';
import * as Path from 'path';
import * as Webpack from 'webpack';
import { DefaultPathMapper } from './path/DefaultPathMapper';
import { EntryMiddleware } from './middleware/EntryMiddleware';
import { EventsMiddleware } from './middleware/EventsMiddleware';
import { isPathMapper, PathMapper } from './path/PathMapper';
import { injectDevServerMiddlewareSetup } from './quirks/injectDevServerMiddlewareSetup';
import { ConstantTemplatesManager } from './templates/ConstantTemplatesManager';
import { TemplatesManager } from './templates/TemplatesManager';
import { WatchingTemplatesManager } from './templates/WatchingTemplatesManager';
import { executeNestedCompiler } from './quirks/executeNestedCompiler';
import { IndexMiddleware } from './middleware/IndexMiddleware';
import { Template } from './templates/Template';
import { RedirectMiddleware } from './middleware/RedirectMiddleware';
import { CompilerLock } from './lock';

const PLUGIN_NAME = 'LazyHtmlPlugin';

type Options = {
  publicPath: string;
  context: string;
  inputGlob?: string | undefined;
  forceAll?: boolean | undefined;
  pathMapper?: (
    | undefined
    | {
      inputLoader: string;
      inputSuffix: string;
      outputSuffix: string;
    }
    | PathMapper
  );
};

type OptionsNormalized = {
  publicPath: string;
  context: string;
  inputGlob: string;
  forceAll: boolean;
};

class LazyHtmlPlugin {
  protected options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  apply(compiler: Webpack.Compiler): void {
    const options: OptionsNormalized = {
      publicPath: this.options.publicPath.replace(/(^[\\\/]*|[\\\/]*$)/g, ''),
      context: Path.resolve(compiler.context, this.options.context),
      inputGlob: this.options.inputGlob ?? '*',
      forceAll: this.options.forceAll ?? false,
    };

    const pathMapper = isPathMapper(this.options.pathMapper) ?
      this.options.pathMapper :
      new DefaultPathMapper(
        this.options.pathMapper?.inputLoader,
        this.options.pathMapper?.inputSuffix ?? '.html',
        this.options.pathMapper?.outputSuffix ?? '.html',
      );

    let templates: TemplatesManager | undefined;
    let didSetTemplatesDuringCompilation = false;

    if (options.forceAll) {
      templates = new ConstantTemplatesManager();
    }

    const lock = new CompilerLock();

    injectDevServerMiddlewareSetup(compiler.options, {
      before: (middlewares, devServer) => {
        if (templates === undefined) {
          templates = new WatchingTemplatesManager(
            () => compiler.watching.invalidate(),
            name => {
              const template = new Template();
              lock.waitForReady().then(() =>
                compiler.outputFileSystem.readFile(
                  Path.join(compiler.outputPath, options.publicPath, pathMapper.nameToOutput(name)),
                  (err, content) => {
                    if (err) {
                      return;
                    }
                    if (!content) {
                      return;
                    }
                    if (content instanceof Buffer) {
                      content = content.toString('utf-8');
                    }
                    template.emit(content);
                  }
                )
              );
              return template;
            }
          );
        }

        middlewares.unshift(
          {
            path: `/${options.publicPath}/lazy-html-plugin/__events`,
            middleware: new EventsMiddleware(templates).handler,
          },
          {
            path: `/${options.publicPath}/lazy-html-plugin`,
            middleware: Express.static(Path.join(require.resolve('@tarik02/lazy-html-plugin/package.json'), '../client/dist')),
          },
          {
            path: `/${options.publicPath}`,
            middleware: new EntryMiddleware(options.publicPath, templates, pathMapper).handler,
          },
          {
            path: `/${options.publicPath}`,
            middleware: (new IndexMiddleware(compiler.inputFileSystem as any, options.publicPath, options.context, pathMapper)).handler,
          },
        );
        return middlewares;
      },
      after: (middlewares, devServer) => {
        middlewares.push({
          path: '/',
          middleware: new RedirectMiddleware(`/${ options.publicPath }`).handler
        });

        return middlewares;
      },
    });

    compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, async () => {
      if (templates === undefined) {
        templates = new ConstantTemplatesManager();
      }

      lock.lock();
    });

    compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
      if (templates === undefined) {
        templates = new ConstantTemplatesManager();
      }

      lock.lock();
    });

    compiler.hooks.afterDone.tap(PLUGIN_NAME, async stats => {
      const compilation = stats.compilation;

      console.log(compilation.errors.map(e => ({...e})));

      lock.unlock();

      if (didSetTemplatesDuringCompilation) {
        templates = undefined;
      }
    });

    compiler.hooks.assetEmitted.tapPromise(PLUGIN_NAME, async (file, { content }) => {
      if (file.startsWith(options.publicPath + '/')) {
        const templateName = pathMapper.outputToName(
          Path.relative(options.publicPath, file)
        );

        if (templateName !== undefined) {
          lock.waitForReady().then(
            () => templates!.emit(templateName, content.toString('utf-8'))
          );
        }
      }
    });

    compiler.hooks.make.tapPromise(PLUGIN_NAME, async compilation => {
      const compilationTemplates: string[] = [];
      didSetTemplatesDuringCompilation = false;

      if (templates !== undefined) {
        compilationTemplates.push(...templates.used());
      } else {
        didSetTemplatesDuringCompilation = true;
        templates = new ConstantTemplatesManager();
      }

      if (templates instanceof ConstantTemplatesManager) {
        templates.update(
          (await globPromise(options.inputGlob, {
            cwd: options.context,
            fs: compiler.inputFileSystem as any,
          }))
            .map(file => pathMapper.inputToName(file))
            .filter((file): file is string => file !== undefined)
        );
      }

      compilation.hooks.processAssets.tap({
        name: PLUGIN_NAME,
        stage: Webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        additionalAssets: true,
      }, () => {
        for (const name of templates!.used()) {
          compilation.deleteAsset(`${ options.publicPath }/${ pathMapper.nameToOutput(name) }.js`);
        }
      });

      await executeNestedCompiler(PLUGIN_NAME, compilation, async childCompiler => {
        for (const name of templates!.used()) {
          const output = `${ options.publicPath }/${ pathMapper.nameToOutput(name) }`;
          const publicPath = Path.relative(`./${ Path.dirname(output) }`, '.') + '/';

          (new Webpack.EntryPlugin(
            options.context,
            [
              ['@tarik02/lazy-html-plugin/extract-loader', JSON.stringify({
                output,
                publicPath,
              })].join('?'),
              '@tarik02/lazy-html-plugin/html-loader',
              `./${ pathMapper.nameToInput(name) }`,
            ].join('!'),
            {
              filename: `${ output }.js`,
              name: output,
            }
          )).apply(childCompiler);
        }
      });
    });

    compiler.hooks.afterCompile.tapPromise(PLUGIN_NAME, async compilation => {
      compilation.contextDependencies.add(options.context);
    });
  }
}

export = LazyHtmlPlugin;
