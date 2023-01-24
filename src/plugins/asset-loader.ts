import { BundlerPlugin } from '../types.js';
import { assert } from '../utils/assert.js';
import { createAssetLoaderTemplate } from '../utils/asset-loader.js';
import { createFileHandler } from '../utils/handle-bundled-file.js';

export const PLUGIN_NAME = 'wp-bundler-asset-loader';

export const assetLoader: BundlerPlugin = (options) => ({
  name: PLUGIN_NAME,
  setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd((result) => {
      assert(result.metafile, 'No metafile generated');

      let compileAssetLoader = createAssetLoaderTemplate(options);
      let contents = compileAssetLoader({ metafile: result.metafile });

      let files = createFileHandler(result, options.project);
      files.append({ path: options.config.assetLoader.path, contents });
    });
  },
});
