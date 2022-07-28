import * as Webpack from 'webpack';

type Options = {
  publicPath: string;
  output: string;
};

export async function pitch(this: Webpack.LoaderContext<Options>, request: string, remainingRequest: string) {
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

  try {
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
  }
};


export default async function (this: Webpack.LoaderContext<Options>, source: string, remainingRequest: string) {
  return '';
};
