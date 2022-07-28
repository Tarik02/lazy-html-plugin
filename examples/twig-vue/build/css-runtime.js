import tailwindJit from 'tailwind-runtime-jit';

import tailwindConfig from './tailwind.config';

const styleElement = document.createElement('style');
document.head.appendChild(styleElement);

document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(styleElement);
});

const stylesManager = {
    set(styles) {
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    },
    push(styles) {
        styleElement.textContent += styles;
        document.head.appendChild(styleElement);
    }
};

let close = tailwindJit(tailwindConfig, stylesManager);

module.hot.accept('./tailwind.config', () => {
    close();
    tailwindJit(tailwindConfig, stylesManager);
});
