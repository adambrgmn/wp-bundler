import * as path from 'node:path';

import { transform } from '@swc/core';
import esbuild from 'esbuild';

import { BundlerPlugin } from '../types.js';
import { PLUGIN_NAME as POSTCSS } from './postcss.js';
import { PLUGIN_NAME as TRANSLATIONS } from './translations.js';

const NAMESPACE = 'wp-bundler-nomodule';
const PLUGIN_NAME = 'wp-bundler-nomodule';

const IGNORED_PLUGINS = [PLUGIN_NAME, TRANSLATIONS, POSTCSS];

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
      let result = await esbuild.build({
        ...build.initialOptions,
        entryPoints: [args.path],
        write: false,
        format: 'iife',
        loader: {
          ...build.initialOptions.loader,
          '.css': 'empty',
        },
        plugins: (build.initialOptions.plugins ?? []).filter((plugin) => !IGNORED_PLUGINS.includes(plugin.name)),
      });

      let output = result.outputFiles[0];
      if (output) {
        let contents = output.text;
        let { code } = await transform(contents, {
          filename: args.path,
          sourceMaps: false,
          isModule: true,

          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            target: 'es5',
          },
        });
        return { contents: code };
      }

      return undefined;
    });
  },
});
