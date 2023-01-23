import { Metafile } from 'esbuild';

import { BundlerPlugin } from '../types.js';
import { createAssetLoaderTemplate } from '../utils/asset-loader.js';

export const PLUGIN_NAME = 'wp-bundler-asset-loader';

export const assetLoader: BundlerPlugin = (options) => ({
  name: PLUGIN_NAME,
  setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd((result) => {
      ensureMetafile(result);

      let compileAssetLoader = createAssetLoaderTemplate(options);
      let text = compileAssetLoader({ metafile: result.metafile });

      let absolute = options.project.paths.absolute(options.config.assetLoader.path);
      let relative = options.project.paths.relative(options.config.assetLoader.path);

      result.metafile.outputs[relative] = {
        bytes: Buffer.from(text, 'utf-8').byteLength,
        exports: [],
        imports: [],
        inputs: {},
      };

      (result.outputFiles ?? []).push({
        path: absolute,
        contents: Buffer.from(text, 'utf-8'),
        text,
      });
    });
  },
});

function ensureMetafile<T extends { metafile?: Metafile }>(result: T): asserts result is T & { metafile: Metafile } {
  if (result.metafile == null) {
    throw new Error('No metafile');
  }
}
