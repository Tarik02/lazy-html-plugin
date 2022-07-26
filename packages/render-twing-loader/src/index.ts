import * as Path from 'path';
import * as Webpack from 'webpack';
import {
  TwingEnvironment,
  TwingLoaderFilesystem,
  TwingLoaderArray,
  TwingLoaderChain,
  TwingSource,
  TwingError
} from 'twing';

import schema from './options.json';

class PathSupportingArrayLoader extends TwingLoaderArray {
  getSourceContext(name: string, from: TwingSource): Promise<TwingSource> {
    return super.getSourceContext(name, from).then((source) => {
      return new TwingSource(source.getCode(), source.getName(), name);
    });
  }
}

export type Options = {
  context?: undefined | string;
  output?: undefined | 'html' | 'function';
};

export default function (this: Webpack.LoaderContext<Options>, source: string) {
  const callback = this.async();

  const options = this.getOptions(schema);
  const resourcePath = this.resourcePath;
  const context = options.context || Path.dirname(resourcePath);

  this.addDependency(resourcePath);

  const env = new TwingEnvironment(new TwingLoaderChain([
    new PathSupportingArrayLoader(new Map([
      [resourcePath, source]
    ])),
    new TwingLoaderFilesystem([''], context),
  ]));

  env.on('template', async (name: string, from: TwingSource) => {
    const sourceContext = await env.getLoader().getSourceContext(name, from);
    this.addDependency(Path.resolve(sourceContext.getResolvedName()));
  });

  env.render(resourcePath, {})
    .then(result => {
      switch (options.output) {
        case undefined:
        case 'html':
          return result;

        case 'function':
          return `module.exports=function(){return ${ JSON.stringify(result) };};`;
      }
    })
    .catch(error => {
      if (error instanceof TwingError) {
        const newError = new Webpack.WebpackError(error.name + ': ' + error.getMessage());

        newError.name = error.name;
        newError.stack = '';
        newError.hideStack = true;

        throw newError;
      }
      throw error;
    })
    .then(result => callback(null, result))
    .catch(error => callback(error));
};
