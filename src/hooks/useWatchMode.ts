import { createModel } from 'xstate/lib/model.js';
import { useMachine } from '@xstate/react';
import { BuildFailure, BuildResult, Metafile } from 'esbuild';
import { Bundler } from '../bundler';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInput } from 'ink';
import { ContextFrom, EventFrom, StateFrom } from 'xstate';

export function useWatchMode(bundler: Bundler) {
  const [state, send] = useMachine(createWatchMachine);
  const stopRef = useRef(() => {});

  const start = useCallback(async () => {
    try {
      stopRef.current = await bundler.watch();
    } catch (error) {
      send(watchModel.events.unhandledRejection(error));
    }
  }, [bundler, send]);

  const stop = useCallback(() => {
    stopRef.current();
  }, []);

  useInput(
    (key) => {
      if (key.toLowerCase() === 'r') start();
    },
    { isActive: state.matches('unhandled') },
  );

  useEffect(() => {
    let onInit = () => {
      send(watchModel.events.prepared());
      start();
    };
    bundler.on('init', onInit);

    let onRebuildStart = () => send(watchModel.events.rebuild());
    bundler.on('rebuild-start', onRebuildStart);

    let onRebuildEnd = (result: BuildResult & { metafile: Metafile }) => {
      return send(watchModel.events.rebuildSuccess(result));
    };
    bundler.on('rebuild-end', onRebuildEnd);

    let onRebuildError = (error: BuildFailure | BuildResult) => {
      send(watchModel.events.rebuildError(error as BuildFailure));
    };
    bundler.on('rebuild-error', onRebuildError);

    return () => {
      bundler.off('init', onInit);
      bundler.off('rebuild-start', onRebuildStart);
      bundler.off('rebuild-end', onRebuildEnd);
      bundler.off('rebuild-error', onRebuildError);
    };
  }, [bundler, send, start]);

  useEffect(() => {
    const handleRejection: NodeJS.UnhandledRejectionListener = (error) => {
      if (error != null && 'errors' in error) return;
      send(watchModel.events.unhandledRejection(error));
    };

    process.on('unhandledRejection', handleRejection);
    return () => {
      process.off('unhandledRejection', handleRejection);
    };
  }, [send]);

  const events: typeof watchModel.events = useMemo(() => {
    let event: any = {};
    let keys = Object.keys(
      watchModel.events,
    ) as (keyof typeof watchModel.events)[];
    for (let key of keys) {
      event[key] = (...args: any[]) => send(watchModel.events[key](...args));
    }

    return event;
  }, [send]);

  return [state, events, start, stop] as const;
}

const watchModel = createModel(
  {
    cancel: null as null | (() => void),
    error: null as null | BuildFailure | Error,
    result: null as null | (BuildResult & { metafile: Metafile }),
    rejection: null as any,
  },
  {
    events: {
      initError: (error: Error) => ({ value: error }),
      prepared: () => ({ value: undefined }),
      rebuild: () => ({ value: undefined }),
      rebuildError: (error: BuildFailure) => ({ value: error }),
      rebuildSuccess: (value: BuildResult & { metafile: Metafile }) => ({
        value,
      }),
      unhandledRejection: (error: any) => ({ value: error }),
    },
  },
);

function createWatchMachine() {
  return watchModel.createMachine({
    context: watchModel.initialContext,
    initial: 'preparing',
    on: {
      initError: {
        target: 'error',
        actions: watchModel.assign({ error: (_, event) => event.value }),
      },
      unhandledRejection: 'unhandled',
    },
    states: {
      preparing: {
        on: {
          prepared: 'rebuilding',
        },
      },
      idle: {
        on: {
          rebuild: 'rebuilding',
        },
      },
      rebuilding: {
        on: {
          rebuildError: {
            target: 'error',
            actions: watchModel.assign({ error: (_, event) => event.value }),
          },
          rebuildSuccess: {
            target: 'idle',
            actions: watchModel.assign({ result: (_, event) => event.value }),
          },
        },
      },
      error: {
        on: {
          rebuild: 'rebuilding',
        },
      },
      unhandled: {
        on: {
          rebuild: 'rebuilding',
        },
      },
    },
  });
}

export type WatchState = StateFrom<ReturnType<typeof watchModel.createMachine>>;
export type WatchContext = ContextFrom<typeof watchModel>;
export type WatchEvents = EventFrom<typeof watchModel>;
