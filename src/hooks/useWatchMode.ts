import { useEffect } from 'react';
import { createModel } from 'xstate/lib/model.js';
import { useMachine } from '@xstate/react';
import { BuildResult, Metafile } from 'esbuild';
import { Bundler } from '../bundler';
import { useInput } from 'ink';
import { assign, ContextFrom, EventFrom, StateFrom } from 'xstate';

export function useWatchMode(bundler: Bundler) {
  const [state, send] = useMachine(() => createWatchMachine({ bundler }));

  useInput(
    (key) => {
      if (key.toLowerCase() === 'r') send(watchModel.events.restart());
    },
    { isActive: state.matches('unhandled') },
  );

  useEffect(() => {
    let onRebuildStart = () => {
      send(watchModel.events.rebuild());
    };
    bundler.on('rebuild.init', onRebuildStart);

    let onRebuildEnd = (result: BuildResult & { metafile: Metafile }) => {
      send(watchModel.events.rebuildSuccess(result));
    };
    bundler.on('rebuild.end', onRebuildEnd);

    let onRebuildError = (error: unknown) => {
      send(watchModel.events.rebuildError(error));
    };
    bundler.on('rebuild.error', onRebuildError);

    return () => {
      bundler.off('rebuild.init', onRebuildStart);
      bundler.off('rebuild.end', onRebuildEnd);
      bundler.off('rebuild.error', onRebuildError);
    };
  }, [bundler, send]);

  useEffect(() => {
    const handleRejection: NodeJS.UnhandledRejectionListener = (error) => {
      if (error != null && 'errors' in error) return;
      send(watchModel.events.unhandled(error));
    };

    process.on('unhandledRejection', handleRejection);
    return () => {
      process.off('unhandledRejection', handleRejection);
    };
  }, [send]);

  return [state] as const;
}

const watchModel = createModel(
  {
    bundler: null as unknown as Bundler,
    error: null as null | unknown,
    result: null as null | (BuildResult & { metafile: Metafile }),
    rejection: null as null | unknown,
  },
  {
    events: {
      error: (error: unknown) => ({ value: error }),
      prepared: () => ({}),
      rebuild: () => ({}),
      rebuildError: (error: unknown) => ({ value: error }),
      rebuildSuccess: (value: BuildResult & { metafile: Metafile }) => ({
        value,
      }),
      unhandled: (error: unknown) => ({ value: error }),
      restart: () => ({}),
    },
  },
);

function createWatchMachine(ctx: Pick<WatchContext, 'bundler'>) {
  return watchModel.createMachine({
    context: { ...watchModel.initialContext, ...ctx },
    initial: 'preparing',
    on: {
      unhandled: {
        target: 'unhandled',
        actions: watchModel.assign({
          error: (_: any, event: any) => event.value,
        }),
      },
    },
    states: {
      preparing: {
        invoke: {
          id: 'preparing',
          src: async (ctx) => {
            await ctx.bundler.prepare();
            return ctx.bundler.watch();
          },
          onDone: {
            target: 'idle',
            actions: assign({
              result: (_, event: any) => event.data,
              error: () => null,
            }) as any,
          },
          onError: {
            target: 'unhandled',
            actions: assign({
              result: () => null,
              error: (_, event: any) => event.data,
            }) as any,
          },
        },
      },
      idle: {
        on: { rebuild: 'rebuilding' },
      },
      rebuilding: {
        on: {
          rebuildError: {
            target: 'error',
            actions: watchModel.assign({
              result: () => null,
              error: (_: any, event: any) => event.value,
            }),
          },
          rebuildSuccess: {
            target: 'idle',
            actions: watchModel.assign({
              result: (_, event) => event.value,
              error: () => null,
            }),
          },
        },
      },
      error: {
        on: { rebuild: 'rebuilding' },
      },
      unhandled: {
        on: { restart: 'preparing' },
      },
    },
  });
}

export type WatchState = StateFrom<ReturnType<typeof watchModel.createMachine>>;
export type WatchContext = ContextFrom<typeof watchModel>;
export type WatchEvents = EventFrom<typeof watchModel>;
