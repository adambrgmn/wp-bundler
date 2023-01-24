import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import swc from '@swc/core';
import esbuild from 'esbuild';

import { BundlerPlugin } from '../types.js';
import { PLUGIN_NAME as ASSET_LOADER } from './asset-loader.js';
import { PLUGIN_NAME as LOG } from './log.js';
import { PLUGIN_NAME as POSTCSS } from './postcss.js';
import { PLUGIN_NAME as TRANSLATIONS } from './translations.js';
import { PLUGIN_NAME as WATCH } from './watch.js';

const NAMESPACE = 'wp-bundler-nomodule';
const PLUGIN_NAME = 'wp-bundler-nomodule';

const IGNORED_PLUGINS = [PLUGIN_NAME, TRANSLATIONS, POSTCSS, ASSET_LOADER, LOG, WATCH];

export const nomodule: BundlerPlugin = ({ project }) => ({
  name: PLUGIN_NAME,
  setup(build) {
    if (build.initialOptions.entryPoints == null) {
      throw new Error('You must configure entrypoints for this plugin to work');
    }

    let entryPoints: Record<string, string> = {};
    for (let [key, entry] of Object.entries(build.initialOptions.entryPoints)) {
      entryPoints[key] = entry;
      let ext = path.extname(entry);
      if (ext !== '.css') {
        entryPoints[`${key}.nomodule`] = entry.replace(ext, `.nomodule${ext}`);
      }
    }

    build.initialOptions.entryPoints = entryPoints;

    build.onResolve({ filter: /\.nomodule/ }, async (args) => {
      if (args.kind === 'entry-point') {
        let resolved = await build.resolve(args.path.replace('.nomodule', ''), {
          resolveDir: args.resolveDir,
          kind: 'entry-point',
        });

        return { ...resolved, namespace: NAMESPACE };
      }

      return undefined;
    });

    build.onLoad({ filter: /.+/, namespace: NAMESPACE }, async (args) => {
      let plugins = (build.initialOptions.plugins ?? []).filter((plugin) => !IGNORED_PLUGINS.includes(plugin.name));

      let result = await esbuild.build({
        ...build.initialOptions,
        entryPoints: [args.path],
        write: false,
        minify: false,
        splitting: false,
        loader: { ...build.initialOptions.loader, '.css': 'empty' },
        plugins,
      });

      let output = result.outputFiles[0];
      if (output) return { contents: output.text };

      return undefined;
    });

    build.onEnd(async (result) => {
      function isNomodulePath(path: string) {
        return path.includes('.nomodule.');
      }

      if (result.outputFiles) {
        for (let output of result.outputFiles) {
          if (!isNomodulePath(output.path)) continue;

          let next = await transform(output.text, output.path);
          output.contents = Buffer.from(next, 'utf-8');
        }
      } else if (result.metafile) {
        for (let [path, output] of Object.entries(result.metafile.outputs)) {
          if (!isNomodulePath(path)) continue;

          let absolutePath = project.paths.absolute(path);
          let text = await fs.readFile(absolutePath, 'utf-8');
          let next = await transform(text, path);
          await fs.writeFile(absolutePath, next, 'utf-8');
          output.bytes = Buffer.from(next, 'utf-8').byteLength;
        }
      }
    });
  },
});

async function transform(contents: string, filename: string) {
  let { code } = await swc.transform(contents, {
    filename,
    sourceMaps: false,
    isModule: false,
    minify: false,
    jsc: {
      parser: { syntax: 'ecmascript', jsx: false },
      target: 'es5',
      externalHelpers: false,
    },
  });

  let wrapped = await esbuild.transform(code, { format: 'iife', minify: true, target: 'es5' });
  return wrapped.code;
}
