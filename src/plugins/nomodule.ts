import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { transform } from '@swc/core';
import esbuild from 'esbuild';

import type { BundlerPlugin } from '../types.js';
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
    for (let [key, entry] of Object.entries(build.initialOptions.entryPoints as Record<string, string>)) {
      entryPoints[key] = entry;
      let ext = path.extname(entry);
      if (ext !== '.css') {
        entryPoints[`${key}.nomodule`] = entry.replace(ext, `.nomodule${ext}`);
      }
    }

    build.initialOptions.entryPoints = entryPoints;

    build.onResolve({ filter: /\.nomodule/ }, (args) => {
      if (args.kind === 'entry-point') {
        return {
          path: project.paths.absolute(args.path.replace('.nomodule', '')),
          namespace: NAMESPACE,
        };
      }

      return undefined;
    });

    build.onLoad({ filter: /.+/, namespace: NAMESPACE }, async (args) => {
      let plugins = (build.initialOptions.plugins ?? []).filter((plugin) => !IGNORED_PLUGINS.includes(plugin.name));
      plugins.push(swc());

      let result = await esbuild.build({
        ...build.initialOptions,
        entryPoints: [args.path],
        write: false,
        format: 'iife',
        target: 'es5',
        loader: {
          ...build.initialOptions.loader,
          '.css': 'empty',
        },
        plugins,
      });

      let output = result.outputFiles[0];
      if (output) return { contents: output.text };
      return undefined;
    });
  },
});

const swc = (): esbuild.Plugin => ({
  name: 'wp-bundler-swc',
  setup(build) {
    build.onLoad({ filter: /.(js|ts|tsx|jsx)$/, namespace: '' }, async (args) => {
      const contents = await fs.readFile(args.path, 'utf-8');
      let { code } = await transform(contents, {
        filename: args.path,
        sourceMaps: false,
        isModule: true,
        env: {
          targets: {
            chrome: '58',
            ie: '11',
          },
        },
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
        },
      });

      return { contents: code };
    });
  },
});
