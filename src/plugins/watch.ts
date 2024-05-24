import { globbySync } from 'globby';

import type { BundlerPlugin } from '../types.js';

export const PLUGIN_NAME = 'wp-bundler-watch';

export const watch: BundlerPlugin = (options) => ({
  name: PLUGIN_NAME,
  setup(build) {
    let watchFiles = globbySync(['**/*.php', '**/*.twig', '!vendor', '!node_modules'], {
      cwd: options.project.paths.root,
    }).map((p) => options.project.paths.absolute(p));

    let entry = Object.values(options.config.entryPoints)[0];
    let filter = new RegExp(entry?.replaceAll('.', '\\.').replaceAll('/', '\\/') ?? '');

    build.onResolve({ filter }, (args) => {
      return {
        path: options.project.paths.absolute(args.path),
        watchFiles,
      };
    });
  },
});
