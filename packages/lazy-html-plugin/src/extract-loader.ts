import * as Webpack from 'webpack';

type Options = {
  publicPath: string;
  output: string;
};

export async function pitch(this: Webpack.LoaderContext<Options>, request: string) {
  const options = this.getOptions({
    type: 'object',
    required: ['publicPath', 'output'],
    properties: {
      publicPath: {
        type: 'string',
      },
      output: {
        type: 'string',
      },
    },
  });

  this.addDependency(this.resourcePath);

  try {
    await new Promise<void>((resolve, reject) => {
      this.loadModule(
        `${ this.resourcePath }.webpack[javascript/auto]!=!${ request }`,
        err => err ? reject(err) : resolve()
      );
    });

    const res = await this.importModule(
      `${ this.resourcePath }.webpack[javascript/auto]!=!${ request }`,
      {
        publicPath: options.publicPath,
      }
    );

    this.emitFile(options.output, res, undefined, {
      sourceFilename: this.utils.contextify(this.rootContext, this.resourcePath).replace(/^\.[\\\/]/, ''),
    });
  } catch (e) {
    if (e.message === 'The loaded module contains errors') {
      return '';
    }

    throw e;
  }

  return '';
};
