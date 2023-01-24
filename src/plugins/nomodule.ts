import * as path from 'node:path';

import swc from '@swc/core';
import esbuild from 'esbuild';

import type { BundlerPlugin } from '../types.js';
import { createFileHandler } from '../utils/file-handler.js';
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
      let files = createFileHandler(result, project);

      for (let output of files.items()) {
        if (!isNomodulePath(output.path)) continue;
        let next = await transform(output.text, output.path);
        output.contents = Buffer.from(next, 'utf-8');
      }

      function isNomodulePath(path: string) {
        return path.includes('.nomodule.');
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
  return '"use strict";' + wrapped.code;
}
