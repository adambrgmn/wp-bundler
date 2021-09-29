import { BundlerPlugin } from '../types';

export const define: BundlerPlugin = ({ mode }) => ({
  name: 'wp-bundler-define',
  setup(build) {
    const options = build.initialOptions;
    options.define = options.define || {};

    options.define['process.env.NODE_ENV'] =
      mode === 'prod'
        ? JSON.stringify('production')
        : JSON.stringify('development');

    options.define['__DEV__'] = JSON.stringify(mode === 'dev');
    options.define['__PROD__'] = JSON.stringify(mode === 'prod');
  },
});
