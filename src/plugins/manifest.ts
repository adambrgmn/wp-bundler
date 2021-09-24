import * as fs from 'fs/promises';
import * as path from 'path';
import { Plugin } from 'esbuild';
import { Manifest } from '../schema';
import { BundlerPlugin } from '../types';
import { assert } from '../utils/assert';

export const manifest: BundlerPlugin = ({ config }): Plugin => ({
  name: 'wp-bundler-manifest',
  setup(build) {
    build.initialOptions.metafile = true;

    build.onEnd(async ({ metafile = { outputs: {} } }) => {
      if (Object.keys(metafile.outputs).length < 1) return;
      assert(build.initialOptions.outdir, 'An outdir must be configured.');
      let outdir = build.initialOptions.outdir;

      let manifest: Manifest = {};
      let names = Object.keys(config.entryPoints);

      for (let name of names) {
        let js = Object.keys(metafile.outputs).find(
          (key) => key.includes(name) && key.endsWith('.js'),
        );
        let css = Object.keys(metafile.outputs).find(
          (key) => key.includes(name) && key.endsWith('.css'),
        );

        manifest[name] = { name, js, css };
      }

      await fs.writeFile(
        path.join(outdir, './manifest.json'),
        JSON.stringify(manifest, null, 2),
      );
    });
  },
});
