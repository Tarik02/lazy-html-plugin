/**
 * @param {import('twing').TwingEnvironment} env
 * @this {import('webpack').LoaderContext<{}>}
 */
export default function (env, params) {
  env.addGlobal('mode', this.mode);
};
