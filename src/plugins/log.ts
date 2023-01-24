import { performance } from 'node:perf_hooks';

import type { Plugin } from 'esbuild';

import type { Logger } from '../logger.js';
import type { BundlerOptions } from '../types.js';

export const PLUGIN_NAME = 'wp-bundler-logger';

export function log(options: BundlerOptions, logger: Logger): Plugin {
  return {
    name: PLUGIN_NAME,
    setup(build) {
      let start: number;

      logger.info(`Running bundler in ${logger.chalk.blue(options.mode)} mode.`);

      build.onStart(() => {
        start = performance.now();
        logger.info('Building...');
      });

      build.onEnd((result) => {
        let errors = result?.errors.length ?? 0;
        let warnings = result?.warnings.length ?? 0;

        logger.buildOutput({
          metafile: result.metafile ?? { inputs: {}, outputs: {} },
          outputFiles: result.outputFiles ?? [],
          root: options.project.paths.root,
          entryPoints: options.config.entryPoints,
        });

        if (errors + warnings > 0 && result != null) {
          logger.buildResult(result);
          logger.warn(`Build ended, but with ${errors} error(s) and ${warnings} warning(s).`);
        } else {
          let diff = Math.round(performance.now() - start);
          logger.success(`Build succeeded in ${diff} ms.`);
        }

        if (options.watch) logger.info('Watching files...');
      });
    },
  };
}
