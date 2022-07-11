import { BuildFailure, BuildResult, Metafile } from 'esbuild';
import { assign, createMachine } from 'xstate';

import { Bundler } from './bundler';
import { Server } from './server';
import { Mode } from './types';

type Context = {
  // User configuration
  mode: Mode;
  watch: boolean;
  cwd: string;
  host: string;
  port: number;

  // Internal
  bundler: Bundler;
  server: Server;
  result: Pick<BuildResult, 'errors' | 'warnings'> | null;
  metafile: Metafile | null;
  error: unknown | null;
  changedFiles: string[];
};

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
  result: null,
  metafile: null,
  error: null,
  changedFiles: [],
};

export const createStateMachine = (context: Partial<Pick<Context, 'mode' | 'watch'>>) =>
  machine.withContext({
    ...defaultContext,
    ...context,
  });

export const machine =
  /** @xstate-layout N4IgpgJg5mDOIC5QHcAOBaARgVwHYQBswAnAOgEtCwBiAIQFUBJAGQBFFRUB7WcgF3JdcHEAA9EARgBsABlIBORfIDsADgCsAZk0zV8qQBoQAT0nL5pGVZkAWAEx2ZUiXb0BfN0bRY8VMpSJqAGUAUQAVegAFAH0AMQBBFnoAJRCRbl4BIRFxBAdVUns9DXV5dWUZTRcjUwRFUnVrCXlXTVVNG2V1Dy8MHHwiMhxyAghyXChqCCEwClwANy4Aa1nvfr8fEYh0nn5BYSQxRHK5Rx1nTTspfRllGsQpDstrZxs9fU0pHpA130HSYajcaTEjELhkVAEACGfAAZuCALakX4DEibUY7TL7HLHVSnSpOCSXa6yO4mRBtKTPKwddRSLRSezfFF+AHYLbA6gAYXiADkuSFmJi9tlDrlSvjzkSrjcybUJG9qTI7Op2lLGcy+n8SMiYQBjAAWnJ5-MFwqyB1AuQkyoKlzxb1Kdk06lc9wQnQkDReeM08maMm6nh+WtRZGQ+qNE2oqQYLHYhwyIstRwQEgk6hshSKqhsNpc9k07rzym9Vn0ah0zVUHmDuC4EDgIhZ-wCYHN2LFiHs7okyk0Soq8hsilVEk1PjDbI5Ew7oqtiBVFgzUkcyhsOmV6gkvc6ZZkzVa7U6Qd6k9ZEb4huBpFB4LnKdyGgHCsDymuymdn2LeMHdhsgYdBINbBi2OqXteEykLA2B6nqcDwImuwWjiCDPqQr7lB+X6GOSCCZhY1jKp8I7yKoXygaGF6RsCD6oaodjLgBWEqDhxa3EqVaKHYLjyBO6z-HexB0V2CAVOopCyPIVTKAquZlLh8r2EqMjyKpry5hRZ4CTqMFwQhIkLmmCoDv2G62HmbSqKo7qNAURFVIxtyNFIWkhuegyGamwHuugsiFEoZGZjYzirhRHhAA */
  createMachine(
    {
      context: defaultContext,
      tsTypes: {} as import('./state-machine.typegen').Typegen0,
      schema: {
        context: {} as Context,
        events: {} as Events,
        services: {} as { build: { data: BuildResult | BuildFailure } },
      },
      entry: 'createDependencies',
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
          entry: 'logBuildStart',
          invoke: {
            src: 'build',
            id: 'wp-bundler-build',
            onDone: [
              {
                actions: 'setResult',
                cond: 'isWatchMode',
                target: '#wp-bundler.watching.success',
              },
              {
                actions: 'setResult',
                target: 'success',
              },
            ],
            onError: [
              {
                actions: 'setErrorResult',
                cond: 'isWatchMode',
                target: '#wp-bundler.watching.error',
              },
              {
                actions: 'setErrorResult',
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
              entry: 'logWatchError',
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
              actions: 'setChangedFiles',
              target: 'building',
            },
          },
        },
        error: {
          entry: 'logBuildError',
          type: 'final',
        },
        success: {
          entry: 'logBuildSuccess',
          type: 'final',
        },
      },
    },
    {
      actions: {
        logBuildStart: () => {
          console.error('Building...');
        },
        logBuildError: () => {
          console.error('Build failed.');
        },
        logBuildSuccess: () => {
          console.log('Build succeeded.');
        },
        logWatchError: () => {
          console.error('Build failed. Still watching files');
        },
        logWatchSuccess: () => {
          console.error('Build succeeded. Still watching files');
        },

        createDependencies: assign({
          bundler: (context, _) => new Bundler(context),
          server: (context, _) => new Server(context),
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
      },
      services: {
        build: async (context) => {
          return context.bundler.build();
        },
        setupServices: (context) => (send) => {
          const handleFileChange = ({ files }: { files: string[] }) => {
            send({ type: 'REBUILD', changedFiles: files });
          };

          (async () => {
            try {
              await context.bundler.prepare();

              if (context.watch) {
                await context.server.prepare();
                context.server.listen();
                context.server.on('watcher.change', handleFileChange);
              }

              send({ type: 'BUILD' });
            } catch (error) {
              send({ type: 'SETUP_FAILURE', error });
            }
          })();

          return () => {
            if (context.watch && context.server != null) {
              context.server.off('watcher.change', handleFileChange);
              context.server.close();
            }
          };
        },
      },
      guards: {
        isWatchMode: (context) => context.watch,
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
