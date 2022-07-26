import { FunctionalComponent, hydrate } from 'preact';

type RenderPageFn = <P>(name: string, component: FunctionalComponent<P>) => void;

export const definePage: RenderPageFn = typeof window !== 'undefined' ?
  (name, Component) => {
    const props = window.__preload;

    hydrate(
      <>
        <Component {...props} />
      </>,
      document.body
    );
  } :
  () => {};
