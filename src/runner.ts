import { BuildFailure, BuildResult, Metafile } from 'esbuild';
import { performance } from 'perf_hooks';
import { assign, createMachine, interpret } from 'xstate';

import { Bundler } from './bundler';
import { Logger } from './logger';
import { Server } from './server';
import { Mode } from './types';
import { Watcher } from './watcher';

export type MachineContext = {
  mode: Mode;
  watch: boolean;
  cwd: string;
  host: string;
  port: number;
};

type MachineContextInternal = {
  bundler: Bundler;
  server: Server;
  watcher: Watcher;
  logger: Logger;
  result: Pick<BuildResult, 'errors' | 'warnings'> | null;
  metafile: Metafile | null;
  error: unknown | null;
  changedFiles: string[];
  startTime: number;
};

type Context = MachineContext & MachineContextInternal;

type Events =
  | { type: 'BUILD' }
  | { type: 'REBUILD'; changedFiles: string[] }
  | { type: 'CANCEL' }
  | { type: 'SETUP_FAILURE'; error: unknown };

const defaultContext: Context = {
  mode: 'prod',
  watch: false,
  cwd: process.cwd(),
  host: 'localhost',
  port: 3000,

  bundler: null as any as Bundler,
  server: null as any as Server,
  watcher: null as any as Watcher,
  logger: null as any as Logger,

  result: null,
  metafile: null,
  error: null,
  changedFiles: [],
  startTime: performance.now(),
};

export const createRunner = (context: Partial<MachineContext>) =>
  interpret(
    machine.withContext({
      ...defaultContext,
      ...context,
    }),
  );

