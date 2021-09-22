import { Plugin } from 'esbuild';

export const manifest = (): Plugin => ({
  name: 'wp-bundler-manifest',
  setup(build) {},
});
