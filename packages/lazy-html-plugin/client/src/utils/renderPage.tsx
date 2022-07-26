import { FunctionalComponent, hydrate } from 'preact';
import * as renderToString from 'preact-render-to-string';

export const renderPage = <P extends { prefix: string },>(name: string, Component: FunctionalComponent<P>, props: P): string => {
  return '<!doctype html>' + (renderToString as any)(
    <html>
      <head></head>
      <body>
        <Component {...props} />

        <script dangerouslySetInnerHTML={{
          __html: `window.__preload = ${JSON.stringify(props)}`,
        }} />
        <script src={`/${ props.prefix }/lazy-html-plugin/${ name }.js`} />
      </body>
    </html>
  );
};
