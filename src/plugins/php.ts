import { BundlerPlugin } from '../types';
import { createAssetLoaderTemplate } from '../utils/asset-loader';

export const php: BundlerPlugin = (options) => ({
  name: 'wp-bundler-php',
  setup(build) {
    let write = createAssetLoaderTemplate(options);
    build.onEnd(async ({ metafile = { outputs: {} } }) => {
      await write({ metafile });
    });
  },
});
