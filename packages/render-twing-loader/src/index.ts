import * as Path from 'path';
import * as Webpack from 'webpack';
import md5 from 'md5';
import LRU from 'lru-cache';
import {
  TwingEnvironment,
  TwingLoaderFilesystem,
  TwingLoaderArray,
  TwingLoaderChain,
  TwingSource,
  TwingError,
  TwingCacheInterface
} from 'twing';

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
  environmentModule?: undefined | string;
  environmentParams?: undefined | Record<string, any>;
};

const cacheData = new LRU<string, { timestamp: number, data: string }>({
  max: 1000,
});
const cache: TwingCacheInterface = {
  generateKey: async (name, className) => {
    return md5(className);
  },
  load: async key => {
    const item = cacheData.get(key);
    if (item) {
      const module = { exports: () => new Map() };
      eval(item.data);
      return module.exports;
    } else {
      return () => new Map();
    }
  },
  write: async (key, content) => {
    cacheData.set(key, {
      timestamp: Date.now(),
      data: content,
    });
  },
  getTimestamp: async key => cacheData.get(key)?.timestamp ?? 0
};

export default async function (this: Webpack.LoaderContext<Options>, source: string) {
  this.cacheable && this.cacheable(true);

  const callback = this.async();

  try {
    const options = this.getOptions({
      type: 'object',
      additionalProperties: false,
      properties: {
        context: {
          type: 'string',
        },
        output: {
          type: 'string',
          enum: [
            'html',
            'function',
          ],
        },
        environmentModule: {
          type: 'string',
        },
        environmentParams: {
          type: 'object',
        },
      },
    });
    const resourcePath = this.resourcePath;
    const context = options.context || Path.dirname(resourcePath);

    this.addDependency(resourcePath);

    const env = new TwingEnvironment(new TwingLoaderChain([
      new TwingLoaderFilesystem([''], context),
    ]));
    env.setCache(cache);

    if (options.environmentModule) {
      this.addDependency(options.environmentModule);

      const module = await import(`${ options.environmentModule }?${ Date.now() }`);

      await module.default.call(
        this,
        env,
        options.environmentParams ?? {}
      );
    }

    env.setLoader(new TwingLoaderChain([
      new PathSupportingArrayLoader(new Map([
        [resourcePath, source]
      ])),
      env.getLoader(),
    ]));

    env.on('template', async (name: string, from: TwingSource) => {
      const sourceContext = await env.getLoader().getSourceContext(name, from);
      this.addDependency(Path.resolve(sourceContext.getResolvedName()));
    });

    let result = await env.render(resourcePath, {});

    switch (options.output) {
    case undefined:
    case 'html':
      break;

    case 'function':
      result = `module.exports=function(){return ${ JSON.stringify(result) };};`;
      break;
    }

    callback(null, result);
  } catch (error) {
    if (error instanceof TwingError) {
      const newError = new Webpack.WebpackError(error.name + ': ' + error.getMessage());

      newError.name = error.name;
      newError.stack = '';
      newError.hideStack = true;

      error = newError;
    }
    callback(error instanceof Error ? error : new Error(error as any));
  }
};
