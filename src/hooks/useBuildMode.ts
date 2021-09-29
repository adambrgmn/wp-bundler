import { createModel } from 'xstate/lib/model.js';
import { useMachine } from '@xstate/react';
import { BuildResult, Metafile } from 'esbuild';
import { Bundler } from '../bundler';
import { useEffect } from 'react';
import { assign, ContextFrom } from 'xstate';
import { useApp } from 'ink';

export function useBuildMode(bundler: Bundler) {
  const app = useApp();
  const [state, send] = useMachine(() => createBuildMachine({ bundler }));

  useEffect(() => {
    if (state.done) app.exit((state.context.error as any) ?? undefined);
  }, [state, app]);

  useEffect(() => {
    let onError = (error: unknown) => send(buildModel.events.error(error));
    process.on('unhandledRejection', onError);

    return () => {
      process.off('unhandledRejection', onError);
    };
  }, [bundler, send]);

  return [state] as const;
}

const buildModel = createModel(
  {
    bundler: null as unknown as Bundler,
    result: null as null | (BuildResult & { metafile: Metafile }),
    error: null as null | unknown,
  },
  {
    events: {
      error: (error: unknown) => ({ error }),
    },
  },
);

function createBuildMachine(ctx: Pick<BuildContext, 'bundler'>) {
  return buildModel.createMachine({
    context: { ...buildModel.initialContext, ...ctx },
    initial: 'preparing',
    on: {
      error: {
        target: 'error',
        actions: buildModel.assign({
          error: (_: any, event: any) => event.error,
        }),
      },
    },
    states: {
      preparing: {
        invoke: {
          id: 'prepare',
          src: (ctx) => ctx.bundler.prepare(),
          onDone: 'building',
          onError: 'error',
        },
      },
      building: {
        invoke: {
          id: 'build',
          src: (ctx) => ctx.bundler.build(),
          onDone: {
            target: 'success',
            actions: assign({ result: (_, event) => event.data }),
          },
          onError: {
            target: 'error',
            actions: assign({ error: (_, event) => event.data }),
          },
        },
      },
      success: { type: 'final' },
      error: { type: 'final' },
    },
  });
}

export type BuildContext = ContextFrom<typeof buildModel>;
