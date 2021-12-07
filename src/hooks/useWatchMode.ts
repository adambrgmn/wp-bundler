import { useEffect } from 'react';
import { createModel } from 'xstate/lib/model.js';
import { useMachine } from '@xstate/react';
import { BuildResult, Metafile } from 'esbuild';
import { Bundler } from '../bundler';
import { useInput } from 'ink';
import { assign, ContextFrom, EventFrom, StateFrom } from 'xstate';
import { Server } from '../server';

export function useWatchMode({ bundler, server }: { bundler: Bundler; server: Server }) {
  const [state, send] = useMachine(() => createWatchMachine({ bundler, server }));

  useInput(
    (key) => {
      if (key.toLowerCase() === 'r') send(watchModel.events.restart());
    },
    { isActive: state.matches('unhandled') },
  );

  useEffect(() => {
    const handleRejection: NodeJS.UnhandledRejectionListener = (error) => {
      if (typeof error === 'object' && error != null && 'errors' in error) return;
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
    server: null as unknown as Server,
    error: null as null | unknown,
    result: null as null | (BuildResult & { metafile: Metafile }),
    rejection: null as null | unknown,
    files: null as null | string[],
  },
  {
    events: {
      error: (error: unknown) => ({ value: error }),
      prepared: () => ({}),
      rebuild: (files: string[]) => ({ value: files }),
      rebuildError: (error: unknown) => ({ value: error }),
      rebuildSuccess: (value: BuildResult & { metafile: Metafile }) => ({
        value,
      }),
      unhandled: (error: unknown) => ({ value: error }),
      restart: () => ({}),
    },
  },
);

function createWatchMachine(ctx: Pick<WatchContext, 'bundler' | 'server'>) {
  return watchModel.createMachine(
    {
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
            src: 'setup',
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
          on: {
            rebuild: {
              target: 'rebuilding',
              actions: watchModel.assign({ files: (_, evt) => evt.value }),
            },
          },
        },
        rebuilding: {
          on: {
            rebuildError: {
              target: 'error',
              actions: watchModel.assign({
                result: () => null,
                error: (_: any, event: any) => event.value,
                files: () => null,
              }),
            },
            rebuildSuccess: {
              target: 'idle',
              actions: watchModel.assign({
                result: (_, event) => event.value,
                error: () => null,
                files: () => null,
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
    },
    {
      services: {
        setup: (ctx) => async (send) => {
          await ctx.bundler.prepare();
          await ctx.server.prepare();
          ctx.server.listen();

          async function onFileChange({ files }: { files: string[] }) {
            try {
              send(watchModel.events.rebuild(files));
              let result = await ctx.bundler.build();
              ctx.server.broadcast({ type: 'reload', files });
              send(watchModel.events.rebuildSuccess(result));
            } catch (error) {
              send(watchModel.events.rebuildError(error));
            }
          }

          ctx.server.on('watcher.change', onFileChange);
          return ctx.bundler.build();
        },
      },
    },
  );
}

export type WatchState = StateFrom<ReturnType<typeof watchModel.createMachine>>;
export type WatchContext = ContextFrom<typeof watchModel>;
export type WatchEvents = EventFrom<typeof watchModel>;
