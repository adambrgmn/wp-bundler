import { Metafile } from 'esbuild';

import { BundlerPlugin } from '../types.js';
import { createAssetLoaderTemplate } from '../utils/asset-loader.js';
import { createFileHandler } from '../utils/handle-bundled-file.js';

export const PLUGIN_NAME = 'wp-bundler-asset-loader';

export const assetLoader: BundlerPlugin = (options) => ({
  name: PLUGIN_NAME,
  setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd((result) => {
      ensureMetafile(result);

      let compileAssetLoader = createAssetLoaderTemplate(options);
      let contents = compileAssetLoader({ metafile: result.metafile });

      let files = createFileHandler(result, options);
      files.append({ path: options.config.assetLoader.path, contents });
    });
  },
});

function ensureMetafile<T extends { metafile?: Metafile }>(result: T): asserts result is T & { metafile: Metafile } {
  if (result.metafile == null) {
    throw new Error('No metafile');
  }
}
