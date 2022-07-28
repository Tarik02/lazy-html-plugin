import tailwindJit from './compiler';

export default () => {
  const styleElement = document.createElement('style');
  document.head.appendChild(styleElement);

  document.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(styleElement);
  });

  let close;

  const update = config => {
    close?.();
    close = tailwindJit(config, styles => {
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    });
  };

  return {
    update,
    close,
  };
};
