import { Plugin } from 'esbuild';

export const externals = (): Plugin => ({
  name: 'wp-bundler-externals',
  setup(build) {
    let externals: Record<string, string> = {
      react: 'React',
      'react-dom': 'ReactDOM',
    };

    for (let key of Object.keys(externals)) {
      build.onResolve({ filter: new RegExp(`^${key}$`) }, (args) => ({
        path: args.path,
        namespace: '_wp-bundler-externals',
      }));
    }

    build.onLoad(
      { filter: /.*/, namespace: '_wp-bundler-externals' },
      (args) => {
        return {
          contents: `module.exports = window.${externals[args.path]}`,
          loader: 'js',
        };
      },
    );
  },
});
