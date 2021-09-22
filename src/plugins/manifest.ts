import * as fs from 'fs/promises';
import * as path from 'path';
import { Plugin } from 'esbuild';
import { Manifest } from '../schema';
import { BundlerPlugin } from '../types';

export const manifest: BundlerPlugin = (_, { entryPoints }): Plugin => ({
  name: 'wp-bundler-manifest',
  setup(build) {
    build.initialOptions.metafile = true;

    build.onEnd(async ({ metafile = { outputs: {} } }) => {
      let outdir = build.initialOptions.outdir;
      if (outdir == null) throw new Error('An outdir is required.');

      let manifest: Manifest = {};
      let names = Object.keys(entryPoints);

      for (let name of names) {
        let js = Object.keys(metafile.outputs).find(
          (key) => key.includes(name) && key.endsWith('.js'),
        );
        let css = Object.keys(metafile.outputs).find(
          (key) => key.includes(name) && key.endsWith('.css'),
        );
        if (js == null && css == null) continue;
        manifest[name] = { name, js, css };
      }

      await fs.writeFile(
        path.join(outdir, './manifest.json'),
        JSON.stringify(manifest, null, 2),
      );
    });
  },
});
