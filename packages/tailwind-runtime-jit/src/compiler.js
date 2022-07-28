import tailwindcss, { Config } from 'tailwindcss';
import postcss from 'postcss';

const VIRTUAL_SOURCE_PATH = '/sourcePath';

/**
 * @param {Config} config
 * @param {(styles: string) => void} handler
 */
export default (config, handler) => {
  const classNames = ['m-0'];
  const classNamesSet = new Set(classNames);

  const collectNewClassNames = () => {
    let didAddClasses = false;
    for (const element of document.querySelectorAll('[class]')) {
      for (const className of element.classList) {
        if (classNamesSet.has(className)) {
          continue;
        }
        didAddClasses = true;
        classNames.push(className);
        classNamesSet.add(className);
      }
    }
    return didAddClasses;
  };

  const update = async () => {
    if (!collectNewClassNames()) {
      return;
    }

    self[VIRTUAL_SOURCE_PATH] = classNames.join(' ');

    const result = (await postcss([
      tailwindcss({
        ...config,
        content: [VIRTUAL_SOURCE_PATH],
        _hash: Math.random().toString().slice(2)
      }),
    ]).process('@tailwind components;@tailwind utilities;@tailwind variants;', {
      from: 'source.css',
    })).css;

    handler(result);
  };

  update();

  const observer = new MutationObserver(async r => {
    await update();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true
  });

  return () => {
    observer.disconnect();
  };
};