export const machine =
  /** @xstate-layout N4IgpgJg5mDOIC5QHcAOBaARgVwHYQBswAnAOgEtCwBiAIQFUBJAGQBFFRUB7WcgF3JdcHEAA9EARgBsABlIBORfIDsADgCsAZk0zV8qQBoQAT0nL5pGVZkAWAEx2ZUiXb0BfN0bRY8VMpSJqAGUAUQAVegAFAH0AMQBBFnoAJRCRbl4BIRFxBAdVUns9DXV5dWUZTRcjUwRFUnVrCXlXTVVNG2V1Dy8MHHwiMhxyAghyXChqCCEwClwANy4Aa1nvfr8fEYh0nn5BYSQxRHK5Rx1nTTspfRllGsQpDstrZxs9fU0pHpA130HSYajcaTEjELhkVAEACGfAAZuCALakX4DEibUY7TL7HLHVSnSpOCSXa6yO4mRBtKTPKwddRSLRSezfFF+AHYLbA6gAYXiADkuSFmJi9tlDrlSvjzkSrjcybUJG9qTI7Op2lLGcy+n8SMiYQBjAAWnJ5-MFwqyB1AuQkyoKlzxb1Kdk06lc9wQnQkDReeM08maMm6nh+WtRZGQ+qNE2oqQYLHYhwyIstRwQEgk6hshSKqhsNpc9k07rzym9Vn0ah0zVUHmDuC4EDgIhZ-wCYHN2LFiHs7okyk0Soq8hsilVEk1PjDbI5Ew7oqtiBVFgzUkcyhsOmV6gkvc6ZZkzVa7U6Qd6k9ZEb4huBpFB4LnKdyGgHCsDymuymdn2LeMHdhsgYdBINbBi2OqXteEykLA2B6nqcDwImuwWjiCDPqQr7lB+X6GOSCCZhY1jKp8I7yKoXygaGF6RsCD6oaodjLgBWEqDhxa3EqVaKHYLjyBO6z-HexB0V2CAVOopCyPIVTKAquZlLh8r2EqMjyKpry5hRZ4CTqMFwQhIkLmmCoDv2G62HmbSqKo7qNAURFVIxtyNFIWkhuegyGamwHuugsiFEoZGZjYzirhRHhAA */
  createMachine(
    {
      context: defaultContext,
      tsTypes: {} as import('./runner.typegen').Typegen0,
      schema: {
        context: {} as Context,
        events: {} as Events,
        services: {} as { build: { data: BuildResult | BuildFailure } },
      },
      entry: ['createDependencies', 'logSetup'],
      invoke: {
        src: 'setupServices',
        id: 'wp-bundler-watchers',
      },
      id: 'wp-bundler',
      initial: 'idle',
      states: {
        idle: {
          on: {
            BUILD: {
              target: 'building',
            },
            SETUP_FAILURE: {
              target: 'error',
            },
          },
        },
        building: {
          entry: ['logBuildStart', 'setStartTime'],
          invoke: {
            src: 'build',
            id: 'wp-bundler-build',
            onDone: [
              {
                actions: ['setResult'],
                cond: 'isWatchMode',
                target: '#wp-bundler.watching.success',
              },
              {
                actions: ['setResult'],
                target: 'success',
              },
            ],
            onError: [
              {
                actions: ['setErrorResult'],
                cond: 'isWatchMode',
                target: '#wp-bundler.watching.error',
              },
              {
                actions: ['setErrorResult'],
                target: 'error',
              },
            ],
          },
          on: {
            CANCEL: {
              target: 'success',
            },
          },
        },
        watching: {
          states: {
            error: {
              entry: ['logWatchError'],
            },
            success: {
              entry: ['reloadDevServer', 'logWatchSuccess'],
            },
          },
          on: {
            CANCEL: {
              target: 'success',
            },
            REBUILD: {
              actions: ['setChangedFiles'],
              target: 'building',
            },
          },
        },
        error: {
          entry: ['logBuildError'],
          type: 'final',
        },
        success: {
          entry: ['logBuildSuccess'],
          type: 'final',
        },
      },
    },
    {
      guards: {
        isWatchMode: (context) => context.watch,
      },
      services: {
        build: async (context) => {
          return context.bundler.build();
        },
        setupServices: (context) => (send) => {
          try {
            context.bundler.prepare();

            if (context.watch) {
              context.server.listen();

              const handleFileChange = ({ files }: { files: string[] }) => {
                send({ type: 'REBUILD', changedFiles: files });
              };
              context.watcher.on('watcher.change', handleFileChange);

              send({ type: 'BUILD' });

              return () => {
                if (context.watch) {
                  context.watcher.off('watcher.change', handleFileChange);
                  context.watcher.close();
                  context.server.close();
                }
              };
            } else {
              send({ type: 'BUILD' });
            }
          } catch (error) {
            send({ type: 'SETUP_FAILURE', error });
          }
        },
      },
      actions: {
        logSetup: (context, _) => {
          context.logger.info(`Running bundler in ${context.logger.chalk.blue(context.mode)} mode.`);
        },
        logBuildStart: (context, _) => {
          context.logger.info('Building...');
        },
        logBuildError: (context, _) => {
          let errors = context.result?.errors.length ?? 0;
          let warnings = context.result?.warnings.length ?? 0;

          if (context.result != null) context.logger.buildResult(context.result);
          context.logger.error(`Build failed with ${errors} error(s) and ${warnings} warning(s).`);
        },
        logBuildSuccess: (context, _) => {
          if (context.metafile != null) {
            context.logger.buildOutput(context.metafile, context.cwd);
          }

          let errors = context.result?.errors.length ?? 0;
          let warnings = context.result?.warnings.length ?? 0;
          if (errors + warnings > 0 && context.result != null) {
            context.logger.buildResult(context.result);
            context.logger.warn(`Build succeeded, but with ${errors} error(s) and ${warnings} warning(s).`);
          } else {
            let diff = Math.round(performance.now() - context.startTime);
            context.logger.success(`Build succeeded in ${diff} ms.`);
          }
        },
        logWatchError: (context, _) => {
          let errors = context.result?.errors.length ?? 0;
          let warnings = context.result?.warnings.length ?? 0;

          if (context.result != null) context.logger.buildResult(context.result);
          context.logger.error(`Build failed with ${errors} error(s) and ${warnings} warning(s).`);
          context.logger.info('Watching files...');
        },
        logWatchSuccess: (context, _) => {
          if (context.metafile != null) {
            context.logger.buildOutput(context.metafile, context.cwd);
          }

          let errors = context.result?.errors.length ?? 0;
          let warnings = context.result?.warnings.length ?? 0;
          if (errors + warnings > 0 && context.result != null) {
            context.logger.buildResult(context.result);
            context.logger.warn(`Build succeeded, but with ${errors} error(s) and ${warnings} warning(s).`);
          } else {
            let diff = Math.round(performance.now() - context.startTime);
            context.logger.success(`Build succeeded in ${diff} ms.`);
          }

          context.logger.info('Watching files...');
        },

        createDependencies: assign({
          bundler: (context, _) => new Bundler(context),
          server: (context, _) => new Server(context),
          watcher: (context, __) => new Watcher(context.cwd),
          logger: (_, __) => new Logger('WP-BUNDLER', process.stderr),
        }),

        reloadDevServer: (context, _) => {
          context.server.broadcast({ type: 'reload', files: context.changedFiles });
        },

        setChangedFiles: assign({
          changedFiles: (_, event) => event.changedFiles,
        }),
        setResult: assign({
          result: (_, event) => event.data,
          metafile: (_, event) => ('metafile' in event.data ? event.data.metafile ?? null : null),
        }),
        setErrorResult: assign({
          result: (_, event) => (isEsbuildBuildFailure(event.data) ? event.data : null),
          error: (_, event) => event.data,
        }),
        setStartTime: assign({
          startTime: (_, __) => performance.now(),
        }),
      },
    },
  );

function isEsbuildBuildFailure(result: unknown): result is BuildFailure {
  if (typeof result !== 'object') {
    return false;
  }

  if (result == null) return false;

  return 'errors' in result || 'warnings' in result;
}
