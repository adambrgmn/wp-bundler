import { createModel } from 'xstate/lib/model.js';
import { useMachine } from '@xstate/react';
import { BuildFailure, BuildResult, Metafile } from 'esbuild';
import { Bundler } from '../bundler';
import { useEffect } from 'react';
import { assign, ContextFrom } from 'xstate';

export function useBuildMode(bundler: Bundler) {
  const [state, send] = useMachine(() => createBuildMachine({ bundler }));

  useEffect(() => {
    let onInit = () => send(buildModel.events.ready());
    bundler.on('init', onInit);

    const handleRejection: NodeJS.UnhandledRejectionListener = (error) => {
      send(buildModel.events.unhandled(error));
    };
    process.on('unhandledRejection', handleRejection);

    return () => {
      bundler.off('init', onInit);
      process.off('unhandledRejection', handleRejection);
    };
  }, [bundler, send]);

  return [state] as const;
}

const buildModel = createModel(
  {
    bundler: null as unknown as Bundler,
    result: null as null | (BuildResult & { metafile: Metafile }),
    error: null as null | BuildFailure | Error,
  },
  {
    events: {
      ready: () => ({}),
      unhandled: (error: any) => ({ error }),
    },
  },
);

function createBuildMachine(ctx: Pick<BuildContext, 'bundler'>) {
  return buildModel.createMachine({
    context: { ...buildModel.initialContext, ...ctx },
    initial: 'preparing',
    on: {
      unhandled: {
        target: 'error',
        actions: buildModel.assign({ error: (_, event) => event.error }),
      },
    },
    states: {
      preparing: {
        on: {
          ready: 'building',
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
      success: {
        type: 'final',
      },
      error: {
        type: 'final',
      },
    },
  });
}

export type BuildContext = ContextFrom<typeof buildModel>;
