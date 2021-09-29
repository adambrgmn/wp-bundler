import * as fs from 'fs/promises';
import * as path from 'path';
import { Plugin } from 'esbuild';
import { BundlerPlugin } from '../types';

export const metafile: BundlerPlugin = (): Plugin => ({
  name: 'wp-bundler-manifest',
  setup(build) {
    build.initialOptions.metafile = true;

    build.onEnd(async ({ metafile }) => {
      if (metafile != null && build.initialOptions.outdir != null) {
        await fs.writeFile(
          path.join(build.initialOptions.outdir, './metafile.json'),
          JSON.stringify(metafile, null, 2),
        );
      }
    });
  },
});
