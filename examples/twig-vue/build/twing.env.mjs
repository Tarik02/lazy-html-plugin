/** @type {import('twing').TwingEnvironmentOptions} */
export const options = {
  debug: true,
};

/**
 * @param {import('twing').TwingEnvironment} env
 * @this {import('webpack').LoaderContext<{}>}
 */
export function configure(env, params) {
  env.addGlobal('mode', this.mode);
};
