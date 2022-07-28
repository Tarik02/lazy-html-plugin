import * as Webpack from 'webpack';
import * as htmlLoader from 'html-loader';

export default function (this: Webpack.LoaderContext<{}>, content: string) {
  const oldGetOptions = this.getOptions;
  this.getOptions = ((schema: any) => {
    const result = oldGetOptions(schema) as any;
    result.esModule = false;

    if (result.minimize !== false) {
      if (typeof result.minimize !== 'object') {
        result.minimize = {
          caseSensitive: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          keepClosingSlash: true,
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
        };
      }
      result.minimize.conservativeCollapse = false;
    }

    result.sources = {
      list: [
        '...',
        {
          tag: 'script',
          attribute: 'src',
          type: 'src',
          filter: () => false,
        },
        {
          tag: 'link',
          attribute: 'href',
          type: 'src',
          filter: () => false,
        },
      ],
    };
    return result;
  }) as any;

  return htmlLoader.call(this, content);
}
